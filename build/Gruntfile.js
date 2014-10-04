module.exports = function(grunt) {

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
            target:[
                '../public/target/app/assets/js',
                '../public/target/app/assets/data',
                '../public/target/app/assets/ui/scss',
                '../public/target/app/assets/ui/components',
                '../public/target/app/core',
                '../public/target/app/modules',
                '../public/target/build',
                '../public/target/lib/compass',
                '../public/target/debug',
                '../public/target/*.txt'
            ],
            ci:[
                '../../mailbone-prod/public'
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
                    {expand: true, cwd: '../public/target/', src: ['**'],dest: '../../mailbone-prod/public'}
                ]
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
        'clean:target',
        'replace:version',
        'clean:ci',
        'copy:target2ci'
    ]);
};
