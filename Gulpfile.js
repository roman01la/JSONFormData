'use strict';

var gulp = require('gulp'),
    umd = require('gulp-umd'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header');

var headerMsg = '/* Unofficial Draft: http://darobin.github.io/formic/specs/json/ */\n';

var name = function() { return 'JSONFormData'; };

var UMDConfig = {
  namespace: name,
  exports: name
};

gulp.task('build', function() {

  return gulp.src('src/json-formdata.js')
    .pipe(umd(UMDConfig))
    .pipe(uglify())
    .pipe(header(headerMsg))
    .pipe(gulp.dest('dist'));
});
