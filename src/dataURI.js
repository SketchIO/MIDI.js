const Debug = require('debug')
const debug = Debug('MIDI.js:dataURI')
const base64 = require('./base64')

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
				return base64.toBuffer(rawContents)
			default:
				debug('The data URI format "%s" is not supported!', format)
				throw new Error('The data URI format "' + format + '" is not supported!')
		}
	}
}