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

/* global gettext, StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class ComponentManager.
     * @extends {Panel}
     *
     * @constructor
     */
    ns.ComponentManager = utils.defineClass({

        constructor: function ComponentManager() {
            var btnGroupElement;

            this.superClass([], {
                extraClass: 'panel-components',
                title: gettext("Available components")
            });

            this.components = {
                operator: {
                    elements: {}
                },
                widget: {
                    elements: {}
                }
            };

            btnGroupElement = document.createElement('div');
            btnGroupElement.className = "btn-group btn-group-justified";
            this.append(btnGroupElement);

            this.components.operator.button = new se.ToggleButton({
                state: 'primary',
                extraClass: "btn-list-operator-group",
                text: gettext("Operators")
            });
            this.components.operator.button
                .appendTo(btnGroupElement)
                .on('click', function () {
                    this.show('operator');
                }, this);

            this.components.operator.container = new se.Container({
                extraClass: "section operator-group"
            });
            this.body.append(this.components.operator.container);

            this.components.operator.alert = new se.Alert({
                state: 'info',
                title: "No available operators",
                message: "No operator in your current account. Go to inventory for uploading at least one."
            });
            this.components.operator.container
                .append(this.components.operator.alert);

            this.components.widget.button = new se.ToggleButton({
                state: "primary",
                extraClass: "btn-list-widget-group",
                text: gettext("Widgets")
            });
            this.components.widget.button
                .appendTo(btnGroupElement)
                .on('click', function () {
                    this.show('widget');
                }, this);

            this.components.widget.container = new se.Container({
                extraClass: "section widget-group"
            });
            this.body.append(this.components.widget.container);

            this.components.widget.alert = new se.Alert({
                state: 'info',
                title: "No available widgets",
                message: "No widget in your current workspace. Go to dashboard for adding at least one."
            });
            this.components.widget.container
                .append(this.components.widget.alert);

            this.setUp();
        },

        inherit: se.Panel,

        members: {

            addComponent: function addComponent(type, element) {
                this.components[type].elements[element.getId()] = element;
                this.components[type].container.append(element);

                if (Object.keys(this.components[type].elements).length) {
                    this.components[type].alert.hide();
                }

                return this;
            },

            empty: function empty() {
                Object.keys(this.components).forEach(function (type) {
                    this.components[type].container
                        .empty()
                        .append(this.components[type].alert);
                    this.components[type].elements = {};
                }, this);

                return this;
            },

            enableWidget: function enableWidget(id) {

                if (id in this.components.widget.elements) {
                    this.components.widget.elements[id].enable();
                }

                return this;
            },

            getComponent: function getComponent(type, title) {

                for (var id in this.components[type].elements) {
                    if (this.components[type].elements[id].title === title) {
                        return this.components[type].elements[id];
                    }
                }

                return null;
            },

            removeComponent: function removeComponent(type, element) {
                this.components[type].container.remove(element);
                delete this.components[type].elements[element.getId()];

                return this;
            },

            setUp: function setUp() {
                return this.show('operator');
            },

            show: function show(type) {
                type = typeof type !== 'string' ? "": type;

                if (arguments.length && type) {
                    Object.keys(this.components).forEach(function (existingType) {
                        if (existingType === type) {
                            this.components[existingType].button.active = true;
                            this.components[existingType].container.show();
                        } else {
                            this.components[existingType].button.active = false;
                            this.components[existingType].container.hide();
                        }
                    }, this);

                    return this;
                }

                return this.superMember('show');
            }

        }

    });

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
