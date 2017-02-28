const dump = require('./dump')
module.exports = class ObjectPool {
	constructor(size, objectConstructor) {
		this.objects = new Set()
		this.objectMetadata = new WeakMap()
		this.objectConstructor = objectConstructor

		Object.defineProperty(this, 'size', {
			writeable: false,
			get() {
				return this.objects.size
			}
		})

		for (let i = 0; i < size; i += 1) {
			const object = objectConstructor()
			this.objects.add(object)
			this.objectMetadata.set(object, {
				available: true,
				obtainCount: 0,
				releaseCount: 0,
				lastObtained: -Infinity
			})
		}
	}

	obtain() {
		let availableObject = Array.from(this.objects.values()).find((object) => {
			const metadata = this.objectMetadata.get(object)
			return metadata.available
		})

		if (!availableObject) {
			throw new Error('No available object')
		}

		const metadata = this.objectMetadata.get(availableObject)
		metadata.available = false
		metadata.lastObtained = performance.now()
		metadata.obtainCount += 1
		return availableObject
	}

	release(object) {
		if (!this.objects.has(object)) {
			throw new Error('Cannot return object that did not originate from this pool')
		}

		const metadata = this.objectMetadata.get(object)
		metadata.available = true
		metadata.releaseCount += 1
	}

	dump() {
		dump(...Array.from(this.objects.values()).map((object) =>
			this.objectMetadata.get(object)))
	}

	forceReset() {
		for (let object of this.objects.values()) {
			this.objectMetadata.set(object, {
				available: true,
				obtainCount: 0,
				releaseCount: 0,
				lastObtained: -Infinity
			})
		}
	}
}