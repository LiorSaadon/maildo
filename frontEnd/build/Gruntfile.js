module.exports = function(grunt) {

    grunt.initConfig({

        pkg:grunt.file.readJSON('package.json'),

        //-------------------------------------------------------

        compass:{
            dist:{
                options:{
                    basePath:'../app/common/compass',
                    config:'../app/common/compass/config.rb',
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
                '../target/app/common/js',
                '../target/app/common/data',
                '../target/app/common/ui/scss',
                '../target/app/common/compass',
                '../target/app/common/ui/components',
                '../target/app/modules',
                '../target/app/frame',
                '../target/build',
                '../target/vendor/compass',
                '../target/vendor/chai',
                '../target/vendor/mocha',
                '../target/vendor/sinon',
                '../target/vendor/squire',
                '../target/vendor/blanket',
                '../target/tests',
                '../target/debug',
                '../target/*.txt'
            ],
            ci:[
                '../../ci/frontEnd'
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
                    {src: ['../../app.js'],dest: '../../ci/app.js'},
                    {src: ['../../package.json'],dest: '../../ci/package.json'},
                    {expand: true, cwd: '../target/', src: ['**'], dest: '../../ci/frontEnd'},
                    {expand: true, cwd: '../app/common/data', src: ['*txt'], dest: '../../ci/frontEnd/app/common/data'},
                    {expand: true, cwd: '../../backEnd', src: ['**'], dest: '../../ci/backEnd'}
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
        'requirejs',
        'clean:target',
        'replace:version',
        'clean:ci',
        'copy:target2ci'
    ]);
};
