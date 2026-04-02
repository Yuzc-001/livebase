import { DIRS, load, makeId, now, save } from "./store.ts"
import {
  CheckpointSchema,
  ProjectSchema,
  ResidueSchema,
  TaskSchema,
  VerificationLedgerInputSchema,
  VerificationLedgerSchema,
  type Project,
  type Task,
} from "./schemas.ts"
import { createEvidenceGap } from "./task.ts"

export function applyVerificationLedger(rawInput: unknown): {
  status: "ok"
  ledgerId: string
  residueId: string | null
  taskId: string
  written: string[]
} {
  const input = VerificationLedgerInputSchema.parse(rawInput)
  const task = load<Task>(DIRS.tasks, input.run.taskRef)
  if (!task) {
    throw new Error(`task_not_found:${input.run.taskRef}`)
  }

  const parsedTask = TaskSchema.parse(task)
  const ledgerId = makeId("ledger", parsedTask.title)
  const createdAt = now()
  const ledger = VerificationLedgerSchema.parse({
    id: ledgerId,
    type: "verification-ledger",
    createdAt,
    ...input,
  })

  const written: string[] = []
  written.push(save(DIRS.ledgers, ledgerId, ledger))

  let residueId: string | null = null

  if (input.residue) {
    residueId = makeId("res", input.residue.title)
    const residue = ResidueSchema.parse({
      id: residueId,
      type: "residue",
      ...input.residue,
      taskRef: parsedTask.id,
      projectRef: input.residue.projectRef ?? parsedTask.projectRef,
      createdAt,
    })
    written.push(save(DIRS.residue, residueId, residue))
    parsedTask.residueRefs = [...new Set([...parsedTask.residueRefs, residueId])]

    const projectRef = residue.projectRef ?? parsedTask.projectRef
    if (projectRef) {
      const project = load<Project>(DIRS.projects, projectRef)
      if (project) {
        const parsedProject = ProjectSchema.parse(project)
        parsedProject.residueRefs = [...new Set([...parsedProject.residueRefs, residueId])]
        parsedProject.updatedAt = now()
        written.push(save(DIRS.projects, projectRef, parsedProject))
      }
    }
  }

  const updates = input.updates
  if (updates?.closeEvidenceGapIds?.length) {
    for (const gapId of updates.closeEvidenceGapIds) {
      const gap = parsedTask.evidenceGaps.find(item => item.id === gapId)
      if (!gap) {
        throw new Error(`evidence_gap_not_found:${gapId}`)
      }
      if (gap.status === "open") {
        gap.status = "resolved"
        gap.resolvedAt = createdAt
      }
    }
  }

  if (input.ambiguity.missingEvidence.length > 0) {
    parsedTask.evidenceGaps = [
      ...parsedTask.evidenceGaps,
      ...input.ambiguity.missingEvidence.map(item =>
        createEvidenceGap({
          question: item.question,
          suggestedAction: item.suggestedAction,
        }),
      ),
    ]
  }

  if (updates?.currentState !== undefined) {
    parsedTask.currentState = updates.currentState
  }
  if (updates?.nextAction !== undefined) {
    parsedTask.nextAction = updates.nextAction
  }
  const nextTaskStatus =
    updates?.taskStatus !== undefined
      ? updates.taskStatus
      : input.run.status === "blocked"
        ? "blocked"
        : input.run.status === "failed"
          ? "failed"
          : input.ambiguity.missingEvidence.length > 0
            ? "active"
            : input.run.status === "completed"
              ? "completed"
              : "active"

  parsedTask.status = nextTaskStatus
  if (nextTaskStatus === "blocked") {
    parsedTask.currentBlocker = input.run.outcome
  } else {
    parsedTask.currentBlocker = undefined
  }

  parsedTask.updatedAt = now()
  parsedTask.checkpoints.push(
    CheckpointSchema.parse({
      at: parsedTask.updatedAt,
      reason: input.run.status === "completed" ? "completed" : "manual",
      summary: input.run.outcome,
      nextAction: updates?.nextAction,
      blocker: input.run.status === "blocked" ? input.run.outcome : undefined,
      evidenceGapIds: updates?.closeEvidenceGapIds ?? [],
    }),
  )
  written.push(save(DIRS.tasks, parsedTask.id, parsedTask))

  const projectRef = updates?.projectRef ?? parsedTask.projectRef
  if (projectRef) {
    const project = load<Project>(DIRS.projects, projectRef)
    if (project) {
      const parsedProject = ProjectSchema.parse(project)
      if (updates?.projectState !== undefined) {
        parsedProject.currentState = updates.projectState
      }
      if (updates?.projectNextStep !== undefined) {
        parsedProject.nextStep = updates.projectNextStep
      }
      parsedProject.updatedAt = now()
      written.push(save(DIRS.projects, projectRef, parsedProject))
    }
  }

  return {
    status: "ok",
    ledgerId,
    residueId,
    taskId: parsedTask.id,
    written,
  }
}
