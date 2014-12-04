'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concurrent: {
      dev: {
        tasks: ['node-inspector', 'nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    env: {
      test: {
        TEST: true
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      files: [
        '**/*.js',
        '!bower_components/**/*.js',
        '!node_modules/**/*.js',
        '!public/js/vendor/**/*.js'
      ]
    },

    'node-inspector': {
      dev: {
        options: {
          'web-port': 3000,
          'web-host': 'localhost',
          'debug-port': 5858,
        }
      }
    },

    nodemon: {
      dev: {
        script: 'bin/www',
        options: {
          nodeArgs: ['--debug'],
          env: {
            PORT: '8080'
          },
          callback: function(nodemon) {
            nodemon.on('log', function(event) {
              console.log(event.colour);
            });

            // Refreshes browser when server reboots.
            nodemon.on('restart', function() {
              setTimeout(function() {
                require('fs').writeFileSync('.rebooted', 'rebooted');
              }, 300);
            });
          }
        }
      }
    },

    shell: {
      options: {
        async: true,
        stdout: true,
        stderr: true,
        failOnError: true
      },
      ros: {
        command: 'roslaunch launch/run_rosnodes.launch',
      },
      ros4test: {
        command: 'roslaunch launch/run_rosnodes_test.launch',
      },
      sleep: {
        command: 'sleep 5',
        options: {
          async: false
        }
      }
    },

    watch: {
      js: {
        files: ['.rebooted'],
        tasks: ['jshint'],
        options: {
          livereload: true
        }
      }
    }

  });


  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-node-inspector');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-shell-spawn');

  grunt.registerTask('default', [
    'shell:ros', 'shell:sleep', 'concurrent:dev'
  ]);
  grunt.registerTask('test_setup', [
    'env:test', 'shell:ros4test', 'shell:sleep', 'concurrent:dev'
  ]);
  grunt.registerTask('noros', [
    'concurrent:dev'
  ]);
};
