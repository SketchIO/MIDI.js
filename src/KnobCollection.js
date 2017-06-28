// const createAction = require('./createAction')
import createAction from "./createAction"

export default class KnobCollection {
	constructor() {
		this.descriptors = []
		this.knownPropertyNames = new Set()
		this.propertyTable = {}
		this.onChange = createAction()
	}

	describe(knobs) {
		knobs.forEach(function(knob) {
			this.descriptors.push(knob)
		}, this)
	}

	add(object, objectID, descriptor) {
		if (typeof descriptor === 'string') {
			descriptor = this.descriptors.reduce(function(memo, d) {
				return (d.property === descriptor) ? d : memo
			})
			if (!descriptor)
				throw new Error("Unknown property descriptor")
		}

		let bucket = this.propertyTable[objectID]
		if (!bucket) {
			bucket = {}
			this.propertyTable[objectID] = bucket
		}

		const {property, comparator, defaultValue} = descriptor
		const knobs = this
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

	dump() {
		console.table(this.propertyTable)
	}
}
