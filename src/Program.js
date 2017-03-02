const NoteArray = require('./NoteArray')
const GM = require('./GM')

module.exports = class Program {
	static wrap(rawProgram) {
		return new Program(rawProgram)
	}

	constructor(rawProgram) {
		this.metadata = {}
		this.notes = new NoteArray()

		for (const noteName in rawProgram) {
			switch (noteName) {
				case '__METADATA':
					this.metadata = rawProgram[noteName]
					break
				default:
					const noteID = GM.getNoteNumber(noteName)
					const note = rawProgram[noteName]
					switch (typeof note) {
						case 'string':
							this.notes[noteID] = {
								noteData: note
							}
							break
						case 'object':
							this.notes[noteID] = note
					}
			}
		}
	}
}