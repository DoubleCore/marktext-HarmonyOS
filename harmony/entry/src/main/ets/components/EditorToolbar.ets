@Component
export struct EditorToolbar {
  title: string = 'Untitled.md'
  onBack: () => void = () => {}
  onSave: () => void = () => {}
  onExport: () => void = () => {}

  build() {
    Row({ space: 10 }) {
      Button('Back')
        .height(36)
        .onClick(this.onBack)

      Text(this.title)
        .fontSize(16)
        .fontWeight(FontWeight.Medium)
        .fontColor('#24292F')
        .layoutWeight(1)
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })

      Button('Save')
        .height(36)
        .onClick(this.onSave)

      Button('Export')
        .height(36)
        .onClick(this.onExport)
    }
    .width('100%')
    .padding({ left: 12, right: 12, top: 10, bottom: 10 })
    .backgroundColor('#FFFFFF')
  }
}
