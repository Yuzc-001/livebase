import { readFileSync } from "fs"
import { DIRS, makeId, now, save } from "./store.ts"
import { SourceSchema, type Source } from "./schemas.ts"
import { requireProject } from "./project.ts"

export function ingestSource(input: {
  filePath: string
  projectRef?: string
  title?: string
  tags?: string[]
}): { id: string; source: Source } {
  const project = input.projectRef ? requireProject(input.projectRef) : null
  const content = readFileSync(input.filePath, "utf-8")
  const createdAt = now()
  const title = input.title ?? input.filePath.split(/[\\/]/).pop() ?? "Untitled source"
  const id = makeId("src", title)
  const source = SourceSchema.parse({
    id,
    type: "source",
    title,
    content,
    sourceType: "file",
    sourcePath: input.filePath,
    projectRef: input.projectRef,
    tags: input.tags ?? [],
    capturedAt: createdAt,
    updatedAt: createdAt,
  })

  save(DIRS.sources, id, source)

  if (input.projectRef && project) {
    project.sourceRefs = [...new Set([...project.sourceRefs, id])]
    project.updatedAt = now()
    save(DIRS.projects, input.projectRef, project)
  }

  return { id, source }
}
