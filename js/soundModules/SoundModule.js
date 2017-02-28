const Controller = require('../controllers/Controller')

module.exports = class SoundModule {
	beConnectedTo(object) {
		if(this.upstream !== object) {
			this.upstream = object
			if(object instanceof Controller) {
				object.connect(this)
			}
		}
	}

	disconnect() {
	}

	noteOn(channelID, noteID, velocity, startTime) {
	}

	noteOff(channelID, noteID, endTime) {
	}
}