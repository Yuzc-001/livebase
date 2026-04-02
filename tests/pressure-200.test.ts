import { afterAll, beforeEach, expect, test } from "bun:test"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { resolve } from "path"
import { extractPromptAsset, loadPresetRegistry, renderPresetText } from "../src/presets/assets.ts"

const TEST_STORE = resolve(process.cwd(), "store-pressure-200")
const REGISTRY_PATH = resolve(process.cwd(), "presets", "adapter-presets", "registry.json")

process.env.LIVEBASE_STORE = TEST_STORE

const {
  DIRS,
  ensureStore,
  list,
  load,
  loadAll,
  makeId,
  now,
  remove,
  save,
} = await import("../src/core/store.ts")
const { createProject, requireProject, updateProject } = await import("../src/core/project.ts")
const { ingestSource } = await import("../src/core/source.ts")
const {
  buildContinuationPack,
  checkpointTask,
  createEvidenceGap,
  createTask,
  requireTask,
  resolveEvidenceGap,
} = await import("../src/core/task.ts")
const { createExecutionContract } = await import("../src/core/contract.ts")
const { ResidueSchema, SourceSchema } = await import("../src/core/schemas.ts")
const { applyVerificationLedger } = await import("../src/core/writeback.ts")

type StressCase = {
  id: string
  family: string
  title: string
  run: () => Promise<void> | void
}

const allCases: StressCase[] = []
let caseNumber = 1

function addCase(family: string, title: string, run: () => Promise<void> | void) {
  allCases.push({
    id: `LB-STRESS-${String(caseNumber).padStart(3, "0")}`,
    family,
    title,
    run,
  })
  caseNumber += 1
}

function resetStore() {
  if (existsSync(TEST_STORE)) {
    rmSync(TEST_STORE, { recursive: true, force: true })
  }
  ensureStore()
}

function writeSourceFile(name: string, content = "# Source\n\nGrounded source content.") {
  mkdirSync(TEST_STORE, { recursive: true })
  const filePath = resolve(TEST_STORE, name)
  writeFileSync(filePath, content, "utf-8")
  return filePath
}

function seedProjectKnowledge(projectId: string, residueCount: number) {
  const sourceId = makeId("src", `seed-${projectId}`)
  const source = SourceSchema.parse({
    id: sourceId,
    type: "source",
    title: "Seed Source",
    content: "Grounded source content",
    sourceType: "file",
    sourcePath: resolve(TEST_STORE, `${sourceId}.md`),
    projectRef: projectId,
    tags: ["seed"],
    capturedAt: now(),
    updatedAt: now(),
  })
  save(DIRS.sources, sourceId, source)

  const residueIds: string[] = []
  for (let index = 0; index < residueCount; index += 1) {
    const residueId = makeId("res", `seed-${projectId}-${index + 1}`)
    const residue = ResidueSchema.parse({
      id: residueId,
      type: "residue",
      residueType: "lesson",
      title: `Seed residue ${index + 1}`,
      body: `Residue body ${index + 1}`,
      importance: "medium",
      sourceRefs: [sourceId],
      projectRef: projectId,
      createdAt: now(),
    })
    save(DIRS.residue, residueId, residue)
    residueIds.push(residueId)
  }

  const project = requireProject(projectId)
  project.sourceRefs = [...new Set([...project.sourceRefs, sourceId])]
  project.residueRefs = [...new Set([...project.residueRefs, ...residueIds])]
  save(DIRS.projects, projectId, project)

  return { sourceId, residueIds }
}

function getStructuredContent<T>(result: { structuredContent?: T; content?: Array<{ type: string; text?: string }> }): T {
  if (result.structuredContent) {
    return result.structuredContent
  }

  const text = result.content?.find(item => item.type === "text" && typeof item.text === "string")?.text
  if (!text) {
    throw new Error("missing_tool_result")
  }

  return JSON.parse(text) as T
}

async function connectMcpClient() {
  const client = new Client({ name: "livebase-pressure-test", version: "0.1.0" })
  const transport = new StdioClientTransport({
    command: "bun",
    args: ["src/mcp/server.ts"],
    cwd: process.cwd(),
    env: { ...process.env, LIVEBASE_STORE: TEST_STORE },
    stderr: "pipe",
  })

  await client.connect(transport)
  return { client, transport }
}

