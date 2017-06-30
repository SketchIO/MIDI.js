import {MIDI} from "../MIDI"
import {WebAudio} from "./WebAudio"
import {buffers} from "./buffers"
import {scale, clamp, forEach} from "../fn"
import {GM} from "../GM"

import {Sound} from "../Sound"

export class WASound extends Sound {
	constructor(args) {
		super(args)

		const programID = this.channel.programID
		const audioBuffer = buffers.get(programID, this.noteID)

		this.volumeKnob = WebAudio.context.createGain()
		this.volumeKnob.connect(WebAudio.context.destination)

		this.buffer = WebAudio.context.createBufferSource()
		this.buffer.buffer = audioBuffer
		this.buffer.connect(this.volumeKnob)

		forEach(["loopStart", "loopEnd"], property => {
			const value = this.note[property]
			if (typeof value !== "undefined") {
				this.buffer[property] = value
				this.buffer.loop = true
			}
		})

		const offset = Math.max(MIDI.currentTime - this.startTime, 0)
		this.buffer.start(this.startTime, offset)

		MIDI.jobs.track(new Promise((resolve, reject) => {
			this.buffer.onended = resolve
		}), "note", GM.note[this.noteID].keys[0])

		for (let property of ["mute", "volume", "detune"]) {
			this.updateProperty(property)
		}
	}

	stop() {
		this.buffer.stop()
	}

	updateProperty(property) {
		const actions = {
			mute() {
				if (MIDI.mute || this.channel.mute)
					this.volumeKnob.gain.value = 0.0
			},

			volume() {
				const volume = (MIDI.volume / 127) * (this.channel.volume / 127) * (this.velocity / 127)
				this.volumeKnob.gain.cancelScheduledValues(MIDI.currentTime)
				this.volumeKnob.gain.linearRampToValueAtTime(volume, MIDI.currentTime + this.note.gainRamp)
			},

			detune() {
				if (WebAudio.context.hasDetune) {
					// -1200 to 1200 - value in cents [100 cents per semitone]
					const clampedDetune = clamp(this.channel.detune, -1200, 1200)
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
		this.volumeKnob.gain.linearRampToValueAtTime(this.volumeKnob.gain.value, MIDI.currentTime)
		this.volumeKnob.gain.linearRampToValueAtTime(0, time + RELEASE)
		this.buffer.stop(time + RELEASE)
	}
}