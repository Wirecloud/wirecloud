/*
 *  This file is part of Wirecloud.
 *  Copyright (C) 2015  CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *  Wirecloud is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  License, or (at your option) any later version.
 *
 *  Wirecloud is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.
 */


/*global StyledElements, Wirecloud */

(function () {

    "use strict";

    var installVCardToPOI = function installVCardToPOI(autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId('CoNWeT/vcard-to-poi/0.0.2')) {
            Wirecloud.LocalCatalogue.addResourceFromURL(build_static_url('tutorial-data/CoNWeT_input-box_1.0.wgt'), {
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
    };

    var getWidgetAvailable = function getWidgetAvailable(index, openPanel) {
        var widget_id = Wirecloud.activeWorkspace.getIWidgets()[index].id;
        var wiringView = LayoutManagerFactory.getInstance().viewsByName.wiring;

        if (openPanel) {
            document.querySelectorAll('.wiring_editor .menubar .resource-item')[0].classList.add('active');
            document.querySelectorAll('.wiring_editor .menubar .panel-components')[0].style.display = 'block';
        }

        return wiringView.mini_widgets[widget_id].wrapperElement;
    };

    var getOperatorByName = function getOperatorByName(operatorName) {
        document.querySelectorAll('.wiring_editor .menubar .resource-item')[0].click();
        document.querySelectorAll('.wiring_editor .menubar .panel-components .panel-options .option')[0].click();

        var operators = document.querySelectorAll('.wiring_editor .menubar .panel-components .ioperator');

        for (var i = 0; i < operators.length; i++) {
            if (operators[i].querySelector('.header span').textContent == operatorName) {
                return operators[i];
            }
        }

        return;
    };

    var get_wiring = function get_wiring() {
        return LayoutManagerFactory.getInstance().viewsByName["wiring"];
    };

    var getToolBarOption = function getToolBarOption(option_name) {
        var options = document.querySelectorAll('.wiring_editor .menubar .resource-item');

        switch (option_name) {
            case 'show-panel-apps':
                return options[0];
            case 'show-panel-behaviors':
                return options[2];
            case 'create-behavior':
                return options[1];
            case 'switch-view':
                return options[3];
            default:
                break;
        }

        return;
    };

    var openPanelApps = function openPanelApps() {
        return document.querySelectorAll('.wiring_editor .menubar .resource-item')[0];
    };

    var displayWidgetSection = function displayWidgetSection() {
        return document.querySelectorAll('.wiring_editor .menubar .panel-components .panel-options .option')[1];
    };

    var getSourceEndpoint = function getSourceEndpoint(instance_type, instance_name, endpoint_name) {
        var instances = document.querySelectorAll('.wiring_editor .grid .' + instance_type);
        var iSource;

        for (var i = 0; i < instances.length; i++) {
            if (instances[i].querySelector('.header span[title]').getAttribute('title') == instance_name) {
                iSource = instances[i];
                break;
            }
        }

        if (typeof iSource !== 'undefined') {
            var endpoints = iSource.querySelectorAll('.sources .labelDiv');

            for (var i = 0; i < endpoints.length; i++) {
                if (endpoints[i].textContent == endpoint_name) {
                    return endpoints[i].querySelector('.anchor');
                }
            }
        }

        return;
    };

    var createBehavior = function createBehavior(title, description) {
        var ModalCreation = document.querySelector('.behaviour_form');
        var fieldTitle = ModalCreation.querySelector('input[name="title"]');
        var fieldDescription = ModalCreation.querySelector('textarea[name="description"]');

        fieldTitle.value = title;
        fieldDescription.value = description;

        return ModalCreation.querySelectorAll('.window_bottom .styled_button')[0];
    };

    var updateBehavior = function updateBehavior(title, description) {
        var ModalCreation = document.querySelector('.behaviour_form');
        var fieldTitle = ModalCreation.querySelector('input[name="title"]');
        var fieldDescription = ModalCreation.querySelector('textarea[name="description"]');

        fieldTitle.value = title;
   fieldDescription.value = description;

        return ModalCreation.querySelectorAll('.window_bottom .styled_button')[0];
    };

    var getOptionShare = function getOptionShare(type, name) {
        var instances = document.querySelectorAll('.wiring_editor .grid .' + type + '.on-background');

        for (var i = 0; i < instances.length; i++) {
            if (instances[i].querySelector('.header span[title]').getAttribute('title') == name) {
                instances[i].classList.add('selected');
                return instances[i].querySelector('.header .closebutton');
            }
        }

        return;
    };

    var shareConnection = function shareConnection(connectionIndex) {
        var connections = document.querySelectorAll('.wiring_editor .grid .canvas .arrow.on-background');

        //connections[connectionIndex].classList.add('emphasize');

        return connections[connectionIndex]; //.querySelector('circle');
    };

    var getTargetEndpoint = function getTargetEndpoint(instance_type, instance_name, endpoint_name) {
        var instances = document.querySelectorAll('.wiring_editor .grid .' + instance_type);
        var iSource;

        for (var i = 0; i < instances.length; i++) {
            if (instances[i].querySelector('.header span[title]').getAttribute('title') == instance_name) {
                iSource = instances[i];
                break;
            }
        }

        if (typeof iSource !== 'undefined') {
            var endpoints = iSource.querySelectorAll('.targets .labelDiv');

            for (var i = 0; i < endpoints.length; i++) {
                if (endpoints[i].textContent == endpoint_name) {
                    return endpoints[i].querySelector('.anchor');
                }
            }
        }

        return;
    };

    var sleep = function sleep(milliseconds, autoAction) {
        setTimeout(function () {
            autoAction.nextHandler();
        }, milliseconds * 1000);
    };

    var autoSelect = function autoSelect(milliseconds, autoAction, element) {
        setTimeout(function () {
            element.click();
            autoAction.nextHandler();
        }, milliseconds * 1000);
    };

    var showBehaviorUpdateForm = function showBehaviorUpdateForm(behaviorIndex) {
        var behaviors = document.querySelectorAll('.wiring_editor .behaviour-group .behaviour');

        return behaviors[behaviorIndex].querySelector('.behaviour-header .option');
    };

    var get_wiring_canvas = function get_wiring_canvas() {
        var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
        return wiringEditor.canvas;
    };

    var getWidgetByName = function getWidgetByName(widgetName) {
        getToolBarOption('show-panel-apps').click();
        document.querySelectorAll('.wiring_editor .menubar .panel-components .panel-options .option')[1].click();

        var widgets = document.querySelectorAll('.wiring_editor .menubar .panel-components .iwidget');

        for (var i = 0; i < widgets.length; i++) {
            if (widgets[i].querySelector('.header span').textContent == widgetName) {
                return widgets[i];
            }
        }

        return;
    };

    var wiringView = {

        'getToolBarOption': function getToolBarOption(optionName) {
            var options = document.querySelectorAll('.wiring_editor .menubar .resource-item');

            switch (optionName) {
                case 'show-panel-apps':
                    return options[0];
                case 'create-behavior':
                    return options[1];
                case 'show-panel-behaviors':
                    return options[2];
                default:
                    break;
            }

            return options[3];
        },

        'getOperatorOption': function getOperatorOption() {
            return document.querySelectorAll('.wiring_editor .menubar .panel-components .panel-options .option')[0];
        },

        'getWidgetOption': function getWidgetOption() {
            return document.querySelectorAll('.wiring_editor .menubar .panel-components .panel-options .option')[1];
        },

        'getOperatorByName': function getOperatorByName(operatorName) {
            var operators = document.querySelectorAll('.wiring_editor .menubar .panel-components .ioperator');

            for (var i = 0; i < operators.length; i++) {
                if (operators[i].querySelector('.header span').textContent == operatorName) {
                    return operators[i];
                }
            }

            return;
        },

        'getWidgetByName': function getWidgetByName(widgetName) {
            var widgets = document.querySelectorAll('.wiring_editor .menubar .panel-components .iwidget');

            for (var i = 0; i < widgets.length; i++) {
                if (widgets[i].querySelector('.header span').textContent == widgetName) {
                    return widgets[i];
                }
            }

            return;
        }

    };

    var getTextField = function getTextField() {
        return document.getElementById('user-query');
    }

    var deploy_tutorial_menu = function deploy_tutorial_menu(autoAction) {
        getOptionShare('ioperator', 'Technical Service').click();
        autoAction.nextHandler();
    };

    var BS = Wirecloud.ui.Tutorial.utils.basic_selectors;
    var BA = Wirecloud.ui.Tutorial.utils.basic_actions;

    /**
     * @function
     * @private
     */
    var workspaceView = {

        'getWidgetByName': function getWidgetByName(name) {
            var i, widgetList;

            widgetList = document.querySelectorAll('.workspace .iwidget');

            for (i = 0; i < widgetList.length; i++) {
                if (widgetList[i].querySelector('.widget_menu span').textContent == name) {
                    return widgetList[i];
                }
            }

            return null;
        }

    };

    /**
     * @function
     * @private
     */
    var createWorkspace = function createWorkspace(name, mashup, autoAction) {
        LayoutManagerFactory.getInstance().changeCurrentView('workspace');

        Wirecloud.createWorkspace({
            name: name,
            mashup: mashup,
            onSuccess: function (workspace) {
                Wirecloud.changeActiveWorkspace(workspace, null, {
                    onSuccess: function () {
                        autoAction.nextHandler();
                    },
                    onFailure: function () {
                        autoAction.fail();
                    }
                });
            },
            onFailure: function (msg, details) {
                var dialog;

                if (details != null && 'missingDependencies' in details) {
                    dialog = new Wirecloud.ui.MissingDependenciesWindowMenu(retry.bind(null, data), details);
                } else {
                    dialog = new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG);
                }

                dialog.show();
            }
        });

    };

    Wirecloud.TutorialCatalogue.add('mashup-wiring-design', new Wirecloud.ui.Tutorial(gettext("Mashup Wiring Design"), [

        // Step 0: get ready the workspace

        {
            type: 'simpleDescription',
            title: gettext("Mashup Wiring Design Tutorial"),
            msg: gettext(
                "<p>Welcome to a basic tutorial of the Wirecloud Platform!</p>" +

                "<p>This step-by-step interactive tutorial will explain you how to perform the " +
                "<strong>Mashup Wiring Design</strong> using the new concept introduced, the behaviours.</p>" +

                "<p>First, a new workspace will be created for this tutorial and to this end, " +
                "a predefined mashup is going to be used as template.</p>")
        },

        {
            type: 'simpleDescription',
            title: gettext("Mashup Wiring Design Tutorial"),
            msg: gettext(
                "<p>Great! As you can see, the <strong>Mashup Wiring Design Tutorial</strong> " +
                "was installed and applied successfully.</p>" +

                "<p>Completed this, let's start with understanding the different behaviours " +
                "you will find in this mashup.</p>")
        },

        // Step 1: identify the behaviours

        {
            type: 'simpleDescription',
            title: gettext("Step 1 - Identification of the behaviours"),
            msg: gettext(
                "<p>For example, a behaviour would be if you want to find a technician " +
                "from a given name in a list of technicians.</p>")
        },

        {
            type: 'simpleDescription',
            title: gettext("Step 1 - Identification of the behaviours"),
            msg: gettext(
                "<p>Another behaviour would be if you want to know the current location " +
                "of a technician after selecting one.</p>")
        },

        {
            type: 'simpleDescription',
            title: gettext("Step 1 - Identify behaviors"),
            msg: gettext(
                "<p>The last behaviour would be if you want to make a video call " +
                "the technician selected after watching their availability.</p>")
        },

        {
            type: 'simpleDescription',
            title: gettext("Mashup Wiring Design Tutorial"),
            msg: gettext("<p>As next step, let's design the mashup wiring using behaviours.</p>")
        },
        {
            type: 'userAction',
            msg: gettext("Click here to continue"),
            elem: BS.toolbar_button.bind(null, 'icon-puzzle-piece'),
            pos: 'downLeft'
        },

        // Step 2 - design the first behaviour

        {
            type: 'simpleDescription',
            title: gettext("Step 2 - Design the identified behaviours"),
            msg: gettext(
                "<p>At this point you are going to perform basic actions like:</p>" +
                "<p>- adding a web application as wiring component.</p>" +
                "<p>- connect two different components through their endpoints</p>" +
                "<p>- create a new empty behaviour</p>" +
                "<p>- update the basic information of a behaviour</p>" +
                "<p>- and share a component or connection between the behaviours.</p>" +
                "<div class=\"alert alert-info\">" +
                "<p><strong>NOTE:</strong> The repetitive actions will be performed by the platform to make the tutorial faster.</p>" +
                "</div>")
        },

        {
            type: 'simpleDescription',
            title: gettext("Try it yourself"),
            msg: gettext("<p>Finally, it's time to check out the global behaviour of the mashup.</p>")
        },
        {
            type: 'userAction',
            msg: gettext("Click <em>Back</em> to continue"),
            elem: BS.back_button, 
            pos: 'downRight'
        }

    ]));

})();
