import filter from '../fn/filter'
import MIDI from '../MIDI'
import GM from '../GM'

import Debug from 'debug'
const debug = Debug('MIDI.js:src/controllers/Pad.js')

export default class Pad {
	constructor(button2note) {
		this.button2note = button2note
	}

	press(button) {
		if(!MIDI.soundModule) return
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

					if (activeNotes.length > maxSimultaneous) {
						debug('There are too many simulteneous sounds (%s); canceling the first sound.', activeNotes.length)
						activeNotes[0].cancelImmediately()
					}
				}
			}
		}
	}

	release(button) {
		if(!MIDI.soundModule) return
		if (button in this.button2note) {
			debug('Releasing button %s', button)
			const {note, channelID = 0} = this.button2note[button]
			const noteID = GM.getNoteNumber(note)
			MIDI.noteOff(channelID, noteID)
		}
	}

	startInteractingWith(button) {
		if(!MIDI.soundModule) return
		if (button in this.button2note) {
			debug('Starting interaction with button %s', button)
			const {channelID = 0} = this.button2note[button]
			MIDI.channels[channelID].volume = 127
		}
	}

	stopInteractingWith(button) {
		if(!MIDI.soundModule) return
		if (button in this.button2note) {
			debug('Ending interaction with button %s', button)
			const {channelID = 0} = this.button2note[button]
			MIDI.channels[channelID].volume = 0
		}
	}
}