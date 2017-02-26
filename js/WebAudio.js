const Debug = require('debug')
const debug = Debug('MIDI.js:webaudio')

const MIDI = require('./MIDI')
const GeneralMIDI = require('./GeneralMIDI')
const dataURI = require('./dataURI')

const Sound = require('./Sound')
const WebAudioSound = require('./WebAudioSound')

const ChannelProxy = require('./ChannelProxy')
const BufferDB = require('./webaudio/BufferDB')
const SoundModule = require('./SoundModule')

module.exports = class WebAudio extends SoundModule {
	static createAudioContext() {
		const ctx = new (window.AudioContext || window.webkitAudioContext)()
		try {
			const buffer = ctx.createBuffer(1, 1, 44100);
			const source = ctx.createBufferSource();
			source.detune.value = 1200
			ctx.hasDetune = true
		} catch (e) {
			debug('Detune is not supported on this platform')
		}

		return ctx
	}

	static iOSUnlock() {
		if (ctx.unlocked !== true) {
			ctx.unlocked = true;
			var buffer = ctx.createBuffer(1, 1, 44100);
			var source = ctx.createBufferSource();
			source.buffer = buffer;
			source.connect(ctx.destination);
			source.start(0);
		}
	}

	constructor() {
		super()
		this.context = WebAudio.createAudioContext()
		this.sounds = []
		this.buffers = BufferDB.create()
		this.sounds.selectSoundsRequiringUpdate = function (selector) {
			if (selector instanceof ChannelProxy) {
				return this.filter(function (task) {
					return task.channelID === object.channelID
				})
			}

			return this
		}
	}

	connect(MIDI) {
		MIDI.soundModule = this
		MIDI.currentTime = this.context.currentTime

		this.onPropertyChange = MIDI.onPropertyChange((selector, property, newValue) => {
			debug('Property change detected! Updating tasks...')
			this.sounds.selectSoundsRequiringUpdate(selector).forEach(function (sound) {
				sound.updateProperties()
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
		noteID = GeneralMIDI.getNoteNumber(noteID)
		startTime = startTime || this.context.currentTime

		const programID = MIDI.channels[channelID].programID

		if (!this.buffers.has(programID, noteID)) {
			debug('Cannot play note on channel due to a missing audio buffer: %j', {
				channelID, noteID, velocity, startTime
			})
			return new Sound({channelID, noteID, velocity, startTime})
		}

		debug('Playing note: %j',
			{programID, channelID, noteID, velocity, startTime})

		const audioBuffer = this.buffers.get(programID, noteID)
		const sound = new WebAudioSound({
			context: this.context, audioBuffer,
			channelID, noteID, velocity, startTime
		})

		this.sounds.push(sound)
		return sound
	}

	noteOff(channelID, noteID, endTime) {
		noteID = GeneralMIDI.getNoteNumber(noteID)
		endTime = endTime || this.context.currentTime

		this.sounds.filter(function (sound) {
			return sound.channelID === channelID && sound.noteID === noteID
		}).forEach(function (sound) {
			sound.scheduleFadeOut(endTime)
		})
	}

	processProgram({programID, program, onProgress = MIDI.onProgress}) {
		if (typeof programID === 'undefined') {
			debug('I cannot process a program without a programID: %j', arguments)
			return Promise.reject
		}

		const {__METADATA, ...notes} = program
		const bufferJobs = Object.keys(notes).map((note) => {
			const noteID = GeneralMIDI.getNoteNumber(note)
			if (!noteID) {
				debug('I cannot process a note that does not have a valid note number: %j', {
					noteID,
					note
				})
				// Rejecting would cause the whole building to come crashing down.
				// Instead, might as well just skip this note.
				return Promise.resolve()
			}

			const noteContents = program[note]
			debug('Processing note: %j', {noteID, note, noteContents})

			const storeBuffer = (audioBuffer) => {
				debug('Storing audio buffer: %j', {programID, noteID, audioBuffer})
				this.buffers.set(programID, noteID, audioBuffer)
			}

			// Currently, if the sample is a data URI then we shortcut and
			// just decode the sample. If it's not, I assume that sample is a URL.
			switch (typeof noteContents) {
				case 'object':
					return this.handleNote(noteContents.data).then(storeBuffer)
				case 'string':
				default:
					return this.handleNote(noteContents).then(storeBuffer)
			}
		})

		const processOp = Promise.all(bufferJobs)
		MIDI.jobs.track(processOp, `process program ${programID}.`)
		return processOp
	}

	handleNote(noteContents) {
		if (dataURI.test(noteContents)) {
			return this.context.decodeAudioData(dataURI.toBuffer(noteContents))
		} else {
			return MIDI.doFetch({
				URL: noteContents,
				onProgress,
				responseType: 'arraybuffer'
			}).then(function (event) {
				console.log(arguments)
				debugger
				const response = new ArrayBuffer()
				return this.context.decodeAudioData(response)
			})
		}
	}
}