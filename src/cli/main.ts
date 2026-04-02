#!/usr/bin/env bun

import { readFileSync } from "fs"
import { resolve } from "path"
import { createExecutionContract } from "../core/contract.ts"
import { createProject, listProjects, requireProject, updateProject } from "../core/project.ts"
import { deriveContinuationRegister } from "../core/register.ts"
import { ingestSource } from "../core/source.ts"
import { DIRS, STORE_ROOT, ensureStore, fail, loadAll, ok } from "../core/store.ts"
import { buildContinuationPack, checkpointTask, createTask, parseEvidenceGap, requireTask, resolveEvidenceGap } from "../core/task.ts"
import { applyVerificationLedger } from "../core/writeback.ts"
import { loadPresetRegistry } from "../presets/assets.ts"
import { buildPresetLoaderPlan, listPresetItems } from "../presets/loader.ts"

const PRESET_REGISTRY_PATH = resolve(process.cwd(), "presets", "adapter-presets", "registry.json")

function getFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  return args[index + 1]
}

function getRepeatedFlags(args: string[], name: string): string[] {
  const values: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name && args[i + 1]) {
      values.push(args[i + 1])
    }
  }
  return values
}

function printHelp(): never {
  console.log(`
Livebase v0.1

Turn interrupted work into resumable work.

Commands:
  livebase setup
  livebase doctor
  livebase preset list
  livebase preset loader-plan <preset_id> [--task-id <task_id>]
  livebase project create "Name" [--description "..."]
  livebase project list
  livebase project show <project_id>
  livebase project update <project_id> [--state "..."] [--next-step "..."]
  livebase source ingest <file_path> [--project <project_id>] [--title "..."] [--tags "a,b"]
  livebase task create "Title" --goal "..." [--project <project_id>] [--current-state "..."] [--next-action "..."] [--blocker "..."] [--evidence-gap "question::suggested action"]
  livebase task show <task_id>
  livebase task resolve-gap <task_id> <gap_id> [--next-action "..."] [--current-state "..."]
  livebase checkpoint <task_id> [--reason blocked|pause|handoff|completed|manual] [--summary "..."] [--blocker "..."] [--next-action "..."] [--evidence-gap "question::suggested action"]
  livebase resume <task_id> [--with-register]
  livebase contract <task_id> [--adapter <name>] [--allow-action "..."] [--deny-action "..."] [--require-check "..."]
  livebase writeback [ledger.json]
`)
  process.exit(0)
}

