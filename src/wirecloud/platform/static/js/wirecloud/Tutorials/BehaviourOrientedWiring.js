/*
 *     Copyright (c) 2015-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    var BS = Wirecloud.ui.Tutorial.Utils.basic_selectors;
    var BA = Wirecloud.ui.Tutorial.Utils.basic_actions;

    var wiringView = {

        auto_create_behaviour: function auto_create_behaviour(title, description, connections) {
            return function () {
                var behaviourEngine, behaviour;

                behaviourEngine = BS.wiringView.behaviour_engine()();
                behaviour = behaviourEngine.createBehaviour({title: title, description: description});
                behaviourEngine.activate(behaviour);
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
                var behaviour = document.querySelectorAll(".we-panel-behaviours .behaviour")[behaviourId];

                return behaviour.querySelector(".behaviour-title");
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
                var windowMenu = document.querySelector(".wc-alert-modal");

                return windowMenu.querySelector(".btn-primary");
            };
        },

        connection_button_by_id: function connection_button_by_id(source, target, buttonName) {
            return function () {
                var connections = document.querySelectorAll(".connection-options"),
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

        'openBehaviourRegistrationForm': function openBehaviourRegistrationForm() {
            return document.querySelector('.wiring-sidebar .behaviour-panel .btn-create-behaviour');
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
        var behaviourEngine, foundConnection;

        behaviourEngine = BS.wiringView.behaviour_engine()();

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
    };

    ns.TutorialCatalogue.add('mashup-wiring-design', new Wirecloud.ui.Tutorial(utils.gettext("Behaviour Oriented Wiring"), [
        {type: 'simpleDescription', title: utils.gettext("Behaviour Oriented Wiring Tutorial"), msg: utils.gettext("<p>Welcome to this Step-by-Step Interactive Tutorial!</p><p>In this tutorial you will learn how to build a <strong>behaviour oriented</strong> wiring configuration, a new feature added in WireCloud v0.8.0.</p><p>To do so, we are going to convert an application mashup created using a wiring configuration that doesn't use the behaviour engine to one that does.</p>")},
        {type: 'autoAction', action: BA.uploadComponent('CoNWeT/BOW-Tutorial/0.0.3')},
        {type: 'autoAction', action: BA.switch_view('workspace')},
        {type: 'autoAction', action: BA.create_workspace({name: utils.gettext("BOW Tutorial"), mashup: 'CoNWeT/BOW-Tutorial/0.0.3'})},
        {type: 'simpleDescription', title: utils.gettext("Behaviour Oriented Wiring Tutorial"), msg: utils.gettext('<p><span class="label label-success">Great!</span> We are now ready to start. Let\'s start by identifying the behaviours we want to model.</p><div class="alert alert-info">We have installed a mashup into your account (<strong>BOW-Tutorial</strong>), you can remove it safely.</div>')},

        // Step 1: identify behaviours
        {type: 'simpleDescription', title: utils.gettext("Step 1: Identify the behaviours"), msg: utils.gettext("<p>Our <strong>first behaviour (1 of 4)</strong> is going to be: Allow technician searches</p>")},
        {type: 'autoAction', msg: utils.gettext("We want to be able to <strong>type the name of a technician</strong> ..."), elem: BS.workspaceView.widget_by_title("Search For"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'autoAction', msg: utils.gettext("... and <strong>find him</strong> in the technician list."), elem: BS.workspaceView.widget_by_title("Technician List"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'simpleDescription', title: utils.gettext("Step 1: Identify the behaviours"), msg: utils.gettext("<p>Our <strong>second behaviour (2 of 4)</strong> is going to be: Display techinican profiles.</p>")},
        {type: 'autoAction', msg: utils.gettext("When we <strong>select a technician</strong> ..."), elem: BS.workspaceView.widget_by_title("Technician List"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'autoAction', msg: utils.gettext("... <strong>the profile of the technician should appear</strong> in the <em>Technician Profile</em> widget."), elem: BS.workspaceView.widget_by_title("Technician Profile"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'simpleDescription', title: utils.gettext("Step 1: Identify the behaviours"), msg: utils.gettext("<p>Our <strong>third behaviour (3 of 4)</strong> is going to be: Locate technicians.</p>")},
        {type: 'autoAction', msg: utils.gettext("When we <strong>select a technician</strong> ..."), elem: BS.workspaceView.widget_by_title("Technician List"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'autoAction', msg: utils.gettext("... <strong>his location should appear</strong> in the <em>Technician Location</em> widget."), elem: BS.workspaceView.widget_by_title("Technician Location"), pos: 'topLeft', action: BA.sleep(4000)},
        {type: 'simpleDescription', title: utils.gettext("Step 1: Identify the behaviours"), msg: utils.gettext("<p>Our <strong>fourth and last behaviour (4 of 4)</strong> is going to be: Allow videocalls with the technicians.</p>")},
        {type: 'autoAction', msg: utils.gettext("After <strong>selecting a technician</strong> ..."), elem: BS.workspaceView.widget_by_title("Technician List"), pos: 'topRight', action: BA.sleep(4000)},
        {type: 'autoAction', msg: utils.gettext("... we want to be able to <strong>call him</strong> using the <em>Technician VideoCall</em> widget."), elem: BS.workspaceView.widget_by_title("Technician VideoCall"), pos: 'topLeft', action: BA.sleep(4000)},

        // Step 1 to Step 2 transition

        {type: 'simpleDescription', title: utils.gettext("Behaviour Oriented Wiring Tutorial"), msg: utils.gettext("<p>Once identified the desired behaviours, we're going to create them in the Wiring Editor view.</p>")},
        {type: 'userAction', msg: utils.gettext("Click <em>Wiring</em>"), elem: BS.toolbar_button('wc-show-wiring-button'), pos: 'downRight'},

        {type: 'simpleDescription', title: utils.gettext("Behaviour Oriented Wiring Tutorial"), msg: utils.gettext("<p>As you can see, we already have all the connections and components needed for implementing all the identified behaviours. The first step for converting this wiring configuration into a behaviour oriented configuration is enabling the behaviour engine.</p>")},
        {type: 'userAction', msg: utils.gettext("Click <em>List Behaviours</em>"), elem: BS.wiringView.show_behaviours_button(), pos: 'downRight'},
        {type: 'autoAction', elem: BS.wiringView.show_behaviours_button(), action: BA.sleep(300)},
        {type: 'userAction', msg: utils.gettext("Enable the behaviour engine"), elem: BS.wiringView.enable_behaviours_button(), pos: 'topRight'},

        // Step 2 - design behaviours

        {type: 'simpleDescription', title: utils.gettext("Step 2: Design the behaviours"), msg: utils.gettext("<p>When you enable the behaviour engine, a default behaviour will be created with all existing components and connections.</p><p>Let's continue <strong>creating the second behaviour</strong> (Display technician profiles).</p>")},
        {type: 'userAction', msg: utils.gettext("Click <em>Create behaviour</em>"), elem: BS.wiringView.create_behaviour_button(), pos: 'topRight'},
        {type: 'autoAction', msg: utils.gettext("We fill the <strong>title</strong> ..."), elem: BS.form_field("title"), pos: 'downRight', action: BA.input(utils.gettext("Display technician profiles"), {step: 100})},
        {type: 'autoAction', msg: utils.gettext("... and the <strong>description</strong>."), elem: BS.form_field("description"), pos: 'downRight', action: BA.input(utils.gettext("Display technician profiles when they are selected in other widgets, e.g. in the technician list widget."), {step: 100})},
        {type: 'userAction', msg: utils.gettext("Click <em>Accept</em>"), elem: wiringView.accept_form(".we-new-behaviour-modal"), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("Active the second behaviour"), elem: wiringView.behaviour_title_by_id(1), pos: 'topRight'},
        {type: 'simpleDescription', title: utils.gettext("Step 2: Design the behaviours"), msg: utils.gettext("<p>Now, we are going to add the components and the connections needed for implementing this behaviour taking them from the behaviour created by default.</p>")},
        {type: 'userAction', msg: utils.gettext("Click <em>Add</em>"), elem: wiringView.connection_button_by_id({type: "operator", title: "Technical Service", endpoint: "technician"}, {type: "widget", title: "Technician List", endpoint: "technician"}, "add"), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("Click <em>Add</em>"), elem: wiringView.connection_button_by_id({type: "widget", title: "Technician List", endpoint: "technician-profile"}, {type: "widget", title: "Technician Profile", endpoint: "technician"}, "add"), pos: 'topRight'},
        {type: 'simpleDescription', title: utils.gettext("Step 2: Design the behaviours"), msg: utils.gettext("<p><span class=\"label label-success\">Great!</span> We have finished our first behaviour. Have you noticed that when we added the connections also the affected components were added? That saved us some steps :).</p><p>Anyway, you can also directly add components in a similar way clicking on theirs <em>Add</em> button (take into account that associated connections are no added automatically in that case)</p><div class=\"alert alert-info\">The third and the fourth behaviour can be created the same way, so we are going to create them for you.</div>")},
        {type: 'autoAction', msg: utils.gettext("The <strong>third behaviour</strong> was created."), elem: wiringView.auto_create_behaviour(utils.gettext("Locate technicians"), utils.gettext("Show the current location of the selected technician."), [
                {source: {type: "operator", title: "Technical Service", endpoint: "technician"}, target: {type: "widget", title: "Technician List", endpoint: "technician"}},
                {source: {type: "widget", title: "Technician List", endpoint: "technician-location"}, target: {type: "widget", title: "Technician Location", endpoint: "poiInputCenter"}}
            ]), pos: 'topRight', action: BA.sleep(2000)},
        {type: 'autoAction', msg: utils.gettext("The <strong>fourth behaviour</strong> was created."), elem: wiringView.auto_create_behaviour(utils.gettext("Allow videocalls with the technicians"), utils.gettext("Allow to stablish a videocall with the selected technician."), [
                {source: {type: "operator", title: "Technical Service", endpoint: "technician"}, target: {type: "widget", title: "Technician List", endpoint: "technician"}},
                {source: {type: "widget", title: "Technician List", endpoint: "technician-username"}, target: {type: "widget", title: "Technician VideoCall", endpoint: "call-user"}}
            ]), pos: 'topRight', action: BA.sleep(2000)},
        {type: 'simpleDescription', title: utils.gettext("Step 2: Design the behaviours"), msg: utils.gettext("<p>The last step is cleaning up our first behaviour as it currently contains all the components and connections of the wiring configuration. We have to convert it into our real first behaviour: Allow techinican searches.</p><p>We're going to start by updating the behaviour's details.</p>")},
        {type: 'userAction', msg: utils.gettext("Active the first behaviour"), elem: wiringView.behaviour_title_by_id(0), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("Click <em>Preferences</em>"), elem: BS.wiringView.show_behaviour_prefs_button(0), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("Click <em>Settings</em>"), elem: BS.menu_item(utils.gettext("Settings")), pos: 'topRight'},
        {type: 'autoAction', msg: utils.gettext("We have to change the <strong>title</strong> ..."), elem: BS.form_field("title"), pos: 'downRight', action: BA.input(utils.gettext("Allow technician searches"), {step: 100})},
        {type: 'autoAction', msg: utils.gettext("... and the <strong>description</strong>."), elem: BS.form_field("description"), pos: 'downRight', action: BA.input(utils.gettext("Find a technician by a name at the technician list."), {step: 100})},
        {type: 'userAction', msg: utils.gettext("Click <em>Accept</em>"), elem: wiringView.accept_form(".behaviour-update-form"), pos: 'topRight'},
        {type: 'simpleDescription', title: utils.gettext("Step 2: Design the behaviours"), msg: utils.gettext("<p>In this case there are components and connections that are not part of this behaviour. Let's remove them.</p>")},
        {type: 'userAction', msg: utils.gettext("Click <em>Remove</em>"), elem: wiringView.component_button_by_title("widget", "Technician VideoCall", "remove"), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("Click <em>Remove</em>"), elem: wiringView.component_button_by_title("widget", "Technician Profile", "remove"), pos: 'topRight'},
        {type: 'userAction', msg: utils.gettext("Click <em>Remove</em>"), elem: wiringView.component_button_by_title("widget", "Technician Location", "remove"), pos: 'topRight'},
        {type: 'simpleDescription', title: utils.gettext("Step 2: Design the behaviours"), msg: utils.gettext("<p><span class=\"label label-success\">Great!</span> We have cleaned up this behaviour successfully. Have you noticed that when we removed the components also the affected connections were removed? That saved us, again, some steps :).</p><p>Anyway, you can also directly remove connections in a similar way clicking on their <em>Remove</em> button (take into account that associated components are no removed automatically in that case)</p>")},

        {type: 'userAction', msg: utils.gettext("Click <em>Back</em>"), elem: BS.back_button(), pos: 'downRight'},
        {type: 'simpleDescription', title: utils.gettext("Try It Yourself"), msg: utils.gettext('<p><span class="label label-success">Congratulations!</span> you have finished your first <em>behaviour oriented</em> wiring configuration.</p><p>This is the end of this tutorial, but you can play with the example dashboard and check if it follow the described behaviours.</p>')}
    ]));

})(Wirecloud, StyledElements, StyledElements.Utils);
