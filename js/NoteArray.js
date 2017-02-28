const GM = require('./GM')

module.exports = class NoteArray {
	constructor() {
		return new Proxy([], {
			get(target, property) {
				switch (property) {
					case 'entries':
					// TODO Return only notes that exist
					default:
						const noteID = GM.getNoteNumber(property)
						return Reflect.get(target, noteID ? noteID : property)
				}
			},

			set(target, note, value) {
				const noteID = GM.getNoteNumber(note)
				return Reflect.set(target, noteID ? noteID : note, value)
			}
		})
	}
}