// 注入位置：page-frame
setTimeout(() => {
  const topWindow = window.top;
  const document = topWindow.document;
  topWindow.loadJS = (url) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    document.head.appendChild(script);
  };
  for (let i = 0; i < topWindow.length; ++i) {
    topWindow[i].console = topWindow.console;
    topWindow[i].top = topWindow;
  }
  topWindow.loadJS('http://127.0.0.1:60010/inject.js');
  document.querySelector('.gamevsonsole_container')?.remove();
}, 1000);
