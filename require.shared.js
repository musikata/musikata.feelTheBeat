require.config({
  paths: {
    lib: 'lib/',
    text: 'lib/requirejs-text/text',
    jquery: 'lib/jquery/jquery',
    lodash: 'lib/lodash/lodash',
    backbone: 'lib/backbone/backbone',
    marionette: 'lib/backbone.marionette'
  },

  packages: [
    {name: 'app', location: 'app'}
  ],

  shim: {
    'backbone': {
      deps: ['lodash', 'jquery'],
      exports: 'Backbone'
    },

    'marionette': {
      deps: ['backbone'],
      exports: 'Backbone.Marionette'
    },

  }
});

//
// requirejs error reporting
//
window.requirejs.onError = function (err) {
  "use strict";

  console.warn('require error: ', err.requireType);
  if (err.requireType === 'timeout') {
    console.warn('modules: ' + err.requireModules);
  }

  throw err;
};
