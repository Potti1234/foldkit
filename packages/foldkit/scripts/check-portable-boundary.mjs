import { readFileSync } from 'node:fs'
import { dirname, normalize, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDirectory = resolve(packageDirectory, 'src')
const entryFile = resolve(sourceDirectory, 'portable', 'public.ts')
const forbiddenPackages = new Set(['@effect/platform-browser'])
const forbiddenSourceDirectories = new Set([
  'canvas',
  'customElement',
  'dom',
  'html',
  'mount',
  'navigation',
  'render',
  'runtime',
  'scene',
  'snabbdom',
])
const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g
const pendingFiles = [entryFile]
const visitedFiles = new Set()
const failures = []

const toSourceFile = (importingFile, specifier) => {
  const importedPath = resolve(dirname(importingFile), specifier)
  if (importedPath.endsWith('.js')) {
    return `${importedPath.slice(0, -3)}.ts`
  }
  return importedPath
}

while (pendingFiles.length > 0) {
  const file = pendingFiles.shift()
  if (file === undefined || visitedFiles.has(file)) {
    continue
  }
  visitedFiles.add(file)

  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1]
    if (specifier === undefined) {
      continue
    }
    if (forbiddenPackages.has(specifier)) {
      failures.push(`${relative(packageDirectory, file)} imports ${specifier}`)
      continue
    }
    if (!specifier.startsWith('.')) {
      continue
    }

    const importedFile = normalize(toSourceFile(file, specifier))
    const importedRelativePath = relative(sourceDirectory, importedFile)
    const importedDirectory = importedRelativePath.split(/[\\/]/)[0]
    if (importedDirectory !== undefined && forbiddenSourceDirectories.has(importedDirectory)) {
      failures.push(
        `${relative(packageDirectory, file)} imports forbidden source ${importedRelativePath}`,
      )
      continue
    }
    pendingFiles.push(importedFile)
  }
}

if (failures.length > 0) {
  throw new Error(`Portable boundary violations:\n${failures.join('\n')}`)
}

process.stdout.write(
  `Portable boundary passed for ${visitedFiles.size} transitive source files.\n`,
)
