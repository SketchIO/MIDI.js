import createAction from "../createAction"
import {Hooray} from "../Hooray"
import {isNumber} from "../fn"

import {MIDI} from "./MIDI"
import {Channel} from "../Channel"

const data = Hooray.create({
	name: "knobs"
})
export const knobs = {
	onChange: createAction(),
	add({property, comparator, defaultValue, addMaster = false}) {
		Object.defineProperty(Channel.prototype, property, {
			get() {
				const value = data.get(this.channelID, property)
				if (typeof value === "undefined") {
					data.set(this.channelID, property, defaultValue)
					return defaultValue
				}
				return value
			},

			set(newValue) {
				const value = data.get(this.channelID, property)
				if (value !== newValue && comparator(newValue)) {
					data.set(this.channelID, property, newValue)
					knobs.onChange.trigger(this, property, newValue)
				}
			},
		})

		if (addMaster) {
			Object.defineProperty(MIDI, property, {
				get() {
					const value = data.get("MIDI", property)
					if (typeof value === "undefined") {
						data.set("MIDI", property, defaultValue)
						return defaultValue
					}
					return value
				},

				set(newValue) {
					const value = data.get("MIDI", property)
					if (value !== newValue && comparator(newValue)) {
						data.set("MIDI", property, newValue)
						knobs.onChange.trigger(this, property, newValue)
					}
				},
			})
		}
	},
}

window.data = data