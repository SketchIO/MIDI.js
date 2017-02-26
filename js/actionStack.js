module.exports = function actionStack() {
	function actionStack(action) {
		actionStack.actions.push(action)
	}

	actionStack.actions = []
	actionStack.trigger = function() {
		const originalArguments = Array.from(arguments)
		return actionStack.actions.map(action => action(...originalArguments))
	}

	return actionStack
}