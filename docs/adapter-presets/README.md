# Adapter Presets

These presets turn the generic Livebase host contract into copy-pasteable overlays for specific hosts.

Use these when you do not want each host to reinterpret `resume / contract / writeback` on its own.

## Included Presets

- [codex.md](./codex.md)
  Use for Codex-style coding hosts with shell, file, and verification access.
- [claude-code.md](./claude-code.md)
  Use for Claude Code style terminal agents and long-running handoff-heavy sessions.
- [openai-responses-host.md](./openai-responses-host.md)
  Use for custom hosts built on the OpenAI Responses API or similar tool-calling runtimes.
- [orchestrator.md](./orchestrator.md)
  Use for parent coordinators that fan work out to child agents and aggregate one final writeback.

## Selection Rule

- Choose `codex` when one agent both edits and verifies.
- Choose `claude-code` when one agent both edits and checkpoints across longer sessions.
- Choose `openai-responses-host` when the host is an API runtime rather than a desktop coding shell.
- Choose `orchestrator` when one coordinator delegates work to multiple workers.

## Shared Requirements

Every preset assumes the same Livebase MCP surface:

- `livebase.task.resume`
- `livebase.task.contract`
- `livebase.task.writeback`
- `livebase.task.checkpoint`
- `livebase.task.resolve_gap`

And the same core rules:

1. One host run serves exactly one `taskId`.
2. `resume` comes before action.
3. `contract` comes before tool-heavy execution or delegation.
4. `writeback` is a verification ledger, not a summary.
5. `structuredContent` is canonical for both success and error results.

## Machine Loader Contract

`presets/adapter-presets/registry.json` is not only a preset catalog.
It is the machine-loadable host loader contract for each preset.

Every preset now declares:

- whether `livebase.task.resume` must request `includeRegister=true`
- which register field should be injected into the host prompt
- where that block should be injected
- whether the injection is conditional
- how conflicts should be resolved

Current loader defaults are:

- `resume.includeRegister = true`
- `register.source = continuationRegister.promptBlock`
- `register.position = top_of_attention`
- `register.policy = if_present`
- `register.conflictResolution = fresh_resume_wins`

That means a host loader can follow one fixed sequence without reading prose docs first:

1. Load the preset entry from `registry.json`.
2. Call `livebase.task.resume` with the declared loader options.
3. If `continuationRegister.promptBlock` is present, inject it at the declared high-attention position.
4. If a stale cached register disagrees with the fresh `resume` payload, discard the stale one.

This keeps Codex, Claude Code, OpenAI-hosted runtimes, and orchestrators from each inventing their own register-loading semantics.

If you want code-level helpers for this contract, use:

- `src/presets/loader.ts`

## Suggested Adapter Names

- `codex`
- `claude-code`
- `openai-responses-host`
- `orchestrator`

Use the same string in:

- `livebase.task.contract -> adapter`
- `livebase.task.writeback -> run.executor`

## Start Here

Read the generic contract first:

- [../host-adapter-prompt-contract.md](../host-adapter-prompt-contract.md)

Then choose one preset and copy the prompt overlay into the host's system or developer instructions.
