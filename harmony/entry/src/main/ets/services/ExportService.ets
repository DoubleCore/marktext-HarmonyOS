import common from '@ohos.app.ability.common'
import fs from '@ohos.file.fs'

export interface ExportResult {
  path: string
  bytes: number
}

export class ExportService {
  static saveHtml(context: common.UIAbilityContext, title: string, html: string): ExportResult {
    ExportService.ensureExportsDir(context)
    const path = ExportService.createExportPath(context, title, Date.now())
    const file = fs.openSync(path, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC)
    try {
      fs.writeSync(file.fd, html)
    } finally {
      fs.closeSync(file)
    }

    return {
      path,
      bytes: html.length
    }
  }

  private static createExportPath(context: common.UIAbilityContext, title: string, timestamp: number): string {
    const fileName = ExportService.normalizeHtmlName(title, timestamp)
    return `${ExportService.getExportsDir(context)}/${fileName}`
  }

  private static normalizeHtmlName(title: string, timestamp: number): string {
    const baseName = (title.trim() || `untitled-${timestamp}`)
      .replace(/\.md$/i, '')
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
    return `${baseName || `untitled-${timestamp}`}.html`
  }

  private static getExportsDir(context: common.UIAbilityContext): string {
    return context.filesDir
  }

  private static ensureExportsDir(context: common.UIAbilityContext): void {
    try {
      fs.accessSync(ExportService.getExportsDir(context))
    } catch (_) {
      fs.mkdirSync(ExportService.getExportsDir(context))
    }
  }
}
