import {MIDI, AudioTag, WebAudio, support} from './index'

if (console && console.log) {
	console.log(`%c♥ MIDI.js ${MIDI.VERSION} ♥`, 'color: red;')
}

window.MIDI = Object.assign(MIDI, {
	AudioTag,
	WebAudio,
	support
})