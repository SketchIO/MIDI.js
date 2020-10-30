import {MIDI} from '../src'

global.MIDI = MIDI
startup()
document.addEventListener('pointerdown', playSomeSounds)

async function startup() {
	await MIDI.autoconnect()
	MIDI.channels = 1
	const {default: program} = await import('./soundfont/acoustic_grand_piano-ogg.json')
	await MIDI.programs.load({
		programID: 0,
		program
	})
	await MIDI.jobs.wait()

	document.addEventListener('pointermove', e => {
		const {clientX} = e
		const {innerWidth} = window
		const fraction = clientX / innerWidth
		MIDI.channels[0].detune = ((fraction * -2) + 1) * 1200
	})
}

async function playSomeSounds() {
	const notes = ['A', 'C', 'G', 'B', 'F', 'D#']
	const beatCount = 1/4
	let start = MIDI.currentTime
	for (let i = 0; i < 8; i++) {
		const note = notes[Math.round(Math.random() * (notes.length - 1))]
		const offset = beatCount * i
		MIDI.noteOn(0, `${note}${Math.floor(Math.random() * 7)}`, 127, start + offset)
		MIDI.noteOff(0, `${note}${Math.floor(Math.random() * 7)}`, start + offset + beatCount / 120)
	}
}
