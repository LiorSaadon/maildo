module.exports = function(grunt) {

    grunt.initConfig({

        pkg:grunt.file.readJSON('package.json'),

        compass:{
            dist:{
                options:{
                    basePath:'../public/lib/compass',
                    config:'../public/lib/compass/config.rb',
                    environment:'production'
                }
            }
        },

        jshint:{
            options:{
                jshintrc:".jshintrc"
            },
            uses_defaults:['../public/app/**/*.js']
        },

        concat:{
            options:{
                separator:'' // we don't insert any separator between files
            },
            i18n:{
                files:{
                    "../public/target/lib/mailbone/ui/i18n/en-US.js": ["../public/app/frame/ui/i18n/en-US.js","../public/app/modules/mail/ui/i18n/en-US.js","../public/app/modules/tasks/ui/i18n/en-US.js"]
                    //"../public/target/app/common/ui/i18n/es-ES.js": ["../public/app/frame/ui/i18n/de-DE.js","../public/app/modules/mail/ui/i18n/de-DE.js","../public/app/modules/tasks/ui/i18n/de-DE.js"]
                }
            }
        },

        requirejs: {
            compile: {
                options: grunt.file.readJSON('app.build.json')
            }
        },

        uglify: {
            i18n: {
                files: {
                    '../public/target/lib/mailbone/ui/i18n/de-DE.js': ['../public/target/lib/mailbone/ui/i18n/de-DE.js']
                }
            }
        },

        clean:{
            options:{
                force:true
            },
            output:[
                '../public/target/app/common/css/ie.css',
                '../public/target/app/common/css/print.css',
                '../public/target/app/common/css/screen.css',
                '../public/target/app/common/js',
                '../public/target/app/common/data',
                '../public/target/app/common/scss',
                '../public/target/app/common/ui/components',
                '../public/target/app/frame',
                '../public/target/app/modules',
                '../public/target/build',
                '../public/target/target',
                '../public/target/lib/compass',
                '../public/target/debug',
                '../public/target/*.txt'
            ]
        },

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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-replace');


    grunt.registerTask("quick", [
        'jshint'
    ]);

    grunt.registerTask('default', [
        'compass',
        'jshint',
        'concat:i18n',
        'requirejs',
        'clean:output'
        //'replace'
    ]);
};