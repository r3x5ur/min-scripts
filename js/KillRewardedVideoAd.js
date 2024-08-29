// 注入到程序入口处，即可生效， 究极无敌版（通杀所有小游戏）
const ad = wx.createRewardedVideoAd()
ad.onLoad = fn => {
  ad.__onLoad = fn
}
ad.onClose = fn => {
  ad.__onClose = fn
}
ad.load = () => {
  ad.__onLoad && ad.__onLoad()
  return Promise.resolve()
}
ad.show = () => {
  ad.__onClose && ad.__onClose({isEnded: true})
  return Promise.resolve()
}
ad.destroy = Boolean
