import dataURI from "../dataURI"
import {MIDI, sounds} from "../MIDI"
import {Base64} from "../Base64"
import {WASound} from "./WASound"
import {AudioContext} from "./AudioContext"
import {buffers} from "./buffers"
import {Hooray} from "../Hooray"
import {filter} from "../fn"

const WEBAUDIO_UNDERSTANDS_TIMEOUT = 250

export const WebAudio = {
	name: "WebAudio",
	context: AudioContext.get(),
	buffers: buffers,

	isSupported() {
		return "AudioContext" in window && window.AudioContext !== null
	},

	understands({sample}) {
		return new Promise(function (resolve, reject) {
			const ctx = AudioContext.get()
			ctx.decodeAudioData(Base64.toBuffer(sample)).then(resolve).catch(reject)

			// Workaround for
			// https://code.google.com/p/chromium/issues/detail?id=424174
			setTimeout(reject, WEBAUDIO_UNDERSTANDS_TIMEOUT)
		})
	},

	connect() {
		if (!WebAudio.isSupported()) throw new Error("SoundModule cannot be connected")
		if (MIDI.SoundModule) MIDI.SoundModule.disconnect()
		MIDI.SoundModule = WebAudio
		buffers.startProcessing()

		const connectJob = new Promise(function (resolve, reject) {
			// TODO Use globals instead and shim.
			if (window.Tuna) {
				if (!(ctx.tunajs instanceof window.Tuna)) {
					ctx.tunajs = new window.Tuna(ctx)
				}
			}

			resolve()
		})

		MIDI.jobs.track(connectJob, "connect WebAudio")
		return connectJob
	},

	disconnect() {
		buffers.stopProcessing()
	},

	noteOn(channelID, noteID, velocity = 127, startTime) {
		startTime = startTime || MIDI.currentTime

		const sound = sounds.get(channelID, noteID)
		if (sound) sound.stop()

		if(!MIDI.note(channelID, noteID)) return
		sounds.set(channelID, noteID, new WASound({
			channelID,
			noteID,
			velocity,
			startTime,
		}))
	},

	noteOff(channelID, noteID, endTime) {
		endTime = endTime || MIDI.currentTime
		const sound = sounds.get(channelID, noteID)
		if (sound)
			sound.scheduleFadeOut(endTime)
	},

	currentTime() {
		return WebAudio.context.currentTime
	},
}