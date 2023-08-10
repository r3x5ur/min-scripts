// 注入到程序入口处，即可生效
const oriCreateRewardedVideoAd = wx.createRewardedVideoAd
Object.defineProperty(wx, 'createRewardedVideoAd', {
  value: function (config) {
    const ad = oriCreateRewardedVideoAd(config)
    const _oriOnClose = ad.onClose
      ad.onClose = function (callback) {
        ad._callback = callback
        _oriOnClose(callback)
      }
      ad.show = function () {
        typeof ad._callback === 'function' && ad._callback({isEnded: true})
        return Promise.resolve()
      }
      return ad
  },
})
