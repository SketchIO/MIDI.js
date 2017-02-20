const Debug = require('debug')
const debug = Debug('MIDI.js:b64')

module.exports = {
	toBuffer(base64) {
		debug('Converting base64 string to an ArrayBuffer: %s', base64)
		const binary = atob(base64)
		const buffer = new ArrayBuffer(binary.length)
		const uintView = new Uint8Array(buffer)
		for(var i = 0; i < binary.length; i += 1) {
			uintView[i] = binary.charCodeAt(i)
		}

		return buffer
	}
}