const bools = [false, true] as const
const checkpointReasons = ["pause", "blocked", "handoff", "completed", "manual"] as const
const updateModes = ["none", "state", "next", "both"] as const
const resumePatterns = [
  "no-gaps-fallback",
  "single-open-suggested",
  "single-open-no-suggested",
  "latest-open-wins",
  "latest-resolved-fallback-older-open",
  "all-resolved-fallback-next",
] as const
const runStatuses = ["completed", "partial", "blocked", "failed"] as const
const presetIds = ["codex", "claude-code", "openai-responses-host", "orchestrator"] as const
const resolveLayouts = ["single-gap", "two-gaps-target-latest", "two-gaps-target-oldest"] as const

for (const projectLinked of bools) {
  for (const withBlocker of bools) {
    for (const withGap of bools) {
      for (const withCurrentState of bools) {
        for (const withNextAction of bools) {
          addCase(
            "task-create",
            `create task project=${projectLinked} blocker=${withBlocker} gap=${withGap} state=${withCurrentState} next=${withNextAction}`,
            () => {
              const projectId = projectLinked ? createProject("Task Create Project").id : undefined
              const evidenceGaps = withGap
                ? [createEvidenceGap({ question: "Need stronger evidence?", suggestedAction: "Inspect the source" })]
                : []

              const { task } = createTask({
                title: "Task create case",
                goal: "Exercise task creation invariants",
                projectRef: projectId,
                currentState: withCurrentState ? "Current state exists" : undefined,
                nextAction: withNextAction ? "Do the next action" : undefined,
                blocker: withBlocker ? "Missing evidence" : undefined,
                evidenceGaps,
              })

              expect(task.projectRef).toBe(projectId)
              expect(task.status).toBe(withBlocker ? "blocked" : "active")
              expect(task.currentBlocker).toBe(withBlocker ? "Missing evidence" : undefined)
              expect(task.evidenceGaps).toHaveLength(withGap ? 1 : 0)
              expect(task.checkpoints).toHaveLength(
                withCurrentState || withNextAction || withBlocker || withGap ? 1 : 0,
              )
            },
          )
        }
      }
    }
  }
}

for (const seedBlocked of bools) {
  for (const reason of checkpointReasons) {
    for (const addBlocker of bools) {
      for (const addGap of bools) {
        addCase(
          "checkpoint",
          `checkpoint seedBlocked=${seedBlocked} reason=${reason} addBlocker=${addBlocker} addGap=${addGap}`,
          () => {
            const { task } = createTask({
              title: "Checkpoint task",
              goal: "Exercise checkpoint transitions",
              blocker: seedBlocked ? "Seed blocker" : undefined,
            })
            const before = requireTask(task.id)
            const updated = checkpointTask(task.id, {
              reason,
              summary: "Checkpoint summary",
              nextAction: "Checkpoint next action",
              blocker: addBlocker ? "Fresh blocker" : undefined,
              evidenceGaps: addGap
                ? [createEvidenceGap({ question: "Need another proof?", suggestedAction: "Inspect another source" })]
                : [],
            })

            const expectedStatus =
              reason === "completed" ? "completed" : addBlocker ? "blocked" : reason === "pause" ? "paused" : "active"
            const expectedBlocker =
              reason === "completed" ? undefined : addBlocker ? "Fresh blocker" : seedBlocked ? "Seed blocker" : undefined

            expect(updated.status).toBe(expectedStatus)
            expect(updated.currentBlocker).toBe(expectedBlocker)
            expect(updated.evidenceGaps).toHaveLength(before.evidenceGaps.length + (addGap ? 1 : 0))
            expect(updated.checkpoints).toHaveLength(before.checkpoints.length + 1)
            expect(updated.checkpoints.at(-1)?.reason).toBe(reason)
          },
        )
      }
    }
  }
}

