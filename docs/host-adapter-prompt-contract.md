# Host Adapter Prompt Contract

## One line

`Livebase` host adapters exist to continue one bounded run of work from the last unresolved evidence gap, not to replay chat history or improvise a loose task summary.

## Purpose

Different hosts should consume the same `resume / contract / writeback` loop in the same way.

This contract standardizes:

- what a host reads first
- what boundaries a host must obey before acting
- what a host is allowed to write back
- how a host should phrase its own local prompt overlay
- how a host should keep the sharpest run-state constraints hydrated across run boundaries
- how a host can machine-load its register hydration rules instead of improvising them

Ready presets live in:

- [adapter-presets/README.md](./adapter-presets/README.md)
- [continuation-register-v1.md](./continuation-register-v1.md)

## Run Protocol

Every host run should follow this order:

1. Choose exactly one `taskId`.
2. If using a preset asset, load its `loader` contract from `presets/adapter-presets/registry.json`.
3. Call `livebase.task.resume`.
   If the loader declares `includeRegister=true`, request the register in the same response.
4. If `continuationRegister.promptBlock` is present and the loader policy is `if_present`, inject it at the declared position before long local instructions.
5. If a cached prior register conflicts with fresh canonical state from `resume`, the fresh `resume` payload wins.
6. Call `livebase.task.contract`.
7. Execute only within the returned contract boundaries.
8. End with one of:
   - `livebase.task.writeback`
   - `livebase.task.checkpoint`

If the host does not have enough evidence to finish the run, it should prefer `partial` or `blocked` over bluffing `completed`.

`Continuation Register` is currently a derived host-side protocol, not a dedicated MCP tool.  
Use [continuation-register-v1.md](./continuation-register-v1.md) as the canonical spec.

Current preset loaders use one shared policy:

- `resume.includeRegister = true`
- `register.source = continuationRegister.promptBlock`
- `register.position = top_of_attention`
- `register.policy = if_present`
- `register.conflictResolution = fresh_resume_wins`

That lets loaders, adapter hosts, and orchestrators consume the same register semantics without re-reading prose docs on every integration.

## Canonical Inputs

### `livebase.task.resume`

Treat the returned `structuredContent` as canonical.

The host should consume these fields first:

- `taskRef`
- `title`
- `goal`
- `currentState`
- `currentBlocker`
- `primaryEvidenceGap`
- `nextAction`
- `openEvidenceGapCount`
- `supportingSources`
- `recentResidue`

Consumption rules:

- `primaryEvidenceGap` is the center of the current run.
- `nextAction` is the smallest trustworthy next step.
- `supportingSources` are evidence sources, not a transcript to replay.
- `recentResidue` contains durable leverage from prior runs, not mandatory context to repeat verbatim.

### `livebase.task.contract`

Hosts must call `contract` before tool-heavy execution, delegation, or any substantive external action.

The host should consume these fields as hard constraints:

- `task`
- `continuation`
- `knowledge`
- `boundaries.allowedActions`
- `boundaries.disallowedActions`
- `boundaries.stopConditions`
- `success.requiredChecks`
- `success.evidenceExpectations`
- `success.requiredOutputSections`
- `adapter.name`

Consumption rules:

- `boundaries` are execution constraints, not suggestions.
- `success.requiredChecks` define the minimum proof needed for a credible writeback.
- `stopConditions` define when the host must stop and escalate or checkpoint.

### `livebase.task.writeback`

The writeback payload is a verification ledger, not a narrative summary.

Minimum expectations:

- `run.status` must be one of `completed | partial | blocked | failed`
- `checks` must contain at least one concrete observed check
- `ambiguity` must separate open questions from observed evidence
- `updates.nextAction` should be one smallest trustworthy next step
- `updates.closeEvidenceGapIds` may include only gaps actually resolved by evidence
- `residue` is optional and should be used only for durable future leverage

## Host Rules

Every host adapter should follow these rules:

1. Call `resume` before deciding what to do.
2. Treat `primaryEvidenceGap` as the current round's highest-priority work center.
3. Rehydrate the smallest high-attention run state before long local reasoning.
4. Call `contract` before external execution or delegation.
5. Keep observed evidence separate from inference.
6. Use `writeback` only when the run produced concrete checks.
7. Use `checkpoint` when the run pauses, blocks, or hands off before a real verification ledger is warranted.
8. Prefer one sharp `nextAction` over a broad to-do list.

