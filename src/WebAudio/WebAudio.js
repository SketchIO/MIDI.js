import dataURI from "../dataURI"
import {MIDI, sounds} from "../MIDI"
import {Base64} from "../Base64"
import {WASound} from "./WASound"
import {AudioContext} from "./AudioContext"
import {BufferStore} from "./BufferStore"
import {Hooray} from "../Hooray"
import {filter} from "../fn"
import {SoundModule} from "../SoundModule"

const WEBAUDIO_UNDERSTANDS_TIMEOUT = 250

/**
 * I am a SoundModule that makes sounds using the WebAudio API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
 */
export class WebAudio extends SoundModule {
	/**
	 * Determine if WebAudio is supported
	 * @returns {boolean} TRUE if the WebAudio API appears to be supported
	 */
	static isSupported() {
		return "AudioContext" in window && window.AudioContext !== null
	}

	/**
	 * Determine if a certain container and format are supported by the WebAudio API
	 * @param {Object} obj
	 * @param {string} obj.sample
	 * @returns {Promise}
	 */
	static understands({sample}) {
		return new Promise(function (resolve, reject) {
			const ctx = AudioContext.get()
			ctx.decodeAudioData(Base64.toBuffer(sample)).then(resolve).catch(reject)

			// Workaround for
			// https://code.google.com/p/chromium/issues/detail?id=424174
			setTimeout(reject, WEBAUDIO_UNDERSTANDS_TIMEOUT)
		})
	}

	/**
	 * Connect the WebAudio SoundModule
	 * @returns {Promise}
	 */
	static connect() {
		if (!WebAudio.isSupported()) throw new Error("SoundModule cannot be connected")
		MIDI.SoundModule = new WebAudio()
		BufferStore.startProcessing()

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
	}

	disconnect() {
		BufferStore.stopProcessing()
	}

	/**
	 * Play a note
	 * @param {number} channelID
	 * @param {NoteID} noteID
	 * @param {MIDIParam} velocity
	 * @param {number} [startTime]
	 */
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
	}

	/**
	 * Stop a note
	 * @param {number} channelID
	 * @param {NoteID} noteID
	 * @param {number} [endTime]
	 */
	noteOff(channelID, noteID, endTime) {
		endTime = endTime || MIDI.currentTime
		const sound = sounds.get(channelID, noteID)
		if (sound)
			sound.scheduleFadeOut(endTime)
	}

	/** @returns {timestamp} */
	currentTime() {
		return WebAudio.context.currentTime
	}
}

/** @type {AudioContext.Instance} */
WebAudio.context = AudioContext.get()