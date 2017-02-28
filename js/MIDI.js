//require('babel-polyfill')

const Debug = require('debug')
const debug = Debug('MIDI.js:root')
const testAudio = require('./testAudio')
const actionStack = require('./actionStack')
const basicProperties = require('./basicProperties')
const PendingJobs = require('./PendingJobs')
const dump = require('./dump')
const GM = require('./GM')
const Program = require('./Program')

const AUDIO_FORMATS = ['mp3', 'ogg']
const AUTOSELECT = 'autoselect'
const NOOP = function () {
}

const MIDI = {
	VERSION: require('../package.json').version,
	AUDIO_FORMATS,
	AUTOSELECT,

	jobs: new PendingJobs(),
	format: AUTOSELECT,
	soundModule: null,
	onProgress: NOOP,
	programs: [],
	onPropertyChange: actionStack(),

	doFetch({URL, onProgress, ...extraArguments}) {
		const fetchOp = new Promise(function (resolve, reject) {
			galactic.request(Object.assign({
				format: 'text',
				url: URL,
				onprogress: onProgress
			}, extraArguments), function (XHR, response) {
				resolve(response)
			}, reject)
		})
		MIDI.jobs.track(fetchOp, `fetch ${URL}`, 'fetch')
		return fetchOp
	},

	startDebugging() {
		if (localStorage) {
			const SIGIL = 'MIDI.js:*'
			if (localStorage.debug != SIGIL) {
				localStorage.debug = SIGIL
				window.location = window.location
			}
		}
	},

	props2dump: [
		...basicProperties.map(function ({property}) {
			return property
		})
	],
	dumpProps() {
		const rows = [{
			objectID: 'MIDI',
			object: MIDI
		}, ...MIDI.channels.map(function (channel) {
			return {
				objectID: `Channel ${channel.channelID}`,
				object: channel
			}
		})].reduce(function (rows, {objectID, object}) {
			rows[objectID] = MIDI.props2dump.reduce(function (accum, property) {
				accum[property] = accum[property] || {}
				accum[property] = object[property]
				return accum
			}, {})
			return rows
		}, {})
		dump(rows)
	},

	autoselectFormat() {
		debug('Autoselecting an audio format from the following choices: %j', AUDIO_FORMATS)
		const autoselectOp = testAudio().then(function (supports) {
			const format = AUDIO_FORMATS.find(function (format) {
				return supports[format]
			})

			if (!format) {
				debug('None of the audio formats can be played. You probably cannot use MIDI.js right now.')
				throw new Error('None of the audio formats can be played. You probably cannot use MIDI.js right now.')
			}

			debug('Using the "%s" format.', format)
			MIDI.format = format
		})
		MIDI.jobs.track(autoselectOp, 'autoselect a format')
		return autoselectOp
	},

	/**
	 * Load (and process) a program
	 * @param {number} programID
	 * @param {string} filename
	 * @param {function} onProgress
	 * @returns {Promise}
	 */
	loadProgram({programID = 0, program, onProgress = MIDI.onProgress}) {
		const isReady = MIDI.jobs.waitForActiveJobs({except: 'load program'})
		const loadOp = new Promise(function (resolve, reject) {
			isReady.then(function () {
				switch (typeof program) {
					case 'string':
						const programURL = program.replace(/%FORMAT/g, MIDI.format)
						debug('Fetching "%s"', programURL)
						return MIDI.doFetch({
							URL: programURL,
							onProgress,
							format: 'json'
						}).then(function (programData) {
							const program = Program.wrap(programData)
							MIDI.programs[programID] = program
							MIDI.onLoadProgram.trigger(programID, program, programData)
							resolve({programID, program, programData})
						}).catch(reject)
					case 'object':
					default:
						const wrappedProgram = Program.wrap(program)
						MIDI.programs[programID] = wrappedProgram
						MIDI.onLoadProgram.trigger(programID, wrappedProgram, program)
						resolve({programID, program: wrappedProgram, programData: program})
				}
			})
		})
		MIDI.jobs.track(loadOp, 'load program')
		return loadOp
	},
	onLoadProgram: actionStack()
}

function addProperty({object, property, comparator, defaultValue}) {
	debug('Adding property to object: %j', {
		object,
		property,
		comparator,
		defaultValue
	})
	let currentValue = defaultValue
	Object.defineProperty(object, property, {
		get() {
			return currentValue
		},

		set(newValue) {
			if (currentValue != newValue && comparator(newValue)) {
				currentValue = newValue
				MIDI.onPropertyChange.trigger(this, property, newValue)
			}
		}
	})
}

basicProperties.forEach(function (propertyInfo) {
	addProperty({object: MIDI, ...propertyInfo})
})

// TODO This is also implemented in basicProperties. Combine them!
function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

const ChannelProxy = require('./Channel')
ChannelProxy.onConstruct(function (channelProxy) {
	[
		...basicProperties,
		{
			property: 'programID',
			comparator: isNumber,
			defaultValue: 0
		}
	].forEach(function (propertyInfo) {
		addProperty({object: channelProxy, ...propertyInfo})
	})
})

MIDI.props2dump.push('programID')

module.exports = MIDI
module.exports.GM = require('./GM')

module.exports.controllers = {
	Controller: require('./controllers/Controller'),
	SoundBoard: require('./controllers/SoundBoard')
}

module.exports.soundModules = {
	WebAudio: require('./WebAudio')
}

if (console && console.log) {
	console.log(`%c♥ MIDI.js ${MIDI.VERSION} ♥`, 'color: red;')
}