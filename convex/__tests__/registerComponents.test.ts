import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import Bun from 'bun'
import type { GenericSchema, SchemaDefinition } from 'convex/server'
import type { TestConvex } from 'convex-test'
import prosemirrorSyncSchema from '../../node_modules/@convex-dev/prosemirror-sync/dist/component/schema.js'

type ComponentModules = Record<string, () => Promise<unknown>>

const prosemirrorComponentRoot = join(
  import.meta.dirname,
  '..',
  '..',
  'node_modules',
  '@convex-dev',
  'prosemirror-sync',
  'dist',
  'component',
)

function loadProsemirrorSyncModules(): ComponentModules {
  const modules: ComponentModules = {}
  const glob = new Bun.Glob('**/*.js')

  for (const relativePath of glob.scanSync({
    cwd: prosemirrorComponentRoot,
    onlyFiles: true,
  })) {
    const normalized = relativePath.replace(/\\/g, '/')
    const key = `./component/${normalized}`
    const absolutePath = join(prosemirrorComponentRoot, relativePath)
    modules[key] = () => import(pathToFileURL(absolutePath).href)
  }

  return modules
}

const prosemirrorSyncModules = loadProsemirrorSyncModules()

export function registerProsemirrorSyncComponent(
  t: TestConvex<SchemaDefinition<GenericSchema, boolean>>,
) {
  t.registerComponent(
    'prosemirrorSync',
    prosemirrorSyncSchema,
    prosemirrorSyncModules,
  )
}
