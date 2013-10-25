require.config({
  paths: {
    lib: 'lib/',
    text: 'lib/requirejs-text/text',
    jquery: 'lib/jquery/jquery',
    lodash: 'lib/lodash/lodash',
    backbone: 'lib/backbone/backbone',
    marionette: 'lib/marionette/lib/backbone.marionette',
    handlebars: 'lib/handlebars/handlebars',
    stickit: 'lib/backbone.stickit/backbone.stickit'
  },

  map: {
    "*": {
      "underscore" : "lodash",
      "musikata": "app"
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

    'handlebars': {
      exports: 'Handlebars'
    },

    'stickit': {
      deps: ['backbone'],
    }

  }
});
