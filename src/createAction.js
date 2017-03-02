const map = require('./fn/map')

module.exports = function createAction() {
	const actions = new Set()
	function Action(action) {
		actions.add(action)

		return {
			cancel() {
				actions.delete(action)
			}
		}
	}

	Action.trigger = function() {
		const args = Array.from(arguments)
		return map(actions, action => action(...args))
	}

	return Action
}