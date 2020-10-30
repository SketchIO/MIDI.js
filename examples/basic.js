import {MIDI} from '../src'

global.MIDI = MIDI

async function startup() {
	await MIDI.autoconnect()
	MIDI.channels = 1

}
async function main() {
	const {default: program} = await import('./soundfont/acoustic_grand_piano-ogg.json')
	MIDI.programs.load({
		programID: 0,
		program
	})

	MIDI.jobs.wait().then(function () {
		let segmentlength = 2
		const notes = ['A', 'C#', 'G', 'B', 'F#', 'D']

		function play() {
			const now = MIDI.currentTime
			let i
			const notebase = notes[Math.round(Math.random() * (notes.length - 1))]
			for (i = 0; i < 8; i += 1) {
				const note = notebase + i
				const timeslice = (segmentlength / 4)
				const timestamp = now + timeslice * i
				console.log({note, timeslice, timestamp})
				MIDI.noteOn(0, note, 127, timestamp)
			}

			if (segmentlength > 0) {
				MIDI.after(now + segmentlength, play)
				segmentlength -= 1
			} else {
				MIDI.after(now + segmentlength, function () {
					for (let i = 0; i < 8; i += 1) {
						const note = 'B' + i
						MIDI.noteOff(0, note, MIDI.currentTime + 1)
					}
				})
			}
		}

		play()
	})
}

startup()
document.addEventListener('pointerdown', main)
