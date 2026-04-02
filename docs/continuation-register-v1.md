# Continuation Register v1

## One line

`Continuation Register` is the smallest high-attention state packet that must be rehydrated at the start of the next run.

It is not a memory dump.  
It is not a chat summary.  
It is the run-state register that keeps the most important constraints at the top of attention.

## Why this exists

`Livebase` already has a strong continuity loop:

```text
resume -> contract -> act -> writeback
```

That loop proves that interrupted work can continue from the last unresolved evidence gap.

But long-running human-agent work has another failure mode:

- the right task is recovered
- the right evidence gap is recovered
- yet the sharpest constraint of the prior run loses attention weight in the next run

In other words:

> continuity can still degrade into soft context drift if the highest-priority constraints are not rehydrated into the next run's top attention position

`Continuation Register` exists to solve that exact problem.

## What it is

`Continuation Register` is a host-facing, machine-readable state block that captures the minimum non-negotiable run state for the next cycle.

It should answer five questions:

1. What is the sharpest unresolved tension right now?
2. What must not be compromised in the next run?
3. Which evidence gap is the current center of gravity?
4. What is the one next move that should happen now?
5. Which grounded objects anchor this state?

## What it is not

`Continuation Register` is not:

- a long summary
- a replay of chat history
- a replacement for `resume`
- a replacement for `contract`
- a place to store model chain-of-thought
- a free-form note that drifts away from source-grounded state

## Product role

`Livebase` should now be understood in three layers:

1. Knowledge base  
   Stable source truth, project context, and reusable standards.
2. Continuity engine  
   Task threads, evidence gaps, resume packs, execution contracts, and verification ledgers.
3. Attention hydration layer  
   The mechanism that re-injects the smallest non-negotiable run state at the top of the next run.

The first layer preserves material.  
The second layer preserves continuation.  
The third layer preserves attention.

`Continuation Register` belongs to the third layer.

## Design principles

### 1. Shorter than a summary

The register should be compressed enough that each field behaves like a logic primitive, not a paragraph.

### 2. Grounded, not poetic

Every meaningful field should be derivable from current task state, evidence gaps, project standards, or verified residue.

### 3. Rehydratable

The register must be easy for a host to inject at the beginning of the next run.

### 4. Host-portable

The format should work across coding hosts, chat hosts, and orchestrators without depending on one product shell.

### 5. Single-run scoped

The register is not permanent truth.  
It is the best high-attention state packet for the next run boundary.

## Canonical fields

`Continuation Register v1` has five canonical fields:

### `core_tension`

The sharpest unresolved tension in the current work.

Good examples:

- "Need to advance the hiring decision without inventing ownership evidence."
- "Need to narrow the failure cause without widening the retrieval scope."

Bad examples:

- "The project is interesting and complex."
- "There are many things to consider."

### `taste_lock`

The non-negotiable constraint boundary for the next run, phrased as a negative.

Good examples:

- "Do not replace grounded evidence with smooth summary."
- "Do not widen scope into a broad redesign."

Bad examples:

- "Be careful."
- "Try to do a good job."

### `primary_gap`

The current highest-priority unresolved evidence gap.

This should map directly to the active `EvidenceGap` object when one exists.

### `next_move`

The single smallest trustworthy action the next run should take.

This should stay sharper than a task list.

### `evidence_anchors`

Pointers to the grounded objects that justify the register:

- source refs
- residue refs
- project refs
- task ref

These anchors prevent the register from becoming decorative prompt prose.

## Canonical shape

The recommended v1 transport shape is XML-like text because it is easy to inject into host prompts while still remaining structured:

```xml
<Continuation-Register version="1">
  <Task-Ref>tsk-...</Task-Ref>
  <Project-Ref>proj-...</Project-Ref>
  <Core-Tension>...</Core-Tension>
  <Taste-Lock>...</Taste-Lock>
  <Primary-Gap id="gap-...">...</Primary-Gap>
  <Next-Move>...</Next-Move>
  <Evidence-Anchors>
    <Source ref="src-..." />
    <Residue ref="res-..." />
  </Evidence-Anchors>
</Continuation-Register>
```

Hosts may also keep an equivalent JSON form internally, but the injected prompt-facing form should stay compact and human-auditable.

## Derivation rules

`Continuation Register v1` is currently a derived protocol, not a dedicated MCP tool.

That means:

- it should be generated from `livebase.task.resume`
- MCP hosts should request it with `includeRegister=true`
- CLI users should request it with `bun run resume <task_id> --with-register`
- it may be sharpened by `livebase.task.contract`
- it should be updated after `livebase.task.writeback` or `livebase.task.checkpoint`

Current derivation defaults:

- `Task-Ref` = `resume.taskRef`
- `Project-Ref` = `resume.projectRef`
- `Core-Tension` = derived from `primaryEvidenceGap`, `currentBlocker`, and current task goal
- `Taste-Lock` = derived from project standards, adapter rules, or host-local non-negotiables
- `Primary-Gap` = `resume.primaryEvidenceGap`
- `Next-Move` = `resume.nextAction`
- `Evidence-Anchors` = top refs from `supportingSources` and `recentResidue`

