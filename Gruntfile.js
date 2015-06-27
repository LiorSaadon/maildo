module.exports = function (grunt) {

    var vendors = ["jquery",
        "backbone",
        "backbone.marionette",
        "underscore",
        "underscore.string",
        "backbone.localstorage",
        "backbone-deep-model",
        "socket.io-client"];

    grunt.initConfig({

        compass:{
            dist:{
                options:{
                    basePath:'./client/src/common/compass',
                    config:'./client/src/common/compass/config.rb',
                    environment:'production'
                }
            }
        },

        jshint:{
            options:{
                jshintrc:".jshintrc"
            },
            uses_defaults:['./client/src/**/*.js']
        },

        clean:{
            options:{
                force:true
            },
            dist:[
                './client/dist/css',
                './client/*.js'
            ]
        },

        copy: {
            ui: {
                files: [
                    {expand: true, cwd: './client/src/common/ui/img', src: ['**'], dest: './client/dist/img'},
                    {expand: true, cwd: './client/src/common/ui/i18n', src: ['**'], dest: './client/dist/i18n'},
                    {src: ['./client/src/common/ui/css/login.css'], dest: './client/dist/css/login.css'},
                ]
            }
        },

        browserify: {
            app: {
                src: 'client/src/setup/init.js',
                dest: 'client/dist/init.js',
                options: {
                    debug: true,
                    extensions: ['.hbs'],
                    transform: ['hbsfy', 'babelify', 'brfs', 'aliasify'],
                    external: vendors
                }
            },
            vendors: {
                files: {
                    'client/dist/vendors.js': []
                },
                options: {
                    'require': vendors
                }
            }
        },

        uglify: {
            bundle: {
                src: 'client/dist/vendors.js',
                dest: 'client/dist/vendors.js'
            }
        },

        watch: {
            files: ['client/src/**/*'],
            tasks: ['browserify:app']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', [

        'jshint',
        'clean:dist',
        'copy:ui',
        'compass',
        'browserify:app',
        'browserify:vendors',
        //'uglify:bundle',
        'watch'
    ]);
};
