/*
 ----------------------------------------------------------------------
 adaptors
 ----------------------------------------------------------------------
 */

if (typeof MIDI === 'undefined') MIDI = {};
if (typeof MIDI.Soundfont === 'undefined') MIDI.Soundfont = {};

(function (MIDI) {
	'use strict';

	var _adaptor = MIDI.adaptor = {};
	var _adaptors = MIDI.adaptors = {};
	var _requests = _adaptors._requests = {};
	var _load = _adaptors._load = function (args) {
		resetAdaptor();
		if (args.tech === 'midiapi') {
			return _adaptors.midiapi.connect(args);
		} else {
			return loadPrograms(args);
		}
	};

	// TODO Replace with the debug module - much better output
	function debug() {
		console.log.apply(arguments)
	}

	/**
	 * Sum an array of numbers
	 * @param {number[]} anArrayOfNumbers
	 * @returns {number}
	 */
	function sum(anArrayOfNumbers) {
		return anArrayOfNumbers.reduce(function (a, b) {
			return a + b
		}, 0)
	}

	/**
	 * Reach out to a server and get a Soundfont
	 * TODO Move to loader
	 * @param {string} programID - The name of the program to load
	 * @param {string} audioFormat - The preferred audio format
	 * @param {function} onProgress
	 * @returns {Promise}
	 */
	function fetchSoundfont(programID, audioFormat, onProgress) {
		return new Promise(function (resolve, reject) {
			const soundfontPath = MIDI.PATH + programID + '-' + audioFormat + '.js';
			if (MIDI.USE_XHR) {
				galactic.request({
					url: soundfontPath,
					format: 'text',
					onerror: reject,
					onprogress: onProgress,
					onsuccess: function (event, responseText) {
						const script = document.createElement('script');
						script.language = 'javascript';
						script.type = 'text/javascript';
						script.text = responseText;
						document.body.appendChild(script);
						resolve();
					}
				});
			} else {
				dom.loadScript.add({
					url: soundfontPath,
					verify: 'MIDI.Soundfont["' + programID + '"]',
					onerror: reject,
					onsuccess: resolve
				});
			}
		});
	}

	/**
	 * Load a bunch of programs
	 * TODO Move to loader
	 * @param {Object} args
	 * @returns {Promise.<TResult>}
	 */
	function loadPrograms(args) {
		const audioFormat = _adaptor.format.split('_').shift();
		const programs = args.instruments;
		const onProgress = args.onprogress;
		const tech = args.tech;

		let progressParts = []
		const jobs = programs.map(function (programID, i) {
			debug('Ensuring', programID, 'exists')

			if (MIDI.Soundfont[programID]) {
				debug(programID, 'is already in the sound bank!')
				return Promise.resolve()
			}

			debug(programID, 'is not in the sound bank; loading...')
			return fetchSoundfont(programID, audioFormat, function (e, currentProgress) {
				debug('Loading', programID, ':', currentProgress)
				progressParts[i] = currentProgress
				onProgress('load', sum(progressParts) / programs.length)
			})
		})

		return Promise.all(jobs).then(function () {
			return MIDI.adaptors[tech].connect(args)
		}).catch(function (error) {
			console.log('An error occurred in MIDI.adaptors.loadPrograms')
			console.log(error)
		})
	}


	/* resetAdaptor */
	function resetAdaptor() {

		/* currentTime */
		(function () {
			var _now = performance.now();
			Object.defineProperties(MIDI, {
				'currentTime': {
					configurable: true,
					get: function () {
						return performance.now() - _now;
					}
				}
			});
		})();


		/* set */
		MIDI.set = function (property, value, delay) {
			if (delay) {
				return setTimeout(function () {
					MIDI[property] = value;
				}, delay * 1000);
			} else {
				MIDI[property] = value;
			}
		};


		/** programChange **/
		MIDI.messageHandler = {};
		MIDI.programChange = function (channelId, programId, delay) {
			var program = MIDI.getProgram(programId);
			if (program && Number.isFinite(programId = program.id)) {
				var channel = MIDI.channels[channelId];
				if (channel && channel.program !== programId) {
					if (delay) {
						setTimeout(function () { //- is there a better option?
							channel.program = programId;
						}, delay);
					} else {
						channel.program = programId;
					}

					var wrapper = MIDI.messageHandler.program || programHandler;
					if (wrapper) {
						wrapper(channelId, programId, delay);
					}
				}
			}
		};

		function programHandler(channelId, program, delay) {
			if (MIDI.adaptor.id) {
				if (MIDI.player.playing) {
					MIDI.loadProgram(program).then(MIDI.player.start);
				} else {
					MIDI.loadProgram(program);
				}
			}
		}


		/* globals */
		Object.defineProperties(MIDI, {
			'context': set(null),
			'detune': set('detune', 0),
			'fx': set('fx', null),
			'mute': set('mute', false),
			'volume': set('volume', 1.0)
		});

		function set(_type, _value) {
			return {
				configurable: true,
				get: function () {
					return _value;
				},
				set: function (value) {
					_value = value;
					handleError(_type);
				}
			};
		}


		/* functions */
		MIDI.send = handleErrorWrapper('send');
		MIDI.noteOn = handleErrorWrapper('noteOn');
		MIDI.noteOff = handleErrorWrapper('noteOff');
		MIDI.cancelNotes = handleErrorWrapper('cancelNotes');
		MIDI.setProperty = handleErrorWrapper('setProperty');

		MIDI.setController = handleErrorWrapper('setController'); //- depreciate
		MIDI.setEffects = handleErrorWrapper('setEffects'); //- depreciate
		MIDI.setPitchBend = handleErrorWrapper('setPitchBend'); //- depreciate
		MIDI.setVolume = handleErrorWrapper('setVolume'); //- depreciate

		MIDI.iOSUnlock = handleErrorWrapper('iOSUnlock');

		/* helpers */
		function handleError(_type) {
			MIDI.DEBUG && console.warn('The ' + _adaptor.id + ' adaptor does not support "' + _type + '".');
		}

		function handleErrorWrapper(_type) {
			return function () {
				handleError(_type);
			};
		}
	}

	resetAdaptor();

})(MIDI);