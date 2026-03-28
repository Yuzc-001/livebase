import { test, expect, beforeAll, afterAll } from "bun:test"
import { rmSync, existsSync } from "fs"
import { resolve } from "path"
import { writeFileSync } from "fs"

// Use a test-isolated store by overriding env
const TEST_STORE = resolve(process.cwd(), "store-test")
process.env.LIVEBASE_STORE = TEST_STORE

// ── Helpers: run scripts as subprocesses ──────────────────────────────────────
async function run(script: string, ...args: string[]): Promise<{ out: any; code: number }> {
  const proc = Bun.spawn(["bun", `scripts/${script}.ts`, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, LIVEBASE_STORE: TEST_STORE },
  })
  const code = await proc.exited
  const raw = await new Response(proc.stdout).text()
  try {
    return { out: JSON.parse(raw), code }
  } catch {
    return { out: raw, code }
  }
}

async function runWithStdin(
  script: string,
  stdin: string,
  ...args: string[]
): Promise<{ out: any; code: number }> {
  const proc = Bun.spawn(["bun", `scripts/${script}.ts`, ...args], {
    stdin: new Blob([stdin]),
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, LIVEBASE_STORE: TEST_STORE },
  })
  const code = await proc.exited
  const raw = await new Response(proc.stdout).text()
  try {
    return { out: JSON.parse(raw), code }
  } catch {
    return { out: raw, code }
  }
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────
beforeAll(async () => {
  // Clean slate
  if (existsSync(TEST_STORE)) rmSync(TEST_STORE, { recursive: true })
  await run("init")
})

afterAll(() => {
  if (existsSync(TEST_STORE)) rmSync(TEST_STORE, { recursive: true })
})

// ── Tests ─────────────────────────────────────────────────────────────────────
test("init creates store directories", async () => {
  const { out, code } = await run("init")
  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(existsSync(resolve(TEST_STORE, "sources"))).toBe(true)
  expect(existsSync(resolve(TEST_STORE, "projects"))).toBe(true)
  expect(existsSync(resolve(TEST_STORE, "residue"))).toBe(true)
})

test("project create returns id and project object", async () => {
  const { out, code } = await run("project", "create", "Test Project", "--description", "Integration test project")
  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(out.id).toMatch(/^proj-/)
  expect(out.project.name).toBe("Test Project")
  expect(out.project.status).toBe("active")

  // Store global for later tests
  ;(globalThis as any).__projectId = out.id
})

test("project list returns the created project", async () => {
  const { out, code } = await run("project", "list")
  expect(code).toBe(0)
  expect(out.count).toBeGreaterThan(0)
  expect(out.projects.some((p: any) => p.name === "Test Project")).toBe(true)
})

test("ingest creates a source and links to project", async () => {
  const projectId = (globalThis as any).__projectId
  // Write a temp file
  const tmpFile = resolve(process.cwd(), "store-test", "tmp-test-source.md")
  writeFileSync(tmpFile, "# Test Source\n\nThis is test content for integration testing.")

  const { out, code } = await run("ingest", tmpFile, "--project", projectId, "--title", "Test Source")
  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(out.id).toMatch(/^src-/)
  expect(out.source.title).toBe("Test Source")

  ;(globalThis as any).__sourceId = out.id
})

test("retrieve generates a ContextPack with linked sources", async () => {
  const projectId = (globalThis as any).__projectId
  const { out, code } = await run("retrieve", projectId, "--purpose", "integration test")
  expect(code).toBe(0)
  expect(out.type).toBe("context-pack")
  expect(out.sources.length).toBeGreaterThan(0)
  expect(out.projectRef).toBe(projectId)
  expect(out.summary).toBeTruthy()

  ;(globalThis as any).__packId = out.id
})

test("pack generates a TaskPackage for an adapter", async () => {
  const projectId = (globalThis as any).__projectId
  const { out, code } = await run("pack", projectId, "--goal", "Execute test task", "--adapter", "grasp")
  expect(code).toBe(0)
  expect(out.task.goal).toBe("Execute test task")
  expect(out.execution.adapter).toBe("grasp")
  expect(out.context.project_ref).toBe(projectId)
  expect(out.expected_output.required_fields).toContain("outcome")
})

test("writeback writes residue and updates project", async () => {
  const projectId = (globalThis as any).__projectId

  const writeBackPkg = {
    task_result: {
      task_id: "task-test-001",
      outcome: "test_passed",
      status: "completed",
      completed_at: new Date().toISOString(),
      adapter: "test",
    },
    evidence: {
      evidence_summary: "All assertions passed in integration test",
      evidence_refs: [],
      source_refs: [],
      observed_signals: ["test ran successfully"],
    },
    ambiguity: {
      open_questions: [],
      missing_evidence: [],
      conflicts: [],
    },
    residue: {
      residueType: "lesson",
      title: "Integration test passes reliably",
      body: "The full cycle (init → ingest → retrieve → pack → writeback) works end to end.",
      importance: "medium",
      projectRef: projectId,
      sourceRefs: [],
      entityRefs: [],
    },
    state_updates: {
      project_ref: projectId,
      project_state_update: "integration test completed",
      next_step: "run in CI",
    },
  }

  const { out, code } = await runWithStdin("writeback", JSON.stringify(writeBackPkg))
  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(out.residueId).toMatch(/^res-/)
  expect(out.written.length).toBeGreaterThan(0)
})

test("retrieve after writeback includes the residue", async () => {
  const projectId = (globalThis as any).__projectId
  const { out, code } = await run("retrieve", projectId)
  expect(code).toBe(0)
  expect(out.residue.length).toBeGreaterThan(0)
  expect(out.residue[0].title).toBe("Integration test passes reliably")
})

test("project show reflects state_updates from writeback", async () => {
  const projectId = (globalThis as any).__projectId
  const { out, code } = await run("project", "show", projectId)
  expect(code).toBe(0)
  expect(out.currentState).toBe("integration test completed")
  expect(out.nextStep).toBe("run in CI")
})
