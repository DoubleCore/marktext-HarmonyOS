export interface DocumentModel {
  id: string
  title: string
  path: string
  markdown: string
  updatedAt: number
}

export interface RecentFile {
  id: string
  title: string
  path: string
  updatedAt: number
}

export function createDraftDocument(): DocumentModel {
  return {
    id: `${Date.now()}`,
    title: 'Untitled.md',
    path: '',
    markdown: '# Untitled\n\nStart writing in MarkText Harmony.\n',
    updatedAt: Date.now()
  }
}

export function toRecentFile(document: DocumentModel): RecentFile {
  return {
    id: document.id,
    title: document.title,
    path: document.path,
    updatedAt: document.updatedAt
  }
}
