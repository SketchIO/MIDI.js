import {MIDI} from './MIDI'
import {isNumber} from "./fn"
import {knobs} from "./knobs"

export class Channel {
	constructor(channelID) {
		this.channelID = channelID

		knobs.add(this, `Channel ${channelID}`, "mute")
		knobs.add(this, `Channel ${channelID}`, "volume")
		knobs.add(this, `Channel ${channelID}`, "detune")
		knobs.add(this, `Channel ${channelID}`, {
			property: "programID",
			comparator: isNumber,
			defaultValue: 0,
		})
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