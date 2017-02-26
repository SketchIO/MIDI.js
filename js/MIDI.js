require('babel-polyfill')

const Debug = require('debug')
const debug = Debug('MIDI.js:root')
const testAudio = require('./testAudio')
const actionStack = require('./actionStack')
const basicProperties = require('./basicProperties')
const PendingJobs = require('./PendingJobs')
const dump = require('./dump')

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
	channels: [],
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
		MIDI.jobs.track(fetchOp, 'isFetch')
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

	setChannels(channelCount) {
		const ChannelProxy = require('./ChannelProxy')
		for (let channelID = this.channels.length; channelID < channelCount; channelID += 1) {
			this.channels.push(new ChannelProxy(channelID))
		}
		this.channels.splice(channelCount)
	},

	autoselectFormat() {
		debug('Autoselecting an audio format from the following choices: %o', AUDIO_FORMATS)
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
		MIDI.jobs.track(autoselectOp)
		return autoselectOp
	},

	/**
	 * Load (and process) a program
	 * @param {number} programID
	 * @param {string} filename
	 * @param {function} onProgress
	 * @returns {Promise}
	 */
	loadProgram({programID = 0, filename, onProgress = MIDI.onProgress}) {
		const isReady = MIDI.jobs.waitForActiveJobs({except: 'isLoadProgram'})
		const loadOp = new Promise(function (resolve, reject) {
			isReady.then(async function () {
				const programURL = filename.replace(/%FORMAT/g, MIDI.format)
				debug('Fetching "%s"', programURL)
				try {
					const program = await MIDI.doFetch({
						URL: programURL,
						onProgress,
						format: 'json'
					})

					MIDI.programs.push({programID, program})
					await MIDI.onLoadProgram.trigger({programID, program})
					resolve({programID, program})
				} catch (error) {
					reject(error)
				}

			})
		})
		MIDI.jobs.track(loadOp, 'isLoadProgram')
		return loadOp
	},
	onLoadProgram: actionStack(),

	connect(soundModule) {
		soundModule.connect(this)
		this.soundModule = soundModule
	},

	noteOn(channelID, noteID, velocity = 127, startTime) {
		this.soundModule.noteOn(channelID, noteID, velocity, startTime)
	},

	noteOff(channelID, noteID, endTime) {
		this.soundModule.noteOff(channelID, noteID, endTime)
	}
};
//
//[
//	'send', 'noteOn', 'noteOff', 'cancelNotes',
//	'setController', 'setEffects', 'setPitchBend',
//	'setProperty', 'setVolume', 'iOSUnlock'
//].forEach(command => MIDI[command] = function () {
//	debug('The "%s" command is not supported by the currently installed sound
// module', command) })

function addProperty({object, property, comparator, defaultValue}) {
	debug('Adding property to object: %O', {
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
			if (comparator(newValue)) {
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

const ChannelProxy = require('./ChannelProxy')
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
module.exports.audio = require('./audio')
module.exports.WebAudio = require('./WebAudio')
module.exports.gm = require('./GeneralMIDI')

if (console && console.log) {
	console.log(`%c♥ MIDI.js ${MIDI.VERSION} ♥`, 'color: red;')
}