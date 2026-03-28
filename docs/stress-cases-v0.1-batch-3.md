# Livebase v0.1 — Stress Cases (Batch 3)

日期：2026-03-23  
目标：继续用更现实、更长期、更接近真实部署和迁移压力的案例压测 `Livebase v0.1`。

这一批重点不是再证明理念成立，
而是验证它会不会在真实落地时退化成：
- 理想化定义仓库
- 迁移地狱
- residue 垃圾系统
- stale context machine
- 名义 local-first、实际重依赖系统

重点压测：
- migration collapse
- source/version conflict
- stale context packs
- residue spam over time
- local-first deploy realism
- archive vs active-thread confusion

---

## Test rubric

每个案例按这 4 项判断：
1. **Pressure point** 这个场景在逼什么错误暴露
2. **Expected behavior** 当前 skill / contract 应采取什么动作
3. **Pass / Partial / Fail** 当前结构是否足够支撑
4. **Reason** 原因

---

## Case 31 — User imports a messy archive of old notes
- Pressure point: migration collapse
- Scenario: 用户有大量旧笔记、碎片文档、链接收藏，希望导入系统。
- Expected behavior: v0.1 不应要求先全量整理；应允许逐步接入、渐进提升，而不是 migration-first collapse。
- Result: PASS
- Reason: first-usage path and progressive structure both reject all-at-once system design.

## Case 32 — Imported notes contain overlapping summaries of the same source
- Pressure point: duplicate abstraction tangle
- Scenario: 同一个来源被多次总结，系统很容易被重复摘要层覆盖。
- Expected behavior: preserve source, distinguish derived layers, and allow later consolidation instead of treating all summaries as equal truth.
- Result: PASS
- Reason: source-preservation + anti-rot jointly support this distinction.

## Case 33 — A source is updated, but an older context pack is still being reused
- Pressure point: stale context packs
- Scenario: context pack 当时正确，但源内容后来变化了。
- Expected behavior: context pack should remain time-bounded and freshness-sensitive, not silently masquerade as current truth.
- Result: PASS
- Reason: minimum object for context pack already includes generated time and optional freshness marker.

## Case 34 — Project residue accumulates for months and becomes unreadable
- Pressure point: residue spam over time
- Scenario: 每次项目推进都写回一点 residue，几个月后变成很多小块噪音。
- Expected behavior: anti-rot should support consolidation and current-state recovery, not endless residue pileup.
- Result: PASS
- Reason: write-back and anti-rot both emphasize smallest useful residue plus corrective updates.

## Case 35 — User wants local-first, but setup still requires a mini-devops stack
- Pressure point: local-first deploy realism
- Scenario: 名义上本地优先，实际要用户先搭一堆服务才能开始。
- Expected behavior: v0.1 should keep opening path light; deploy realism is part of product truth, not implementation trivia.
- Result: PASS
- Reason: local-first and first-usage path already make low-friction start a core standard.

## Case 36 — A project has a lot of archival material, but active work needs only a thin slice
- Pressure point: archive vs active-thread confusion
- Scenario: retrieval 每次都把整个项目历史带出来，导致 active work 很重。
- Expected behavior: distinguish active context from passive archive; context packs should privilege current working relevance.
- Result: PASS
- Reason: retrieval-and-context-packs defines callable working bundles, not total archive dumps.

## Case 37 — User creates many entities because “maybe useful later”
- Pressure point: speculative structure inflation
- Scenario: 过早把许多词条升成实体，期待以后也许有用。
- Expected behavior: stable identity should be earned by recurring retrieval/linkage payoff, not speculation.
- Result: PASS
- Reason: progressive structure clearly rejects schema theater.

## Case 38 — Agent starts using context packs as a substitute for reading sources
- Pressure point: abstraction replacing grounding
- Scenario: agent 习惯只看 context pack，不再回 source，导致细节和 nuance 丢失。
- Expected behavior: context packs should help continuation, not eliminate source-grounded checking when needed.
- Result: PASS
- Reason: source preservation and agent role maintain grounding hierarchy.

## Case 39 — Two projects share the same entity but require different interpretations
- Pressure point: false universalization
- Scenario: 同一个人/概念在两个项目里扮演不同角色，系统容易把它们压成单一解释。
- Expected behavior: entity identity can be stable while project-linked interpretation remains contextual.
- Result: PASS
- Reason: minimum object model separates entity from project/note/residue context.

## Case 40 — User only wants fast capture for a while, not structure work
- Pressure point: capture-only phase
- Scenario: 一段时间内用户只想轻量记录，不想整理。
- Expected behavior: the system should still remain compatible with later promotion instead of punishing capture-only phases.
- Result: PASS
- Reason: progressive structure allows delayed structure growth.

## Case 41 — A stale summary continues to rank higher than a newer source-linked update
- Pressure point: stale abstraction dominance
- Scenario: 系统里有旧 summary 和新 source-linked correction，检索却总优先旧 summary。
- Expected behavior: source-linked corrective material should be able to outrank stale floating abstraction.
- Result: PASS
- Reason: the whole thesis prioritizes source-preserving liveliness over static summary convenience.

## Case 42 — User wants to export or move their knowledge later
- Pressure point: lock-in contradiction
- Scenario: 本地系统如果最终难以迁移，就会违背 local-first trust model。
- Expected behavior: structure should remain portable enough that the user does not feel trapped.
- Result: PASS
- Reason: local-first identity implies ownership and portability, not black-box captivity.

## Case 43 — Small team extension pressures the system into enterprise complexity too early
- Pressure point: premature enterprise drift
- Scenario: 两三个人开始共用后，需求讨论迅速滑向权限/管理/审计平台。
- Expected behavior: keep v0.1 identity personal-first with light extension path, not full enterprise pivot.
- Result: PASS
- Reason: scope and non-goals explicitly reject enterprise-first collapse.

## Case 44 — User asks the system to auto-summarize everything on ingestion
- Pressure point: automation overreach
- Scenario: 想让系统导入即摘要、导入即抽实体、导入即结构化。
- Expected behavior: automation may help, but should not erase the distinction between raw material and promoted knowledge.
- Result: PASS
- Reason: source before abstraction is a hard rule in this repo.

## Case 45 — Old project context keeps polluting new work because links were never re-scoped
- Pressure point: context bleed
- Scenario: 关联很多，但 active retrieval 总把旧项目遗留信息带进来。
- Expected behavior: linkage should support scoped retrieval, not indiscriminate expansion.
- Result: PASS
- Reason: context-pack purpose and project role both imply task-scoped working bundles.

---

## Score

- **Pass:** 15
- **Partial pass:** 0
- **Fail:** 0

---

## Bottom line

Batch 3 suggests `Livebase v0.1` still holds under more grounded pressure:
- migration does not have to become all-at-once collapse
- context packs do not need to become stale dumps
- residue does not need to become a permanent noise layer
- local-first remains part of the truth condition, not a decorative slogan
- the system can stay personal-first without collapsing under early team-extension pressure
