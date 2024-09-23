// 注入到程序入口处，即可生效， 究极无敌版（通杀所有小游戏）
function df(o, k, v) {Object.defineProperty(o, k, {value: v,writable: true,enumerable: true,configurable: true})}
function noop(){}
const createRewardedVideoAd = wx.createRewardedVideoAd
wx.createRewardedVideoAd = function(option) {
	if (option) delete option.multiton
	return createRewardedVideoAd.apply(this, arguments)
}
const iad = wx.createInterstitialAd()
const rad = wx.createRewardedVideoAd()
df(iad, 'load', noop)
df(rad, 'load', () => rad.__onLoad && rad.__onLoad(), Promise.resolve())
df(rad, 'show', () => rad.__onClose && rad.__onClose({isEnded: true}), Promise.resolve())
df(rad, 'destroy', noop)
df(rad, 'onLoad', fn => rad.__onLoad = fn)
df(rad, 'onClose', fn => rad.__onClose = fn)
