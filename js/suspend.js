
this.appendButton = function () {
  if (!this.appendButtonInner) return
  this.appendButtonInner(...arguments)
}
this.appendRange = function () {
  if (!this.appendRangeInner) return
  this.appendRangeInner(...arguments)
}
this.suspend = function (window, document, title) {
  // 将字符串转换为DOM元素的函数
  function stringToDOM(htmlString) {
    const template = document.createElement('template')
    template.innerHTML = htmlString.trim() // 去除字符串两端的空白
    return template.content.firstChild // 返回第一个子元素
  }

  const styleSheetHTML = `
<style>
  :root {
    --primary-color: rgb(7, 183, 182);
  }

  .suspend-wrapper {
    position: fixed;
    top: 30vh;
    left: 0;
    z-index: 2147483640;
    cursor: pointer;
    user-select: none;
    font-size: 16px;
  }

  .suspend-wrapper .suspend-btn {
    border-radius: 50%;
    width: 48px;
    height: 48px;
    border: none;
    background: url("https://shop.appletsec.xyz/prepage/images/logo.png") no-repeat center #eee;
    background-size: 100%;
    box-shadow: 0 0 10px var(--primary-color);
  }

  .container-dialog {
    border: none;
    padding: 0;
    box-shadow: 0 0 5px var(--primary-color);
    border-radius: 4px;
  }

  .dialog-header {
    height: 2rem;
    background-color: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dialog-header span {
    width: 2rem;
    height: 2rem;
    line-height: 2rem;
    text-align: center;
    user-select: none;
    font-size: 1.5rem;
    color: #fff;
  }

  .dialog-header span:hover {
    background-color: red;
  }

  .dialog-body {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    grid-gap: 10px;
  }

  .dialog-body button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    background-color: var(--primary-color);
    color: #fff;
  }
</style>
  `

  const suspendHTNL = `<div><div class="suspend-wrapper"><button class="suspend-btn"></button></div>
  <dialog class="container-dialog">
    <div class="dialog-header">
      <div style="margin-left: 10px;color: #fff;">
        ${title || '小U注入'}
      </div>
      <span role="button">&times;</span></div>
      <div class="dialog-body"></div>
  </dialog></div>`

  function initEvent() {
    const suspendWrapper = document.querySelector('.suspend-wrapper')
    const suspendBtn = document.querySelector('.suspend-btn')
    const containerDialog = document.querySelector('.container-dialog')
    const dialogHeader = containerDialog.querySelector('.dialog-header')
    const closeDialogBtn = containerDialog.querySelector('.dialog-header span')
    const innerWidth = window.innerWidth
    const innerHeight = window.innerHeight

    const suspendBtnOnClick = () => {
      containerDialog.style.transform = null
      containerDialog.showModal()
    }

    suspendBtn.onmousedown = e => {
      suspendWrapper.style.transition = null
      let disX = e.clientX - suspendWrapper.offsetLeft
      let disY = e.clientY - suspendWrapper.offsetTop
      document.onmousemove = e => {
        if (suspendBtn.onclick) {
          suspendBtn.onclick = null
        }
        let left = e.clientX - disX
        let top = e.clientY - disY
        suspendWrapper.style.left = left + 'px'
        suspendWrapper.style.top = Math.min(innerHeight - 48, Math.max(0, top)) + 'px'
      }
      document.onmouseup = () => {
        document.onmousemove = null
        document.onmouseup = null
        setTimeout(() => {
          suspendBtn.onclick = suspendBtnOnClick
          suspendWrapper.style.transition = 'all 0.5s'
          const left = +suspendWrapper.style.left.slice(0, -2)
          if (isNaN(left)) return
          if (innerWidth / 2 <= left) {
            suspendWrapper.style.left = innerWidth - 48 + 'px'
          } else {
            suspendWrapper.style.left = '0'
          }
        }, 100)
      }
    }
    suspendBtn.onclick = suspendBtnOnClick

    closeDialogBtn.onclick = () => {
      containerDialog.close()
    }

    dialogHeader.onmousedown = e => {
      if (e.target.role === 'button') return
      let disX = e.clientX - containerDialog.offsetLeft
      let disY = e.clientY - containerDialog.offsetTop
      const tf = containerDialog.style.transform
      if (tf) {
        const [x, y] = tf
          .slice(10, -1)
          .split(',')
          .map(v => +v.slice(0, -2))
        disX -= x
        disY -= y
      }
      document.onmousemove = e => {
        let left = e.clientX - containerDialog.offsetLeft - disX
        let top = e.clientY - containerDialog.offsetTop - disY
        containerDialog.style.transform = `translate(${left + 'px'}, ${top + 'px'})`
      }
      document.onmouseup = () => {
        document.onmousemove = null
        document.onmouseup = null
      }
    }
  }

  function main() {
    document.head.appendChild(stringToDOM(styleSheetHTML))
    document.body.appendChild(stringToDOM(suspendHTNL))
    setTimeout(() => {
      initEvent()
      const btnWrapper = document.querySelector('.dialog-body')
      window.appendButton = this.appendButtonInner = function (text, onclick) {
        const onclickName = 'suspend' + Math.random().toString(32).slice(2)
        window[onclickName] = onclick
        btnWrapper.appendChild(stringToDOM(`<button onclick="${onclickName}(this)">${text}<button>`))
      }
      window.appendRange = this.appendRangeInner = function (text, onchange, title, step = 1) {
        const onclickName = 'suspend' + Math.random().toString(32).slice(2)
        window[onclickName] = _this => {
          _this.nextElementSibling.innerText = _this.value + '%'
          onchange(_this)
        }
        btnWrapper.appendChild(
          stringToDOM(`<div title="${title || ''}" style="line-height:38px">
              ${text}&nbsp;
              <input value=0 style=width:100px type=range step=${step} onchange="${onclickName}(this)"/>
              <span>0%</span>
          </div>`)
        )
      }
      initButtons()
    })
  }

  main()

  function initButtons() {
	  globalThis.appendButton('开启无敌模式', (_this) => {
		  globalThis.GodMode = !globalThis.GodMode
		  _this.innerText = globalThis.GodMode ? '关闭无敌模式': '开启无敌模式'
	  })
	  globalThis.appendRange('经验倍率', (_this) => {
		  globalThis.ExpRatio =  Math.max(1, Number(_this.value) / 5)
	  }, '每增加5%，提高一倍经验', 5)
  }
}
