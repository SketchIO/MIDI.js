import {MIDI} from "../MIDI"
import {Sound} from "../Sound"
import {AudioTag} from "./AudioTag"
import {ObjectPool} from "./ObjectPool"

/**
 * I play sound using HTMLAudioElements
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
 */
export class ATSound extends Sound {

	/**
	 * Construct a new sound that will play using HTMLAudioElements
	 * @param {Object} obj
	 * @param {HTMLAudioElement} obj.tag
	 * @param {number} obj.channelID
	 * @param {NoteID} obj.noteID
	 * @param {MIDIParam} obj.velocity
	 * @param {timestamp} obj.startTime
	 * @see Sound
	 */
	constructor({tag, ...args}) {
		super(args)

		this.tag = tag
		this.tag.src = this.note.noteData

		/**
		 * Move the cursor forward if it took a while to get the tag ready for
		 * playback. This helps resolve a laggy feeling SoundModule on older
		 * devices.
		 *
		 * We must wait for the "loadedmetadata" event so that we don't try to
		 * modify `currentTime` before a media source is ready - IE11 throws an
		 * InvalidStateError if you try and do that.
		 */
		const offset = MIDI.currentTime - this.startTime
		if (offset) {
			const onTimeUpdate = () => {
				if (this.tag.currentTime < offset)
					this.tag.currentTime = offset
				/**
				 * Workaround chrome bug
				 * https://bugs.chromium.org/p/chromium/issues/detail?id=593273
				 * https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
				 */
				this.playToken = this.tag.play()
				this.tag.removeEventListener("loadedmetadata", onTimeUpdate)
			}
			this.tag.addEventListener("loadedmetadata", onTimeUpdate)

		}
	}

	updateProperty(property) {
		switch (property) {
			case "mute":
				if (MIDI.mute || this.channel.mute)
					this.tag.volume = 0
				break
			case "volume":
				// TODO use a timer to lerp to new volume based on note.gainRamp
				const volume =
					(MIDI.volume / 127) *
					(this.channel.volume / 127) *
					(this.velocity / 127)
				this.tag.volume = volume
		}
	}

	stop() {
		if (this.playToken) {
			this.playToken.then(() => {
				this.tag.pause()
				ObjectPool.release(this.tag)
			})
		} else {
			ObjectPool.release(this.tag)
		}
	}
}