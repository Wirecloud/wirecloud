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
    'wirecloud/commons/static/js/StyledElements/Accordion.js',
    'wirecloud/commons/static/js/StyledElements/Expander.js',
    'wirecloud/commons/static/js/StyledElements/Fragment.js',
    'wirecloud/commons/static/js/StyledElements/PaginatedSource.js',
    'wirecloud/commons/static/js/StyledElements/GUIBuilder.js',
    'wirecloud/commons/static/js/StyledElements/Tooltip.js',
    'wirecloud/commons/static/js/StyledElements/Addon.js',
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

var wc_dependencies = [
    'js_tests/wirecloud/bootstrap.js',
];

var WirecloudFiles = [
    'wirecloud/platform/static/js/wirecloud/constants.js',
    'wirecloud/platform/static/js/wirecloud/core.js',
    'wirecloud/platform/static/js/wirecloud/LogManager.js',
    'wirecloud/platform/static/js/wirecloud/Version.js',
    'wirecloud/platform/static/js/wirecloud/Wiring.js',
    'wirecloud/platform/static/js/wirecloud/ui/WiringEditor.js',
    'wirecloud/platform/static/js/wirecloud/ui/WiringEditor/Endpoint.js',
    'wirecloud/platform/static/js/wirecloud/wiring/KeywordSuggestion.js',
    'wirecloud/platform/static/js/wirecloud/wiring/Endpoint.js',
    'wirecloud/platform/static/js/wirecloud/wiring/EndpointTypeError.js',
    'wirecloud/platform/static/js/wirecloud/wiring/EndpointValueError.js',
    'wirecloud/platform/static/js/wirecloud/wiring/SourceEndpoint.js',
    'wirecloud/platform/static/js/wirecloud/wiring/TargetEndpoint.js',
    'wirecloud/platform/static/js/wirecloud/wiring/MissingEndpoint.js',
    'wirecloud/platform/static/js/wirecloud/wiring/WidgetSourceEndpoint.js',
    'wirecloud/platform/static/js/wirecloud/wiring/WidgetTargetEndpoint.js',
    'wirecloud/platform/static/js/wirecloud/wiring/OperatorSourceEndpoint.js',
    'wirecloud/platform/static/js/wirecloud/wiring/OperatorTargetEndpoint.js',
    'wirecloud/platform/static/js/wirecloud/wiring/Connection.js'
];

module.exports = function (grunt) {

    'use strict';

    grunt.initConfig({

        karma: {
            options: {
                frameworks: ['jasmine'],
                reporters: ['progress', 'coverage'],
                browsers: ['Chrome', 'Firefox'],
                singleRun: true
            },
            styledelements: {
                options: {
                    coverageReporter: {
                        type : 'html',
                        dir : 'build/coverage/styledelements'
                    },
                    files: dependencies.concat(styledElementsFiles).concat(['js_tests/styledelements/*Spec.js']),
                    preprocessors: {
                        "wirecloud/commons/static/js/StyledElements/*.js": ['coverage'],
                    }
                }
            },
            wirecloud: {
                options: {
                    coverageReporter: {
                        type : 'html',
                        dir : 'build/coverage/wirecloud'
                    },
                    files: dependencies.concat(styledElementsFiles).concat(wc_dependencies).concat(WirecloudFiles).concat(['js_tests/wirecloud/**/*Spec.js']),
                    preprocessors: {
                        "wirecloud/platform/static/js/wirecloud/**/*.js": ['coverage'],
                    }
                }
            }
        },

        jscs: {
            styledelements: {
                src: styledElementsFiles,
                options: {
                    config: true
                }
            },
            wirecloud: {
                src: WirecloudFiles,
                options: {
                    config: true
                }
            },
            specs: {
                src: 'js_tests/**/*Spec.js',
                options: {
                    config: true
                }
            }
        },

        jsdoc: {
            styledelements: {
                src: styledElementsFiles,
                options: {
                    destination: 'dist/docs/styledelements',
                    configure: '.jsdocrc'
                }
            },
            wirecloud: {
                src: WirecloudFiles,
                options: {
                    destination: 'dist/docs/wirecloud',
                    configure: '.jsdocrc'
                }
            }
        },

        jshint: {
            options: {
                jshintrc: true
            },
            styledelements: {
                files: {
                    src: styledElementsFiles
                }
            },
            wirecloud: {
                files: {
                    src: WirecloudFiles
                }
            },
            specs: {
                files: {
                    src: 'js_tests/**/*Spec.js',
                }
            }
        },

        uglify: {
            styledelements: {
                files: {
                    'dist/StyledElements.min.js': styledElementsFiles
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks("grunt-jscs");
    grunt.loadNpmTasks("grunt-jsdoc");

    grunt.registerTask('test', [
        'jshint',
        'jscs',
        'karma'
    ]);

    grunt.registerTask('default', [
        'test',
        'uglify',
        'jsdoc'
    ]);
};
