/*
 ----------------------------------------------------------
 MIDI/loader : 2015-12-22 : https://mudcu.be
 ----------------------------------------------------------
 https://github.com/mudcube/MIDI.js
 ----------------------------------------------------------
 */

const Debug = require('debug')
const debug = Debug('MIDI.js:root')
const testAudio = require('./testAudio')

if (console && console.log) {
	console.log('%c♥ MIDI.js 0.4.2 ♥', 'color: red;')
}

function NOOP() {
}
const AUTOSELECT = 'autoselect'
const AUDIO_FORMATS = ['mp3', 'ogg']

const MIDI = {
	AUDIO_FORMATS,
	AUTOSELECT,

	asyncOperations: [],
	format: AUTOSELECT,

	doFetch(URL, onProgress) {
		const fetchOp = new Promise(function (resolve, reject) {
			galactic.request({
				url: URL,
				format: 'text',
				onerror: reject,
				onprogress: onProgress,
				onsuccess: resolve
			})
		})
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

	loadProgram({intoSlot = 0, filename, onProgress = NOOP}) {
		const isReady = this.isReady({skip: 'isLoadProgram'})
		const loadOp = new Promise(function (resolve, reject) {
			isReady.then(function () {
				const programURL = filename.replace(/%FORMAT/g, MIDI.format)
				debug('Fetching "%s"', programURL)
				MIDI.doFetch(programURL, onProgress).then(function (event) {
					const rawContents = event.target.responseText
					try {
						const programContents = JSON.parse(rawContents)
						debug('The program was parsed.')
					} catch (error) {
						debug('Something happened while parsing your program: %o', error)
						reject()
					}
					resolve()
				}).catch(function (error) {
					debug('Something happened while fetching: %o', error)
					reject()
				})
			})
		})
		loadOp.isLoadProgram = true
		this.asyncOperations.push(loadOp)
		return loadOp
	},

	isReady(opts) {
		let operations = this.asyncOperations
		// TODO Does skip make sense as an array or function?
		if (opts && opts.skip)
			operations = this.asyncOperations.filter(operation => !operation[opts.skip])
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

module.exports = MIDI

module.exports.WebAudioSM = require('./WebAudioSM')