If a host cannot derive a credible field, it should omit flourish and keep the field minimal rather than inventing narrative.

## Host loader contract

`Continuation Register v1` is still a derived protocol rather than a dedicated MCP tool.
But the loading behavior is now explicit in `presets/adapter-presets/registry.json`.

Each preset declares a machine-readable loader contract:

```json
{
  "loader": {
    "resume": {
      "includeRegister": true
    },
    "register": {
      "source": "continuationRegister.promptBlock",
      "position": "top_of_attention",
      "policy": "if_present",
      "conflictResolution": "fresh_resume_wins"
    }
  }
}
```

That contract means:

- host loaders should request a fresh register during `resume`
- the injected register block comes from `continuationRegister.promptBlock`
- the block should be inserted at the host's top-attention position
- if an older cached register conflicts with the fresh `resume` payload, the fresh payload wins

If a host supports warm-start injection before tool calls, it may temporarily inject a cached prior register.
But once `resume` returns, the fresh derived register becomes canonical for that run.

## Current Livebase mapping

### From `resume`

`resume` supplies the runtime center:

- task identity
- project identity
- current blocker
- primary evidence gap
- next action
- supporting sources
- recent residue

This is the core source for register hydration.

### From `contract`

`contract` sharpens the boundary layer:

- disallowed actions
- stop conditions
- required checks
- evidence expectations

This is the best source for deriving `taste_lock` when a strong project-specific boundary exists.

### From `writeback`

`writeback` determines whether the register should shrink, rotate, or reopen:

- resolved gaps may clear the old center
- new `missingEvidence` may become the next `primary_gap`
- new residue may become an anchor
- `nextAction` may replace the prior `next_move`

### From `checkpoint`

`checkpoint` updates the register when a run pauses or hands off without a full verification ledger.

## Injection protocol

Hosts should use the register like this:

1. At the end of a run, persist or cache the latest `Continuation Register` if the host wants a warm-start hint.
2. At the beginning of the next run, call `livebase.task.resume` with `includeRegister=true`.
3. If `resume` returns `continuationRegister.promptBlock`, inject that block at the highest-attention position.
4. If the host had already injected a cached prior register and it materially disagrees with fresh `resume`, `resume` wins.
5. Rebuild or refresh the cached register from the fresh canonical state before substantive execution.

The injected register should appear before long local instructions, not after them.

## Trust hierarchy

The trust order is:

1. grounded source objects
2. current task state
3. current evidence gaps
4. verification-ledger residue
5. derived continuation register text

This means:

- the register is authoritative for attention shaping
- it is not authoritative over source truth

If the register conflicts with current canonical task state, it must be regenerated.

## Multi-agent rule

In multi-agent runs:

- one coordinator owns the current register
- workers may receive projected slices of the register
- workers must not independently publish competing final registers for the same task thread

One task thread should have one hydration center, not several conflicting ones.

## Recommended host behavior

### Coding hosts

Examples:

- Codex
- Claude Code
- OpenCode

These hosts should inject the register immediately before local execution instructions and before tool-heavy work.

### Chat hosts

These hosts may inject a smaller register, but they should still preserve:

- `core_tension`
- `taste_lock`
- `primary_gap`
- `next_move`

### Orchestrators

Orchestrators should treat the register as part of the shared data bus, alongside:

- task id
- contract id
- evidence delta
- final writeback payload

## Minimal example

```xml
<Continuation-Register version="1">
  <Task-Ref>tsk-screen-candidate-abc123</Task-Ref>
  <Project-Ref>proj-hiring-loop-xyz789</Project-Ref>
  <Core-Tension>Need to advance the candidate without overstating migration ownership.</Core-Tension>
  <Taste-Lock>Do not replace grounded evidence with a persuasive summary.</Taste-Lock>
  <Primary-Gap id="gap-prod-migration">Did the candidate directly own the production migration?</Primary-Gap>
  <Next-Move>Inspect the grounded resume source for direct ownership language.</Next-Move>
  <Evidence-Anchors>
    <Source ref="src-candidate-resume-001" />
    <Residue ref="res-ownership-language-matters-002" />
  </Evidence-Anchors>
</Continuation-Register>
```

## Non-goals for v1

`Continuation Register v1` does not try to solve:

- cross-device sync
- long-term memory unification
- automatic contradiction detection
- multiple historical register branches
- a new MCP tool surface

Those may come later.  
v1 only standardizes the smallest high-attention state packet for the next run.

## Success criteria

`Continuation Register v1` is working if:

1. the next run starts inside the right constraint frame faster
2. hosts are less likely to drift into broad summaries
3. multi-agent handoffs lose less task tension
4. the best prior constraint stays visible without replaying full history

## Relationship to product direction

This protocol sharpens the product thesis:

> Livebase is not helping an agent remember more of the past.
> Livebase is helping the next run start with the right constraints already hydrated at the top of attention.

That is why `Livebase` should be understood not only as a continuity engine, but also as an attention hydration layer.
