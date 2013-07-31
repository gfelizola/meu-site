'use strict';
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Concat
        concat: {
            options: {
                separator: ';'
            },
            frameworks: {
                src: [
                    'bower_components/jquery/jquery.min.js'
                ],
                dest: 'js/.tmp/frameworks.js'
            },
            vendor: {
                src: [ 
                    'js/foundation/*.js',
                    'bower_components/greensock-js/src/minified/TweenMax.min.js',
                    'bower_components/jquery.inview/jquery.inview.js'
                ],
                dest: 'js/.tmp/vendor.js'
            },
            app: {
                src: [
                    'js/db.js',
                    'js/app.js'
                ],
                dest: 'js/.tmp/base.js'
            },
            dev: {
                options: {
                    separator: ';'
                },
                src: [
                    'js/.tmp/frameworks.js',
                    'js/.tmp/vendor.js',
                    'js/.tmp/base.js'
                ],
                dest: 'js/main.js'
            }
        },
        // Uglify
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */',
                properties: true,
                compress: {
                    global_defs: {
                        "DEBUG": false
                    },
                    dead_code: true
                }
            },
            target: {
                files: {
                    'js/main.js': ['js/main.js']
                }
            },
            // Html5 Shiv
            ie: {
                files: {
                    'js/vendor/html5shiv.js': ['bower_components/html5shiv/src/html5shiv.js']
                }
            }
        },
        // Compass
        compass: {
            dev: {
                options: {
                    config: 'config.dev.rb'
                }
            },
            prod: {
                options: {
                    config: 'config.rb'
                }
            }
        },
        // Watch
        watch: {
            js: {
                files: ['js/app.js'],
                tasks: ['concat'],
            },
            css: {
                files: ['sass/**/*.scss'],
                tasks: ['compass:dev'],
            },
            options:{
                livereload: {
                    files: [
                        '*.html',
                        'css/{,*/}*.css',
                        'js/{,*/}*.js',
                        'img/{,*/}*.{png,jpg,jpeg,gif,webp}'
                    ],
                    tasks: ['livereload']
                }
            }
            
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('build',     ['concat', 'uglify', 'compass:prod']);
    grunt.registerTask('default',   ['concat', 'uglify', 'compass:dev']);
};
