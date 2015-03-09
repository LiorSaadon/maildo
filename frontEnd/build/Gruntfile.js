module.exports = function(grunt) {

    grunt.initConfig({

        pkg:grunt.file.readJSON('package.json'),

        //-------------------------------------------------------

        compass:{
            dist:{
                options:{
                    basePath:'../app/assets/compass',
                    config:'../app/assets/compass/config.rb',
                    environment:'production'
                }
            }
        },

        //-------------------------------------------------------

        jshint:{
            options:{
                jshintrc:".jshintrc"
            },
            uses_defaults:['../app/**/*.js']
        },

        //-------------------------------------------------------

        connect: {
            server: {
                options: {
                    port:8888,
                    base: '../'
                }
            }
        },

        //-------------------------------------------------------

        mocha: {
            test: {
                options: {
                    urls: [
                        'http://localhost:8888/tests/setup/testRunner1.html?testName=test1',
                        'http://localhost:8888/tests/setup/testRunner1.html?testName=test2'
                    ]
                }
            }
        },

        //-------------------------------------------------------

        requirejs: {
            compile: {
                options: grunt.file.readJSON('app.build.json')
            }
        },
        //-------------------------------------------------------

        uglify: {
            i18n: {
                files: {
                    '../target/app/assets/ui/i18n/en-US.js' : '../target/app/assets/ui/i18n/en-US.js',
                    '../target/app/assets/ui/i18n/es-ES.js' : '../target/app/assets/ui/i18n/es-ES.js'
                }
            }
        },

        //-------------------------------------------------------

        clean:{
            options:{
                force:true
            },
            target:[
                '../target/app/assets/js',
                '../target/app/assets/data',
                '../target/app/assets/ui/scss',
                '../target/app/assets/compass',
                '../target/app/assets/ui/components',
                '../target/app/core',
                '../target/app/modules',
                '../target/build',
                '../target/vendor/compass',
                '../target/debug',
                '../target/*.txt'
            ],
            ci:[
                '../../mailbone-ci/frontEnd'
            ]
        },

        //-------------------------------------------------------

        replace:{
            version:{
                options:{
                    variables:{
                        version: (new Date()).getTime().toString()
                    }
                },
                files:[
                    { src:['../target/index.html'], dest:'../target/index.html' },
                    { src:['../target/app/setup/init.js'], dest:'../target/app/setup/init.js' }
                ]
            }
        },

        //-------------------------------------------------------

        copy: {
            target2ci: {
                files: [
                    {expand: true, cwd: '../target/', src: ['**'],dest: '../../mailbone-ci/frontEnd'},
                    {expand: true, cwd: '../app/assets/data', src: ['*txt'],dest: '../../mailbone-ci/frontEnd/app/assets/data'}
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-contrib-connect');


    grunt.registerTask("quick", [
        'jshint'
    ]);

    grunt.registerTask("test", [
        'jshint',
        'connect',
        'mocha'
    ]);

    grunt.registerTask('default', [
        'compass',
        'jshint',
//        'connect',
//        'mocha',
        'requirejs',
        'clean:target',
        'replace:version',
        'clean:ci',
        'copy:target2ci'
    ]);
};
