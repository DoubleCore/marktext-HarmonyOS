import { emitBridgeError, emitEditorEvent, exposeEditorBridge } from './bridge'
import { HarmonyEditor } from './editor'
import './styles.css'

async function ensureIntlSegmenter(): Promise<void> {
  const intlNamespace = Intl as unknown as { Segmenter?: typeof Intl.Segmenter }
  if (intlNamespace.Segmenter)
    return

  const polyfill = await import('intl-segmenter-polyfill/dist/bundled')
  intlNamespace.Segmenter = await polyfill.createIntlSegmenterPolyfill() as typeof Intl.Segmenter
}

async function boot(): Promise<void> {
  await ensureIntlSegmenter()

  const container = document.querySelector<HTMLElement>('#editor')
  if (!container)
    throw new Error('Missing #editor container.')

  const editor = new HarmonyEditor(container)
  exposeEditorBridge(editor)
  emitEditorEvent({ type: 'editorReady' })
  editor.focus()
}

boot().catch(emitBridgeError)
