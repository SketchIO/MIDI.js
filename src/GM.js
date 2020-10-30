/**
 * @file General MIDI note and program mappings
 * [1]:
 *   http://www.electronics.dit.ie/staff/tscarff/Music_technology/midi/midi_note_numbers_for_octaves.htm
 * [2]: https://www.midi.org/specifications/item/gm-level-1-sound-set
 */

import {ProgramInfo} from "./ProgramInfo"

export const GM = {
	note: {},
	program: {}
}

const keymap = [["C"], ["C#", "Db"], ["D"], ["D#", "Eb"], ["E"], ["F"], ["F#", "Gb"], ["G"], ["G#", "Ab"], ["A"], ["A#", "Bb"], ["B"]]
for (let noteID = 0; noteID < 128; noteID++) {
	const octave = (noteID - 12) / 12 + 1 >> 0
	const keys = keymap[noteID % 12]

	const bundle = {
		noteID,
		octave,
		keys
	}

	GM.note[noteID] = bundle
	keys.forEach(function (key) {
		const name = "" + key + octave
		GM.note[name] = bundle
	})
}

for (let family in ProgramInfo) {
	const programs = ProgramInfo[family]
	for (let i = 0; i < programs.length; i++) {
		const program = programs[i]
		const [idString, ...nameParts] = program.split(" ")

		const programID = parseInt(idString, 10) - 1
		const name = nameParts.join(" ")

		const bundle = {
			programID,
			family,
			name,
		}

		GM.program[name] = bundle
		GM.program[programID] = bundle
	}
}
