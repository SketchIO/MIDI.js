export function wrap(object, property, fn) {
	const originalFn = object[property].bind(object)
	object[property] = fn.bind(object, originalFn)
}

function forEach(collection, fn) {
	if (!Array.isArray(collection))
		collection = Array.from(collection)

	for (let i = 0; i < collection.length; i++) {
		fn(i, collection[i])
	}
}

export function filter(collection, filterAction) {
	let result = []
	forEach(collection, function (key, value) {
		if (filterAction(value, key))
			result.push(value)
	})
	return result
}

export function map(collection, action) {
	let result = []
	forEach(collection, function (key, value) {
		result.push(action(value, key))
	})
	return result
}

export function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n)
}

export function scale(value, a1, a2, b1, b2) {
	return (value - a1) * ((b2 - b1) / (a2 - a1)) + b1
}

export function clamp(value, a, b) {
	[a, b] = a < b ? [a, b] : [b, a]
	return Math.min(b, Math.max(a, value))
}

export const fn = {
	filter(collection, filterAction) {
		let result = []
		forEach(collection, function (key, value) {
			if (filterAction(value, key))
				result.push(value)
		})
		return result
	},

	map(collection, action) {
		let result = []
		forEach(collection, function (key, value) {
			result.push(action(value, key))
		})
		return result
	},

	scale(value, a1, a2, b1, b2) {
		return (value - a1) * ((b2 - b1) / (a2 - a1)) + b1
	},

	clamp(value, a, b) {
		[a, b] = a < b ? [a, b] : [b, a]
		return Math.min(b, Math.max(a, value))
	}
}


window.fn = fn