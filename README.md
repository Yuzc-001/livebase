# Livebase

**English** | [简体中文](./README.zh-CN.md)

[![Version](https://img.shields.io/badge/version-v0.1.0-0f172a?style=flat-square)](./package.json)
[![Runtime](https://img.shields.io/badge/runtime-Bun-f59e0b?style=flat-square)](https://bun.sh)
[![Surface](https://img.shields.io/badge/interface-CLI%20%2B%20MCP-2563eb?style=flat-square)](./src/mcp/server.ts)

Turn interrupted work into resumable work.

`Livebase` is a local-first work continuity engine for humans and agents.  
It does not try to be an AI memory app, a generic knowledge base, or a broad agent platform.

Its center is simple:

> resume real work from the last unresolved evidence gap instead of restarting from zero

## Why Livebase

Most tools preserve text.  
`Livebase` preserves the minimum trustworthy packet needed to continue work.

That means:

- the current task thread stays explicit
- blockers become first-class evidence gaps
- the next run starts from one sharp next step
- execution happens inside a bounded contract
- completed work returns as a verification ledger, not a hand-wavy summary

## Product Shape

`Livebase` combines three layers:

1. Knowledge base  
   Stable source material, project context, and reusable standards.
2. Work sediment  
   Checkpoints, blockers, evidence gaps, and next actions produced during active work.
3. Continuation engine  
   The runtime that decides how work continues, what contract an agent receives, and what verified residue gets written back.

The first two are foundations.  
The third is the product center.

It also acts as an attention hydration layer:

> the next run should start with the right constraints already rehydrated at the top of attention

## Core Loop

```text
SETUP      -> initialize the local store
CHECKPOINT -> record current state, blocker, and evidence gaps
RESUME     -> recover the smallest trustworthy next step
CONTRACT   -> generate a bounded execution contract
ACT        -> do the work in an adapter or host agent
WRITEBACK  -> return a verification ledger with evidence and residue
STRENGTHEN -> make the next run smaller and sharper
```

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Initialize the local store
bun run setup

# 3. Create a project
bun run project create "Hiring Loop" --description "Backend candidate evaluation"

# 4. Ingest a source document
bun run source ingest ./resume.md --project <project_id> --title "Candidate Resume"

# 5. Create a task with an evidence gap
bun run task create "Screen candidate" \
  --goal "Continue the screening task from the right evidence gap" \
  --project <project_id> \
  --current-state "First pass complete" \
  --next-action "Review the resume carefully" \
  --evidence-gap "Did they lead incidents?::Inspect the resume for incident ownership"

# 6. Resume the task
bun run resume <task_id>

# Optional: include a derived continuation register for host injection
bun run resume <task_id> --with-register

# 7. Generate a bounded execution contract
bun run contract <task_id>

# 8. Write back a verification ledger
cat ledger.json | bun run writeback
```

## CLI Surface

| Command | Role |
|---|---|
| `bun run setup` | Initialize the local store |
| `bun run doctor` | Check store health and object counts |
| `bun run preset list` | List available preset ids for discovery |
| `bun run preset loader-plan <preset_id> [--task-id <task_id>]` | Emit machine-consumable preset + loader plan JSON |
| `bun run project ...` | Manage continuity containers |
| `bun run source ingest ...` | Ingest stable source material |
| `bun run task create/show/resolve-gap ...` | Manage task runtime |
| `bun run checkpoint ...` | Record a meaningful stop and evidence gaps |
| `bun run resume <task_id> [--with-register]` | Recover the primary evidence gap and next step, and optionally derive a continuation register |
| `bun run contract <task_id>` | Build an execution contract |
| `bun run writeback` | Apply a verification ledger and persist residue |

All CLI commands emit JSON to stdout.  
Errors emit JSON to stderr.

## MCP Surface

`Livebase` exposes the same continuity loop over MCP:

```bash
bun run mcp
```

Available tools:

- `livebase.system.doctor`
- `livebase.project.create`
- `livebase.project.list`
- `livebase.project.get`
- `livebase.project.update`
- `livebase.preset.list`
- `livebase.preset.loader_plan`
- `livebase.source.ingest`
- `livebase.task.create`
- `livebase.task.list`
- `livebase.task.get`
- `livebase.task.checkpoint`
- `livebase.task.resolve_gap`
- `livebase.task.resume`
- `livebase.task.contract`
- `livebase.task.writeback`

`structuredContent` is canonical for both success and error results.

If a host wants the derived continuation register in the same payload, pass:

```json
{
  "taskId": "tsk-...",
  "includeRegister": true
}
```

Example MCP config:

```json
{
  "mcpServers": {
    "livebase": {
      "command": "bun",
      "args": ["run", "mcp"],
      "cwd": "/path/to/livebase",
      "env": {
        "LIVEBASE_STORE": "/path/to/livebase/store"
      }
    }
  }
}
```

## Machine-Loadable Adapter Presets

`Livebase` ships two layers for host integration:

- generic host contract  
  See [docs/host-adapter-prompt-contract.md](./docs/host-adapter-prompt-contract.md)
- continuation register protocol  
  See [docs/continuation-register-v1.md](./docs/continuation-register-v1.md)
- copy-paste host presets  
  See [docs/adapter-presets/README.md](./docs/adapter-presets/README.md)

It also ships machine-loadable prompt assets in [presets/adapter-presets/](./presets/adapter-presets/README.md):

- `*.prompt.md` as source assets
- `registry.json` as machine-readable preset index and host loader contract
- `dist/*.txt` as compiled prompt payloads

Each preset entry now declares:

- whether `resume` must request `includeRegister=true`
- that register injection should read `continuationRegister.promptBlock`
- that the block belongs at the host's top-attention position
- that stale cached register text loses to fresh `resume`

Build preset outputs:

```bash
bun run presets:build

# Optional: discover available presets first
bun run preset list

# Optional: emit a host-consumable loader plan
bun run preset loader-plan codex --task-id <task_id>
```

Included host presets:

- `codex`
- `claude-code`
- `openai-responses-host`
- `orchestrator`

## Stable Error Contract

MCP tool failures are returned as `isError: true` plus structured error payloads.  
Hosts should branch on:

- `error.code`
- `error.category`
- `error.retryable`

Example:

```json
{
  "ok": false,
  "tool": "livebase.task.get",
  "error": {
    "code": "task_not_found",
    "category": "not_found",
    "message": "Livebase task was not found.",
    "detail": "tsk-missing",
    "retryable": false,
    "target": {
      "type": "task",
      "id": "tsk-missing"
    }
  }
}
```

## Documentation

- [PROJECT.md](./PROJECT.md)  
  Product direction and product boundary.
- [docs/continuation-register-v1.md](./docs/continuation-register-v1.md)  
  Host-side attention hydration protocol for next-run state.
- [docs/host-adapter-prompt-contract.md](./docs/host-adapter-prompt-contract.md)  
  Generic adapter contract for all hosts.
- [docs/adapter-presets/README.md](./docs/adapter-presets/README.md)  
  Human-facing preset guide.
- [presets/adapter-presets/README.md](./presets/adapter-presets/README.md)  
  Machine-loadable prompt asset index and loader contract.

## Repository Direction

The repo is being rebuilt around a clear split:

- `src/cli/` for the CLI entry surface
- `src/core/` for continuity logic and persistence
- `src/mcp/` for the MCP server surface
- `src/presets/` for preset asset compilation
- `presets/adapter-presets/` for machine-loadable prompt assets
- `tests/` for CLI, MCP, and preset validation

## Status

`Livebase v0.1` is focused on proving one thing end-to-end:

> interrupted work should continue from the last unresolved evidence gap, not from zero
