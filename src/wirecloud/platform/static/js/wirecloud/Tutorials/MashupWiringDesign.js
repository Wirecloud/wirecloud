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

    var header = {

        'getOption': function getOption(optionName) {
            return document.querySelector('.wirecloud_toolbar .' + optionName);
        }

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
        },

        'enableBehaviours': function enableBehaviours() {
            return document.querySelector('.wiring-sidebar .panel-behaviours .opt-enable-behaviours');
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

    var sleep = function sleep(milliseconds, autoAction) {
        setTimeout(function () {
            autoAction.nextHandler();
        }, milliseconds * 1000);
    };

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
    var createWorkspaceFromMashup = function createWorkspaceFromMashup(name, mashup, autoAction) {
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

    var uploadComponent = function uploadComponent(id, filename, autoAction) {
        if (!Wirecloud.LocalCatalogue.resourceExistsId(id)) {
            Wirecloud.LocalCatalogue.addResourceFromURL(build_static_url('tutorial-data/' + filename), {
                onSuccess: autoAction.nextHandler.bind(autoAction)
            });
        } else {
            autoAction.nextHandler();
        }
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
            type: 'autoAction',
            action: createWorkspaceFromMashup.bind(null, 'MWD Tutorial', 'CoNWeT/Mashup-Wiring-Design-Tutorial/0.0.1')
        },
        {
            type: 'autoAction',
            action: uploadComponent.bind(null, 'CoNWeT/technical-service/0.0.3', 'CoNWeT_technical-service_0.0.3.wgt')
        },
        {
            type: 'simpleDescription',
            title: gettext("Mashup Wiring Design Tutorial"),
            msg: gettext(
                "<p>Great! As you can see, the <strong>Mashup Wiring Design Tutorial</strong> " +
                "was installed and applied successfully.</p>" +

                "<div class=\"alert alert-info\">" +
                "<p><strong>NOTE:</strong> In addition to installing the mashup above, " +
                "the operator <strong>Technician Service</strong> was installed too.</p>" +
                "</div>")
        },

        // Step 1: identify the behaviours

        {
            type: 'simpleDescription',
            title: gettext("Step 1: identify the behaviours"),
            msg: gettext(
                "<p>Completed the above, let's start with understanding the different behaviours " +
                "you will find in this mashup.</p>")
        },

        {
            type: 'autoAction',
            msg: gettext("A <strong>behaviour (1)</strong> would be to type the technician name..."),
            elem: workspaceView.getWidgetByName.bind(null, 'Search for'),
            pos: 'topRight',
            action: sleep.bind(null, 4)
        },
        {
            type: 'autoAction',
            msg: gettext("...and the technician is found here."),
            elem: workspaceView.getWidgetByName.bind(null, 'Technicians'),
            pos: 'topRight',
            action: sleep.bind(null, 4)
        },

        {
            type: 'autoAction',
            msg: gettext("Another <strong>behaviour (2)</strong> would be to select a technician..."),
            elem: workspaceView.getWidgetByName.bind(null, 'Technicians'),
            pos: 'topRight',
            action: sleep.bind(null, 4)
        },
        {
            type: 'autoAction',
            msg: gettext("...and their vCard is displayed here."),
            elem: workspaceView.getWidgetByName.bind(null, 'Technician vCard'),
            pos: 'topRight',
            action: sleep.bind(null, 4)
        },

        {
            type: 'autoAction',
            msg: gettext("Another <strong>behaviour (3)</strong> would be to select a technician..."),
            elem: workspaceView.getWidgetByName.bind(null, 'Technicians'),
            pos: 'topRight',
            action: sleep.bind(null, 4)
        },
        {
            type: 'autoAction',
            msg: gettext("...and their current location is displayed here."),
            elem: workspaceView.getWidgetByName.bind(null, 'Map Viewer'),
            pos: 'topRight',
            action: sleep.bind(null, 4)
        },

        {
            type: 'autoAction',
            msg: gettext("The last <strong>behaviour (4)</strong> would be to select a technician..."),
            elem: workspaceView.getWidgetByName.bind(null, 'Technicians'),
            pos: 'topRight',
            action: sleep.bind(null, 4)
        },
        {
            type: 'autoAction',
            msg: gettext("...and the video call is enabled."),
            elem: workspaceView.getWidgetByName.bind(null, 'Video Call'),
            pos: 'topLeft',
            action: sleep.bind(null, 4)
        },
        {
            type: 'simpleDescription',
            title: gettext("Mashup Wiring Design Tutorial"),
            msg: gettext("<p>As next step, let's design the mashup wiring using behaviours.</p>")
        },
        {
            type: 'userAction',
            msg: gettext("<strong>You:</strong> click here to continue"),
            elem: BS.toolbar_button.bind(null, 'icon-puzzle-piece'),
            pos: 'downLeft'
        },

        // Step 2 - design the first behaviour

        {
            type: 'simpleDescription',
            title: gettext("Step 2 - design the behaviours identified"),
            msg: gettext(
                "<p>At this point you are going to perform basic actions as well as to:</p>" +
                "<p> - Create a behaviour and update its basic information.</p>" +
                "<p> - Connect two components (widget/operator) through their endpoints.</p>" +
                "<p> - Share components and connections between the behaviours.</p>" +
                "<div class=\"alert alert-info\">" +
                "<p><strong>NOTE:</strong> The repetitive actions will be performed by the platform to make the tutorial faster.</p>" +
                "</div>")
        },
        // Step 2 - Design the first behavior
        {
            type: 'simpleDescription',
            title: gettext("Step 2 - design the behaviours identified"),
            msg: gettext("<p>First of all, let's enable the behaviours.</p>")
        },
        {
            type: 'autoAction',
            msg: gettext("Open <em>behaviours identified</em>"),
            elem: header.getOption.bind(null, 'opt-behaviours'),
            pos: 'downLeft',
            action: autoSelect.bind(null, 1)
        },
        {
            type: 'autoAction',
            msg: gettext("Enable <em>behaviours</em>"),
            elem: wiringView.enableBehaviours.bind(null),
            pos: 'downLeft',
            action: autoSelect.bind(null, 1)
        },

        {
            type: 'simpleDescription',
            title: gettext("Step 2 - design the behaviours identified"),
            msg: gettext("<p>First, we will add the web applications which are necessary for this behavior.</p>")
        },

        // Step 2 - Design the first behavior - Add web apps
        {
            type: 'autoAction',
            msg: gettext("Open <em>Apps Panel</em>"),
            elem: wiringView.getToolBarOption.bind(null, 'show-panel-apps'),
            pos: 'topRight',
            action: autoSelect.bind(null, 1)
        },
        {
            type: 'autoAction',
            msg: gettext("Open <em>Widgets Section</em>"),
            elem: wiringView.getWidgetOption.bind(null),
            pos: 'topRight',
            action: autoSelect.bind(null, 1)
        },
        {
            type: 'userAction',
            msg: gettext("<strong>You:</strong> Drag &amp; drop the web app to continue"),
            elem: wiringView.getWidgetByName.bind(null, 'Text-oriented Field'),
            pos: 'downRight',
            'restartHandlers': [
                {'element': get_wiring, 'event': 'widgetaddfail'},
            ],
            'event': 'widgetadded',
            'eventToDeactivateLayer': 'mousedown',
            'elemToApplyNextStepEvent': get_wiring,
        },

        /*{
            type: 'simpleDescription',
            title: gettext("Step 1 - Identification of the behaviours"),
            msg: gettext(
                "<p>For example, a behaviour would be if you want to find a technician " +
                "from a given name in a list of technicians.</p>")
        },*/

        /*{
            type: 'simpleDescription',
            title: gettext("Step 1 - Identification of the behaviours"),
            msg: gettext(
                "<p>Another behaviour would be if you want to know the current location " +
                "of a technician after selecting one.</p>")
        },*/

        {
            type: 'simpleDescription',
            title: gettext("Step 1 - Identify behaviors"),
            msg: gettext(
                "<p>The last behaviour would be if you want to make a video call " +
                "the technician selected after watching their availability.</p>")
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
