module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      },
      debug: {
        tasks: ['nodemon', 'node-inspector', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      },
      test: {
        tasks: ['node-inspector', 'shell:nodemon', 'shell:ros4test', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    env: {
      test: {
        TEST: '1'  // any value will trigger the test.
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
      // Delays nodemon start time to wait for ros programs.
      nodemon: {
        command: 'sleep 3; grunt nodemon:dev'
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

  grunt.registerTask('nodemon-delay', ['shell:sleep', 'nodemon']);

  grunt.registerTask('default', ['concurrent:dev']);
  grunt.registerTask('debug', ['concurrent:debug']);
  grunt.registerTask('test', ['env:test','concurrent:test']);
};
