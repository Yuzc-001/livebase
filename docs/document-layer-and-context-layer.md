# Livebase — Document Layer and Context Layer

日期：2026-03-23  
状态：核心结构说明

---

## Why this file exists

As `Livebase` becomes clearer, one structural question matters a lot:

# should Livebase leave a place for a markdown / document knowledge layer?

The answer is:

# yes — not as an optional compatibility feature, but as a first-class layer of the system

At the same time, `Livebase` should not collapse back into “just a markdown knowledge base.”

So the right answer is not document-only, and not context-only.
It is:

# document layer + context layer

---

## Core judgment

`Livebase` should preserve two layers at the same time:

### 1. Document layer
A human-readable, source-carrying, editable layer.

### 2. Context layer
A system layer that turns saved material into durable working context.

Without the document layer, the system becomes too abstract, too synthetic, and too agent-shaped.
Without the context layer, the system falls back into passive storage.

Both are necessary.

---

## What the document layer is for

The document layer should be the natural place for:
- source material
- working notes
- standards
- policies
- project notes
- residue notes
- handoff notes
- markdown knowledge files

This layer matters because it preserves:
- source truth
- human readability
- editability
- versionability
- portability

It is the most natural layer for humans to inspect and maintain.

---

## What the context layer is for

The context layer exists so the system does not stop at storage.

It should carry:
- object identity
- project continuity
- cross-document links
- retrieval structure
- context packs
- decision context
- adapter handoff structure
- write-back pathways

This is what lets `Livebase` act like a durable working context base rather than a note pile.

---

## Why document layer must remain first-class

If the document layer is removed or downgraded, several failures become likely:

### 1. Source drift increases
Generated abstractions start outranking original material.

### 2. Human ownership weakens
The system becomes easier for agents to use than for humans to trust.

### 3. Portability drops
Knowledge becomes trapped in internal structures.

### 4. Reviewability drops
Users can no longer easily inspect what is source, what is derived, and what changed.

### 5. Write-back quality falls
Many durable residues are naturally best written as documents, not only as hidden objects.

---

## Why document layer is not enough

If `Livebase` stops at markdown/files, it still fails in familiar ways:
- source sink
- fragmentation
- weak retrieval
- no durable task continuity
- no reliable context packs
- no strong adapter handoff
- no structured write-back loop

That is why the context layer exists.

The document layer is necessary, but not sufficient.

---

## The relation between the two layers

The cleanest way to think about the system is:

### Document layer
Where truth, notes, standards, and residue can live in human-readable form.

### Context layer
Where those materials become callable, connected, retrievable, and reusable as working context.

This means:
- documents remain readable and editable
- context remains operational and task-serving
- source and derived structure remain distinguishable

That distinction is important.

---

## Relationship to adapters

`Livebase` should not perform every action itself.
It should be able to call execution adapters.

In that model:
- document layer helps preserve the source and working materials
- context layer prepares task-relevant working context
- adapters execute
- write-back updates both durable residue and future context quality

For example, `grasp` is not the center.
It is a browser execution adapter used by `Livebase`.

That only works well if the system has both:
- a stable document layer
- a strong context layer

---

## A practical mental model

`Livebase` should not be understood as:
- only a markdown vault
- only an object graph
- only an AI memory shell

It should be understood as:

# a local durable working context base built from a document layer and a context layer

This gives humans a natural home for source and notes,
and gives agents a durable structure for action and continuity.

---

## Bottom line

Yes, `Livebase` should explicitly leave room for markdown / document knowledge.
But it should do so as part of a larger system:

# document layer + context layer

That is the structure that keeps the project from collapsing into either:
- passive storage
- or synthetic abstraction without trustworthy source grounding
