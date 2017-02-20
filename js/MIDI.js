const Debug = require('debug')
const debug = Debug('MIDI.js')

const Program = require('./Program')
const KitchenSink = require('./SoundModules/KitchenSink')
const WebAudioSink = require('./SoundModules/WebAudioSink')

let SM

const MIDI = {
	use(sink) {
		if(this.SM) {
			SM.disconnect()
			delete SM
		}

		SM = sink
		SM.connect()
	},

	/**
	 * Load a MIDI program
	 * @param {string|number} programID
	 * @param {Object} program
	 */
	loadProgram(programID, program) {
		SM.loadProgram(programID, program)
	},

	getChannel(channelID) {
		return SM.getChannel(channelID)
	},

	changeProgram(channelID, programID) {
		SM.changeProgram(channelID, programID)
	},

	noteOn(channelID, noteID, velocity, delay) {
		SM.noteOn(channelID, noteID, velocity, delay)
	},

	noteOff(channelID, noteID, delay) {
		SM.noteOff(channelID, noteID, delay)
	}
}

module.exports = MIDI
module.exports.SINK = SINK
module.exports.KitchenSink = KitchenSink
module.exports.WebAudioSink = WebAudioSink
module.exports.programs = programs