export default function filter(collection, filterAction) {
	let result = []
	for(let [key, value] of collection.entries()) {
		if(filterAction(value, key))
			result.push(value)
	}
	return result
}