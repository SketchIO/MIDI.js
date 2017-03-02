const Debug = require('debug')
const debug = Debug('MIDI.js:src/soundModule/WebAudio.js')

const dataURI = require('../dataURI')
import MIDI from '../MIDI'
import GM from '../GM'

const Channel = require('../Channel')
const createBufferMap = require('../createBufferMap')
const SoundModule = require('./SoundModule')
const base64 = require('../base64')
const filter = require('../fn/filter')

const WebAudio = module.exports = class WebAudio extends SoundModule {
	constructor() {
		super()
		this.buffers = createBufferMap()

		this.notes = new Set()
		this.notes.selectSoundsRequiringUpdate = function (selector) {
			if (selector instanceof Channel) {
				return filter(this, function (task) {
					return task.channelID === selector.channelID
				})
			}
			return this
		}
	}

	beConnectedTo(upstream) {
		super.beConnectedTo(upstream)

		this.onChange = MIDI.knobs.onChange((selector, property, newValue) => {
			debug('Property change detected! Updating tasks...')
			this.notes.selectSoundsRequiringUpdate(selector).forEach(function (sound) {
				sound.updateProperty(property)
			})
		})

		this.onLoadProgram = MIDI.onLoadProgram(this.processProgram.bind(this))

		const connectOp = new Promise(function (resolve, reject) {
			// Use globals instead and shim.
			if (window.Tuna) {
				debug('Adding TunaJS support...')
				if (!(ctx.tunajs instanceof Tuna)) {
					ctx.tunajs = new Tuna(ctx);
				}
			}

			MIDI.programs.forEach((program, programID) =>
				this.processProgram({program, programID}))

			resolve()
		})

		MIDI.jobs.track(connectOp, 'connect sound module')
		return connectOp
	}

	getCurrentTime() {
		return WebAudio.context.currentTime
	}

	noteOn(channelID, noteID, velocity = 127, startTime) {
		noteID = GM.getNoteNumber(noteID)
		startTime = startTime || MIDI.currentTime
		debug('Playing note: %j', {channelID, noteID, velocity, startTime})

		const note = new Note({
			soundModule: this,
			channel: MIDI.channels[channelID],
			channelID, noteID, velocity, startTime
		})

		note.onEnded(() => {
			this.notes.delete(note)
		})

		this.notes.add(note)
		return note
	}

	noteOff(channelID, noteID, endTime) {
		noteID = GM.getNoteNumber(noteID)
		endTime = endTime || MIDI.currentTime

		filter(this.notes, function (sound) {
			return sound.channelID === channelID && sound.noteID === noteID
		}).forEach(function (sound) {
			sound.scheduleFadeOut(endTime)
		})
	}

	processProgram(programID, program, _, onProgress = MIDI.onProgress) {
		const jobs = []
		for (const [noteID, note] of program.notes.entries()) {
			if (!note) continue
			const {noteData} = note
			debug('Processing note: %o', {noteID, noteData})
			jobs.push(this.processNote(programID, noteID, noteData))
		}

		const processJob = Promise.all(jobs)
		MIDI.jobs.track(processJob, `process program ${programID}.`)
		return processJob
	}

	processNote(programID, noteID, noteData) {
		let job
		if (base64.test(noteData)) {
			job = WebAudio.context.decodeAudioData(base64.toBuffer(noteData))
		} else if (dataURI.test(noteData)) {
			job = WebAudio.context.decodeAudioData(dataURI.toBuffer(noteData))
		} else {
			job = MIDI.fetch({
				URL: noteData,
				onProgress,
				responseType: 'arraybuffer'
			}).then(function (event) {
				const response = new ArrayBuffer()
				return WebAudio.context.decodeAudioData(response)
			})
		}

		return job.then((audioBuffer) =>
			this.buffers.set(programID, noteID, audioBuffer))
	}
}

const createAudioContext = require('../createAudioContext')
WebAudio.context = createAudioContext()
const Note = require('../WebAudioNote')
