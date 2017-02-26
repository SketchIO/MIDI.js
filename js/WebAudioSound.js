const Debug = require('debug')
const debug = Debug('MIDI.js:scheduled-sound')

const MIDI = require('./MIDI')
const Sound = require('./Sound')
const actionStack = require('./actionStack')

function scaleRange(value, a1, a2, b1, b2) {
	return (value - a1) * ((b2 - b1) / (a2 - a1)) + b1
}

module.exports = class WebAudioSound extends Sound {
	constructor({context, audioBuffer, ...soundArgs}) {
		super(soundArgs)

		this.context = context
		this.onEnded = actionStack()

		this.volumeKnob = context.createGain()

		this.source = context.createBufferSource()
		this.source.buffer = audioBuffer
		this.source.connect(this.volumeKnob)
		this.source.start(this.startTime)
		this.source.onended = () => {
			debug('onEnded')
			this.onEnded.trigger(this)
		}

		this.updateProperties()
	}

	cancelImmediately() {
		this.source.stop()
	}

	updateProperties() {
		const channel = MIDI.channels[this.channelID]

		if (MIDI.mute || channel.mute) {
			debug('Muting: %o', {sound: this})
			this.volumeKnob.gain.value = 0.0
		} else {
			const volume = (MIDI.volume / 127) * (channel.volume / 127) * (this.velocity / 127)
			const scaledVolume = scaleRange(volume, 0, 1, 0, 2)
			debug('Adjusting volume: %s', scaledVolume)
			this.volumeKnob.gain.value = scaledVolume
		}

		if (this.isEnding) {
			this.scheduleFadeOut(this.endTime)
		}

		if (this.context.hasDetune) {
			// -1200 to 1200 - value in cents [100 cents per semitone]
			// Default value is 0
			const detune = MIDI.detune + channel.detune
			this.source.detune.value = detune
		}

		this.volumeKnob.connect(this.context.destination)
	}

	scheduleFadeOut(time) {
		const RELEASE = 0.5
		if (!time) {
			time = this.context.currentTime + RELEASE
		}

		this.isEnding = true
		this.endTime = time

		// @Miranet: 'the values of 0.2 and 0.3 could of course be used as
		// a 'release' parameter for ADSR like time settings.'
		// add { 'metadata': { release: 0.3 } } to soundfont files
		this.isEnding = true
		this.volumeKnob.gain.cancelScheduledValues(this.context.currentTime)
		this.volumeKnob.gain.linearRampToValueAtTime(this.volumeKnob.gain.value, time)
		this.volumeKnob.gain.linearRampToValueAtTime(0.0, time + RELEASE)
		this.source.stop(time + 0.5)
	}
}