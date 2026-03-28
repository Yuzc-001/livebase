# Livebase — Project Definition

## Working title

`Livebase`

## One-line

Livebase helps recurring real-world tasks stop restarting from zero.

## Core judgment

This project should not be understood as:
- another note app
- another personal wiki
- another local RAG shell
- another AI chat over files
- another knowledge base that stops at storage
- another AI memory project

Its real center is:

# help recurring real tasks continue from stronger working context instead of restarting from zero

More concretely:

# the context, standards, judgments, and residue produced during real work should become a durable working base for the next run

## The real enemy

The enemy is not “lack of a place to save notes.”
The enemy is:

# restart cost caused by working-context decay

That decay appears in recurring forms:

### 1. Sink
Important material is recorded, then never returns at the right working moment.

### 2. Fragmentation
Projects, people, tasks, documents, standards, and past judgments stop remaining connected.

### 3. Drift
Summaries, standards, and AI-generated abstractions detach from source truth.

### 4. Retrieval unreliability
The system returns fragments, but not dependable working context for action.

### 5. Missing write-back
Finished work does not improve the next cycle of work.

### 6. System rot
Over time the base gets heavier, noisier, more duplicated, and less trustworthy.

## Product center

The center is not storage.
The center is not generic memory.
The center is:

# durable working context for recurring tasks

This project should help a local human-agent system do five things well:
1. preserve source truth
2. preserve decision standards and project context
3. let structure grow progressively
4. produce callable working context for action
5. accept durable write-back after meaningful work

## Product promise

If this project works, a user should feel:
- I do not need to restart recurring work from scratch every time
- important source material stays connected to real work
- standards and past judgments do not vanish between tasks
- retrieval gives me dependable working context, not fragment piles
- my agent can work with the same durable thread I can
- finished work strengthens the next cycle instead of disappearing into history

## Structural model

`Livebase` should not collapse into either:
- a markdown/document pile
- or a synthetic object system with weak source grounding

Its stronger structure is:

# document layer + context layer

### Document layer
The human-readable source and working layer.
This is where source documents, markdown knowledge files, standards, project notes, handoff notes, and residue notes can naturally live.

### Context layer
The system layer that turns saved material into durable working context.
This is where identity, linking, retrieval structure, context packs, decision context, and write-back pathways should live.

The document layer preserves source truth in a readable form.
The context layer makes that material callable, connected, and reusable for work.

Both are necessary.

## Core loop

The strongest way to understand the project is through its loop:

# prepare → act → verify → write back → strengthen

That means:
- prepare the right working context
- act through an execution environment or adapter
- verify with evidence
- write back the smallest durable residue that matters
- make the next run stronger

## What this means in practice

Livebase is the layer between:
- captured material
- active work
- future reuse

It should turn saved material into something closer to a durable working base for:
- research threads
- project continuity
- hiring/review/screening decisions
- agent handoff
- iterative execution
- post-work compounding

## Relationship to execution adapters

`Livebase` should not perform every action itself.
It should be able to call execution adapters.

That means:
- `Livebase` prepares working context
- adapters execute in concrete environments
- completed work writes back durable residue and updated context quality

For example, `grasp` should be understood as a browser execution adapter used by `Livebase`, not as a co-equal center.

## v0.1 scope

`v0.1` should focus on a real local core, not a platform fantasy.

### v0.1 should include
- local-first storage
- source-preserving ingestion
- lightweight structured layer on top of documents and notes
- search + connection + context-pack generation
- write-back path for durable residue
- human/agent shared thread continuity
- support for preserving decision context, not just document context
- explicit room for document layer + context layer + future execution adapters

### v0.1 should not include
- enterprise multi-tenant architecture
- heavy permissions systems
- giant workflow engine
- cloud-first dependency as the default identity
- chat-first AI shell experience
- mandatory up-front ontology modeling
- broad platform ambition before one task loop is truly strong

## Why this can become a real work

Many tools help with one slice of knowledge work:
- capture
- note-taking
- linking
- search
- AI Q&A
- visualization

But far fewer solve this sharper problem:

# how do you make recurring real tasks continue from stronger working context instead of repeatedly paying restart cost?

That is the opening.

## Boundary against adjacent products

This project is not trying to beat Notion at page management, Obsidian at plugin freedom, or NotebookLM at hosted source chat.

It is trying to solve a different and sharper problem:

# making recurring human-agent work continue from durable local working context instead of starting over again
