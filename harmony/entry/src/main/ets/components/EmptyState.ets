@Component
export struct EmptyState {
  title: string = ''
  description: string = ''

  build() {
    Column({ space: 8 }) {
      Text(this.title)
        .fontSize(18)
        .fontWeight(FontWeight.Medium)
        .fontColor('#24292F')
      Text(this.description)
        .fontSize(14)
        .fontColor('#6B7280')
        .textAlign(TextAlign.Center)
    }
    .width('100%')
    .padding(24)
    .borderRadius(8)
    .backgroundColor('#FFFFFF')
  }
}
