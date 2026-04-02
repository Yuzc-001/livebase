import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "fs"
import { join, resolve } from "path"

export const STORE_ROOT = process.env.LIVEBASE_STORE
  ? resolve(process.env.LIVEBASE_STORE)
  : resolve(process.cwd(), "store")

export const DIRS = {
  projects: join(STORE_ROOT, "projects"),
  sources: join(STORE_ROOT, "sources"),
  notes: join(STORE_ROOT, "notes"),
  tasks: join(STORE_ROOT, "tasks"),
  residue: join(STORE_ROOT, "residue"),
  contracts: join(STORE_ROOT, "contracts"),
  ledgers: join(STORE_ROOT, "ledgers"),
} as const

export function ensureStore(): void {
  for (const dir of Object.values(DIRS)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function save(dir: string, id: string, data: unknown): string {
  ensureStore()
  const path = join(dir, `${id}.json`)
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8")
  return path
}

export function load<T>(dir: string, id: string): T | null {
  const path = join(dir, `${id}.json`)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T
  } catch {
    return null
  }
}

export function list(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(file => file.endsWith(".json"))
    .map(file => file.slice(0, -5))
    .sort()
}

export function loadAll<T>(dir: string): T[] {
  return list(dir)
    .map(id => load<T>(dir, id))
    .filter((value): value is T => value !== null)
}

export function remove(dir: string, id: string): boolean {
  const path = join(dir, `${id}.json`)
  if (!existsSync(path)) return false
  unlinkSync(path)
  return true
}

export function makeId(prefix: string, label = ""): string {
  const ts = Date.now().toString(36)
  const slug = label
    .toLowerCase()
    .replace(/[\u4e00-\u9fff]+/g, "cn")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return slug ? `${prefix}-${slug}-${ts}` : `${prefix}-${ts}`
}

export function now(): string {
  return new Date().toISOString()
}

export function ok(data: unknown): never {
  console.log(JSON.stringify(data, null, 2))
  process.exit(0)
}

export function fail(error: string, detail?: unknown): never {
  console.error(JSON.stringify({ error, detail }, null, 2))
  process.exit(1)
}
