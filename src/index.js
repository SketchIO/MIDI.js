export {default as MIDI} from "./MIDI"

import autoselectSampleFormat from "./autoselectSampleFormat"
import autoselectSoundModule from "./soundModule/autoselectSoundModule"
export const autoselect = {
	sampleFormat: autoselectSampleFormat,
	soundModule: autoselectSoundModule,
}

import Pad from "./controllers/Pad"
export const controllers = {
	Pad,
}

import MIDI from "./MIDI"
import WebAudio from "./soundModule/WebAudio"

if (window.AudioContext) {
	MIDI.connect(new WebAudio())
} else {
	MIDI.noSound = true
}