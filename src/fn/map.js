export default function map(collection, action) {
	let result = []
	for (let [key, value] of collection.entries()) {
		result.push(action(value, key))
	}
	return result
}