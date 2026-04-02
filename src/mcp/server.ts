#!/usr/bin/env bun

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { resolve } from "path"
import { z } from "zod"
import { createExecutionContract } from "../core/contract.ts"
import { createProject, listProjects, requireProject, updateProject } from "../core/project.ts"
import { deriveContinuationRegister } from "../core/register.ts"
import {
  ContinuationPackSchema,
  ExecutionContractSchema,
  ProjectSchema,
  SourceSchema,
  TaskSchema,
  VerificationLedgerInputSchema,
} from "../core/schemas.ts"
import { ingestSource } from "../core/source.ts"
import { DIRS, STORE_ROOT, ensureStore, loadAll } from "../core/store.ts"
import { PresetLoaderSchema, loadPresetRegistry } from "../presets/assets.ts"
import { buildPresetLoaderPlan, listPresetItems } from "../presets/loader.ts"
import {
  buildContinuationPack,
  checkpointTask,
  createEvidenceGap,
  createTask,
  listTasks,
  requireTask,
  resolveEvidenceGap,
} from "../core/task.ts"
import { applyVerificationLedger } from "../core/writeback.ts"

const PRESET_REGISTRY_PATH = resolve(process.cwd(), "presets", "adapter-presets", "registry.json")

const EvidenceGapInputSchema = z.object({
  question: z.string(),
  suggestedAction: z.string().optional(),
  whyItMatters: z.string().optional(),
  sourceRefs: z.array(z.string()).optional(),
})

const CheckpointReasonSchema = z.enum(["pause", "blocked", "handoff", "completed", "manual"])

const DoctorResultSchema = z.object({
  status: z.literal("ok"),
  storeRoot: z.string(),
  directories: z.object({
    projects: z.string(),
    sources: z.string(),
    notes: z.string(),
    tasks: z.string(),
    residue: z.string(),
    contracts: z.string(),
    ledgers: z.string(),
  }),
  counts: z.object({
    projects: z.number(),
    sources: z.number(),
    notes: z.number(),
    tasks: z.number(),
    residue: z.number(),
    contracts: z.number(),
    ledgers: z.number(),
  }),
})

const CreateProjectInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

const CreateProjectResultSchema = z.object({
  id: z.string(),
  project: ProjectSchema,
})

const ProjectGetInputSchema = z.object({
  projectId: z.string().min(1),
})

const ProjectUpdateInputSchema = z.object({
  projectId: z.string().min(1),
  currentState: z.string().optional(),
  nextStep: z.string().optional(),
})

const ProjectListResultSchema = z.object({
  count: z.number(),
  projects: z.array(ProjectSchema),
})

