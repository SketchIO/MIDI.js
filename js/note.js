const A0 = 0x15 // first note
const C8 = 0x6C // last note

const number2key = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const toNote = {} // C8  == 108
const toName = {} // 108 ==  C8

for (let n = A0; n <= C8; n++) {
	var octave = (n - 12) / 12 >> 0
	var name = number2key[n % 12] + octave
	toNote[name] = n
	toName[n] = name
}

module.exports = {
	toNoteName(value) {
		if (value in toNote) {
			return value
		} else if (value in toName) {
			return toName[value]
		}
	},
	
	toNoteID(value) {
		if (value in toName) {
			return value
		} else if (value in toNote) {
			return toNote[value]
		}
	}
}