try {
  const cmd = process.argv[2]
  if (!cmd || cmd === "--help" || cmd === "help") {
    printHelp()
  }

  if (cmd === "setup") {
    ensureStore()
    ok({ status: "ok", storeRoot: STORE_ROOT, directories: DIRS })
  }

  if (cmd === "doctor") {
    ensureStore()
    ok({
      status: "ok",
      storeRoot: STORE_ROOT,
      directories: DIRS,
      counts: {
        projects: loadAll(DIRS.projects).length,
        sources: loadAll(DIRS.sources).length,
        notes: loadAll(DIRS.notes).length,
        tasks: loadAll(DIRS.tasks).length,
        residue: loadAll(DIRS.residue).length,
        contracts: loadAll(DIRS.contracts).length,
        ledgers: loadAll(DIRS.ledgers).length,
      },
    })
  }

  if (cmd === "project") {
    const subcmd = process.argv[3]
    const args = process.argv.slice(4)
    if (subcmd === "create") {
      const name = process.argv[4]
      if (!name) fail("missing_project_name", "Usage: livebase project create \"Name\" [--description \"...\"]")
      const description = getFlag(process.argv.slice(5), "--description")
      ok({ status: "ok", ...createProject(name, description) })
    }
    if (subcmd === "list") {
      const projects = listProjects()
      ok({ count: projects.length, projects })
    }
    if (subcmd === "show") {
      const projectId = process.argv[4]
      if (!projectId) fail("missing_project_id", "Usage: livebase project show <project_id>")
      ok(requireProject(projectId))
    }
    if (subcmd === "update") {
      const projectId = process.argv[4]
      if (!projectId) fail("missing_project_id", "Usage: livebase project update <project_id> [--state \"...\"] [--next-step \"...\"]")
      const state = getFlag(args, "--state")
      const nextStep = getFlag(args, "--next-step")
      ok({ status: "ok", project: updateProject(projectId, { currentState: state, nextStep }) })
    }
    fail("unknown_project_command", subcmd)
  }

  if (cmd === "preset") {
    const subcmd = process.argv[3]
    if (subcmd === "list") {
      const registry = loadPresetRegistry(PRESET_REGISTRY_PATH)
      const presets = listPresetItems(registry)
      ok({
        count: presets.length,
        presets,
      })
    }
    if (subcmd === "loader-plan") {
      const presetId = process.argv[4]
      if (!presetId) {
        fail("missing_preset_id", "Usage: livebase preset loader-plan <preset_id> [--task-id <task_id>]")
      }
      const taskId = getFlag(process.argv.slice(5), "--task-id")
      const registry = loadPresetRegistry(PRESET_REGISTRY_PATH)
      ok(buildPresetLoaderPlan({ registry, presetId, taskId }))
    }
    fail("unknown_preset_command", subcmd)
  }

  if (cmd === "source") {
    const subcmd = process.argv[3]
    const args = process.argv.slice(4)
    if (subcmd === "ingest") {
      const filePath = process.argv[4]
      if (!filePath) fail("missing_file_path", "Usage: livebase source ingest <file_path> [--project <project_id>]")
      const projectRef = getFlag(args, "--project")
      const title = getFlag(args, "--title")
      const tags = (getFlag(args, "--tags") ?? "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
      ok({ status: "ok", ...ingestSource({ filePath, projectRef, title, tags }) })
    }
    fail("unknown_source_command", subcmd)
  }

  if (cmd === "task") {
    const subcmd = process.argv[3]
    const args = process.argv.slice(4)
    if (subcmd === "create") {
      const title = process.argv[4]
      if (!title) fail("missing_task_title", "Usage: livebase task create \"Title\" --goal \"...\"")
      const goal = getFlag(args, "--goal")
      if (!goal) fail("missing_goal", "Provide --goal \"...\"")
      const projectRef = getFlag(args, "--project")
      const currentState = getFlag(args, "--current-state")
      const nextAction = getFlag(args, "--next-action")
      const blocker = getFlag(args, "--blocker")
      const evidenceGaps = getRepeatedFlags(args, "--evidence-gap").map(parseEvidenceGap)
      ok({
        status: "ok",
        ...createTask({ title, goal, projectRef, currentState, nextAction, blocker, evidenceGaps }),
      })
    }
    if (subcmd === "show") {
      const taskId = process.argv[4]
      if (!taskId) fail("missing_task_id", "Usage: livebase task show <task_id>")
      ok(requireTask(taskId))
    }
    if (subcmd === "resolve-gap") {
      const taskId = process.argv[4]
      const gapId = process.argv[5]
      if (!taskId || !gapId) {
        fail("missing_arguments", "Usage: livebase task resolve-gap <task_id> <gap_id> [--next-action \"...\"] [--current-state \"...\"]")
      }
      const nextAction = getFlag(process.argv.slice(6), "--next-action")
      const currentState = getFlag(process.argv.slice(6), "--current-state")
      ok({ status: "ok", task: resolveEvidenceGap(taskId, gapId, { nextAction, currentState }) })
    }
    fail("unknown_task_command", subcmd)
  }

  if (cmd === "checkpoint") {
    const taskId = process.argv[3]
    if (!taskId) {
      fail(
        "missing_task_id",
        "Usage: livebase checkpoint <task_id> [--reason blocked|pause|handoff|completed|manual] [--summary \"...\"] [--blocker \"...\"] [--next-action \"...\"]",
      )
    }
    const args = process.argv.slice(4)
    const reason =
      (getFlag(args, "--reason") as "pause" | "blocked" | "handoff" | "completed" | "manual" | undefined) ??
      "manual"
    const summary = getFlag(args, "--summary")
    const blocker = getFlag(args, "--blocker")
    const nextAction = getFlag(args, "--next-action")
    const evidenceGaps = getRepeatedFlags(args, "--evidence-gap").map(parseEvidenceGap)
    ok({ status: "ok", task: checkpointTask(taskId, { reason, summary, blocker, nextAction, evidenceGaps }) })
  }

  if (cmd === "resume") {
    const taskId = process.argv[3]
    if (!taskId) fail("missing_task_id", "Usage: livebase resume <task_id>")
    const args = process.argv.slice(4)
    const continuation = buildContinuationPack(taskId)
    if (args.includes("--with-register")) {
      continuation.continuationRegister = deriveContinuationRegister(continuation)
    }
    ok(continuation)
  }

  if (cmd === "contract") {
    const taskId = process.argv[3]
    if (!taskId) fail("missing_task_id", "Usage: livebase contract <task_id> [--adapter <name>]")
    const args = process.argv.slice(4)
    ok({
      status: "ok",
      ...createExecutionContract({
        taskId,
        adapter: getFlag(args, "--adapter"),
        allowedActions: getRepeatedFlags(args, "--allow-action"),
        disallowedActions: getRepeatedFlags(args, "--deny-action"),
        requiredChecks: getRepeatedFlags(args, "--require-check"),
      }),
    })
  }

  if (cmd === "writeback") {
    const filePath = process.argv[3]
    const raw = filePath ? readFileSync(filePath, "utf-8") : await Bun.stdin.text()
    if (!raw.trim()) fail("empty_input", "Provide a JSON file path or pipe a VerificationLedger JSON payload.")
    ok(applyVerificationLedger(JSON.parse(raw)))
  }

  fail("unknown_command", cmd)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  const [tag, detail] = message.split(":")
  fail(tag, detail ?? message)
}