const IngestSourceInputSchema = z.object({
  filePath: z.string().min(1),
  projectRef: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

const IngestSourceResultSchema = z.object({
  id: z.string(),
  source: SourceSchema,
})

const PresetListResultSchema = z.object({
  count: z.number(),
  presets: z.array(
    z.object({
      id: z.string(),
      host: z.string(),
      adapter: z.string(),
    }),
  ),
})

const PresetLoaderPlanInputSchema = z.object({
  presetId: z.string().min(1),
  taskId: z.string().optional(),
})

const PresetLoaderPlanResultSchema = z.object({
  preset: z.object({
    id: z.string(),
    host: z.string(),
    adapter: z.string(),
    tools: z.array(z.string()),
    placeholders: z.array(z.string()),
  }),
  loader: PresetLoaderSchema,
  plan: z.object({
    resumeCall: z.object({
      tool: z.literal("livebase.task.resume"),
      arguments: z.object({
        taskId: z.string(),
        includeRegister: z.boolean(),
      }),
    }),
    registerHydration: z.object({
      source: z.literal("continuationRegister.promptBlock"),
      position: z.literal("top_of_attention"),
      policy: z.literal("if_present"),
      conflictResolution: z.literal("fresh_resume_wins"),
    }),
  }),
})

const CreateTaskInputSchema = z.object({
  title: z.string().min(1),
  goal: z.string().min(1),
  projectRef: z.string().optional(),
  currentState: z.string().optional(),
  nextAction: z.string().optional(),
  blocker: z.string().optional(),
  evidenceGaps: z.array(EvidenceGapInputSchema).optional(),
})

const CreateTaskResultSchema = z.object({
  id: z.string(),
  task: TaskSchema,
})

const ListTasksInputSchema = z.object({
  projectRef: z.string().optional(),
  status: TaskSchema.shape.status.optional(),
})

const ListTasksResultSchema = z.object({
  count: z.number(),
  tasks: z.array(TaskSchema),
})

const TaskGetInputSchema = z.object({
  taskId: z.string().min(1),
})

const CheckpointTaskInputSchema = z.object({
  taskId: z.string().min(1),
  reason: CheckpointReasonSchema.default("manual"),
  summary: z.string().optional(),
  nextAction: z.string().optional(),
  blocker: z.string().optional(),
  evidenceGaps: z.array(EvidenceGapInputSchema).optional(),
})

const ResolveGapInputSchema = z.object({
  taskId: z.string().min(1),
  gapId: z.string().min(1),
  nextAction: z.string().optional(),
  currentState: z.string().optional(),
})

const ResumeTaskInputSchema = z.object({
  taskId: z.string().min(1),
  includeRegister: z.boolean().optional(),
})

const CreateExecutionContractInputSchema = z.object({
  taskId: z.string().min(1),
  adapter: z.string().optional(),
  allowedActions: z.array(z.string()).optional(),
  disallowedActions: z.array(z.string()).optional(),
  requiredChecks: z.array(z.string()).optional(),
})

const CreateExecutionContractResultSchema = z.object({
  id: z.string(),
  contract: ExecutionContractSchema,
})

const ApplyVerificationLedgerResultSchema = z.object({
  status: z.literal("ok"),
  ledgerId: z.string(),
  residueId: z.string().nullable(),
  taskId: z.string(),
  written: z.array(z.string()),
})

const ToolErrorTargetSchema = z.object({
  type: z.enum(["task", "project", "preset", "evidence_gap", "input", "unknown"]),
  id: z.string().optional(),
})

const ToolErrorCodeSchema = z.enum([
  "task_not_found",
  "project_not_found",
  "preset_not_found",
  "evidence_gap_not_found",
  "invalid_evidence_gap",
  "internal_error",
])

const ToolErrorResultSchema = z.object({
  ok: z.literal(false),
  tool: z.string(),
  error: z.object({
    code: ToolErrorCodeSchema,
    category: z.enum(["not_found", "invalid_input", "internal"]),
    message: z.string(),
    detail: z.string().optional(),
    retryable: z.boolean(),
    target: ToolErrorTargetSchema.optional(),
  }),
})

type ToolErrorResult = z.infer<typeof ToolErrorResultSchema>

function successResult<T>(structuredContent: T) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
    structuredContent,
  }
}

function parseToolError(toolName: string, error: unknown): ToolErrorResult {
  const rawMessage = error instanceof Error ? error.message : String(error)
  const [code, detail] = rawMessage.split(":")

  if (code === "task_not_found") {
    return ToolErrorResultSchema.parse({
      ok: false,
      tool: toolName,
      error: {
        code,
        category: "not_found",
        message: "Livebase task was not found.",
        detail,
        retryable: false,
        target: {
          type: "task",
          id: detail,
        },
      },
    })
  }

  if (code === "project_not_found") {
    return ToolErrorResultSchema.parse({
      ok: false,
      tool: toolName,
      error: {
        code,
        category: "not_found",
        message: "Livebase project was not found.",
        detail,
        retryable: false,
        target: {
          type: "project",
          id: detail,
        },
      },
    })
  }

  if (code === "preset_not_found") {
    return ToolErrorResultSchema.parse({
      ok: false,
      tool: toolName,
      error: {
        code,
        category: "not_found",
        message: "Livebase preset was not found.",
        detail,
        retryable: false,
        target: {
          type: "preset",
          id: detail,
        },
      },
    })
  }

  if (code === "evidence_gap_not_found") {
    return ToolErrorResultSchema.parse({
      ok: false,
      tool: toolName,
      error: {
        code,
        category: "not_found",
        message: "Livebase evidence gap was not found.",
        detail,
        retryable: false,
        target: {
          type: "evidence_gap",
          id: detail,
        },
      },
    })
  }

  if (code === "invalid_evidence_gap") {
    return ToolErrorResultSchema.parse({
      ok: false,
      tool: toolName,
      error: {
        code,
        category: "invalid_input",
        message: "Evidence gap input is invalid.",
        detail,
        retryable: false,
        target: {
          type: "input",
        },
      },
    })
  }

  return ToolErrorResultSchema.parse({
    ok: false,
    tool: toolName,
    error: {
      code: "internal_error",
      category: "internal",
      message: "Livebase tool execution failed.",
      detail: rawMessage,
      retryable: true,
      target: {
        type: "unknown",
      },
    },
  })
}

function errorResult(toolName: string, error: unknown) {
  const structuredContent = parseToolError(toolName, error)
  return {
    content: [
      {
        type: "text" as const,
        text: structuredContent.error.message,
      },
    ],
    structuredContent,
    isError: true,
  }
}

function wrapTool<TInput, TOutput>(toolName: string, handler: (input: TInput) => TOutput | Promise<TOutput>) {
  return async (input: TInput) => {
    try {
      return successResult(await handler(input))
    } catch (error) {
      return errorResult(toolName, error)
    }
  }
}

