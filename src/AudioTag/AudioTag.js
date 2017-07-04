import {MIDI, sounds} from "../MIDI"
import {ObjectPool} from "./ObjectPool"
import dataURI from "../dataURI"

import {Hooray} from "../Hooray"
import {Task} from "../Task"
import {clamp, scale, forEach} from "../fn"
import {Channel} from "../Channel"
import {ATSound} from "./ATSound"
import {ezDefine} from "../ezDefine"
import {SoundModule} from "../SoundModule"

/**
 * @summary I play sound using &lt;audio&gt; tags
 * @description Use me when the WebAudio API is not available. Otherwise, don't.
 */
export class AudioTag extends SoundModule {
	static isSupported() {
		return window.Audio
	}

	static understands({container, codec, sample}) {
		const MIME = "audio/" + container + "; codecs=\"" + codec + "\""
		const src = "data:" + MIME + ";base64," + sample

		return new Promise((resolve, reject) => {
			const audio = new Audio()
			if (!audio.canPlayType(MIME).replace(/no/i, "")) {
				resolve(false)
				return
			}

			audio.id = "audio"
			audio.controls = false
			audio.setAttribute("autobuffer", true)
			audio.setAttribute("preload", "auto")

			audio.addEventListener("error", function onError(err) {
				if (URL.createObjectURL && !audio.testedBlobURL) {
					// workaround for
					// https://code.google.com/p/chromium/issues/detail?id=544988&q=Cr%3DInternals-Media&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Cr%20Status%20Owner%20Summary%20OS%20Modified
					audio.testedBlobURL = true
					audio.src = URL.createObjectURL(dataURI.toBlob(src))
				} else {
					audio.removeEventListener("error", onError)
					resolve(false)
				}
			})

			audio.addEventListener("canplaythrough", function onCanPlayThrough() {
				audio.removeEventListener("canplaythrough", onCanPlayThrough)
				resolve(true)
			})

			audio.src = src
			audio.load()
		})
	}

	static connect() {
		if (!AudioTag.isSupported()) throw new Error("SoundModule cannot be connected")
		if (MIDI.SoundModule) MIDI.SoundModule.disconnect()
		MIDI.SoundModule = new AudioTag()
	}

	constructor() {
		super()
		this.timeouts = []
		this.tags = new ObjectPool({
			size: 10,
			onCreate() {
				return new Audio()
			}, onRemove(tag) {
				tag.stop()
			},
		})

		this.looper = Task.start(function () {
			sounds.forEach(soundbank => {
				soundbank.forEach(sound => {
					const {note, startTime, tag} = sound
					if (note.loopEnd) {
						const now = tag.currentTime
						if (now >= note.loopEnd) {
							const loopStart = note.loopStart || 0
							tag.currentTime = loopStart
						}
					}
				})
			})
		})
	}

	disconnect() {
		forEach(this.timeouts, clearTimeout)
		this.tags.drain()
		this.looper.stop()
	}

	noteOn(channelID, noteID, velocity, startTime) {
		startTime = startTime || this.currentTime()
		const now = this.currentTime()
		const offset = startTime - now
		if (offset > 0) {
			this.callLater("noteOn", [channelID, noteID, velocity, startTime], offset * 1000)
		} else {
			this.noteOff(channelID, noteID)
			if (!MIDI.note(channelID, noteID)) return
			sounds.set(channelID, noteID, new ATSound({
				tag: this.tags.obtain(),
				channelID,
				noteID,
				velocity,
				startTime: MIDI.currentTime,
			}))
		}
	}

	noteOff(channelID, noteID, endTime) {
		endTime = endTime || this.currentTime()
		const now = this.currentTime()
		const offset = endTime - now

		if (offset > 0) {
			this.callLater("noteOff", [channelID, noteID, endTime], offset * 1000)
		} else {
			stopSound(channelID, noteID)
		}

		function stopSound(channelID, noteID) {
			const sound = sounds.get(channelID, noteID)
			if (sound) sound.stop()
		}
	}

	/**
	 * @inheritdoc
	 * @description NOTE: AudioTag uses the performance API to get a high
	 *   resolution timer
	 */
	currentTime() {
		return performance.now() / 1000
	}

	callLater(method, params, when) {
		this.timeouts.push(setTimeout(() => {
			this[method].apply(this, params)
		}, when))
	}
}