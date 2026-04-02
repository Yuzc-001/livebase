import { afterAll, beforeAll, expect, test } from "bun:test"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { existsSync, rmSync, writeFileSync } from "fs"
import { resolve } from "path"

const TEST_STORE = resolve(process.cwd(), "store-mcp-test")
process.env.LIVEBASE_STORE = TEST_STORE

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
  const client = new Client({ name: "livebase-mcp-test", version: "0.1.0" })
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

beforeAll(() => {
  if (existsSync(TEST_STORE)) rmSync(TEST_STORE, { recursive: true, force: true })
})

afterAll(() => {
  if (existsSync(TEST_STORE)) rmSync(TEST_STORE, { recursive: true, force: true })
})

test("mcp server exposes the continuity loop over stdio", async () => {
  const { client, transport } = await connectMcpClient()

  const tools = await client.listTools()
  const toolNames = tools.tools.map(tool => tool.name)
  expect(toolNames).toContain("livebase.system.doctor")
  expect(toolNames).toContain("livebase.project.create")
  expect(toolNames).toContain("livebase.project.list")
  expect(toolNames).toContain("livebase.project.get")
  expect(toolNames).toContain("livebase.project.update")
  expect(toolNames).toContain("livebase.preset.list")
  expect(toolNames).toContain("livebase.preset.loader_plan")
  expect(toolNames).toContain("livebase.source.ingest")
  expect(toolNames).toContain("livebase.task.create")
  expect(toolNames).toContain("livebase.task.list")
  expect(toolNames).toContain("livebase.task.get")
  expect(toolNames).toContain("livebase.task.checkpoint")
  expect(toolNames).toContain("livebase.task.resolve_gap")
  expect(toolNames).toContain("livebase.task.resume")
  expect(toolNames).toContain("livebase.task.contract")
  expect(toolNames).toContain("livebase.task.writeback")
  expect(toolNames).not.toContain("livebase_doctor")
  expect(toolNames).not.toContain("livebase_resume_task")

  const doctorResult = await client.callTool({ name: "livebase.system.doctor" })
  const doctor = getStructuredContent<{ status: string; counts: { projects: number } }>(doctorResult as any)
  expect(doctor.status).toBe("ok")
  expect(doctor.counts.projects).toBe(0)

  const projectResult = await client.callTool({
    name: "livebase.project.create",
    arguments: {
      name: "MCP Hiring Loop",
      description: "Smoke test the MCP surface",
    },
  })
  const project = getStructuredContent<{ id: string; project: { id: string; name: string } }>(projectResult as any)
  expect(project.id).toMatch(/^proj-/)
  expect(project.project.name).toBe("MCP Hiring Loop")

  const projectListResult = await client.callTool({ name: "livebase.project.list" })
  const projectList = getStructuredContent<{ count: number; projects: Array<{ id: string }> }>(projectListResult as any)
  expect(projectList.count).toBeGreaterThan(0)
  expect(projectList.projects.some(item => item.id === project.id)).toBe(true)

  const projectGetResult = await client.callTool({
    name: "livebase.project.get",
    arguments: {
      projectId: project.id,
    },
  })
  const projectGet = getStructuredContent<{ id: string; name: string; description?: string }>(projectGetResult as any)
  expect(projectGet.id).toBe(project.id)
  expect(projectGet.description).toBe("Smoke test the MCP surface")

  const projectUpdateResult = await client.callTool({
    name: "livebase.project.update",
    arguments: {
      projectId: project.id,
      currentState: "Hiring loop active",
      nextStep: "Review grounded evidence",
    },
  })
  const updatedProject = getStructuredContent<{ id: string; currentState?: string; nextStep?: string }>(
    projectUpdateResult as any,
  )
  expect(updatedProject.id).toBe(project.id)
  expect(updatedProject.currentState).toBe("Hiring loop active")
  expect(updatedProject.nextStep).toBe("Review grounded evidence")

  const sourceFile = resolve(TEST_STORE, "mcp-source.md")
  writeFileSync(sourceFile, "# Source\n\nObserved source evidence for the MCP smoke test.")

  const sourceResult = await client.callTool({
    name: "livebase.source.ingest",
    arguments: {
      filePath: sourceFile,
      projectRef: project.id,
      title: "MCP Source",
      tags: ["smoke", "mcp"],
    },
  })
  const source = getStructuredContent<{ id: string; source: { id: string; title: string } }>(sourceResult as any)
  expect(source.id).toMatch(/^src-/)
  expect(source.source.title).toBe("MCP Source")

  const taskResult = await client.callTool({
    name: "livebase.task.create",
    arguments: {
      title: "Resume candidate review",
      goal: "Continue from the right evidence gap",
      projectRef: project.id,
      currentState: "Initial pass complete",
      nextAction: "Inspect the source for direct ownership evidence",
      evidenceGaps: [
        {
          question: "Did the candidate own the production migration?",
          suggestedAction: "Inspect the source for migration ownership",
        },
      ],
    },
  })
  const task = getStructuredContent<{ id: string; task: { id: string; evidenceGaps: Array<{ id: string }> } }>(taskResult as any)
  expect(task.id).toMatch(/^tsk-/)
  expect(task.task.evidenceGaps).toHaveLength(1)
  const initialGapId = task.task.evidenceGaps[0].id

  const presetListResult = await client.callTool({
    name: "livebase.preset.list",
  })
  const presetList = getStructuredContent<{
    count: number
    presets: Array<{ id: string; host: string; adapter: string }>
  }>(presetListResult as any)
  expect(presetList.count).toBe(4)
  expect(presetList.presets).toEqual([
    { id: "codex", host: "codex", adapter: "codex" },
    { id: "claude-code", host: "claude-code", adapter: "claude-code" },
    { id: "openai-responses-host", host: "openai-responses-host", adapter: "openai-responses-host" },
    { id: "orchestrator", host: "orchestrator", adapter: "orchestrator" },
  ])

  const presetPlanResult = await client.callTool({
    name: "livebase.preset.loader_plan",
    arguments: {
      presetId: "codex",
      taskId: task.id,
    },
  })
  const presetPlan = getStructuredContent<{
    preset: { id: string; host: string }
    loader: { resume: { includeRegister: boolean } }
    plan: {
      resumeCall: { tool: string; arguments: { taskId: string; includeRegister: boolean } }
      registerHydration: { source: string; position: string; policy: string; conflictResolution: string }
    }
  }>(presetPlanResult as any)
  expect(presetPlan.preset.id).toBe("codex")
  expect(presetPlan.preset.host).toBe("codex")
  expect(presetPlan.loader.resume.includeRegister).toBe(true)
  expect(presetPlan.plan.resumeCall.tool).toBe("livebase.task.resume")
  expect(presetPlan.plan.resumeCall.arguments.taskId).toBe(task.id)
  expect(presetPlan.plan.resumeCall.arguments.includeRegister).toBe(true)
  expect(presetPlan.plan.registerHydration.source).toBe("continuationRegister.promptBlock")
  expect(presetPlan.plan.registerHydration.position).toBe("top_of_attention")
  expect(presetPlan.plan.registerHydration.policy).toBe("if_present")
  expect(presetPlan.plan.registerHydration.conflictResolution).toBe("fresh_resume_wins")

  const taskListResult = await client.callTool({
    name: "livebase.task.list",
    arguments: {
      projectRef: project.id,
      status: "active",
    },
  })
  const taskList = getStructuredContent<{ count: number; tasks: Array<{ id: string }> }>(taskListResult as any)
  expect(taskList.count).toBe(1)
  expect(taskList.tasks[0].id).toBe(task.id)

  const taskGetResult = await client.callTool({
    name: "livebase.task.get",
    arguments: {
      taskId: task.id,
    },
  })
  const taskGet = getStructuredContent<{ id: string; goal: string; status: string }>(taskGetResult as any)
  expect(taskGet.id).toBe(task.id)
  expect(taskGet.goal).toBe("Continue from the right evidence gap")
  expect(taskGet.status).toBe("active")

  const checkpointResult = await client.callTool({
    name: "livebase.task.checkpoint",
    arguments: {
      taskId: task.id,
      reason: "blocked",
      summary: "Need stronger migration proof",
      blocker: "Missing migration ownership evidence",
      nextAction: "Inspect the project section carefully",
      evidenceGaps: [
        {
          question: "Did the candidate lead the migration rollout?",
          suggestedAction: "Inspect the project section for migration ownership",
        },
      ],
    },
  })
  const checkpointedTask = getStructuredContent<{
    id: string
    status: string
    currentBlocker?: string
    evidenceGaps: Array<{ id: string; question: string; status: string }>
  }>(checkpointResult as any)
  expect(checkpointedTask.id).toBe(task.id)
  expect(checkpointedTask.status).toBe("blocked")
  expect(checkpointedTask.currentBlocker).toBe("Missing migration ownership evidence")
  expect(checkpointedTask.evidenceGaps).toHaveLength(2)
  const latestGapId = checkpointedTask.evidenceGaps[1].id

  const resumeResult = await client.callTool({
    name: "livebase.task.resume",
    arguments: {
      taskId: task.id,
    },
  })
  const continuation = getStructuredContent<{
    type: string
    taskRef: string
    primaryEvidenceGap: { id: string; question: string }
    nextAction: string
  }>(resumeResult as any)
  expect(continuation.type).toBe("continuation-pack")
  expect(continuation.taskRef).toBe(task.id)
  expect(continuation.primaryEvidenceGap.id).toBe(latestGapId)
  expect(continuation.primaryEvidenceGap.question).toContain("migration rollout")

  const resumeWithRegisterResult = await client.callTool({
    name: "livebase.task.resume",
    arguments: {
      taskId: task.id,
      includeRegister: true,
    },
  })
  const continuationWithRegister = getStructuredContent<{
    continuationRegister: {
      version: string
      taskRef: string
      primaryGap: { id: string; question: string }
      promptBlock: string
    }
  }>(resumeWithRegisterResult as any)
  expect(continuationWithRegister.continuationRegister.version).toBe("1")
  expect(continuationWithRegister.continuationRegister.taskRef).toBe(task.id)
  expect(continuationWithRegister.continuationRegister.primaryGap.id).toBe(latestGapId)
  expect(continuationWithRegister.continuationRegister.promptBlock).toContain("<Continuation-Register version=\"1\">")

  const resolveGapResult = await client.callTool({
    name: "livebase.task.resolve_gap",
    arguments: {
      taskId: task.id,
      gapId: latestGapId,
      currentState: "Migration thread reviewed",
      nextAction: "Re-check the original production ownership gap",
    },
  })
  const resolvedTask = getStructuredContent<{
    id: string
    currentState?: string
    nextAction?: string
    evidenceGaps: Array<{ id: string; status: string }>
  }>(resolveGapResult as any)
  expect(resolvedTask.id).toBe(task.id)
  expect(resolvedTask.currentState).toBe("Migration thread reviewed")
  expect(resolvedTask.nextAction).toBe("Re-check the original production ownership gap")
  expect(resolvedTask.evidenceGaps.find(item => item.id === latestGapId)?.status).toBe("resolved")

  const resumedAfterResolveResult = await client.callTool({
    name: "livebase.task.resume",
    arguments: {
      taskId: task.id,
    },
  })
  const resumedAfterResolve = getStructuredContent<{
    primaryEvidenceGap: { id: string; question: string }
    nextAction: string
  }>(resumedAfterResolveResult as any)
  expect(resumedAfterResolve.primaryEvidenceGap.id).toBe(initialGapId)
  expect(resumedAfterResolve.primaryEvidenceGap.question).toContain("production migration")

  const contractResult = await client.callTool({
    name: "livebase.task.contract",
    arguments: {
      taskId: task.id,
      adapter: "codex",
      requiredChecks: ["Verify migration ownership against the grounded source"],
    },
  })
  const contract = getStructuredContent<{ id: string; contract: { adapter: { name: string }; task: { taskRef: string } } }>(
    contractResult as any,
  )
  expect(contract.id).toMatch(/^contract-/)
  expect(contract.contract.adapter.name).toBe("codex")
  expect(contract.contract.task.taskRef).toBe(task.id)

  const writebackResult = await client.callTool({
    name: "livebase.task.writeback",
    arguments: {
      run: {
        taskRef: task.id,
        contractRef: contract.id,
        executor: "codex",
        status: "completed",
        outcome: "Verified the migration ownership language from the grounded source.",
        completedAt: new Date().toISOString(),
      },
      checks: [
        {
          name: "source inspection",
          method: "read source",
          observed: "The source contains explicit migration ownership language.",
          sourceRefs: [source.id],
          contrarySignals: [],
          confidence: "high",
        },
      ],
      ambiguity: {
        openQuestions: [],
        missingEvidence: [],
        confidenceNote: "Evidence is sufficient for the next handoff.",
      },
      residue: {
        residueType: "decision-note",
        title: "Ownership language matters",
        body: "When the source shows direct migration ownership, continue without reopening the same gap.",
        importance: "high",
        sourceRefs: [source.id],
        projectRef: project.id,
      },
      updates: {
        projectRef: project.id,
        taskStatus: "completed",
        currentState: "Migration ownership verified",
        nextAction: "Schedule the next interview stage",
        closeEvidenceGapIds: [initialGapId],
        projectState: "Candidate ready for the next stage",
        projectNextStep: "Schedule the next interview stage",
      },
    },
  })
  const writeback = getStructuredContent<{ status: string; ledgerId: string; residueId: string | null; taskId: string }>(
    writebackResult as any,
  )
  expect(writeback.status).toBe("ok")
  expect(writeback.ledgerId).toMatch(/^ledger-/)
  expect(writeback.residueId).toMatch(/^res-/)
  expect(writeback.taskId).toBe(task.id)

  const afterResult = await client.callTool({
    name: "livebase.task.resume",
    arguments: {
      taskId: task.id,
    },
  })
  const after = getStructuredContent<{
    primaryEvidenceGap: null
    nextAction: string
    openEvidenceGapCount: number
  }>(afterResult as any)
  expect(after.primaryEvidenceGap).toBeNull()
  expect(after.nextAction).toBe("Schedule the next interview stage")
  expect(after.openEvidenceGapCount).toBe(0)

  const finalTaskGetResult = await client.callTool({
    name: "livebase.task.get",
    arguments: {
      taskId: task.id,
    },
  })
  const finalTask = getStructuredContent<{ id: string; status: string; currentState?: string; nextAction?: string }>(
    finalTaskGetResult as any,
  )
  expect(finalTask.id).toBe(task.id)
  expect(finalTask.status).toBe("completed")
  expect(finalTask.currentState).toBe("Migration ownership verified")
  expect(finalTask.nextAction).toBe("Schedule the next interview stage")

  await transport.close()
})