for (const seedBlocked of bools) {
  for (const layout of resolveLayouts) {
    for (const updateMode of updateModes) {
      addCase(
        "resolve-gap",
        `resolve gap seedBlocked=${seedBlocked} layout=${layout} updates=${updateMode}`,
        () => {
          const evidenceGaps = [
            createEvidenceGap({ question: "First unresolved question?", suggestedAction: "Inspect first source" }),
          ]
          if (layout !== "single-gap") {
            evidenceGaps.push(
              createEvidenceGap({ question: "Second unresolved question?", suggestedAction: "Inspect second source" }),
            )
          }

          const { task } = createTask({
            title: "Resolve gap task",
            goal: "Exercise evidence gap resolution",
            blocker: seedBlocked ? "Seed blocker" : undefined,
            evidenceGaps,
          })

          const targetGapId =
            layout === "two-gaps-target-oldest" ? task.evidenceGaps[0].id : task.evidenceGaps[task.evidenceGaps.length - 1].id

          const updates =
            updateMode === "none"
              ? {}
              : updateMode === "state"
                ? { currentState: "Resolved current state" }
                : updateMode === "next"
                  ? { nextAction: "Resolved next action" }
                  : { currentState: "Resolved current state", nextAction: "Resolved next action" }

          const updated = resolveEvidenceGap(task.id, targetGapId, updates)
          const openGaps = updated.evidenceGaps.filter(item => item.status === "open")

          expect(updated.evidenceGaps.find(item => item.id === targetGapId)?.status).toBe("resolved")
          expect(updated.currentState).toBe(
            updateMode === "state" || updateMode === "both" ? "Resolved current state" : undefined,
          )
          expect(updated.nextAction).toBe(
            updateMode === "next" || updateMode === "both" ? "Resolved next action" : undefined,
          )

          if (layout === "single-gap") {
            expect(openGaps).toHaveLength(0)
            expect(updated.status).toBe("active")
            expect(updated.currentBlocker).toBeUndefined()
          } else {
            expect(openGaps).toHaveLength(1)
            expect(updated.status).toBe(seedBlocked ? "blocked" : "active")
            expect(updated.currentBlocker).toBe(seedBlocked ? "Seed blocker" : undefined)
          }
        },
      )
    }
  }
}

for (const projectLinked of bools) {
  for (const withResidue of bools) {
    for (const pattern of resumePatterns) {
      addCase(
        "resume",
        `resume project=${projectLinked} residue=${withResidue} pattern=${pattern}`,
        () => {
          const projectId = projectLinked ? createProject("Resume Project").id : undefined
          if (projectId) {
            seedProjectKnowledge(projectId, withResidue ? 2 : 0)
          }

          const baseTask = createTask({
            title: "Resume task",
            goal: "Exercise continuation pack selection",
            projectRef: projectId,
            nextAction: "Task fallback next action",
            evidenceGaps:
              pattern === "single-open-suggested"
                ? [createEvidenceGap({ question: "Need one answer?", suggestedAction: "Inspect the suggested source" })]
                : pattern === "single-open-no-suggested"
                  ? [createEvidenceGap({ question: "Need one answer without suggestion?" })]
                  : pattern === "latest-open-wins" ||
                      pattern === "latest-resolved-fallback-older-open" ||
                      pattern === "all-resolved-fallback-next"
                    ? [
                        createEvidenceGap({ question: "Older unresolved question?", suggestedAction: "Inspect older evidence" }),
                        createEvidenceGap({ question: "Latest unresolved question?", suggestedAction: "Inspect latest evidence" }),
                      ]
                    : [],
          }).task

          if (pattern === "latest-resolved-fallback-older-open") {
            resolveEvidenceGap(baseTask.id, baseTask.evidenceGaps[1].id)
          }
          if (pattern === "all-resolved-fallback-next") {
            resolveEvidenceGap(baseTask.id, baseTask.evidenceGaps[1].id)
            resolveEvidenceGap(baseTask.id, baseTask.evidenceGaps[0].id, { nextAction: "Task fallback next action" })
          }

          const continuation = buildContinuationPack(baseTask.id)

          expect(continuation.supportingSources).toHaveLength(projectLinked ? 1 : 0)
          expect(continuation.recentResidue).toHaveLength(projectLinked && withResidue ? 2 : 0)

          if (pattern === "no-gaps-fallback") {
            expect(continuation.primaryEvidenceGap).toBeNull()
            expect(continuation.nextAction).toBe("Task fallback next action")
            expect(continuation.openEvidenceGapCount).toBe(0)
          }
          if (pattern === "single-open-suggested") {
            expect(continuation.primaryEvidenceGap?.question).toContain("Need one answer")
            expect(continuation.nextAction).toBe("Inspect the suggested source")
            expect(continuation.openEvidenceGapCount).toBe(1)
          }
          if (pattern === "single-open-no-suggested") {
            expect(continuation.primaryEvidenceGap?.question).toContain("Need one answer without suggestion")
            expect(continuation.nextAction).toBe("Resolve evidence gap: Need one answer without suggestion?")
            expect(continuation.openEvidenceGapCount).toBe(1)
          }
          if (pattern === "latest-open-wins") {
            expect(continuation.primaryEvidenceGap?.question).toContain("Latest unresolved question")
            expect(continuation.nextAction).toBe("Inspect latest evidence")
            expect(continuation.openEvidenceGapCount).toBe(2)
          }
          if (pattern === "latest-resolved-fallback-older-open") {
            expect(continuation.primaryEvidenceGap?.question).toContain("Older unresolved question")
            expect(continuation.nextAction).toBe("Inspect older evidence")
            expect(continuation.openEvidenceGapCount).toBe(1)
          }
          if (pattern === "all-resolved-fallback-next") {
            expect(continuation.primaryEvidenceGap).toBeNull()
            expect(continuation.nextAction).toBe("Task fallback next action")
            expect(continuation.openEvidenceGapCount).toBe(0)
          }
        },
      )
    }
  }
}

