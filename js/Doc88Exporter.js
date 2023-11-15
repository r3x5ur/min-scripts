/******控制台执行，一键导出当前文档*******/
$(function(){
	function exportRaw (data, name) {
      const save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
      save_link.href = URL.createObjectURL(new Blob([data]));
      save_link.download = name;
      save_link.click();
    }	
	const Viewer = Core.api;
	const totalPage = Viewer._Wm;
	// 展开全部
	Viewer._Bw(0);
	// 加载全部
	for (let i = 0; i< totalPage; ++i)
		Viewer._eW(i + 1, 0);
	document.documentElement.style.scrollBehavior ="smooth";
	const splitHeight = document.body.scrollHeight / totalPage;
	let index = 1;
	// 等待加载完成
	const timer = setInterval(() => {
		if (index < totalPage) 
			window.scrollTo(0, index++ * splitHeight);
		const contents = Viewer._p7;
		if (contents.length < totalPage)
			return;
		exportRaw(contents.join('\n'), Viewer._Ff_shortname + '.txt');
		clearInterval(timer);
	}, 200);
});

/******chrome书签版本*******/
javascript:$(function(){function exportRaw(data,name){const save_link=document.createElementNS("a");save_link.href=URL.createObjectURL(new Blob([data]));save_link.download=name;save_link.click()}const Viewer=Core.api;const totalPage=Viewer._Wm;Viewer._Bw(0);for(let i=0;i<totalPage;++i)Viewer._eW(i+1,0);document.documentElement.style.scrollBehavior="smooth";const splitHeight=document.body.scrollHeight/totalPage;let index=1;const timer=setInterval(()=>{if(index<totalPage)window.scrollTo(0,index++*splitHeight);const contents=Viewer._p7;if(contents.length<totalPage)return;exportRaw(contents.join('\n'),Viewer._Ff_shortname+'.txt');clearInterval(timer)},200)});
