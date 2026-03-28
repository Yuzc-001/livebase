# Livebase — Adapter Spec: Grasp

日期：2026-03-23  
状态：首个 concrete execution adapter spec

---

## Why this file exists

If `Livebase` is real, it should not stop at a general adapter model.
It should be able to describe at least one concrete adapter relationship clearly.

`grasp` is the first strong example.

This file defines how `Livebase` should use `grasp` as a browser execution adapter.

---

## Adapter role

`grasp` should be understood as:

# a browser execution adapter used by Livebase

Its job is to:
- enter browser environments
- preserve session continuity there
- inspect, read, and act on web interfaces
- return evidence about what happened

It is not the durable working context center.

---

## Why grasp fits first

`grasp` is a good first adapter because many real tasks depend on browser execution:
- hiring / candidate screening
- internal operations tools
- review workflows
- web research with gated pages
- authenticated task systems
- human handoff / resume flows

These tasks often fail not because the browser cannot be controlled,
but because execution is weakly connected to durable context.

That is exactly where `Livebase + grasp` becomes meaningful.

---

## Division of responsibility

### Livebase owns
- source truth
- task goal
- project continuity
- standards and evaluation rules
- prior decisions and residue
- decision context
- write-back and long-term continuity

### grasp owns
- browser entry
- session continuity in browser
- page inspection
- interaction execution
- evidence collection from live pages
- handoff / resume in browser workflows

This boundary should remain clear.

---

## Input from Livebase to grasp

A task package sent from `Livebase` to `grasp` should usually contain:

### 1. Task goal
What the browser task is supposed to achieve.

Examples:
- inspect a candidate profile and compare against role criteria
- collect missing evidence from a dashboard
- verify a record in an internal system
- prepare a draft action but do not submit

### 2. Context scope
What project / workflow / batch this belongs to.

Examples:
- hiring batch for backend engineer role
- vendor review project
- current review cycle for applicants

### 3. Relevant standards
The evaluation or action rules required for correct execution.

Examples:
- hard requirements
- soft preference signals
- red flags
- action boundaries
- what requires human confirmation

### 4. Source references
Which source docs, notes, standards, or project objects matter.

### 5. Output expectation
What shape of result `grasp` should return.

Examples:
- evidence summary
- structured evaluation fields
- blocker report
- candidate decision recommendation draft

---

## Output from grasp back to Livebase

A result package returned by `grasp` should usually include:

### 1. Execution outcome
What happened in the browser.

Examples:
- candidate profile inspected
- missing field found
- action draft prepared
- handoff required
- workflow blocked by auth / missing data

### 2. Evidence
What page evidence supports the outcome.

Examples:
- page observations
- extracted fields
- visible status
- structured signals
- relevant URLs / references

### 3. Ambiguity
What remains uncertain.

Examples:
- profile incomplete
- signal conflicted with earlier residue
- criteria partially matched
- browser state blocked deeper inspection

### 4. Suggested residue candidates
What may deserve write-back.

Examples:
- new edge case in candidate evaluation
- updated red-flag interpretation
- new project-state note
- workflow-specific lesson

### 5. State update suggestions
What `Livebase` may need to update.

Examples:
- task status
- candidate review state
- project context note
- decision standard refinement

---

## Example task loop — Hiring screening

This is a strong example because it is not just “browser automation.”
It is browser execution under decision context.

### Step 1 — Livebase prepares context
`Livebase` gathers:
- role definition
- hard requirements
- soft preference signals
- team/culture notes
- past screening residue
- current hiring batch scope
- action boundary (e.g. evaluate only, no final submit)

### Step 2 — Livebase hands task package to grasp
The package says, in effect:
- inspect this candidate in Boss
- compare against these criteria
- surface evidence and ambiguity
- do not cross this boundary

### Step 3 — grasp executes in browser
`grasp`:
- enters Boss
- keeps session continuity
- opens candidate detail
- inspects page signals
- collects visible evidence
- prepares result structure

### Step 4 — grasp returns result package
Result might include:
- candidate appears strong on hard requirements
- culture signal is mixed
- one key red flag is missing evidence
- no final action taken
- manual follow-up may be needed

### Step 5 — Livebase writes back
`Livebase` then decides what becomes durable:
- candidate residue note
- updated interpretation of a role criterion
- batch-level edge case
- next-step task state

This is the correct loop.

---

## What should never happen

### Bad pattern 1
`grasp` becomes the accidental memory system.

### Bad pattern 2
`Livebase` dumps huge irrelevant context into the browser task.

### Bad pattern 3
Browser execution results stay only in chat and never write back.

### Bad pattern 4
Task standards exist only in a human head and are never externalized.

These are exactly the failures the adapter model is supposed to prevent.

---

## Why this matters for the project

A lot of systems can either:
- store knowledge
- or automate browser tasks

Far fewer can do this:

# preserve durable working context, then use it to drive real execution, then write the results back into a stronger next cycle

That is why `adapter-grasp` matters.
It is not just an integration note.
It is an example of how `Livebase` starts becoming a real work.

---

## Bottom line

`grasp` should be the first browser execution adapter used by `Livebase`.

The correct flow is:

# Livebase prepares context → grasp executes in browser → Livebase writes back durable residue

That is how browser automation becomes part of a durable working-context system instead of staying an isolated action tool.
