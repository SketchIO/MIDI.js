import {MIDI} from "./MIDI"

export class Sound {
	constructor({channelID, noteID, velocity, startTime}) {
		this.channelID = channelID
		this.noteID = noteID
		this.velocity = velocity
		this.startTime = startTime
	}

	get channel() {
		return MIDI.channels[this.channelID]
	}

	get note() {
		return MIDI.note(this.channelID, this.noteID)
	}

	stop() {
	}

	dump() {
		console.table(this)
	}
}