#!/usr/bin/env bun
// bun run retrieve <project_id> [--purpose "..."]
//
// Generates a ContextPack: smallest reliable bundle for work continuation.
// Gathers all objects linked to the project and assembles them into a pack.
// Saves pack to store/context-packs/ and prints to stdout.
// Returns: ContextPack JSON

import { DIRS, save, load, makeId, now, ok, fail } from "./lib/store.ts"
import {
  type Source,
  type Note,
  type Entity,
  type Residue,
  type Project,
  ContextPackSchema,
} from "../schemas/objects.ts"

if (process.argv.includes("--help")) {
  console.log(`
Usage: bun run retrieve <project_id> [--purpose "..."]

Generates a ContextPack from all objects linked to the project.
Output is JSON — read it before starting work on this project.

Examples:
  bun run retrieve proj-hiring-backend-lv3kj
  bun run retrieve proj-livebase-main-abc --purpose "continue v0.2 implementation"
`)
  process.exit(0)
}

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
let projectId: string | undefined
let purpose: string | undefined

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--purpose") purpose = args[++i]
  else if (!projectId && !args[i].startsWith("--")) projectId = args[i]
}

if (!projectId) fail("missing_project_id", "Usage: bun run retrieve <project_id>")

// ── Load project ──────────────────────────────────────────────────────────────
const project = load<Project>(DIRS.projects, projectId!)
if (!project) fail("project_not_found", { id: projectId })

// ── Gather linked objects ─────────────────────────────────────────────────────
const sources = (project!.sourceRefs ?? [])
  .map((id) => load<Source>(DIRS.sources, id))
  .filter(Boolean) as Source[]

const notes = (project!.noteRefs ?? [])
  .map((id) => load<Note>(DIRS.notes, id))
  .filter(Boolean) as Note[]

const entities = (project!.entityRefs ?? [])
  .map((id) => load<Entity>(DIRS.entities, id))
  .filter(Boolean) as Entity[]

// Most recent residue first (most useful for continuation)
const residue = (project!.residueRefs ?? [])
  .map((id) => load<Residue>(DIRS.residue, id))
  .filter(Boolean)
  .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)) as Residue[]

// ── Assemble ContextPack ──────────────────────────────────────────────────────
const id = makeId("pack", projectId!)

const pack = ContextPackSchema.parse({
  id,
  type: "context-pack",
  purpose: purpose ?? `Work continuation: ${project!.name}`,
  projectRef: projectId,
  projectContext: project,
  sources,
  notes,
  entities,
  residue,
  summary: [
    `Project: ${project!.name} [${project!.status}]`,
    project!.currentState ? `State: ${project!.currentState}` : null,
    project!.nextStep ? `Next: ${project!.nextStep}` : null,
    `${sources.length} sources · ${notes.length} notes · ${entities.length} entities · ${residue.length} residue`,
  ]
    .filter(Boolean)
    .join(" | "),
  freshness: now(),
})

save(DIRS.contextPacks, id, pack)
ok(pack)
