#!/usr/bin/env bun
// bun run ingest <file_path> [--project <project_id>] [--title "..."] [--tags "a,b"]
//
// Reads a file, wraps it as a Source object, saves to store/sources/.
// If --project is given, links the source to that project.
// Returns: { status, id, source }

import { readFileSync, existsSync } from "fs"
import { resolve, basename, extname } from "path"
import { DIRS, save, load, makeId, now, ok, fail } from "./lib/store.ts"
import { SourceSchema, type Source, type Project } from "../schemas/objects.ts"

if (process.argv.includes("--help")) {
  console.log(`
Usage: bun run ingest <file_path> [options]

Options:
  --project <id>     Link source to a project
  --title "..."      Override title (default: filename)
  --tags "a,b,c"     Comma-separated tags

Output: JSON { status, id, source }

Examples:
  bun run ingest ./notes/role-definition.md --project proj-hiring-backend-lv3kj
  bun run ingest ./docs/spec.md --project proj-livebase-main-abc --title "Livebase Spec v2"
`)
  process.exit(0)
}

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
let filePath: string | undefined
let projectRef: string | undefined
let titleArg: string | undefined
let tags: string[] = []

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--project") projectRef = args[++i]
  else if (args[i] === "--title") titleArg = args[++i]
  else if (args[i] === "--tags") tags = args[++i].split(",").map((t) => t.trim())
  else if (!filePath && !args[i].startsWith("--")) filePath = args[i]
}

if (!filePath) fail("missing_file_path", "Usage: bun run ingest <file_path>")

const fullPath = resolve(filePath!)
if (!existsSync(fullPath)) fail("file_not_found", { path: fullPath })

// ── Read & build Source ───────────────────────────────────────────────────────
const raw = readFileSync(fullPath, "utf-8")
const ext = extname(fullPath).toLowerCase()
const title = titleArg ?? basename(fullPath, ext)

const sourceType = [".md", ".txt"].includes(ext)
  ? ("document" as const)
  : ext === ".ts" || ext === ".js" || ext === ".py"
  ? ("file" as const)
  : ("other" as const)

const id = makeId("src", title)

const source: Source = SourceSchema.parse({
  id,
  type: "source",
  title,
  content: raw,
  sourceType,
  sourcePath: fullPath,
  projectRef: projectRef ?? undefined,
  entityRefs: [],
  tags,
  capturedAt: now(),
  updatedAt: now(),
})

save(DIRS.sources, id, source)

// ── Link to project ───────────────────────────────────────────────────────────
if (projectRef) {
  const project = load<Project>(DIRS.projects, projectRef)
  if (project) {
    project.sourceRefs = [...new Set([...project.sourceRefs, id])]
    project.updatedAt = now()
    save(DIRS.projects, projectRef, project)
  }
}

ok({ status: "ok", id, source })
