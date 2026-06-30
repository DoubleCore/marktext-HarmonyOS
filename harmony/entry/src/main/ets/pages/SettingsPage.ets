import common from '@ohos.app.ability.common'
import promptAction from '@ohos.promptAction'
import router from '@ohos.router'
import { DEFAULT_EDITOR_SETTINGS, EditorSettings, EditorTheme } from '../models/EditorSettings'
import { SettingsService } from '../services/SettingsService'

@Entry
@Component
struct SettingsPage {
  private context: common.UIAbilityContext = getContext(this) as common.UIAbilityContext
  @State theme: EditorTheme = DEFAULT_EDITOR_SETTINGS.theme
  @State fontSize: number = DEFAULT_EDITOR_SETTINGS.fontSize

  aboutToAppear(): void {
    void this.loadSettings()
  }

  private async loadSettings(): Promise<void> {
    try {
      const settings = await SettingsService.load(this.context)
      this.theme = settings.theme
      this.fontSize = settings.fontSize
    } catch (error) {
      promptAction.showToast({ message: `${error}` })
    }
  }

  private async saveSettings(settings: EditorSettings): Promise<void> {
    try {
      const savedSettings = await SettingsService.save(this.context, settings)
      this.theme = savedSettings.theme
      this.fontSize = savedSettings.fontSize
      promptAction.showToast({ message: 'Settings saved.' })
    } catch (error) {
      promptAction.showToast({ message: `${error}` })
    }
  }

  build() {
    Column({ space: 18 }) {
      Row() {
        Button('Back')
          .height(40)
          .backgroundColor(this.theme === 'dark' ? '#2563EB' : '#0F62FE')
          .onClick(() => router.back())

        Text('Settings')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor(this.theme === 'dark' ? '#F4F7FB' : '#1F2428')
          .layoutWeight(1)
      }
      .width('100%')

      Row() {
        Column({ space: 4 }) {
          Text('Dark theme')
            .fontSize(16)
            .fontWeight(FontWeight.Medium)
            .fontColor(this.theme === 'dark' ? '#F4F7FB' : '#1F2428')
          Text('Applied to the Web editor on the editor page.')
            .fontSize(12)
            .fontColor(this.theme === 'dark' ? '#9AA4B2' : '#6B7280')
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)

        Toggle({ type: ToggleType.Switch, isOn: this.theme === 'dark' })
          .onChange((isOn: boolean) => {
            void this.saveSettings({
              theme: isOn ? 'dark' : 'light',
              fontSize: this.fontSize
            })
          })
      }
      .width('100%')
      .padding(16)
      .borderRadius(8)
      .backgroundColor(this.theme === 'dark' ? '#10151E' : '#FFFFFF')

      Column({ space: 10 }) {
        Row() {
          Text('Font size')
            .fontSize(16)
            .fontWeight(FontWeight.Medium)
            .fontColor(this.theme === 'dark' ? '#F4F7FB' : '#1F2428')
            .layoutWeight(1)
          Text(`${this.fontSize}px`)
            .fontSize(14)
            .fontColor(this.theme === 'dark' ? '#9AA4B2' : '#6B7280')
        }
        .width('100%')

        Slider({
          value: this.fontSize,
          min: 12,
          max: 24,
          step: 1
        })
          .onChange((value: number) => {
            void this.saveSettings({
              theme: this.theme,
              fontSize: value
            })
          })
      }
      .width('100%')
      .padding(16)
      .borderRadius(8)
      .backgroundColor(this.theme === 'dark' ? '#10151E' : '#FFFFFF')
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .backgroundColor(this.theme === 'dark' ? '#05070A' : '#F6F7F9')
  }
}
