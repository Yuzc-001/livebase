#!/usr/bin/env bun
// bun run project create "Name" [--description "..."] [--status active]
// bun run project list
// bun run project show <id>
// bun run project update <id> --state "..." --next-step "..."

import { DIRS, save, load, loadAll, makeId, now, ok, fail } from "./lib/store.ts"
import { ProjectSchema, type Project } from "../schemas/objects.ts"

const args = process.argv.slice(2)
const cmd = args[0]

// ── project create ────────────────────────────────────────────────────────────
if (cmd === "create") {
  const name = args[1]
  if (!name) fail("missing_name", "Usage: bun run project create 'Name' [--description '...']")

  let description: string | undefined
  let status: "active" | "paused" | "completed" | "archived" = "active"
  for (let i = 2; i < args.length; i++) {
    if (args[i] === "--description") description = args[++i]
    if (args[i] === "--status") status = args[++i] as typeof status
  }

  const id = makeId("proj", name)
  const project: Project = ProjectSchema.parse({
    id,
    type: "project",
    name,
    description,
    status,
    sourceRefs: [],
    noteRefs: [],
    entityRefs: [],
    residueRefs: [],
    createdAt: now(),
    updatedAt: now(),
  })

  save(DIRS.projects, id, project)
  ok({ status: "ok", id, project })
}

// ── project list ──────────────────────────────────────────────────────────────
else if (cmd === "list") {
  const projects = loadAll<Project>(DIRS.projects)
  ok({
    count: projects.length,
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      sources: p.sourceRefs.length,
      notes: p.noteRefs.length,
      residue: p.residueRefs.length,
      updatedAt: p.updatedAt,
    })),
  })
}

// ── project show ──────────────────────────────────────────────────────────────
else if (cmd === "show") {
  const id = args[1]
  if (!id) fail("missing_id", "Usage: bun run project show <project_id>")
  const project = load<Project>(DIRS.projects, id)
  if (!project) fail("not_found", { id })
  ok(project)
}

// ── project update ────────────────────────────────────────────────────────────
else if (cmd === "update") {
  const id = args[1]
  if (!id) fail("missing_id", "Usage: bun run project update <id> --state '...' --next-step '...'")

  const project = load<Project>(DIRS.projects, id)
  if (!project) fail("not_found", { id })

  for (let i = 2; i < args.length; i++) {
    if (args[i] === "--state") project!.currentState = args[++i]
    if (args[i] === "--next-step") project!.nextStep = args[++i]
    if (args[i] === "--status") project!.status = args[++i] as Project["status"]
    if (args[i] === "--description") project!.description = args[++i]
  }
  project!.updatedAt = now()
  save(DIRS.projects, id, project!)
  ok({ status: "ok", id, project })
}

// ── help / unknown ────────────────────────────────────────────────────────────
else {
  console.log(`
Livebase — project management

Commands:
  bun run project create "Name" [--description "..."] [--status active]
  bun run project list
  bun run project show <project_id>
  bun run project update <project_id> [--state "..."] [--next-step "..."] [--status active]

All output is JSON.
`)
  process.exit(cmd === "--help" || cmd === "help" ? 0 : 1)
}
