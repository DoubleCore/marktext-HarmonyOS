import type { IMuyaOptions } from '@muyajs/core'
import {
  CodeBlockLanguageSelector,
  EmojiSelector,
  FootnoteTool,
  ImageResizeBar,
  ImageToolBar,
  InlineFormatToolbar,
  LinkTools,
  MarkdownToHtml,
  Muya,
  ParagraphFrontButton,
  ParagraphFrontMenu,
  ParagraphQuickInsertMenu,
  PreviewToolBar,
  TableChessboard,
  TableColumnToolbar,
  TableDragBar,
  TableRowColumMenu,
  en,
} from '@muyajs/core'
import type { EditorTheme } from './bridge'
import { emitBridgeError, emitEditorEvent } from './bridge'

const DEFAULT_MARKDOWN = `# HarmonyOS 架构演进与全场景体验

> 真正的无界，是从物理世界到数字空间的无缝流转。

## 分布式软总线的核心突破

分布式架构是鸿蒙操作系统的灵魂所在。通过软总线技术，设备之间的互联互通不再依赖复杂的网络配置，而是实现了真正的物理级融合。

### 核心特性

- **极简互联**：设备发现时间小于 1 秒
- **高宽传输**：支持多路 4K 视频并发无缝流转
- **超低时延**：毫秒级协同能力，精准同步内容状态

### 写作专注与优雅

在 MarkText for HarmonyOS 中，Markdown 的符号在指尖联动，化为秩序底层的层级，在墨黑与冷白之间寻找思想最纯粹的落脚点。
`

const DEFAULT_OPTIONS = {
  frontMatter: true,
  footnote: true,
  math: true,
  superSubScript: true,
  isGitlabCompatibilityEnabled: true,
  codeBlockLineNumbers: true,
  spellcheckEnabled: false,
  hideQuickInsertHint: false,
  mermaidTheme: 'default',
  vegaTheme: 'latimes',
  fontSize: 16,
  lineHeight: 1.6,
  tabSize: 4,
  listIndentation: 1,
} satisfies Partial<IMuyaOptions>

let pluginsRegistered = false

function registerPlugins(): void {
  if (pluginsRegistered)
    return

  Muya.use(EmojiSelector)
  Muya.use(FootnoteTool)
  Muya.use(InlineFormatToolbar)
  Muya.use(ImageToolBar)
  Muya.use(ImageResizeBar)
  Muya.use(CodeBlockLanguageSelector)
  Muya.use(LinkTools, {
    jumpClick: (linkInfo: { href?: string } | null) => {
      const href = linkInfo?.href
      if (href && /^https?:\/\//.test(href))
        window.open(href, '_blank', 'noopener,noreferrer')
    },
  })
  Muya.use(ParagraphFrontButton)
  Muya.use(ParagraphFrontMenu)
  Muya.use(ParagraphQuickInsertMenu)
  Muya.use(TableChessboard)
  Muya.use(TableColumnToolbar)
  Muya.use(TableDragBar)
  Muya.use(TableRowColumMenu)
  Muya.use(PreviewToolBar)

  pluginsRegistered = true
}

export class HarmonyEditor {
  private readonly muya: Muya
  private changeTimer: number | undefined

  constructor(container: HTMLElement, initialMarkdown = DEFAULT_MARKDOWN) {
    registerPlugins()
    this.muya = new Muya(container, {
      markdown: initialMarkdown,
      ...DEFAULT_OPTIONS,
    })
    this.muya.locale(en)
    this.muya.init()
    this.bindEvents()
  }

  setMarkdown(content: string): void {
    this.muya.setContent(content)
    this.muya.clearHistory()
    this.emitContentChanged()
  }

  getMarkdown(): string {
    this.muya.flush()
    return this.muya.getMarkdown()
  }

  async exportHtml(): Promise<string> {
    this.muya.flush()
    return new MarkdownToHtml(this.muya.getMarkdown(), this.muya).generate()
  }

  setTheme(theme: EditorTheme): void {
    document.documentElement.dataset.theme = theme
    this.muya.setOptions({
      mermaidTheme: theme === 'dark' ? 'dark' : 'default',
      vegaTheme: theme === 'dark' ? 'dark' : 'latimes',
    }, true)
  }

  setFontSize(size: number): void {
    if (!Number.isFinite(size) || size < 10 || size > 32)
      throw new RangeError('Font size must be between 10 and 32.')

    document.documentElement.style.setProperty('--editor-font-size', `${size}px`)
    this.muya.setOptions({ fontSize: size })
  }

  focus(): void {
    this.muya.focus()
  }

  private bindEvents(): void {
    this.muya.on('json-change', () => this.scheduleContentChanged())
    window.addEventListener('keydown', (event) => {
      const isCommand = event.ctrlKey || event.metaKey
      if (!isCommand)
        return

      if (event.key.toLowerCase() === 's') {
        event.preventDefault()
        emitEditorEvent({
          type: 'saveRequested',
          payload: { markdown: this.getMarkdown() },
        })
      }
    })
  }

  private scheduleContentChanged(): void {
    if (this.changeTimer !== undefined)
      window.clearTimeout(this.changeTimer)

    this.changeTimer = window.setTimeout(() => {
      this.changeTimer = undefined
      this.emitContentChanged()
    }, 120)
  }

  private emitContentChanged(): void {
    try {
      emitEditorEvent({
        type: 'contentChanged',
        payload: {
          markdown: this.getMarkdown(),
          updatedAt: Date.now(),
        },
      })
    }
    catch (error) {
      emitBridgeError(error)
    }
  }
}
