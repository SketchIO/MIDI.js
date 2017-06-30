import {Hooray} from "../Hooray"
export const sounds = Hooray.create({
	name: "sounds"
})

import {knobs} from "./knobs"
import {Channel} from "../Channel"
import {forEach} from "../fn"
knobs.onChange((selector, property, newValue) => {
	if (selector instanceof Channel) {
		const bank = sounds.get(selector.channelID)
		forEach(bank, sound => {
			sound.updateProperty(property)
		})
	} else {
		forEach(sounds, bank => {
			forEach(bank, sound => {
				sound.updateProperty(property)
			})
		})
	}
})