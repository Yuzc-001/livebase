# Livebase

[English](./README.md) | **简体中文**

[![Version](https://img.shields.io/badge/version-v0.1.0-0f172a?style=flat-square)](./package.json)
[![Runtime](https://img.shields.io/badge/runtime-Bun-f59e0b?style=flat-square)](https://bun.sh)
[![Surface](https://img.shields.io/badge/interface-CLI%20%2B%20MCP-2563eb?style=flat-square)](./src/mcp/server.ts)

让被打断的工作，不用从零重来。

`Livebase` 是一个本地优先的工作连续性引擎，服务人和 agent。  
它不是 AI memory，不是通用知识库，也不是一个什么都想装进去的 agent 平台。

它的中心非常简单：

> 让真实工作从上一次尚未解决的证据缺口继续，而不是重新理解一遍

## 为什么是 Livebase

大多数工具保存的是文本。  
`Livebase` 保存的是“下一轮真正能继续工作的最小可信接力包”。

这意味着：

- 当前任务线程始终明确
- 阻塞点会沉淀成一等公民的 evidence gap
- 下一轮从一个清晰的 next step 开始
- 执行发生在明确的 contract 边界里
- 完成后的结果以 verification ledger 回写，而不是一段模糊总结

## 产品形状

`Livebase` 由三层组成：

1. 知识底座  
   稳定的 source、项目上下文、可复用标准。
2. 工作沉积层  
   活跃工作过程中产生的 checkpoint、blocker、evidence gap 和 next action。
3. 连续性引擎  
   决定工作如何继续、agent 拿到什么 contract、哪些验证结果应该被写回的运行时。

前两层是基础。  
第三层才是产品中心。

它同时也是一个“注意力水合层”：

> 下一轮运行开始时，最重要的约束应该先被重新水合到最高注意力位置

## 核心循环

```text
SETUP      -> 初始化本地 store
CHECKPOINT -> 记录当前状态、阻塞点和证据缺口
RESUME     -> 恢复最小可信下一步
CONTRACT   -> 生成有边界的执行契约
ACT        -> 在 adapter 或 host agent 内执行
WRITEBACK  -> 回写带证据和残余不确定性的验证账本
STRENGTHEN -> 让下一轮继续更小、更准
```

## 快速开始

```bash
# 1. 安装依赖
bun install

# 2. 初始化本地 store
bun run setup

# 3. 创建项目
bun run project create "Hiring Loop" --description "后端候选人评估"

# 4. 摄入一份 source
bun run source ingest ./resume.md --project <project_id> --title "Candidate Resume"

# 5. 创建一个带 evidence gap 的任务
bun run task create "Screen candidate" \
  --goal "从正确的 evidence gap 继续候选人筛选" \
  --project <project_id> \
  --current-state "第一轮浏览已经完成" \
  --next-action "仔细检查简历里的 ownership 证据" \
  --evidence-gap "Did they lead incidents?::Inspect the resume for incident ownership"

# 6. 恢复任务
bun run resume <task_id>

# 可选：同时带出一个派生的 continuation register
bun run resume <task_id> --with-register

# 7. 生成执行 contract
bun run contract <task_id>

# 8. 写回 verification ledger
cat ledger.json | bun run writeback
```

## CLI 面

| 命令 | 作用 |
|---|---|
| `bun run setup` | 初始化本地 store |
| `bun run doctor` | 检查 store 健康和对象计数 |
| `bun run preset list` | 列出可发现的 preset id |
| `bun run preset loader-plan <preset_id> [--task-id <task_id>]` | 输出机器可消费的 preset + loader plan JSON |
| `bun run project ...` | 管理 continuity 容器 |
| `bun run source ingest ...` | 摄入稳定 source |
| `bun run task create/show/resolve-gap ...` | 管理任务线程 |
| `bun run checkpoint ...` | 记录暂停点、阻塞点和证据缺口 |
| `bun run resume <task_id> [--with-register]` | 恢复 primary evidence gap 和 next step，并可选派生一个 continuation register |
| `bun run contract <task_id>` | 构建执行 contract |
| `bun run writeback` | 应用 verification ledger 并持久化 residue |

所有 CLI 命令都向 stdout 输出 JSON。  
错误向 stderr 输出 JSON。

## MCP 面

`Livebase` 同时暴露了完整的 MCP 工作面：

```bash
bun run mcp
```

可用工具：

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

无论成功还是失败，都应该把 `structuredContent` 当成规范载荷。

如果 host 希望在同一响应里拿到派生的 continuation register，可以这样调用：

```json
{
  "taskId": "tsk-...",
  "includeRegister": true
}
```

MCP 配置示例：

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

## 可机器装载的 Adapter Presets

`Livebase` 现在同时提供两层 host 接入资产：

- 通用 host contract  
  见 [docs/host-adapter-prompt-contract.md](./docs/host-adapter-prompt-contract.md)
- continuation register 协议  
  见 [docs/continuation-register-v1.md](./docs/continuation-register-v1.md)
- 可直接复制的 host preset  
  见 [docs/adapter-presets/README.md](./docs/adapter-presets/README.md)

同时也提供真正可机器加载的 prompt 资产，位于 [presets/adapter-presets/](./presets/adapter-presets/README.md)：

- `*.prompt.md` 作为源文件
- `registry.json` 作为机器可读的 preset 索引和 host loader 契约
- `dist/*.txt` 作为编译后的 prompt 文本

每个 preset 现在还显式声明：

- `resume` 是否必须带 `includeRegister=true`
- register 注入应读取 `continuationRegister.promptBlock`
- 这个 block 应该放在 host 的最高注意力位置
- 一旦和 fresh `resume` 冲突，应以 fresh `resume` 为准

构建 preset 产物：

```bash
bun run presets:build

# 可选：先发现可用 preset
bun run preset list

# 可选：输出 host 可直接消费的 loader plan
bun run preset loader-plan codex --task-id <task_id>
```

当前内置四个 preset：

- `codex`
- `claude-code`
- `openai-responses-host`
- `orchestrator`

## 稳定错误契约

MCP 工具失败时会统一返回 `isError: true`，并带一个结构化错误对象。  
host 至少应该分支处理：

- `error.code`
- `error.category`
- `error.retryable`

示例：

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

## 文档入口

- [PROJECT.md](./PROJECT.md)  
  产品方向和边界。
- [docs/continuation-register-v1.md](./docs/continuation-register-v1.md)  
  面向 host 的下一轮状态水合协议。
- [docs/host-adapter-prompt-contract.md](./docs/host-adapter-prompt-contract.md)  
  所有 host 共用的 adapter contract。
- [docs/adapter-presets/README.md](./docs/adapter-presets/README.md)  
  面向人的 preset 说明。
- [presets/adapter-presets/README.md](./presets/adapter-presets/README.md)  
  面向机器的 prompt 资产入口和 loader 契约。

## 仓库方向

仓库正在收敛成这样一套分层：

- `src/cli/` 负责 CLI 入口
- `src/core/` 负责连续性逻辑和持久化
- `src/mcp/` 负责 MCP 服务面
- `src/presets/` 负责 preset 资产编译
- `presets/adapter-presets/` 负责机器可装载的 prompt 资产
- `tests/` 负责 CLI、MCP 和 preset 校验

## 当前状态

`Livebase v0.1` 只想先证明一件事：

> 被打断的工作，应该从最后一个未解决的证据缺口继续，而不是从零重新理解
