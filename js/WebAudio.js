const Debug = require('debug')
const debug = Debug('MIDI.js:src/webaudio/WebAudio.js')

const MIDI = require('./MIDI')
const GM = require('./GM')
const dataURI = require('./dataURI')

const DummyNote = require('./Sound')
const Note = require('./WebAudioNote')

const ChannelProxy = require('./Channel')
const BufferDB = require('./webaudio/BufferDB')
const SoundModule = require('./soundModules/SoundModule')
const base64 = require('./base64')
const AudioContext = require('./AudioContext')
const filter = require('./filter')

module.exports = class WebAudio extends SoundModule {
	constructor() {
		super()
		this.buffers = BufferDB.create()

		this.notes = new Set()
		this.notes.selectSoundsRequiringUpdate = function (selector) {
			if (selector instanceof ChannelProxy) {
				return filter(this, function (task) {
					return task.channelID === selector.channelID
				})
			}
			return this
		}
	}

	beConnectedTo(upstream) {
		super.beConnectedTo(upstream)

		Object.defineProperty(MIDI, 'currentTime', {
			get() {
				return AudioContext.currentTime
			}
		})

		this.onPropertyChange = MIDI.onPropertyChange((selector, property, newValue) => {
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

	noteOn(channelID, noteID, velocity = 127, startTime) {
		noteID = GM.getNoteNumber(noteID)
		startTime = startTime || MIDI.currentTime
		debug('Playing note: %j', {channelID, noteID, velocity, startTime})

		const note = new Note({
			soundModule: this,
			channel: this.upstream.channels[channelID],
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
		for(const [noteID, note] of program.notes.entries()) {
			if(!note) continue
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
		if(base64.test(noteData)) {
			job = AudioContext.decodeAudioData(base64.toBuffer(noteData))
		} else if (dataURI.test(noteData)) {
			job = AudioContext.decodeAudioData(dataURI.toBuffer(noteData))
		} else {
			job = MIDI.doFetch({
				URL: noteData,
				onProgress,
				responseType: 'arraybuffer'
			}).then(function (event) {
				console.log(arguments)
				debugger
				const response = new ArrayBuffer()
				return AudioContext.decodeAudioData(response)
			})
		}

		return job.then((audioBuffer) =>
			this.buffers.set(programID, noteID, audioBuffer))
	}
}