for (const runStatus of runStatuses) {
  for (const includeResidue of bools) {
    for (const includeMissingEvidence of bools) {
      for (const closeGap of bools) {
        addCase(
          "writeback",
          `writeback runStatus=${runStatus} residue=${includeResidue} missingEvidence=${includeMissingEvidence} closeGap=${closeGap}`,
          () => {
            const projectId = createProject("Writeback Project").id
            const { sourceId } = seedProjectKnowledge(projectId, 0)
            const task = createTask({
              title: "Writeback task",
              goal: "Exercise verification ledger flow",
              projectRef: projectId,
              blocker: "Seed blocker",
              evidenceGaps: [createEvidenceGap({ question: "Need a proof?", suggestedAction: "Inspect the source" })],
            }).task

            const result = applyVerificationLedger({
              run: {
                taskRef: task.id,
                status: runStatus,
                outcome: `${runStatus} outcome`,
                completedAt: new Date().toISOString(),
                executor: "pressure-suite",
              },
              checks: [
                {
                  name: "source check",
                  method: "read source",
                  observed: "Observed grounded evidence",
                  sourceRefs: [sourceId],
                  contrarySignals: [],
                  confidence: "high",
                },
              ],
              ambiguity: {
                openQuestions: includeMissingEvidence ? ["One question remains open."] : [],
                missingEvidence: includeMissingEvidence
                  ? [{ question: "What remains missing?", suggestedAction: "Inspect the missing branch" }]
                  : [],
                confidenceNote: "Pressure suite verification",
              },
              residue: includeResidue
                ? {
                    residueType: "decision-note",
                    title: "Verified residue",
                    body: "Residue written after verification.",
                    importance: "high",
                    sourceRefs: [sourceId],
                    projectRef: projectId,
                  }
                : undefined,
              updates: {
                projectRef: projectId,
                currentState: `${runStatus} state`,
                nextAction: `${runStatus} next`,
                closeEvidenceGapIds: closeGap ? [task.evidenceGaps[0].id] : [],
                projectState: `${runStatus} project state`,
                projectNextStep: `${runStatus} project next`,
              },
            })

            const updatedTask = requireTask(task.id)
            const updatedProject = requireProject(projectId)
            const continuation = buildContinuationPack(task.id)
            const expectedStatus =
              runStatus === "completed"
                ? includeMissingEvidence
                  ? "active"
                  : "completed"
                : runStatus === "partial"
                  ? "active"
                  : runStatus

            expect(result.status).toBe("ok")
            expect(updatedTask.status).toBe(expectedStatus)
            expect(updatedTask.currentState).toBe(`${runStatus} state`)
            expect(updatedTask.nextAction).toBe(`${runStatus} next`)
            expect(updatedTask.currentBlocker).toBe(runStatus === "blocked" ? `${runStatus} outcome` : undefined)
            expect(updatedProject.currentState).toBe(`${runStatus} project state`)
            expect(updatedProject.nextStep).toBe(`${runStatus} project next`)
            expect(continuation.openEvidenceGapCount).toBe((closeGap ? 0 : 1) + (includeMissingEvidence ? 1 : 0))

            if (includeResidue) {
              expect(result.residueId).toMatch(/^res-/)
              expect(updatedTask.residueRefs).toContain(result.residueId as string)
              expect(updatedProject.residueRefs).toContain(result.residueId as string)
            } else {
              expect(result.residueId).toBeNull()
            }

            if (runStatus === "blocked") {
              expect(continuation.currentBlocker).toBe("blocked outcome")
            } else {
              expect(continuation.currentBlocker).toBeNull()
            }

            if (includeMissingEvidence) {
              expect(continuation.primaryEvidenceGap?.question).toBe("What remains missing?")
            } else if (closeGap) {
              expect(continuation.primaryEvidenceGap).toBeNull()
            } else {
              expect(continuation.primaryEvidenceGap?.question).toBe("Need a proof?")
            }
          },
        )
      }
    }
  }
}

