import common from '@ohos.app.ability.common'
import preferences from '@ohos.data.preferences'
import { DEFAULT_EDITOR_SETTINGS, EditorSettings, EditorTheme } from '../models/EditorSettings'

const PREFERENCES_NAME = 'marktext_harmony_settings'
const SETTINGS_KEY = 'editorSettings'

export class SettingsService {
  static async load(context: common.UIAbilityContext): Promise<EditorSettings> {
    const store = await preferences.getPreferences(context, PREFERENCES_NAME)
    const raw = await store.get(SETTINGS_KEY, JSON.stringify(DEFAULT_EDITOR_SETTINGS)) as string
    return SettingsService.parseSettings(raw)
  }

  static async save(context: common.UIAbilityContext, settings: EditorSettings): Promise<EditorSettings> {
    const normalizedSettings = SettingsService.normalizeSettings(settings)
    const store = await preferences.getPreferences(context, PREFERENCES_NAME)
    await store.put(SETTINGS_KEY, JSON.stringify(normalizedSettings))
    await store.flush()
    return normalizedSettings
  }

  private static parseSettings(raw: string): EditorSettings {
    try {
      return SettingsService.normalizeSettings(JSON.parse(raw) as EditorSettings)
    } catch (_) {
      return DEFAULT_EDITOR_SETTINGS
    }
  }

  private static normalizeSettings(settings: EditorSettings): EditorSettings {
    const theme: EditorTheme = settings.theme === 'dark' ? 'dark' : 'light'
    const fontSize = Math.min(Math.max(Math.round(settings.fontSize), 12), 24)
    return {
      theme,
      fontSize
    }
  }
}
