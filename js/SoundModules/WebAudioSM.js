const Debug = require('debug')
const debug = Debug('MIDI.js:WebAudioSink')

const b64 = require('./../b64')
const toNoteID = require('./../note').toNoteID
const Channel = require('../Channel')

function createAudioContext() {
	return new (window.AudioContext || window.webkitAudioContext)()
}

/**
 * Determine if the WebAudio API supports detuning.
 */
const DETUNING = WebAudioSM.supportsDetuning = (function () {
	const ctx = createAudioContext()
	var buffer = ctx.createBuffer(1, 1, 44100)
	var source = ctx.createBufferSource()
	try {
		source.detune.value = 1200
		return true
	} catch (e) {
		return false
	}
})()

function WebAudioSM() {
	this.ctx = createAudioContext()
	this.isConnected = false
	this.channels = []
	for(let i = 0; i < 16; i++) {
		this.channels.push(new Channel(this, i))
	}
	this.buffers = new Map()
}

WebAudioSM.programs = new WeakMap()
WebAudioSM.buffers = new Map()
WebAudioSM.prototype = {
	constructor: WebAudioSM,

	connect(CONTROLLER) {
		this.CONTROLLER = CONTROLLER
		this.isConnected = true
	},

	loadProgram(programID, program) {
		debug('processProgram: %o', {
			programID,
			program
		})

		program.eachNote(function(note, noteInfo) {
			debug('Processing %s', note)
			const noteID = toNoteID(note)
			const key = {programID, noteID}

			if('b64sample' in noteInfo) {
				debug('Note %s has a base64 sample. I am converting it to a buffer', note)
				if (!WebAudioSM.buffers.has(key)) {
					const buffer = b64.toBuffer(noteInfo.b64sample)
					debug('Adding buffer at key %o', key)
					WebAudioSM.buffers.set(key, buffer)
				}
			}
		})
	},

	noteOn(channelID, noteID, velocity, delay) {
		if(!this.isConnected) return

		debug('noteOn: %o', {channelID, noteID, velocity, delay})
		delay = delay || 0

		const channel = this.CONTROLLER.getChannel(channelID)
		const program = this.CONTROLLER.getProgram(channelID)
		//
		//var source;
		//var sourceId;
		//
		//var volume = MIDI.volume;
		//if (volume) {
		//	var channel = MIDI.channels[channelId];
		//	var programId = channel.program;
		//	var bufferId = programId + 'x' + noteId;
		//	var buffer = _buffers[bufferId];
		//	if (buffer) {
		//		source = _ctx.createBufferSource();
		//		source.buffer = buffer;
		//
		//		source.gainNode = _ctx.createGain();
		//		source.gainNode.connect(_ctx.destination);
		//
		//		source._channel = channel;
		//		source._volume = velocity;
		//
		//		_apply.volume(source);
		//		_apply.detune(source);
		//		_apply.fx(source);
		//
		//		source.start(delay + _ctx.currentTime);
		//
		//		_scheduled[channelId] = _scheduled[channelId] || {};
		//		_scheduled[channelId][noteId] = _scheduled[channelId][noteId] || [];
		//		_scheduled[channelId][noteId].push(source);
		//		_scheduled[channelId][noteId].active = source;
		//	} else {
		//		MIDI.DEBUG && console.error(['no buffer', arguments]);
		//	}
		//}
		//return {
		//	cancel: function () {
		//		source && source.disconnect(0);
		//	}
		//}
	},

	noteOff(channel, noteID, delay) {
		debug('noteOff: %o', {
			channelID,
			noteID,
			delay
		})
	}
}

module.exports = WebAudioSM