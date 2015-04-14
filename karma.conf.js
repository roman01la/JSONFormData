'use strict';

module.exports = function (config) {

  config.set({
    frameworks: ['jasmine'],
    files: [
      'src/json-formdata.js',
      'test/**/*.js'
    ],
    reporters: ['progress', 'coverage'],
    preprocessors: {
      'src/json-formdata.js': ['coverage']
    },
    coverageReporter: {
      type: 'lcovonly',
      dir: 'coverage/'
    },
    browsers: process.env.TRAVIS ? ['Firefox'] : ['Chrome']
  });
};