## Forbidden

Hosts must not:

- skip `resume`
- let a stale register outrank fresh canonical task state
- skip `contract` before acting
- write essays instead of checks
- invent evidence, source refs, or confidence levels
- close evidence gaps without observed support
- dump long chain-of-thought or raw transcripts into Livebase
- let multiple child agents independently write back the same task thread

In multi-agent runs, one coordinator should aggregate evidence and emit one final `writeback`.

## Stable Error Contract

Hosts should treat `structuredContent` as canonical for errors too.

Tool failures should be consumed through:

```json
{
  "ok": false,
  "tool": "livebase.task.get",
  "error": {
    "code": "task_not_found",
    "category": "not_found",
    "message": "Livebase task was not found.",
    "detail": "tsk-missing",
    "retryable": false,
    "target": {
      "type": "task",
      "id": "tsk-missing"
    }
  }
}
```

Hosts should branch on:

- `error.code` for exact handling
- `error.category` for coarse routing
- `error.retryable` for retry policy

## Recommended Prompt Overlay

Use this as a host-side adapter overlay, not as a replacement for the host's own system prompt:

```text
You are the {HOST_NAME} adapter for Livebase.

Your job is to continue one bounded run of real work from the last unresolved evidence gap.
You are not here to preserve conversation history or generate a broad summary.

Protocol:
1. Work on exactly one Livebase task at a time.
2. Call `livebase.task.resume` before taking substantive action.
3. Treat `structuredContent` as canonical for both success and error results.
4. Use `primaryEvidenceGap` and `nextAction` as the center of this run.
5. Call `livebase.task.contract` before external execution, delegation, or tool-heavy work.
6. Obey contract boundaries, stop conditions, and required checks.
7. Separate observed evidence from inference.
8. End the run with either:
   - `livebase.task.writeback`
   - `livebase.task.checkpoint`

Execution rules:
- Prefer the smallest action that resolves the current evidence gap or sharpens the next step.
- Use supporting sources as evidence, not as a transcript to replay.
- If a `Continuation Register` is present, treat it as an attention hydrator, not as source truth.
- If the current gap cannot be resolved from available sources, escalate or write back missing evidence.
- Never claim completion without evidence-backed checks.

Writeback rules:
- `checks` must contain concrete observed checks.
- `ambiguity` must capture what remains unresolved.
- `updates.nextAction` must be one smallest trustworthy next step.
- `closeEvidenceGapIds` may only reference gaps resolved by observed evidence.
- `residue` should contain only durable leverage for the next run.
- After the run, refresh the host-side `Continuation Register` from the new canonical task state.

Forbidden:
- do not skip resume
- do not skip contract before acting
- do not invent evidence
- do not write essays instead of checks
- do not close gaps without observed support
- do not dump chain-of-thought into Livebase

When uncertain:
- prefer partial over completed
- prefer blocked over bluffing
- prefer one sharp next action over a broad summary
```

## Host Classes

### Tool-rich coding hosts

Examples: Codex, Claude Code, OpenCode.

These hosts should fully consume the protocol:

- `resume`
- `contract`
- real tool execution
- `writeback`

### Pure chat hosts

These hosts may still use the protocol, but they must not pretend they performed external verification they did not perform.

They should prefer:

- `checkpoint`
- `writeback(status=partial|blocked)`

when direct evidence is incomplete.

### Multi-agent orchestrators

These hosts should:

- let one coordinator own `resume`
- let one coordinator own `contract`
- collect evidence from workers
- emit one aggregated `writeback`

They should not allow multiple workers to independently mutate the same Livebase task thread.

## Ready Presets

If you want a copy-pasteable overlay instead of adapting the generic contract by hand, use:

- [adapter-presets/codex.md](./adapter-presets/codex.md)
- [adapter-presets/claude-code.md](./adapter-presets/claude-code.md)
- [adapter-presets/openai-responses-host.md](./adapter-presets/openai-responses-host.md)
- [adapter-presets/orchestrator.md](./adapter-presets/orchestrator.md)
