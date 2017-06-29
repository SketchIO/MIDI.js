import {MIDI} from "../MIDI"
import {ObjectPool} from "./ObjectPool"
import {Collections} from "../Collections"
import dataURI from "../dataURI"

import {Hooray} from "../Hooray"
import {FastTimer} from "./FastTimer"
import {clamp, scale} from "../fn"
import {Channel} from "../Channel"

let action
export const PropertyChanger = {
	startUpdating() {
		action = MIDI.knobs.onChange((selector, property, newValue) => {
			if (selector instanceof Channel) {
				const bank = AudioTag.sounds.get(selector.channelID)
				if (bank)
					bank.forEach(sound => sound.updateProperty(property))
			} else {
				AudioTag.sounds.forEach(bank =>
					bank.forEach(sound =>
						sound.updateProperty(property)))
			}
		})
	},

	stopUpdating() {
		if (action)
			action.cancel()
	},
}

class Sound {
	constructor({channelID, noteID, velocity, startTime}) {
		this.channelID = channelID
		this.noteID = noteID
		this.velocity = velocity
		this.startTime = startTime
	}

	get channel() {
		return MIDI.channels[this.channelID]
	}

	get note() {
		return MIDI.note(this.channelID, this.noteID)
	}
}

class SoundAT extends Sound {
	constructor(args) {
		super(args)
		this.tag = AudioTag.tags.obtain()
		this.tag.src = this.note.noteData
		this.tag.play()
	}

	updateProperty(property) {
		switch (property) {
			case "mute":
				if (MIDI.mute || this.channel.mute)
					this.tag.volume = 0
				break
			case "volume":
				const volume =
					(MIDI.volume / 127) *
					(this.channel.volume / 127) *
					(this.velocity / 127)
				this.tag.volume = volume
		}
	}

	stop() {
		this.tag.pause()
		AudioTag.tags.release(this.tag)
	}
}

const sounds = Hooray.create()

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

	const note = MIDI.note(channelID, noteID)
	if (note) {
		sounds.set(channelID, noteID, new SoundAT({
			channelID,
			noteID,
			velocity,
			startTime: MIDI.currentTime,
		}))
	}
}

function stopSound(channelID, noteID) {
	const sound = sounds.get(channelID, noteID)
	if (sound) sound.stop()
}

export const AudioTag = {
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
		PropertyChanger.startUpdating()
	},

	disconnect() {
		AudioTags.timeouts.forEach(function (timeout) {
			clearTimeout(timeout)
		})

		AudioTags.tags.forEach(function (tag) {
			tag.stop()
		})

		AudioTags.forceReset()
		FastTimer.detach()
		PropertyChanger.stopUpdating()
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