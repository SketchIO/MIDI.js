const Debug = require('debug')
const debug = Debug('MIDI.js:Channel')

const MIDI = require('./MIDI')
const actionStack = require('./actionStack')

function ChannelProxy(channelID) {
	this.channelID = channelID

	ChannelProxy.onConstruct.trigger(this)
	debug('Channel %s, ready for action!', channelID)
}

ChannelProxy.onConstruct = actionStack()
ChannelProxy.prototype = {
	constructor: ChannelProxy,

	noteOn(noteID, velocity, delay) {
		return MIDI.noteOn(this.channelID, noteID, velocity, delay)
	},

	noteOff(noteID, delay) {
		return MIDI.noteOff(this.channelID, noteID, delay)
	},

	cancelNotes() {
		return MIDI.cancelNotes(this.channelID)
	},

	getProperty(property) {
		return MIDI.getChannelProperty(this.channelID, property)
	},

	setProperty(property, newValue) {
		return MIDI.setChannelProperty(this.channelID, property, newValue)
	}
}

module.exports = ChannelProxy