const BASE64ISH = new RegExp('^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$')

function fromBase64ToBuffer(rawContents) {
	const binaryData = atob(rawContents)
	const buffer = new ArrayBuffer(binaryData.length)
	const uintView = new Uint8Array(buffer)
	for (let i = 0; i < binaryData.length; i++) {
		uintView[i] = binaryData.charCodeAt(i)
	}
	return buffer
}

module.exports = {
	test(string) {
		return BASE64ISH.test(string)
	},

	toBuffer(string) {
		return fromBase64ToBuffer(string)
	}
}