import dataURI from "../dataURI"
import base64 from "../base64"
import {WebAudio} from "./WebAudio"
import {MIDI} from "../MIDI"
import {Collections} from "../Collections"
const debug = require("debug")("MIDI.js:src/WebAudio/Process.js")

let eventResponder
export const Buffers = Collections.mapCK()
Object.assign(Buffers, {
	startProcessing() {
		MIDI.programs.map((program, programID) => Buffers.processProgram(programID, program))
		eventResponder = MIDI.programs.onLoad(Buffers.processProgram)
	},

	stopProcessing() {
		eventResponder.cancel()
	},

	processProgram(programID, program, _, onProgress = MIDI.onProgress) {
		const jobs = []
		for (const [noteID, note] of program.notes.entries()) {
			if (!note) continue
			const {noteData} = note
			debug("Processing note: %o", {noteID, noteData})
			jobs.push(Buffers.note(programID, noteID, noteData))
		}

		const processJob = Promise.all(jobs)
		MIDI.jobs.track(processJob, `process program ${programID}.`)
		return processJob
	},

	note(programID, noteID, noteData) {
		let job
		if (base64.test(noteData)) {
			job = WebAudio.context.decodeAudioData(base64.toBuffer(noteData))
		} else if (dataURI.test(noteData)) {
			const audioBuffer = dataURI.toBuffer(noteData)
			job = WebAudio.context.decodeAudioData(audioBuffer)
		} else {
			job = MIDI.fetch({
				URL: noteData,
				onProgress,
				responseType: "arraybuffer",
			}).then(function (event) {
				const response = new ArrayBuffer()
				return WebAudio.context.decodeAudioData(response)
			})
		}

		return (
			job
				.then(audioBuffer => Buffers.set(programID, noteID, audioBuffer))
				.catch(error => console.log(error)))
	},
})