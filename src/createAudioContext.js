import Debug from 'debug'
const debug = Debug('MIDI.js:src/webaudio/AudioContext.js')

export default function() {
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

	// Older browser fix
	if(context.decodeAudioData.length > 1) {
		debug('Wrapping callback-style decodeAudioData')
		const originalDecode = context.decodeAudioData
		context.decodeAudioData = function(buffer) {
			return new Promise((resolve, reject) => {
				originalDecode.call(context, buffer, resolve, reject)
			})
		}
	}

	return context
}