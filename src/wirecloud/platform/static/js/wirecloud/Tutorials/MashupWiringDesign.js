/*
 *     Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    var BS = Wirecloud.ui.Tutorial.Utils.basic_selectors;
    var BA = Wirecloud.ui.Tutorial.Utils.basic_actions;

    var get_wiring = function get_wiring() {
        return LayoutManagerFactory.getInstance().viewsByName["wiring"];
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

        return form.querySelectorAll('.window_bottom .se-btn')[0];
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

        return form.querySelectorAll('.window_bottom .se-btn')[0];
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

    var shareConnection = function shareConnection(connectionIndex) {
        var connections = document.querySelectorAll('.wiring-connections .connection.on-background');

        return connections[connectionIndex].querySelector('.option-remove');
    };

    var get_wiring_canvas = function get_wiring_canvas() {
        var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
        return wiringEditor.connectionEngine;
    };

    var wiringView = {

        type_formfield: function type_formfield(formSelector, fieldName, fieldValue) {
            return function () {
                var form = document.querySelector(formSelector),
                    field = form.querySelector('[name="' + fieldName + '"]');

                field.value = fieldValue;

                return field;
            };
        },

        auto_create_behaviour: function auto_create_behaviour(title, description, connections) {
            return function () {
                var behaviourEngine = LayoutManagerFactory.getInstance().viewsByName.wiring.behaviourEngine,
                    behaviour = createAndActivateBehaviour(title, description);

                connections.forEach(function (context) {
                    var connection = findConnection(context.source, context.target);
                    behaviourEngine.updateConnection(connection, connection.toJSON(), true);
                });

                return behaviour.get();
            };
        },

        accept_form: function accept_form(formSelector) {
            return function () {
                return document.querySelector(formSelector).querySelector('.btn-accept');
            };
        },

        behaviour_title_by_id: function behaviour_by_id(behaviourId) {
            return function () {
                var behaviour = document.querySelectorAll(".panel-behaviours .behaviour")[behaviourId];

                return behaviour.querySelector(".behaviour-title");
            };
        },

        btn_show_behaviour_prefs: function btn_show_behaviour_prefs(behaviourId) {
            return function () {
                var behaviour = document.querySelectorAll(".panel-behaviours .behaviour")[behaviourId];

                return behaviour.querySelector(".btn-show-prefs");
            };
        },

        popup_menu: function popup_menu(title) {
            return function () {
                var i, items = document.querySelectorAll(".se-popup-menu .se-popup-menu-item");

                for (i = items.length - 1; i >= 0; i--) {
                    if (items[i].textContent == title) {
                        return items[i];
                    }
                }

                return null;
            };
        },

        component_button_by_title: function component_button_by_title(type, title, name) {
            return function () {
                var i, components = document.querySelectorAll(".component-draggable.component-" + type);

                for (i = components.length - 1; i >= 0; i--) {
                    if (components[i].querySelector(".panel-title").textContent == title) {
                        return components[i].querySelector(".btn-" + name);
                    }
                }

                return null;
            };
        },

        cancel_alert: function cancel_alert() {
            return function () {
                var windowMenu = document.querySelector(".wc-alert-dialog");

                return windowMenu.querySelector(".btn-primary");
            };
        },

        connection_button_by_id: function connection_button_by_id(source, target, buttonName) {
            return function () {
                var connections = document.querySelectorAll(".connection"),
                    components = document.querySelectorAll(".component-draggable");

                var i, element;

                for (i = components.length - 1; i >= 0; i--) {
                    element = components[i];

                    if (element.classList.contains("component-" + source.type) && element.querySelector(".panel-title").textContent == source.title) {
                        source.id = source.type + "/" + element.getAttribute("data-id") + "/" + source.endpoint;
                        continue;
                    }

                    if (element.classList.contains("component-" + target.type) && element.querySelector(".panel-title").textContent == target.title) {
                        target.id = target.type + "/" + element.getAttribute("data-id") + "/" + target.endpoint;
                        continue;
                    }
                }

                for (i = connections.length - 1; i >= 0; i--) {
                    element = connections[i];

                    if (element.getAttribute('data-sourceid') == source.id && element.getAttribute('data-targetid') == target.id) {
                        return element.querySelector(".btn-" + buttonName);
                    }
                }

                return null;
            };
        },

        'addComponent': function addComponent(type, name, x , y) {
            document.querySelector('.wiring-sidebar .btn-display-' + type + '-group').click();

            var component = get_wiring().addComponentByName(type, name, x, y);

            return component.wrapperElement;
        },

        'openBehaviourRegistrationForm': function openBehaviourRegistrationForm() {
            return document.querySelector('.wiring-sidebar .behaviour-panel .btn-create-behaviour');
        },

        'connect': function connect(sourceEndpoint, targetEndpoint) {
            var connect = get_wiring().connectComponents(sourceEndpoint, targetEndpoint);

            return connect.wrapperElement;
        },

        'getOperatorByName': function getOperatorByName(operatorName) {
            document.querySelector('.wiring-sidebar .btn-display-operator-group').click();

            var operators = document.querySelectorAll('.wiring-sidebar .component-panel .component-operator');

            for (var i = 0; i < operators.length; i++) {
                if (operators[i].querySelector('.component-title').textContent == operatorName) {
                    return operators[i];
                }
            }

            return null;
        },

        'enableBehaviours': function enableBehaviours() {
            return document.querySelector('.wiring-sidebar .behaviour-panel .btn-enable-behaviours');
        },

        'getBehaviour': function getBehaviour(index) {
            return document.querySelectorAll('.wiring-sidebar .behaviour-panel .behaviour')[index];
        },

        'activateBehaviour': function activateBehaviour(index) {
            return document.querySelectorAll('.wiring-sidebar .behaviour-panel .behaviour')[index].querySelector('.btn-activate');
        },

        'getBehaviourTitle': function getBehaviourTitle(index) {
            return document.querySelectorAll('.wiring-sidebar .behaviour-panel .behaviour')[index].querySelector('.behaviour-title');
        },

        openBehaviourSettings: function openBehaviourSettings(index) {
            return document.querySelectorAll('.wiring-sidebar .behaviour-panel .behaviour')[index].querySelector('.btn-show-settings');
        },

        'getBehaviourDescription': function getBehaviourDescription(index) {
            return document.querySelectorAll('.wiring-sidebar .behaviour-panel .behaviour')[index].querySelector('.behaviour-description');
        }

    };

    var findConnection = function findConnection(source, target) {
        var behaviourEngine = LayoutManagerFactory.getInstance().viewsByName.wiring.behaviourEngine,
            foundConnection = null;

        behaviourEngine.forEachComponent(function (component) {
            if (component.type == source.type && component.title == source.title) {
                component.getEndpoint('source', source.endpoint).forEachConnection(function (connection) {
                    if (foundConnection == null && connection.targetComponent.type == target.type && connection.targetComponent.title == target.title && connection.target.endpoint.name == target.endpoint) {
                        foundConnection = connection;
                    }
                });
            }
        });

        return foundConnection;
    }

    var createAndActivateBehaviour = function createAndActivateBehaviour(title, description) {
        var behaviourEngine = LayoutManagerFactory.getInstance().viewsByName.wiring.behaviourEngine,
            behaviour = behaviourEngine.createBehaviour({title: title, description: description});

        behaviourEngine.activate(behaviour);

        return behaviour;
    };

    ns.TutorialCatalogue.add('mashup-wiring-design', new Wirecloud.ui.Tutorial(utils.gettext("Mashup Wiring Design"), [
        {type: 'simpleDescription', title: utils.gettext("Mashup Wiring Design Tutorial"), msg: utils.gettext("<p>Welcome to this Step-by-Step Interactive Tutorial!</p><p>Next, you will learn how to perform a <strong>mashup wiring design</strong> using the behaviours, a new concept introduced.</p><p>First, a new workspace will be created and used as scenario to explain the mentioned concept earlier.</p>")},
        {type: 'autoAction', action: BA.uploadComponent('CoNWeT/MWD-Tutorial/0.0.3')},
        {type: 'autoAction', action: BA.create_workspace({name: utils.gettext("MWD Tutorial"), mashup: 'CoNWeT/MWD-Tutorial/0.0.3'})},
        {type: 'simpleDescription', title: utils.gettext("Mashup Wiring Design Tutorial"), msg: utils.gettext("<p>Great! As you can see, the workspace was created successfully. To make this possible, the mashup <strong>MWD-Tutorial</strong> was uploaded before.</p><p>Next, let's identify the behaviours ocurring here.</p>")},

        // Step 1: identify behaviours
        {type: 'simpleDescription', title: utils.gettext("Step 1: Identify the behaviours"), msg: utils.gettext("<p>The <strong>first behaviour (1 of 4)</strong> could be to search for a technician available.</p>")},
        {type: 'autoAction', msg: utils.gettext("The behaviour could be to <strong>type the technician's name</strong>..."), elem: BS.workspaceView.widget_by_title("Search For"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'autoAction', msg: utils.gettext("...and <strong>find him</strong> here."), elem: BS.workspaceView.widget_by_title("Technician List"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'simpleDescription', title: utils.gettext("Step 1: Identify the behaviours"), msg: utils.gettext("<p>The <strong>second behaviour (2 of 4)</strong> could be to view the profile of a technician available.</p>")},
        {type: 'autoAction', msg: utils.gettext("The behaviour could be to <strong>select a technician</strong>..."), elem: BS.workspaceView.widget_by_title("Technician List"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'autoAction', msg: utils.gettext("...and <strong>know his profile</strong> here."), elem: BS.workspaceView.widget_by_title("Technician Profile"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'simpleDescription', title: utils.gettext("Step 1: Identify the behaviours"), msg: utils.gettext("<p>The <strong>third behaviour (3 of 4)</strong> could be to view the current location of a technician available.</p>")},
        {type: 'autoAction', msg: utils.gettext("The behaviour could be to <strong>select a technician</strong>..."), elem: BS.workspaceView.widget_by_title("Technician List"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'autoAction', msg: utils.gettext("...and <strong>locate him</strong> here."), elem: BS.workspaceView.widget_by_title("Technician Location"), pos: 'topLeft', action: BA.sleep(4000)},
        {type: 'simpleDescription', title: utils.gettext("Step 1: Identify the behaviours"), msg: utils.gettext("<p>The <strong>last behaviour (4 of 4)</strong> could be to make a videocall to a technician available.</p>")},
        {type: 'autoAction', msg: utils.gettext("The behaviour could be to <strong>select a technician</strong>..."), elem: BS.workspaceView.widget_by_title("Technician List"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'autoAction', msg: utils.gettext("...and <strong>call him</strong> here."), elem: BS.workspaceView.widget_by_title("Technician VideoCall"), pos: 'topLeft', action: BA.sleep(4000)},
        {type: 'simpleDescription', title: utils.gettext("Mashup Wiring Design Tutorial"), msg: utils.gettext("<p>As next step, let's design the mashup wiring using behaviours.</p>")},
        {type: 'userAction', msg: utils.gettext("Show <strong>Mashup Wiring</strong>"), elem: BS.toolbar_button('btn-display-wiring-view'), pos: 'downRight'},

        {type: 'simpleDescription', title: utils.gettext("Mashup Wiring Design Tutorial"), msg: utils.gettext("<p>In this view, you're going to design the identified behaviours. First of all, you need to enable the behaviours.")},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>List Behaviours</strong>"), elem: BS.wiringView.btn_show_behaviours(), pos: 'downRight'},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Enable Behaviours</strong>"), elem: BS.wiringView.btn_enable_behaviours(), pos: 'topRight'},

        // Step 2 - design behaviours

        {type: 'simpleDescription', title: utils.gettext("Step 2: Design the behaviours"), msg: utils.gettext("<p>When you enable the behaviour engine, a default behaviour will be created with all existing components and connections.</p><p>Next, let's <strong>create the second behaviour</strong> mentioned earlier.</p>")},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Create behaviour</strong>"), elem: BS.wiringView.btn_create_behaviour(), pos: 'topRight'},
        {type: 'autoAction', msg: utils.gettext("Typing a <strong>title</strong>."), elem: wiringView.type_formfield(".behaviour-create-form", "title", utils.gettext("View a technician's profile")), pos: 'downRight', action: BA.sleep(3000)},
        {type: 'autoAction', msg: utils.gettext("Typing a <strong>description</strong>."), elem: wiringView.type_formfield(".behaviour-create-form", "description", utils.gettext("View the technician' vCard selected on a list.")), pos: 'downRight', action: BA.sleep(3000)},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Accept</strong>"), elem: wiringView.accept_form(".behaviour-create-form"), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Second Behaviour</strong>"), elem: wiringView.behaviour_title_by_id(1), pos: 'topRight'},
        {type: 'simpleDescription', title: utils.gettext("Step 2: Design the behaviours"), msg: utils.gettext("<p>Now, you're going to share the connections that belong to this behaviour too.</p>")},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Share Connection</strong>"), elem: wiringView.connection_button_by_id({type: "operator", title: utils.gettext("Technical Service"), endpoint: "technician"}, {type: "widget", title: utils.gettext("Technician List"), endpoint: "technician"}, "share"), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Share Connection</strong>"), elem: wiringView.connection_button_by_id({type: "widget", title: utils.gettext("Technician List"), endpoint: "technician-profile"}, {type: "widget", title: utils.gettext("Technician Profile"), endpoint: "technician"}, "share"), pos: 'topRight'},
        {type: 'simpleDescription', title: utils.gettext("Step 2: Design the behaviours"), msg: utils.gettext("<p>You've already added the connections belonging to this behaviour.</p><p>Next, the platform will create and design the two following behaviours because you would do the same actions.</p>")},
        {type: 'autoAction', msg: utils.gettext("The <strong>third behaviour</strong> was created."), elem: wiringView.auto_create_behaviour(utils.gettext("Locate a technician"), utils.gettext("Show the current location of a selected technician."), [
                {source: {type: "operator", title: utils.gettext("Technical Service"), endpoint: "technician"}, target: {type: "widget", title: utils.gettext("Technician List"), endpoint: "technician"}},
                {source: {type: "widget", title: utils.gettext("Technician List"), endpoint: "technician-location"}, target: {type: "widget", title: utils.gettext("Technician Location"), endpoint: "poiInputCenter"}}
            ]), pos: 'topRight', action: BA.sleep(2000)},
        {type: 'autoAction', msg: utils.gettext("The <strong>last behaviour</strong> was created."), elem: wiringView.auto_create_behaviour(utils.gettext("Call a technician"), utils.gettext("Make a videocall to a selected technician."), [
                {source: {type: "operator", title: utils.gettext("Technical Service"), endpoint: "technician"}, target: {type: "widget", title: utils.gettext("Technician List"), endpoint: "technician"}},
                {source: {type: "widget", title: utils.gettext("Technician List"), endpoint: "technician-username"}, target: {type: "widget", title: utils.gettext("Technician VideoCall"), endpoint: "call-user"}}
            ]), pos: 'topRight', action: BA.sleep(2000)},
        {type: 'simpleDescription', title: utils.gettext("Step 2: Design the behaviours"), msg: utils.gettext("<p>As last step, you will design the first identified behaviour.</p><p>First, you're going to update the behaviour's information.</p>")},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>First Behaviour</strong>"), elem: wiringView.behaviour_title_by_id(0), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Preferences</strong>"), elem: wiringView.btn_show_behaviour_prefs(0), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Settings</strong>"), elem: wiringView.popup_menu(utils.gettext("Settings")), pos: 'topRight'},
        {type: 'autoAction', msg: utils.gettext("Typing a <strong>title</strong>."), elem: wiringView.type_formfield(".behaviour-update-form", "title", utils.gettext("Search for a technician")), pos: 'downRight', action: BA.sleep(3000)},
        {type: 'autoAction', msg: utils.gettext("Typing a <strong>description</strong>."), elem: wiringView.type_formfield(".behaviour-update-form", "description", utils.gettext("Find a technician by a name at the technician list.")), pos: 'downRight', action: BA.sleep(3000)},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Accept</strong>"), elem: wiringView.accept_form(".behaviour-update-form"), pos: 'topRight'},
        {type: 'simpleDescription', title: utils.gettext("Step 2: Design the behaviours"), msg: utils.gettext("<p>Next, you're going to remove the components that don't belong to first behaviour.</p>")},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Remove component</strong>"), elem: wiringView.component_button_by_title("widget", utils.gettext("Technician VideoCall"), "remove"), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>No, only in this behaviour</strong>"), elem: wiringView.cancel_alert(), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Remove component</strong>"), elem: wiringView.component_button_by_title("widget", utils.gettext("Technician Profile"), "remove"), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>No, only in this behaviour</strong>"), elem: wiringView.cancel_alert(), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Remove component</strong>"), elem: wiringView.component_button_by_title("widget", utils.gettext("Technician Location"), "remove"), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>No, only in this behaviour</strong>"), elem: wiringView.cancel_alert(), pos: 'topRight'},

        {type: 'simpleDescription', title: utils.gettext("Try It Yourself"), msg: utils.gettext("<p>Finally, it's time to check that the global behaviour of the mashup keep working.</p>")},
        {type: 'userAction', msg: utils.gettext("<strong>You:</strong> click <strong>Back</strong>"), elem: BS.back_button(), pos: 'downRight'}
    ]));

})(Wirecloud, StyledElements, StyledElements.Utils);
