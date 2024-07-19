// 注入到 page-frame 处
setTimeout(() => {
  for (let i = 0; i < 100; ++i) {
    let f = window.top.frames[i];
    if (!f) break;
    console.dir(f);
    if (!f.top) f.top = window.top;
  }
}, 1000);
