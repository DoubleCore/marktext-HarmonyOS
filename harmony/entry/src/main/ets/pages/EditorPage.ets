import common from '@ohos.app.ability.common'
import promptAction from '@ohos.promptAction'
import router from '@ohos.router'
import webview from '@ohos.web.webview'
import { EditorBridge, EditorBridgeEvent } from '../bridge/EditorBridge'
import { EditorToolbar } from '../components/EditorToolbar'
import { DocumentModel } from '../models/DocumentModel'
import { DEFAULT_EDITOR_SETTINGS, EditorTheme } from '../models/EditorSettings'
import { ExportService } from '../services/ExportService'
import { FileService } from '../services/FileService'
import { RecentFileService } from '../services/RecentFileService'
import { SettingsService } from '../services/SettingsService'

@Entry
@Component
struct EditorPage {
  private context: common.UIAbilityContext = getContext(this) as common.UIAbilityContext
  private controller: webview.WebviewController = new webview.WebviewController()
  private bridge: EditorBridge = new EditorBridge(this.controller, (event: EditorBridgeEvent) => this.handleEditorEvent(event))
  @State documentId: string = `${Date.now()}`
  @State title: string = 'Untitled.md'
  @State path: string = ''
  @State markdown: string = ''
  @State editorReady: boolean = false
  @State dirty: boolean = false
  @State statusText: string = 'Loading editor'
  @State theme: EditorTheme = DEFAULT_EDITOR_SETTINGS.theme
  @State fontSize: number = DEFAULT_EDITOR_SETTINGS.fontSize

  aboutToAppear(): void {
    const params = router.getParams() as Record<string, string>
    this.documentId = params?.id ?? this.documentId
    this.title = params?.title ?? this.title
    this.path = params?.path ?? this.path
    this.markdown = params?.markdown ?? this.markdown
    void this.loadSettings()
  }

  private async loadSettings(): Promise<void> {
    try {
      const settings = await SettingsService.load(this.context)
      this.theme = settings.theme
      this.fontSize = settings.fontSize
      if (this.editorReady) {
        await this.bridge.setTheme(this.theme)
        await this.bridge.setFontSize(this.fontSize)
      }
    } catch (error) {
      this.showEditorError(`${error}`)
    }
  }

  private async initializeEditor(): Promise<void> {
    try {
      await this.bridge.setMarkdown(this.markdown)
      await this.bridge.setTheme(this.theme)
      await this.bridge.setFontSize(this.fontSize)
      await this.bridge.focusEditor()
      this.dirty = false
      this.statusText = 'Editor ready'
    } catch (error) {
      this.showEditorError(`${error}`)
    }
  }

  private async saveDocument(): Promise<void> {
    try {
      this.statusText = 'Saving...'
      await this.persistMarkdown(this.markdown)
      this.statusText = `Saved ${this.title}`
      promptAction.showToast({ message: 'Markdown saved.' })
    } catch (error) {
      this.showEditorError(`${error}`)
    }
  }

  private async persistMarkdown(markdown: string): Promise<void> {
    const document: DocumentModel = {
      id: this.documentId,
      title: this.title,
      path: this.path,
      markdown,
      updatedAt: Date.now()
    }
    const savedDocument = FileService.saveDocument(this.context, document)
    this.documentId = savedDocument.id
    this.title = savedDocument.title
    this.path = savedDocument.path
    this.markdown = savedDocument.markdown
    await RecentFileService.touch(this.context, savedDocument)
    this.dirty = false
  }

  private async captureSaveRequest(markdown: string): Promise<void> {
    try {
      this.statusText = 'Saving...'
      await this.persistMarkdown(markdown)
      this.dirty = false
      this.statusText = `Saved ${this.title}`
      promptAction.showToast({ message: 'Markdown saved.' })
    } catch (error) {
      this.showEditorError(`${error}`)
    }
  }

  private async exportHtml(): Promise<void> {
    try {
      const html = await this.bridge.exportHtml()
      const result = ExportService.saveHtml(this.context, this.title, html)
      this.statusText = `Exported ${result.bytes} chars`
      promptAction.showToast({ message: `HTML exported: ${result.bytes} chars` })
    } catch (error) {
      this.showEditorError(`${error}`)
    }
  }

  private async toggleTheme(): Promise<void> {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark'
    try {
      await this.bridge.setTheme(nextTheme)
      this.theme = nextTheme
      await SettingsService.save(this.context, {
        theme: this.theme,
        fontSize: this.fontSize
      })
    } catch (error) {
      this.showEditorError(`${error}`)
    }
  }

  private handleEditorEvent(event: EditorBridgeEvent): void {
    if (event.type === 'editorReady') {
      this.editorReady = true
      this.statusText = 'Editor ready'
      this.initializeEditor()
      return
    }

    if (event.type === 'contentChanged') {
      this.markdown = this.getStringPayload(event, 'markdown', this.markdown)
      this.dirty = true
      return
    }

    if (event.type === 'saveRequested') {
      this.markdown = this.getStringPayload(event, 'markdown', this.markdown)
      void this.captureSaveRequest(this.markdown)
      return
    }

    if (event.type === 'error')
      promptAction.showToast({ message: this.getStringPayload(event, 'message', 'Editor error') })
  }

  private getStringPayload(event: EditorBridgeEvent, key: string, fallback: string): string {
    const value = key === 'markdown' ? event.payload?.markdown : event.payload?.message
    return typeof value === 'string' ? value : fallback
  }

  private showEditorError(message: string): void {
    this.statusText = message
    promptAction.showToast({ message })
  }

  build() {
    Column() {
      EditorToolbar({
        title: this.dirty ? `${this.title} *` : this.title,
        theme: this.theme,
        onSettings: () => router.pushUrl({ url: 'pages/SettingsPage' }),
        onSave: () => {
          void this.saveDocument()
        },
        onExport: () => {
          void this.exportHtml()
        }
      })

      Row({ space: 10 }) {
        Text(this.statusText)
          .fontSize(12)
          .fontColor(this.editorReady ? '#25D084' : (this.theme === 'dark' ? '#7D8797' : '#6B7280'))
          .layoutWeight(1)

        Button(this.theme === 'dark' ? 'Light' : 'Dark')
          .height(32)
          .onClick(() => {
            void this.toggleTheme()
          })
      }
      .width('100%')
      .padding({ left: 12, right: 12, bottom: 8 })
      .backgroundColor(this.theme === 'dark' ? '#080B10' : '#FFFFFF')

      Web({
        src: this.bridge.source,
        controller: this.controller
      })
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .fileAccess(true)
        .mixedMode(MixedMode.All)
        .javaScriptProxy({
          object: this.bridge.proxy,
          name: this.bridge.proxyName,
          methodList: this.bridge.proxyMethods,
          controller: this.controller
        })
        .width('100%')
        .layoutWeight(1)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(this.theme === 'dark' ? '#05070A' : '#F6F7F9')
  }
}