function wrapZeroArgTool<TOutput>(toolName: string, handler: () => TOutput | Promise<TOutput>) {
  return async () => {
    try {
      return successResult(await handler())
    } catch (error) {
      return errorResult(toolName, error)
    }
  }
}

function buildDoctorResult() {
  ensureStore()
  return DoctorResultSchema.parse({
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

function mapEvidenceGaps(items: z.infer<typeof EvidenceGapInputSchema>[] | undefined) {
  return items?.map(item => createEvidenceGap(item)) ?? []
}

function buildResumeResult(taskId: string, includeRegister?: boolean) {
  const continuation = buildContinuationPack(taskId)
  if (includeRegister) {
    continuation.continuationRegister = deriveContinuationRegister(continuation)
  }
  return ContinuationPackSchema.parse(continuation)
}

export function createLivebaseMcpServer() {
  const server = new McpServer(
    {
      name: "livebase",
      version: "0.1.0",
    },
    {
      capabilities: {
        logging: {},
      },
      instructions:
        "Use Livebase to continue interrupted work from the last unresolved evidence gap. Resume before acting, contract before delegating, and write back verified evidence instead of narrative summaries.",
    },
  )

  server.registerTool(
    "livebase.system.doctor",
    {
      title: "Livebase Doctor",
      description: "Check whether the local Livebase store is initialized and report object counts.",
      outputSchema: DoctorResultSchema,
    },
    wrapZeroArgTool("livebase.system.doctor", () => DoctorResultSchema.parse(buildDoctorResult())),
  )

  server.registerTool(
    "livebase.project.create",
    {
      title: "Create Livebase Project",
      description: "Create a continuity container for a repeated work domain.",
      inputSchema: CreateProjectInputSchema,
      outputSchema: CreateProjectResultSchema,
    },
    wrapTool("livebase.project.create", input =>
      CreateProjectResultSchema.parse(createProject(input.name, input.description)),
    ),
  )

  server.registerTool(
    "livebase.project.list",
    {
      title: "List Livebase Projects",
      description: "List existing projects from the local Livebase store.",
      outputSchema: ProjectListResultSchema,
    },
    wrapZeroArgTool("livebase.project.list", () => {
      const projects = listProjects()
      return ProjectListResultSchema.parse({
        count: projects.length,
        projects,
      })
    }),
  )

  server.registerTool(
    "livebase.project.get",
    {
      title: "Get Livebase Project",
      description: "Read one project from the local Livebase store.",
      inputSchema: ProjectGetInputSchema,
      outputSchema: ProjectSchema,
    },
    wrapTool("livebase.project.get", input => ProjectSchema.parse(requireProject(input.projectId))),
  )

  server.registerTool(
    "livebase.project.update",
    {
      title: "Update Livebase Project",
      description: "Update the current state or next step for a project.",
      inputSchema: ProjectUpdateInputSchema,
      outputSchema: ProjectSchema,
    },
    wrapTool("livebase.project.update", input =>
      ProjectSchema.parse(
        updateProject(input.projectId, {
          currentState: input.currentState,
          nextStep: input.nextStep,
        }),
      ),
    ),
  )

  server.registerTool(
    "livebase.source.ingest",
    {
      title: "Ingest Livebase Source",
      description: "Store a grounded source file and optionally attach it to a project.",
      inputSchema: IngestSourceInputSchema,
      outputSchema: IngestSourceResultSchema,
    },
    wrapTool("livebase.source.ingest", input =>
      IngestSourceResultSchema.parse(
        ingestSource({
          filePath: input.filePath,
          projectRef: input.projectRef,
          title: input.title,
          tags: input.tags,
        }),
      ),
    ),
  )

  server.registerTool(
    "livebase.preset.list",
    {
      title: "List Presets",
      description: "List available preset ids for loader discovery.",
      outputSchema: PresetListResultSchema,
    },
    wrapZeroArgTool("livebase.preset.list", () => {
      const presets = listPresetItems(loadPresetRegistry(PRESET_REGISTRY_PATH))
      return PresetListResultSchema.parse({
        count: presets.length,
        presets,
      })
    }),
  )

  server.registerTool(
    "livebase.preset.loader_plan",
    {
      title: "Get Preset Loader Plan",
      description: "Return machine-consumable preset metadata and loader plan for host adapters or orchestrators.",
      inputSchema: PresetLoaderPlanInputSchema,
      outputSchema: PresetLoaderPlanResultSchema,
    },
    wrapTool("livebase.preset.loader_plan", input =>
      PresetLoaderPlanResultSchema.parse(
        buildPresetLoaderPlan({
          registry: loadPresetRegistry(PRESET_REGISTRY_PATH),
          presetId: input.presetId,
          taskId: input.taskId,
        }),
      ),
    ),
  )

  server.registerTool(
    "livebase.task.create",
    {
      title: "Create Livebase Task",
      description: "Open a resumable work thread with current state, next action, and evidence gaps.",
      inputSchema: CreateTaskInputSchema,
      outputSchema: CreateTaskResultSchema,
    },
    wrapTool("livebase.task.create", input =>
      CreateTaskResultSchema.parse(
        createTask({
          title: input.title,
          goal: input.goal,
          projectRef: input.projectRef,
          currentState: input.currentState,
          nextAction: input.nextAction,
          blocker: input.blocker,
          evidenceGaps: mapEvidenceGaps(input.evidenceGaps),
        }),
      ),
    ),
  )

  server.registerTool(
    "livebase.task.list",
    {
      title: "List Livebase Tasks",
      description: "List resumable task threads, optionally filtered by project or task status.",
      inputSchema: ListTasksInputSchema,
      outputSchema: ListTasksResultSchema,
    },
    wrapTool("livebase.task.list", input => {
      const tasks = listTasks().filter(task => {
        if (input.projectRef && task.projectRef !== input.projectRef) return false
        if (input.status && task.status !== input.status) return false
        return true
      })

      return ListTasksResultSchema.parse({
        count: tasks.length,
        tasks,
      })
    }),
  )

  server.registerTool(
    "livebase.task.get",
    {
      title: "Get Livebase Task",
      description: "Read one task thread from the local Livebase store.",
      inputSchema: TaskGetInputSchema,
      outputSchema: TaskSchema,
    },
    wrapTool("livebase.task.get", input => TaskSchema.parse(requireTask(input.taskId))),
  )

  server.registerTool(
    "livebase.task.checkpoint",
    {
      title: "Checkpoint Livebase Task",
      description: "Record a pause, blocker, handoff, or completion point for a task.",
      inputSchema: CheckpointTaskInputSchema,
      outputSchema: TaskSchema,
    },
    wrapTool("livebase.task.checkpoint", input =>
      TaskSchema.parse(
        checkpointTask(input.taskId, {
          reason: input.reason,
          summary: input.summary,
          nextAction: input.nextAction,
          blocker: input.blocker,
          evidenceGaps: mapEvidenceGaps(input.evidenceGaps),
        }),
      ),
    ),
  )

  server.registerTool(
    "livebase.task.resolve_gap",
    {
      title: "Resolve Livebase Evidence Gap",
      description: "Resolve one evidence gap and optionally sharpen current state or next action.",
      inputSchema: ResolveGapInputSchema,
      outputSchema: TaskSchema,
    },
    wrapTool("livebase.task.resolve_gap", input =>
      TaskSchema.parse(
        resolveEvidenceGap(input.taskId, input.gapId, {
          nextAction: input.nextAction,
          currentState: input.currentState,
        }),
      ),
    ),
  )

  server.registerTool(
    "livebase.task.resume",
    {
      title: "Resume Livebase Task",
      description: "Return the smallest trustworthy continuation pack for the next run.",
      inputSchema: ResumeTaskInputSchema,
      outputSchema: ContinuationPackSchema,
    },
    wrapTool("livebase.task.resume", input => buildResumeResult(input.taskId, input.includeRegister)),
  )

  server.registerTool(
    "livebase.task.contract",
    {
      title: "Create Execution Contract",
      description: "Build a bounded execution contract for an agent or adapter.",
      inputSchema: CreateExecutionContractInputSchema,
      outputSchema: CreateExecutionContractResultSchema,
    },
    wrapTool("livebase.task.contract", input =>
      CreateExecutionContractResultSchema.parse(
        createExecutionContract({
          taskId: input.taskId,
          adapter: input.adapter,
          allowedActions: input.allowedActions,
          disallowedActions: input.disallowedActions,
          requiredChecks: input.requiredChecks,
        }),
      ),
    ),
  )

  server.registerTool(
    "livebase.task.writeback",
    {
      title: "Apply Verification Ledger",
      description: "Write verified evidence back into Livebase and update the task thread.",
      inputSchema: VerificationLedgerInputSchema,
      outputSchema: ApplyVerificationLedgerResultSchema,
    },
    wrapTool("livebase.task.writeback", input =>
      ApplyVerificationLedgerResultSchema.parse(applyVerificationLedger(VerificationLedgerInputSchema.parse(input))),
    ),
  )

  return server
}

export async function main() {
  const server = createLivebaseMcpServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

if (import.meta.main) {
  main().catch(error => {
    console.error("livebase-mcp fatal error:", error)
    process.exit(1)
  })
}
