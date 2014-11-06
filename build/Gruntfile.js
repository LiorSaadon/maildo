module.exports = function(grunt) {

    grunt.initConfig({

        pkg:grunt.file.readJSON('package.json'),

        //-------------------------------------------------------

        compass:{
            dist:{
                options:{
                    basePath:'../public/app/assets/compass',
                    config:'../public/app/assets/compass/config.rb',
                    environment:'production'
                }
            }
        },

        //-------------------------------------------------------

        jshint:{
            options:{
                jshintrc:".jshintrc"
            },
            uses_defaults:['../public/app/**/*.js']
        },

        //-------------------------------------------------------

        connect: {
            server: {
                options: {
                    port: 8888,
                    base: '.'
                }
            }
        },

        //-------------------------------------------------------

        mocha: {
            test: {
                options: {
                    urls: [ 'http://localhost:8888/example/test/test2.html' ]
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
                    '../public/target/app/assets/ui/i18n/en-US.js' : '../public/target/app/assets/ui/i18n/en-US.js',
                    '../public/target/app/assets/ui/i18n/es-ES.js' : '../public/target/app/assets/ui/i18n/es-ES.js'
                }
            }
        },

        //-------------------------------------------------------

        clean:{
            options:{
                force:true
            },
            target:[
                '../public/target/app/assets/js',
                '../public/target/app/assets/data',
                '../public/target/app/assets/ui/scss',
                '../public/target/app/assets/compass',
                '../public/target/app/assets/ui/components',
                '../public/target/app/core',
                '../public/target/app/modules',
                '../public/target/build',
                '../public/target/vendor/compass',
                '../public/target/debug',
                '../public/target/*.txt'
            ],
            ci:[
                '../../mailbone-ci/public'
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
                    { src:['../public/target/index.html'], dest:'../public/target/index.html' },
                    { src:['../public/target/app/setup/init.js'], dest:'../public/target/app/setup/init.js' }
                ]
            }
        },

        //-------------------------------------------------------

        copy: {
            target2ci: {
                files: [
                    {expand: true, cwd: '../public/target/', src: ['**'],dest: '../../mailbone-ci/public'},
                    {expand: true, cwd: '../public/app/assets/data', src: ['*txt'],dest: '../../mailbone-ci/public/app/assets/data'}
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
