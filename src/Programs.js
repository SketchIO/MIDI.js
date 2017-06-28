import {GM} from "./GM"
import createAction from "./createAction"

export const Programs = []

Programs.load = function ({programID = 0, program, onProgress = MIDI.onProgress}) {
	const isReady = MIDI.jobs.waitForActiveJobs({except: "load program"})
	const loadOp = new Promise(function (resolve, reject) {
		isReady.then(function () {
			switch (typeof program) {
				case "string":
					const programURL = program.replace(/%FORMAT/g, MIDI.format)
					debug("Fetching \"%s\"", programURL)
					return MIDI.fetch({
						URL: programURL,
						onProgress,
						format: "json",
					}).then(function (programData) {
						const program = new Program(programData)
						MIDI.programs[programID] = program
						Programs.onLoad.trigger(programID, program, programData)
						resolve({programID, program, programData})
					}).catch(reject)
				case "object":
				default:
					const wrappedProgram = new Program(program)
					MIDI.programs[programID] = wrappedProgram
					MIDI.onLoadProgram.trigger(programID, wrappedProgram, program)
					resolve({programID, program: wrappedProgram, programData: program})
			}
		})
	})
	MIDI.jobs.track(loadOp, "load program")
	return loadOp
}

Programs.onLoad = createAction()

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
					switch (typeof note) {
						case "string":
							this.notes[noteID] = {
								noteData: note,
							}
							break
						case "object":
							this.notes[noteID] = note
					}
			}
		}
	}
}