#!/usr/bin/env bun
// bun run pack <project_id> --goal "..." [--task-type screening] [--adapter grasp]
//
// Generates a TaskPackage ready to hand to an execution adapter (e.g. grasp).
// Pulls project standards, source refs, residue refs, and entity refs.
// Returns: TaskPackage JSON

import { DIRS, load, makeId, ok, fail } from "./lib/store.ts"
import { type Project } from "../schemas/objects.ts"
import { TaskPackageSchema, type TaskPackage } from "../schemas/task-package.ts"

if (process.argv.includes("--help")) {
  console.log(`
Usage: bun run pack <project_id> --goal "..." [options]

Options:
  --goal "..."          What the adapter should achieve (required)
  --task-type <type>    evaluation | research | implementation | review | screening | other
  --adapter <name>      Which adapter will execute (default: grasp)
  --priority <level>    high | medium | low (default: medium)

Output: TaskPackage JSON — hand this to the execution adapter.

Examples:
  bun run pack proj-hiring-backend-lv3kj --goal "Screen candidate 17 for backend role" --task-type screening
  bun run pack proj-research-main-abc --goal "Collect evidence on latency issue" --adapter grasp
`)
  process.exit(0)
}

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
let projectId: string | undefined
let goal: string | undefined
let taskType: string = "evaluation"
let adapter: string = "grasp"
let priority: "high" | "medium" | "low" = "medium"

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--goal") goal = args[++i]
  else if (args[i] === "--task-type") taskType = args[++i]
  else if (args[i] === "--adapter") adapter = args[++i]
  else if (args[i] === "--priority") priority = args[++i] as typeof priority
  else if (!projectId && !args[i].startsWith("--")) projectId = args[i]
}

if (!projectId) fail("missing_project_id", "Usage: bun run pack <project_id> --goal '...'")
if (!goal) fail("missing_goal", "Provide --goal '...' describing what the adapter should do")

// ── Load project ──────────────────────────────────────────────────────────────
const project = load<Project>(DIRS.projects, projectId!)
if (!project) fail("project_not_found", { id: projectId })

const p = project!
const standards = p.standards ?? {}
const taskId = makeId("task", p.name)

const pkg: TaskPackage = TaskPackageSchema.parse({
  task: {
    task_id: taskId,
    title: goal!.slice(0, 80),
    goal: goal!,
    task_type: taskType,
    scope: p.name,
    priority,
  },
  context: {
    project_ref: projectId,
    entity_refs: p.entityRefs,
    current_state: p.currentState ?? undefined,
    prior_residue_refs: p.residueRefs,
  },
  standards: {
    hard_requirements: (standards as any).hard_requirements ?? [],
    soft_signals: (standards as any).soft_signals ?? [],
    red_flags: (standards as any).red_flags ?? [],
    decision_rules: (standards as any).decision_rules ?? [],
    action_boundaries: (standards as any).action_boundaries ?? [],
  },
  sources: {
    source_refs: p.sourceRefs,
    note_refs: p.noteRefs,
    document_refs: [],
    relevant_urls: [],
  },
  execution: {
    adapter,
    environment: adapter === "grasp" ? "browser" : undefined,
    allowed_actions: [],
    disallowed_actions: [],
  },
  expected_output: {
    required_fields: ["outcome", "evidence", "ambiguity", "suggested_residue"],
    evidence_expectations: [],
    ambiguity_expectations: [],
    result_shape: "structured_evaluation",
  },
})

ok(pkg)
