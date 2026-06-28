import type { HarmonyEditor } from './editor'

export type EditorTheme = 'light' | 'dark'

export type EditorEvent =
  | { type: 'editorReady' }
  | { type: 'contentChanged', payload: { markdown: string, updatedAt: number } }
  | { type: 'saveRequested', payload: { markdown: string } }
  | { type: 'exportRequested', payload: { html: string } }
  | { type: 'error', payload: { message: string, stack?: string } }

export interface MarkTextEditorBridge {
  setMarkdown(content: string): void
  getMarkdown(): string
  exportHtml(): Promise<string>
  setTheme(theme: EditorTheme): void
  setFontSize(size: number): void
  focusEditor(): void
}

type HarmonyHost = {
  postMessage?: (message: string) => void
  onEditorEvent?: (message: string) => void
}

declare global {
  interface Window {
    MarkTextEditor: MarkTextEditorBridge
    MarkTextHarmony?: HarmonyHost
  }
}

export function emitEditorEvent(event: EditorEvent): void {
  const message = JSON.stringify(event)

  window.dispatchEvent(new CustomEvent('marktext-editor-event', { detail: event }))

  const harmonyHost = window.MarkTextHarmony
  if (typeof harmonyHost?.postMessage === 'function') {
    harmonyHost.postMessage(message)
    return
  }

  if (typeof harmonyHost?.onEditorEvent === 'function')
    harmonyHost.onEditorEvent(message)
}

export function exposeEditorBridge(editor: HarmonyEditor): MarkTextEditorBridge {
  const bridge: MarkTextEditorBridge = {
    setMarkdown(content: string) {
      editor.setMarkdown(content)
    },
    getMarkdown() {
      return editor.getMarkdown()
    },
    exportHtml() {
      return editor.exportHtml()
    },
    setTheme(theme: EditorTheme) {
      editor.setTheme(theme)
    },
    setFontSize(size: number) {
      editor.setFontSize(size)
    },
    focusEditor() {
      editor.focus()
    },
  }

  window.MarkTextEditor = bridge
  return bridge
}

export function emitBridgeError(error: unknown): void {
  const err = error instanceof Error ? error : new Error(String(error))
  emitEditorEvent({
    type: 'error',
    payload: {
      message: err.message,
      stack: err.stack,
    },
  })
}
