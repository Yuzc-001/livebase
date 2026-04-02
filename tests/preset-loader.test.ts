import { expect, test } from "bun:test"
import { resolve } from "path"
import { loadPresetRegistry } from "../src/presets/assets.ts"
import {
  buildPresetLoaderPlan,
  buildResumeLoaderInput,
  listPresetItems,
  requirePresetEntry,
  resolveRegisterHydration,
} from "../src/presets/loader.ts"

const ROOT = process.cwd()
const REGISTRY_PATH = resolve(ROOT, "presets", "adapter-presets", "registry.json")

test("preset loader builds resume input from machine contract", () => {
  const registry = loadPresetRegistry(REGISTRY_PATH)

  for (const preset of registry.presets) {
    const resumeInput = buildResumeLoaderInput("tsk-demo", preset.loader)
    expect(resumeInput).toEqual({
      taskId: "tsk-demo",
      includeRegister: true,
    })
  }
})

test("preset loader plan uses explicit task id when provided", () => {
  const registry = loadPresetRegistry(REGISTRY_PATH)
  const plan = buildPresetLoaderPlan({
    registry,
    presetId: "openai-responses-host",
    taskId: "tsk-runtime",
  })

  expect(plan.preset.id).toBe("openai-responses-host")
  expect(plan.plan.resumeCall.tool).toBe("livebase.task.resume")
  expect(plan.plan.resumeCall.arguments).toEqual({
    taskId: "tsk-runtime",
    includeRegister: true,
  })
  expect(plan.plan.registerHydration.source).toBe("continuationRegister.promptBlock")
})

test("preset loader plan falls back to placeholder task id", () => {
  const registry = loadPresetRegistry(REGISTRY_PATH)
  const plan = buildPresetLoaderPlan({
    registry,
    presetId: "codex",
  })

  expect(plan.plan.resumeCall.arguments.taskId).toBe("{{taskId}}")
})

test("preset list returns stable discovery items", () => {
  const registry = loadPresetRegistry(REGISTRY_PATH)
  const presets = listPresetItems(registry)

  expect(presets).toEqual([
    { id: "codex", host: "codex", adapter: "codex" },
    { id: "claude-code", host: "claude-code", adapter: "claude-code" },
    { id: "openai-responses-host", host: "openai-responses-host", adapter: "openai-responses-host" },
    { id: "orchestrator", host: "orchestrator", adapter: "orchestrator" },
  ])
})

test("preset loader injects fresh continuation register prompt block at top attention", () => {
  const registry = loadPresetRegistry(REGISTRY_PATH)
  const preset = requirePresetEntry(registry, "codex")
  const hydration = resolveRegisterHydration({
    loader: preset.loader,
    continuation: {
      continuationRegister: {
        version: "1",
        taskRef: "tsk-demo",
        projectRef: "proj-demo",
        coreTension: "resolve gap",
        tasteLock: "do not drift",
        primaryGap: {
          id: "gap-1",
          question: "missing evidence?",
        },
        nextMove: "inspect source",
        evidenceAnchors: {
          sourceRefs: ["src-1"],
          residueRefs: ["res-1"],
        },
        promptBlock: "<Continuation-Register version=\"1\">fresh</Continuation-Register>",
      },
    },
  })

  expect(hydration.shouldUseFreshResume).toBe(true)
  expect(hydration.droppedStaleRegister).toBe(false)
  expect(hydration.injection).toEqual({
    position: "top_of_attention",
    promptBlock: "<Continuation-Register version=\"1\">fresh</Continuation-Register>",
  })
})

test("preset loader drops stale register when fresh resume disagrees", () => {
  const registry = loadPresetRegistry(REGISTRY_PATH)
  const preset = requirePresetEntry(registry, "orchestrator")
  const hydration = resolveRegisterHydration({
    loader: preset.loader,
    continuation: {
      continuationRegister: {
        version: "1",
        taskRef: "tsk-demo",
        projectRef: "proj-demo",
        coreTension: "resolve gap",
        tasteLock: "do not drift",
        primaryGap: {
          id: "gap-1",
          question: "missing evidence?",
        },
        nextMove: "inspect source",
        evidenceAnchors: {
          sourceRefs: ["src-1"],
          residueRefs: ["res-1"],
        },
        promptBlock: "<Continuation-Register version=\"1\">fresh-resume</Continuation-Register>",
      },
    },
    cachedPromptBlock: "<Continuation-Register version=\"1\">stale-cache</Continuation-Register>",
  })

  expect(hydration.shouldUseFreshResume).toBe(true)
  expect(hydration.droppedStaleRegister).toBe(true)
  expect(hydration.injection?.promptBlock).toBe(
    "<Continuation-Register version=\"1\">fresh-resume</Continuation-Register>",
  )
})

test("preset loader keeps injection empty when fresh resume has no register", () => {
  const registry = loadPresetRegistry(REGISTRY_PATH)
  const preset = requirePresetEntry(registry, "claude-code")
  const hydration = resolveRegisterHydration({
    loader: preset.loader,
    continuation: {
      continuationRegister: undefined,
    },
    cachedPromptBlock: "<Continuation-Register version=\"1\">stale-cache</Continuation-Register>",
  })

  expect(hydration.shouldUseFreshResume).toBe(true)
  expect(hydration.droppedStaleRegister).toBe(false)
  expect(hydration.injection).toBeNull()
})
