(function (){
	const {__require,__wxConfig:{accountInfo}} = window[1]
	const itemList = document.querySelector('.item_list.main')
	const newNode = document.createElement('div')
	newNode.classList.add('menu_item')
	newNode.innerHTML = `<div class="icon_wrapper"><img draggable="false" src="${accountInfo.icon}" alt="" class="icon"></div>
		<div class="word">开启辅助</div>`
	itemList.appendChild(newNode)
	newNode.addEventListener('click', () => {
		const settings = __require('../../../home/Game').Game.settings
	   settings.debugRobotAutoTouchBlock = !settings.debugRobotAutoTouchBlock
	   settings.debugAutoTouchBlock = !settings.debugAutoTouchBlock
	   newNode.querySelector('.word').innerText = settings.debugAutoTouchBlock ? '关闭辅助': '开启辅助'
	})
})();
