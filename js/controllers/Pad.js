const Controller = require('./controllers/Controller')
const GM = require('../GM')
const MIDI = require('../MIDI')
const filter = require('../fn/filter')

module.exports = class Pad {
	constructor(button2note) {
		this.button2note = button2note
	}

	press(button) {
		MIDI.waitForDownstream().then(() => {
			const {note, channelID = 0, requiresInteraction = false, maxSimultaneous = Infinity} = this.button2note[button]
			const noteID = GM.getNoteNumber(note)
			const activeNotes = filter(this.downstream.notes, note => note.noteID === noteID)
			MIDI.noteOn(channelID, note)
			if (requiresInteraction) {
				this.stopInteractingWith(button)
			}

			if (activeNotes.length > maxSimultaneous) {
				activeNotes[0].cancelImmediately()
			}
		})
	}

	release(button) {
		MIDI.waitForDownstream().then(() => {
			const {note, channelID = 0} = this.button2note[button]
			const noteID = GM.getNoteNumber(note)
			MIDI.noteOff(channelID, noteID)
		})
	}

	startInteractingWith(button) {
		const {channelID = 0} = this.button2note[button]
		MIDI.channels[channelID].volume = 127
	}

	stopInteractingWith(button) {
		this.waitForDownstream().then(() => {
			const {channelID = 0} = this.button2note[button]
			MIDI.channels[channelID].volume = 0
		})
	}
}