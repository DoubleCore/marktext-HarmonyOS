import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const harmonyRoot = path.join(repoRoot, 'harmony')
const hapPath = path.join(harmonyRoot, 'entry/build/default/outputs/default/entry-default-unsigned.hap')

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

const result = spawnSync('hvigorw', ['assembleHap', '--no-daemon', '--stacktrace'], {
  cwd: harmonyRoot,
  env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

if (result.status !== 0) {
  process.exitCode = result.status ?? 1
} else if (!existsSync(hapPath) || statSync(hapPath).size === 0) {
  console.error(`Harmony HAP was not generated: ${path.relative(repoRoot, hapPath)}`)
  process.exitCode = 1
} else {
  console.log(`Harmony HAP generated: ${path.relative(repoRoot, hapPath)}`)
}
