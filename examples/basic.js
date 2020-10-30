import {MIDI} from '../src'

global.MIDI = MIDI

async function startup() {
	await MIDI.autoconnect()
	MIDI.channels = 1
}

async function main() {
	const {default: program} = await import('./soundfont/acoustic_grand_piano-ogg.json')
	await MIDI.programs.load({
		programID: 0,
		program
	})

	let segmentLength = 2
	const notes = ['A', 'C#', 'G', 'B', 'F#', 'D']

	const now = MIDI.currentTime
	let i
	const noteBase = notes[Math.round(Math.random() * (notes.length - 1))]
	for (i = 0; i < 8; i += 1) {
		const note = noteBase + i
		const timeslice = (segmentLength / 4)
		const timestamp = now + timeslice * i
		console.log({note, timeslice, timestamp})
		MIDI.noteOn(0, note, 127, timestamp)
	}

	if (segmentLength > 0) {
		MIDI.after(now + segmentLength, play)
		segmentLength -= 1
	} else {
		MIDI.after(now + segmentLength, function () {
			for (let i = 0; i < 8; i += 1) {
				const note = 'B' + i
				MIDI.noteOff(0, note, MIDI.currentTime + 1)
			}
		})
	}
}

startup()
document.addEventListener('pointerdown', main)
