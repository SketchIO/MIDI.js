const Debug = require('debug')
const debug = Debug('MIDI.js/src/autoselect/autoselectSoundModule.js')

const MIDI = require('../MIDI')
const audioTest = require('../audioTest')

const SOUND_MODULES = ['webaudio']
module.exports = function autoselectSoundModule() {
	debug('Autoselecting a sound module from the following choices: %j', SOUND_MODULES)
	const autoselectOp = audioTest().then(function (supports) {
		//const format = SOUND.find(function (format) {
		//	return supports[format]
		//})
		//
		//if (!format) {
		//	debug('None of the sample formats can be played. You probably cannot use MIDI.js right now.')
		//	throw new Error('None of the sample formats can be played. You probably cannot use MIDI.js right now.')
		//}
		//
		//debug('Using the "%s" sample format.', format)
		//MIDI.format = format
		console.log("Alrighty then")
	})
	MIDI.jobs.track(autoselectOp, 'autoselect a sample format')
	return autoselectOp
}