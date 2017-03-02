module.exports = {
	create() {
		return new Proxy(new Map(), {
			get(target, property, receiver) {
				switch (property) {
					case 'get':
						return function (programID, noteID) {
							const id = `${programID}x${noteID}`
							return target.get(id)
						}
					case 'set':
						return function (programID, noteID, bufferContents) {
							const id = `${programID}x${noteID}`
							return target.set(id, bufferContents)
						}
					case 'has':
						return function(programID, noteID) {
							const id = `${programID}x${noteID}`
							return target.has(id)
						}
					default:
						return Reflect.get(target, property, target)
				}
			}
		})
	}
}