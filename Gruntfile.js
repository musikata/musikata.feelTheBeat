module.exports = function(grunt) {

  'use strict';

  // Load grunt contrib tasks.
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    connect: {
      all: {
        options:{
          port: 9000,
          keepalive: true
        }
      }
    },

    jshint: {
      files: [
        'Gruntfile.js',
        'app/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },

    copy: {
      dist: {
        files: {
          'prod/app/index.html': 'app/index.html',
          'prod/assets/css/app/': 'assets/css/**'
        }
      }
    },

    requirejs: {
      production: {
        options: {
          almond: true,
          replaceRequireScript: [{
            files: ['prod/app/index.html'],
            module: 'main',
            modulePath: 'app/main'
          }],
          insertRequire: ['main'],
          baseUrl: "app/",
          optimizeCss: "none",
          optimize: "uglify",
          uglify: {
            "beautify": false,
            "no-dead-code": true,
            "reserved-names": "require"
          },
          inlineText: true,
          useStrict: true,
          findNestedDependencies: true,
          optimizeAllPluginResources: true,
          paths: {
            app:           '.',
            text:          '../lib/require-text/text',
            jquery:        '../lib/jquery/jquery',
            handlebars:    '../lib/handlebars/handlebars',
            lodash:        '../lib/lodash/lodash',
            backbone:      '../lib/backbone/backbone',
            marionette:    '../lib/backbone.marionette/lib/backbone.marionette'
          },
          shim: {
            'backbone': {
              deps: ['lodash', 'jquery'],
              exports: 'Backbone'
            },

            'marionette': {
              deps: ['backbone'],
              exports: 'Backbone.Marionette'
            },
          },
          out: "prod/app/main.js",
          name: "main"
        }
      }
    }

  });

  grunt.registerTask('server',['connect']);
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('build', ['jshint', 'copy', 'requirejs']);

};
