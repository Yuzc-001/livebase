# Changelog

## v0.2.0
- complete rewrite from design-document-only to agent-executable skill
- add `schemas/` — Zod type contracts for all 6 objects, TaskPackage, WriteBackPackage
- add `scripts/` — Bun scripts: init, project, ingest, retrieve, pack, writeback
- add `scripts/lib/store.ts` — shared store utilities (CRUD, ID generation, JSON I/O)
- add `store/` — flat JSON file store for local-first durable context
- rewrite `SKILL.md` — agent-executable commands, operating loop, schema contracts
- add `tests/integration.test.ts` — full end-to-end cycle test via Bun test runner
- standardize all scripts on Bun runtime

## v0.1.0
- establish `Livebase` as a local knowledge-liveliness project
- define working-context decay as the core enemy
- define `keep working context alive` as the product center
- define v0.1 local-core scope and non-goals