for (const withProjectStandards of bools) {
  for (const customAdapter of bools) {
    for (const customChecks of bools) {
      for (const customBoundaries of bools) {
        addCase(
          "contract",
          `contract projectStandards=${withProjectStandards} customAdapter=${customAdapter} customChecks=${customChecks} customBoundaries=${customBoundaries}`,
          () => {
            const projectId = withProjectStandards ? createProject("Contract Project").id : undefined
            if (projectId) {
              const project = requireProject(projectId)
              project.standards.hardRequirements = ["Keep grounded evidence."]
              project.standards.redFlags = ["Hand-wavy summary"]
              project.standards.actionBoundaries = ["Stop if the source is missing."]
              save(DIRS.projects, projectId, project)
              seedProjectKnowledge(projectId, 1)
            }

            const task = createTask({
              title: "Contract task",
              goal: "Exercise contract generation",
              projectRef: projectId,
              nextAction: "Review the evidence gap",
              evidenceGaps: [createEvidenceGap({ question: "Need one more answer?", suggestedAction: "Inspect the source" })],
            }).task

            const { contract } = createExecutionContract({
              taskId: task.id,
              adapter: customAdapter ? "codex" : undefined,
              allowedActions: customBoundaries ? ["read source"] : undefined,
              disallowedActions: customBoundaries ? ["invent evidence"] : undefined,
              requiredChecks: customChecks ? ["Confirm the grounded evidence."] : undefined,
            })

            expect(contract.adapter.name).toBe(customAdapter ? "codex" : "local-human-agent")
            expect(contract.continuation.primaryEvidenceGap?.question).toBe("Need one more answer?")
            expect(contract.continuation.nextAction).toBe("Inspect the source")
            expect(contract.success.requiredChecks).toEqual(
              customChecks
                ? ["Confirm the grounded evidence."]
                : [
                    "Record at least one concrete verification check.",
                    "Separate observed evidence from remaining ambiguity.",
                  ],
            )
            expect(contract.boundaries.allowedActions).toEqual(customBoundaries ? ["read source"] : [])
            expect(contract.boundaries.disallowedActions).toEqual(customBoundaries ? ["invent evidence"] : [])
            expect(contract.knowledge.sourceRefs).toHaveLength(withProjectStandards ? 1 : 0)
            expect(contract.knowledge.residueRefs).toHaveLength(withProjectStandards ? 1 : 0)
            expect(contract.success.evidenceExpectations).toEqual(
              withProjectStandards ? ["Keep grounded evidence.", "Watch for red flag: Hand-wavy summary"] : [],
            )
            expect(contract.boundaries.stopConditions).toContain("Do not claim completion without evidence-backed checks.")
            if (withProjectStandards) {
              expect(contract.boundaries.stopConditions).toContain("Stop if the source is missing.")
            }
          },
        )
      }
    }
  }
}

