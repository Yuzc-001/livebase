# Livebase 0.3 Task Runtime Design

**Status:** approved for implementation

## Goal

Shift `Livebase` from project-centric context packaging toward task-centric recovery.

The first recovery primitive should not be "load more history." It should be:

1. identify the most important unresolved evidence gap in the current task
2. return the next action that fills that gap

## Product Thesis

`Livebase` should help an agent resume interrupted work by recovering the smallest trustworthy next step, not by replaying the whole project.

For `v0.3`, the first-class object is not generic memory. It is the task's unresolved missing evidence.

## Scope

This slice introduces a minimal task runtime:

- `Task` object persisted in the store
- `MissingEvidence` items attached to a task
- task checkpoints that record state, blocker, and next action
- a `resume` command that returns the highest-priority open evidence gap and a recovery action

This slice does **not** attempt:

- generic semantic search
- vector retrieval
- full workflow engine behavior
- plugin-based adapters
- broad note/entity promotion

## Core Objects

### Task

Persistent container for one interrupted or ongoing unit of work.

Required fields:

- `id`
- `title`
- `goal`
- `status`
- `projectRef?`
- `sourceRefs`
- `residueRefs`
- `currentState?`
- `currentBlocker?`
- `nextAction?`
- `missingEvidence[]`
- `checkpoints[]`
- `createdAt`
- `updatedAt`

### MissingEvidence

Represents a single unresolved evidence gap blocking confident progress.

Required fields:

- `id`
- `question`
- `status` (`open` | `resolved` | `superseded`)

Optional fields:

- `whyItMatters`
- `suggestedAction`
- `sourceRefs`
- `createdAt`
- `resolvedAt`

### Checkpoint

Snapshot of task state at a meaningful stop.

Required fields:

- `at`
- `reason` (`pause` | `blocked` | `handoff` | `completed` | `manual`)

Optional fields:

- `summary`
- `nextAction`
- `blocker`
- `missingEvidenceIds`

## CLI Surface

### `bun run task create`

Creates a task linked to a project or standalone work thread.

Minimum:

- title
- goal

Optional:

- project ref
- current state
- next action
- blocker
- repeated `--missing-evidence`

### `bun run task checkpoint`

Updates task runtime state and appends a checkpoint.

Supports:

- summary
- next action
- blocker
- checkpoint reason
- repeated `--missing-evidence`

### `bun run task resolve-evidence`

Marks one missing-evidence item as resolved.

Optional:

- next action update
- state update

### `bun run resume <task_id>`

Returns a task resume pack focused on action recovery.

Expected output:

- task id and goal
- current state
- current blocker
- primary open evidence gap
- recovery next action
- count of remaining open evidence gaps
- supporting project context
- supporting residue refs

## Recovery Rules

`resume` should follow this order:

1. newest open missing-evidence item with a suggested action
2. newest open missing-evidence item without a suggested action, with generated fallback action
3. task-level `nextAction`
4. if no actionable recovery exists, report that human clarification is needed

The response should optimize for "what should the agent do next" rather than "what should the agent read next."

## Testing Strategy

Two new behavior clusters must be proven:

1. task lifecycle
   - create task
   - checkpoint task with missing evidence
   - resolve evidence

2. resume behavior
   - returns the primary open evidence gap
   - prefers evidence-driven next action over broad task summary
   - falls back cleanly when no evidence gap remains

## Success Criteria

This slice is successful if:

- `Livebase` can persist task-specific unresolved evidence
- a fresh session can recover one trustworthy next action from that task
- the recovery output is smaller and more actionable than current project retrieval

## Non-Goals for This Slice

- replacing `retrieve`
- deprecating `Project`
- automatic extraction of evidence gaps from arbitrary chats
- adapter-specific task execution logic

