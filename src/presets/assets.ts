import { mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, resolve } from "path"
import { z } from "zod"

export const PromptAssetFrontmatterSchema = z.object({
  id: z.string().min(1),
  host: z.string().min(1),
  adapter: z.string().min(1),
  version: z.string().min(1),
  format: z.string().min(1),
})

export type PromptAssetFrontmatter = z.infer<typeof PromptAssetFrontmatterSchema>

export const PresetLoaderSchema = z.object({
  resume: z.object({
    includeRegister: z.boolean(),
  }),
  register: z.object({
    source: z.literal("continuationRegister.promptBlock"),
    position: z.literal("top_of_attention"),
    policy: z.literal("if_present"),
    conflictResolution: z.literal("fresh_resume_wins"),
  }),
})

export type PresetLoader = z.infer<typeof PresetLoaderSchema>

export const PresetRegistrySchema = z.object({
  version: z.string().min(1),
  presets: z.array(
    z.object({
      id: z.string().min(1),
      host: z.string().min(1),
      adapter: z.string().min(1),
      source: z.string().min(1),
      dist: z.object({
        text: z.string().min(1),
      }),
      tools: z.array(z.string().min(1)).min(1),
      placeholders: z.array(z.string().min(1)).default([]),
      loader: PresetLoaderSchema,
    }),
  ),
})

export type PresetRegistry = z.infer<typeof PresetRegistrySchema>

export function loadPresetRegistry(filePath: string): PresetRegistry {
  return PresetRegistrySchema.parse(JSON.parse(readFileSync(filePath, "utf-8")))
}

function parseFrontmatter(raw: string): { frontmatter: PromptAssetFrontmatter; body: string } {
  const normalized = raw.replace(/\r\n/g, "\n")
  const lines = normalized.split("\n")

  if (lines[0] !== "---") {
    throw new Error("invalid_prompt_asset:missing_frontmatter_start")
  }

  const endIndex = lines.indexOf("---", 1)
  if (endIndex === -1) {
    throw new Error("invalid_prompt_asset:missing_frontmatter_end")
  }

  const frontmatterEntries = lines.slice(1, endIndex)
  const frontmatter: Record<string, string> = {}

  for (const line of frontmatterEntries) {
    const separatorIndex = line.indexOf(":")
    if (separatorIndex === -1) {
      throw new Error(`invalid_prompt_asset:invalid_frontmatter_line:${line}`)
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    frontmatter[key] = value
  }

  return {
    frontmatter: PromptAssetFrontmatterSchema.parse(frontmatter),
    body: lines.slice(endIndex + 1).join("\n"),
  }
}

export function extractPromptAsset(filePath: string): { frontmatter: PromptAssetFrontmatter; body: string } {
  return parseFrontmatter(readFileSync(filePath, "utf-8"))
}

export function renderPresetText(asset: { body: string }): string {
  return `${asset.body.trim()}\n`
}

export function buildPresetAssets(registryPath: string): void {
  const root = resolve(dirname(registryPath), "..", "..")
  const registry = loadPresetRegistry(registryPath)

  for (const preset of registry.presets) {
    const sourcePath = resolve(root, preset.source)
    const distTextPath = resolve(root, preset.dist.text)
    const asset = extractPromptAsset(sourcePath)

    if (asset.frontmatter.id !== preset.id) {
      throw new Error(`invalid_prompt_asset:frontmatter_id_mismatch:${preset.id}`)
    }
    if (asset.frontmatter.host !== preset.host) {
      throw new Error(`invalid_prompt_asset:frontmatter_host_mismatch:${preset.id}`)
    }
    if (asset.frontmatter.adapter !== preset.adapter) {
      throw new Error(`invalid_prompt_asset:frontmatter_adapter_mismatch:${preset.id}`)
    }
    if (asset.frontmatter.version !== registry.version) {
      throw new Error(`invalid_prompt_asset:frontmatter_version_mismatch:${preset.id}`)
    }

    mkdirSync(dirname(distTextPath), { recursive: true })
    writeFileSync(distTextPath, renderPresetText(asset), "utf-8")
  }
}
