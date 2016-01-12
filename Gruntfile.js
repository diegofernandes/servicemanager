module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      options: {
          jshintrc: './.jshintrc'
        },
        src: [
          './*.js',
          '!./*.spec.js',
          './services/*.js',
          '!./services/*.spec.js',
        ]
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },
    mochaTest: {
        files: ['test/*.spec.js'],
        tasks: ['env:test', 'mochaTest']
    },

  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('default', ['jshint', 'mochaTest']);

};
