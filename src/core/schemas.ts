import { z } from "zod"

export const ProjectSchema = z.object({
  id: z.string(),
  type: z.literal("project"),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "completed", "archived"]).default("active"),
  sourceRefs: z.array(z.string()).default([]),
  noteRefs: z.array(z.string()).default([]),
  residueRefs: z.array(z.string()).default([]),
  standards: z
    .object({
      hardRequirements: z.array(z.string()).default([]),
      softSignals: z.array(z.string()).default([]),
      redFlags: z.array(z.string()).default([]),
      actionBoundaries: z.array(z.string()).default([]),
    })
    .default({
      hardRequirements: [],
      softSignals: [],
      redFlags: [],
      actionBoundaries: [],
    }),
  currentState: z.string().optional(),
  nextStep: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Project = z.infer<typeof ProjectSchema>

export const SourceSchema = z.object({
  id: z.string(),
  type: z.literal("source"),
  title: z.string(),
  content: z.string(),
  sourceType: z.enum(["file", "url", "note", "document", "transcript", "other"]).default("file"),
  sourcePath: z.string().optional(),
  projectRef: z.string().optional(),
  tags: z.array(z.string()).default([]),
  capturedAt: z.string(),
  updatedAt: z.string(),
})
export type Source = z.infer<typeof SourceSchema>

