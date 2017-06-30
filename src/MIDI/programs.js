import {MIDI} from "./MIDI"
import {GM} from "../GM"
import createAction from "../createAction"

export const programs = []

programs.load = function ({programID = 0, program, onProgress = MIDI.onProgress}) {
	const isReady = MIDI.jobs.wait({except: "load program"})
	const loadOp = new Promise(function (resolve, reject) {
		isReady.then(function () {
			switch (typeof program) {
				case "string":
					const programURL = program.replace(/%FORMAT/g, MIDI.format)
					return MIDI.fetch({
						URL: programURL,
						onProgress,
						format: "json",
					}).then(function (programData) {
						const program = new Program(programData)
						MIDI.programs[programID] = program
						programs.onLoad.trigger(programID, program, programData)
						resolve({programID, program, programData})
					}).catch(reject)
				case "object":
				default:
					const wrappedProgram = new Program(program)
					console.log("PROGRAM", wrappedProgram)
					MIDI.programs[programID] = wrappedProgram
					programs.onLoad.trigger(programID, wrappedProgram, program)
					resolve({programID, program: wrappedProgram, programData: program})
			}
		})
	})
	MIDI.jobs.track(loadOp, "load program")
	return loadOp
}

programs.onLoad = createAction()

export class Program {
	constructor(pdata) {
		this.metadata = {}
		this.notes = []

		for (const key in pdata) {
			switch (key) {
				case "__METADATA":
					this.metadata = pdata[key]
					break
				default:
					const noteID = GM.note[key].noteID
					const note = pdata[key]
					const noteObj = new Note(noteID, note)
					this.notes[noteID] = noteObj
			}
		}
	}
}

export class Note {
	constructor(noteID, note) {
		if(typeof note === "string") {
			note = {
				noteData: note
			}
		}

		this.noteID = noteID
		const {gainRamp, ...data} = note
		Object.assign(this, data)
		this.note = note
	}

	get gainRamp() {
		return this.note.gainRamp || 0
	}
}