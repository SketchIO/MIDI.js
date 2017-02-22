const Debug = require('debug')
const debug = Debug('MIDI.js:dataURI')

function fromBase64ToBuffer(rawContents) {
	const binaryData = atob(rawContents)
	const buffer = new ArrayBuffer(binaryData.length)
	const uintView = new Uint8Array(buffer)
	for (let i = 0; i < binaryData.length; i++) {
		uintView[i] = binaryData.charCodeAt(i)
	}
	return buffer
}

function MIMEType(URI) {
	const [SIGIL, rest] = URI.split(':')
	const [type, format] = rest.split(';')
	return type
}

module.exports = {
	test(URI) {
		return URI.indexOf('data:') === 0
	},

	toBlob(URI) {
		return new Blob([this.toBuffer(URI)], {
			type: MIMEType(URI)
		})
	},

	toBuffer(URI) {
		const [header, rawContents] = URI.split(',')
		const [_, format] = header.split(';')
		switch(format) {
			case 'base64':
				debug('Converting a base64 data URI to an ArrayBuffer')
				return fromBase64ToBuffer(rawContents)
			default:
				debug('The data URI format "%s" is not supported!', format)
				throw new Error('The data URI format "' + format + '" is not supported!')
		}
	}
}