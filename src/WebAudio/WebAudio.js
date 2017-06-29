import Debug from "debug"
const debug = Debug("MIDI.js:src/soundModule/WebAudio.js")

import dataURI from "../dataURI"
import {MIDI} from "../MIDI"

import base64 from "../base64"
import {SoundWA} from "./SoundWA"

import {Collections} from "../Collections"

import {AudioContext} from "./AudioContext"
import {Buffers} from "./Buffers"
import {PropertyChanger} from "./PropertyChanger"
import {Hooray} from "../Hooray"

import {filter} from "../fn"

const WEBAUDIO_UNDERSTANDS_TIMEOUT = 250

export const WebAudio = {
	context: AudioContext.get(),
	sounds: Hooray.create(),
	buffers: Buffers,

	isSupported() {
		return "AudioContext" in window && window.AudioContext !== null
	},

	understands({sample}) {
		return new Promise(function (resolve, reject) {
			const ctx = AudioContext.get()
			ctx.decodeAudioData(base64.toBuffer(sample)).then(resolve).catch(reject)

			// Workaround for
			// https://code.google.com/p/chromium/issues/detail?id=424174
			setTimeout(reject, WEBAUDIO_UNDERSTANDS_TIMEOUT)
		})
	},

	connect() {
		if (!WebAudio.isSupported()) throw new Error("SoundModule cannot be connected")
		if (MIDI.SoundModule) MIDI.SoundModule.disconnect()
		MIDI.SoundModule = WebAudio
		Buffers.startProcessing()
		PropertyChanger.startUpdating()

		const connectJob = new Promise(function (resolve, reject) {
			// TODO Use globals instead and shim.
			if (window.Tuna) {
				debug("Adding TunaJS support...")
				if (!(ctx.tunajs instanceof Tuna)) {
					ctx.tunajs = new Tuna(ctx)
				}
			}

			resolve()
		})

		MIDI.jobs.track(connectJob, "connect WebAudio")
		return connectJob
	},

	disconnect() {
		Buffers.stopProcessing()
		PropertyChanger.stopUpdating()
	},

	noteOn(channelID, noteID, velocity = 127, startTime) {
		startTime = startTime || MIDI.currentTime
		debug("Playing note: %j", {channelID, noteID, velocity, startTime})

		const sound = WebAudio.sounds.get(channelID, noteID)
		if (sound) sound.stop()

		WebAudio.sounds.set(channelID, noteID, new SoundWA({
			channelID,
			noteID,
			velocity,
			startTime,
		}))
	},

	noteOff(channelID, noteID, endTime) {
		endTime = endTime || MIDI.currentTime
		const sound = WebAudio.sounds.get(channelID, noteID)
		if (sound)
			sound.scheduleFadeOut(endTime)
	},

	currentTime() {
		return WebAudio.context.currentTime
	},
}

window.WebAudio = WebAudio