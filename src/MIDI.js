import Debug from 'debug'
const debug = Debug('MIDI.js:src/MIDI.js')

import GM from './GM'
import createAction from './createAction'

import JobCollection from './JobCollection'
import KnobCollection from './KnobCollection'
import Program from './Program'
import Channel from './Channel'

// import { version } from '../package.json'
const version = '0.4.3'

const NOOP = Function;
const MIDI = {
	VERSION: version,

	jobs: new JobCollection(),
	knobs: new KnobCollection(),

	sampleFormat: null,
	soundModule: null,
	connect(soundModule) {
		// TODO Disconnect old sound modules here
		this.soundModule = soundModule
		this.soundModule.beConnectedTo(this)
	},

	programs: [],
	channels: [],
	setChannels(channelCount) {
		for (let channelID = this.channels.length; channelID < channelCount; channelID += 1) {
			this.channels.push(new Channel(channelID))
		}
		this.channels.splice(channelCount)
	},

	onProgress: NOOP,
	fetch({URL, onProgress, ...extraArguments}) {
		const fetchOp = new Promise(function (resolve, reject) {
			galactic.request(Object.assign({
				format: 'text',
				url: URL,
				onprogress: onProgress
			}, extraArguments), function (XHR, response) {
				resolve(response)
			}, reject)
		})
		MIDI.jobs.track(fetchOp, `fetch ${URL}`, 'fetch')
		return fetchOp
	},

	startDebugging() {
		if (localStorage) {
			const SIGIL = 'MIDI.js:*'
			if (localStorage.debug != SIGIL) {
				localStorage.debug = SIGIL
				window.location = window.location
			}
		}
	},

	loadProgram({programID = 0, program, onProgress = MIDI.onProgress}) {
		const isReady = MIDI.jobs.waitForActiveJobs({except: 'load program'})
		const loadOp = new Promise(function (resolve, reject) {
			isReady.then(function () {
				switch (typeof program) {
					case 'string':
						const programURL = program.replace(/%FORMAT/g, MIDI.format)
						debug('Fetching "%s"', programURL)
						return MIDI.fetch({
							URL: programURL,
							onProgress,
							format: 'json'
						}).then(function (programData) {
							const program = Program.wrap(programData)
							MIDI.programs[programID] = program
							MIDI.onLoadProgram.trigger(programID, program, programData)
							resolve({programID, program, programData})
						}).catch(reject)
					case 'object':
					default:
						const wrappedProgram = Program.wrap(program)
						MIDI.programs[programID] = wrappedProgram
						MIDI.onLoadProgram.trigger(programID, wrappedProgram, program)
						resolve({programID, program: wrappedProgram, programData: program})
				}
			})
		})
		MIDI.jobs.track(loadOp, 'load program')
		return loadOp
	},
	onLoadProgram: createAction(),

	noteOn(channelID, noteID, velocity = 127, startTime) {
		return this.soundModule.noteOn(channelID, noteID, velocity, startTime)
	},

	noteOff(channelID, noteID, endTime) {
		return this.soundModule.noteOff(channelID, noteID, endTime)
	}
}

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

MIDI.knobs.describe([{
		property: 'volume',
		comparator: isNumber,
		defaultValue: 100
	},
	{
		property: 'mute',
		comparator(b) {
			return !!b
		},
		defaultValue: false
	},
	{
		property: 'detune',
		comparator(n) {
			return isNumber(n) && n >= -1200 && n <= 1200
		},
		defaultValue: 0.0
	}
])

MIDI.knobs.add(MIDI, 'MIDI', 'mute')
MIDI.knobs.add(MIDI, 'MIDI', 'volume')

Channel.onConstruct(function (channel) {
	MIDI.knobs.add(channel, `Channel ${channel.channelID}`, 'mute')
	MIDI.knobs.add(channel, `Channel ${channel.channelID}`, 'volume')
	MIDI.knobs.add(channel, `Channel ${channel.channelID}`, 'detune')
	MIDI.knobs.add(channel, `Channel ${channel.channelID}`, {
		property: 'programID',
		comparator: isNumber,
		defaultValue: 0
	})
})

Object.defineProperty(MIDI, 'currentTime', {
	get() {
		return MIDI.soundModule.getCurrentTime()
	}
})

export {
	MIDI as default
}