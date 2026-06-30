import { EditorTheme } from '../models/EditorSettings'

@Component
export struct EditorToolbar {
  title: string = 'Untitled.md'
  theme: EditorTheme = 'light'
  onSettings: () => void = () => {}
  onSave: () => void = () => {}
  onExport: () => void = () => {}

  build() {
    Row({ space: 12 }) {
      Text('MarkText')
        .fontSize(15)
        .fontWeight(FontWeight.Bold)
        .fontColor(this.theme === 'dark' ? '#F4F7FB' : '#20242A')

      Text(this.title)
        .fontSize(13)
        .fontColor(this.theme === 'dark' ? '#9AA4B2' : '#64748B')
        .layoutWeight(1)
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })

      Button('Settings')
        .height(32)
        .fontSize(12)
        .backgroundColor(this.theme === 'dark' ? '#151B26' : '#EEF2F7')
        .fontColor(this.theme === 'dark' ? '#D9E2F1' : '#334155')
        .onClick(this.onSettings)

      Button('Save')
        .height(32)
        .fontSize(12)
        .onClick(this.onSave)

      Button('Export')
        .height(32)
        .fontSize(12)
        .onClick(this.onExport)
    }
    .width('100%')
    .padding({ left: 14, right: 14, top: 8, bottom: 8 })
    .backgroundColor(this.theme === 'dark' ? '#080B10' : '#FFFFFF')
  }
}
