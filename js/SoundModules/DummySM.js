const Debug = require('debug')
const debug = Debug('MIDI.js:KitchenSink')

function KitchenSink() {
	debug('Ready for action!')
}

KitchenSink.prototype = {
	constructor: KitchenSink,

	processProgram(programID, program) {
		debug('processProgram: %o', {
			programID,
			program
		})
	},

	noteOn(channelID, noteID, velocity, delay) {
		debug('noteOn: %o', {
			channelID,
			noteID,
			velocity,
			delay
		})
	},

	noteOff(channelID, noteID, delay) {
		debug('noteOff: %o', {
			channelID,
			noteID,
			delay
		})
	}
}

module.exports = KitchenSink