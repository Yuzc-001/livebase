# Livebase — End-to-End Example: Hiring Screening

日期：2026-03-23  
状态：首个端到端任务闭环样板

---

## Why this file exists

A system like `Livebase` should not remain at the level of principles, schemas, and roles.
It should be able to show a real task loop.

This file demonstrates one of the clearest examples:

# hiring screening with `Livebase` using `grasp` as a browser execution adapter

This is not meant to be a UI walkthrough.
It is a structural example of how the system should work end to end.

---

## Why hiring screening is a strong test

Hiring screening looks simple on the surface, but it is actually a high-context task.

It depends on more than:
- opening a candidate page
- reading a profile
- producing a pass/fail answer

It also depends on:
- role definition
- team standards
- culture signals
- prior residue from earlier candidates
- consistency across a batch
- action boundaries

That makes it a strong test of whether `Livebase` is really a durable working context system.

---

## Actors in this loop

### Livebase
Owns:
- role and project context
- standards and decision rules
- prior residue
- task preparation
- durable write-back

### grasp
Owns:
- browser entry
- session continuity
- page inspection
- interaction execution
- evidence return

### human
Owns:
- final judgment boundaries
- exceptional interpretation
- irreversible actions when required

---

## Step 0 — What already exists in Livebase

Before the task starts, `Livebase` already contains:

### document layer
- role definition note
- hiring standards note
- team culture note
- project note for the current hiring batch
- residue notes from earlier candidate reviews

### context layer
- role object
- candidate object
- hiring project context
- linked standards
- prior residue refs
- retrieval structure for screening tasks

This matters because the browser task should not start from zero.

---

## Step 1 — A real task appears

A candidate needs to be screened in Boss.

The concrete need is not just:
- “open the page and look”

It is:
- inspect this candidate under the right role criteria
- preserve evidence
- surface ambiguity
- avoid crossing action boundaries
- improve the next screening cycle if needed

That is a `Livebase` task, not just a browser task.

---

## Step 2 — Livebase retrieves working context

`Livebase` pulls together the smallest durable working context needed for the task.

That may include:
- role requirements
- soft preference signals
- red flags
- current hiring batch scope
- prior residue from similar candidates
- project state
- current action boundary

This retrieval should not be a giant history dump.
It should be a task-relevant working context bundle.

---

## Step 3 — Livebase creates a TaskPackage

Example:

```yaml
task:
  task_id: hiring-screen-2026-03-batchA-candidate17
  title: Screen candidate 17 for backend role
  goal: Compare candidate against backend role criteria and return evidence-backed evaluation
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
    - evidence of production responsibility
  soft_signals:
    - pragmatic communication
    - clear collaboration patterns
  red_flags:
    - inflated title without ownership evidence
    - unclear project contribution
  decision_rules:
    - missing evidence is not a pass
  action_boundaries:
    - evaluate only
    - do not submit final decision

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

This is the handoff from context system to execution adapter.

---

## Step 4 — grasp executes in the browser

`grasp` now uses the package to operate in Boss.

It may:
- enter the candidate page
- keep the authenticated browser session alive
- inspect visible profile sections
- expand relevant sections
- collect evidence from the page
- stop when boundary conditions are reached

Important:
`grasp` is not deciding the entire system model.
It is executing within the task boundaries defined by `Livebase`.

---

## Step 5 — grasp returns a WriteBackPackage candidate

Example:

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

This is not the final durable state yet.
It is the adapter’s structured result candidate for `Livebase` to evaluate.

---

## Step 6 — Livebase decides what becomes durable

`Livebase` should not blindly store everything.
It decides what is worth writing back.

Possible durable outputs:

### document layer updates
- a candidate residue note
- a project note update for the batch
- a standards note review candidate

### context layer updates
- candidate review state
- new residue link
- updated retrieval relevance for backend screening
- batch continuity update

This is where compounding begins.

---

## Step 7 — The next cycle gets stronger

When the next candidate arrives, the system is no longer starting from zero.

Now it may already have:
- a clarified ownership-evidence standard
- a residue pattern for “senior label without proof”
- a cleaner project-level hiring thread
- better continuity between human review and browser execution

This is what makes `Livebase` more than a browser helper.

---

## What would go wrong without Livebase

Without `Livebase`, the loop usually degrades into:
- human keeps standards in head
- agent/browser tool sees only current page
- decisions vary across candidates
- ambiguity is not preserved clearly
- lessons remain in chat instead of system residue
- the next cycle starts half-blind again

That is exactly the failure this system is meant to prevent.

---

## What this example proves

This example shows that `Livebase` can be understood as:
- a durable working context center
- a task preparation system
- a write-back system
- a continuity system across real execution

And it shows that `grasp` fits correctly as:
- a browser execution adapter

This is the right relationship.

---

## Bottom line

In a real hiring-screening loop, the correct flow is:

# Livebase prepares context → grasp executes in browser → Livebase writes back durable residue

That is how a durable working context system starts becoming a real work rather than a storage concept.
