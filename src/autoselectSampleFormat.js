const Debug = require('debug')
const debug = Debug('MIDI.js/src/autoselect/autoselectSampleFormat.js')

const audioTest = require('./audioTest')
import MIDI from './MIDI'

const AUDIO_FORMATS = ['mp3', 'ogg']
export default function autoselectSampleFormat() {
	debug('Autoselecting an sample format from the following choices: %j', AUDIO_FORMATS)
	const autoselectOp = audioTest().then(function (supports) {
		const format = AUDIO_FORMATS.find(function (format) {
			return supports[format]
		})

		if (!format) {
			debug('None of the sample formats can be played. You probably cannot use MIDI.js right now.')
			throw new Error('None of the sample formats can be played. You probably cannot use MIDI.js right now.')
		}

		debug('Using the "%s" sample format.', format)
		MIDI.sampleFormat = format
	})
	MIDI.jobs.track(autoselectOp, 'autoselect a sample format')
	return autoselectOp
}