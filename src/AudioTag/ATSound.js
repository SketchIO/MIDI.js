import {MIDI} from "../MIDI"
import {Sound} from "../Sound"
import {AudioTag} from "./AudioTag"

export class ATSound extends Sound {
	constructor(args) {
		super(args)

		this.tag = AudioTag.tags.obtain()
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
				this.tag.play()
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
		this.tag.pause()
		AudioTag.tags.release(this.tag)
	}
}