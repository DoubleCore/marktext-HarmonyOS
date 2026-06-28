export type EditorTheme = 'light' | 'dark'

export interface EditorSettings {
  theme: EditorTheme
  fontSize: number
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  theme: 'light',
  fontSize: 16
}
