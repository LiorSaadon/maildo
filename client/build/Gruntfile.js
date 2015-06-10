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

        clean:{
            options:{
                force:true
            },
            target:[
                '../target',
                //'../target/app/common/data',
                //'../target/app/common/ui/scss',
                //'../target/app/common/compass',
                //'../target/app/common/ui/components',
                //'../target/app/modules',
                //'../target/app/frame',
                //'../target/build',
                //'../target/vendor/compass',
                //'../target/vendor/chai',
                //'../target/vendor/mocha',
                //'../target/vendor/sinon',
                //'../target/vendor/squire',
                //'../target/vendor/blanket',
                //'../target/tests',
                //'../target/debug',
                //'../target/*.txt'
            ],
            ci:[
                'd:/smd/maildo-openshift/client/app',
                //'d:/smd/maildo-openshift/client/vendor',
                'd:/smd/maildo-openshift/server'
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
                    { src:['../index1.html'], dest:'../index1.html' }
                ]
            }
        },

        //-------------------------------------------------------

        copy: {
            target2ci: {
                files: [
                    {src: ['../../server.js'], dest: 'd:/smd/maildo-openshift/server.js'},
                    {src: ['../../package.json'], dest: 'd:/smd/maildo-openshift/package.json'},
                    {src: ['../../favicon.ico'], dest: 'd:/smd/maildo-openshift/favicon.ico'},
                    {src: ['../../maildo.md'], dest: 'd:/smd/maildo-openshift/maildo.md'},
                    {src: ['../index1.html'], dest: 'd:/smd/maildo-openshift/client/index1.html'},
                    {expand: true, cwd: '../app', src: ['**'], dest: 'd:/smd/maildo-openshift/client/app'},
                    //{expand: true, cwd: '../vendor', src: ['**'], dest: 'd:/smd/maildo-openshift/client/vendor'},
                    //{expand: true, cwd: '../app/common/data', src: ['*txt'], dest: 'd:/smd/maildo-openshift/client/app/common/data'},
                    {expand: true, cwd: '../../server', src: ['**'], dest: 'd:/smd/maildo-openshift/server'}
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


    grunt.registerTask('default', [

        'compass',
        'jshint',
        //'requirejs',
        'clean:target',
        'replace:version',
        'clean:ci',
        'copy:target2ci'
    ]);
};