export const NoteSchema = z.object({
  id: z.string(),
  type: z.literal("note"),
  title: z.string(),
  body: z.string(),
  sourceRefs: z.array(z.string()).default([]),
  projectRef: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Note = z.infer<typeof NoteSchema>

export const EvidenceGapSchema = z.object({
  id: z.string(),
  question: z.string(),
  whyItMatters: z.string().optional(),
  suggestedAction: z.string().optional(),
  sourceRefs: z.array(z.string()).default([]),
  status: z.enum(["open", "resolved", "superseded"]).default("open"),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
})
export type EvidenceGap = z.infer<typeof EvidenceGapSchema>

export const CheckpointSchema = z.object({
  at: z.string(),
  reason: z.enum(["pause", "blocked", "handoff", "completed", "manual"]).default("manual"),
  summary: z.string().optional(),
  nextAction: z.string().optional(),
  blocker: z.string().optional(),
  evidenceGapIds: z.array(z.string()).default([]),
})
export type Checkpoint = z.infer<typeof CheckpointSchema>

export const TaskSchema = z.object({
  id: z.string(),
  type: z.literal("task"),
  title: z.string(),
  goal: z.string(),
  status: z.enum(["active", "blocked", "paused", "completed", "failed"]).default("active"),
  projectRef: z.string().optional(),
  sourceRefs: z.array(z.string()).default([]),
  residueRefs: z.array(z.string()).default([]),
  currentState: z.string().optional(),
  currentBlocker: z.string().optional(),
  nextAction: z.string().optional(),
  evidenceGaps: z.array(EvidenceGapSchema).default([]),
  checkpoints: z.array(CheckpointSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Task = z.infer<typeof TaskSchema>

export const ResidueSchema = z.object({
  id: z.string(),
  type: z.literal("residue"),
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
  taskRef: z.string().optional(),
  createdAt: z.string(),
})
export type Residue = z.infer<typeof ResidueSchema>

export const ContinuationPackSchema = z.object({
  id: z.string(),
  type: z.literal("continuation-pack"),
  taskRef: z.string(),
  projectRef: z.string().optional(),
  title: z.string(),
  goal: z.string(),
  currentState: z.string().nullable(),
  currentBlocker: z.string().nullable(),
  primaryEvidenceGap: EvidenceGapSchema.nullable(),
  nextAction: z.string().nullable(),
  openEvidenceGapCount: z.number(),
  supportingSources: z.array(SourceSchema).default([]),
  recentResidue: z.array(ResidueSchema).default([]),
  continuationRegister: z
    .object({
      version: z.literal("1"),
      taskRef: z.string(),
      projectRef: z.string().nullable(),
      coreTension: z.string(),
      tasteLock: z.string(),
      primaryGap: z
        .object({
          id: z.string(),
          question: z.string(),
        })
        .nullable(),
      nextMove: z.string().nullable(),
      evidenceAnchors: z.object({
        sourceRefs: z.array(z.string()).default([]),
        residueRefs: z.array(z.string()).default([]),
      }),
      promptBlock: z.string(),
    })
    .optional(),
  createdAt: z.string(),
})
export type ContinuationPack = z.infer<typeof ContinuationPackSchema>
export type ContinuationRegister = NonNullable<ContinuationPack["continuationRegister"]>

export const ExecutionContractSchema = z.object({
  id: z.string(),
  type: z.literal("execution-contract"),
  createdAt: z.string(),
  task: z.object({
    taskRef: z.string(),
    title: z.string(),
    goal: z.string(),
    status: z.string(),
    projectRef: z.string().optional(),
  }),
  continuation: z.object({
    currentState: z.string().nullable(),
    currentBlocker: z.string().nullable(),
    nextAction: z.string().nullable(),
    primaryEvidenceGap: EvidenceGapSchema.nullable(),
    openEvidenceGapCount: z.number(),
  }),
  knowledge: z.object({
    sourceRefs: z.array(z.string()).default([]),
    residueRefs: z.array(z.string()).default([]),
  }),
  boundaries: z.object({
    allowedActions: z.array(z.string()).default([]),
    disallowedActions: z.array(z.string()).default([]),
    stopConditions: z.array(z.string()).default([]),
  }),
  success: z.object({
    requiredChecks: z.array(z.string()).default([]),
    evidenceExpectations: z.array(z.string()).default([]),
    requiredOutputSections: z.array(z.string()).default(["run", "checks", "ambiguity"]),
  }),
  adapter: z.object({
    name: z.string(),
  }),
})
export type ExecutionContract = z.infer<typeof ExecutionContractSchema>

export const VerificationCheckSchema = z.object({
  name: z.string(),
  method: z.string(),
  observed: z.string(),
  sourceRefs: z.array(z.string()).default([]),
  contrarySignals: z.array(z.string()).default([]),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
})
export type VerificationCheck = z.infer<typeof VerificationCheckSchema>

export const VerificationLedgerInputSchema = z.object({
  run: z.object({
    taskRef: z.string(),
    contractRef: z.string().optional(),
    executor: z.string().optional(),
    status: z.enum(["completed", "partial", "blocked", "failed"]),
    outcome: z.string(),
    completedAt: z.string(),
  }),
  checks: z.array(VerificationCheckSchema).min(1),
  ambiguity: z.object({
    openQuestions: z.array(z.string()).default([]),
    missingEvidence: z
      .array(
        z.object({
          question: z.string(),
          suggestedAction: z.string().optional(),
        }),
      )
      .default([]),
    confidenceNote: z.string().optional(),
  }),
  residue: z
    .object({
      residueType: ResidueSchema.shape.residueType,
      title: z.string(),
      body: z.string(),
      importance: ResidueSchema.shape.importance.default("medium"),
      sourceRefs: z.array(z.string()).default([]),
      projectRef: z.string().optional(),
    })
    .optional(),
  updates: z
    .object({
      projectRef: z.string().optional(),
      taskStatus: TaskSchema.shape.status.optional(),
      currentState: z.string().optional(),
      nextAction: z.string().optional(),
      closeEvidenceGapIds: z.array(z.string()).default([]),
      projectState: z.string().optional(),
      projectNextStep: z.string().optional(),
    })
    .optional(),
})
export type VerificationLedgerInput = z.infer<typeof VerificationLedgerInputSchema>

export const VerificationLedgerSchema = VerificationLedgerInputSchema.extend({
  id: z.string(),
  type: z.literal("verification-ledger"),
  createdAt: z.string(),
})
export type VerificationLedger = z.infer<typeof VerificationLedgerSchema>
