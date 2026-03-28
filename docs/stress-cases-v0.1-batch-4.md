# Livebase v0.1 — Stress Cases (Batch 4)

日期：2026-03-23  
目标：在新的“durable working context / decision context”中轴下，继续压测 Livebase 是否真的能承接现实任务，而不是停留在知识管理层。

重点压测：
- decision-context loss
- standards drift
- human-agent divergence under real work
- task continuity failure
- evaluation workflow inconsistency
- execution support without archive bloat

---

## Test rubric

每个案例按这 4 项判断：
1. **Pressure point** 这个场景在逼什么错误暴露
2. **Expected behavior** 当前 skill / contract 应采取什么动作
3. **Pass / Partial / Fail** 当前结构是否足够支撑
4. **Reason** 原因

---

## Case 46 — Hiring screening depends on unstated team standards
- Pressure point: decision-context loss
- Scenario: 浏览器能看到简历，但岗位真实要求、团队偏好、文化匹配标准不在当前执行上下文里。
- Expected behavior: system should preserve decision standards and past judgments as callable context, not rely on ad hoc memory.
- Result: PASS
- Reason: rewritten center explicitly includes standards and decision context, not just documents.

## Case 47 — Same role gets evaluated differently across weeks
- Pressure point: standards drift
- Scenario: 同一岗位不同批次候选人被用不同隐性标准筛选，判断越来越不一致。
- Expected behavior: Livebase should keep durable standards + residue-linked decisions so later evaluation stays grounded.
- Result: PASS
- Reason: durable working context now explicitly includes preserved standards and write-back.

## Case 48 — Agent can execute tools, but loses why earlier decisions were made
- Pressure point: task continuity failure
- Scenario: agent 能继续做事，但不知道之前为什么采用这个判断路径。
- Expected behavior: prior decisions should remain available as working context, not disappear into chat history.
- Result: PASS
- Reason: the system is now framed as decision/working context base, not a passive archive.

## Case 49 — Project handoff includes files but not judgment standards
- Pressure point: incomplete context transfer
- Scenario: 交接时有文档、有笔记，但没有“怎么看”“按什么标准看”的上下文。
- Expected behavior: handoff-ready context should include standards and residue, not only artifacts.
- Result: PASS
- Reason: Livebase’s rewritten center now includes standards and task context as first-class concerns.

## Case 50 — Evaluation workflow turns into archive review instead of action support
- Pressure point: archive bloat over execution support
- Scenario: 为了做判断，系统把太多历史材料拖进来，反而让当前筛选任务更重。
- Expected behavior: retrieval should return action-relevant working context, not broad historical dumps.
- Result: PASS
- Reason: context-pack and working-context emphasis both reject archive-first retrieval.

## Case 51 — Human and agent use different standards for the same recurring task
- Pressure point: human-agent divergence
- Scenario: 人心里有一套判断标准，agent 依据散乱资料生成另一套标准，导致协作不稳定。
- Expected behavior: shared durable standards should be preserved in the base so both act from the same context.
- Result: PASS
- Reason: rewritten interaction and agent-role docs explicitly push toward shared durable thread and standards.

## Case 52 — A task keeps restarting because no durable decision residue was written back
- Pressure point: no decision memory compounding
- Scenario: 每轮都重新判断同一类问题，因为上轮判断依据没被写回。
- Expected behavior: small, source-linked decision residue should strengthen the next cycle.
- Result: PASS
- Reason: write-back is already part of the minimum viable core, and now more explicitly tied to decision context.

## Case 53 — A local system looks well-organized but cannot support real browser-assisted execution
- Pressure point: storage/structure disconnected from execution
- Scenario: 系统里东西很多，但无法给 `grasp` 之类执行层提供真正可用的任务上下文。
- Expected behavior: Livebase should be able to emit working context that execution agents can actually use.
- Result: PASS
- Reason: the rewritten center now explicitly frames Livebase as the layer between captured material and real task execution.

## Case 54 — Standards become rigid and block task adaptation
- Pressure point: frozen standards
- Scenario: 历史标准被过度固化，导致新任务、新批次、新上下文变化无法被纳入。
- Expected behavior: standards should remain durable but revisable through source-grounded residue and write-back.
- Result: PASS
- Reason: source preservation + write-back supports updates instead of static doctrine.

## Case 55 — The base becomes too abstract to help day-to-day work
- Pressure point: concept drift away from operational value
- Scenario: 系统越来越像“理念仓库”，但用户每天做事时仍然回到临时笔记和聊天记录。
- Expected behavior: first usage, interaction, and retrieval should keep the system tied to real task continuation.
- Result: PASS
- Reason: the rewritten product center now explicitly judges success by action support, not conceptual completeness.

---

## Score

- **Pass:** 10
- **Partial pass:** 0
- **Fail:** 0

---

## Bottom line

Batch 4 suggests the rewritten Livebase center is stronger than a generic knowledge-system framing:
- it can now be judged against real task continuity and decision-context scenarios
- it is less likely to collapse into passive storage or abstract memory language
- it is moving toward a clearer role as the durable working context layer for human-agent execution
