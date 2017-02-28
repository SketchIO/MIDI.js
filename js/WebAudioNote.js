const Debug = require('debug')
const debug = Debug('MIDI.js:js/WebAudioNote.js')

const MIDI = require('./MIDI')
const Sound = require('./Sound')
const actionStack = require('./actionStack')
const AudioContext = require('./AudioContext')

function scale(value, a1, a2, b1, b2) {
	return (value - a1) * ((b2 - b1) / (a2 - a1)) + b1
}

function clamp(value, a, b) {
	[a, b] = a < b ? [a, b] : [b, a]
	return Math.min(b, Math.max(a, value))
}

module.exports = class WebAudioNote extends Sound {
	constructor({soundModule, ...soundArgs}) {
		super(soundArgs)
		this.soundModule = soundModule
		this.onEnded = actionStack()
		this.activeSounds = new Set()

		this.volumeKnob = AudioContext.createGain()
		this.volumeKnob.connect(AudioContext.destination)

		for (let property of ['programID', 'mute', 'volume', 'detune']) {
			this.updateProperty(property)
		}
	}

	cancelImmediately() {
		for (let sound of this.activeSounds()) {
			sound.stop()
		}
	}

	updateProperty(property) {
		const channel = MIDI.channels[this.channelID]
		const programID = channel.programID
		const noteID = this.noteID
		const noteInfo = MIDI.programs[programID].notes[noteID]


		switch (property) {
			case 'mute':
				if (MIDI.mute || channel.mute)
					this.volumeKnob.gain.value = 0.0
				break

			case 'volume':
				const volume = (MIDI.volume / 127) * (channel.volume / 127) * (this.velocity / 127)
				debug('Adjusting volume: %j', {
					'MIDI volume': MIDI.volume,
					'Channel volume': channel.volume,
					'Note velocity': this.velocity
				})
				this.volumeKnob.gain.cancelScheduledValues(MIDI.currentTime)
				this.volumeKnob.gain.linearRampToValueAtTime(volume, MIDI.currentTime + (noteInfo.gainRamp || 0))
				break

			case 'detune':
				if (AudioContext.hasDetune) {
					// -1200 to 1200 - value in cents [100 cents per semitone]
					const detune = MIDI.detune + channel.detune
					const clampedDetune = clamp(detune, -1200, 1200)
					debug('Detuning: %s', clampedDetune)
					for (let sound of this.activeSounds) {
						sound.detune.value = clampedDetune
					}
				}
				break

			case 'programID':
				debug('Using audio buffer: %j', {programID, noteID})
				const audioBuffer = this.soundModule.buffers.get(programID, noteID)

				this.scheduleFadeOut()

				const sound = AudioContext.createBufferSource()
				sound.volumeKnob = AudioContext.createGain()
				sound.buffer = audioBuffer

				// TODO Will quickly ramping up the current sound's volume knob help
				// with popping? TODO Add attack, decay, and sustain, loopStart and
				// loopEnd!

				for (const property of ['loopStart', 'loopEnd']) {
					if (property in noteInfo) {
						debug('Setting note property: %s => %s', property, noteInfo[property])
						sound[property] = noteInfo[property]
						sound.loop = true
					}
				}

				sound.connect(sound.volumeKnob)
				sound.volumeKnob.connect(this.volumeKnob)

				// A note may have already started playing when the programID change
				// occurred.
				const offset = Math.max(MIDI.currentTime - this.startTime, 0)
				sound.start(this.startTime, offset)

				MIDI.jobs.track(new Promise((resolve, reject) => {
					sound.onended = () => {
						debug('Sound finished: %o', {sound})
						this.activeSounds.delete(sound)
						this.handleSoundEnd()
						resolve()
					}
				}))

				this.activeSounds.add(sound)
				break

			default:
				debug('Unhandled property update: %s', property)
		}
	}

	scheduleFadeOut(time) {
		debug('scheduleFadeOut called')
		const RELEASE = 0.5
		if (!time) {
			time = MIDI.currentTime + RELEASE
		}
		this.endTime = time

		// @Miranet: 'the values of 0.2 and 0.3 could of course be used as
		// a 'release' parameter for ADSR like time settings.'
		// add { 'metadata': { release: 0.3 } } to soundfont files

		for (let sound of this.activeSounds) {
			sound.volumeKnob.gain.cancelScheduledValues(MIDI.currentTime)
			sound.volumeKnob.gain.linearRampToValueAtTime(this.volumeKnob.gain.value, time)
			sound.volumeKnob.gain.linearRampToValueAtTime(0.0, time + RELEASE)
			sound.stop(time + 0.7)
		}
	}

	handleSoundEnd() {
		if (!this.activeSounds.size) {
			debug('There are no more active sounds for this note. Ending.')
			this.onEnded.trigger(this)
		}
	}
}