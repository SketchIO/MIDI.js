const MIDI = require('./lib/MIDI')

MIDI.autoselect = {
	sampleFormat: require('./lib/autoselectSampleFormat'),
	soundModule: require('./lib/soundModule/autoselectSoundModule')
}

MIDI.controllers = {
	Pad: require('./lib/controllers/Pad')
}

module.exports = MIDI