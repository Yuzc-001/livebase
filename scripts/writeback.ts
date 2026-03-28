#!/usr/bin/env bun
// bun run writeback result.json
// echo '<json>' | bun run writeback
//
// Reads a WriteBackPackage (JSON file or stdin).
// Writes residue to store/residue/.
// Updates linked project state if state_updates.project_ref is set.
// Flags standard_updates that require human review.
// Returns: { status, residueId, written, pendingHumanReview }

import { readFileSync } from "fs"
import { DIRS, save, load, makeId, now, ok, fail } from "./lib/store.ts"
import { WriteBackPackageSchema } from "../schemas/write-back.ts"
import { ResidueSchema, type Project } from "../schemas/objects.ts"

if (process.argv.includes("--help")) {
  console.log(`
Usage:
  bun run writeback result.json
  echo '<WriteBackPackage JSON>' | bun run writeback

Accepts a WriteBackPackage and:
  - Writes residue to store/residue/
  - Updates project state if state_updates.project_ref is provided
  - Returns flagged standard updates for human review

The WriteBackPackage shape:
  task_result.{ task_id, outcome, status, completed_at }
  evidence.{ evidence_summary, source_refs, observed_signals }
  ambiguity.{ open_questions, missing_evidence, confidence_note }
  residue?.{ residueType, title, body, importance, projectRef }
  state_updates?.{ project_ref, project_state_update, next_step }
  standard_updates?.{ update_candidate, reason, requires_human_review }
`)
  process.exit(0)
}

// ── Read input: file arg or stdin ─────────────────────────────────────────────
const args = process.argv.slice(2).filter((a) => a !== "--help")
let raw: string

const fileArg = args.find((a) => !a.startsWith("--"))
if (fileArg) {
  raw = readFileSync(fileArg, "utf-8")
} else {
  // Read from stdin (piped input)
  raw = await Bun.stdin.text()
}

if (!raw.trim()) {
  fail("empty_input", "Provide a JSON file path or pipe JSON via stdin")
}

// ── Parse & validate ──────────────────────────────────────────────────────────
let parsed: unknown
try {
  parsed = JSON.parse(raw)
} catch (e) {
  fail("invalid_json", String(e))
}

const result = WriteBackPackageSchema.safeParse(parsed)
if (!result.success) {
  fail("schema_validation_failed", result.error.issues)
}

const pkg = result.data
const written: string[] = []

// ── 1. Write residue ──────────────────────────────────────────────────────────
let residueId: string | undefined

if (pkg.residue) {
  residueId = makeId("res", pkg.residue.title)

  const residue = ResidueSchema.parse({
    id: residueId,
    type: "residue",
    ...pkg.residue,
    taskRef: pkg.task_result.task_id,
    createdAt: now(),
  })

  const savedPath = save(DIRS.residue, residueId, residue)
  written.push(savedPath)

  // ── 2. Link residue to project ─────────────────────────────────────────────
  const projectRef = pkg.residue.projectRef ?? pkg.state_updates?.project_ref
  if (projectRef) {
    const project = load<Project>(DIRS.projects, projectRef)
    if (project) {
      project.residueRefs = [...new Set([...project.residueRefs, residueId])]
      project.updatedAt = now()
      save(DIRS.projects, projectRef, project)
    }
  }
}

// ── 3. Update project state ───────────────────────────────────────────────────
if (pkg.state_updates?.project_ref) {
  const project = load<Project>(DIRS.projects, pkg.state_updates.project_ref)
  if (project) {
    if (pkg.state_updates.project_state_update) {
      project.currentState = pkg.state_updates.project_state_update
    }
    if (pkg.state_updates.next_step) {
      project.nextStep = pkg.state_updates.next_step
    }
    project.updatedAt = now()
    save(DIRS.projects, pkg.state_updates.project_ref, project)
    written.push(`projects/${pkg.state_updates.project_ref} (state updated)`)
  }
}

// ── 4. Surface standard updates for human review ──────────────────────────────
const pendingHumanReview =
  pkg.standard_updates?.requires_human_review ? [pkg.standard_updates] : []

ok({
  status: "ok",
  task_id: pkg.task_result.task_id,
  outcome: pkg.task_result.outcome,
  residueId: residueId ?? null,
  written,
  pendingHumanReview,
  ambiguity: pkg.ambiguity,
})
