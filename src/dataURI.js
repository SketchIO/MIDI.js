import Debug from 'debug'
const debug = Debug('MIDI.js:src/dataURI.js')

import base64 from './base64'

function MIMEType(URI) {
	const [SIGIL, rest] = URI.split(':')
	const [type, format] = rest.split(';')
	return type
}

export default {
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
		switch (format) {
			case 'base64':
				debug('Converting a base64 data URI to an ArrayBuffer')
				return base64.toBuffer(rawContents)
			default:
				debug('The data URI format "%s" is not supported!', format)
				throw new Error('The data URI format "' + format + '" is not supported!')
		}
	}
}