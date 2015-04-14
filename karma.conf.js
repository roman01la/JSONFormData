'use strict';

module.exports = function (config) {

  config.set({
    frameworks: ['jasmine'],
    files: [
      'src/json-formdata.js',
      'test/**/*.js'
    ],
    browsers: process.env.TRAVIS ? ['Firefox'] : ['Chrome']
  });
};
