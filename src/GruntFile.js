/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/*
 * This GruntFile is only used for building the StyledElements minimizied
 * version and passing the tests for this framework
 */

var dependencies = [
    'wirecloud/platform/static/js/common/ComputedStyle.js',
    'wirecloud/commons/static/js/lib/moment-with-locales.min.js',
];

var styledElementsFiles = [
    'wirecloud/commons/static/js/StyledElements/Utils.js',
    'wirecloud/commons/static/js/StyledElements/Event.js',
    'wirecloud/commons/static/js/StyledElements/ObjectWithEvents.js',
    'wirecloud/commons/static/js/StyledElements/StyledElements.js',
    'wirecloud/commons/static/js/StyledElements/OffCanvasLayout.js',
    'wirecloud/commons/static/js/StyledElements/InputElement.js',
    'wirecloud/commons/static/js/StyledElements/CommandQueue.js',
    'wirecloud/commons/static/js/StyledElements/Container.js',
    'wirecloud/commons/static/js/StyledElements/Addon.js',
    'wirecloud/commons/static/js/StyledElements/Accordion.js',
    'wirecloud/commons/static/js/StyledElements/Expander.js',
    'wirecloud/commons/static/js/StyledElements/Fragment.js',
    'wirecloud/commons/static/js/StyledElements/PaginatedSource.js',
    'wirecloud/commons/static/js/StyledElements/GUIBuilder.js',
    'wirecloud/commons/static/js/StyledElements/Tooltip.js',
    'wirecloud/commons/static/js/StyledElements/Button.js',
    'wirecloud/commons/static/js/StyledElements/FileButton.js',
    'wirecloud/commons/static/js/StyledElements/PopupMenuBase.js',
    'wirecloud/commons/static/js/StyledElements/PopupMenu.js',
    'wirecloud/commons/static/js/StyledElements/DynamicMenuItems.js',
    'wirecloud/commons/static/js/StyledElements/MenuItem.js',
    'wirecloud/commons/static/js/StyledElements/Separator.js',
    'wirecloud/commons/static/js/StyledElements/SubMenuItem.js',
    'wirecloud/commons/static/js/StyledElements/PopupButton.js',
    'wirecloud/commons/static/js/StyledElements/StaticPaginatedSource.js',
    'wirecloud/commons/static/js/StyledElements/FileField.js',
    'wirecloud/commons/static/js/StyledElements/NumericField.js',
    'wirecloud/commons/static/js/StyledElements/TextField.js',
    'wirecloud/commons/static/js/StyledElements/TextArea.js',
    'wirecloud/commons/static/js/StyledElements/List.js',
    'wirecloud/commons/static/js/StyledElements/PasswordField.js',
    'wirecloud/commons/static/js/StyledElements/Select.js',
    'wirecloud/commons/static/js/StyledElements/ToggleButton.js',
    'wirecloud/commons/static/js/StyledElements/Pills.js',
    'wirecloud/commons/static/js/StyledElements/Tab.js',
    'wirecloud/commons/static/js/StyledElements/Notebook.js',
    'wirecloud/commons/static/js/StyledElements/Alternative.js',
    'wirecloud/commons/static/js/StyledElements/Alternatives.js',
    'wirecloud/commons/static/js/StyledElements/HorizontalLayout.js',
    'wirecloud/commons/static/js/StyledElements/VerticalLayout.js',
    'wirecloud/commons/static/js/StyledElements/BorderLayout.js',
    'wirecloud/commons/static/js/StyledElements/ModelTable.js',
    'wirecloud/commons/static/js/StyledElements/EditableElement.js',
    'wirecloud/commons/static/js/StyledElements/HiddenField.js',
    'wirecloud/commons/static/js/StyledElements/ButtonsGroup.js',
    'wirecloud/commons/static/js/StyledElements/CheckBox.js',
    'wirecloud/commons/static/js/StyledElements/RadioButton.js',
    'wirecloud/commons/static/js/StyledElements/InputInterface.js',
    'wirecloud/commons/static/js/StyledElements/TextInputInterface.js',
    'wirecloud/commons/static/js/StyledElements/InputInterfaces.js',
    'wirecloud/commons/static/js/StyledElements/VersionInputInterface.js',
    'wirecloud/commons/static/js/StyledElements/InputInterfaceFactory.js',
    'wirecloud/commons/static/js/StyledElements/DefaultInputInterfaceFactory.js',
    'wirecloud/commons/static/js/StyledElements/Form.js',
    'wirecloud/commons/static/js/StyledElements/PaginationInterface.js',
    'wirecloud/commons/static/js/StyledElements/Popover.js'
];


module.exports = function (grunt) {

    'use strict';

    grunt.initConfig({

        uglify: {
            my_target: {
                files: {
                    'dist/StyledElements.min.js': styledElementsFiles
                }
            }
        },

        karma: {
            options: {
                files: dependencies.concat(styledElementsFiles).concat(['js_tests/*Spec.js']),
                frameworks: ['jasmine'],
                reporters: ['progress', 'coverage'],
                preprocessors: {
                    "wirecloud/commons/static/js/StyledElements/*.js": ['coverage'],
                },
                coverageReporter: {
                    type : 'html',
                    dir : 'build/coverage/'
                },
                browsers: ['Chrome', 'Firefox'],
                singleRun: true
            },
            chrome: {
                browsers: ['Chrome']
            },
            firefox: {
                browsers: ['Firefox']
            }
        },

        jscs: {
            lib: {
                src: styledElementsFiles,
                options: {
                    config: true
                }
            },
            specs: {
                src: 'js_tests/*Spec.js',
                options: {
                    config: true
                }
            }
        },

        jshint: {
            options: {
                jshintrc: true
            },
            lib: {
                files: {
                    src: styledElementsFiles
                }
            },
            specs: {
                files: {
                    src: 'js_tests/*Spec.js'
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks("grunt-jscs");

    grunt.registerTask('test', [
        'jshint',
        'jscs',
        'karma'
    ]);

    grunt.registerTask('default', [
        'test',
        'uglify'
    ]);
};
