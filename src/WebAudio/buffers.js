import dataURI from "../dataURI"
import {Base64} from "../Base64"
import {WebAudio} from "./WebAudio"
import {MIDI} from "../MIDI"
import {Hooray} from "../Hooray"
import {ezDefine} from "../ezDefine"

let eventResponder
export const buffers = Hooray.create({
	name: "WebAudio buffers"
})


ezDefine(buffers, {
	startProcessing() {
		MIDI.programs.map((program, programID) => buffers.processProgram(programID, program))
		eventResponder = MIDI.programs.onLoad(buffers.processProgram)
	},

	stopProcessing() {
		eventResponder.cancel()
	},

	processProgram(programID, program, _, onProgress = MIDI.onProgress) {
		const jobs = []
		for (const [noteID, note] of program.notes.entries()) {
			if (!note) continue
			const {noteData} = note
			jobs.push(buffers.processNote(programID, noteID, noteData))
		}

		const processJob = Promise.all(jobs)
		MIDI.jobs.track(processJob, `process program ${programID}.`)
		return processJob
	},

	processNote(programID, noteID, noteData) {
		let job
		if (Base64.test(noteData)) {
			job = WebAudio.context.decodeAudioData(Base64.toBuffer(noteData))
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
				.then(audioBuffer => buffers.set(programID, noteID, audioBuffer))
				.catch(error => console.log(error)))
	},
})