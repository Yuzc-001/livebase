import { DIRS, makeId, now, save } from "./store.ts"
import { ExecutionContractSchema, type ExecutionContract } from "./schemas.ts"
import { buildContinuationPack, requireTask } from "./task.ts"
import { requireProject } from "./project.ts"

export function createExecutionContract(input: {
  taskId: string
  adapter?: string
  allowedActions?: string[]
  disallowedActions?: string[]
  requiredChecks?: string[]
}): { id: string; contract: ExecutionContract } {
  const task = requireTask(input.taskId)
  const continuation = buildContinuationPack(input.taskId)
  const project = task.projectRef ? requireProject(task.projectRef) : null
  const createdAt = now()
  const id = makeId("contract", task.title)

  const allowedActions = input.allowedActions?.length ? input.allowedActions : []
  const disallowedActions = input.disallowedActions?.length ? input.disallowedActions : []
  const requiredChecks =
    input.requiredChecks?.length
      ? input.requiredChecks
      : [
          "Record at least one concrete verification check.",
          "Separate observed evidence from remaining ambiguity.",
        ]

  const contract = ExecutionContractSchema.parse({
    id,
    type: "execution-contract",
    createdAt,
    task: {
      taskRef: task.id,
      title: task.title,
      goal: task.goal,
      status: task.status,
      projectRef: task.projectRef,
    },
    continuation: {
      currentState: continuation.currentState,
      currentBlocker: continuation.currentBlocker,
      nextAction: continuation.nextAction,
      primaryEvidenceGap: continuation.primaryEvidenceGap,
      openEvidenceGapCount: continuation.openEvidenceGapCount,
    },
    knowledge: {
      sourceRefs: continuation.supportingSources.map(item => item.id),
      residueRefs: continuation.recentResidue.map(item => item.id),
    },
    boundaries: {
      allowedActions,
      disallowedActions,
      stopConditions: [
        "Do not claim completion without evidence-backed checks.",
        "Escalate if the primary evidence gap cannot be resolved from the available sources.",
        ...(project?.standards.actionBoundaries ?? []),
      ],
    },
    success: {
      requiredChecks,
      evidenceExpectations: project
        ? [
            ...project.standards.hardRequirements,
            ...project.standards.redFlags.map(item => `Watch for red flag: ${item}`),
          ]
        : [],
      requiredOutputSections: ["run", "checks", "ambiguity"],
    },
    adapter: {
      name: input.adapter ?? "local-human-agent",
    },
  })

  save(DIRS.contracts, id, contract)
  return { id, contract }
}
