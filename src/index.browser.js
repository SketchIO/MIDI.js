import {MIDI, autoselect, controllers} from './index'

if (console && console.log) {
	console.log(`%c♥ MIDI.js ${MIDI.VERSION} ♥`, 'color: red;')
}


window.MIDI = MIDI
window.MIDI.autoselect = autoselect
window.MIDI.controllers = controllers