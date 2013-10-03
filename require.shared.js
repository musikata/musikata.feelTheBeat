require.config({
  paths: {
    lib: 'lib/',
    text: 'lib/requirejs-text/text',
    jquery: 'lib/jquery/jquery',
    lodash: 'lib/lodash/lodash',
    backbone: 'lib/backbone/backbone',
    marionette: 'lib/marionette/lib/backbone.marionette'
  },

  map: {
    "*": {
      "underscore" : "lodash"
    }
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
