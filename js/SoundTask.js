const Debug = require('debug')
const debug = Debug('MIDI.js:SoundTask')
const MIDI = require('./MIDI')
const actionStack = require('./actionStack')

function scaleRange(value, a1, a2, b1, b2) {
	return (value - a1) * ((b2 - b1) / (a2 - a1)) + b1
}

function SoundTask({
	inContext,
	audioBuffer,
	channelID,
	delay,
	velocity,
}) {
	this.ctx = inContext
	this.isEnding = false
	this.startTime = delay + this.ctx.currentTime
	this.endTime = -Infinity
	this.channelID = channelID
	this.velocity = velocity
	const onEnded = this.onEnded = actionStack()
	debug('A sound will start soon: %o', {
		ctx: inContext,
		audioBuffer,
		channelID,
		startTime: this.startTime
	})

	this.gain = this.ctx.createGain()

	this.source = this.ctx.createBufferSource()
	this.source.buffer = audioBuffer
	this.source.connect(this.gain)
	this.source.start(this.startTime)
	this.source.onended = function() {
		debug('Sound task is complete.')
		onEnded.trigger()
	}

	this.updateProperties()
}

SoundTask.prototype = {
	constructor: SoundTask,

	cancelImmediately() {
		source.stop()
		source.disconnect()
	},

	updateProperties() {
		const channel = MIDI.channels[this.channelID]

		if (MIDI.mute || channel.mute) {
			debug('Muting sound task: %o', {soundTask: this})
			this.gain.value = 0.0
		} else {
			const volume = MIDI.volume * channel.volume * this.velocity
			const scaledVolume = scaleRange(volume, 0, 127 * 127 * 127, 0, 2)
			debug('Adjusting sound task volume: %o', {volume: scaledVolume})
			this.gain.value = scaledVolume
		}

		if(this.isEnding) {
			this.scheduleFadeOut(this.endTime)
		}

		if (this.ctx.hasDetune) {
			// -1200 to 1200 - value in cents [100 cents per semitone]
			// Default value is 0
			const detune = MIDI.detune + channel.detune
			this.source.detune.value = detune
		}

		this.gain.connect(this.ctx.destination)
	},

	scheduleFadeOut(time) {
		// @Miranet: 'the values of 0.2 and 0.3 could of course be used as
		// a 'release' parameter for ADSR like time settings.'
		// add { 'metadata': { release: 0.3 } } to soundfont files
		this.gain.cancelScheduledValues(this.ctx.currentTime)
		this.gain.linearRampToValueAtTime(this.gain.value, time)
		this.gain.linearRampToValueAtTime(0.0, time + 0.3)
		this.source.stop(time + 0.5)
	},

	fx(source) {
		var channel = source._channel;
		var chain = source.gainNode;

		source.disconnect(0);
		source.connect(chain);

		apply(MIDI.fxNodes); // apply master effects
		apply(channel.fxNodes); // apply channel effects //- trigger refresh when
	                          // this changes

		function apply(nodes) {
			if (nodes) {
				for (var type in nodes) {
					var node = nodes[type];
					chain.connect(node.input);
					chain = node;
				}
			}
		}
	}
}

module.exports = SoundTask