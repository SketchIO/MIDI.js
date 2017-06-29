export const FastTimer = {
	timers: [],
	running: false,

	attach() {
		FastTimer.running = true
		FastTimer.tick()
		// addEventListener("message", FastTimer.tick)
		// FastTimer.tick()
	},

	detach() {
		// removeEventListener("message", FastTimer.tick)
		FastTimer.running = false
	},

	tick() {
		for (let i = 0; i < FastTimer.timers.length; i++) {
			FastTimer.timers[i]()
		}
		if(FastTimer.running) {
			setTimeout(FastTimer.tick, 0)
		}
		// postMessage("", location.origin)
	},

	start(fn) {
		FastTimer.timers.push(fn)
		return {
			stop() {
				FastTimer.stop(fn)
			},
		}
	},

	stop(fn) {
		const i = FastTimer.timers.indexOf(fn)
		if (i > -1)
			FastTimer.splice(i, 1)
	},
}