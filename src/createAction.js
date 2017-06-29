import {forEach} from "./fn"

export default function createAction() {
	const actions = new Set()
	function Action(action) {
		actions.add(action)

		return {
			cancel() {
				actions.delete(action)
			}
		}
	}

	Action.trigger = function(...args) {
		forEach(actions, action => action(...args))
	}

	return Action
}