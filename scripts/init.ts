#!/usr/bin/env bun
// bun run init
// Initialize the Livebase store directory structure.
// Run once before first use.

import { DIRS, ensureStore, ok } from "./lib/store.ts"
import { join } from "path"
import { writeFileSync, existsSync } from "fs"

ensureStore()

// Drop .gitkeep in each dir so empty dirs are tracked
for (const dir of Object.values(DIRS)) {
  const keep = join(dir, ".gitkeep")
  if (!existsSync(keep)) writeFileSync(keep, "")
}

ok({
  status: "ok",
  message: "Livebase store initialized",
  store: DIRS,
})
