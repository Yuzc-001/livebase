# Livebase — Write-Back Schema v0.1

日期：2026-03-23  
状态：最小可运行 contract

---

## Why this file exists

If execution ends without strengthening future work,
then `Livebase` collapses back into task-by-task assistance.

This file defines the minimum viable write-back schema for `v0.1`.

The goal is not to store everything.
The goal is to preserve the smallest durable residue that improves the next cycle.

---

## Design goal

A write-back package should be:
- grounded in actual execution
- selective rather than exhaustive
- useful for future retrieval
- distinguishable from raw source
- small enough to maintain trust

---

## Minimum schema

A `WriteBackPackage v0.1` should contain these sections:

### 1. task_result
What happened in the task.

Suggested fields:
- `task_id`
- `outcome`
- `status`
- `completed_at`
- `adapter`

### 2. evidence
What supports the result.

Suggested fields:
- `evidence_summary`
- `evidence_refs`
- `source_refs`
- `observed_signals`

### 3. ambiguity
What remains uncertain.

Suggested fields:
- `open_questions`
- `missing_evidence`
- `conflicts`
- `confidence_note`

### 4. residue
What may deserve durable preservation.

Suggested fields:
- `residue_type`
- `residue_title`
- `residue_body`
- `residue_refs`
- `importance`

### 5. state_updates
What the system may need to update.

Suggested fields:
- `project_state_update`
- `entity_state_update`
- `workflow_state_update`
- `next_step`

### 6. standard_updates
What standards may need refinement.

Suggested fields:
- `standard_ref`
- `update_candidate`
- `reason`
- `requires_human_review`

---

## Example shape

```yaml
task_result:
  task_id: hiring-screen-2026-03-batchA-candidate17
  outcome: mixed_signal_candidate
  status: completed
  completed_at: 2026-03-23T15:40:00Z
  adapter: grasp

evidence:
  evidence_summary: Candidate meets core backend experience threshold, but ownership depth is not fully evidenced.
  evidence_refs:
    - browser-observation/profile-section-experience
    - browser-observation/profile-section-projects
  source_refs:
    - standards/backend-role-v3
    - notes/hiring/team-culture-fit
  observed_signals:
    - 4 years backend work claimed
    - production system mention present
    - ownership signal partial

ambiguity:
  open_questions:
    - Did candidate own production incidents directly?
  missing_evidence:
    - No clear ownership examples shown
  conflicts:
    - Strong title signal but weak project-detail evidence
  confidence_note: medium confidence, needs follow-up

residue:
  residue_type: evaluation_edge_case
  residue_title: Senior-sounding profile with weak ownership evidence
  residue_body: In backend screening, senior labels should not outrank demonstrated ownership evidence.
  residue_refs:
    - candidate/candidate-17
    - role/backend-engineer
  importance: medium

state_updates:
  project_state_update: hiring batch reviewed candidate 17 with mixed result
  entity_state_update: candidate-17 marked needs-follow-up
  workflow_state_update: pending manual follow-up
  next_step: ask recruiter to collect ownership examples

standard_updates:
  standard_ref: standards/backend-role-v3
  update_candidate: add clearer ownership-evidence check in screening notes
  reason: repeated ambiguity across similar candidates
  requires_human_review: true
```

---

## Why each section exists

### task_result
Keeps write-back tied to a real task, not floating insight.

### evidence
Prevents residue from drifting away from observed reality.

### ambiguity
Preserves uncertainty instead of forcing false closure.

### residue
Captures the smallest durable improvement for future work.

### state_updates
Lets the surrounding project/task system keep continuity.

### standard_updates
Allows decision quality to improve over repeated cycles.

---

## What this schema should prevent

This schema is meant to reduce several common failures:
- work finishes but nothing durable changes
- lessons remain only in chat history
- summaries outrank evidence
- every new cycle repeats the same confusion
- write-back turns into noisy full-task restatement

---

## v0.1 discipline

For `v0.1`, write-back should be:
- conservative
- evidence-backed
- selective
- useful on next retrieval

Do not write back every thought.
Do not confuse completeness with durability.
Do not replace source with summary.

The right question is:

# what is the smallest durable residue that will improve the next cycle of work?

---

## Relationship to adapters

Execution adapters should not become the permanent home of task history.
They should return results that make durable write-back possible.

That means:
- adapters execute and report
- `Livebase` decides what becomes durable

This protects the center of the system.

---

## Bottom line

A `WriteBackPackage v0.1` is the minimum bridge between:
- finished execution
- and stronger future work

Without a stable write-back schema, task loops stay shallow and do not compound.
