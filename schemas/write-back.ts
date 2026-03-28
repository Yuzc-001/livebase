import { z } from "zod"

// WriteBackPackage — returned by an adapter to Livebase after task completion.
// Drives residue creation, state updates, and standard refinements.
export const WriteBackPackageSchema = z.object({
  task_result: z.object({
    task_id: z.string(),
    outcome: z.string(),
    status: z.enum(["completed", "partial", "blocked", "failed"]),
    completed_at: z.string(),
    adapter: z.string().optional(),
  }),

  evidence: z.object({
    evidence_summary: z.string(),
    evidence_refs: z.array(z.string()).default([]),
    source_refs: z.array(z.string()).default([]),
    observed_signals: z.array(z.string()).default([]),
  }),

  ambiguity: z.object({
    open_questions: z.array(z.string()).default([]),
    missing_evidence: z.array(z.string()).default([]),
    conflicts: z.array(z.string()).default([]),
    confidence_note: z.string().optional(),
  }),

  // Optional: residue candidate to write into store
  residue: z
    .object({
      residueType: z.enum([
        "next-time-rule",
        "lesson",
        "decision-note",
        "project-state-update",
        "standard-clarification",
        "evaluation-edge-case",
        "other",
      ]),
      title: z.string(),
      body: z.string(),
      importance: z.enum(["high", "medium", "low"]).default("medium"),
      sourceRefs: z.array(z.string()).default([]),
      projectRef: z.string().optional(),
      entityRefs: z.array(z.string()).default([]),
    })
    .optional(),

  state_updates: z
    .object({
      project_ref: z.string().optional(),
      project_state_update: z.string().optional(),
      entity_state_update: z.string().optional(),
      workflow_state_update: z.string().optional(),
      next_step: z.string().optional(),
    })
    .optional(),

  standard_updates: z
    .object({
      standard_ref: z.string().optional(),
      update_candidate: z.string(),
      reason: z.string(),
      requires_human_review: z.boolean().default(true),
    })
    .optional(),
})

export type WriteBackPackage = z.infer<typeof WriteBackPackageSchema>
