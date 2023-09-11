// Inject into entry point
const oldCloud = wx.cloud;
const oriCF = oldCloud.callFunction
oldCloud.callFunction = function (config) {
    const _success = config.success
    config.success = function (res){
      // do anything
      console.log('callFunction===>',res);
      // call origin callback
      _success(res);
    }
    oriCF(config)
}