for (const projectLinked of bools) {
  for (const explicitTitle of bools) {
    for (const withTags of bools) {
      for (const updateAfterIngest of bools) {
        addCase(
          "source-project",
          `source ingest project=${projectLinked} explicitTitle=${explicitTitle} tags=${withTags} updateProject=${updateAfterIngest}`,
          () => {
            const projectId = projectLinked ? createProject("Source Project").id : undefined
            const filePath = writeSourceFile(
              `source-${projectLinked}-${explicitTitle}-${withTags}-${updateAfterIngest}.md`,
              "# Captured source\n\nGrounded source content.",
            )

            const { id, source } = ingestSource({
              filePath,
              projectRef: projectId,
              title: explicitTitle ? "Explicit Source Title" : undefined,
              tags: withTags ? ["one", "two"] : [],
            })

            expect(source.id).toBe(id)
            expect(source.projectRef).toBe(projectId)
            expect(source.title).toBe(explicitTitle ? "Explicit Source Title" : filePath.split(/[\\/]/).pop())
            expect(source.tags).toEqual(withTags ? ["one", "two"] : [])

            if (projectId) {
              const project = requireProject(projectId)
              expect(project.sourceRefs).toContain(id)
              if (updateAfterIngest) {
                const updated = updateProject(projectId, {
                  currentState: "Updated project state",
                  nextStep: "Updated project next step",
                })
                expect(updated.currentState).toBe("Updated project state")
                expect(updated.nextStep).toBe("Updated project next step")
              }
            } else {
              expect(load(DIRS.projects, "proj-missing")).toBeNull()
            }
          },
        )
      }
    }
  }
}

addCase("store", "store ensureStore creates the directory layout", () => {
  const directories = Object.values(DIRS)
  for (const dir of directories) {
    expect(existsSync(dir)).toBe(true)
  }
})

addCase("store", "store save and load round-trip stays intact", () => {
  const payload = { id: "alpha", value: 1 }
  save(DIRS.notes, "alpha", payload)
  expect(load(DIRS.notes, "alpha")).toEqual(payload)
})

addCase("store", "store load missing object returns null", () => {
  expect(load(DIRS.tasks, "missing-task")).toBeNull()
})

addCase("store", "store list returns sorted ids", () => {
  save(DIRS.notes, "b-item", { id: "b-item" })
  save(DIRS.notes, "a-item", { id: "a-item" })
  expect(list(DIRS.notes)).toEqual(["a-item", "b-item"])
})

addCase("store", "store loadAll skips corrupt json without crashing", () => {
  save(DIRS.notes, "good", { id: "good", ok: true })
  writeFileSync(resolve(DIRS.notes, "broken.json"), "{ not-valid-json", "utf-8")
  expect(loadAll(DIRS.notes)).toEqual([{ id: "good", ok: true }])
})

addCase("store", "store remove existing object returns true", () => {
  save(DIRS.notes, "remove-me", { id: "remove-me" })
  expect(remove(DIRS.notes, "remove-me")).toBe(true)
  expect(load(DIRS.notes, "remove-me")).toBeNull()
})

addCase("store", "writeback rejects a missing evidence gap id instead of silently succeeding", () => {
  const projectId = createProject("Missing Gap Project").id
  const task = createTask({
    title: "Missing gap writeback task",
    goal: "Exercise missing gap rejection",
    projectRef: projectId,
    evidenceGaps: [createEvidenceGap({ question: "Need one answer?", suggestedAction: "Inspect the source" })],
  }).task

  expect(() =>
    applyVerificationLedger({
      run: {
        taskRef: task.id,
        status: "partial",
        outcome: "Could not close the missing gap.",
        completedAt: new Date().toISOString(),
      },
      checks: [
        {
          name: "gap check",
          method: "read source",
          observed: "The referenced gap id does not exist.",
          sourceRefs: [],
          contrarySignals: [],
          confidence: "high",
        },
      ],
      ambiguity: {
        openQuestions: [],
        missingEvidence: [],
      },
      updates: {
        closeEvidenceGapIds: ["gap-missing"],
      },
    }),
  ).toThrow("evidence_gap_not_found:gap-missing")
})

addCase("store", "source ingest with missing project does not leave an orphan source", () => {
  const filePath = writeSourceFile("orphan-check.md")
  expect(() => ingestSource({ filePath, projectRef: "proj-missing" })).toThrow("project_not_found:proj-missing")
  expect(list(DIRS.sources)).toHaveLength(0)
})

addCase("mcp-error", "mcp missing task returns structured task_not_found", async () => {
  const { client, transport } = await connectMcpClient()
  const result = await client.callTool({
    name: "livebase.task.get",
    arguments: {
      taskId: "tsk-missing",
    },
  })
  const structured = getStructuredContent<{ error: { code: string; target?: { type: string; id?: string } } }>(result as any)
  expect((result as any).isError).toBe(true)
  expect(structured.error.code).toBe("task_not_found")
  expect(structured.error.target?.type).toBe("task")
  expect(structured.error.target?.id).toBe("tsk-missing")
  await transport.close()
})

