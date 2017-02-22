const Debug = require('debug')
const debug = Debug('MIDI.js:WebAudioSM')

const MIDI = require('./MIDI')
const GeneralMIDI = require('./GeneralMIDI')
const dataURI = require('./dataURI')
const SoundTask = require('./SoundTask')
const ChannelProxy = require('./ChannelProxy')

const ctx = createAudioContext()

const bufferDB = new Map()
bufferDB.id = function (programID, noteID) {
	return `${programID}x${noteID}`
}

const tasks = []
tasks.selectTasksRequiringUpdate = function (object) {
	if (object instanceof ChannelProxy) {
		return tasks.filter(function (task) {
			return task.channelID === object.channelID
		})
	}

	return tasks
}

MIDI.onPropertyChange(function (selector, property, newValue) {
	debug('Property change detected! Updating tasks...')
	tasks.selectTasksRequiringUpdate(selector).forEach(function (task) {
		task.updateProperties()
	})
})

const WebAudioSM = {
	connect() {
		debug('Connecting the Web Audio sound module.')

		// WARNING - this adds properties directly to MIDI. It's kind of dirty.
		// TODO MIDI.js should proxy all calls to the sound modules
		//addCustomProperties()
		addCommands()
		MIDI.soundModule = this

		// Hook into program loading for post-processing
		const originalLoadProgram = MIDI.loadProgram
		MIDI.loadProgram = function () {
			debug('HOOK! WebAudioSM will post-process the program when it loads.')
			return originalLoadProgram.apply(MIDI, arguments).then(WebAudioSM.processProgram)
		}

		const connectOp = new Promise(function (resolve, reject) {
			if (window.Tuna) {
				debug('Adding TunaJS support...')
				if (!(ctx.tunajs instanceof Tuna)) {
					ctx.tunajs = new Tuna(ctx);
				}
			}

			MIDI.asyncOperations.filter(function (operation) {
				return operation.isLoadProgram
			}).forEach(function (loadOp) {
				loadOp.then(WebAudioSM.processProgram)
			})

			resolve()
		})

		connectOp.isConnect = true
		MIDI.asyncOperations.push(connectOp)
		return connectOp
	},

	processProgram({programID, program, onProgress = MIDI.onProgress}) {
		if (typeof programID === 'undefined') {
			debug('I cannot process a program without a programID: %o', {
				programID,
				program
			})
			const rejection = Promise.reject
			MIDI.asyncOperations.push(rejection)
			return rejection
		}

		const bufferJobs = Object.keys(program).map(function (note) {
			const noteID = GeneralMIDI.getNoteNumber(note)
			if (!noteID) {
				debug('I cannot process a note that does not have a valid note number: %o', {
					noteID,
					note
				})
				// Rejecting would cause the whole thing to come crashing down.
				// Instead, might as well just skip this note.
				return Promise.resolve()
			}

			// TODO Stop assuming that the contents of a note are a sample; they may
			// be an object following the SoundPackV1 spec.
			const noteSample = program[note]
			debug('Processing note: %o', {noteID, note, noteSample})

			function storeBuffer(audioBuffer) {
				const bufferID = bufferDB.id(programID, noteID)
				debug('Storing audio buffer: %o', {bufferID, audioBuffer})
				bufferDB.set(bufferID, audioBuffer)
			}

			// Currently, if the sample is a data URI then we shortcut and
			// just decode the sample. If it's not, I assume that sample is a URL.
			// TODO Test the sample for URL qualities to allow for other formats.
			if (dataURI.test(noteSample)) {
				return ctx.decodeAudioData(dataURI.toBuffer(noteSample)).then(storeBuffer)
			} else {
				return MIDI.doFetch({
					URL: noteSample,
					onProgress,
					responseType: 'arraybuffer'
				}).then(function (event) {
					console.log(arguments)
					debugger
					const response = new ArrayBuffer()
					return ctx.decodeAudioData(response)
				}).then(storeBuffer)
			}
		})

		const processOp = Promise.all(bufferJobs)
		processOp.isProcessProgram = true
		MIDI.asyncOperations.push(processOp)
		return processOp
	}
}

/** noteOn/Off **/
function noteOff(channelId, noteId, delay) {
	delay = delay || 0;

	var channels = _scheduled[channelId];
	if (channels) {
		var sources = channels[noteId];
		if (sources) {
			var source = sources.active;
			if (source) {
				fadeOut(sources, source, delay);
			}
		}
	}
	return {
		cancel: function () {
			source && source.disconnect(0);
		}
	};
}

function createAudioContext() {
	const ctx = new (window.AudioContext || window.webkitAudioContext)()
	try {
		const buffer = ctx.createBuffer(1, 1, 44100);
		const source = ctx.createBufferSource();
		source.detune.value = 1200
		ctx.hasDetune = true
	} catch (e) {
		debug('Detune is not supported on this platform')
	}

	return ctx
}


//		function prepareFX(channel) {
//			var fxNodes = channel.fxNodes || (channel.fxNodes = {});
//			for (var key in fxNodes) {
//				fxNodes[key].disconnect(ctx.destination);
//				delete fxNodes[key];
//			}
//			if (ctx.tunajs) {
//				var fx = channel.fx;
//				for (var i = 0; i < fx.length; i++) {
//					var data = fx[i];
//					var type = data.type;
//					var effect = new ctx.tunajs[type](data);
//					effect.connect(ctx.destination);
//					fxNodes[type] = effect;
//				}
//			} else {
//				MIDI.DEBUG && console.error('fx not installed.', arguments);
//			}
//		}
//	};
//}

function addCommands() {
	MIDI.noteOn = function (channelID, noteID, velocity = 127, delay = 0) {
		noteID = GeneralMIDI.getNoteNumber(noteID)

		const programID = MIDI.channels[channelID].programID
		const bufferID = bufferDB.id(programID, noteID)

		if (!bufferDB.has(bufferID)) {
			debug('An attempt was made to play a note in a program without an associated buffer: %o', bufferID)
			// TODO Should something be returned here? A fake sound task?
			return
		}

		const audioBuffer = bufferDB.get(bufferID)
		const task = new SoundTask({
			inContext: ctx,
			audioBuffer,
			channelID,
			velocity,
			delay
		})

		tasks.push(task)
		return task
	}

	MIDI.noteOff = function (channelID, noteID, delay = 0) {
		noteID = GeneralMIDI.getNoteNumber(noteID)


	};


	/** cancelNotes **/
	MIDI.cancelNotes = function (channelId) {
		if (isFinite(channelId)) {
			stopChannel(channelId);
		} else {
			for (var channelId in _scheduled) {
				stopChannel(channelId);
			}
		}

		function stopChannel(channelId) {
			loopChannel(channelId, function (sources, source) {
				fadeOut(sources, source);
			});
		}
	};


	/** unlock **/
	MIDI.iOSUnlock = function () {
		if (ctx.unlocked !== true) {
			ctx.unlocked = true;
			var buffer = ctx.createBuffer(1, 1, 44100);
			var source = ctx.createBufferSource();
			source.buffer = buffer;
			source.connect(ctx.destination);
			source.start(0);
		}
	};
}

module.exports = WebAudioSM
module.exports.bufferDB = bufferDB
module.exports.tasks = tasks
module.exports.ctx = ctx