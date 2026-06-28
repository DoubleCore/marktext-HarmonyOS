import common from '@ohos.app.ability.common'
import promptAction from '@ohos.promptAction'
import router from '@ohos.router'
import { EmptyState } from '../components/EmptyState'
import { RecentFileList } from '../components/RecentFileList'
import { RecentFile } from '../models/DocumentModel'
import { FileService } from '../services/FileService'
import { RecentFileService } from '../services/RecentFileService'

@Entry
@Component
struct Index {
  private context: common.UIAbilityContext = getContext(this) as common.UIAbilityContext
  @State recentDocuments: RecentFile[] = []

  aboutToAppear(): void {
    void this.loadRecentDocuments()
  }

  onPageShow(): void {
    void this.loadRecentDocuments()
  }

  private async loadRecentDocuments(): Promise<void> {
    try {
      this.recentDocuments = await RecentFileService.list(this.context)
    } catch (error) {
      promptAction.showToast({ message: `${error}` })
    }
  }

  private openDraftEditor(): void {
    const document = FileService.createDraft()
    router.pushUrl({
      url: 'pages/EditorPage',
      params: {
        id: document.id,
        markdown: document.markdown,
        title: document.title,
        path: document.path
      }
    })
  }

  private async openRecentEditor(document: RecentFile): Promise<void> {
    try {
      const openedDocument = FileService.openRecentFile(this.context, document)
      router.pushUrl({
        url: 'pages/EditorPage',
        params: {
          id: openedDocument.id,
          markdown: openedDocument.markdown,
          title: openedDocument.title,
          path: openedDocument.path
        }
      })
    } catch (error) {
      promptAction.showToast({ message: `${error}` })
      await this.loadRecentDocuments()
    }
  }

  build() {
    Column({ space: 18 }) {
      Row() {
        Column({ space: 6 }) {
          Text('MarkText Harmony')
            .fontSize(30)
            .fontWeight(FontWeight.Bold)
            .fontColor('#1F2428')
          Text('Muya Markdown core in a HarmonyOS shell')
            .fontSize(14)
            .fontColor('#6B7280')
        }
        .alignItems(HorizontalAlign.Start)
        .layoutWeight(1)

        Button('Settings')
          .height(40)
          .onClick(() => router.pushUrl({ url: 'pages/SettingsPage' }))
      }
      .width('100%')

      Row({ space: 12 }) {
        Button('New Document')
          .height(48)
          .layoutWeight(1)
          .onClick(() => this.openDraftEditor())

        Button('Open Document')
          .height(48)
          .layoutWeight(1)
          .enabled(this.recentDocuments.length > 0)
          .onClick(() => {
            if (this.recentDocuments.length > 0)
              void this.openRecentEditor(this.recentDocuments[0])
          })
      }
      .width('100%')

      Text('Recent Documents')
        .width('100%')
        .fontSize(18)
        .fontWeight(FontWeight.Medium)
        .fontColor('#24292F')

      if (this.recentDocuments.length > 0) {
        RecentFileList({
          documents: this.recentDocuments,
          onOpen: (document: RecentFile) => {
            void this.openRecentEditor(document)
          }
        })
      } else {
        EmptyState({
          title: 'No recent documents',
          description: 'Create a Markdown document to begin.'
        })
      }
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .backgroundColor('#F6F7F9')
  }
}
