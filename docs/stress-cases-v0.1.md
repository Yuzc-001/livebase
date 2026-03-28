# Livebase v0.1 — Stress Cases

日期：2026-03-23  
目标：验证当前 `Livebase v0.1` 是否已经具备真实的作品中心，而不是退化成另一种 note store、local RAG shell、或知识管理概念包。

重点压测：
- knowledge sink
- fragmentation
- source drift
- retrieval unreliability
- missing write-back
- over-structuring too early
- system rot
- agent-generated noise inflation

---

## Test rubric

每个案例按这 4 项判断：
1. **Pressure point** 这个案例在逼什么错误暴露
2. **Expected behavior** 当前 skill / contract 应采取什么动作
3. **Pass / Partial / Fail** 当前结构是否足够支撑
4. **Reason** 原因

---

## Case 1 — Notes are captured quickly, then never return
- Pressure point: knowledge sink
- Scenario: 用户每天快速记录很多内容，但过一周后几乎没有内容自然 resurfacing。
- Expected behavior: 系统至少要允许这些内容通过 project/entity/context-pack 路径重新变得 callable，而不是只存在于 archive 里。
- Result: PASS
- Reason: v0.1 core 已把 retrieval + context packs + progressive promotion 放进最低成立条件。

## Case 2 — AI summary replaces the original source in practice
- Pressure point: source drift
- Scenario: 用户后面只看 AI 摘要，不再能区分原文和派生层。
- Expected behavior: 保持 source-preserving distinction，不让 derived layer 取代 source truth。
- Result: PASS
- Reason: `source-preservation.md` 与 `agent-role.md` 已明确压住这条边界。

## Case 3 — A project spreads across notes, links, and documents with no durable center
- Pressure point: fragmentation
- Scenario: 一个项目跨多次会话和多种材料，但没有统一 project context。
- Expected behavior: project 作为 durable context container，把 sources / notes / residue 重新连起来。
- Result: PASS
- Reason: minimum objects 已明确 `Project` 的必要性和作用。

## Case 4 — Search returns fragments, but no usable working context
- Pressure point: retrieval unreliability
- Scenario: 搜索能找到几个片段，但用户仍要自己重新拼线程。
- Expected behavior: retrieval 应导向 context pack，而不是只停在 snippet 命中。
- Result: PASS
- Reason: `retrieval-and-context-packs.md` 已明确“dependable working bundle”是目标。

## Case 5 — The system asks for too much structure too early
- Pressure point: over-structuring too early
- Scenario: 用户刚开始用，就被要求建立大量 schema / entity type / relation type。
- Expected behavior: progressive structure，先低摩擦使用，再逐步晋升对象。
- Result: PASS
- Reason: `progressive-structure.md` 与 v0.1 non-goals 都明确反对 heavy schema upfront。

## Case 6 — Work finishes, but nothing strengthens the system
- Pressure point: missing write-back
- Scenario: 做完一轮项目/研究/讨论后，系统里没有任何 durable residue。
- Expected behavior: 至少支持 next-time rule / project-state update / linked lesson 等小而有用的写回。
- Result: PASS
- Reason: write-back 已被纳入 v0.1 minimum viable core，而不是 optional nice-to-have。

## Case 7 — The system grows, but becomes noisier instead of stronger
- Pressure point: system rot
- Scenario: 随着笔记增多，系统越来越重、重复、难用。
- Expected behavior: 至少有 anti-rot stance，鼓励 consolidation、stable identities、source-grounded updates。
- Result: PASS
- Reason: anti-rot 已被明确纳入对象层与行为层。

## Case 8 — Agent writes back too much synthetic content
- Pressure point: agent-generated noise inflation
- Scenario: agent 在每次工作后都往系统里写大量总结，结果让系统变脏。
- Expected behavior: 只写 smallest durable residue，且不得替代 source。
- Result: PASS
- Reason: `agent-role.md` 与 `write-back.md` 已明确保守写回原则。

## Case 9 — A user wants pure local use with no cloud identity
- Pressure point: local-first credibility
- Scenario: 用户不希望系统默认依赖云服务或 hosted AI product shell。
- Expected behavior: local-first core 仍应独立成立。
- Result: PASS
- Reason: v0.1 scope 已把 local-first 作为 identity，不是 optional deployment mode。

## Case 10 — User has many quick captures but no stable recurring objects
- Pressure point: weak promotion path
- Scenario: 大量 quick notes 记录了 recurring people/tools/projects，但系统始终没有把它们稳定成 entity/project。
- Expected behavior: 支持 gradual promotion，让 recurring things 获得 stable identity。
- Result: PASS
- Reason: minimum objects + progressive structure 已为此留出路径。

## Case 11 — Context packs are generated, but they are just loose dumps
- Pressure point: fake context pack
- Scenario: 所谓 context pack 只是堆很多对象，没有任务导向或 working relevance。
- Expected behavior: context pack 必须是 smallest reliable bundle for real work continuation。
- Result: PASS
- Reason: retrieval-and-context-packs.md 已定义了 context pack 的 purpose。

## Case 12 — The system looks organized, but source links are weak or missing
- Pressure point: decorative organization
- Scenario: 页面和标签看起来很整齐，但无法可靠回到来源。
- Expected behavior: source grounding 优先于表面组织感。
- Result: PASS
- Reason: source preservation 是 v0.1 的硬要求，不是 UI 细节。

## Case 13 — User and agent operate on different threads of knowledge
- Pressure point: human-agent divergence
- Scenario: 用户自己有一套理解，agent 又在系统外生成另一套总结层。
- Expected behavior: 共享 source-grounded context and durable write-back path，避免双轨系统。
- Result: PASS
- Reason: interaction-model 与 agent-role 都把 shared durable thread 当成目标。

## Case 14 — A single project accumulates sources, but no clear current state
- Pressure point: project continuity failure
- Scenario: 项目材料都在，但没有 current state / next-step / residue trail。
- Expected behavior: 通过 project-linked notes/residue/context packs 维持 continuity。
- Result: PASS
- Reason: project object 的作用不仅是分类，还包括 continuity container。

## Case 15 — The system is useful only after major setup ceremony
- Pressure point: failed opening path
- Scenario: 用户需要先迁移所有旧笔记、建 schema、配 dashboard 才能感到价值。
- Expected behavior: first-usage path 必须很早体现价值。
- Result: PASS
- Reason: `first-usage-path.md` 已明确反对 migration-first / setup-heavy opening。

---

## Score

- **Pass:** 15
- **Partial pass:** 0
- **Fail:** 0

---

## Bottom line

The current `Livebase v0.1` already holds a coherent contract-level position:
- it is not merely storage
- it is not merely local AI chat
- it is not merely a schema-heavy knowledge graph

It already behaves more like a local knowledge-liveliness system.
That is enough to justify the repo’s existence as a real emerging work, even before a runtime implementation exists.
