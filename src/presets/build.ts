#!/usr/bin/env bun

import { resolve } from "path"
import { buildPresetAssets } from "./assets.ts"

const REGISTRY_PATH = resolve(process.cwd(), "presets", "adapter-presets", "registry.json")

buildPresetAssets(REGISTRY_PATH)
