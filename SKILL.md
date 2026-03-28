---
name: livebase
description: |
  Local durable working context base for AI agents (Codex, Claude Code, etc.).
  Reduces restart cost for recurring tasks by preserving context, standards, decisions, and residue across sessions.
  Use when: starting a recurring task (retrieve), finishing work (writeback), ingesting new material (ingest), or packaging a task for an adapter (pack).
---

# Livebase

## What this skill does

Keeps durable working context alive so recurring agent tasks do not restart from zero.

The center is not storage. The center is:

> **durable working context for recurring real work**

---

## Prerequisites

```bash
bun install        # install dependencies (run once)
bun run init       # initialize store directories (run once)
```

---

## Commands

All commands output structured JSON to stdout. Errors go to stderr with `{ error, detail }`.

### Initialize (first time only)
```bash
bun run init
# → { status: "ok", store: { sources, notes, projects, ... } }
```

### Create a project
```bash
bun run project create "Project Name" [--description "..."] [--status active]
# → { status: "ok", id: "proj-...", project }

bun run project list
# → { count, projects: [{ id, name, status, sources, notes, residue }] }

bun run project show <project_id>
# → Project JSON

bun run project update <project_id> [--state "current state"] [--next-step "..."]
# → { status: "ok", project }
```

### Ingest a source
```bash
bun run ingest <file_path> [--project <project_id>] [--title "..."] [--tags "a,b"]
# → { status: "ok", id: "src-...", source }
```
Reads the file, creates a Source object, links it to the project's `sourceRefs`.

### Retrieve context (BEFORE starting work)
```bash
bun run retrieve <project_id> [--purpose "why you need this context"]
# → ContextPack JSON  (also saved to store/context-packs/)
```
Returns the smallest reliable bundle for work continuation:
sources + notes + entities + residue linked to the project.

### Package a task for an adapter (hand to grasp, etc.)
```bash
bun run pack <project_id> --goal "What the adapter should achieve" \
  [--task-type screening|evaluation|research|implementation|review|other] \
  [--adapter grasp] [--priority high|medium|low]
# → TaskPackage JSON
```

### Write back residue (AFTER work completes)
```bash
bun run writeback result.json
# OR:
echo '<WriteBackPackage JSON>' | bun run writeback
# → { status, residueId, written, pendingHumanReview }
```
Validates the WriteBackPackage, writes residue to store, updates project state.

---

## Operating loop

```
PREPARE    →  bun run retrieve <project_id>
ACT        →  bun run pack <project_id> --goal "..." → hand TaskPackage to adapter
VERIFY     →  adapter returns evidence-backed WriteBackPackage
WRITE BACK →  bun run writeback result.json
STRENGTHEN →  residue saved; next retrieve includes it automatically
```

---

## Object model

| Object | Role | Store path |
|--------|------|-----------|
| `Source` | Origin-bearing file. Anchor for all abstractions. | `store/sources/` |
| `Note` | Working interpretation on top of a source. | `store/notes/` |
| `Project` | Durable context container. Holds refs to all linked objects. | `store/projects/` |
| `Entity` | Recurring thing with stable identity (person, tool, concept). | `store/entities/` |
| `Residue` | Smallest durable write-back from meaningful work. | `store/residue/` |
| `ContextPack` | Task-oriented retrieval bundle. | `store/context-packs/` |

All objects are flat JSON files. Directly readable, editable, and diffable.

---

## Schema contracts

Validated with Zod. Source of truth: `schemas/`

### TaskPackage (Livebase → adapter)
```
task.{ task_id, goal, task_type, priority }
context.{ project_ref, entity_refs, prior_residue_refs, current_state }
standards.{ hard_requirements, soft_signals, red_flags, action_boundaries }
sources.{ source_refs, note_refs }
execution.{ adapter, allowed_actions, disallowed_actions }
expected_output.{ required_fields, result_shape }
```

### WriteBackPackage (adapter → Livebase)
```
task_result.{ task_id, outcome, status, completed_at }
evidence.{ evidence_summary, source_refs, observed_signals }
ambiguity.{ open_questions, missing_evidence, confidence_note }
residue?.{ residueType, title, body, importance, projectRef }
state_updates?.{ project_ref, project_state_update, next_step }
standard_updates?.{ update_candidate, reason, requires_human_review }
```

---

## Adapters

Execution adapters are not Livebase. They execute in specific environments.

- `grasp` → browser execution adapter
- future → coding environment, document system, email system, etc.

Correct relationship:
```
Livebase prepares context → adapter executes → Livebase writes back residue
```
Livebase owns durable context. Adapters own execution.

---

## Agent role

- **Read with grounding** — prefer source-linked reads over floating summaries
- **Write back conservatively** — smallest durable residue only, not every thought
- **Never replace source with generated summary**
- **Strengthen after meaningful work** — not after every minor step
- **Do not invent structure** without retrieval payoff

---

## Anti-patterns

| ❌ | What goes wrong |
|----|----------------|
| Adapter becomes the memory system | Context lives in browser session, lost next run |
| writeback floods store | Synthetic noise inflates the base, reduces trust |
| Large context dumps in TaskPackage | Adapter gets confused, boundaries drift |
| Source replaced by derived abstraction | Source drift: can't verify what the AI summarized |
| Residue written after trivial steps | Store grows heavy without becoming more useful |

---

## Store layout

```
store/
├── sources/          ← Source objects (origin-bearing)
├── notes/            ← Note objects (working layer)
├── projects/         ← Project objects (continuity containers)
├── entities/         ← Entity objects (stable identities)
├── residue/          ← Residue objects (write-back outputs)
└── context-packs/    ← ContextPack outputs (retrieval bundles)
```

---

## Scripts layout

```
scripts/
├── lib/store.ts      ← Shared store utilities (CRUD, IDs, output helpers)
├── init.ts           ← bun run init
├── project.ts        ← bun run project create|list|show|update
├── ingest.ts         ← bun run ingest <file>
├── retrieve.ts       ← bun run retrieve <project_id>
├── pack.ts           ← bun run pack <project_id> --goal "..."
└── writeback.ts      ← bun run writeback [file.json] | stdin
```
