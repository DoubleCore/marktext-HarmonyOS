import AbilityConstant from '@ohos.app.ability.AbilityConstant'
import hilog from '@ohos.hilog'
import UIAbility from '@ohos.app.ability.UIAbility'
import Want from '@ohos.app.ability.Want'
import window from '@ohos.window'

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(0x0000, 'MarkTextHarmony', 'Ability created: %{public}s', want.abilityName ?? 'EntryAbility')
    void launchParam
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(0x0000, 'MarkTextHarmony', 'Load content failed: %{public}s', JSON.stringify(err))
        return
      }

      hilog.info(0x0000, 'MarkTextHarmony', 'Index page loaded')
    })
  }
}
