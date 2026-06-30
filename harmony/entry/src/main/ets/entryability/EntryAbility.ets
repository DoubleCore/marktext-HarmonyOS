import AbilityConstant from '@ohos.app.ability.AbilityConstant'
import hilog from '@ohos.hilog'
import UIAbility from '@ohos.app.ability.UIAbility'
import Want from '@ohos.app.ability.Want'
import window from '@ohos.window'

const DESKTOP_MIN_WIDTH = 840
const PHONE_PORTRAIT_RATIO = 1.25

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(0x0000, 'MarkTextHarmony', 'Ability created: %{public}s', want.abilityName ?? 'EntryAbility')
    void launchParam
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    const page = this.getInitialPage(windowStage)
    windowStage.loadContent(page, (err) => {
      if (err.code) {
        hilog.error(0x0000, 'MarkTextHarmony', 'Load content failed: %{public}s', JSON.stringify(err))
        return
      }

      hilog.info(0x0000, 'MarkTextHarmony', 'Initial page loaded: %{public}s', page)
    })
  }

  private getInitialPage(windowStage: window.WindowStage): string {
    try {
      const mainWindow = windowStage.getMainWindowSync()
      const rect = mainWindow.getWindowProperties().windowRect
      const isCompact = rect.width < DESKTOP_MIN_WIDTH || rect.height > rect.width * PHONE_PORTRAIT_RATIO
      return isCompact ? 'pages/Index' : 'pages/EditorPage'
    } catch (error) {
      hilog.warn(0x0000, 'MarkTextHarmony', 'Window size unavailable: %{public}s', `${error}`)
      return 'pages/Index'
    }
  }
}
