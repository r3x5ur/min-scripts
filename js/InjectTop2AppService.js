setTimeout(() => {
  window.top.loadJS = url => {
    const document = window.top.document
    const script = document.createElement('script')
    script.src = url
    document.head.appendChild(script)
  }
  for (let i = 0; i < 100; ++i) {
    let f = window.top.frames[i];
    if (!f) break;
    console.dir(f);
    if (!f.top) f.top = window.top;
  }
  window.top.loadJS('http://127.0.0.1:60010/inject.js')
}, 1000);
