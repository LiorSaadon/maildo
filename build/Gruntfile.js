module.exports = function(grunt) {

    grunt.registerTask('prepareProd', 'bla', function (src, dest) {

        var fs = require('fs-extra');

        if(grunt.file.exists('d:/smd/mailbone-prod1')){
            grunt.file.delete('d:/smd/mailbone-prod1',{force: true});
        }

        grunt.file.mkdir('d:/smd/mailbone-prod1');
    });

    grunt.initConfig({

        pkg:grunt.file.readJSON('package.json'),

        //-------------------------------------------------------

        compass:{
            dist:{
                options:{
                    basePath:'../public/lib/compass',
                    config:'../public/lib/compass/config.rb',
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
            output:[
                '../public/target/app/assets/css/ie.css',
                '../public/target/app/assets/css/print.css',
                '../public/target/app/assets/css/screen.css',
                '../public/target/app/assets/js',
                '../public/target/app/assets/data',
                '../public/target/app/assets/scss',
                '../public/target/app/assets/ui/components',
                '../public/target/app/frame',
                '../public/target/app/modules',
                '../public/target/build',
                '../public/target/target',
                '../public/target/lib/compass',
                '../public/target/debug',
                '../public/target/*.txt'
            ]
        },

        //-------------------------------------------------------

        replace:{
            dist:{
                options:{
                    variables:{
                        version: (new Date()).getTime().toString()
                    }
                },
                files:[
                    { src:['../public/target/index.html'], dest:'../public/target/index.html' },
                    { src:['../public/app/setup/init.js'], dest:'../public/app/setup/init.js' }
                ]
            }
        },

        //-------------------------------------------------------

        copy: {
            targetFiles: {
                files: [
                    {expand: true, cwd: '../public/target/', src: ['**'],dest: 'd:/smd/mailbone-prod1/'}
                ]
            }
        },

        exec: {
            task1: {
                cmd: function(firstName, lastName) {
                    return "IF Exist 'd:/smd/mailbone-prod1' (rd 'd:/smd/mailbone-prod1' /S /Q);";
                }
            },
            task2: {
                cmd: "xcopy  public' 'mailbone-prod1'"
            }
        }
    });

    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-contrib-copy');


    grunt.registerTask("quick", [
        'jshint'
    ]);

    grunt.registerTask('default', [
        'compass',
        'jshint',
        'requirejs',
        'clean:output',
        //'prepareProd',
        //'copy:targetFiles'
        //'exec:task1',
        'exec:task2'
    ]);
};



//grunt.registerTask('install', 'install the backend and frontend dependencies', function() {
//    var async = require('async');
//    var exec = require('child_process').exec;
//    var done = this.async();
//
//    var runCmd = function(item, callback) {
//        process.stdout.write('running "' + item + '"...\n');
//        var cmd = exec(item);
//        cmd.stdout.on('data', function (data) {
//            grunt.log.writeln(data);
//        });
//        cmd.stderr.on('data', function (data) {
//            grunt.log.errorlns(data);
//        });
//        cmd.on('exit', function (code) {
//            if (code !== 0) throw new Error(item + ' failed');
//            grunt.log.writeln('done\n');
//            callback();
//        });
//    };
//
//    async.series({
//            npm: function(callback){
//                runCmd('npm install', callback);
//            },
//            bower: function(callback){
//                runCmd('bower install', callback);
//            }
//        },
//        function(err, results) {
//            if (err) done(false);
//            done();
//        });
//});