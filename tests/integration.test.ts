import { afterAll, beforeAll, expect, test } from "bun:test"
import { existsSync, rmSync, writeFileSync } from "fs"
import { resolve } from "path"

const TEST_STORE = resolve(process.cwd(), "store-test")
process.env.LIVEBASE_STORE = TEST_STORE

async function runCli(...args: string[]): Promise<{ out: any; err: string; code: number }> {
  const proc = Bun.spawn(["bun", "src/cli/main.ts", ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, LIVEBASE_STORE: TEST_STORE },
  })
  const code = await proc.exited
  const rawOut = await new Response(proc.stdout).text()
  const rawErr = await new Response(proc.stderr).text()
  try {
    return { out: rawOut ? JSON.parse(rawOut) : null, err: rawErr, code }
  } catch {
    return { out: rawOut, err: rawErr, code }
  }
}

async function runCliWithStdin(stdin: string, ...args: string[]): Promise<{ out: any; err: string; code: number }> {
  const proc = Bun.spawn(["bun", "src/cli/main.ts", ...args], {
    stdin: new Blob([stdin]),
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, LIVEBASE_STORE: TEST_STORE },
  })
  const code = await proc.exited
  const rawOut = await new Response(proc.stdout).text()
  const rawErr = await new Response(proc.stderr).text()
  try {
    return { out: rawOut ? JSON.parse(rawOut) : null, err: rawErr, code }
  } catch {
    return { out: rawOut, err: rawErr, code }
  }
}

beforeAll(async () => {
  if (existsSync(TEST_STORE)) rmSync(TEST_STORE, { recursive: true, force: true })
  await runCli("setup")
})

afterAll(() => {
  if (existsSync(TEST_STORE)) rmSync(TEST_STORE, { recursive: true, force: true })
})

test("setup creates the v0.1 store layout", async () => {
  const { out, code } = await runCli("setup")
  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(existsSync(resolve(TEST_STORE, "projects"))).toBe(true)
  expect(existsSync(resolve(TEST_STORE, "sources"))).toBe(true)
  expect(existsSync(resolve(TEST_STORE, "tasks"))).toBe(true)
  expect(existsSync(resolve(TEST_STORE, "contracts"))).toBe(true)
  expect(existsSync(resolve(TEST_STORE, "ledgers"))).toBe(true)
})

test("project create returns a project id", async () => {
  const { out, code } = await runCli("project", "create", "Hiring Loop", "--description", "Backend candidate screening")
  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(out.id).toMatch(/^proj-/)
  expect(out.project.name).toBe("Hiring Loop")
  ;(globalThis as any).__projectId = out.id
})

test("source ingest stores grounded source and links it to the project", async () => {
  const projectId = (globalThis as any).__projectId
  const tmpFile = resolve(TEST_STORE, "candidate-resume.md")
  writeFileSync(tmpFile, "# Candidate Resume\n\nLed incident response and owned migration rollout.")

  const { out, code } = await runCli("source", "ingest", tmpFile, "--project", projectId, "--title", "Candidate resume")
  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(out.id).toMatch(/^src-/)
  expect(out.source.title).toBe("Candidate resume")
  ;(globalThis as any).__sourceId = out.id
})

test("task create persists evidence gaps", async () => {
  const projectId = (globalThis as any).__projectId
  const { out, code } = await runCli(
    "task",
    "create",
    "Screen candidate",
    "--goal",
    "Decide the right next step for this candidate",
    "--project",
    projectId,
    "--current-state",
    "Initial review paused after first pass",
    "--next-action",
    "Inspect the resume for ownership evidence",
    "--evidence-gap",
    "Did the candidate directly own production incidents?::Inspect the resume for ownership evidence",
  )

  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(out.id).toMatch(/^tsk-/)
  expect(out.task.evidenceGaps).toHaveLength(1)
  expect(out.task.evidenceGaps[0].status).toBe("open")
  ;(globalThis as any).__taskId = out.id
  ;(globalThis as any).__gapId = out.task.evidenceGaps[0].id
})

test("checkpoint appends a new evidence gap and blocker", async () => {
  const taskId = (globalThis as any).__taskId
  const { out, code } = await runCli(
    "checkpoint",
    taskId,
    "--reason",
    "blocked",
    "--summary",
    "Need stronger ownership evidence before deciding",
    "--blocker",
    "Missing ownership evidence",
    "--evidence-gap",
    "Did the candidate lead a major migration?::Inspect the projects section for migration ownership",
  )

  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(out.task.status).toBe("blocked")
  expect(out.task.evidenceGaps).toHaveLength(2)
  expect(out.task.currentBlocker).toBe("Missing ownership evidence")
  ;(globalThis as any).__latestGapId = out.task.evidenceGaps[1].id
})

test("resume returns a continuation pack centered on the latest open evidence gap", async () => {
  const taskId = (globalThis as any).__taskId
  const { out, code } = await runCli("resume", taskId)

  expect(code).toBe(0)
  expect(out.type).toBe("continuation-pack")
  expect(out.taskRef).toBe(taskId)
  expect(out.primaryEvidenceGap.id).toBe((globalThis as any).__latestGapId)
  expect(out.nextAction).toBe("Inspect the projects section for migration ownership")
  expect(out.supportingSources.length).toBeGreaterThan(0)
})

