const Debug = require('debug')
const debug = Debug('MIDI.js:sound')

module.exports = class Sound {
	constructor({channelID, noteID, velocity, startTime}) {
		this.channelID = channelID
		this.noteID = noteID
		this.velocity = velocity
		this.startTime = startTime
	}

	cancelImmediately() {
		debug('Not implemented!')
	}
}