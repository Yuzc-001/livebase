# Livebase Adapter Preset Assets

This directory contains machine-loadable preset assets.

## Asset Model

- `*.prompt.md`
  Source of truth for each preset.
- `registry.json`
  Machine-readable preset index and host loader contract.
- `dist/*.txt`
  Compiled prompt payloads with frontmatter removed.

## Loader Contract

Each preset entry in `registry.json` now includes a `loader` section.

Current shared loader fields are:

- `resume.includeRegister = true`
- `register.source = continuationRegister.promptBlock`
- `register.position = top_of_attention`
- `register.policy = if_present`
- `register.conflictResolution = fresh_resume_wins`

That means a host loader can:

1. read the preset by id
2. call `livebase.task.resume` with the declared `resume` options
3. inject `continuationRegister.promptBlock` when present
4. prefer fresh `resume` state over stale cached register text

`registry.json` is therefore not just an index.
It is the executable loading contract for host adapters and orchestrators.

If you want a built-in runtime helper for this flow, use:

- `src/presets/loader.ts`

## Build

```bash
bun run presets:build
```

## Presets

- `codex`
- `claude-code`
- `openai-responses-host`
- `orchestrator`
