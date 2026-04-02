import { expect, test } from "bun:test"
import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import { extractPromptAsset, loadPresetRegistry, renderPresetText } from "../src/presets/assets.ts"

const ROOT = process.cwd()
const REGISTRY_PATH = resolve(ROOT, "presets", "adapter-presets", "registry.json")

test("adapter preset assets stay machine-loadable and compiled", () => {
  const registry = loadPresetRegistry(REGISTRY_PATH)

  expect(registry.version).toBe("0.1.0")
  expect(registry.presets).toHaveLength(4)

  for (const preset of registry.presets) {
    const sourcePath = resolve(ROOT, preset.source)
    const distTextPath = resolve(ROOT, preset.dist.text)

    expect(existsSync(sourcePath)).toBe(true)
    expect(existsSync(distTextPath)).toBe(true)

    const asset = extractPromptAsset(sourcePath)
    expect(asset.frontmatter.id).toBe(preset.id)
    expect(asset.frontmatter.host).toBe(preset.host)
    expect(asset.frontmatter.adapter).toBe(preset.adapter)
    expect(asset.frontmatter.version).toBe(registry.version)
    expect(preset.loader.resume.includeRegister).toBe(true)
    expect(preset.loader.register.source).toBe("continuationRegister.promptBlock")
    expect(preset.loader.register.position).toBe("top_of_attention")
    expect(preset.loader.register.policy).toBe("if_present")
    expect(preset.loader.register.conflictResolution).toBe("fresh_resume_wins")

    const compiled = readFileSync(distTextPath, "utf-8")
    expect(compiled).toBe(renderPresetText(asset))
  }
})
