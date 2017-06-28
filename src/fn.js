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