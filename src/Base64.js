const BASE64ISH = new RegExp("^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$")

export const Base64 = {
	test: BASE64ISH.test.bind(BASE64ISH),
	toBuffer(string) {
		const binaryData = atob(string)
		const buffer = new ArrayBuffer(binaryData.length)
		const uintView = new Uint8Array(buffer)
		for (let i = 0; i < binaryData.length; i++) {
			uintView[i] = binaryData.charCodeAt(i)
		}
		return buffer
	},
}