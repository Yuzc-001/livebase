import { z } from "zod"

// TaskPackage — handed from Livebase to an execution adapter.
// Carries goal, context, standards, source refs, and action boundaries.
export const TaskPackageSchema = z.object({
  task: z.object({
    task_id: z.string(),
    title: z.string(),
    goal: z.string(),
    task_type: z.enum(["evaluation", "research", "implementation", "review", "screening", "other"]),
    scope: z.string().optional(),
    priority: z.enum(["high", "medium", "low"]).default("medium"),
  }),

  context: z.object({
    project_ref: z.string().optional(),
    workflow_ref: z.string().optional(),
    entity_refs: z.array(z.string()).default([]),
    current_state: z.string().optional(),
    prior_residue_refs: z.array(z.string()).default([]),
  }),

  standards: z.object({
    hard_requirements: z.array(z.string()).default([]),
    soft_signals: z.array(z.string()).default([]),
    red_flags: z.array(z.string()).default([]),
    decision_rules: z.array(z.string()).default([]),
    action_boundaries: z.array(z.string()).default([]),
  }),

  sources: z.object({
    source_refs: z.array(z.string()).default([]),
    note_refs: z.array(z.string()).default([]),
    document_refs: z.array(z.string()).default([]),
    relevant_urls: z.array(z.string()).default([]),
  }),

  execution: z.object({
    adapter: z.string(),
    environment: z.string().optional(),
    allowed_actions: z.array(z.string()).default([]),
    disallowed_actions: z.array(z.string()).default([]),
    handoff_policy: z.string().optional(),
    confirmation_policy: z.string().optional(),
  }),

  expected_output: z.object({
    required_fields: z
      .array(z.string())
      .default(["outcome", "evidence", "ambiguity", "suggested_residue"]),
    evidence_expectations: z.array(z.string()).default([]),
    ambiguity_expectations: z.array(z.string()).default([]),
    result_shape: z.string().default("structured_evaluation"),
  }),
})

export type TaskPackage = z.infer<typeof TaskPackageSchema>
