import { expect, test } from "bun:test"
import { deriveContinuationRegister } from "../src/core/register.ts"
import { type ContinuationPack } from "../src/core/schemas.ts"

test("continuation register escapes xml-sensitive content in promptBlock", () => {
  const pack: ContinuationPack = {
    id: "cont-1",
    type: "continuation-pack",
    taskRef: "tsk-<1>",
    projectRef: "proj-&-1",
    title: 'Check <migration> & "ownership"',
    goal: "Keep grounded evidence",
    currentState: null,
    currentBlocker: 'Blocked by "missing" evidence & drift',
    primaryEvidenceGap: {
      id: "gap-<1>",
      question: 'Did they own the <prod> migration & rollout?',
      whyItMatters: undefined,
      suggestedAction: "Inspect <source>",
      sourceRefs: [],
      status: "open",
      createdAt: new Date().toISOString(),
      resolvedAt: undefined,
    },
    nextAction: 'Inspect the <source> & decide',
    openEvidenceGapCount: 1,
    supportingSources: [],
    recentResidue: [],
    createdAt: new Date().toISOString(),
  }

  const register = deriveContinuationRegister(pack)

  expect(register.promptBlock).toContain("&lt;")
  expect(register.promptBlock).toContain("&amp;")
  expect(register.promptBlock).toContain("&quot;")
  expect(register.promptBlock).not.toContain('<Task-Ref>tsk-<1></Task-Ref>')
})
