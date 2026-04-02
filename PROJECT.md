# Livebase - Product Definition

## One-line

`Livebase` is a local-first work continuity engine that helps humans and agents resume real tasks from the last unresolved evidence gap instead of restarting from zero.

## Core Judgment

`Livebase` should not be framed as:

- AI memory
- local RAG
- note vault
- generic knowledge base
- broad agent platform

Its real center is:

> durable work continuation

We are not trying to save more text.
We are trying to reduce restart cost after interruption.

## The Enemy

The enemy is not "there is nowhere to save notes."

The enemy is:

> the cost of re-understanding work after it pauses, hands off, or switches context

That cost appears when:

- the last useful judgment is detached from its supporting evidence
- the next session gets a broad summary instead of one actionable next step
- blocked tasks do not preserve the exact evidence gap that stopped progress
- completed work writes back noise instead of durable leverage

## Product Center

`Livebase` combines three layers:

1. knowledge base
2. work sediment
3. continuation engine

### Knowledge base

Stable source truth, project context, and reusable standards.

### Work sediment

Checkpoints, blockers, evidence gaps, and updated next actions produced during active work.

### Continuation engine

The runtime that answers:

- what is the current task
- what evidence gap matters most now
- what action should happen next
- what boundaries govern execution
- what verified result deserves writeback

The first two layers are foundations.
The third is the product center.

## Product Principles

1. **Center the evidence gap**
   Recovery starts from unresolved evidence, not from a transcript replay.

2. **Center the continuation pack**
   The next run should receive the smallest trustworthy packet for action.

3. **Center the execution contract**
   Agents should work inside explicit boundaries and expected result shape.

4. **Center the verification ledger**
   Writeback must preserve checks, ambiguity, and residue, not just conclusions.

5. **Center compounding**
   Every meaningful run should make the next run stronger.

## What Livebase Is Not

`Livebase` is not:

- a chat transcript archive
- a personal wiki replacement
- an everything platform for agents
- a place to dump every model thought
- a product whose value comes from naming many features

## Core Loop

```text
capture stable knowledge
-> checkpoint task runtime
-> resume from the primary evidence gap
-> generate an execution contract
-> perform work
-> write back a verification ledger
-> persist the smallest durable residue
-> sharpen the next run
```

## v0.1 Scope

`v0.1` should prove one hard path end to end.

### Must include

- local-first store
- source ingestion
- project container
- first-class evidence gaps
- checkpoints
- resume packs
- execution contracts
- verification-ledger writeback
- residue persistence
- CLI-first product surface

### Must not include

- multi-device sync
- vector search
- heavy UI
- large adapter ecosystem
- generalized workflow engine
- enterprise permission systems

## Success Criteria

`v0.1` succeeds if a fresh run can:

1. recover a real task
2. identify the primary unresolved evidence gap
3. produce one bounded execution contract
4. accept one verification ledger with evidence-backed checks
5. persist durable residue
6. make the next resume smaller and sharper

## Product Direction

The final product should feel like one installable `livebase` tool.

Internally, it can grow as:

- core continuity engine
- CLI surface
- MCP surface
- host-agent skill surface

But the user should experience one thing:

> a local system that lets interrupted work continue without starting over
