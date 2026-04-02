import { type ContinuationPack } from "../core/schemas.ts"
import { type PresetLoader, type PresetRegistry } from "./assets.ts"

export type PresetEntry = PresetRegistry["presets"][number]

export type PresetListItem = {
  id: string
  host: string
  adapter: string
}

export type ResumeLoaderInput = {
  taskId: string
  includeRegister: boolean
}

export type RegisterInjection = {
  position: PresetLoader["register"]["position"]
  promptBlock: string
}

export type RegisterHydration = {
  injection: RegisterInjection | null
  shouldUseFreshResume: boolean
  droppedStaleRegister: boolean
}

export type PresetLoaderPlan = {
  preset: {
    id: string
    host: string
    adapter: string
    tools: string[]
    placeholders: string[]
  }
  loader: PresetLoader
  plan: {
    resumeCall: {
      tool: "livebase.task.resume"
      arguments: ResumeLoaderInput
    }
    registerHydration: {
      source: PresetLoader["register"]["source"]
      position: PresetLoader["register"]["position"]
      policy: PresetLoader["register"]["policy"]
      conflictResolution: PresetLoader["register"]["conflictResolution"]
    }
  }
}

const DEFAULT_TASK_ID_PLACEHOLDER = "{{taskId}}"

export function listPresetItems(registry: PresetRegistry): PresetListItem[] {
  return registry.presets.map(item => ({
    id: item.id,
    host: item.host,
    adapter: item.adapter,
  }))
}

export function requirePresetEntry(registry: PresetRegistry, presetId: string): PresetEntry {
  const preset = registry.presets.find(item => item.id === presetId)
  if (!preset) {
    throw new Error(`preset_not_found:${presetId}`)
  }
  return preset
}

export function buildResumeLoaderInput(taskId: string, loader: PresetLoader): ResumeLoaderInput {
  return {
    taskId,
    includeRegister: loader.resume.includeRegister,
  }
}

export function buildPresetLoaderPlan(input: {
  registry: PresetRegistry
  presetId: string
  taskId?: string
}): PresetLoaderPlan {
  const preset = requirePresetEntry(input.registry, input.presetId)
  const taskId = input.taskId?.trim() || DEFAULT_TASK_ID_PLACEHOLDER

  return {
    preset: {
      id: preset.id,
      host: preset.host,
      adapter: preset.adapter,
      tools: [...preset.tools],
      placeholders: [...preset.placeholders],
    },
    loader: preset.loader,
    plan: {
      resumeCall: {
        tool: "livebase.task.resume",
        arguments: buildResumeLoaderInput(taskId, preset.loader),
      },
      registerHydration: {
        source: preset.loader.register.source,
        position: preset.loader.register.position,
        policy: preset.loader.register.policy,
        conflictResolution: preset.loader.register.conflictResolution,
      },
    },
  }
}

export function resolveRegisterHydration(input: {
  loader: PresetLoader
  continuation: Pick<ContinuationPack, "continuationRegister">
  cachedPromptBlock?: string | null
}): RegisterHydration {
  const freshPromptBlock = input.continuation.continuationRegister?.promptBlock
  const shouldInject = input.loader.register.policy === "if_present" && !!freshPromptBlock
  const injection = shouldInject
    ? {
        position: input.loader.register.position,
        promptBlock: freshPromptBlock!,
      }
    : null
  const hasConflict =
    !!input.cachedPromptBlock && !!freshPromptBlock && input.cachedPromptBlock.trim() !== freshPromptBlock.trim()
  const shouldUseFreshResume = input.loader.register.conflictResolution === "fresh_resume_wins"

  return {
    injection,
    shouldUseFreshResume,
    droppedStaleRegister: hasConflict && shouldUseFreshResume,
  }
}
