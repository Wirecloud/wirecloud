/*!
 *   Copyright 2014-2015 CoNWeT Lab., Universidad Politecnica de Madrid
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */


var styledElementsFiles = [
    'Utils.js',
    'Event.js',
    'ObjectWithEvents.js',
    'StyledElements.js',
    'InputElement.js',
    'CommandQueue.js',
    'Container.js',
    'Addon.js',
    'Accordion.js',
    'Expander.js',
    'Fragment.js',
    'PaginatedSource.js',
    'GUIBuilder.js',
    'Tooltip.js',
    'Button.js',
    'FileButton.js',
    'PopupMenuBase.js',
    'PopupMenu.js',
    'DynamicMenuItems.js',
    'MenuItem.js',
    'Separator.js',
    'SubMenuItem.js',
    'PopupButton.js',
    'StaticPaginatedSource.js',
    'FileField.js',
    'NumericField.js',
    'TextField.js',
    'TextArea.js',
    'List.js',
    'PasswordField.js',
    'Select.js',
    'ToggleButton.js',
    'Pills.js',
    'Tab.js',
    'Notebook.js',
    'Alternative.js',
    'Alternatives.js',
    'HorizontalLayout.js',
    'BorderLayout.js',
    'ModelTable.js',
    'EditableElement.js',
    'HiddenField.js',
    'ButtonsGroup.js',
    'CheckBox.js',
    'RadioButton.js',
    'InputInterface.js',
    'TextInputInterface.js',
    'InputInterfaces.js',
    'VersionInputInterface.js',
    'InputInterfaceFactory.js',
    'DefaultInputInterfaceFactory.js',
    'Form.js',
    'PaginationInterface.js',
    'Popover.js'
];


module.exports = function (grunt) {

    'use strict';

    grunt.initConfig({

        uglify: {
            my_target: {
                files: {
                    'StyledElements.min.js': styledElementsFiles
                }
            }
        },

        jasmine: {

            test: {
                src: styledElementsFiles,
                options: {
                    specs: 'StyledElementsSpec.js'
                }
            },

            coverage: {
                src: '<%= jasmine.test.src %>',
                options: {
                    summary: true,
                    junit: {
                        path: 'build/junit'
                    },
                    specs: '<%= jasmine.test.options.specs %>',
                    vendor: '<%= jasmine.test.options.vendor %>',
                    template: require('grunt-template-jasmine-istanbul'),
                    templateOptions: {
                        coverage: 'build/coverage/json/coverage.json',
                        report: [
                            {type: 'html', options: {dir: 'build/coverage/html'}},
                            {type: 'cobertura', options: {dir: 'build/coverage/xml'}},
                            {type: 'text-summary'}
                        ]
                    }
                }
            }
        },

        jscs: {
            all: {
                src: styledElementsFiles,
                options: {
                    config: true
                }
            }
        },

        jshint: {
            options: {
                jshintrc: true
            },
            all: {
                files: {
                    src: styledElementsFiles
                }
            },
        }

    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks("grunt-jscs");

    grunt.registerTask('test', [
        'jshint',
        'jscs',
        'jasmine:test'
    ]);

    grunt.registerTask('default', [
        'test',
        'uglify'
    ]);
};
