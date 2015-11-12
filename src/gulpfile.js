var gulp = require('gulp');
var path = require('path');
var rename = require('gulp-rename');

var fs = require('fs');

var uglify = require('gulp-uglify');
var cssMinify = require('gulp-mini-css');
var lessCss = require('gulp-less');
var jsValidate = require('gulp-jsvalidate');
var cssValidate = require('gulp-css-validator');
var include = require('../../gulp-include');
var stripLine  = require('gulp-strip-line');
var del = require('del');


var paths = {
	dist: '../dist/',
	build: '../build/',
	ext: {},
	int: ['example.html', 'imgs/*.jpg'],
	jsSrc: 'js/*.js',
	cssSrc: 'css/*.css',
};
//paths.albums = path.join(paths.dist, 'albums');
paths.allJsSrc = include.files(paths.jsSrc);
paths.js = path.join(paths.dist, 'js');
paths.css = path.join(paths.dist, 'css');
paths.builtCssDir = path.join(paths.build, 'css');
paths.builtCss = path.join(paths.build, paths.cssSrc);

// JQuery
paths.ext.jquery = {
	js: 'lib/jquery/jquery{.min,}.js',
};

// JQuery Touch Events
paths.ext.touchEvents = {
	js: 'lib/jquery-touch-events/src/jquery.mobile-events{.min,}.js',
};

gulp.task('clean', [], function() {
	del([
		path.join(paths.dist, '**'),
		path.join(paths.build, '**')
	], {force: true});
});

gulp.task('validateJs', [], function() {
	return gulp.src(paths.allJsSrc)
			.pipe(jsValidate());
});

gulp.task('jsNoLog', ['validateJs'], function() {
	return gulp.src(paths.jsSrc)
			.pipe(include())
			.pipe(stripLine([
				/console\.log/
			]))
			.pipe(gulp.dest(paths.js))
			.pipe(uglify({
				preserveComments: 'some'
			}))
			.pipe(rename(function (path) {
						path.extname = '.min.js'
					}))
			.pipe(gulp.dest(paths.js));
});

gulp.task('js', ['validateJs'], function() {
	return gulp.src(paths.jsSrc)
			.pipe(include())
			.pipe(gulp.dest(paths.js))
			.pipe(uglify({
				preserveComments: 'some'
			}))
			.pipe(rename(function (path) {
						path.extname = '.min.js'
					}))
			.pipe(gulp.dest(paths.js));
});

gulp.task('validateCss', ['buildCss'], function() {
			return gulp.src(paths.builtCss)
					.pipe(cssValidate());
		});

gulp.task('buildCss', [], function() {
			return gulp.src(paths.cssSrc)
					.pipe(lessCss())
					.pipe(gulp.dest(paths.builtCssDir));
		});

//gulp.task('css', ['validateCss'], function() {
gulp.task('css', ['buildCss'], function() {
			return gulp.src(paths.builtCss)
					.pipe(rename(function (path) {
								path.extname = '.css'
							}))
					.pipe(gulp.dest(paths.css))
					.pipe(cssMinify())
					.pipe(rename(function (path) {
								path.extname = '.min.css'
							}))
					.pipe(gulp.dest(paths.css));
		});

gulp.task('intFiles', [], function() {
			return gulp.src(paths.int, {base: './'})
					.pipe(gulp.dest(paths.dist));
		});

for (e in paths.ext) {
	gulp.task(e, [], (function(e) { return function() {
		var p;
		for (p in paths.ext[e]) {
			gulp.src(paths.ext[e][p], {base: './'})
					.pipe(rename({dirname: path.join('lib', p)}))
					.pipe(gulp.dest(paths.dist));
		}
	}})(e));
}

gulp.task('watch', function() {
	gulp.watch(paths.main, ['markupMainPhp']);
	gulp.watch(paths.jsSrc, ['js']);
	gulp.watch(paths.cssSrc, ['css']);
	gulp.watch(paths.int, ['intFiles']);
	for (e in paths.ext) {
		var f, files = [];
		for (f in paths.ext[e]) {
			files.push(paths.ext[e][f]);
		}
		gulp.watch(files, [e]);
	}
});

var defaultTasks = ['css', 'js', 'intFiles'].concat(Object.keys(paths.ext));

gulp.task('one', defaultTasks);
gulp.task('prod', ['css', 'jsNoLog', 'intFiles'].concat(Object.keys(paths.ext)));

gulp.task('default', defaultTasks.concat(['watch']));

