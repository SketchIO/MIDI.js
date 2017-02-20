const Debug = require('debug')
const debug = Debug('MIDI.js:Program')

function Program(program) {
	debug('Ahoy hoy!')
	this.program = program
	this.notes = Object.keys(program)
}

Program.prototype = {
	constructor: Program,

	eachNote(onEachNote) {
		const program = this.program
		this.notes.forEach(function(note) {
			onEachNote(note, program[note])
		})
	}
}

module.exports = Program