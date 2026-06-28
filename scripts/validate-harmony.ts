import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const requiredFiles = [
  'harmony/README.md',
  'harmony/oh-package.json5',
  'harmony/build-profile.json5',
  'harmony/hvigorfile.ts',
  'harmony/hvigor/hvigor-config.json5',
  'harmony/AppScope/app.json5',
  'harmony/entry/oh-package.json5',
  'harmony/entry/build-profile.json5',
  'harmony/entry/hvigorfile.ts',
  'harmony/entry/src/main/module.json5',
  'harmony/entry/src/main/ets/entryability/EntryAbility.ets',
  'harmony/entry/src/main/ets/pages/Index.ets',
  'harmony/entry/src/main/ets/pages/EditorPage.ets',
  'harmony/entry/src/main/ets/pages/SettingsPage.ets',
  'harmony/entry/src/main/ets/bridge/EditorBridge.ets',
  'harmony/entry/src/main/ets/models/DocumentModel.ets',
  'harmony/entry/src/main/ets/models/EditorSettings.ets',
  'harmony/entry/src/main/ets/services/FileService.ets',
  'harmony/entry/src/main/ets/services/RecentFileService.ets',
  'harmony/entry/src/main/ets/services/SettingsService.ets',
  'harmony/entry/src/main/ets/services/ExportService.ets',
  'packages/harmony-editor/package.json',
  'packages/harmony-editor/index.html',
  'packages/harmony-editor/src/main.ts',
  'packages/harmony-editor/src/editor.ts',
  'packages/harmony-editor/src/bridge.ts',
  'packages/harmony-editor/src/styles.css',
  'packages/harmony-editor/vite.config.ts',
  'scripts/copy-harmony-editor-assets.ts',
  'scripts/build-harmony.ts',
  'scripts/check-harmony-device.ts',
  'scripts/diagnose-harmony-emulator.ts',
  'scripts/run-harmony-device.ts',
]

const requiredRootScripts = [
  'build:harmony-editor',
  'copy:harmony-editor',
  'prepare:harmony-editor',
  'build:harmony',
  'check:harmony-device',
  'diagnose:harmony-emulator',
  'run:harmony-device',
  'smoke:harmony-editor',
  'validate:harmony',
  'verify:harmony',
]

const requiredBridgeMethods = [
  'setMarkdown',
  'getMarkdown',
  'exportHtml',
  'setTheme',
  'setFontSize',
  'focusEditor',
]

const serviceOnlyImports = [
  '@ohos.file.fs',
  '@ohos.data.preferences',
]

const forbiddenCodePatterns = [
  'packages/desktop',
  'electron',
  'login',
  'cloud sync',
  'pdf export',
]

async function main(): Promise<void> {
  await verifyRequiredFiles()
  await verifyRootScripts()
  await verifyBridgeContract()
  await verifyStorageBoundary()
  await verifyForbiddenCodePatterns()
  console.log('Harmony MVP validation passed.')
}

async function verifyRequiredFiles(): Promise<void> {
  for (const file of requiredFiles)
    await assertFile(file)
}

async function verifyRootScripts(): Promise<void> {
  const packageJson = JSON.parse(await readText('package.json')) as { scripts?: Record<string, string> }
  for (const script of requiredRootScripts) {
    if (!packageJson.scripts?.[script])
      throw new Error(`Missing root package script: ${script}`)
  }
}

async function verifyBridgeContract(): Promise<void> {
  const webBridge = await readText('packages/harmony-editor/src/bridge.ts')
  const arkBridge = await readText('harmony/entry/src/main/ets/bridge/EditorBridge.ets')
  const editorPage = await readText('harmony/entry/src/main/ets/pages/EditorPage.ets')

  for (const method of requiredBridgeMethods) {
    if (!webBridge.includes(method))
      throw new Error(`Web bridge is missing ${method}`)
    if (!arkBridge.includes(method))
      throw new Error(`ArkTS bridge is missing ${method}`)
  }

  for (const eventType of ['editorReady', 'contentChanged', 'saveRequested', 'error']) {
    if (!webBridge.includes(eventType) || !arkBridge.includes(eventType) || !editorPage.includes(eventType))
      throw new Error(`Editor event is not wired end-to-end: ${eventType}`)
  }

  if (!editorPage.includes('.javaScriptProxy({'))
    throw new Error('EditorPage must inject the MarkTextHarmony JavaScript proxy.')
}

async function verifyStorageBoundary(): Promise<void> {
  const files = await listFiles('harmony/entry/src/main/ets')
  for (const file of files) {
    const normalized = file.replace(/\\/g, '/')
    const text = await readText(file)
    for (const importName of serviceOnlyImports) {
      if (text.includes(importName) && !normalized.includes('/services/'))
        throw new Error(`${importName} must only be used inside harmony services: ${file}`)
    }
  }
}

async function verifyForbiddenCodePatterns(): Promise<void> {
  const files = [
    ...(await listFiles('harmony/entry/src/main/ets')),
    ...(await listFiles('packages/harmony-editor/src')),
    'scripts/copy-harmony-editor-assets.ts',
  ]

  for (const file of files) {
    const lower = (await readText(file)).toLowerCase()
    for (const pattern of forbiddenCodePatterns) {
      if (lower.includes(pattern))
        throw new Error(`Forbidden MVP scope pattern "${pattern}" found in ${file}`)
    }
  }
}

async function assertFile(file: string): Promise<void> {
  const info = await stat(resolve(file))
  if (!info.isFile())
    throw new Error(`Required file is not a file: ${file}`)
}

async function listFiles(dir: string): Promise<string[]> {
  const result: string[] = []
  const entries = await readdir(resolve(dir), { withFileTypes: true })

  for (const entry of entries) {
    const relativePath = path.posix.join(dir.replace(/\\/g, '/'), entry.name)
    if (entry.isDirectory()) {
      result.push(...await listFiles(relativePath))
    } else if (entry.isFile()) {
      result.push(relativePath)
    }
  }

  return result
}

async function readText(file: string): Promise<string> {
  return readFile(resolve(file), 'utf8')
}

function resolve(file: string): string {
  return path.join(repoRoot, file)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
