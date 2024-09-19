wasm = result.instance.exports;
memories = [wasm.memory]
viewDWORD = (addr) =>{
	const arr = new Uint32Array(memories[0].buffer.slice(addr, addr + 16));
	return arr;
};
viewChar = (addr, size = 16) =>{
	const arr = new Uint8Array(memories[0].buffer.slice(addr, addr + size));
	return String.fromCharCode.apply(null, arr);
};
viewHEX = (addr, size = 16) =>{
	const arr = new Uint8Array(memories[0].buffer.slice(addr, addr + size));
	return (Array.from(arr, x =>x.toString(16).padStart(2, '0')).join(' '));
};
viewHexCode = (addr, size = 16) =>{
	const arr = new Uint8Array(memories[0].buffer.slice(addr, addr + size));
	return (Array.from(arr, x =>'0x' + x.toString(16).padStart(2, '0')).join(', '));
};
dumpMemory = (addr, size = 16) =>{
	const arr = new Uint8Array(memories[0].buffer.slice(addr, addr + size));
	return arr;
};
viewString = (addr, size = 16) =>{
	const arr = new Uint8Array(memories[0].buffer.slice(addr, addr + size));
	let max = size;
	for (let i = 0; i < size; i++) {
		if (arr[i] === 0) {
			max = i;
			break;
		}
	}
	return String.fromCharCode.apply(null, arr.slice(0, max));
};
search = function(stirng) {
	const m = new Uint8Array(memories[0].buffer);
	const k = Array.from(stirng, x =>x.charCodeAt());

	const match = (j) =>{
		return k.every((b, i) =>m[i + j] === b);
	};
	const max = Math.min(10_000_000, m.byteLength || m.length);
	for (let i = 0; i < max; i++) {
		if (match(i)) {
			console.info(i);
		}
	}
	console.info('done');
}

function readStdString(addr) {
	if (addr.value) addr = addr.value
	const lpStr = addr + 0xc
	const size = new Uint32Array(memories[0].buffer.slice(addr + 8, lpStr))[0]
	const utf8Arr = new Uint16Array(memories[0].buffer.slice(lpStr, lpStr + size * 2))
	return Array.from(utf8Arr).map(c=>String.fromCodePoint(c)).join('')
}
function writeStdString(addr, str) {
    if (addr.value) addr = addr.value;
	const lpStr = addr + 0xc
    const utf16Arr = Array.from(str).map(c => c.codePointAt(0));
	const size = utf16Arr.length
	new Uint32Array(memories[0].buffer)[(addr + 8) / 4] = size
	const utf8Arr = new Uint16Array(memories[0].buffer)
	utf16Arr.forEach((c,i) => utf8Arr[lpStr / 2 + i] = c)
}

