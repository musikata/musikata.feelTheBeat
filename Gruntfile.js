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
        'src/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },

  });

  grunt.registerTask('serve',['connect']);
  grunt.registerTask('default', ['jshint']);

};
