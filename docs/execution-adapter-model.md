# Livebase — Execution Adapter Model

日期：2026-03-23  
状态：核心结构说明

---

## Why this file exists

As `Livebase` becomes clearer, one boundary matters more and more:

# `Livebase` is the durable working context system, not the concrete executor for every environment

That means the system should be able to use:

# execution adapters

This file defines that model.

---

## Core judgment

The correct relationship is not:
- `Livebase + another tool` as co-equal products

The correct relationship is:

# `Livebase` is the center
# adapters are the execution arms used by `Livebase`

This matters because it keeps the project from losing its center.

---

## What an execution adapter is

An execution adapter is a task-facing executor that operates in a concrete environment.

Examples of environments:
- browser
- document system
- email system
- coding environment
- CRM / internal ops tools

An adapter is responsible for:
- entering that environment
- performing actions there
- returning evidence and outcome structure

It is not responsible for being the long-term working context base.

---

## What Livebase is responsible for

`Livebase` should remain responsible for:
- source preservation
- standards and decision context
- project continuity
- retrieval and context-pack preparation
- durable residue and write-back
- long-horizon task continuity across sessions

This is why `Livebase` remains the system of record for working context.

---

## What an adapter is responsible for

An execution adapter should be responsible for:
- executing in a specific environment
- consuming task-relevant context
- surfacing evidence from real execution
- reporting outcome, ambiguity, and next-state signals

It should not be responsible for:
- defining the task standard system
- becoming the permanent home of residue
- owning the long-term history of judgment
- replacing the source/context base

---

## The task loop

The execution-adapter model should support a loop like this:

### 1. Task appears
A real task needs to be performed.

### 2. Livebase prepares working context
It gathers:
- source-grounded material
- project state
- standards
- relevant prior residue
- decision context
- action boundaries

### 3. Livebase hands a task package to an adapter
The adapter receives only what is needed for execution.

### 4. Adapter executes
The adapter enters the concrete environment and performs the task.

### 5. Adapter returns result + evidence
It returns:
- what happened
- what evidence was seen
- what remains uncertain
- what state may need updating

### 6. Livebase decides and writes back durable residue
The system updates:
- residue
- standards if needed
- project/task continuity
- context quality for the next cycle

This is the closed loop.

---

## What a task package should contain

A task package from `Livebase` to an adapter should usually include:
- task goal
- current task scope
- source links or source references
- relevant standards / evaluation rules
- important prior decisions
- action boundaries
- expected output shape

This keeps execution aligned with durable working context.

---

## What an adapter result should contain

An adapter result back to `Livebase` should usually include:
- execution outcome
- evidence
- unresolved ambiguity
- suggested residue candidates
- suggested state updates
- any blockers or handoff requirements

This keeps write-back grounded in actual work.

---

## Why this model matters

Without an adapter model, two failures become likely:

### Failure 1 — Livebase becomes too abstract
It knows context but cannot connect to real execution.

### Failure 2 — executors become context owners
A browser tool or automation tool starts becoming the accidental place where standards and durable task history live.

Both are bad.

The adapter model solves this by making the relationship explicit:
- `Livebase` owns durable working context
- adapters perform concrete execution

---

## Example: grasp

`grasp` is a strong example of a browser execution adapter.

What it is good at:
- entering websites
- maintaining browser session continuity
- reading pages
- interacting with forms and interfaces
- handing off and resuming
- returning execution evidence

What it should not become:
- the permanent home of hiring standards
- the long-term memory of project judgment
- the owner of durable task residue

In the correct model:
- `Livebase` prepares the hiring/project/decision context
- `grasp` executes in the browser
- `Livebase` receives the outcome and writes back residue

---

## Relationship to document layer and context layer

This model only works well if `Livebase` already has:

### document layer
So source, notes, standards, and residue remain human-readable.

### context layer
So those materials can become callable working context for execution.

Then adapters can operate without replacing the base.

---

## Bottom line

`Livebase` should not try to be every executor.
It should be the durable working context center that can use execution adapters.

That means the right structure is:

# document layer + context layer + execution adapters

This is how the system can move from storage toward real task closure.
