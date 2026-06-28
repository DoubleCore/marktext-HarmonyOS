import webview from '@ohos.web.webview'

export type EditorTheme = 'light' | 'dark'
export type EditorBridgeEventType = 'editorReady' | 'contentChanged' | 'saveRequested' | 'exportRequested' | 'error'

export interface EditorBridgePayload {
  markdown?: string
  updatedAt?: number
  message?: string
}

export interface EditorBridgeEvent {
  type: EditorBridgeEventType
  payload?: EditorBridgePayload
}

export type EditorBridgeEventHandler = (event: EditorBridgeEvent) => void

class EditorHostProxy {
  private readonly onMessage: (message: string) => void

  constructor(onMessage: (message: string) => void) {
    this.onMessage = onMessage
  }

  postMessage(message: string): void {
    this.onMessage(message)
  }

  onEditorEvent(message: string): void {
    this.onMessage(message)
  }
}

export class EditorBridge {
  private readonly controller: webview.WebviewController
  private readonly hostProxy: EditorHostProxy
  private readonly onEvent: EditorBridgeEventHandler
  private ready: boolean = false

  constructor(controller: webview.WebviewController, onEvent: EditorBridgeEventHandler) {
    this.controller = controller
    this.onEvent = onEvent
    this.hostProxy = new EditorHostProxy((message: string) => this.handleEventMessage(message))
  }

  get source(): string {
    return 'resource://rawfile/editor/index.html'
  }

  onEditorReady(): void {
    this.ready = true
  }

  isReady(): boolean {
    return this.ready
  }

  get proxy(): EditorHostProxy {
    return this.hostProxy
  }

  get proxyName(): string {
    return 'MarkTextHarmony'
  }

  get proxyMethods(): string[] {
    return ['postMessage', 'onEditorEvent']
  }

  setMarkdown(content: string): Promise<string> {
    return this.callEditor(`window.MarkTextEditor.setMarkdown(${JSON.stringify(content)})`)
  }

  getMarkdown(): Promise<string> {
    return this.callEditor('window.MarkTextEditor.getMarkdown()')
  }

  exportHtml(): Promise<string> {
    return this.callEditor('await window.MarkTextEditor.exportHtml()')
  }

  setTheme(theme: EditorTheme): Promise<string> {
    return this.callEditor(`window.MarkTextEditor.setTheme(${JSON.stringify(theme)})`)
  }

  setFontSize(size: number): Promise<string> {
    return this.callEditor(`window.MarkTextEditor.setFontSize(${size})`)
  }

  focusEditor(): Promise<string> {
    return this.callEditor('window.MarkTextEditor.focusEditor()')
  }

  private handleEventMessage(message: string): void {
    let event: EditorBridgeEvent
    try {
      event = JSON.parse(message) as EditorBridgeEvent
    } catch (_) {
      event = {
        type: 'error',
        payload: {
          message: 'Invalid editor event payload.'
        }
      }
    }

    if (event.type === 'editorReady')
      this.onEditorReady()

    this.onEvent(event)
  }

  private callEditor(expression: string): Promise<string> {
    const script = `
      (async () => {
        if (!window.MarkTextEditor) {
          throw new Error('MarkText editor bridge is not ready.')
        }
        return ${expression}
      })()
    `
    return this.controller.runJavaScript(script)
  }
}
