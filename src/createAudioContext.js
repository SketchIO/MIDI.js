const Debug = require('debug')
const debug = Debug('MIDI.js:src/webaudio/AudioContext.js')

module.exports = function() {
	debug('Creating new audio context')
	const context = new (window.AudioContext || window.webkitAudioContext)()

	try {
		const buffer = context.createBuffer(1, 1, 44100);
		const source = context.createBufferSource();
		source.detune.value = 1200
		context.hasDetune = true
	} catch (e) {
		debug('Detune is not supported on this platform')
	}

	context.iOSUnlock = function () {
		if (context.unlocked !== true) {
			context.unlocked = true;
			var buffer = context.createBuffer(1, 1, 44100);
			var source = context.createBufferSource();
			source.buffer = buffer;
			source.connect(context.destination);
			source.start(0);
		}
	}

	return context
}