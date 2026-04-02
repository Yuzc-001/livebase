import { DIRS, load, loadAll, makeId, now, save } from "./store.ts"
import {
  CheckpointSchema,
  ContinuationPackSchema,
  EvidenceGapSchema,
  ProjectSchema,
  ResidueSchema,
  SourceSchema,
  TaskSchema,
  type ContinuationPack,
  type EvidenceGap,
  type Project,
  type Residue,
  type Source,
  type Task,
} from "./schemas.ts"

export function createEvidenceGap(input: {
  question: string
  suggestedAction?: string
  whyItMatters?: string
  sourceRefs?: string[]
}): EvidenceGap {
  if (!input.question?.trim()) {
    throw new Error(`invalid_evidence_gap:${input.question ?? ""}`)
  }
  return EvidenceGapSchema.parse({
    id: makeId("gap", input.question),
    question: input.question.trim(),
    whyItMatters: input.whyItMatters?.trim() || undefined,
    suggestedAction: input.suggestedAction?.trim() || undefined,
    status: "open",
    sourceRefs: input.sourceRefs ?? [],
    createdAt: now(),
  })
}

export function parseEvidenceGap(raw: string): EvidenceGap {
  const [question, suggestedAction] = raw.split("::")
  return createEvidenceGap({
    question: question ?? raw,
    suggestedAction,
  })
}

export function requireTask(taskId: string): Task {
  const task = load<Task>(DIRS.tasks, taskId)
  if (!task) {
    throw new Error(`task_not_found:${taskId}`)
  }
  return TaskSchema.parse(task)
}

export function listTasks(): Task[] {
  return loadAll<Task>(DIRS.tasks).map(task => TaskSchema.parse(task))
}

export function createTask(input: {
  title: string
  goal: string
  projectRef?: string
  currentState?: string
  nextAction?: string
  blocker?: string
  evidenceGaps?: EvidenceGap[]
}): { id: string; task: Task } {
  if (input.projectRef) {
    const project = load<Project>(DIRS.projects, input.projectRef)
    if (!project) {
      throw new Error(`project_not_found:${input.projectRef}`)
    }
    ProjectSchema.parse(project)
  }

  const createdAt = now()
  const id = makeId("tsk", input.title)
  const evidenceGaps = input.evidenceGaps ?? []
  const task = TaskSchema.parse({
    id,
    type: "task",
    title: input.title,
    goal: input.goal,
    status: input.blocker ? "blocked" : "active",
    projectRef: input.projectRef,
    sourceRefs: [],
    residueRefs: [],
    currentState: input.currentState,
    currentBlocker: input.blocker,
    nextAction: input.nextAction,
    evidenceGaps,
    checkpoints:
      input.currentState || input.nextAction || input.blocker || evidenceGaps.length > 0
        ? [
            CheckpointSchema.parse({
              at: createdAt,
              reason: input.blocker ? "blocked" : "manual",
              summary: input.currentState,
              nextAction: input.nextAction,
              blocker: input.blocker,
              evidenceGapIds: evidenceGaps.map(item => item.id),
            }),
          ]
        : [],
    createdAt,
    updatedAt: createdAt,
  })
  save(DIRS.tasks, id, task)
  return { id, task }
}

export function checkpointTask(
  taskId: string,
  input: {
    reason: "pause" | "blocked" | "handoff" | "completed" | "manual"
    summary?: string
    nextAction?: string
    blocker?: string
    evidenceGaps?: EvidenceGap[]
  },
): Task {
  const task = requireTask(taskId)
  const evidenceGaps = input.evidenceGaps ?? []
  task.evidenceGaps = [...task.evidenceGaps, ...evidenceGaps]
  if (input.summary !== undefined) {
    task.currentState = input.summary
  }
  if (input.nextAction !== undefined) {
    task.nextAction = input.nextAction
  }
  if (input.blocker !== undefined) {
    task.currentBlocker = input.blocker
  }

  if (input.reason === "completed") {
    task.status = "completed"
    task.currentBlocker = undefined
  } else if (input.blocker) {
    task.status = "blocked"
  } else if (input.reason === "pause") {
    task.status = "paused"
  } else {
    task.status = "active"
  }

  task.updatedAt = now()
  task.checkpoints.push(
    CheckpointSchema.parse({
      at: task.updatedAt,
      reason: input.reason,
      summary: input.summary,
      nextAction: input.nextAction,
      blocker: input.blocker,
      evidenceGapIds: evidenceGaps.map(item => item.id),
    }),
  )
  const parsed = TaskSchema.parse(task)
  save(DIRS.tasks, taskId, parsed)
  return parsed
}

export function resolveEvidenceGap(
  taskId: string,
  evidenceGapId: string,
  updates: { nextAction?: string; currentState?: string } = {},
): Task {
  const task = requireTask(taskId)
  const evidenceGap = task.evidenceGaps.find(item => item.id === evidenceGapId)
  if (!evidenceGap) {
    throw new Error(`evidence_gap_not_found:${evidenceGapId}`)
  }
  evidenceGap.status = "resolved"
  evidenceGap.resolvedAt = now()
  if (updates.nextAction !== undefined) {
    task.nextAction = updates.nextAction
  }
  if (updates.currentState !== undefined) {
    task.currentState = updates.currentState
  }
  if (!task.evidenceGaps.some(item => item.status === "open")) {
    task.currentBlocker = undefined
    if (task.status !== "completed") {
      task.status = "active"
    }
  }
  task.updatedAt = now()
  task.checkpoints.push(
    CheckpointSchema.parse({
      at: task.updatedAt,
      reason: "manual",
      summary: updates.currentState,
      nextAction: updates.nextAction,
      evidenceGapIds: [evidenceGapId],
    }),
  )
  const parsed = TaskSchema.parse(task)
  save(DIRS.tasks, taskId, parsed)
  return parsed
}

export function buildContinuationPack(taskId: string): ContinuationPack {
  const task = requireTask(taskId)
  const openEvidenceGaps = task.evidenceGaps.filter(item => item.status === "open")
  const primaryEvidenceGap = openEvidenceGaps[openEvidenceGaps.length - 1] ?? null
  const nextAction =
    primaryEvidenceGap?.suggestedAction ??
    (primaryEvidenceGap ? `Resolve evidence gap: ${primaryEvidenceGap.question}` : task.nextAction ?? null)

  const project = task.projectRef ? load<Project>(DIRS.projects, task.projectRef) : null
  const sourceIds = task.projectRef && project ? ProjectSchema.parse(project).sourceRefs : task.sourceRefs
  const residueIds = task.projectRef && project ? ProjectSchema.parse(project).residueRefs : task.residueRefs
  const supportingSources = sourceIds
    .map(id => load<Source>(DIRS.sources, id))
    .filter((item): item is Source => item !== null)
    .map(item => SourceSchema.parse(item))
  const recentResidue = residueIds
    .map(id => load<Residue>(DIRS.residue, id))
    .filter((item): item is Residue => item !== null)
    .map(item => ResidueSchema.parse(item))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return ContinuationPackSchema.parse({
    id: makeId("cont", task.title),
    type: "continuation-pack",
    taskRef: task.id,
    projectRef: task.projectRef,
    title: task.title,
    goal: task.goal,
    currentState: task.currentState ?? null,
    currentBlocker: task.currentBlocker ?? null,
    primaryEvidenceGap,
    nextAction,
    openEvidenceGapCount: openEvidenceGaps.length,
    supportingSources,
    recentResidue,
    createdAt: now(),
  })
}
