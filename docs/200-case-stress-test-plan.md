# Livebase 200-Case Stress Test

日期：2026-04-02

## 结论先行

`Livebase` 这个作品是成立的，但它成立的前提不是“它像一个 AI memory 产品”，而是：

> 它能稳定地把一次中断的工作，收敛成一个可恢复的 task thread，并从最后一个未解决的 evidence gap 继续。

如果把产品中心守在这条线上，它是有锋利价值的。  
如果它退化成“存东西 + 总结东西 + 多端同步 + 多 agent 花活”，它会迅速同质化。

这轮压力测试后的判断是：

- 产品方向：`成立`
- 当前主链：`已经成立`
- 可靠性级别：`可用，但还没到硬承诺级`
- 最强护城河：`evidence gap continuity + bounded contract + verification ledger`
- 当前最危险的区：`checkpoint 语义一致性 / store 损坏可见性 / contract writeback 校验 / ID 并发碰撞`

## 这次真正做了什么

这次不是继续写概念 PASS 文档，而是把压力测试落成了真实自动化资产：

- 新增 1 份结论文档  
  [docs/200-case-stress-test-plan.md](/D:/AI%20Pro/ai-lab/livebase/docs/200-case-stress-test-plan.md)
- 新增 1 份 200 case 自动化压测套件  
  [tests/pressure-200.test.ts](/D:/AI%20Pro/ai-lab/livebase/tests/pressure-200.test.ts)

这 200 个 case 全部自动化通过，覆盖 10 个风险面：

| 风险面 | Case 数 |
|---|---:|
| task create invariants | 32 |
| checkpoint transitions | 40 |
| resolve-gap transitions | 24 |
| resume pack correctness | 24 |
| writeback state flow | 32 |
| execution contract integrity | 16 |
| source/project linkage | 16 |
| store and persistence boundaries | 8 |
| MCP structured error contract | 4 |
| preset asset consistency | 4 |
| 合计 | 200 |

## 实际跑出的结果

执行命令：

```bash
bun test
```

本轮结果：

- `216 pass`
- `0 fail`

其中：

- 现有回归测试继续通过
- 新增的 `200` 个压力 case 全部通过

## 这轮压测中发现并已经修掉的裂缝

### 1. writeback 后旧 blocker 残留

问题：

- 任务原本被 block 过
- `writeback` 已经把它推进到 `active / completed / failed`
- 但 `currentBlocker` 还会残留旧值

这会直接破坏“从最后未解决证据缺口继续”的主叙事，因为 resume 拿到的是过期 blocker。

已修复：

- 非 `blocked` 状态下，`writeback` 会清掉 `currentBlocker`
- `blocked` 状态下，`writeback` 会把本次 `run.outcome` 写成当前 blocker

相关文件：

- [src/core/writeback.ts](/D:/AI%20Pro/ai-lab/livebase/src/core/writeback.ts)

### 2. completed + missingEvidence 的矛盾状态

问题：

- `writeback(run.status="completed")`
- 同时又补进了新的 `ambiguity.missingEvidence`

旧行为会得到“任务 completed，但仍有新的 open evidence gaps”。

已修复：

- 当 `missingEvidence` 非空且没有显式覆盖 `taskStatus` 时，任务不会继续留在 `completed`
- 它会回到 `active`，让下一次 resume 能从新的缺口继续

相关文件：

- [src/core/writeback.ts](/D:/AI%20Pro/ai-lab/livebase/src/core/writeback.ts)

### 3. source.ingest 失败却留下孤儿 source

问题：

- 旧实现先写 source，再校验 project
- 如果 `projectRef` 不存在，会抛错，但 source 文件已经落盘

这会制造“失败表面上失败了，底层 store 已经脏了”的账本裂缝。

已修复：

- 先校验 project，再写 source

相关文件：

- [src/core/source.ts](/D:/AI%20Pro/ai-lab/livebase/src/core/source.ts)

### 4. writeback 关闭不存在的 gap 会静默成功

问题：

- `updates.closeEvidenceGapIds` 里给一个不存在的 gap id
- 旧实现会静默忽略，整次 writeback 仍返回成功

这对 continuity engine 很危险，因为它看起来“账已收口”，其实 gap 根本没关。

已修复：

- 现在会显式抛出 `evidence_gap_not_found`

相关文件：

- [src/core/writeback.ts](/D:/AI%20Pro/ai-lab/livebase/src/core/writeback.ts)

### 5. completed checkpoint 仍保留旧 blocker

问题：

- 任务从 blocked 走到 completed
- checkpoint 写了 `reason: completed`
- 旧 blocker 还会留着

已修复：

- `checkpoint(reason="completed")` 会清掉 `currentBlocker`

相关文件：

