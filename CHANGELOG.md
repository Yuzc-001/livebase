# Changelog

## v0.1.0 (2026-04-02)

First formal release of the rebuilt Livebase continuity engine.

### Product
- redefine Livebase as a local-first work continuity engine, not an AI memory app
- center runtime on unresolved evidence gaps and next-action recovery
- establish the continuity loop: `resume -> contract -> act -> writeback`
- add bilingual docs and clarified product boundary (`PROJECT.md`, `README.md`, `README.zh-CN.md`)

### Core Runtime
- add rebuilt `src/core/*` modules for project, source, task, contract, register, writeback, and store
- add first-class evidence-gap management and checkpoint/resume flow
- add derived `Continuation Register v1` with prompt-safe XML block rendering
- add stable structured error surface for missing task/project/evidence gap and invalid inputs

### Interfaces
- add CLI-first commands for setup, doctor, project/source/task operations, checkpoint, resume, contract, and writeback
- add optional register hydration in resume (`--with-register` and `includeRegister=true`)
- add machine-loadable preset registry and compiled prompt assets (`presets/adapter-presets/*`)
- add preset discovery/load surfaces:
  - CLI: `livebase preset list`
  - CLI: `livebase preset loader-plan <preset_id> [--task-id <task_id>]`
  - MCP: `livebase.preset.list`
  - MCP: `livebase.preset.loader_plan`

### Host Loader Contract
- formalize `registry.json` as executable loader contract, not just a preset index
- encode register injection contract in machine fields:
  - `resume.includeRegister=true`
  - `register.source=continuationRegister.promptBlock`
  - `register.position=top_of_attention`
  - `register.policy=if_present`
  - `register.conflictResolution=fresh_resume_wins`
- add runtime helper for host/orchestrator integration: `src/presets/loader.ts`

### Validation
- add MCP integration tests and structured error contract tests
- add preset asset validation and preset loader runtime tests
- add continuation register escaping tests
- add 200-case pressure matrix and rebuilt e2e continuity tests
- final release verification: `bun run presets:build` + `bun test` all passing

### Breaking from Legacy
- remove legacy `schemas/` + `scripts/` stack from previous prototype architecture
- remove legacy demo store artifacts and align repository around rebuilt `src/` architecture
