# Livebase Task Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal task runtime that stores unresolved evidence gaps and resumes interrupted work with a recovery-focused next action.

**Architecture:** Introduce a persisted `Task` object plus embedded `MissingEvidence` and `Checkpoint` records. Add `task` and `resume` CLI commands without breaking the existing project/context-pack flow, then prove the new behavior through integration tests.

**Tech Stack:** Bun, TypeScript, Zod, flat JSON store

---

## File Structure

- Modify: `D:\AI Pro\ai-lab\livebase\schemas\objects.ts`
- Modify: `D:\AI Pro\ai-lab\livebase\schemas\index.ts`
- Modify: `D:\AI Pro\ai-lab\livebase\scripts\lib\store.ts`
- Create: `D:\AI Pro\ai-lab\livebase\scripts\task.ts`
- Create: `D:\AI Pro\ai-lab\livebase\scripts\resume.ts`
- Modify: `D:\AI Pro\ai-lab\livebase\package.json`
- Modify: `D:\AI Pro\ai-lab\livebase\README.md`
- Modify: `D:\AI Pro\ai-lab\livebase\tests\integration.test.ts`

### Task 1: Add Task Runtime Schemas and Store Support

**Files:**
- Modify: `D:\AI Pro\ai-lab\livebase\schemas\objects.ts`
- Modify: `D:\AI Pro\ai-lab\livebase\schemas\index.ts`
- Modify: `D:\AI Pro\ai-lab\livebase\scripts\lib\store.ts`

- [ ] **Step 1: Write the failing schema/store test**

Add an integration assertion that `bun run init` creates a `tasks` directory and that task objects validate through the schema.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/integration.test.ts`
Expected: FAIL because `tasks` store support and task schema do not exist yet

- [ ] **Step 3: Write minimal implementation**

Add `Task`, `MissingEvidence`, and `Checkpoint` schemas plus `tasks` directory support in the store helper.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/integration.test.ts`
Expected: PASS for the new store/schema assertions

### Task 2: Add Task CLI Lifecycle

**Files:**
- Create: `D:\AI Pro\ai-lab\livebase\scripts\task.ts`
- Modify: `D:\AI Pro\ai-lab\livebase\package.json`
- Test: `D:\AI Pro\ai-lab\livebase\tests\integration.test.ts`

- [ ] **Step 1: Write the failing integration tests**

Add tests for:
- `task create`
- `task checkpoint`
- `task resolve-evidence`

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/integration.test.ts`
Expected: FAIL because the `task` script and npm command do not exist

- [ ] **Step 3: Write minimal implementation**

Implement CLI subcommands that persist task state and checkpoints in `store/tasks/`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/integration.test.ts`
Expected: PASS for task lifecycle behavior

### Task 3: Add Resume Command

**Files:**
- Create: `D:\AI Pro\ai-lab\livebase\scripts\resume.ts`
- Modify: `D:\AI Pro\ai-lab\livebase\package.json`
- Test: `D:\AI Pro\ai-lab\livebase\tests\integration.test.ts`

- [ ] **Step 1: Write the failing resume tests**

Add tests that prove:
- `resume` returns the primary open evidence gap
- `resume` uses the gap's `suggestedAction` as the recovery action
- `resume` falls back to task-level `nextAction` when no evidence gap remains

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/integration.test.ts`
Expected: FAIL because the `resume` command does not exist

- [ ] **Step 3: Write minimal implementation**

Implement recovery-focused `resume` output with project and residue context.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/integration.test.ts`
Expected: PASS for resume behavior

### Task 4: Update Public Surface

**Files:**
- Modify: `D:\AI Pro\ai-lab\livebase\README.md`

- [ ] **Step 1: Update the command list and quick start**

Document `task` and `resume` as the new task-runtime entrypoints.

- [ ] **Step 2: Verify docs are accurate**

Run:
- `bun run task --help`
- `bun run resume --help`

Expected: help output matches README examples

### Task 5: Full Verification

**Files:**
- Test: `D:\AI Pro\ai-lab\livebase\tests\integration.test.ts`

- [ ] **Step 1: Run the full suite**

Run: `bun test`
Expected: all tests pass

- [ ] **Step 2: Smoke-test the new runtime manually**

Run:
- `bun run init`
- `bun run project create "Smoke Project"`
- `bun run task create "Smoke Task" --goal "Resume correctly" --missing-evidence "Confirm missing evidence" --next-action "Inspect the unresolved evidence"`
- `bun run resume <task_id>`

Expected: resume output highlights the missing evidence and next action

