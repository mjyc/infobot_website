module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concurrent: {
      dev: {
        tasks: ['node-inspector', 'shell:nodemon-delayed', 'shell:ros',
          'watch'],
        options: {
          logConcurrentOutput: true
        }
      },
      debug: {
        tasks: ['node-inspector', 'nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      },
      'test-setup': {
        tasks: ['node-inspector', 'shell:nodemon-delayed', 'shell:ros4test',
          'watch'],
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
      ros: {
        command: 'roslaunch launch/run_rosnodes.launch'
      },
      ros4test: {
        command: 'roslaunch launch/run_rosnodes_test.launch'
      },
      // Delays nodemon startup to wait for other programs.
      'nodemon-delayed': {
        command: 'sleep 5; grunt nodemon:dev'
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
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['concurrent:dev']);
  grunt.registerTask('debug', ['concurrent:debug']);
  grunt.registerTask('test_setup', ['env:test','concurrent:test-setup']);
};
