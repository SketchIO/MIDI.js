import createAction from "./createAction"
import JobCollection from "./JobCollection"
import {knobs} from "./knobs"

import {GM} from "./GM"
import {Channel} from "./Channel"
import {Programs} from "./Programs"
import {isNumber} from "./fn"

import {support} from "./support"

import {AudioTag} from "./AudioTag"
import {WebAudio} from "./WebAudio"
import {WebMIDI} from "./WebMIDI"

import {Pad} from "./Pad"

// import {version} from "../package.json"
const version = "0.0.44"

let SoundModule
export const MIDI = {
	VERSION: version,
	format: null,

	jobs: new JobCollection(),
	knobs,
	programs: Programs,

	Pad,

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
		const supportJob = support()
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

	get SoundModule() {
		// TODO Print a tip if a SoundModule isn't connected?
		// if (!SoundModule)
		// 	console.info("Hey, a SoundModule isn't connected! Try MIDI.autoconnect() or MIDI.WebAudio.connect()")
		return SoundModule
	},

	set SoundModule(sm) {
		if (SoundModule)
			SoundModule.disconnect()
		SoundModule = sm
	},
}

MIDI.knobs.add(MIDI, "MIDI", "mute")
MIDI.knobs.add(MIDI, "MIDI", "volume")

const channels = []
Object.defineProperty(MIDI, "channels", {
	get: () => channels,
	set(channelCount) {
		for (let channelID = channels.length; channelID < channelCount;
channelID++) { channels.push(new Channel(channelID)) }
channels.splice(channelCount) }, })