---
name: livebase
description: |
  Local-first work continuity engine for humans and agents. Use when work should continue from the last unresolved evidence gap instead of restarting from zero, especially when you need to checkpoint a task, resume it later, generate an execution contract, or write back a verification ledger.
---

# Livebase

Use `Livebase` to continue interrupted work from the right next step.

## Workflow

1. `setup` once.
2. `task create` when a new work thread starts.
3. `checkpoint` when a task pauses or blocks.
4. `resume` before active work.
5. `contract` before delegated or bounded execution.
6. `writeback` after evidence-backed work completes.

## Command Examples

```bash
bun run setup
bun run task create "Screen candidate" --goal "Continue from the right evidence gap"
bun run checkpoint <task_id> --reason blocked --evidence-gap "What is missing?::Inspect the source"
bun run resume <task_id>
bun run contract <task_id>
cat ledger.json | bun run writeback
```

If your host supports MCP, use the same loop through:

- `livebase.task.resume`
- `livebase.task.contract`
- `livebase.task.writeback`
- `livebase.task.checkpoint`
- `livebase.task.resolve_gap`

Host-side prompt guidance lives in [../../docs/host-adapter-prompt-contract.md](../../docs/host-adapter-prompt-contract.md).
Copy-paste host presets live in [../../docs/adapter-presets/README.md](../../docs/adapter-presets/README.md).

## Guardrails

- Do not treat `Livebase` as generic AI memory.
- Do not write back narrative fluff.
- Do not close evidence gaps without observed support.
- Do not dump entire transcripts when a smaller continuation pack will do.
