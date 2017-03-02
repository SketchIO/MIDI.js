const filter = require('../fn/filter')
import MIDI from '../MIDI'
import GM from '../GM'

export default class Pad {
	constructor(button2note) {
		this.button2note = button2note
	}

	press(button) {
		const {note, channelID = 0, requiresInteraction = false, maxSimultaneous = Infinity} = this.button2note[button]
		const noteID = GM.getNoteNumber(note)
		const activeNotes = filter(MIDI.soundModule.notes, note => note.noteID === noteID)
		MIDI.noteOn(channelID, note)
		if (requiresInteraction) {
			this.stopInteractingWith(button)
		}

		if (activeNotes.length > maxSimultaneous) {
			activeNotes[0].cancelImmediately()
		}
	}

	release(button) {
		const {note, channelID = 0} = this.button2note[button]
		const noteID = GM.getNoteNumber(note)
		MIDI.noteOff(channelID, noteID)
	}

	startInteractingWith(button) {
		const {channelID = 0} = this.button2note[button]
		MIDI.channels[channelID].volume = 127
	}

	stopInteractingWith(button) {
		const {channelID = 0} = this.button2note[button]
		MIDI.channels[channelID].volume = 0
	}
}