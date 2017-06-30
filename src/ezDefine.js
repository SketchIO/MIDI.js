export function ezDefine(object, from) {
	const props = {}
	const keys = Object.keys(from)
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i]
		props[key] = {
			value: from[key],
		}
	}
	Object.defineProperties(object, props)
}