test("resume can optionally include a continuation register", async () => {
  const taskId = (globalThis as any).__taskId
  const { out, code } = await runCli("resume", taskId, "--with-register")

  expect(code).toBe(0)
  expect(out.continuationRegister.version).toBe("1")
  expect(out.continuationRegister.taskRef).toBe(taskId)
  expect(out.continuationRegister.primaryGap.id).toBe((globalThis as any).__latestGapId)
  expect(out.continuationRegister.promptBlock).toContain("<Continuation-Register version=\"1\">")
  expect(out.continuationRegister.promptBlock).toContain("<Task-Ref>")
})

test("preset list emits discovery JSON for hosts", async () => {
  const { out, code } = await runCli("preset", "list")

  expect(code).toBe(0)
  expect(out.count).toBe(4)
  expect(out.presets).toEqual([
    { id: "codex", host: "codex", adapter: "codex" },
    { id: "claude-code", host: "claude-code", adapter: "claude-code" },
    { id: "openai-responses-host", host: "openai-responses-host", adapter: "openai-responses-host" },
    { id: "orchestrator", host: "orchestrator", adapter: "orchestrator" },
  ])
})

test("preset loader-plan emits host-consumable loader JSON", async () => {
  const taskId = (globalThis as any).__taskId
  const { out, code } = await runCli("preset", "loader-plan", "codex", "--task-id", taskId)

  expect(code).toBe(0)
  expect(out.preset.id).toBe("codex")
  expect(out.preset.host).toBe("codex")
  expect(out.loader.resume.includeRegister).toBe(true)
  expect(out.plan.resumeCall.tool).toBe("livebase.task.resume")
  expect(out.plan.resumeCall.arguments).toEqual({
    taskId,
    includeRegister: true,
  })
  expect(out.plan.registerHydration).toEqual({
    source: "continuationRegister.promptBlock",
    position: "top_of_attention",
    policy: "if_present",
    conflictResolution: "fresh_resume_wins",
  })
})

test("contract creates an execution contract from the task thread", async () => {
  const taskId = (globalThis as any).__taskId
  const { out, code } = await runCli(
    "contract",
    taskId,
    "--adapter",
    "codex",
    "--require-check",
    "Verify ownership evidence against the grounded source",
  )

  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(out.id).toMatch(/^contract-/)
  expect(out.contract.type).toBe("execution-contract")
  expect(out.contract.task.taskRef).toBe(taskId)
  expect(out.contract.continuation.primaryEvidenceGap.id).toBe((globalThis as any).__latestGapId)
  ;(globalThis as any).__contractId = out.id
})

test("writeback saves a verification ledger, residue, and updates task/project state", async () => {
  const projectId = (globalThis as any).__projectId
  const taskId = (globalThis as any).__taskId
  const gapId = (globalThis as any).__latestGapId
  const contractId = (globalThis as any).__contractId
  const sourceId = (globalThis as any).__sourceId

  const ledger = {
    run: {
      taskRef: taskId,
      contractRef: contractId,
      executor: "codex",
      status: "completed",
      outcome: "Found explicit migration ownership evidence and recommended advancing the candidate.",
      completedAt: new Date().toISOString(),
    },
    checks: [
      {
        name: "resume evidence review",
        method: "read source",
        observed: "Resume states the candidate led incident response and owned migration rollout.",
        sourceRefs: [sourceId],
        contrarySignals: [],
        confidence: "high",
      },
    ],
    ambiguity: {
      openQuestions: [],
      missingEvidence: [],
      confidenceNote: "Evidence is strong enough for the next step.",
    },
    residue: {
      residueType: "decision-note",
      title: "Candidate shows direct ownership signals",
      body: "Advance the candidate when explicit ownership language appears in both incident response and migration history.",
      importance: "high",
      sourceRefs: [sourceId],
      projectRef: projectId,
    },
    updates: {
      projectRef: projectId,
      taskStatus: "completed",
      currentState: "Ownership evidence confirmed from grounded source",
      nextAction: "Schedule the technical interview review",
      closeEvidenceGapIds: [gapId],
      projectState: "Candidate advanced to technical interview review",
      projectNextStep: "Schedule the technical interview review",
    },
  }

  const { out, code } = await runCliWithStdin(JSON.stringify(ledger), "writeback")
  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(out.ledgerId).toMatch(/^ledger-/)
  expect(out.residueId).toMatch(/^res-/)
})

test("resume falls back to the task next action after evidence gaps are resolved", async () => {
  const taskId = (globalThis as any).__taskId
  const firstGapId = (globalThis as any).__gapId
  const { code } = await runCli("task", "resolve-gap", taskId, firstGapId, "--next-action", "Schedule the technical interview review")
  expect(code).toBe(0)

  const { out, code: resumeCode } = await runCli("resume", taskId)
  expect(resumeCode).toBe(0)
  expect(out.primaryEvidenceGap).toBeNull()
  expect(out.nextAction).toBe("Schedule the technical interview review")
})

test("doctor reports local health", async () => {
  const { out, code } = await runCli("doctor")
  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(out.counts.projects).toBeGreaterThan(0)
  expect(out.counts.sources).toBeGreaterThan(0)
  expect(out.counts.tasks).toBeGreaterThan(0)
  expect(out.counts.contracts).toBeGreaterThan(0)
  expect(out.counts.ledgers).toBeGreaterThan(0)
})
