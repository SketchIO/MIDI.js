import {MIDI} from "../MIDI"
import {Channel} from "../Channel"
import {WebAudio} from "./WebAudio"

let action
export const PropertyChanger = {
	startUpdating() {
		action = MIDI.knobs.onChange((selector, property, newValue) => {
			if (selector instanceof Channel) {
				const bank = WebAudio.sounds.get(selector.channelID)
				if (bank)
					bank.forEach(sound => sound.updateProperty(property))
			} else {
				WebAudio.sounds.forEach(bank =>
					bank.forEach(sound =>
						sound.updateProperty(property)))
			}
		})
	},

	stopUpdating() {
		if (action)
			action.cancel()
	},
}