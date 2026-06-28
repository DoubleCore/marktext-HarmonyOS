import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const harmonyToolDirs = [
  'D:/Program/command-line-tools/bin',
  'D:/Program/command-line-tools/sdk/default/openharmony/toolchains',
].filter(existsSync)

const pathKey = process.platform === 'win32' ? 'Path' : 'PATH'
const env = {
  ...process.env,
  [pathKey]: [
    ...harmonyToolDirs,
    process.env[pathKey] ?? '',
  ].filter(Boolean).join(path.delimiter),
}

interface HdcTarget {
  id: string
  connection: string
  status: string
}

function isPotentialRuntimeTarget(target: HdcTarget): boolean {
  if (target.connection === 'UART')
    return false

  return target.status === 'Ready' || target.status === 'Connected'
}

function canRunShell(target: HdcTarget): boolean {
  const probe = spawnSync('hdc', ['-t', target.id, 'shell', 'aa', 'dump', '-l'], {
    env,
    shell: process.platform === 'win32',
    encoding: 'utf8',
  })

  return probe.status === 0
}

const result = spawnSync('hdc', ['list', 'targets', '-v'], {
  env,
  shell: process.platform === 'win32',
  encoding: 'utf8',
})

if (result.status !== 0) {
  process.stderr.write(result.stderr)
  process.exitCode = result.status ?? 1
} else {
  const output = result.stdout.trim()
  const targets = output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && line !== '[Empty]')
    .map((line): HdcTarget => {
      const parts = line.split(/\s+/)
      return {
        id: parts[0] ?? '',
        connection: parts[1] ?? '',
        status: parts[2] ?? '',
      }
    })
  const runtimeTargets = targets
    .filter(isPotentialRuntimeTarget)
    .filter(canRunShell)

  if (runtimeTargets.length === 0) {
    console.error('No HarmonyOS emulator or device is connected.')
    if (targets.length > 0) {
      console.error('Non-runnable targets were detected:')
      for (const target of targets)
        console.error(`- ${target.id} (${target.connection}, ${target.status})`)
    }
    console.error('Start a DevEco emulator or connect a device, then run pnpm check:harmony-device again.')
    process.exitCode = 1
  } else {
    console.log('HarmonyOS targets:')
    for (const target of runtimeTargets)
      console.log(`- ${target.id} (${target.connection}, ${target.status})`)
  }
}
