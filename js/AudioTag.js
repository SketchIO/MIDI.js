const Debug = require('debug')
const debug = Debug('MIDI.js:legacyaudio')

const MIDI = require('./MIDI')
const GeneralMIDI = require('./GM')
const SoundModule = require('./soundModules/SoundModule')
const AudioTagSound = require('./AudioTagSound')
const ObjectPool = require('./ObjectPool')

module.exports = class AudioTag extends SoundModule {
	constructor(poolSize) {
		super()

		this.audioTags = new ObjectPool(poolSize, function() {
			return new Audio()
		})

		for (let i = 0; i < tagpoolSize; i += 1) {
			tagpool._buffers[bufferId] || (_buffers[bufferId] = new Audio());
		}
	}

	connect(MIDI) {
		Object.defineProperty(MIDI, 'currentTime', {
			get() {
				return performance.now()
			}
		})
	}

	noteOn(channelID, noteID, velocity = 127, startTime) {
		noteID = GeneralMIDI.getNoteNumber(noteID)
		startTime = startTime || MIDI.currentTime

		const audioPlayer = audioPlayers.find
		var timeout;
		var noteName = MIDI.getNoteName(noteID);
		if (delay) {
			timeout = setTimeout(function () {
				startChannel(channelID, noteName, velocity);
			}, delay * 1000);
		} else {
			startChannel(channelID, noteName, velocity);
		}
		return {
			cancel: function () {
				clearTimeout(timeout);
			}
		};
	}

	noteOff(channelID, noteID, endTime) {

	}
}

//
//window.Audio && (function () {
//	'use strict';
//
//	var _buffers = []; // the audio channels
//	var _buffer_nid = -1; // current channel
//	var _active = []; // programId + noteId that is currently playing in each
//                    // 'channel', for routing noteOff/chordOff calls
//	var _apply = {};
//
//	/** connect **/
//	const connect = function (args) {
//
//		/** init **/
//		for (var bufferId = 0; bufferId < 12; bufferId++) {
//			_buffers[bufferId] || (_buffers[bufferId] = new Audio());
//		}
//
//
//		/** properties **/
//		defineProperties();
//
//
//		/** volume **/
//		_apply.volume = function (source) {
//			var channel = source._channel;
//			if (MIDI.mute || channel.mute) {
//				source.volume = 0.0;
//			} else {
//				var volume = MIDI.volume * channel.volume * source._volume;
//				source.volume = Math.min(1.0, Math.max(-1.0, volume * 2.0));
//			}
//		};
//
//
//		/** noteOn/Off **/
//		MIDI.noteOn = function (channelId, noteId, velocity, delay) {
//			switch (typeof noteId) {
//				case 'number':
//					return noteOn.apply(null, arguments);
//				case 'string':
//					break;
//				case 'object':
//					return noteGroupOn.apply(null, arguments);
//			}
//		};
//
//		MIDI.noteOff = function (channelId, noteId, delay) {
//			switch (typeof noteId) {
//				case 'number':
//					return noteOff.apply(null, arguments);
//				case 'string':
//					break;
//				case 'object':
//					return noteGroupOff.apply(null, arguments);
//			}
//		};
//
//
//		/** stopAllNotes **/
//		MIDI.stopAllNotes = function (channelId) {
//			if (isFinite(channelId)) {
//
//			} else {
//				for (var bufferId = 0, length = _buffers.length; bufferId < length; bufferId++) {
//					_buffers[bufferId].pause();
//				}
//			}
//		};
//
//
//		/** connect **/
//		return new Promise(function (resolve, reject) {
//			var _requests = MIDI.adaptors._requests;
//			var soundfonts = MIDI.Soundfont;
//			for (var programId in soundfonts) {
//				var request = _requests[programId] || (_requests[programId] = {});
//				request.loaded = true;
//				request.loading = false;
//			}
//			resolve();
//		});
//	};
//
//	/** helpers **/
//	function noteOn(channelID, noteID, velocity = 127, delay = 0) {
//		noteID = GeneralMIDI.getNoteNumber(noteID)
//
//		var timeout;
//		var noteName = MIDI.getNoteName(noteID);
//		if (delay) {
//			timeout = setTimeout(function () {
//				startChannel(channelID, noteName, velocity);
//			}, delay * 1000);
//		} else {
//			startChannel(channelID, noteName, velocity);
//		}
//		return {
//			cancel: function () {
//				clearTimeout(timeout);
//			}
//		};
//	};
//
//	function noteOff(channelId, note, delay) {
//		var timeout;
//		// 		var noteName = MIDI.getNoteName(note); // this sounds bad
//		// 		if (delay) {
//		// 			timeout = setTimeout(function () {
//		// 				stopChannel(channelId, noteName);
//		// 			}, delay * 1000)
//		// 		} else {
//		// 			stopChannel(channelId, noteName);
//		// 		}
//		return {
//			cancel: function () {
//				clearTimeout(timeout);
//			}
//		};
//	};
//
//	function startChannel(channelId, noteName, velocity) {
//		var channel = MIDI.channels[channelId];
//		if (channel) {
//			var program = channel.program;
//			var programId = MIDI.getProgram(program).nameId;
//			var sourceId = programId + '' + noteName;
//			var bufferId = (_buffer_nid + 1) % _buffers.length;
//
//			var soundfont = MIDI.Soundfont[programId];
//			if (soundfont) {
//				var source = _buffers[bufferId];
//				source.src = soundfont[noteName];
//				source._channel = channel;
//				source._volume = velocity;
//				source._id = sourceId;
//
//				_apply.volume(source);
//
//				source.play();
//
//				_buffer_nid = bufferId;
//				_active[bufferId] = source;
//			} else {
//				MIDI.DEBUG && console.log('404', programId);
//			}
//		}
//	};
//
//	function stopChannel(channelId, noteName) {
//		var channel = MIDI.channels[channelId];
//		if (channel) {
//			var program = channel.program;
//			var programId = MIDI.getProgram(program).nameId;
//			var sourceId = programId + '' + noteName;
//
//			for (var i = 0, len = _buffers.length; i < len; i++) {
//				var bufferId = (i + _buffer_nid + 1) % len;
//				var source = _active[bufferId];
//				if (source && source._id === sourceId) {
//					_buffers[bufferId].pause();
//					_active[bufferId] = null;
//					return;
//				}
//			}
//		}
//	};
//
//})();