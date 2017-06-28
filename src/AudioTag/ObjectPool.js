import dump from "../dump"

export class ObjectPool {
	constructor(size, objectConstructor) {
		this.objects = []
		this.objectConstructor = objectConstructor

		Object.defineProperty(this, 'size', {
			writeable: false,
			get() {
				return this.objects.length
			}
		})

		for (let i = 0; i < size; i += 1) {
			const object = objectConstructor()
			this.objects.push(object)
		}
	}

	obtain() {
		return this.objects.length ? this.objects.pop() : this.objectConstructor()
	}

	release(object) {
		this.objects.push(object)
	}

	drain() {
		this.objects = []
	}
}