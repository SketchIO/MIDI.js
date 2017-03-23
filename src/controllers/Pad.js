import filter from '../fn/filter'
import MIDI from '../MIDI'
import GM from '../GM'

export default class Pad {
	constructor(button2note) {
		this.button2note = button2note
	}

	press(button) {
		if (button in this.button2note) {
			const {note, channelID = 0, requiresInteraction = false, maxSimultaneous = 1} = this.button2note[button]
			if (note) {
				const noteID = GM.getNoteNumber(note)
				if (noteID) {
					MIDI.noteOn(channelID, note)
					const activeNotes = filter(MIDI.soundModule.notes, note => note.noteID === noteID)
					if (requiresInteraction) {
						this.stopInteractingWith(button)
					}

					if (activeNotes.length > maxSimultaneous)
						activeNotes[0].cancelImmediately()
				}
			}
		}
	}

	release(button) {
		if (button in this.button2note) {
			const {note, channelID = 0} = this.button2note[button]
			const noteID = GM.getNoteNumber(note)
			MIDI.noteOff(channelID, noteID)
		}
	}

	startInteractingWith(button) {
		if (button in this.button2note) {
			const {channelID = 0} = this.button2note[button]
			MIDI.channels[channelID].volume = 127
		}
	}

	stopInteractingWith(button) {
		if (button in this.button2note) {
			const {channelID = 0} = this.button2note[button]
			MIDI.channels[channelID].volume = 0
		}
	}
}