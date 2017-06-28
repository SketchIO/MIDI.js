import {wrap} from "./fn"

export const Collections = {

	/**
	 * Create a composite-key map
	 * @returns {Map}
	 */
	mapCK() {
		const mapCK = new Map()
		const GLUE = '.'

		wrap(mapCK, "get", function(get, ...keys) {
			const key = keys.join(GLUE)
			return get(key)
		})

		wrap(mapCK, "set", function(set, ...rest) {
			const keys = rest.slice(0, -1)
			const value = rest.slice(-1)[0]
			const key = keys.join(GLUE)
			return set(key, value)
		})

		return mapCK
	},

	noteset() {
		const noteset = new Set()

		noteset.matching = function (selector) {
			if (selector instanceof Channel) {
				return filter(this, function (note) {
					return note.channelID === selector.channelID
				})
			}
			return this
		}

		return noteset
	}
}