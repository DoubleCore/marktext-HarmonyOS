import { RecentFile } from '../models/DocumentModel'

@Component
export struct RecentFileList {
  documents: RecentFile[] = []
  onOpen: (document: RecentFile) => void = () => {}

  build() {
    Column({ space: 8 }) {
      ForEach(this.documents, (document: RecentFile) => {
        Row() {
          Column({ space: 4 }) {
            Text(document.title)
              .fontSize(16)
              .fontWeight(FontWeight.Medium)
              .fontColor('#24292F')
            Text(document.path || 'App sandbox')
              .fontSize(12)
              .fontColor('#6B7280')
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)

          Text('Open')
            .fontSize(14)
            .fontColor('#2F6FBD')
        }
        .width('100%')
        .padding(14)
        .borderRadius(8)
        .backgroundColor('#FFFFFF')
        .onClick(() => this.onOpen(document))
      }, (document: RecentFile) => document.path)
    }
    .width('100%')
  }
}
