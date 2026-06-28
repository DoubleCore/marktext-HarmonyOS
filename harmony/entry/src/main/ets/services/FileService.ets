import common from '@ohos.app.ability.common'
import fs from '@ohos.file.fs'
import { createDraftDocument, DocumentModel, RecentFile } from '../models/DocumentModel'

export class FileService {
  static createDraft(): DocumentModel {
    return createDraftDocument()
  }

  static saveDocument(context: common.UIAbilityContext, document: DocumentModel): DocumentModel {
    const now = Date.now()
    const path = document.path || FileService.createDocumentPath(context, document.title, now)
    const savedDocument: DocumentModel = {
      id: document.id || `${now}`,
      title: FileService.ensureMarkdownTitle(document.title),
      path,
      markdown: document.markdown,
      updatedAt: now
    }

    FileService.ensureDocumentsDir(context)
    FileService.writeText(path, savedDocument.markdown)
    return savedDocument
  }

  static openRecentFile(_context: common.UIAbilityContext, recentFile: RecentFile): DocumentModel {
    const markdown = fs.readTextSync(recentFile.path, { encoding: 'utf-8' })
    return {
      id: recentFile.id,
      title: recentFile.title,
      path: recentFile.path,
      markdown,
      updatedAt: recentFile.updatedAt
    }
  }

  private static createDocumentPath(context: common.UIAbilityContext, title: string, timestamp: number): string {
    const safeTitle = FileService.ensureMarkdownTitle(title)
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
    const fileName = safeTitle === 'Untitled.md' ? `untitled-${timestamp}.md` : safeTitle
    return `${FileService.getDocumentsDir(context)}/${fileName}`
  }

  private static ensureMarkdownTitle(title: string): string {
    const normalizedTitle = title.trim() || 'Untitled.md'
    return normalizedTitle.toLowerCase().endsWith('.md') ? normalizedTitle : `${normalizedTitle}.md`
  }

  private static getDocumentsDir(context: common.UIAbilityContext): string {
    return context.filesDir
  }

  private static ensureDocumentsDir(context: common.UIAbilityContext): void {
    try {
      fs.accessSync(FileService.getDocumentsDir(context))
    } catch (_) {
      fs.mkdirSync(FileService.getDocumentsDir(context))
    }
  }

  private static writeText(path: string, content: string): void {
    const file = fs.openSync(path, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC)
    try {
      fs.writeSync(file.fd, content)
    } finally {
      fs.closeSync(file)
    }
  }
}
