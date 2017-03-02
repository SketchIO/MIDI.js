(function () {
'use strict';

var programDB = {
	byID: {},
	byName: {}
};

function toName(name) {
	return name.replace(/[^a-z0-9_ ]/gi, '').replace(/[ ]/g, '_').toLowerCase();
}

//(function buildProgramDatabase(categories) {
//	for (var category in categories) {
//		var programs = categories[category];
//		for (var i = 0, length = programs.length; i < length; i++) {
//			var program = programs[i];
//			if (program) {
//				const [idString, ...labelParts] = program.split(' ')
//				const id = parseInt(idString, 10)
//				const label = labelParts.join(' ')
//
//				var name = toName(label);
//				var categoryId = toName(category);
//
//				var res = {
//					id: --id,
//					name: label,
//					nameId: name,
//					category: category
//				};
//
//				byId[id] = res;
//				byName[name] = res;
//
//				GM[categoryId] = GM[categoryId] || [];
//				GM[categoryId].push(res);
//			}
//		}
//	}
//})(require('./GeneralMIDI.programInfo.json'))

var A0 = 0x15; // first note
var C8 = 0x6C; // last note
var number2key = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
var noteDB = {
	toNote: {},
	toName: {}
};

for (var n = A0; n <= C8; n++) {
	var octave = (n - 12) / 12 >> 0;
	var name = number2key[n % 12] + octave;
	noteDB.toNote[name] = n;
	noteDB.toName[n] = name;
}

var GM = {
	getNoteName: function getNoteName(value) {
		if (value in noteDB.toNote) {
			return value;
		} else if (value in noteDB.toName) {
			return noteDB.toName[value];
		}
	},
	getNoteNumber: function getNoteNumber(value) {
		if (value in noteDB.toName) {
			return value;
		} else if (value in noteDB.toNote) {
			return noteDB.toNote[value];
		}
	},
	getProgram: function getProgram(program) {
		if (typeof program === 'string') {
			return programDB.byName[toName(program)];
		} else {
			return programDB.byID[program];
		}
	}
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();



















var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};





















var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var map = require('./fn/map');

function createAction() {
	var actions = new Set();
	function Action(action) {
		actions.add(action);

		return {
			cancel: function cancel() {
				actions.delete(action);
			}
		};
	}

	Action.trigger = function () {
		var args = Array.from(arguments);
		return map(actions, function (action) {
			return action.apply(undefined, toConsumableArray(args));
		});
	};

	return Action;
}

var JobCollection = require('./JobCollection');
var KnobCollection = require('./KnobCollection');
var Program = require('./Program');
var Channel = require('./Channel');

var VERSION = require('../package.json').version;
var NOOP = Function;
var MIDI = {
	VERSION: VERSION,

	jobs: new JobCollection(),
	knobs: new KnobCollection(),

	sampleFormat: null,
	soundModule: null,
	connect: function connect(soundModule) {
		// TODO Disconnect old sound modules here
		this.soundModule = soundModule;
		this.soundModule.beConnectedTo(this);
	},


	programs: [],
	channels: [],
	setChannels: function setChannels(channelCount) {
		for (var channelID = this.channels.length; channelID < channelCount; channelID += 1) {
			this.channels.push(new Channel(channelID));
		}
		this.channels.splice(channelCount);
	},


	onProgress: NOOP,
	fetch: function fetch(_ref) {
		var URL = _ref.URL,
		    onProgress = _ref.onProgress,
		    extraArguments = objectWithoutProperties(_ref, ['URL', 'onProgress']);

		var fetchOp = new Promise(function (resolve, reject) {
			galactic.request(Object.assign({
				format: 'text',
				url: URL,
				onprogress: onProgress
			}, extraArguments), function (XHR, response) {
				resolve(response);
			}, reject);
		});
		MIDI.jobs.track(fetchOp, 'fetch ' + URL, 'fetch');
		return fetchOp;
	},
	startDebugging: function startDebugging() {
		if (localStorage) {
			var SIGIL = 'MIDI.js:*';
			if (localStorage.debug != SIGIL) {
				localStorage.debug = SIGIL;
				window.location = window.location;
			}
		}
	},
	loadProgram: function loadProgram(_ref2) {
		var _ref2$programID = _ref2.programID,
		    programID = _ref2$programID === undefined ? 0 : _ref2$programID,
		    program = _ref2.program,
		    _ref2$onProgress = _ref2.onProgress,
		    onProgress = _ref2$onProgress === undefined ? MIDI.onProgress : _ref2$onProgress;

		var isReady = MIDI.jobs.waitForActiveJobs({ except: 'load program' });
		var loadOp = new Promise(function (resolve, reject) {
			isReady.then(function () {
				switch (typeof program === 'undefined' ? 'undefined' : _typeof(program)) {
					case 'string':
						var programURL = program.replace(/%FORMAT/g, MIDI.format);
						return MIDI.fetch({
							URL: programURL,
							onProgress: onProgress,
							format: 'json'
						}).then(function (programData) {
							var program = Program.wrap(programData);
							MIDI.programs[programID] = program;
							MIDI.onLoadProgram.trigger(programID, program, programData);
							resolve({ programID: programID, program: program, programData: programData });
						}).catch(reject);
					case 'object':
					default:
						var wrappedProgram = Program.wrap(program);
						MIDI.programs[programID] = wrappedProgram;
						MIDI.onLoadProgram.trigger(programID, wrappedProgram, program);
						resolve({ programID: programID, program: wrappedProgram, programData: program });
				}
			});
		});
		MIDI.jobs.track(loadOp, 'load program');
		return loadOp;
	},

	onLoadProgram: createAction(),

	noteOn: function noteOn(channelID, noteID) {
		var velocity = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 127;
		var startTime = arguments[3];

		return this.soundModule.noteOn(channelID, noteID, velocity, startTime);
	},
	noteOff: function noteOff(channelID, noteID, endTime) {
		return this.soundModule.noteOff(channelID, noteID, endTime);
	}
};

function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

MIDI.knobs.describe({
	property: 'volume',
	comparator: isNumber,
	defaultValue: 100
}, {
	property: 'mute',
	comparator: function comparator(b) {
		return !!b;
	},

	defaultValue: false
}, {
	property: 'detune',
	comparator: function comparator(n) {
		return isNumber(n) && n >= -1200 && n <= 1200;
	},

	defaultValue: 0.0
});

MIDI.knobs.add(MIDI, 'MIDI', 'mute');
MIDI.knobs.add(MIDI, 'MIDI', 'volume');

Channel.onConstruct(function (channel) {
	MIDI.knobs.add(channel, 'Channel ' + channel.channelID, 'mute');
	MIDI.knobs.add(channel, 'Channel ' + channel.channelID, 'volume');
	MIDI.knobs.add(channel, 'Channel ' + channel.channelID, 'detune');
	MIDI.knobs.add(channel, 'Channel ' + channel.channelID, {
		property: 'programID',
		comparator: isNumber,
		defaultValue: 0
	});
});

Object.defineProperty(MIDI, 'currentTime', {
	get: function get$$1() {
		return MIDI.soundModule.getCurrentTime();
	}
});

var Debug = require('debug');


var audioTest = require('./audioTest');
var AUDIO_FORMATS = ['mp3', 'ogg'];
function autoselectSampleFormat() {
	var autoselectOp = audioTest().then(function (supports) {
		var format = AUDIO_FORMATS.find(function (format) {
			return supports[format];
		});

		if (!format) {
			throw new Error('None of the sample formats can be played. You probably cannot use MIDI.js right now.');
		}
		MIDI.sampleFormat = format;
	});
	MIDI.jobs.track(autoselectOp, 'autoselect a sample format');
	return autoselectOp;
}

var Debug$1 = require('debug');


var audioTest$1 = require('../audioTest');
var WebAudio = require('./WebAudio');

function autoselectSoundModule() {
	var autoselectOp = audioTest$1().then(function (supports) {
		// TODO a real test here, please

		MIDI.connect(new WebAudio());

		//const format = SOUND.find(function (format) {
		//	return supports[format]
		//})
		//
		//if (!format) {
		//	debug('None of the sample formats can be played. You probably cannot use MIDI.js right now.')
		//	throw new Error('None of the sample formats can be played. You probably cannot use MIDI.js right now.')
		//}
		//
		//debug('Using the "%s" sample format.', format)
		//MIDI.format = format
		console.log("Alrighty then");
	});
	MIDI.jobs.track(autoselectOp, 'autoselect a sound module');
	return autoselectOp;
}

var filter = require('../fn/filter');
var Pad = function () {
	function Pad(button2note) {
		classCallCheck(this, Pad);

		this.button2note = button2note;
	}

	createClass(Pad, [{
		key: 'press',
		value: function press(button) {
			var _button2note$button = this.button2note[button],
			    note = _button2note$button.note,
			    _button2note$button$c = _button2note$button.channelID,
			    channelID = _button2note$button$c === undefined ? 0 : _button2note$button$c,
			    _button2note$button$r = _button2note$button.requiresInteraction,
			    requiresInteraction = _button2note$button$r === undefined ? false : _button2note$button$r,
			    _button2note$button$m = _button2note$button.maxSimultaneous,
			    maxSimultaneous = _button2note$button$m === undefined ? Infinity : _button2note$button$m;

			var noteID = GM.getNoteNumber(note);
			var activeNotes = filter(MIDI.soundModule.notes, function (note) {
				return note.noteID === noteID;
			});
			MIDI.noteOn(channelID, note);
			if (requiresInteraction) {
				this.stopInteractingWith(button);
			}

			if (activeNotes.length > maxSimultaneous) {
				activeNotes[0].cancelImmediately();
			}
		}
	}, {
		key: 'release',
		value: function release(button) {
			var _button2note$button2 = this.button2note[button],
			    note = _button2note$button2.note,
			    _button2note$button2$ = _button2note$button2.channelID,
			    channelID = _button2note$button2$ === undefined ? 0 : _button2note$button2$;

			var noteID = GM.getNoteNumber(note);
			MIDI.noteOff(channelID, noteID);
		}
	}, {
		key: 'startInteractingWith',
		value: function startInteractingWith(button) {
			var _button2note$button$c2 = this.button2note[button].channelID,
			    channelID = _button2note$button$c2 === undefined ? 0 : _button2note$button$c2;

			MIDI.channels[channelID].volume = 127;
		}
	}, {
		key: 'stopInteractingWith',
		value: function stopInteractingWith(button) {
			var _button2note$button$c3 = this.button2note[button].channelID,
			    channelID = _button2note$button$c3 === undefined ? 0 : _button2note$button$c3;

			MIDI.channels[channelID].volume = 0;
		}
	}]);
	return Pad;
}();

var autoselect = {
	sampleFormat: autoselectSampleFormat,
	soundModule: autoselectSoundModule
};

var controllers = {
	Pad: Pad
};

if (console && console.log) {
	console.log('%c\u2665 MIDI.js ' + MIDI.VERSION + ' \u2665', 'color: red;');
}

window.MIDI = MIDI;
window.MIDI.autoselect = autoselect;
window.MIDI.controllers = controllers;

}());

//# sourceMappingURL=MIDI.js.map
