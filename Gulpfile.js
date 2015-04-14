'use strict';

var gulp = require('gulp'),
    umd = require('gulp-umd'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),
    coveralls = require('gulp-coveralls'),
    karma = require('karma').server,
    path = require('path');

var headerMsg = '/* Unofficial Draft: http://darobin.github.io/formic/specs/json/ */\n';

var name = function() { return 'JSONFormData'; };

var UMDConfig = {
  namespace: name,
  exports: name
};

gulp.task('coverage', function() {

  gulp.src('coverage/**/lcov.info')
    .pipe(coveralls());
});

gulp.task('karma', function (done) {

  karma.start({
    configFile: path.join(__dirname, '/karma.conf.js'),
    singleRun: true,
    autoWatch: false
  }, done);
});

gulp.task('test', ['karma', 'coverage']);

gulp.task('build', function() {

  return gulp.src('src/json-formdata.js')
    .pipe(umd(UMDConfig))
    .pipe(uglify())
    .pipe(header(headerMsg))
    .pipe(gulp.dest('dist'));
});