- [src/core/task.ts](/D:/AI%20Pro/ai-lab/livebase/src/core/task.ts)

## 这个作品为什么是真的，不是概念包

它现在最真实的地方，不是文档，而是这条主链已经闭环：

```text
task
-> checkpoint evidence gap
-> resume continuation pack
-> contract
-> execute
-> verification ledger writeback
-> sharpen next run
```

这和很多“AI memory / skill collection / agent platform”项目的差别是：

- 它不以“存了多少信息”为中心
- 它不以“调了多少 agent”为中心
- 它不以“会不会做梦 / 会不会主动巡检”这种 feature 名字为中心

它真正有价值的是：

> 上次中断时，哪个证据缺口没补上；这次恢复时，最小可信接力包是什么；这次做完之后，系统是否真的变得更容易继续。

这就是它和泛 memory 产品真正分叉的地方。

## 还没过关的红区

虽然这次主链已经更硬了，但还没到“可以自信承诺极限可靠”的程度。当前仍有 5 个高风险缺口：

### 1. checkpoint 的 `reason=blocked` 语义还不够硬

现在如果只写：

- `reason: "blocked"`

但不传：

- `blocker`

任务状态仍可能保持 `active`。  
也就是说，checkpoint 记录和 task.status 仍有分裂空间。

这说明 `checkpoint` 还缺一个更硬的约束：

- 要么 `reason=blocked` 必须带 blocker
- 要么系统自动把 summary / outcome 提升成 blocker

相关文件：

- [src/core/task.ts](/D:/AI%20Pro/ai-lab/livebase/src/core/task.ts)
- [tests/pressure-200.test.ts](/D:/AI%20Pro/ai-lab/livebase/tests/pressure-200.test.ts)

### 2. store 损坏现在会被吞掉

`load()` 遇到坏 JSON 会直接返回 `null`。  
这意味着：

- 数据损坏会伪装成对象不存在
- `doctor` 也看不出 store 正在腐烂

这是本地账本型产品的大忌。

相关文件：

- [src/core/store.ts](/D:/AI%20Pro/ai-lab/livebase/src/core/store.ts)

### 3. makeId 仍然可能并发碰撞

`makeId()` 现在主要靠：

- prefix
- slug
- `Date.now()`

在多 agent 并发、同毫秒创建、同名对象的情况下，仍有碰撞和覆盖风险。

相关文件：

- [src/core/store.ts](/D:/AI%20Pro/ai-lab/livebase/src/core/store.ts)

### 4. writeback 还没有验证 contract ownership

`VerificationLedger` 里可以带 `contractRef`，但当前 writeback 没有校验：

- contract 是否存在
- contract 是否属于这个 task
- contract 是否已经过期

这意味着“写回账本”和“执行契约”之间还没有完全合账。

相关文件：

- [src/core/writeback.ts](/D:/AI%20Pro/ai-lab/livebase/src/core/writeback.ts)
- [src/core/schemas.ts](/D:/AI%20Pro/ai-lab/livebase/src/core/schemas.ts)

### 5. MCP schema 失败还不是统一 structured error

当前稳定错误契约已经覆盖了工具处理期的大部分错误。  
但如果参数在 MCP schema 层就失败，宿主仍可能拿到 transport 级错误，而不是 `structuredContent.error`。

这会影响 host adapter 的稳定消费。

相关文件：

- [src/mcp/server.ts](/D:/AI%20Pro/ai-lab/livebase/src/mcp/server.ts)

## 对“这个作品是否真的可以”的最终判断

我的最终判断不是“它已经完美”，而是：

### 可以成立的条件

- 继续把产品中心守在 `evidence gap continuity`
- 不把它讲成 generic AI memory
- 不让 writeback 退化成 AI 小作文回填
- 不让 resume 退化成 dump context
- 不让 contract 退化成漂亮但没约束力的 prompt 模板

### 会失效的条件

- 一旦开始围绕 feature 名称做叙事，而不是围绕“减少 restart cost”做叙事
- 一旦 store 不可信，writeback 不可信，resume 就会一起塌
- 一旦允许多个 agent 并发无纪律写同一条 task thread，账本很快会裂

### 现在最值钱的下一步

不是继续加功能，而是继续补这 4 层硬度：

1. `checkpoint` 的 blocked 语义硬化
2. store corruption visibility
3. contract ownership validation in writeback
4. ID / 并发写保护

## 一句话总结

`Livebase` 现在已经不是一个“看上去像 AI memory 的概念作品”，而是一个已经跑通主链的 continuity engine。  
这次 200-case 压力测试证明了它的方向是真能站住的，但也同时暴露出：要想从“可用”走到“可信”，接下来必须继续把状态机、账本边界和并发纪律做硬。
