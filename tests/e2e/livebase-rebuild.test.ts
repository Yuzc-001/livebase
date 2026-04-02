import { afterAll, beforeAll, expect, test } from "bun:test"
import { existsSync, rmSync, writeFileSync } from "fs"
import { resolve } from "path"

const TEST_STORE = resolve(process.cwd(), "store-rebuild-test")
process.env.LIVEBASE_STORE = TEST_STORE

async function run(...args: string[]) {
  const proc = Bun.spawn(["bun", "src/cli/main.ts", ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, LIVEBASE_STORE: TEST_STORE },
  })
  const code = await proc.exited
  const rawOut = await new Response(proc.stdout).text()
  const rawErr = await new Response(proc.stderr).text()
  try {
    return { out: JSON.parse(rawOut), code, err: rawErr }
  } catch {
    return { out: rawOut, code, err: rawErr }
  }
}

async function runWithStdin(stdin: string, ...args: string[]) {
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
    return { out: JSON.parse(rawOut), code, err: rawErr }
  } catch {
    return { out: rawOut, code, err: rawErr }
  }
}

beforeAll(async () => {
  if (existsSync(TEST_STORE)) rmSync(TEST_STORE, { recursive: true })
  await run("setup")
})

afterAll(() => {
  if (existsSync(TEST_STORE)) rmSync(TEST_STORE, { recursive: true })
})

test("setup creates rebuilt store directories", async () => {
  const { out, code } = await run("setup")
  expect(code).toBe(0)
  expect(out.status).toBe("ok")
  expect(existsSync(resolve(TEST_STORE, "tasks"))).toBe(true)
  expect(existsSync(resolve(TEST_STORE, "contracts"))).toBe(true)
  expect(existsSync(resolve(TEST_STORE, "ledgers"))).toBe(true)
})

test("continuation flow resumes from the latest unresolved evidence gap", async () => {
  const project = await run("project", "create", "Rebuild Project", "--description", "Test continuation flow")
  expect(project.code).toBe(0)

  const sourceFile = resolve(TEST_STORE, "sample-source.md")
  writeFileSync(sourceFile, "# Resume source\n\nObserved source material.")
  const ingest = await run("source", "ingest", sourceFile, "--project", project.out.id, "--title", "Resume Source")
  expect(ingest.code).toBe(0)

  const created = await run(
    "task",
    "create",
    "Screen candidate",
    "--goal",
    "Continue from the right evidence gap",
    "--project",
    project.out.id,
    "--current-state",
    "First pass complete",
    "--next-action",
    "Review the resume carefully",
    "--evidence-gap",
    "Did they own incidents?::Inspect the resume for production ownership",
  )
  expect(created.code).toBe(0)

  const checkpoint = await run(
    "checkpoint",
    created.out.id,
    "--reason",
    "blocked",
    "--summary",
    "Need stronger migration proof",
    "--blocker",
    "Missing migration ownership evidence",
    "--evidence-gap",
    "Did they lead a migration?::Inspect the project section for migration ownership",
  )
  expect(checkpoint.code).toBe(0)
  expect(checkpoint.out.task.evidenceGaps).toHaveLength(2)

  const resumed = await run("resume", created.out.id)
  expect(resumed.code).toBe(0)
  expect(resumed.out.primaryEvidenceGap.question).toContain("lead a migration")
  expect(resumed.out.nextAction).toBe("Inspect the project section for migration ownership")
  expect(resumed.out.openEvidenceGapCount).toBe(2)

  const contract = await run("contract", created.out.id)
  expect(contract.code).toBe(0)
  expect(contract.out.contract.task.goal).toBe("Continue from the right evidence gap")
  expect(contract.out.contract.continuation.primaryEvidenceGap.question).toContain("lead a migration")
  expect(contract.out.contract.boundaries.stopConditions.length).toBeGreaterThan(0)
  expect(contract.out.contract.success.requiredChecks.length).toBeGreaterThan(0)
})

test("writeback applies a verification ledger and sharpens the next resume", async () => {
  const project = await run("project", "create", "Ledger Project", "--description", "Test writeback flow")
  expect(project.code).toBe(0)

  const created = await run(
    "task",
    "create",
    "Investigate issue",
    "--goal",
    "Return with verified evidence",
    "--project",
    project.out.id,
    "--next-action",
    "Inspect the evidence source",
    "--evidence-gap",
    "What changed?::Inspect the latest run output",
    "--evidence-gap",
    "Why did it fail?::Inspect the failing branch logs",
  )
  expect(created.code).toBe(0)

  const before = await run("resume", created.out.id)
  expect(before.out.primaryEvidenceGap.question).toContain("Why did it fail")

  const gapToClose = before.out.primaryEvidenceGap.id
  const ledger = {
    run: {
      taskRef: created.out.id,
      status: "partial",
      outcome: "narrowed_failure_cause",
      completedAt: new Date().toISOString(),
      executor: "grasp",
    },
    checks: [
      {
        name: "Inspect failing branch logs",
        method: "browser inspection",
        observed: "The branch fails during the migration step.",
        sourceRefs: [],
        contrarySignals: [],
        confidence: "medium",
      },
    ],
    ambiguity: {
      openQuestions: ["The exact root cause inside the migration step is still unknown."],
      missingEvidence: [],
      confidenceNote: "We reduced uncertainty but did not fully resolve it.",
    },
    residue: {
      residueType: "lesson",
      title: "Inspect migration output before retrying",
      body: "When this task fails, the first useful evidence comes from the migration output, not the summary page.",
      importance: "medium",
      projectRef: project.out.id,
      sourceRefs: [],
    },
    updates: {
      projectRef: project.out.id,
      taskStatus: "active",
      currentState: "Primary failure branch inspected",
      nextAction: "Inspect the migration command output",
      closeEvidenceGapIds: [gapToClose],
      projectState: "Failure narrowed to the migration step",
      projectNextStep: "Inspect the migration command output",
    },
  }

  const writeback = await runWithStdin(JSON.stringify(ledger), "writeback")
  expect(writeback.code).toBe(0)
  expect(writeback.out.status).toBe("ok")
  expect(writeback.out.residueId).toMatch(/^res-/)
  expect(writeback.out.ledgerId).toMatch(/^ledger-/)

  const after = await run("resume", created.out.id)
  expect(after.code).toBe(0)
  expect(after.out.primaryEvidenceGap.question).toContain("What changed")

  const projectState = await run("project", "show", project.out.id)
  expect(projectState.code).toBe(0)
  expect(projectState.out.currentState).toBe("Failure narrowed to the migration step")
  expect(projectState.out.nextStep).toBe("Inspect the migration command output")
})
