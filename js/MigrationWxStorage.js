// 快速迁移 Storage

// 一键导出
btoa(encodeURIComponent(JSON.stringify(Object.fromEntries(wx.getStorageInfoSync().keys.map(key => [key, wx.getStorageSync(key)])))))

// 一键导入
const exported = 'xxx'
Object.entries(JSON.parse(decodeURIComponent(atob(exported)))).forEach(([k,v]) => wx.setStorageSync(k, v))
