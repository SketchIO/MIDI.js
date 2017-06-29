import Debug from "debug"
const debug = Debug("MIDI.js:src/WebAudioNote.js")

import {MIDI} from "../MIDI"
import createAction from "../createAction"
import {WebAudio} from "./WebAudio"
import {Buffers} from "./Buffers"
import {scale, clamp} from "../fn"

export class Note {
	constructor({channelID, noteID, velocity, startTime}) {
		this.channelID = channelID
		this.noteID = noteID
		this.velocity = velocity
		this.startTime = startTime
		this.isEnding = false

		this.onEnded = createAction()
		this.activeSounds = new Set()

		this.volumeKnob = WebAudio.context.createGain()
		this.volumeKnob.connect(WebAudio.context.destination)

		for (let property of ["programID", "mute", "volume", "detune"]) {
			this.updateProperty(property)
		}
	}

	cancelImmediately() {
		for (let sound of this.activeSounds.values()) {
			sound.stop()
		}
	}

	updateProperty(property) {
		const channel = MIDI.channels[this.channelID]
		const note = MIDI.note(this.channelID, this.noteID)
		const programID = channel.programID
		const noteID = this.noteID
		const noteInfo = MIDI.programs[programID].notes[noteID]

		const actions = {
			mute() {
				if (MIDI.mute || channel.mute)
					this.volumeKnob.gain.value = 0.0
			},

			volume() {
				const volume = (MIDI.volume / 127) * (channel.volume / 127) * (this.velocity / 127)
				debug("Adjusting volume: %j", {
					"MIDI volume": MIDI.volume,
					"Channel volume": channel.volume,
					"Note velocity": this.velocity,
				})
				this.volumeKnob.gain.cancelScheduledValues(MIDI.currentTime)
				this.volumeKnob.gain.linearRampToValueAtTime(volume, MIDI.currentTime + (noteInfo.gainRamp || 0))
			},

			detune() {
				if (WebAudio.context.hasDetune) {
					// -1200 to 1200 - value in cents [100 cents per semitone]
					const clampedDetune = clamp(channel.detune, -1200, 1200)
					debug("Detuning: %s", clampedDetune)
					for (let sound of this.activeSounds) {
						sound.detune.value = clampedDetune
					}
				}
			},

			programID() {
				debug("Using audio buffer: %j", {programID, noteID})
				const audioBuffer = Buffers.get(programID, noteID)

				this.scheduleFadeOut()

				const sound = WebAudio.context.createBufferSource()
				sound.volumeKnob = WebAudio.context.createGain()
				sound.buffer = audioBuffer

				// TODO Will quickly ramping up the current sound's volume knob help
				// with popping? TODO Add attack, decay, and sustain, loopStart and
				// loopEnd!

				for (const property of ["loopStart", "loopEnd"]) {
					if (property in noteInfo) {
						debug("Setting note property: %s => %s", property, noteInfo[property])
						sound[property] = noteInfo[property]
						sound.loop = true
					}
				}

				if (noteInfo && noteInfo.gainRamp) {
					const volume = (MIDI.volume / 127) * (channel.volume / 127) * (this.velocity / 127)
					debug("Adjusting volume: %j", {
						"MIDI volume": MIDI.volume,
						"Channel volume": channel.volume,
						"Note velocity": this.velocity,
					})
					sound.volumeKnob.gain.cancelScheduledValues(MIDI.currentTime)
					sound.volumeKnob.gain.linearRampToValueAtTime(volume, MIDI.currentTime + (noteInfo.gainRamp || 0))
				}

				sound.connect(sound.volumeKnob)
				sound.volumeKnob.connect(this.volumeKnob)

				// A note may have already started playing when the programID change
				// occurred.
				const offset = Math.max(MIDI.currentTime - this.startTime, 0)
				sound.start(this.startTime, offset)

				MIDI.jobs.track(new Promise((resolve, reject) => {
					sound.onended = () => {
						debug("Sound finished: %o", {sound})
						this.activeSounds.delete(sound)
						this.handleSoundEnd()
						resolve()
					}
				}))

				this.activeSounds.add(sound)
			}
		}

		const action = actions[property]
		if(action) {
			action.call(this)
		}
	}

	scheduleFadeOut(time) {
		debug("scheduleFadeOut called")
		const channel = MIDI.channels[this.channelID]
		const programID = channel.programID
		const noteID = this.noteID
		const noteInfo = MIDI.programs[programID].notes[noteID]
		const RELEASE = noteInfo.gainRamp || 0

		if (!time) {
			time = MIDI.currentTime + RELEASE
		}
		this.endTime = time

		// @Miranet: 'the values of 0.2 and 0.3 could of course be used as
		// a 'release' parameter for ADSR like time settings.'
		// add { 'metadata': { release: 0.3 } } to soundfont files

		for (let sound of this.activeSounds) {
			sound.loop = false
			if (noteInfo && noteInfo.gainRamp) {
				sound.volumeKnob.gain.cancelScheduledValues(MIDI.currentTime)
				sound.volumeKnob.gain.linearRampToValueAtTime(this.volumeKnob.gain.value, time)
				sound.volumeKnob.gain.linearRampToValueAtTime(0, time + RELEASE)
			}
			try {
				sound.stop(time + RELEASE)
			} catch (error) {
				debug(error)
			}
		}
	}

	handleSoundEnd() {
		if (!this.activeSounds.size) {
			debug("There are no more active sounds for this note. Ending.")
			this.onEnded.trigger(this)
		}
	}
}