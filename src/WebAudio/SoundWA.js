import Debug from "debug"
const debug = Debug("MIDI.js:src/WebAudioNote.js")

import {MIDI} from "../MIDI"
import createAction from "../createAction"
import {WebAudio} from "./WebAudio"
import {Buffers} from "./Buffers"
import {scale, clamp, forEach} from "../fn"

import {Sound} from "../Sound"

export class SoundWA extends Sound {
	constructor(args) {
		super(args)

		this.volumeKnob = WebAudio.context.createGain()
		this.volumeKnob.connect(WebAudio.context.destination)

		const programID = this.channel.programID
		const audioBuffer = Buffers.get(programID, this.noteID)

		this.buffer = WebAudio.context.createBufferSource()
		this.buffer.buffer = audioBuffer
		this.buffer.connect(this.volumeKnob)

		forEach(["loopStart", "loopEnd"], property => {
			const value = this.note[property]
			if (value) {
				this.buffer[property] = value
				this.buffer.loop = true
			}
		})

		const offset = Math.max(MIDI.currentTime - this.startTime, 0)
		this.buffer.start(this.startTime, offset)

		MIDI.jobs.track(new Promise((resolve, reject) => {
			this.buffer.onended = resolve
		}))

		for (let property of ["mute", "volume", "detune"]) {
			this.updateProperty(property)
		}
	}

	stop() {
		this.buffer.stop()
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
					this.buffer.detune.value = clampedDetune
				}
			},
		}

		const action = actions[property]
		if (action) {
			action.call(this)
		}
	}

	scheduleFadeOut(time) {
		const RELEASE = this.note.gainRamp
		if (!time) time = MIDI.currentTime
		this.endTime = time

		this.buffer.loop = false
		this.volumeKnob.gain.cancelScheduledValues(MIDI.currentTime)
		this.volumeKnob.gain.linearRampToValueAtTime(this.volumeKnob.gain.value, time)
		this.volumeKnob.gain.linearRampToValueAtTime(0, time + RELEASE)
		this.buffer.stop(time + RELEASE)
	}
}