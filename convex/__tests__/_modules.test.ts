import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import Bun from 'bun'

/** Absolute path to the convex/ directory (parent of __tests__). */
const convexRoot = join(import.meta.dirname, '..')

/**
 * Module map for convex-test (Bun). Keys are paths relative to the convex/ root.
 */
function loadConvexModules(): Record<string, () => Promise<unknown>> {
  const modules: Record<string, () => Promise<unknown>> = {}
  const glob = new Bun.Glob('**/*.{ts,js}')

  for (const relativePath of glob.scanSync({
    cwd: convexRoot,
    onlyFiles: true,
  })) {
    const normalized = relativePath.replace(/\\/g, '/')
    if (normalized.startsWith('__tests__/') || normalized.endsWith('.d.ts')) {
      continue
    }
    const key = `./${normalized}`
    const absolutePath = join(convexRoot, relativePath)
    modules[key] = () => import(pathToFileURL(absolutePath).href)
  }

  return modules
}

export const modules = loadConvexModules()
