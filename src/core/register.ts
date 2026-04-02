import { DIRS, load } from "./store.ts"
import { ProjectSchema, type ContinuationPack, type ContinuationRegister, type Project } from "./schemas.ts"

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function deriveCoreTension(pack: ContinuationPack): string {
  if (pack.primaryEvidenceGap && pack.currentBlocker) {
    return `Need to move "${pack.title}" forward without bypassing the blocker: ${pack.currentBlocker}`
  }
  if (pack.primaryEvidenceGap) {
    return `Need to resolve the current evidence gap: ${pack.primaryEvidenceGap.question}`
  }
  if (pack.currentBlocker) {
    return `Need to unblock "${pack.title}" without losing the current goal: ${pack.goal}`
  }
  if (pack.nextAction) {
    return `Need to continue "${pack.title}" from the current next move without widening scope`
  }
  return `Need to continue "${pack.title}" without drifting away from its current goal`
}

function deriveTasteLock(pack: ContinuationPack): string {
  const project = pack.projectRef ? load<Project>(DIRS.projects, pack.projectRef) : null
  const parsedProject = project ? ProjectSchema.parse(project) : null
  const actionBoundary = parsedProject?.standards.actionBoundaries.find(item => item.trim().length > 0)

  if (actionBoundary) {
    return actionBoundary
  }

  if (pack.primaryEvidenceGap) {
    return "Do not replace grounded evidence with a smooth summary."
  }

  return "Do not widen the task into a broad recap or redesign."
}

export function renderContinuationRegisterPromptBlock(register: ContinuationRegister): string {
  const projectLine = register.projectRef ? `\n  <Project-Ref>${escapeXml(register.projectRef)}</Project-Ref>` : ""
  const primaryGapLine = register.primaryGap
    ? `\n  <Primary-Gap id="${escapeXml(register.primaryGap.id)}">${escapeXml(register.primaryGap.question)}</Primary-Gap>`
    : "\n  <Primary-Gap />"
  const nextMoveLine = register.nextMove ? `\n  <Next-Move>${escapeXml(register.nextMove)}</Next-Move>` : "\n  <Next-Move />"

  const sourceLines = register.evidenceAnchors.sourceRefs.map(ref => `\n    <Source ref="${escapeXml(ref)}" />`).join("")
  const residueLines = register.evidenceAnchors.residueRefs.map(ref => `\n    <Residue ref="${escapeXml(ref)}" />`).join("")

  return [
    `<Continuation-Register version="${register.version}">`,
    `  <Task-Ref>${escapeXml(register.taskRef)}</Task-Ref>${projectLine}`,
    `  <Core-Tension>${escapeXml(register.coreTension)}</Core-Tension>`,
    `  <Taste-Lock>${escapeXml(register.tasteLock)}</Taste-Lock>${primaryGapLine}${nextMoveLine}`,
    `  <Evidence-Anchors>${sourceLines}${residueLines}`,
    `  </Evidence-Anchors>`,
    `</Continuation-Register>`,
  ].join("\n")
}

export function deriveContinuationRegister(pack: ContinuationPack): ContinuationRegister {
  const register: ContinuationRegister = {
    version: "1",
    taskRef: pack.taskRef,
    projectRef: pack.projectRef ?? null,
    coreTension: deriveCoreTension(pack),
    tasteLock: deriveTasteLock(pack),
    primaryGap: pack.primaryEvidenceGap
      ? {
          id: pack.primaryEvidenceGap.id,
          question: pack.primaryEvidenceGap.question,
        }
      : null,
    nextMove: pack.nextAction ?? null,
    evidenceAnchors: {
      sourceRefs: pack.supportingSources.map(item => item.id),
      residueRefs: pack.recentResidue.map(item => item.id),
    },
    promptBlock: "",
  }

  register.promptBlock = renderContinuationRegisterPromptBlock(register)
  return register
}
