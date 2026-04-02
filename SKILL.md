---
name: livebase
description: |
  Local-first work continuity engine for humans and agents. Use when work should continue from the last unresolved evidence gap instead of restarting from zero, especially when you need to checkpoint a task, resume it later, generate an execution contract, or write back a verification ledger.
---

# Livebase

Use `Livebase` when the problem is not "remember more" but "continue work correctly."

The center is:

> resume real work from the last unresolved evidence gap

## Core Rules

1. Resume before acting.
2. Checkpoint when work pauses, blocks, or hands off.
3. Generate a contract before bounded execution.
4. Write back a verification ledger, not an essay.
5. Persist only the smallest durable residue.

## Command Loop

```bash
bun run setup
bun run task create "Title" --goal "..."
bun run checkpoint <task_id> --evidence-gap "question::suggested action"
bun run resume <task_id>
bun run contract <task_id>
bun run writeback
```

If the host supports MCP, prefer the tool surface:

- `livebase.task.resume`
- `livebase.task.contract`
- `livebase.task.writeback`
- `livebase.task.checkpoint`
- `livebase.task.resolve_gap`

Host-side prompt guidance lives in [docs/host-adapter-prompt-contract.md](./docs/host-adapter-prompt-contract.md).
Copy-paste host presets live in [docs/adapter-presets/README.md](./docs/adapter-presets/README.md).

## When To Use

- A recurring task should continue tomorrow without re-reading everything.
- An agent is about to start work and needs a bounded contract.
- A task is blocked and the exact evidence gap needs to be preserved.
- Completed work should improve the next run through residue.

## When Not To Use

- You only need a generic note-taking tool.
- You want to dump full transcripts into storage.
- You are looking for a broad chat memory system.

## Agent Behavior

- Prefer source-linked grounding over free-floating summaries.
- Preserve the exact evidence gap that blocks progress.
- Use `resume` to recover the next step, not to fetch broad history.
- Use `contract` to define boundaries before external execution.
- Use `writeback` only with observed checks, remaining ambiguity, and durable residue.
- Do not save every thought. Save what will make the next run better.
