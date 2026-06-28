import common from '@ohos.app.ability.common'
import preferences from '@ohos.data.preferences'
import { DocumentModel, RecentFile, toRecentFile } from '../models/DocumentModel'

const PREFERENCES_NAME = 'marktext_harmony_recent_files'
const RECENT_FILES_KEY = 'recentFiles'
const MAX_RECENT_FILES = 20

export class RecentFileService {
  static async list(context: common.UIAbilityContext): Promise<RecentFile[]> {
    const store = await preferences.getPreferences(context, PREFERENCES_NAME)
    const raw = await store.get(RECENT_FILES_KEY, '[]') as string
    return RecentFileService.parseRecentFiles(raw)
  }

  static async touch(context: common.UIAbilityContext, document: DocumentModel): Promise<RecentFile[]> {
    const recentFile = toRecentFile(document)
    const current = await RecentFileService.list(context)
    const next = [
      recentFile,
      ...current.filter(item => item.path !== recentFile.path)
    ]
      .filter(item => item.path.length > 0)
      .slice(0, MAX_RECENT_FILES)

    const store = await preferences.getPreferences(context, PREFERENCES_NAME)
    await store.put(RECENT_FILES_KEY, JSON.stringify(next))
    await store.flush()
    return next
  }

  private static parseRecentFiles(raw: string): RecentFile[] {
    try {
      const parsed = JSON.parse(raw) as RecentFile[]
      return parsed
        .filter(item => Boolean(item.path) && Boolean(item.title))
        .slice(0, MAX_RECENT_FILES)
    } catch (_) {
      return []
    }
  }
}
