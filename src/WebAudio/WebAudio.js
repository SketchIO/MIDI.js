import Debug from "debug"
const debug = Debug("MIDI.js:src/soundModule/WebAudio.js")

import dataURI from "../dataURI"
import {MIDI} from "../MIDI"

import Channel from "../Channel"
import base64 from "../base64"
import {Note} from "./Note"

import {Collections} from "../Collections"

import {AudioContext} from "./AudioContext"
import {Buffers} from "./Buffers"

import {filter} from "../fn"

const WEBAUDIO_UNDERSTANDS_TIMEOUT = 250

export const WebAudio = {
	context: AudioContext.get(),
	notes: Collections.noteset(),
	buffers: Buffers,

	isSupported() {
		return "AudioContext" in window && window.AudioContext !== null
	},

	understands({sample}) {
		return new Promise(function (resolve, reject) {
			const ctx = AudioContext.get()
			ctx.decodeAudioData(base64.toBuffer(sample)).then(resolve).catch(reject)

			// Workaround for https://code.google.com/p/chromium/issues/detail?id=424174
			setTimeout(reject, WEBAUDIO_UNDERSTANDS_TIMEOUT)
		});
	},

	connect() {
		if (!WebAudio.isSupported()) throw new Error("SoundModule cannot be connected")
		if (MIDI.SoundModule) MIDI.SoundModule.disconnect()
		MIDI.SoundModule = WebAudio
		Buffers.startProcessing()

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
	},

	noteOn(channelID, noteID, velocity = 127, startTime) {
		startTime = startTime || MIDI.currentTime
		debug("Playing note: %j", {channelID, noteID, velocity, startTime})

		const note = new Note({channelID, noteID, velocity, startTime})
		note.onEnded(() => {
			WebAudio.notes.delete(note)
		})

		WebAudio.notes.add(note)
		return note
	},

	noteOff(channelID, noteID, endTime) {
		endTime = endTime || MIDI.currentTime
		filter(WebAudio.notes, function (note) {
			return note.channelID === channelID && note.noteID === noteID
		}).forEach(function (note) {
			note.scheduleFadeOut(endTime)
		})
	},

	currentTime() {
		return WebAudio.context.currentTime
	},
}