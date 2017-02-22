module.exports = function actionStack() {
	function actionStack(action) {
		actionStack.actions.push(action)
	}

	actionStack.actions = []
	actionStack.trigger = function() {
		const originalArguments = Array.from(arguments)
		actionStack.actions.forEach(function(action) {
			action(...originalArguments)
		})
	}

	return actionStack
}