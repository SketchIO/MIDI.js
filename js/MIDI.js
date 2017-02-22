const Debug = require('debug')
const debug = Debug('MIDI.js:root')
const testAudio = require('./testAudio')
const actionStack = require('./actionStack')
const basicProperties = require('./basicProperties')

if (console && console.log) {
	console.log('%c♥ MIDI.js 0.4.2 ♥', 'color: red;')
}

const AUDIO_FORMATS = ['mp3', 'ogg']
const AUTOSELECT = 'autoselect'
const NOOP = function () {
}

const MIDI = {
	AUDIO_FORMATS,
	AUTOSELECT,

	asyncOperations: [],
	format: AUTOSELECT,
	soundModule: null,
	onProgress: NOOP,
	channels: [],
	onPropertyChange: actionStack(),

	doFetch({URL, onProgress, ...extraArguments}) {
		const fetchOp = new Promise(function (resolve, reject) {
			galactic.request(Object.assign({
				format: 'text',
				url: URL,
				onprogress: onProgress
			}, extraArguments), resolve, reject)
		})
		fetchOp.isFetch = true
		this.asyncOperations.push(fetchOp)
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

	dumpProps() {
		const doDump = (console.table ? console.table : console.log).bind(console)
		const rows = [{
			objectID: 'MIDI',
			object: MIDI
		}, ...MIDI.channels.map(function (channel) {
			return {
				objectID: `Channel ${channel.channelID}`,
				object: channel
			}
		})].reduce(function (rows, {objectID, object}) {
			rows[objectID] = basicProperties.reduce(function (accum, {property}) {
				accum[property] = accum[property] || {}
				accum[property] = object[property]
				return accum
			}, {})
			return rows
		}, {})

		doDump(rows)
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
		this.asyncOperations.push(autoselectOp)
		return autoselectOp
	},

	loadProgram({intoSlot = 0, filename, onProgress = MIDI.onProgress}) {
		const isReady = this.isReady({skip: 'isLoadProgram'})
		const loadOp = new Promise(function (resolve, reject) {
			isReady.then(function () {
				const programURL = filename.replace(/%FORMAT/g, MIDI.format)
				debug('Fetching "%s"', programURL)
				MIDI.doFetch({
					URL: programURL,
					onProgress,
					format: 'json'
				}).then(function (event) {
					const rawContents = event.target.response
					try {

						// TODO branch here and process
						// 1) SoundPackV1
						// 2) Soundfont
						// 3) Other program file formats?

						const programContents = JSON.parse(rawContents)
						debug('The program was parsed.')
						resolve({
							programID: intoSlot,
							program: programContents
						})
					} catch (error) {
						debug('Something happened while parsing your program: %o', error)
						reject()
					}
				}).catch(function (error) {
					debug('Something happened while fetching: %o', error)
					reject()
				})
			})
		})
		loadOp.isLoadProgram = true
		loadOp.programID = intoSlot
		this.asyncOperations.push(loadOp)
		return loadOp
	},

	isReady(opts) {
		opts = opts || {}
		let operations = this.asyncOperations

		if (opts.skip) {
			debug('Skipping async operations tagged "%s"', opts.skip)
			// TODO Does skip make sense as an array or function?
			operations = this.asyncOperations.filter(operation => !operation[opts.skip])
		}

		debug('Waiting for %s async operations...', operations.length)
		return Promise.all(operations)
	}
};

[
	'send', 'noteOn', 'noteOff', 'cancelNotes',
	'setController', 'setEffects', 'setPitchBend',
	'setProperty', 'setVolume', 'iOSUnlock'
].forEach(command => MIDI[command] = function () {
	debug('The "%s" command is not supported by the currently installed sound module', command)
})

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

module.exports = MIDI
module.exports.WebAudio = require('./WebAudio')