addCase("mcp-error", "mcp missing project returns structured project_not_found", async () => {
  const { client, transport } = await connectMcpClient()
  const result = await client.callTool({
    name: "livebase.project.get",
    arguments: {
      projectId: "proj-missing",
    },
  })
  const structured = getStructuredContent<{ error: { code: string; target?: { type: string; id?: string } } }>(result as any)
  expect((result as any).isError).toBe(true)
  expect(structured.error.code).toBe("project_not_found")
  expect(structured.error.target?.type).toBe("project")
  expect(structured.error.target?.id).toBe("proj-missing")
  await transport.close()
})

addCase("mcp-error", "mcp missing evidence gap returns structured evidence_gap_not_found", async () => {
  const { client, transport } = await connectMcpClient()
  const projectResult = await client.callTool({
    name: "livebase.project.create",
    arguments: { name: "MCP Error Project" },
  })
  const project = getStructuredContent<{ id: string }>(projectResult as any)
  const taskResult = await client.callTool({
    name: "livebase.task.create",
    arguments: {
      title: "MCP Error Task",
      goal: "Exercise gap lookup error",
      projectRef: project.id,
    },
  })
  const task = getStructuredContent<{ id: string }>(taskResult as any)
  const result = await client.callTool({
    name: "livebase.task.resolve_gap",
    arguments: {
      taskId: task.id,
      gapId: "gap-missing",
    },
  })
  const structured = getStructuredContent<{ error: { code: string; target?: { type: string; id?: string } } }>(result as any)
  expect((result as any).isError).toBe(true)
  expect(structured.error.code).toBe("evidence_gap_not_found")
  expect(structured.error.target?.type).toBe("evidence_gap")
  expect(structured.error.target?.id).toBe("gap-missing")
  await transport.close()
})

addCase("mcp-error", "mcp invalid evidence gap returns structured invalid_evidence_gap", async () => {
  const { client, transport } = await connectMcpClient()
  const projectResult = await client.callTool({
    name: "livebase.project.create",
    arguments: { name: "MCP Invalid Gap Project" },
  })
  const project = getStructuredContent<{ id: string }>(projectResult as any)
  const result = await client.callTool({
    name: "livebase.task.create",
    arguments: {
      title: "MCP Invalid Gap Task",
      goal: "Exercise invalid gap flow",
      projectRef: project.id,
      evidenceGaps: [{ question: "", suggestedAction: "Inspect the source" }],
    },
  })
  const structured = getStructuredContent<{ error: { code: string; target?: { type: string } } }>(result as any)
  expect((result as any).isError).toBe(true)
  expect(structured.error.code).toBe("invalid_evidence_gap")
  expect(structured.error.target?.type).toBe("input")
  await transport.close()
})

for (const presetId of presetIds) {
  addCase("preset", `preset ${presetId} stays machine-loadable and compiled`, () => {
    const registry = loadPresetRegistry(REGISTRY_PATH)
    const preset = registry.presets.find(item => item.id === presetId)
    expect(preset).toBeDefined()
    const sourcePath = resolve(process.cwd(), preset!.source)
    const distTextPath = resolve(process.cwd(), preset!.dist.text)
    const asset = extractPromptAsset(sourcePath)
    const compiled = readFileSync(distTextPath, "utf-8")

    expect(asset.frontmatter.id).toBe(presetId)
    expect(asset.frontmatter.host).toBe(preset!.host)
    expect(asset.frontmatter.adapter).toBe(preset!.adapter)
    expect(asset.frontmatter.version).toBe(registry.version)
    expect(compiled).toBe(renderPresetText(asset))
  })
}

if (allCases.length !== 200) {
  throw new Error(`expected_200_cases:${allCases.length}`)
}

beforeEach(() => {
  resetStore()
})

afterAll(() => {
  if (existsSync(TEST_STORE)) {
    rmSync(TEST_STORE, { recursive: true, force: true })
  }
})

for (const pressureCase of allCases) {
  test(`${pressureCase.id} ${pressureCase.family} ${pressureCase.title}`, async () => {
    await pressureCase.run()
  })
}
