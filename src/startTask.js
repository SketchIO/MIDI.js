export function startTask(fn) {
	let globalID
	requestAnimationFrame(tick)
	return () => {
		cancelAnimationFrame(globalID)
	}

	function tick() {
		fn()
		globalID = requestAnimationFrame(tick)
	}
}
