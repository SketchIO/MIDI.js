// const createAction = require('./createAction')
import createAction from './createAction'

export default class KnobCollection {
	constructor() {
		this.descriptors = []
		this.knownPropertyNames = new Set()
		this.propertyTable = []
		this.onChange = createAction()
	}

	describe(...knobs) {
		for (const descriptor of knobs) {
			this.descriptors.push(descriptor)
		}
	}

	add(object, objectID, descriptor) {
		if (typeof descriptor === 'string') {
			descriptor = this.descriptors.find(d => d.property === descriptor)
			if (!descriptor)
				throw new Error('Unknown property descriptor')
		}

		let propertyRow = this.propertyTable.find(row => row.objectID === objectID)
		if (!propertyRow) {
			propertyRow = {objectID}
			this.propertyTable.push(propertyRow)
		}

		const {property, comparator, defaultValue} = descriptor
		const knobs = this
		propertyRow[property] = defaultValue
		Object.defineProperty(object, property, {
			get() {
				return propertyRow[property]
			},

			set(newValue) {
				const currentValue = propertyRow[property]
				if (currentValue != newValue && comparator(newValue)) {
					propertyRow[property] = newValue
					knobs.onChange.trigger(this, property, newValue)
				}
			}
		})
	}

	dump() {
		console.table(this.propertyTable)
	}
}