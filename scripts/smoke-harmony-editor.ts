import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(repoRoot, 'dist', 'harmony-editor')
const port = 4174
const host = '127.0.0.1'

type SmokeResult = {
  title: string
  markdown: string
  htmlOk: boolean
  theme: string | undefined
  fontSize: string
  messages: Array<{
    type: string
    hasMarkdown: boolean
    hasUpdatedAt: boolean
  }>
}

async function main(): Promise<void> {
  await assertBuiltAssets()

  const server = createServer(handleRequest)
  await new Promise<void>((resolve) => server.listen(port, host, resolve))

  try {
    const result = await runSmoke()
    assertSmokeResult(result)
    console.log('Harmony editor smoke passed.')
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    })
  }
}

async function assertBuiltAssets(): Promise<void> {
  for (const file of ['index.html', 'editor.bundle.js', 'editor.css']) {
    const info = await stat(path.join(distDir, file))
    if (!info.isFile() || info.size === 0)
      throw new Error(`Missing built Harmony editor asset: ${file}`)
  }
}

async function runSmoke(): Promise<SmokeResult> {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.addInitScript(() => {
      window.__harmonyMessages = []
      window.MarkTextHarmony = {
        postMessage(message: string) {
          window.__harmonyMessages.push(JSON.parse(message))
        },
        onEditorEvent(message: string) {
          window.__harmonyMessages.push(JSON.parse(message))
        },
      }
    })

    await page.goto(`http://${host}:${port}/`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => typeof window.MarkTextEditor === 'object')
    await page.evaluate(() => window.MarkTextEditor.setMarkdown('# Bridge Smoke\n\nHello ArkTS'))
    await page.waitForTimeout(300)
    await page.keyboard.press('Control+S')
    await page.waitForTimeout(200)
    await page.evaluate(() => {
      window.MarkTextEditor.setTheme('dark')
      window.MarkTextEditor.setFontSize(18)
      window.MarkTextEditor.focusEditor()
    })

    return await page.evaluate(async () => {
      const html = await window.MarkTextEditor.exportHtml()
      return {
        title: document.title,
        markdown: window.MarkTextEditor.getMarkdown(),
        htmlOk: html.includes('<h1') && html.includes('Bridge Smoke'),
        theme: document.documentElement.dataset.theme,
        fontSize: getComputedStyle(document.documentElement).getPropertyValue('--editor-font-size').trim(),
        messages: window.__harmonyMessages.map(event => ({
          type: event.type,
          hasMarkdown: Boolean(event.payload?.markdown),
          hasUpdatedAt: Boolean(event.payload?.updatedAt),
        })),
      }
    })
  } finally {
    await browser.close()
  }
}

function assertSmokeResult(result: SmokeResult): void {
  if (result.title !== 'MarkText Harmony Editor')
    throw new Error(`Unexpected page title: ${result.title}`)
  if (!result.markdown.includes('# Bridge Smoke'))
    throw new Error('getMarkdown() did not return the smoke Markdown.')
  if (!result.htmlOk)
    throw new Error('exportHtml() did not include the expected rendered heading.')
  if (result.theme !== 'dark')
    throw new Error(`setTheme() did not update the document theme: ${result.theme}`)
  if (result.fontSize !== '18px')
    throw new Error(`setFontSize() did not update --editor-font-size: ${result.fontSize}`)

  const ready = result.messages.find(event => event.type === 'editorReady')
  const changed = result.messages.find(event => event.type === 'contentChanged')
  const saveRequested = result.messages.find(event => event.type === 'saveRequested')

  if (!ready)
    throw new Error('Web editor did not emit editorReady.')
  if (!changed?.hasMarkdown || !changed.hasUpdatedAt)
    throw new Error('Web editor did not emit contentChanged with markdown and updatedAt.')
  if (!saveRequested?.hasMarkdown)
    throw new Error('Web editor did not emit saveRequested with markdown.')
}

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`)
  const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname
  const resolved = path.resolve(distDir, `.${decodeURIComponent(pathname)}`)

  if (!resolved.startsWith(distDir)) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }

  try {
    const body = await readFile(resolved)
    response.writeHead(200, { 'Content-Type': contentType(resolved) })
    response.end(body)
  } catch (_) {
    response.writeHead(404)
    response.end('Not found')
  }
}

function contentType(file: string): string {
  if (file.endsWith('.html'))
    return 'text/html; charset=utf-8'
  if (file.endsWith('.js'))
    return 'text/javascript; charset=utf-8'
  if (file.endsWith('.css'))
    return 'text/css; charset=utf-8'
  return 'application/octet-stream'
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
