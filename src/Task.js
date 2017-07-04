/**
 * I represent a task that may be running
 * @typedef {Object} TaskRunner
 * @property {Function} stop
 */

/**
 * A collection of miscellaneous methods that might, maybe, be of some use?
 * @namespace Task
 */
export const Task = {

	/**
	 * Run a task repeatedly
	 * @param {Function} fn
	 * @returns {TaskRunner}
	 */
	start(fn) {
		let timeoutID
		let running = true

		function tick() {
			fn()
			if (running) {
				timeoutID = setTimeout(tick, 0)
			}
		}
		setTimeout(tick, 0)


		return {
			stop() {
				clearTimeout(timeoutID)
				running = false
			},
		}
	},
}