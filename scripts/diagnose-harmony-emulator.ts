import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const emulatorCandidates = [
  'D:/Program/DevEco Studio/tools/emulator/Emulator.exe',
  'D:/Program/command-line-tools/emulator/Emulator.exe',
]

const emulatorPath = emulatorCandidates.find(existsSync)
const hdcToolDirs = [
  'D:/Program/command-line-tools/bin',
  'D:/Program/command-line-tools/sdk/default/openharmony/toolchains',
].filter(existsSync)

const pathKey = process.platform === 'win32' ? 'Path' : 'PATH'
const env = {
  ...process.env,
  [pathKey]: [
    ...hdcToolDirs,
    process.env[pathKey] ?? '',
  ].filter(Boolean).join(path.delimiter),
}

function run(command: string, args: string[]) {
  return spawnSync(command, args, {
    env,
    encoding: 'utf8',
  })
}

if (!emulatorPath) {
  console.error('HarmonyOS Emulator.exe was not found.')
  process.exit(1)
}

const version = run(emulatorPath, ['-version'])
console.log((version.stdout || version.stderr).trim())

const list = run(emulatorPath, ['-list', '-details'])
if (list.status !== 0) {
  process.stderr.write(list.stderr)
  process.exit(list.status ?? 1)
}

interface EmulatorInstance {
  name: string
  deviceType: string
  isRunning: string
  instancePath: string
  imageRoot: string
  imageSubPath: string
  ['hw.hdc.port']: string
  ['os.osVersion']: string
}

const instances = JSON.parse(list.stdout) as EmulatorInstance[]
console.log('HarmonyOS emulator instances:')
for (const instance of instances) {
  console.log(`- ${instance.name} (${instance.deviceType}, running=${instance.isRunning}, hdc=${instance['hw.hdc.port']}, os=${instance['os.osVersion']})`)
}

const hdc = run('hdc', ['list', 'targets', '-v'])
console.log('hdc targets:')
console.log((hdc.stdout || '[Empty]').trim())

for (const instance of instances) {
  const logPath = path.join(instance.instancePath, 'Log/Emulator.log')
  if (!existsSync(logPath))
    continue

  const lines = readFileSync(logPath, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.includes('[Critical]') || line.includes('[Error]') || line.includes('can not read uuid file'))
    .slice(-8)

  if (lines.length > 0) {
    console.log(`Recent emulator errors for ${instance.name}:`)
    for (const line of lines)
      console.log(line)
  }
}
