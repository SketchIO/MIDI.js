const debug = require("debug")("MIDI.js:src/webaudio/AudioContext.js")

/**
 * @external {AudioContext.Instance} https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
 */

/**
 * I provide an audio context on platforms that support the WebAudio API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
 * @type {Object}
 * @property {Function} get
 */
export const AudioContext = {

	/**
	 * @returns {AudioContext.Instance}
	 */
	get() {
		const ContextConstructor = window.AudioContext || window.webkitAudioContext
		if (!ContextConstructor) return

		debug("Creating new audio context")
		const context = new ContextConstructor()

		try {
			const buffer = context.createBuffer(1, 1, 44100)
			const source = context.createBufferSource()
			source.detune.value = 1200
			context.hasDetune = true
		} catch (e) {
			debug("Detune is not supported on this platform")
		}

		context.iOSUnlock = function () {
			function doUnlock() {
				if (context.unlocked !== true) {
					var buffer = context.createBuffer(1, 1, 44100)
					var source = context.createBufferSource()
					source.buffer = buffer
					source.connect(context.destination)
					source.start(0)
					source.addEventListener("ended", () => {
						context.unlocked = true
						document.removeEventListener("touchend", doUnlock, true)
					})
				}
			}

			document.addEventListener("touchend", doUnlock, true)
		}

		// Older browser fix
		if (context.decodeAudioData.length > 1) {
			debug("Wrapping callback-style decodeAudioData")
			const originalDecode = context.decodeAudioData
			context.decodeAudioData = function (buffer) {
				return new Promise((resolve, reject) => {
					originalDecode.call(context, buffer, resolve, reject)
				})
			}
		}

		return context
	},
}