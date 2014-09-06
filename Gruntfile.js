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
        tasks: ['nodemon', 'node-inspector', 'shell:ros4test', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    env: {
      test: {
        TEST: '1'  // anything not will trigger the test.
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

            // // Opens browser on initial server start.
            // nodemon.on('config:update', function() {
            //   // Delay before server listens on port.
            //   setTimeout(function() {
            //     require('open')('http://localhost:8080');
            //   }, 300);
            // });

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
      // TODO: use option-like strategy.
      ros: {
        command: 'roslaunch launch/run_rosnodes.launch'
      },
      ros4test: {
        command: 'roslaunch launch/run_rosnodes_test.launch'
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
  grunt.registerTask('test', ['env:test','concurrent:test']);
};
