/**
 * I represent a thing that can make sound
 * @abstract
 */
export class SoundModule {

	/**
	 * @summary Indicate that you are done with a SoundModule
	 * @description This is a good spot to clean up after yourself
	 */
	disconnect() {

	}

	/**
	 * Play a note
	 * @param {number} channelID
	 * @param {NoteID} noteID
	 * @param {MIDIParam} velocity
	 * @param {number} [startTime]
	 */
	noteOn(channelID, noteID, velocity, startTime) {

	}


	/**
	 * Stop a note
	 * @param {number} channelID
	 * @param {NoteID} noteID
	 * @param {number} [endTime]
	 */
	noteOff(channelID, noteID, endTime) {
	}

	/**
	 * Get the current time, according to the SoundModule
	 * @returns {timestamp}
	 */
	currentTime() {

	}
}