# Livebase — Task Package Schema v0.1

日期：2026-03-23  
状态：最小可运行 contract

---

## Why this file exists

If `Livebase` is going to use execution adapters in real work,
it should be able to hand them a stable task package.

This file defines the minimum viable task package schema for `v0.1`.

It is intentionally small.
The goal is not completeness.
The goal is to make real task handoff possible.

---

## Design goal

A task package should help an adapter execute correctly without forcing it to become the owner of durable context.

That means a task package should be:
- task-shaped
- source-grounded
- boundary-aware
- small enough to execute
- rich enough to preserve decision quality

---

## Minimum schema

A `TaskPackage v0.1` should contain these sections:

### 1. task
Core definition of the task.

Suggested fields:
- `task_id`
- `title`
- `goal`
- `task_type`
- `scope`
- `priority`

### 2. context
Task-relevant working context.

Suggested fields:
- `project_ref`
- `workflow_ref`
- `entity_refs`
- `current_state`
- `prior_residue_refs`

### 3. standards
The standards or decision rules needed for correct execution.

Suggested fields:
- `hard_requirements`
- `soft_signals`
- `red_flags`
- `decision_rules`
- `action_boundaries`

### 4. sources
Source grounding for the task.

Suggested fields:
- `source_refs`
- `note_refs`
- `document_refs`
- `relevant_urls`

### 5. execution
Execution-specific instructions.

Suggested fields:
- `adapter`
- `environment`
- `allowed_actions`
- `disallowed_actions`
- `handoff_policy`
- `confirmation_policy`

### 6. expected_output
What the adapter should return.

Suggested fields:
- `required_fields`
- `evidence_expectations`
- `ambiguity_expectations`
- `result_shape`

---

## Example shape

```yaml
task:
  task_id: hiring-screen-2026-03-batchA-candidate17
  title: Screen candidate 17 for backend role
  goal: Compare candidate against role criteria and return evidence-backed assessment
  task_type: evaluation
  scope: hiring-batch-backend-role
  priority: medium

context:
  project_ref: project/hiring-backend-2026-q1
  workflow_ref: workflow/candidate-screening
  entity_refs:
    - role/backend-engineer
    - candidate/candidate-17
  current_state: awaiting_browser_review
  prior_residue_refs:
    - residue/backend-role-edge-cases-01

standards:
  hard_requirements:
    - 3+ years backend experience
    - production service ownership
  soft_signals:
    - clear collaboration signals
    - pragmatic engineering tradeoff awareness
  red_flags:
    - unclear project ownership
    - inflated title without evidence
  decision_rules:
    - do not infer missing evidence as pass
  action_boundaries:
    - evaluate only
    - do not submit final disposition

sources:
  source_refs:
    - standards/backend-role-v3
    - project/hiring-backend-2026-q1
  note_refs:
    - notes/hiring/team-culture-fit
  document_refs:
    - docs/interview-loop-principles.md
  relevant_urls:
    - https://www.zhipin.com/...

execution:
  adapter: grasp
  environment: browser
  allowed_actions:
    - inspect_candidate_profile
    - expand_visible_sections
  disallowed_actions:
    - final_submit
    - external_contact
  handoff_policy: require_human_on_auth_or_irreversible_step
  confirmation_policy: explicit_confirmation_for_irreversible_actions

expected_output:
  required_fields:
    - outcome
    - evidence
    - ambiguity
    - suggested_residue
  evidence_expectations:
    - cite visible profile signals
  ambiguity_expectations:
    - flag missing or conflicting evidence
  result_shape: structured_evaluation
```

---

## Why each section exists

### task
Keeps execution anchored to a real goal.

### context
Lets the adapter know what durable thread this belongs to.

### standards
Protects judgment quality from drifting during execution.

### sources
Keeps the task source-grounded.

### execution
Defines what the adapter is and is not allowed to do.

### expected_output
Makes the result easier to write back into durable context.

---

## What this schema should prevent

This schema is meant to reduce several common failures:
- adapters guessing standards from weak context
- execution drifting beyond authorized boundaries
- task results returning as unstructured chat blur
- evidence being lost between execution and write-back
- long-term context being re-invented each time

---

## v0.1 discipline

For `v0.1`, the task package should remain:
- compact
- legible
- source-grounded
- easy for both humans and agents to inspect

Do not turn it into a giant orchestration manifest.

The point is to enable real work, not to produce schema theater.

---

## Bottom line

A `TaskPackage v0.1` is the minimum bridge between:
- `Livebase` as durable working context center
- and execution adapters such as `grasp`

Without a stable task package, adapter-driven task loops remain ad hoc.
