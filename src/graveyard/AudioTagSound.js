const Sound = require('./Sound')
module.exports = class AudioSound extends Sound {
	constructor({audioTag, ...soundInfo}) {
		super(...soundInfo)

		if(MIDI.now() > this.startTime) {
			// Tsk, a missed opportunity. This sound can't play.

		}

		this.audioTag = audioTag

		var soundfont = MIDI.Soundfont[programId];
		if (soundfont) {
			var source = _buffers[bufferId];
			source.src = soundfont[noteName];
			source._channel = channel;
			source._volume = velocity;
			source._id = sourceId;

			_apply.volume(source);

			source.play();

			_buffer_nid = bufferId;
			_active[bufferId] = source;
		} else {
			MIDI.DEBUG && console.log('404', programId);
		}
	}
}