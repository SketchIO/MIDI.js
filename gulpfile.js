var gulp = require('gulp'),
	rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	wrap = require('gulp-wrap')

gulp.task('build', function () {
	gulp.src('./js/**')
	// This will output the non-minified version
		.pipe(concat('MIDI.js'))
		.pipe(gulp.dest('build/'))
		// This will minify and rename to foo.min.js
		.pipe(uglify())
		.pipe(rename({extname: '.min.js'}))
		.pipe(gulp.dest('build/'));
});

gulp.task('wrap', function () {
	gulp.src([
		'./inc/shim/Base64.js',
		'./inc/shim/WebAudioAPI.js',
		'./inc/shim/WebMIDIAPI.js',
		'./inc/dom/request_script.js',
		'./inc/dom/request_xhr.js',
		'./inc/AudioSupports.js',
		'./inc/EventEmitter.js',
		'./js/loader.js',
		'./js/adaptors.js',
		'./js/adaptors-Audio.js',
		'./js/adaptors-AudioAPI.js',
		'./js/adaptors-MIDI.js',
		'./js/channels.js',
		'./js/gm.js',
		'./js/player.js',
		'./js/synesthesia.js'
	], {
		base: '.'
	}).pipe(concat('MIDI.js'))
		.pipe(wrap("<%= contents %>; module.exports = MIDI"))
		.pipe(rename({extname: '.forNPM.js'}))
		.pipe(gulp.dest('build/'))
})

gulp.task('default', ['build']);