import {MIDI} from './MIDI'
import {isNumber} from "./fn"

export class Channel {
	constructor(channelID) {
		this.channelID = channelID
		debug('Channel %s, ready for action!', channelID)

		MIDI.knobs.add(this, `Channel ${channelID}`, "mute")
		MIDI.knobs.add(this, `Channel ${channelID}`, "volume")
		MIDI.knobs.add(this, `Channel ${channelID}`, "detune")
		MIDI.knobs.add(this, `Channel ${channelID}`, {
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