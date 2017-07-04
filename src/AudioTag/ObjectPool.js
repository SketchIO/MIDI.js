import dump from "../dump"
import {forEach} from "../fn"

const mappings = new WeakMap()

export class ObjectPool {
	static release(object) {
		const pool = mappings.get(object)
		if (pool) {
			pool.release(object)
		}
	}

	constructor({size, onCreate, onRemove}) {
		this.objects = []
		this.onCreate = onCreate
		this.onRemove = onRemove

		Object.defineProperty(this, "size", {
			writeable: false,
			get() {
				return this.objects.length
			},
		})

		for (let i = 0; i < size; i += 1) {
			const object = onCreate()
			this.objects.push(object)
		}
	}

	obtain() {
		const object = this.objects.length ? this.objects.pop() : this.onCreate()
		mappings.set(object, this)
		return object
	}

	release(object) {
		this.objects.push(object)
	}

	drain() {
		forEach(this.object, this.onRemove)
		this.objects = []
	}

}