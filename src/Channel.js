import {MIDI} from './MIDI'

export class Channel {
	constructor(channelID) {
		this.channelID = channelID
	}

	get program() {
		// return MIDI.knobs.channels[this.channelID].programID
		return MIDI.programs[this.programID]
	}

	noteOn(noteID, velocity, delay) {
		return MIDI.noteOn(this.channelID, noteID, velocity, delay)
	}

	noteOff(noteID, delay) {
		return MIDI.noteOff(this.channelID, noteID, delay)
	}
}

window.Channel = Channel