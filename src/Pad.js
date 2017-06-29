import {MIDI} from "./MIDI"
import {filter} from "./fn"
import {GM} from "./GM"

export class Pad {
	constructor(button2note) {
		this.button2note = button2note
	}

	press(button) {
		if (button in this.button2note) {
			const {note, channelID = 0, requiresInteraction = false} = this.button2note[button]
			if (note) {
				const noteID = GM.note[note].noteID
				if (noteID) {
					MIDI.noteOn(channelID, note)
					if (requiresInteraction) {
						this.stopInteractingWith(button)
					}
				}
			}
		}
	}

	release(button) {
		if (button in this.button2note) {
			const {note, channelID = 0} = this.button2note[button]
			const noteID = GM.note[note].noteID
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