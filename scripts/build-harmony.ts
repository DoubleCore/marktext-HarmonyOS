import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const harmonyRoot = path.join(repoRoot, 'harmony')
const appPath = path.join(harmonyRoot, 'build/outputs/default/harmony-default-unsigned.app')

const harmonyToolDirs = [
  'D:/Program/command-line-tools/bin',
  'D:/Program/command-line-tools/sdk/default/openharmony/toolchains',
].filter(existsSync)

const pathKey = process.platform === 'win32' ? 'Path' : 'PATH'
const currentPath = process.env[pathKey] ?? ''

const env = {
  ...process.env,
  [pathKey]: [
    ...harmonyToolDirs,
    currentPath,
  ].filter(Boolean).join(path.delimiter),
}

const result = spawnSync('hvigorw', ['assembleApp', '--no-daemon', '--stacktrace'], {
  cwd: harmonyRoot,
  env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

if (result.status !== 0) {
  process.exitCode = result.status ?? 1
} else if (!existsSync(appPath) || statSync(appPath).size === 0) {
  console.error(`Harmony App Pack was not generated: ${path.relative(repoRoot, appPath)}`)
  process.exitCode = 1
} else {
  console.log(`Harmony App Pack generated: ${path.relative(repoRoot, appPath)}`)
}
