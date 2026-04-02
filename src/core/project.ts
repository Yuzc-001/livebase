import { DIRS, load, loadAll, makeId, now, save } from "./store.ts"
import { ProjectSchema, type Project } from "./schemas.ts"

export function createProject(name: string, description?: string): { id: string; project: Project } {
  const createdAt = now()
  const id = makeId("proj", name)
  const project = ProjectSchema.parse({
    id,
    type: "project",
    name,
    description,
    status: "active",
    sourceRefs: [],
    noteRefs: [],
    residueRefs: [],
    createdAt,
    updatedAt: createdAt,
  })
  save(DIRS.projects, id, project)
  return { id, project }
}

export function listProjects(): Project[] {
  return loadAll<Project>(DIRS.projects)
}

export function requireProject(projectId: string): Project {
  const project = load<Project>(DIRS.projects, projectId)
  if (!project) {
    throw new Error(`project_not_found:${projectId}`)
  }
  return ProjectSchema.parse(project)
}

export function updateProject(projectId: string, updates: { currentState?: string; nextStep?: string }): Project {
  const project = requireProject(projectId)
  if (updates.currentState !== undefined) {
    project.currentState = updates.currentState
  }
  if (updates.nextStep !== undefined) {
    project.nextStep = updates.nextStep
  }
  project.updatedAt = now()
  const parsed = ProjectSchema.parse(project)
  save(DIRS.projects, projectId, parsed)
  return parsed
}
