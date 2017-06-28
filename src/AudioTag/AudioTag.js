import {MIDI} from "../MIDI"
import {ObjectPool} from "./ObjectPool"
import {Collections} from "../Collections"
import dataURI from "../dataURI"


const FastTimer = {
	timers: [],
	running: false,

	attach() {
		FastTimer.running = true
		FastTimer.tick()
		// addEventListener("message", FastTimer.tick)
		// FastTimer.tick()
	},

	detach() {
		// removeEventListener("message", FastTimer.tick)
		FastTimer.running = false
	},

	tick() {
		for (let i = 0; i < FastTimer.timers.length; i++) {
			FastTimer.timers[i]()
		}
		if(FastTimer.running) {
			setTimeout(FastTimer.tick, 0)
		}
		// postMessage("", location.origin)
	},

	start(fn) {
		FastTimer.timers.push(fn)
		return {
			stop() {
				FastTimer.stop(fn)
			},
		}
	},

	stop(fn) {
		const i = FastTimer.timers.indexOf(fn)
		if (i > -1)
			FastTimer.splice(i, 1)
	},
}

window.FastTimer = FastTimer

const PropertyChanger = {
	start() {
	},

	stop() {
	},

	update(object, property) {
	},
}

//		/** volume **/
//		_apply.volume = function (source) {
//			var channel = source._channel;
//			if (MIDI.mute || channel.mute) {
//				source.volume = 0.0;
//			} else {
//				var volume = MIDI.volume * channel.volume * source._volume;
//				source.volume = Math.min(1.0, Math.max(-1.0, volume * 2.0));
//			}
//		};

class Sound {
	constructor({channelID, noteID, velocity, startTime}) {
		this.channelID = channelID
		this.noteID = noteID
		this.velocity = velocity
		this.startTime = startTime
	}
}

class SoundWA extends Sound {
	constructor({buffer, ...args}) {
		super(args)
		this.buffer = buffer
	}
}

class SoundAT extends Sound {
	constructor({tag, ...args}) {
		super(args)
		this.tag = tag
	}
}

const sounds = new Collections.mapCK()

FastTimer.start(function () {
	sounds.forEach(sound => {
		const {channelID, noteID, startTime, tag} = sound
		const channel = MIDI.channels[channelID]
		const programID = channel.programID
		const program = MIDI.programs[programID]
		const note = program.notes[noteID]
		// const note = MIDI.note(channelID, noteID)
		// const note = MIDI.channels[channelID].program.notes[noteID]

		if (note.loopEnd) {
			const now = tag.currentTime
			if (now >= note.loopEnd) {
				const loopStart = note.loopStart || 0
				tag.currentTime = loopStart
			}
		}

	})
})

FastTimer.attach()

function startChannel(channelID, noteID, velocity) {
	const note = MIDI.note(channelID, noteID)
	if (note) {
		try {
			const tag = AudioTag.tags.obtain()
			PropertyChanger.update(tag, "volume")
			tag.src = note.noteData
			tag.play()
			sounds.set(channelID, noteID, new SoundAT({
				channelID, noteID, velocity, startTime: MIDI.currentTime,
				tag,
			}))
		} catch (error) {
			console.error(error)
		}
	}
}

function stopChannel(channelID, noteID) {
	const channel = MIDI.channels[channelID]
	const programID = channel.programID

	const sound = sounds.get(programID, noteID)
	if (sound) {
		sound.tag.pause()
		AudioTag.tags.release(sound.tag)

	}
}

export const AudioTag = {
	timeouts: [],
	sounds,
	tags: new ObjectPool(100, () => new Audio()),

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
					// workaround for https://code.google.com/p/chromium/issues/detail?id=544988&q=Cr%3DInternals-Media&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Cr%20Status%20Owner%20Summary%20OS%20Modified
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
	},

	disconnect() {
		AudioTags.timeouts.forEach(function (timeout) {
			clearTimeout(timeout)
		})

		AudioTags.tags.forEach(function (tag) {
			tag.stop()
		})

		AudioTags.forceReset()
	},

	noteOn(channelID, noteID, velocity, startTime = 0) {
		if (startTime) {
			AudioTag.timeouts.push(setTimeout(function () {
				startChannel(channelID, noteID, velocity)
			}, startTime * 1000))
		} else {
			startChannel(channelID, noteID, velocity)
		}
	},

	noteOff(channelID, noteID, endTime = 0) {
		if (endTime) {
			AudioTag.timeouts.push(setTimeout(function () {
				stopChannel(channelID, noteID)
			}, endTime * 1000))
		} else {
			stopChannel(channelID, noteID)
		}
	},

	currentTime() {
		return performance.now() / 1000
	},
}