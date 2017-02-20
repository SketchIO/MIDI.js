const Debug = require('debug')

function Channel(CONTROLLER, channelID) {
	this.debug = Debug(`MIDI.js:Channel ${channelID}`)
	this.debug(`Channel ${channelID}, reporting for duty!`)

	this.CONTROLLER = CONTROLLER
	this.channelID = channelID
	this.programID = 0
}

Channel.prototype = {
	constructor: Channel,

	changeProgram(programID) {
		this.debug('Changing to program %s', programID)
		this.programID
	},

	noteOn(noteID, velocity, delay) {
		this.CONTROLLER.noteOn(this.channelID, noteID, velocity, delay)
	},

	noteOff(noteID, delay) {
		this.CONTROLLER.noteOff(this.channelID, noteID, delay)
	}
}

module.exports = Channel