import { z } from "zod"

// ── Source ──────────────────────────────────────────────────────────────────
// Origin-bearing object. The anchor from which all abstractions grow.
export const SourceSchema = z.object({
  id: z.string(),
  type: z.literal("source"),
  title: z.string(),
  content: z.string().optional(),
  sourceType: z.enum(["file", "url", "note", "document", "transcript", "other"]),
  sourcePath: z.string().optional(),
  projectRef: z.string().optional(),
  entityRefs: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  capturedAt: z.string(),
  updatedAt: z.string(),
})
export type Source = z.infer<typeof SourceSchema>

// ── Note ────────────────────────────────────────────────────────────────────
// Working interpretation layer on top of sources. Human-readable, editable.
export const NoteSchema = z.object({
  id: z.string(),
  type: z.literal("note"),
  title: z.string(),
  body: z.string(),
  sourceRefs: z.array(z.string()).default([]),
  projectRef: z.string().optional(),
  entityRefs: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Note = z.infer<typeof NoteSchema>

// ── Project ─────────────────────────────────────────────────────────────────
// Durable context container for ongoing work. Holds refs to all linked objects.
export const ProjectSchema = z.object({
  id: z.string(),
  type: z.literal("project"),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "completed", "archived"]).default("active"),
  sourceRefs: z.array(z.string()).default([]),
  noteRefs: z.array(z.string()).default([]),
  entityRefs: z.array(z.string()).default([]),
  residueRefs: z.array(z.string()).default([]),
  standards: z
    .object({
      hard_requirements: z.array(z.string()).default([]),
      soft_signals: z.array(z.string()).default([]),
      red_flags: z.array(z.string()).default([]),
      action_boundaries: z.array(z.string()).default([]),
    })
    .optional(),
  currentState: z.string().optional(),
  nextStep: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Project = z.infer<typeof ProjectSchema>

// ── Entity ──────────────────────────────────────────────────────────────────
// Recurring thing that deserves stable identity across sessions.
export const EntitySchema = z.object({
  id: z.string(),
  type: z.literal("entity"),
  name: z.string(),
  entityType: z.enum(["person", "tool", "company", "concept", "document-family", "other"]),
  description: z.string().optional(),
  sourceRefs: z.array(z.string()).default([]),
  noteRefs: z.array(z.string()).default([]),
  projectRefs: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Entity = z.infer<typeof EntitySchema>

// ── Residue ─────────────────────────────────────────────────────────────────
// Smallest durable write-back object produced after meaningful work.
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
  entityRefs: z.array(z.string()).default([]),
  taskRef: z.string().optional(),
  createdAt: z.string(),
})
export type Residue = z.infer<typeof ResidueSchema>

// ── ContextPack ─────────────────────────────────────────────────────────────
// Task-oriented retrieval bundle. Bridge between stored material and active work.
export const ContextPackSchema = z.object({
  id: z.string(),
  type: z.literal("context-pack"),
  purpose: z.string(),
  projectRef: z.string().optional(),
  projectContext: ProjectSchema.optional(),
  sources: z.array(SourceSchema).default([]),
  notes: z.array(NoteSchema).default([]),
  entities: z.array(EntitySchema).default([]),
  residue: z.array(ResidueSchema).default([]),
  summary: z.string().optional(),
  freshness: z.string(),
})
export type ContextPack = z.infer<typeof ContextPackSchema>
