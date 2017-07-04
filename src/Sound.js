import {MIDI} from "./MIDI"

/**
 * I represent a single instance of a sound
 */
export class Sound {

	/**
	 * Construct a new sound
	 * @param {Object} obj
	 * @param {number} obj.channelID
	 * @param {NoteID} obj.noteID
	 * @param {MIDIParam} obj.velocity
	 * @param {timestamp} obj.startTime
	 */
	constructor({channelID, noteID, velocity, startTime}) {
		this.channelID = channelID
		this.noteID = noteID
		this.velocity = velocity
		this.startTime = startTime
	}

	/**
	 * The channel I am playing on
	 * @type {Channel}
	 */
	get channel() {
		return MIDI.channels[this.channelID]
	}

	/**
	 * The note I am playing
	 * @type {Note}
	 */
	get note() {
		return MIDI.note(this.channelID, this.noteID)
	}

	/**
	 * Immediately stop this sound
	 */
	stop() {
	}
}