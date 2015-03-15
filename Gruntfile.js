module.exports = function(grunt) {
    "use strict";

    require('load-grunt-tasks')(grunt);

    var banner =
        '/*!\n<%= libName %>.js - v<%= pkg.version %>\n' +
            'Created by <%= pkg.author %> on <%=grunt.template.today("yyyy-mm-dd") %>.\n\n' +
            '<%= pkg.repository.url %>\n\n' +
            '<%= license %> \n' +
            '*/';
    var minBanner = '/*! <%= libName %>.js - v<%= pkg.version %> - by <%= pkg.author %> ' +
        '<%= grunt.template.today("yyyy-mm-dd") %> */';


    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        license: grunt.file.read("LICENSE"),
        libName: "di",
        srcDir: "src",
        buildDir: "build",
        testDir: "test",
        distDir: "dist",

        clean: [ "<%= buildDir %>", "<%= distDir %>" ],

        browserify: {
            dev: {
                options: {
                    browserifyOptions: {
                        standalone: "di"
                    }
                },

                files: {
                    "<%= buildDir %>/<%= libName %>.js" : "<%= srcDir %>/<%= libName %>.js"
                }
            },

            unit: {
                options: {
                    browserifyOptions: {
                        debug: true
                    }
                },

                files: {
                    "<%= buildDir %>/<%= libName %>.spec.js" : "<%= testDir %>/**/*.spec.js"
                }
            }
        },

        uglify: {
            options: {
                banner: minBanner
            },

            dev: {
                files: {
                    "<%= distDir %>/<%= libName %>.min.js": "<%= buildDir %>/<%= libName %>.js"
                }
            }
        },

        concat: {
            dist: {
                options: {
                    banner: banner + "\n\n"
                },
                files: {
                    "<%= distDir %>/<%= libName %>.js": "<%= buildDir %>/<%= libName %>.js"
                }
            }
        },

        jshint: {
            options: {
                jshintrc: true
            },

            dev: ["<%= srcDir %>/**/*.js"],
            test: ["<%= testDir %>/**/*.spec.js"]
        },

        karma: {
            options: {
                configFile: "<%= testDir %>/karma.conf.js",
                autoWatch: false
            },

            unit: {
                background: true,
                singleRun: false
            },

            continous: {
                singleRun: true
            }
        },

        watch: {
            dev: {
                files: ["<%= srcDir %>/**/*.js", "<%= testDir %>/**/*.spec.js"],
                tasks: ["browserify:unit", "karma:unit:run", "jshint"]
            }
        },

        connect: {
            dev: {
                options: {
                    port: 8000
                }

            }
        }
    });

    grunt.registerTask("dev", ["connect", "karma:unit", "watch"]);
    grunt.registerTask("test", ["browserify:unit", "karma:continous"]);
    grunt.registerTask("dist", ["clean", "browserify:dev", "uglify", "concat", "karma:unit", "jshint"]);
};