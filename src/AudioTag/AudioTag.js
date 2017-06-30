import {MIDI, sounds} from "../MIDI"
import {ObjectPool} from "./ObjectPool"
import dataURI from "../dataURI"

import {Hooray} from "../Hooray"
import {FastTimer} from "./FastTimer"
import {clamp, scale} from "../fn"
import {Channel} from "../Channel"
import {ATSound} from "./ATSound"

FastTimer.start(function () {
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

function startSound(channelID, noteID, velocity) {
	stopSound(channelID, noteID)
	if (!MIDI.note(channelID, noteID)) return
	console.log("START SOUND",channelID, noteID, velocity, MIDI.currentTime)
	sounds.set(channelID, noteID, new ATSound({
		channelID,
		noteID,
		velocity,
		startTime: MIDI.currentTime,
	}))
}

function stopSound(channelID, noteID) {
	const sound = sounds.get(channelID, noteID)
	if (sound) sound.stop()
}

export const AudioTag = {
	name: "AudioTag",
	timeouts: [],
	sounds,
	tags: new ObjectPool(10, () => new Audio()),

	isSupported() {
		return window.Audio
	},

	understands({container, codec, sample}) {
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
	},

	connect() {
		if (!AudioTag.isSupported()) throw new Error("SoundModule cannot be connected")
		if (MIDI.SoundModule) MIDI.SoundModule.disconnect()
		MIDI.SoundModule = AudioTag
		FastTimer.attach()
	},

	disconnect() {
		AudioTags.timeouts.forEach(function (timeout) {
			clearTimeout(timeout)
		})

		AudioTags.tags.forEach(function (tag) {
			tag.stop()
		})

		AudioTags.drain()
		FastTimer.detach()
	},

	noteOn(channelID, noteID, velocity, startTime = 0) {
		if (startTime) {
			AudioTag.timeouts.push(setTimeout(function () {
				startSound(channelID, noteID, velocity)
			}, startTime * 1000))
		} else {
			startSound(channelID, noteID, velocity)
		}
	},

	noteOff(channelID, noteID, endTime = 0) {
		if (endTime) {
			AudioTag.timeouts.push(setTimeout(function () {
				stopSound(channelID, noteID)
			}, endTime * 1000))
		} else {
			stopSound(channelID, noteID)
		}
	},

	currentTime() {
		return performance.now() / 1000
	},
}