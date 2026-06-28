import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(repoRoot, 'dist', 'harmony-editor')
const targetDir = path.join(repoRoot, 'harmony', 'entry', 'src', 'main', 'resources', 'rawfile', 'editor')
const requiredAssets = ['index.html', 'editor.bundle.js', 'editor.css']

async function copyHarmonyEditorAssets(): Promise<void> {
  const existing = new Set(await readdir(sourceDir))
  const missing = requiredAssets.filter(asset => !existing.has(asset))
  if (missing.length > 0) {
    throw new Error(
      `Missing Harmony editor asset(s): ${missing.join(', ')}. Run pnpm build:harmony-editor first.`,
    )
  }

  await rm(targetDir, { recursive: true, force: true })
  await mkdir(targetDir, { recursive: true })

  for (const asset of requiredAssets)
    await copyFile(path.join(sourceDir, asset), path.join(targetDir, asset))

  const html = await readFile(path.join(sourceDir, 'index.html'), 'utf8')
  const script = await readFile(path.join(sourceDir, 'editor.bundle.js'), 'utf8')
  const css = await readFile(path.join(sourceDir, 'editor.css'), 'utf8')
  const inlinedHtml = html
    .replace(/\s*<script type="module" crossorigin src="\.\/editor\.bundle\.js"><\/script>/, '')
    .replace(/\s*<link rel="stylesheet" crossorigin href="\.\/editor\.css">/, () => `\n    <style>\n${css}\n    </style>`)
    .replace('</body>', () => `    <script type="module">\n${script}\n    </script>\n  </body>`)

  await writeFile(path.join(targetDir, 'index.html'), inlinedHtml)

  console.log(`Copied Harmony editor assets to ${path.relative(repoRoot, targetDir)}`)
}

copyHarmonyEditorAssets().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
