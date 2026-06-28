import { existsSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const hapPath = path.join(repoRoot, 'harmony/entry/build/default/outputs/default/entry-default-unsigned.hap')
const bundleName = 'com.marktext.harmony'
const abilityName = 'EntryAbility'

interface HdcTarget {
  id: string
  connection: string
  status: string
}

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

function runHdc(args: string[]) {
  return spawnSync('hdc', args, {
    env,
    shell: process.platform === 'win32',
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function printResult(result: ReturnType<typeof runHdc>): void {
  if (result.stdout)
    process.stdout.write(result.stdout)
  if (result.stderr)
    process.stderr.write(result.stderr)
}

function isPotentialRuntimeTarget(target: HdcTarget): boolean {
  if (target.connection === 'UART')
    return false

  return target.status === 'Ready' || target.status === 'Connected'
}

function canRunShell(target: HdcTarget): boolean {
  const probe = runHdc(['-t', target.id, 'shell', 'aa', 'dump', '-l'])
  return probe.status === 0
}

function getTargets(): string[] {
  const result = runHdc(['list', 'targets', '-v'])
  if (result.status !== 0) {
    printResult(result)
    process.exit(result.status ?? 1)
  }

  const targets = result.stdout
    .trim()
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
    .filter(isPotentialRuntimeTarget)

  const runtimeTargets = targets.filter(canRunShell)
  if (runtimeTargets.length === 0 && targets.length > 0) {
    console.error('HarmonyOS targets were detected, but none are runnable:')
    for (const target of targets)
      console.error(`- ${target.id} (${target.connection}, ${target.status})`)
  }

  return runtimeTargets.map(target => target.id)
}

if (!existsSync(hapPath) || statSync(hapPath).size === 0) {
  console.error(`Harmony HAP is missing. Run pnpm build:harmony first: ${path.relative(repoRoot, hapPath)}`)
  process.exit(1)
}

const targets = getTargets()
const configuredTarget = process.env.HARMONY_HDC_TARGET
const target = configuredTarget || targets[0]

if (!target) {
  console.error('No HarmonyOS emulator or device is connected.')
  console.error('Start a DevEco emulator or connect a device, then run pnpm run:harmony-device again.')
  process.exit(1)
}

if (targets.length > 1 && !configuredTarget) {
  console.error('Multiple HarmonyOS targets are connected.')
  console.error('Set HARMONY_HDC_TARGET to one of these targets, then rerun pnpm run:harmony-device:')
  for (const item of targets)
    console.error(`- ${item}`)
  process.exit(1)
}

const targetArgs = ['-t', target]
const install = runHdc([...targetArgs, 'install', '-r', hapPath])
printResult(install)
if (install.status !== 0)
  process.exit(install.status ?? 1)

const launch = runHdc([...targetArgs, 'shell', 'aa', 'start', '-b', bundleName, '-a', abilityName])
printResult(launch)
if (launch.status !== 0)
  process.exit(launch.status ?? 1)

console.log(`Launched ${bundleName}/${abilityName} on ${target}.`)
