/*
 ----------------------------------------------------------
 MIDI/loader : 2015-12-22 : https://mudcu.be
 ----------------------------------------------------------
 https://github.com/mudcube/MIDI.js
 ----------------------------------------------------------
 */

if (typeof MIDI === 'undefined') MIDI = {};

MIDI.AUDIO_FORMATS = ['mp3', 'ogg']
MIDI.AUTOSELECT = 'autoselect'
MIDI.Controller = function({
	format = MIDI.AUTOSELECT,
	soundModule = MIDI.AUTOSELECT
}) {
	this.debug = debug('MIDI.js:MIDIController')
	this.isReady = AudioSupports().then((supports) => {
		this.format = format === MIDI.AUTOSELECT ? MIDI.AUDIO_FORMATS.find(f => supports[f]) : format
		if(!this.format) {
			this.debug('An acceptable audio format could not be found. (Desired format: %s) (Available formats: %o)', format, MIDI.AUDIO_FORMATS)
			throw new Error(`An acceptable audio format could not be found (Desired format: ${format}) (Available formats: ${MIDI.AUDIO_FORMATS})`)
		}

		if(soundModule === MIDI.AUTOSELECT) {
			const findAdaptor = ([adaptor, tail]) => {
				const canPlayThrough = supports[adaptor]
				if(!canPlayThrough[this.format]) {
					debug('The "%s" adapter cannot play the "%s" format. It will be skipped.', adapter, this.format)
				}
			}
			findAdaptor([location.hash.substr(1), 'midiapi', 'audioapi', 'audio'])
		}

		function loadAdaptor(tech) {
			var format = MIDI.adaptor.format;
			var canPlayThrough = supports[tech];
			if (!canPlayThrough[format]) {
				handleError();
				return;
			}

			args.tech = tech;

			MIDI.loadProgram(args).then(function () {
				resolve();
			}).catch(function (err) {
				MIDI.DEBUG && console.error(tech, err);
				handleError(err);
			});

			function handleError(err) {
				var idx = parseInt(_adaptorPriority[tech]) + 1;
				var nextAdaptor = Object.keys(_adaptorPriority)[idx];
				if (nextAdaptor) {
					loadAdaptor(nextAdaptor);
				} else {
					reject && reject({
						message: 'All plugins failed.'
					});
				}
			}
		}
	})
}

MIDI.Controller.prototype = {
	constructor: MIDI.Controller,

	loadProgram(args) {
		args || (args = {});
		typeof args === 'object' || (args = {instrument: args});
		args.instruments = instrumentList();
		args.tech = args.tech || MIDI.adaptor.id;

		return MIDI.adaptors._load(args);

		/* helpers */
		function instrumentList() {
			var programs = args.instruments || args.instrument || MIDI.channels[0].program;
			if (typeof programs === 'object') {
				Array.isArray(programs) || (programs = Object.keys(programs));
			} else {
				if (programs === undefined) {
					programs = [];
				} else {
					programs = [programs];
				}
			}

			/* program number -> id */
			for (var n = 0; n < programs.length; n++) {
				var programId = programs[n];
				if (programId >= 0) {
					var program = MIDI.getProgram(programId);
					if (program) {
						programs[n] = program.nameId;
					}
				}
			}
			if (programs.length === 0) {
				programs = ['acoustic_grand_piano'];
			}
			return programs;
		}
	}
}


;(function (MIDI) {
	'use strict';

	if (console && console.log) {
		console.log('%c♥ MIDI.js 0.4.2 ♥', 'color: red;');
	}

	/** globals **/
	MIDI.DEBUG = false;
	MIDI.USE_XHR = true;
	MIDI.PATH = './soundfont/';

	/** priorities **/
	var _adaptorPriority = {
		'midiapi': 0,
		'audioapi': 1,
		'audio': 2
	};

	var _formatPriority = {
		'ogg': 0,
		'mp3': 1
	};

	let _CONTROLLER

	/** setup **/
	MIDI.setup = function (args) {
		args = args || {};
		if (typeof args === 'function') args = {onsuccess: args};

		if (isFinite(args.debug)) {
			MIDI.DEBUG = !!args.debug;
		}

		/* custom paths */
		if (args.soundfontUrl) {
			MIDI.PATH = args.soundfontUrl;
		}

		_CONTROLLER = new MIDI.Controller({

		})
		return _CONTROLLER.isReady.then(function() {
			MIDI.adaptor.format = _CONTROLLER.format
		})
	}


	/** loadProgram **/
	MIDI.loadProgram = function (args) {
		args || (args = {});
		typeof args === 'object' || (args = {instrument: args});
		args.instruments = instrumentList();
		args.tech = args.tech || MIDI.adaptor.id;

		return MIDI.adaptors._load(args);

		/* helpers */
		function instrumentList() {
			var programs = args.instruments || args.instrument || MIDI.channels[0].program;
			if (typeof programs === 'object') {
				Array.isArray(programs) || (programs = Object.keys(programs));
			} else {
				if (programs === undefined) {
					programs = [];
				} else {
					programs = [programs];
				}
			}

			/* program number -> id */
			for (var n = 0; n < programs.length; n++) {
				var programId = programs[n];
				if (programId >= 0) {
					var program = MIDI.getProgram(programId);
					if (program) {
						programs[n] = program.nameId;
					}
				}
			}
			if (programs.length === 0) {
				programs = ['acoustic_grand_piano'];
			}
			return programs;
		}
	};

})(MIDI);