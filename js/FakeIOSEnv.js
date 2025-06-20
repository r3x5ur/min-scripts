(() => {
  const sleep = (n) => {
	  Array.from({length:n}).forEach(() => {
		  const t = Date.now()
	      while (Date.now() - t < 1000);
	  })
  }
  globalThis.__wxConfig.system = "iOS 17.1.2";
  globalThis.__wxConfig.platform = "ios";
  const getSystemInfoSync = wx.getSystemInfoSync;
  const getDeviceInfo = wx.getDeviceInfo;
  Object.defineProperty(wx, "getSystemInfoSync", {
    value: function () {
      console.log("！！！！！！！！！！getSystemInfoSync");
      return {
        safeArea: {
          bottom: 898,
          height: 839,
          top: 59,
          width: 430,
          left: 0,
          right: 430,
        },
        fontSizeSetting: 17,
        notificationAuthorized: true,
        locationEnabled: true,
        batteryLevel: 80,
        bluetoothEnabled: true,
        fontSizeScaleFactor: 1,
        version: "8.0.59",
        screenWidth: 430,
        system: "iOS 17.1.2",
        pixelRatio: 3,
        locationAuthorized: true,
        model: "iPhone 14 Pro Max<iPhone15,3>",
        windowHeight: 834,
        phoneCalendarAuthorized: false,
        microphoneEnabled: true,
        wifiEnabled: true,
        bluetoothAuthorized: true,
        locationReducedAccuracy: false,
        memorySize: 5624,
        screenHeight: 932,
        statusBarHeight: 54,
        windowWidth: 430,
        translateLanguage: "zh_CN",
        albumAuthorized: true,
        notificationAlertAuthorized: true,
        benchmarkLevel: -1,
        notificationBadgeAuthorized: true,
        language: "zh_CN",
        screenTop: 98,
        notificationSoundAuthorized: true,
        microphoneAuthorized: true,
        cameraAuthorized: true,
        deviceOrientation: "portrait",
        brand: "iPhone",
        platform: "ios",
        SDKVersion: "3.8.8",
        enableDebug: false,
        devicePixelRatio: 3,
        host: { env: "WeChat", appId: "", version: 402668334 },
        mode: "default",
      };
    },
  });
  Object.defineProperty(wx, "getSystemInfo", {
    value(option) {
      option.success && option.success(wx.getSystemInfoSync());
    },
  });
  Object.defineProperty(wx, "getDeviceInfo", {
    value(option) {
      return {
        memorySize: 5624,
        system: "iOS 17.1.2",
        model: "iPhone 14 Pro Max<iPhone15,3>",
        benchmarkLevel: -1,
        brand: "iPhone",
        platform: "ios",
      };
    },
  });
  Object.defineProperty(wx, "getRendererUserAgent", {
    value() {
      return Promise.resolve(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.59(0x18003b2e) NetType/WIFI Language/zh_CN MiniProgramEnv/iOS"
      );
    },
  });
  Object.defineProperty(wx, "sleep", {value: sleep});
})();
