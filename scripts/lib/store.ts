import { resolve, join } from "path"
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from "fs"

// ── Paths ─────────────────────────────────────────────────────────────────────
// LIVEBASE_STORE env var lets tests override the store path.
export const STORE_ROOT = process.env.LIVEBASE_STORE
  ? resolve(process.env.LIVEBASE_STORE)
  : resolve(process.cwd(), "store")

export const DIRS = {
  sources: join(STORE_ROOT, "sources"),
  notes: join(STORE_ROOT, "notes"),
  projects: join(STORE_ROOT, "projects"),
  entities: join(STORE_ROOT, "entities"),
  residue: join(STORE_ROOT, "residue"),
  contextPacks: join(STORE_ROOT, "context-packs"),
} as const

export type StoreDir = keyof typeof DIRS

// ── Init ──────────────────────────────────────────────────────────────────────
export function ensureStore(): void {
  for (const dir of Object.values(DIRS)) {
    mkdirSync(dir, { recursive: true })
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
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
    .filter((f: string) => f.endsWith(".json"))
    .map((f: string) => f.slice(0, -5))
    .sort()
}

export function loadAll<T>(dir: string): T[] {
  return list(dir)
    .map((id) => load<T>(dir, id))
    .filter((x): x is T => x !== null)
}

export function remove(dir: string, id: string): boolean {
  const path = join(dir, `${id}.json`)
  if (!existsSync(path)) return false
  unlinkSync(path)
  return true
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function makeId(prefix: string, label = ""): string {
  const ts = Date.now().toString(36)
  const slug = label
    .toLowerCase()
    .replace(/[\u4e00-\u9fff]+/g, "cn") // collapse CJK blocks
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return slug ? `${prefix}-${slug}-${ts}` : `${prefix}-${ts}`
}

export function now(): string {
  return new Date().toISOString()
}

// ── Structured output ─────────────────────────────────────────────────────────
export function ok(data: unknown): never {
  console.log(JSON.stringify(data, null, 2))
  process.exit(0)
}

export function fail(error: string, detail?: unknown): never {
  console.error(JSON.stringify({ error, detail }, null, 2))
  process.exit(1)
}
