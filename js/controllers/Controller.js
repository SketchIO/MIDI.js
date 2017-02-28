const MISSING_DOWNSTREAM = 'A command was received but the controller cannot forward it. Please connect a downstream device.'
const actionStack = require('../actionStack')
const Channel = require('../Channel')

const Controller = module.exports = class Controller {
	constructor() {
		this.channels = []

		let outerResolve
		this.downstreamWaiter = new Promise(function (resolve) {
			outerResolve = resolve
		})
		this.downstreamWaiter.resolve = outerResolve

		Controller.onConstruct.trigger(this)
	}

	connect(object) {
		if (this.downstream !== object) {
			this.downstream = object
			this.downstreamWaiter.resolve()
			object.beConnectedTo(this)
		}
	}

	beConnectedTo(object) {
		if (this.upstream !== object) {
			this.upstream = object
			object.connect(this)
		}
	}

	setChannels(channelCount) {
		for (let channelID = this.channels.length; channelID < channelCount; channelID += 1) {
			this.channels.push(new Channel(channelID))
		}
		this.channels.splice(channelCount)
	}

	waitForDownstream() {
		return Promise.all([this.downstreamWaiter])
	}

	noteOn(channelID, noteID, velocity = 127, startTime) {
		return this.waitForDownstream().then(() =>
			this.downstream.noteOn(channelID, noteID, velocity, startTime))
	}

	noteOff(channelID, noteID, endTime) {
		return this.waitForDownstream().then(() =>
			this.downstream.noteOff(channelID, noteID, endTime))
	}
}

Controller.onConstruct = actionStack()