import createAction from '../createAction'
import {Channel} from '../Channel'
import {isNumber, forEach} from '../fn'

import {JobCollection} from './JobCollection'
import {knobs} from './knobs'
import {programs} from './programs'
import {sounds} from './sounds'
import {support} from './support'
import {AudioTag} from '../AudioTag/index'
import {WebAudio} from '../WebAudio/index'
import {WebMIDI} from '../WebMIDI/index'
import {GM} from '../GM'
import {Pad} from '../Pad'
import {startTask, Task} from '../startTask'

// import {version} from "../package.json"
const version = '0.5.0'

let SoundModule

/**
 * I make sounds
 * @namespace MIDI
 */
export const MIDI = {
	VERSION: version,
	format: null,

	jobs: new JobCollection(),
	knobs,
	programs,
	sounds,

	support,
	WebAudio,
	AudioTag,
	Pad,
	GM,

	/**
	 * Get note data
	 * @param {Number} channelID
	 * @param {Number|String} noteID
	 */
	note(channelID, noteID) {
		noteID = GM.note[noteID].noteID
		return MIDI.channels[channelID].program.notes[noteID]
	},

	noteOn(channelID, noteID, velocity = 127, startTime) {
		noteID = GM.note[noteID].noteID
		return MIDI.SoundModule.noteOn(channelID, noteID, velocity, startTime)
	},

	noteOff(channelID, noteID, endTime) {
		noteID = GM.note[noteID].noteID
		return MIDI.SoundModule.noteOff(channelID, noteID, endTime)
	},

	get currentTime() {
		return MIDI.SoundModule.currentTime()
	},

	async autoconnect() {
		const supportJob = support()
		MIDI.jobs.track(supportJob)
		const bundle = await supportJob
		console.log(bundle)
		return bundle.best().SoundModule.connect()
	},

	onProgress() {
	},
	fetch({URL, onProgress, ...extraArguments}) {
		// TODO Dynamic import, or fetch?
		const fetchOp = import(URL)
		MIDI.jobs.track(fetchOp, `fetch ${URL}`, 'fetch')
		return fetchOp
	},

	get SoundModule() {
		if (!SoundModule)
			console.info('Hey, a SoundModule isn\'t connected! Try MIDI.autoconnect() or MIDI.WebAudio.connect()')
		return SoundModule
	},

	set SoundModule(sm) {
		if (SoundModule)
			SoundModule.disconnect()
		SoundModule = sm
	},

	/**
	 * Wait until the active SoundModule passes some time threshold
	 * @param {timestamp} timestamp
	 * @param {Function} fn
	 */
	after(timestamp, fn) {
		const stopTask = startTask(() => {
			if (MIDI.currentTime >= timestamp) {
				fn()
				stopTask()
			}
		})
	}
}

const channels = []
Object.defineProperty(MIDI, 'channels', {
	get: () => channels,
	set(channelCount) {
		for (let channelID = channels.length; channelID < channelCount; channelID++) {
			channels.push(new Channel(channelID))
		}
		channels.splice(channelCount)
	}
})


knobs.add({
	property: 'mute',
	comparator(b) {
		return !!b
	},
	defaultValue: false,
	addMaster: true
})

knobs.add({
	property: 'volume',
	comparator: isNumber,
	defaultValue: 127,
	addMaster: true
})

knobs.add({
	property: 'detune',
	comparator(n) {
		return isNumber && n >= -1200 && n <= 1200
	},
	defaultValue: 0.0
})

knobs.add({
	property: 'programID',
	comparator: isNumber,
	defaultValue: 0
})