test("mcp tools return stable structured errors", async () => {
  const { client, transport } = await connectMcpClient()

  const missingTaskResult = await client.callTool({
    name: "livebase.task.get",
    arguments: {
      taskId: "tsk-missing",
    },
  })
  const missingTask = getStructuredContent<{
    ok: false
    tool: string
    error: {
      code: string
      message: string
      detail?: string
      retryable: boolean
      target?: { type: string; id?: string }
    }
  }>(missingTaskResult as any)
  expect((missingTaskResult as any).isError).toBe(true)
  expect(missingTask.ok).toBe(false)
  expect(missingTask.tool).toBe("livebase.task.get")
  expect(missingTask.error.code).toBe("task_not_found")
  expect(missingTask.error.retryable).toBe(false)
  expect(missingTask.error.target?.type).toBe("task")
  expect(missingTask.error.target?.id).toBe("tsk-missing")

  const missingProjectResult = await client.callTool({
    name: "livebase.project.get",
    arguments: {
      projectId: "proj-missing",
    },
  })
  const missingProject = getStructuredContent<{
    ok: false
    tool: string
    error: { code: string; target?: { type: string; id?: string } }
  }>(missingProjectResult as any)
  expect((missingProjectResult as any).isError).toBe(true)
  expect(missingProject.tool).toBe("livebase.project.get")
  expect(missingProject.error.code).toBe("project_not_found")
  expect(missingProject.error.target?.type).toBe("project")
  expect(missingProject.error.target?.id).toBe("proj-missing")

  const missingPresetResult = await client.callTool({
    name: "livebase.preset.loader_plan",
    arguments: {
      presetId: "preset-missing",
    },
  })
  const missingPreset = getStructuredContent<{
    ok: false
    tool: string
    error: { code: string; target?: { type: string; id?: string } }
  }>(missingPresetResult as any)
  expect((missingPresetResult as any).isError).toBe(true)
  expect(missingPreset.tool).toBe("livebase.preset.loader_plan")
  expect(missingPreset.error.code).toBe("preset_not_found")
  expect(missingPreset.error.target?.type).toBe("preset")
  expect(missingPreset.error.target?.id).toBe("preset-missing")

  const projectResult = await client.callTool({
    name: "livebase.project.create",
    arguments: {
      name: "Error Contract Project",
    },
  })
  const project = getStructuredContent<{ id: string }>(projectResult as any)

  const taskResult = await client.callTool({
    name: "livebase.task.create",
    arguments: {
      title: "Error contract task",
      goal: "Exercise MCP error flow",
      projectRef: project.id,
    },
  })
  const task = getStructuredContent<{ id: string }>(taskResult as any)

  const missingGapResult = await client.callTool({
    name: "livebase.task.resolve_gap",
    arguments: {
      taskId: task.id,
      gapId: "gap-missing",
    },
  })
  const missingGap = getStructuredContent<{
    ok: false
    tool: string
    error: { code: string; target?: { type: string; id?: string } }
  }>(missingGapResult as any)
  expect((missingGapResult as any).isError).toBe(true)
  expect(missingGap.tool).toBe("livebase.task.resolve_gap")
  expect(missingGap.error.code).toBe("evidence_gap_not_found")
  expect(missingGap.error.target?.type).toBe("evidence_gap")
  expect(missingGap.error.target?.id).toBe("gap-missing")

  const invalidGapResult = await client.callTool({
    name: "livebase.task.create",
    arguments: {
      title: "Invalid gap task",
      goal: "Exercise invalid evidence gap flow",
      projectRef: project.id,
      evidenceGaps: [
        {
          question: "",
          suggestedAction: "Inspect the source",
        },
      ],
    },
  })
  const invalidGap = getStructuredContent<{
    ok: false
    tool: string
    error: { code: string; target?: { type: string } }
  }>(invalidGapResult as any)
  expect((invalidGapResult as any).isError).toBe(true)
  expect(invalidGap.tool).toBe("livebase.task.create")
  expect(invalidGap.error.code).toBe("invalid_evidence_gap")
  expect(invalidGap.error.target?.type).toBe("input")

  await transport.close()
})
