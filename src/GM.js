const Debug = require('debug')
const debug = Debug('MIDI.js:GeneralMIDI')

const programDB = {
	byID: {},
	byName: {}
}

function toName(name) {
	return name.replace(/[^a-z0-9_ ]/gi, '').replace(/[ ]/g, '_').toLowerCase()
}

//(function buildProgramDatabase(categories) {
//	for (var category in categories) {
//		var programs = categories[category];
//		for (var i = 0, length = programs.length; i < length; i++) {
//			var program = programs[i];
//			if (program) {
//				const [idString, ...labelParts] = program.split(' ')
//				const id = parseInt(idString, 10)
//				const label = labelParts.join(' ')
//
//				var name = toName(label);
//				var categoryId = toName(category);
//
//				var res = {
//					id: --id,
//					name: label,
//					nameId: name,
//					category: category
//				};
//
//				byId[id] = res;
//				byName[name] = res;
//
//				GM[categoryId] = GM[categoryId] || [];
//				GM[categoryId].push(res);
//			}
//		}
//	}
//})(require('./GeneralMIDI.programInfo.json'))

const A0 = 0x15 // first note
const C8 = 0x6C // last note
const number2key = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const noteDB = {
	toNote: {},
	toName: {}
}

for (var n = A0; n <= C8; n++) {
	let octave = (n - 12) / 12 >> 0;
	let name = number2key[n % 12] + octave;
	noteDB.toNote[name] = n;
	noteDB.toName[n] = name;
}

module.exports = {
	getNoteName(value) {
		if (value in noteDB.toNote) {
			return value
		} else if (value in noteDB.toName) {
			return noteDB.toName[value];
		}
	},

	getNoteNumber(value) {
		if (value in noteDB.toName) {
			return value
		} else if (value in noteDB.toNote) {
			return noteDB.toNote[value]
		}
	},

	getProgram(program) {
		if (typeof program === 'string') {
			return programDB.byName[toName(program)]
		} else {
			return programDB.byID[program]
		}
	}
}