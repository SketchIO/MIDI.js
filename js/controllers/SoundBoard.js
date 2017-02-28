const Controller = require('./Controller')
const GM = require('../GM')
const filter = require('../filter')

module.exports = class SoundBoard extends Controller {
	constructor(button2note) {
		super()
		this.button2note = button2note
	}


	press(button) {
		this.waitForDownstream().then(() => {
			const {note, channelID = 0, requiresInteraction = false, maxSimultaneous = Infinity} = this.button2note[button]
			const noteID = GM.getNoteNumber(note)
			const activeNotes = filter(this.downstream.notes, note => note.noteID === noteID)
			this.noteOn(channelID, note)
			if (requiresInteraction) {
				this.stopInteractingWith(button)
			}

			if (activeNotes.length > maxSimultaneous) {
				activeNotes[0].cancelImmediately()
			}
		})
	}

	release(button) {
		this.waitForDownstream().then(() => {
			const {note, channelID = 0} = this.button2note[button]
			const noteID = GM.getNoteNumber(note)
			this.noteOff(channelID, noteID)
		})
	}

	startInteractingWith(button) {
		const {channelID = 0} = this.button2note[button]
		this.channels[channelID].volume = 127
	}

	stopInteractingWith(button) {
		this.waitForDownstream().then(() => {
			const {channelID = 0} = this.button2note[button]
			this.channels[channelID].volume = 0
		})
	}
}