# Livebase v0.1 — Stress Cases (Batch 2)

日期：2026-03-23  
目标：继续用更长期、更真实的压力测试 `Livebase v0.1`，确认它不会在增长过程中退化成：
- note pile
- local RAG shell
- schema theater system
- synthetic memory dump
- cloud-shaped dependency trap

重点压测：
- version/source drift over time
- duplicate residue inflation
- context-pack quality collapse
- personal-to-small-team extension pressure
- local-first erosion
- false structure growth

---

## Test rubric

每个案例按这 4 项判断：
1. **Pressure point** 这个场景在逼什么错误暴露
2. **Expected behavior** 当前 skill / contract 应采取什么动作
3. **Pass / Partial / Fail** 当前结构是否足够支撑
4. **Reason** 原因

---

## Case 16 — Source changes over time, but old abstraction remains dominant
- Pressure point: version/source drift over time
- Scenario: 原始文档后续更新了，但旧 summary 仍被当作当前真相。
- Expected behavior: source should remain traceable with time/version context, and derived layer should not silently outrank newer source.
- Result: PASS
- Reason: source preservation already requires distinguishable source/derived layers plus time context.

## Case 17 — Same lesson gets written back repeatedly in slightly different wording
- Pressure point: duplicate residue inflation
- Scenario: 多次工作后写回了很多相似 lesson，系统越来越像重复总结堆。
- Expected behavior: anti-rot should favor consolidation or stable linked updates over endless parallel residue.
- Result: PASS
- Reason: anti-rot + write-back already lean toward corrective update rather than noise append.

## Case 18 — Context pack becomes a large dump of related objects
- Pressure point: context-pack quality collapse
- Scenario: 为了“更完整”，context pack 把所有相关对象都塞进去，结果不可用。
- Expected behavior: context pack must stay task-oriented and minimal enough to be callable.
- Result: PASS
- Reason: retrieval-and-context-packs defines the smallest reliable bundle as the goal.

## Case 19 — A user starts alone, then wants to share with one teammate
- Pressure point: personal-to-small-team extension
- Scenario: 系统原本为个人使用，但后来需要与一个合作者共享部分项目上下文。
- Expected behavior: local-first identity should remain intact while not structurally blocking small-team extension later.
- Result: PASS
- Reason: v0.1 scope avoids enterprise-first without forbidding later extension paths.

## Case 20 — Cloud sync temptation starts redefining the product
- Pressure point: local-first erosion
- Scenario: 一旦讨论同步和云端接入，产品叙事开始偏向 hosted service rather than local system.
- Expected behavior: cloud capability may be additive later, but must not replace local-first identity in v0.1.
- Result: PASS
- Reason: v0.1 non-goals explicitly reject cloud-first default identity.

## Case 21 — Every recurring noun gets promoted into an entity
- Pressure point: false structure growth
- Scenario: 为了“更结构化”，系统把几乎所有提到的词都变成 entity。
- Expected behavior: only recurring things with real retrieval or linkage payoff should gain stable identity.
- Result: PASS
- Reason: progressive structure explicitly rejects structure with no reuse payoff.

## Case 22 — Users still keep shadow notes outside the system
- Pressure point: system bypass
- Scenario: 用户把重要临时理解记在别处，因为系统写回或 retrieval 体验不够顺手。
- Expected behavior: interaction model should treat bypass as a failure signal and optimize for low-friction capture + meaningful reuse.
- Result: PASS
- Reason: interaction-model already says strong systems become the natural place work returns to.

## Case 23 — Agent generates polished context but cannot cite source objects clearly
- Pressure point: synthetic context without grounding
- Scenario: agent 产出的 context 看起来很完整，但用户看不清它到底从哪些 source/note/project 来。
- Expected behavior: generated working context should remain source-grounded and traceable.
- Result: PASS
- Reason: source preservation and agent-role both enforce grounding over polished abstraction.

## Case 24 — A project ends, but future retrieval cannot tell the final state
- Pressure point: closure without durable state
- Scenario: 项目相关资料很多，但做完后没有 clear project-state residue。
- Expected behavior: write-back should support final state / durable clarification rather than leaving closure implicit.
- Result: PASS
- Reason: project-state update is already an explicit residue form.

## Case 25 — Retrieval favors recent noise over durable importance
- Pressure point: recency bias
- Scenario: 新近杂项笔记很多，检索时把真正重要的老 source/project context 压下去了。
- Expected behavior: retrieval should be driven by dependable context, not only recency or volume.
- Result: PASS
- Reason: the product center is callable working context, not timeline chatter.

## Case 26 — A broad “AI memory” framing starts swallowing the product center
- Pressure point: identity drift
- Scenario: 随着功能讨论变多，项目开始被理解成 generic AI memory system.
- Expected behavior: keep the center on durable working context in a local system, not generic memory abstraction.
- Result: PASS
- Reason: thesis, README, and scope all define a narrower center already.

## Case 27 — One project contains both archival material and active working knowledge
- Pressure point: archive/active blur
- Scenario: 项目里既有旧 source，又有当前活跃问题，检索时混成一团。
- Expected behavior: context packs and project-linked residue should make current working context more distinguishable from passive archive.
- Result: PASS
- Reason: minimum object set supports project + residue + context pack as separate layers.

## Case 28 — User wants “just chat with it” instead of using structured retrieval
- Pressure point: chat-first collapse
- Scenario: 用户习惯直接问答，系统慢慢退化成聊天壳，而 durable knowledge behavior变弱。
- Expected behavior: chat may exist, but it should still sit on top of source-grounded retrieval and write-back paths.
- Result: PASS
- Reason: v0.1 non-goals already reject chat-first identity.

## Case 29 — Different projects mention the same person/tool but no stable object emerges
- Pressure point: missed cross-project continuity
- Scenario: 同一实体在多个项目出现，但始终只留在散落文本里。
- Expected behavior: recurring cross-project objects should be promotable into stable entities when payoff becomes real.
- Result: PASS
- Reason: entity exists specifically to prevent cross-context duplication drift.

## Case 30 — The system looks “clean” because old messy history is hidden, not integrated
- Pressure point: cosmetic cleanliness
- Scenario: 为了保持整洁，系统把复杂历史藏起来，导致后续 retrieval 失去重要 background。
- Expected behavior: anti-rot should mean better integration and correction, not deletion of hard-won context.
- Result: PASS
- Reason: the project is about liveliness and reliability, not cosmetic tidiness.

---

## Score

- **Pass:** 15
- **Partial pass:** 0
- **Fail:** 0

---

## Bottom line

Batch 2 suggests `Livebase v0.1` is holding under more longitudinal pressure:
- it resists drift toward generic AI memory talk
- it resists turning context packs into dumps
- it resists over-structuring and duplicate residue inflation
- it keeps local-first and source-grounded identity intact while still leaving room for future extension
