import Debug from "debug"
const debug = Debug("MIDI.js:src/MIDI.js")

import createAction from "./createAction"
import JobCollection from "./JobCollection"
import KnobCollection from "./KnobCollection"

import {GM} from "./GM"
import {Channel} from "./Channel"
import {Programs} from "./Programs"
import {isNumber} from "./fn"

// import { version } from '../package.json'
const version = "0.4.3"


export const MIDI = {
	VERSION: version,
	format: null,

	jobs: new JobCollection(),
	knobs: new KnobCollection(),
	programs: Programs,


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

	autoconnect() {
		const supportJob = MIDI.support()
		MIDI.jobs.track(supportJob)
		return supportJob.then(bundle => {
			return bundle.best().SoundModule.connect()
		})
	},

	onProgress() {
	},
	fetch({URL, onProgress, ...extraArguments}) {
		const fetchOp = new Promise(function (resolve, reject) {
			galactic.request(Object.assign({
				format: "text",
				url: URL,
				onprogress: onProgress,
			}, extraArguments), function (XHR, response) {
				resolve(response)
			}, reject)
		})
		MIDI.jobs.track(fetchOp, `fetch ${URL}`, "fetch")
		return fetchOp
	},

	startDebugging() {
		if (localStorage) {
			const SIGIL = "MIDI.js:*"
			if (localStorage.debug != SIGIL) {
				localStorage.debug = SIGIL
				window.location = window.location
			}
		}
	},
}


MIDI.knobs.describe([{
	property: "volume",
	comparator: isNumber,
	defaultValue: 100,
},
	{
		property: "mute",
		comparator(b) {
			return !!b
		},
		defaultValue: false,
	},
	{
		property: "detune",
		comparator(n) {
			return isNumber(n) && n >= -1200 && n <= 1200
		},
		defaultValue: 0.0,
	},
])

MIDI.knobs.add(MIDI, "MIDI", "mute")
MIDI.knobs.add(MIDI, "MIDI", "volume")

const channels = []
Object.defineProperty(MIDI, "channels", {
	get: () => channels,
	set(channelCount) {
		for (let channelID = channels.length; channelID < channelCount; channelID++) {
			channels.push(new Channel(channelID))
		}
		channels.splice(channelCount)
	},
})