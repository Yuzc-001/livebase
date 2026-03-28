# Livebase

**English** | [中文](#中文)

> Keep durable working context alive so recurring agent tasks do not restart from zero.

Livebase is an **AI Agent skill** (for Codex, Claude Code, and similar coding agents). It provides a local-first structured store that lets agents preserve context, standards, decisions, and residue across task sessions.

---

## Quick start

```bash
# 1. Install dependencies
bun install

# 2. Initialize the store
bun run init

# 3. Create a project
bun run project create "My Project" --description "..."

# 4. Ingest source material
bun run ingest ./path/to/file.md --project <project_id>

# 5. Retrieve context before work
bun run retrieve <project_id>

# 6. Package a task for an adapter
bun run pack <project_id> --goal "What the adapter should do" --adapter grasp

# 7. Write back residue after work
bun run writeback result.json
# or: echo '<json>' | bun run writeback

# Run tests
bun test
```

All commands output structured **JSON** to stdout. Errors go to stderr.

---

## Commands

| Command | Description |
|---------|-------------|
| `bun run init` | Initialize store directories |
| `bun run project create\|list\|show\|update` | Manage projects |
| `bun run ingest <file>` | Ingest a source file into the store |
| `bun run retrieve <project_id>` | Generate a ContextPack (before starting work) |
| `bun run pack <project_id> --goal "..."` | Generate a TaskPackage for an adapter |
| `bun run writeback [file.json]` | Process a WriteBackPackage after work |

---

## Operating loop

```
PREPARE    →  bun run retrieve <project_id>
ACT        →  bun run pack <project_id> --goal "..." → hand to adapter
VERIFY     →  adapter returns evidence-backed result
WRITE BACK →  bun run writeback result.json
STRENGTHEN →  residue saved; next retrieve includes it
```

---

## Project layout

```
livebase-main/
├── SKILL.md              ← Agent entry point (read this first)
├── schemas/
│   ├── objects.ts        ← Source, Note, Project, Entity, Residue, ContextPack
│   ├── task-package.ts   ← TaskPackage schema (Livebase → adapter)
│   └── write-back.ts     ← WriteBackPackage schema (adapter → Livebase)
├── scripts/
│   ├── lib/store.ts      ← Shared store utilities
│   ├── init.ts           ← bun run init
│   ├── project.ts        ← bun run project ...
│   ├── ingest.ts         ← bun run ingest
│   ├── retrieve.ts       ← bun run retrieve
│   ├── pack.ts           ← bun run pack
│   └── writeback.ts      ← bun run writeback
├── store/
│   ├── sources/          ← Source JSON files
│   ├── notes/            ← Note JSON files
│   ├── projects/         ← Project JSON files
│   ├── entities/         ← Entity JSON files
│   ├── residue/          ← Residue JSON files
│   └── context-packs/    ← ContextPack JSON files
└── tests/
    └── integration.test.ts  ← Full cycle E2E test
```

---

## Store format

All objects are flat **JSON files** — directly readable, editable, and diffable. No database required.

```
store/projects/proj-my-project-lv3kj.json
store/sources/src-role-definition-lv4ab.json
store/residue/res-ownership-signal-lv5cd.json
```

---

## Adapters

Livebase is the durable context center. Adapters execute in specific environments.

- **grasp** → browser execution adapter
- More adapters can be added without changing the core

```
Livebase (prepares context)
  → TaskPackage → Adapter (executes)
  → WriteBackPackage → Livebase (writes residue)
```

---

## Requirements

- [Bun](https://bun.sh) ≥ 1.0

---

# 中文

> 让持久工作上下文保持活跃，让反复发生的 Agent 任务不再每次从零开始。

Livebase 是一个 **AI Agent Skill**（适用于 Codex、Claude Code 等 coding agent）。它提供一个本地优先的结构化存储层，让 agent 能在任务 session 之间保留上下文、标准、判断和 residue。

### 快速开始

```bash
bun install
bun run init
bun run project create "我的项目"
bun run ingest ./file.md --project <project_id>
bun run retrieve <project_id>   # 开始工作前
bun run writeback result.json   # 完成工作后
```

### 核心循环

```
准备上下文 → 生成 TaskPackage → Adapter 执行 → 写回 residue → 下一轮更强
```

所有命令输出结构化 JSON，错误输出到 stderr。  
详见 [SKILL.md](./SKILL.md) 获取完整 agent 操作指令。
