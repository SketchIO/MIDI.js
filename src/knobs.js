import createAction from "./createAction"
import {Hooray} from "./Hooray"

const data = Hooray.create()
export const knobs = {
	factories: [],
	onChange: createAction(),

	add(object, objectID, factory) {
		if (typeof factory === "string") {
			factory = knobs.factories[factory]
			if (!factory)
				throw new Error("Unknown knob factory!")
		}

		let bucket = data.get(objectID)
		if (!bucket) {
			bucket = {}
			data.set(objectID, bucket)
		}

		const {property, comparator, defaultValue} = factory
		bucket[property] = defaultValue

		Object.defineProperty(object, property, {
			get() {
				return bucket[property]
			},

			set(newValue) {
				const currentValue = bucket[property]
				if (currentValue != newValue && comparator(newValue)) {
					bucket[property] = newValue
					knobs.onChange.trigger(this, property, newValue)
				}
			},
		})
	}
}

import {isNumber} from "./fn"

knobs.factories["mute"] = {
	property: "mute",
	comparator(b) {
		return !!b
	},
	defaultValue: false,
}

knobs.factories["volume"] = {
	property: "volume",
	comparator: isNumber,
	defaultValue: 100,
}

knobs.factories["detune"] = {
	property: "detune",
	comparator(n) {
		return isNumber(n) && n >= -1200 && n <= 1200
	},
	defaultValue: 0.0,
}