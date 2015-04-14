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

    var BS = Wirecloud.ui.Tutorial.Utils.basic_selectors;
    var BA = Wirecloud.ui.Tutorial.Utils.basic_actions;

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
        document.querySelector('.wiring-sidebar .opt-operator-group').click();

        var operators = document.querySelectorAll('.wiring-sidebar .panel-components .component-operator');

        for (var i = 0; i < operators.length; i++) {
            if (operators[i].querySelector('.component-heading span').textContent == operatorName) {
                return operators[i];
            }
        }

        return null;
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

    var getSourceEndpoint = function getSourceEndpoint(type, name, endpoint_name) {
        var instances = document.querySelectorAll('.wiring-diagram .component-' + type);
        var iSource = null;

        for (var i = 0; i < instances.length; i++) {
            if (instances[i].querySelector('.component-name').textContent == name) {
                iSource = instances[i];
                break;
            }
        }

        if (iSource != null) {
            var endpoints = iSource.querySelectorAll('.source-endpoints .endpoint');

            for (var i = 0; i < endpoints.length; i++) {
                if (endpoints[i].textContent == endpoint_name) {
                    return endpoints[i].querySelector('.endpoint-anchor');
                }
            }
        }

        return null;
    };

    var addBehaviour = function addBehaviour(title, description) {
        var behaviour = get_wiring().behaviourEngine.createBehaviour({
            'title': title,
            'description': description
        });

        get_wiring().behaviourEngine.appendBehaviour(behaviour);

        return behaviour.wrapperElement;
    };

    var updateBehaviour = function updateBehaviour() {
        var form = document.querySelector('.behaviour-update-form');

        return form.querySelectorAll('.window_bottom .styled_button')[0];
    };

    var getBehaviourUpdateFormTitle = function getBehaviourUpdateFormTitle(title) {
        var form = document.querySelector('.behaviour-update-form');
        var fieldTitle = form.querySelector('input[name="title"]');

        fieldTitle.value = title;

        return fieldTitle;
    };

    var getBehaviourUpdateFormDescription = function getBehaviourUpdateFormDescription(description) {
        var form = document.querySelector('.behaviour-update-form');
        var fieldDescription = form.querySelector('textarea[name="description"]');

        fieldDescription.value = description;

        return fieldDescription;
    };

    var createBehaviour = function createBehaviour() {
        var form = document.querySelector('.behaviour-registration-form');

        return form.querySelectorAll('.window_bottom .styled_button')[0];
    };

    var getBehaviourRegistrationFormTitle = function getBehaviourRegistrationFormTitle(title) {
        var form = document.querySelector('.behaviour-registration-form');
        var fieldTitle = form.querySelector('input[name="title"]');

        fieldTitle.value = title;

        return fieldTitle;
    };

    var getBehaviourRegistrationFormDescription = function getBehaviourRegistrationFormDescription(description) {
        var form = document.querySelector('.behaviour-registration-form');
        var fieldDescription = form.querySelector('textarea[name="description"]');

        fieldDescription.value = description;

        return fieldDescription;
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
        var connections = document.querySelectorAll('.wiring-connections .connection.on-background');

        return connections[connectionIndex].querySelector('.option-remove');
    };

    var getTargetEndpoint = function getTargetEndpoint(type, name, endpoint_name) {
        var instances = document.querySelectorAll('.wiring-diagram .component-' + type);
        var iSource = null;

        for (var i = 0; i < instances.length; i++) {
            if (instances[i].querySelector('.component-name').textContent == name) {
                iSource = instances[i];
                break;
            }
        }

        if (iSource != null) {
            var endpoints = iSource.querySelectorAll('.target-endpoints .endpoint');

            for (var i = 0; i < endpoints.length; i++) {
                if (endpoints[i].textContent == endpoint_name) {
                    return endpoints[i].querySelector('.endpoint-anchor');
                }
            }
        }

        return null;
    };

    var showBehaviorUpdateForm = function showBehaviorUpdateForm(behaviorIndex) {
        var behaviors = document.querySelectorAll('.wiring_editor .behaviour-group .behaviour');

        return behaviors[behaviorIndex].querySelector('.behaviour-header .option');
    };

    var get_wiring_canvas = function get_wiring_canvas() {
        var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
        return wiringEditor.connectionEngine;
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

        'addComponent': function addComponent(type, name, x , y) {
            document.querySelector('.wiring-sidebar .opt-' + type + '-group').click();

            var component = get_wiring().addComponentByName(type, name, x, y);

            return component.wrapperElement;
        },

        'openBehaviourRegistrationForm': function openBehaviourRegistrationForm() {
            return document.querySelector('.wiring-sidebar .panel-behaviours .btn-create');
        },

        'connect': function connect(sourceEndpoint, targetEndpoint) {
            var connect = get_wiring().connectComponents(sourceEndpoint, targetEndpoint);

            return connect.wrapperElement;
        },

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
            document.querySelector('.wiring-sidebar .opt-operator-group').click();

            var operators = document.querySelectorAll('.wiring-sidebar .panel-components .component-operator');

            for (var i = 0; i < operators.length; i++) {
                if (operators[i].querySelector('.component-heading span').textContent == operatorName) {
                    return operators[i];
                }
            }

            return null;
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
        },

        'getBehaviour': function getBehaviour(index) {
            return document.querySelectorAll('.wiring-sidebar .panel-behaviours .behaviour')[index];
        },

        'activateBehaviour': function activateBehaviour(index) {
            return document.querySelectorAll('.wiring-sidebar .panel-behaviours .behaviour')[index].querySelector('.opt-activate');
        },

        'getBehaviourTitle': function getBehaviourTitle(index) {
            return document.querySelectorAll('.wiring-sidebar .panel-behaviours .behaviour')[index].querySelector('.behaviour-title');
        },

        'getBehaviourDescription': function getBehaviourDescription(index) {
            return document.querySelectorAll('.wiring-sidebar .panel-behaviours .behaviour')[index].querySelector('.behaviour-description');
        },

        'getBehaviourElements': function getBehaviourElements(index) {
            return document.querySelectorAll('.wiring-sidebar .panel-behaviours .behaviour')[index].querySelector('.behaviour-elements');
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
            action: BA.uploadComponent('CoNWeT/Mashup-Wiring-Design-Tutorial/0.0.1')
        },
        {
            type: 'autoAction',
            action: BA.uploadComponent('CoNWeT/technical-service/0.0.3')
        },
        {
            type: 'autoAction',
            action: createWorkspaceFromMashup.bind(null, 'MWD Tutorial', 'CoNWeT/Mashup-Wiring-Design-Tutorial/0.0.1')
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
            elem: BS.workspaceView.widget_by_title('Search for'),
            pos: 'topRight',
            action: BA.sleep(3000)
        },
        {
            type: 'autoAction',
            msg: gettext("...and the technician is found here."),
            elem: BS.workspaceView.widget_by_title('Technicians'),
            pos: 'topRight',
            action: BA.sleep(3000)
        },

        {
            type: 'autoAction',
            msg: gettext("Another <strong>behaviour (2)</strong> would be to select a technician..."),
            elem: BS.workspaceView.widget_by_title('Technicians'),
            pos: 'topRight',
            action: BA.sleep(3000)
        },
        {
            type: 'autoAction',
            msg: gettext("...and their vCard is displayed here."),
            elem: BS.workspaceView.widget_by_title('Technician vCard'),
            pos: 'topRight',
            action: BA.sleep(3000)
        },

        {
            type: 'autoAction',
            msg: gettext("Another <strong>behaviour (3)</strong> would be to select a technician..."),
            elem: BS.workspaceView.widget_by_title('Technicians'),
            pos: 'topRight',
            action: BA.sleep(3000)
        },
        {
            type: 'autoAction',
            msg: gettext("...and their current location is displayed here."),
            elem: BS.workspaceView.widget_by_title('Map Viewer'),
            pos: 'topRight',
            action: BA.sleep(3000)
        },

        {
            type: 'autoAction',
            msg: gettext("The last <strong>behaviour (4)</strong> would be to select a technician..."),
            elem: BS.workspaceView.widget_by_title('Technicians'),
            pos: 'topRight',
            action: BA.sleep(3000)
        },
        {
            type: 'autoAction',
            msg: gettext("...and the video call is enabled."),
            elem: BS.workspaceView.widget_by_title('Video Call'),
            pos: 'topLeft',
            action: BA.sleep(3000)
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
            msg: gettext("Go to open <strong>behaviours</strong>"),
            elem: header.getOption.bind(null, 'opt-behaviours'),
            pos: 'downLeft',
            action: BA.click(1500)
        },
        {
            type: 'autoAction',
            msg: gettext("Go to enable <strong>behaviours</strong>"),
            elem: wiringView.enableBehaviours.bind(null),
            pos: 'downRight',
            action: BA.click(1500)
        },
        {
            type: 'autoAction',
            msg: gettext("This item represents a behaviour."),
            elem: wiringView.getBehaviour.bind(null, 0),
            pos: 'downRight',
            action: BA.sleep(2000)
        },
        {
            type: 'autoAction',
            msg: gettext("This is the title."),
            elem: wiringView.getBehaviourTitle.bind(null, 0),
            pos: 'downRight',
            action: BA.sleep(2000)
        },
        {
            type: 'autoAction',
            msg: gettext("This is the description."),
            elem: wiringView.getBehaviourDescription.bind(null, 0),
            pos: 'downRight',
            action: BA.click(2000)
        },
        {
            type: 'autoAction',
            msg: gettext("These are the connections, operators and widgets."),
            elem: wiringView.getBehaviourElements.bind(null, 0),
            pos: 'downRight',
            action: BA.click(2000)
        },

        {
            type: 'simpleDescription',
            title: gettext("Step 2 - design the behaviours identified"),
            msg: gettext(
                "<p>With the option behaviours already enabled, let's design " +
                "the first behaviour identified.</p>" +
                "<p>Firstly, the basic information (title and description) " +
                "of the behaviour <strong>New Behaviour 0</strong> will be modified.</p>")
        },
        {
            type: 'autoAction',
            msg: gettext("Go to open <strong>behaviour update form</strong>."),
            elem: wiringView.getBehaviourTitle.bind(null, 0),
            pos: 'downRight',
            action: BA.click(2000)
        },

        {
            type: 'autoAction',
            msg: gettext("Go to set a <strong>title</strong>."),
            elem: getBehaviourUpdateFormTitle.bind(null, "Search for a technician"),
            pos: 'downLeft',
            action: BA.sleep(2000)
        },
        {
            type: 'autoAction',
            msg: gettext("Go to set a <strong>description</strong>."),
            elem: getBehaviourUpdateFormDescription.bind(null, "Allow find a technician from a given name in the list of technicians."),
            pos: 'downLeft',
            action: BA.sleep(2000)
        },
        {
            type: 'userAction',
            msg: gettext("<strong>You:</strong> click here to update"),
            elem: updateBehaviour.bind(null),
            pos: 'downLeft'
        },
        {
            type: 'autoAction',
            msg: gettext("<strong>Look!</strong> The first behaviour was updated."),
            elem: wiringView.getBehaviour.bind(null, 0),
            pos: 'downRight',
            action: BA.sleep(2000)
        },

        {
            type: 'simpleDescription',
            title: gettext("Step 2 - design the behaviours identified"),
            msg: gettext(
                "<p>Completed the above, let's add the components " +
                "belonging to this behaviour.</p>")
        },
        {
            type: 'autoAction',
            msg: gettext("Go to open <strong>components</strong>"),
            elem: header.getOption.bind(null, 'opt-components'),
            pos: 'downLeft',
            action: BA.click(1500)
        },

        {
            type: 'userAction',
            msg: gettext("<strong>You:</strong> drag and drop the operator <strong>Technical Service</strong>"),
            elem: wiringView.getOperatorByName.bind(null, 'Technical Service'),
            pos: 'downRight',
            'restartHandlers': [
                {'element': get_wiring, 'event': 'operatoraddfail'},
            ],
            'event': 'operatoradded',
            'eventToDeactivateLayer': 'mousedown',
            'elemToApplyNextStepEvent': get_wiring,
        },

        {
            type: 'autoAction',
            msg: gettext("Add the widget <strong>Search for</strong> similarly."),
            elem: wiringView.addComponent.bind(null, 'widget', 'Search for', 20, 20),
            pos: 'topRight',
            action: BA.sleep(2000)
        },

        {
            type: 'autoAction',
            msg: gettext("Add the widget <strong>Technicians</strong> similarly."),
            elem: wiringView.addComponent.bind(null, 'widget', 'Technicians', 250, 20),
            pos: 'topRight',
            action: BA.sleep(2000)
        },
        {
            type: 'simpleDescription',
            title: gettext("Step 2 - design the behaviours identified"),
            msg: gettext(
                "<p>Now, the components of this behaviour will be connected.</p>")
        },

        {
            type: 'userAction',
            msg: gettext("<strong>You:</strong> Drag the output-endpoint <strong>Technician</strong>..."),
            elem: getSourceEndpoint.bind(null, 'operator', 'Technical Service', 'Technician'),
            pos: 'downRight',
            'eventToDeactivateLayer': 'mousedown',
            'restartHandlers': [
                {'element': get_wiring_canvas, 'event': 'detach'}
            ],
            'disableElems': [],
            nextStepMsg: gettext("...and drop in this input-endpoint <strong>Technician</strong>."),
            elemToApplyNextStepEvent: getTargetEndpoint.bind(null, 'widget', 'Technicians', 'Technician'),
            'event': 'mouseup',
            secondPos: 'downLeft',
        },

        {
            type: 'autoAction',
            msg: gettext("Connect <strong>Search for - Query</strong> to <strong>Technicians - Query</strong> similarly."),
            elem: wiringView.connect.bind(null, {
                'type': 'widget',
                'name': 'Search for',
                'endpointName': 'Query'
            }, {
                'type': 'widget',
                'name': 'Technicians',
                'endpointName': 'Query'
            }),
            pos: 'topRight',
            action: BA.sleep(2000)
        },

        {
            type: 'simpleDescription',
            title: gettext("Step 2 - design the behaviours identified"),
            msg: gettext(
                "<p>The first behaviour is finished. Then, let's create the second behaviour identified.</p>")
        },

        {
            type: 'autoAction',
            msg: gettext("Go to open <strong>behaviours</strong> again"),
            elem: header.getOption.bind(null, 'opt-behaviours'),
            pos: 'downLeft',
            action: BA.click(1500)
        },

        {
            type: 'autoAction',
            msg: gettext("Go to open <strong>behaviour registration form</strong>"),
            elem: wiringView.openBehaviourRegistrationForm.bind(null),
            pos: 'topRight',
            action: BA.click(1500)
        },

        {
            type: 'autoAction',
            msg: gettext("Go to set a <strong>title</strong>."),
            elem: getBehaviourRegistrationFormTitle.bind(null, "View technician profile"),
            pos: 'downLeft',
            action: BA.sleep(2000)
        },
        {
            type: 'autoAction',
            msg: gettext("Go to set a <strong>description</strong>."),
            elem: getBehaviourRegistrationFormDescription.bind(null, "Allow view the vCard of a technician selected."),
            pos: 'downLeft',
            action: BA.sleep(2000)
        },
        {
            type: 'userAction',
            msg: gettext("<strong>You:</strong> click here to create"),
            elem: createBehaviour.bind(null),
            pos: 'downLeft'
        },
        {
            type: 'autoAction',
            msg: gettext("Look! The second behaviour was created."),
            elem: wiringView.getBehaviour.bind(null, 1),
            pos: 'downRight',
            action: BA.sleep(2000)
        },

        {
            type: 'simpleDescription',
            title: gettext("Step 2 - design the behaviours identified"),
            msg: gettext(
                "<p>At this point, let's add the components <strong>Technician vCard</strong>, " +
                "<strong>Technical Service</strong> and <strong>Technicians</strong> " +
                "and connect them each other.</p>" +
                "<p>The <strong>Technician vCard</strong> will added " +
                "from 'panel of components' and the others sharing the connection.</p>")
        },

        {
            type: 'autoAction',
            msg: gettext("Activate the <strong>second behaviour</strong>."),
            elem: wiringView.activateBehaviour.bind(null, 1),
            pos: 'downRight',
            action: BA.click(2000)
        },

        {
            type: 'userAction',
            msg: gettext("<strong>You:</strong> click here to share connection"),
            elem: shareConnection.bind(null, 0),
            pos: 'topRight'
        },

        {
            type: 'autoAction',
            msg: gettext("Add the widget <strong>Technician vCard</strong> similarly."),
            elem: wiringView.addComponent.bind(null, 'widget', 'Technician vCard', 470, 170),
            pos: 'topRight',
            action: BA.sleep(2000)
        },

        {
            type: 'autoAction',
            msg: gettext("Connect <strong>Technicians - vCard</strong> to <strong>Technician vCard - vCard</strong> similarly."),
            elem: wiringView.connect.bind(null, {
                'type': 'widget',
                'name': 'Technicians',
                'endpointName': 'vCard'
            }, {
                'type': 'widget',
                'name': 'Technician vCard',
                'endpointName': 'vCard'
            }),
            pos: 'topRight',
            action: BA.sleep(2000)
        },

        {
            type: 'simpleDescription',
            title: gettext("Step 2 - design the behaviours identified"),
            msg: gettext("<p>The second behavior is completed. The following " +
                "<strong>behaviours (2 y 3)</strong> will be created in the same way.</p>" +

                "<div class=\"alert alert-info\">" +
                "<p><strong>NOTE:</strong> To speed up this tutorial, the next actions " +
                "will be managed by the platform because that actions was " +
                "already performed previously.</p>" +
                "</div>")
        },

        {
            type: 'autoAction',
            msg: gettext("The <strong>thrid behaviour</strong> was created."),
            elem: addBehaviour.bind(null, 'Make a video call', 'Allow make a video call to the technician selected.'),
            pos: 'topRight',
            action: BA.sleep(2000)
        },

        {
            type: 'autoAction',
            msg: gettext("Activate the <strong>thrid behaviour</strong>."),
            elem: wiringView.activateBehaviour.bind(null, 2),
            pos: 'downRight',
            action: BA.click(2000)
        },

        {
            type: 'userAction',
            msg: gettext("<strong>You:</strong> click here to share connection"),
            elem: shareConnection.bind(null, 0),
            pos: 'topRight'
        },

        {
            type: 'autoAction',
            msg: gettext("Add the widget <strong>Video Call</strong>."),
            elem: wiringView.addComponent.bind(null, 'widget', 'Video Call', 470, 20),
            pos: 'topLeft',
            action: BA.sleep(2000)
        },

        {
            type: 'autoAction',
            msg: gettext("Connect <strong>Technicians - Username</strong> to <strong>Video Call - User Id</strong>."),
            elem: wiringView.connect.bind(null, {
                'type': 'widget',
                'name': 'Technicians',
                'endpointName': 'Username'
            }, {
                'type': 'widget',
                'name': 'Video Call',
                'endpointName': 'User Id'
            }),
            pos: 'topLeft',
            action: BA.sleep(2000)
        },

        {
            type: 'autoAction',
            msg: gettext("The <strong>last behaviour</strong> was created."),
            elem: addBehaviour.bind(null, 'Locate the technician', 'Allow display the current location of the technician selected.'),
            pos: 'topRight',
            action: BA.sleep(2000)
        },

        {
            type: 'autoAction',
            msg: gettext("Activate the <strong>last behaviour</strong>."),
            elem: wiringView.activateBehaviour.bind(null, 3),
            pos: 'downRight',
            action: BA.click(2000)
        },

        {
            type: 'userAction',
            msg: gettext("<strong>You:</strong> click here to share connection"),
            elem: shareConnection.bind(null, 0),
            pos: 'topRight'
        },

        {
            type: 'autoAction',
            msg: gettext("Add the widget <strong>Map Viewer</strong>."),
            elem: wiringView.addComponent.bind(null, 'widget', 'Map Viewer', 720, 20),
            pos: 'topLeft',
            action: BA.sleep(2000)
        },

        {
            type: 'autoAction',
            msg: gettext("Connect <strong>Technicians - PoI</strong> to <strong>Map Viewer - Insert/Update Centered PoI</strong>."),
            elem: wiringView.connect.bind(null, {
                'type': 'widget',
                'name': 'Technicians',
                'endpointName': 'PoI'
            }, {
                'type': 'widget',
                'name': 'Map Viewer',
                'endpointName': 'Insert/Update Centered PoI'
            }),
            pos: 'topLeft',
            action: BA.sleep(2000)
        },

        {
            type: 'simpleDescription',
            title: gettext("Try it yourself"),
            msg: gettext("<p>Finally, it's time to check out the global behaviour of the mashup.</p>")
        },
        {
            type: 'userAction',
            msg: gettext("Click <strong>back</strong> to continue"),
            elem: BS.back_button, 
            pos: 'downRight'
        }

    ]));

})();
