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
     * Create a new instance of class ComponentShowcase.
     * @extends {Panel}
     *
     * @constructor
     */
    ns.ComponentShowcase = utils.defineClass({

        constructor: function ComponentShowcase(layout, options) {
            var btnGroupElement;

            this.componentOptions = options;

            this.superClass({
                extraClass: "panel-components",
                title: gettext("Available components")
            });

            this.components = {
                operator: {elements: {}, canCreate: true},
                widget: {elements: {}, canCreate: false}
            };

            this.layout = layout;

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
                }.bind(this));

            this.components.operator.container = new se.Container({
                extraClass: "section operator-group"
            });
            this.body.append(this.components.operator.container);

            this.components.operator.alert = new se.Alert({
                state: 'info',
                title: gettext("No operators"),
                message: gettext("No operator in your current account. Go to inventory for uploading at least one.")
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
                }.bind(this));

            this.components.widget.container = new se.Container({
                extraClass: "section widget-group"
            });
            this.body.append(this.components.widget.container);

            this.components.widget.alert = new se.Alert({
                state: 'info',
                title: gettext("No widgets"),
                message: gettext("No widget in your current workspace. Go to dashboard for adding at least one.")
            });
            this.components.widget.container
                .append(this.components.widget.alert);

            this.setUp();
        },

        inherit: se.Panel,

        members: {

            addMeta: function addMeta(meta) {
                var component,
                    id = getMetaId(meta);

                if (id in this.components[meta.type].elements) {
                    component = this.components[meta.type].elements[id];
                } else {
                    component = new ns.ComponentGroup(meta, this.layout, utils.updateObject({canCreate: this.components[meta.type].canCreate}, this.componentOptions));

                    this.components[meta.type].elements[component.id] = component;
                    this.components[meta.type].container.append(component);
                }

                component.appendVersion(meta);

                if (Object.keys(this.components[meta.type].elements).length) {
                    this.components[meta.type].alert.hide();
                }

                return this;
            },

            addWiringComponent: function addWiringComponent(wiringComponent) {
                var id = getMetaId(wiringComponent.meta);

                if (id in this.components[wiringComponent.meta.type].elements) {
                    this.components[wiringComponent.meta.type].elements[id].appendWiringComponent(wiringComponent);
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

            forEachComponent: function forEachComponent(callback) {
                var components, group_id, id, type;

                for (type in this.components) {
                    for (group_id in this.components[type].elements) {
                        components = this.components[type].elements[group_id].children;
                        for (id in components) {
                            callback(components[id]);
                        }
                    }
                }

                return this;
            },

            getComponent: function getComponent(type, id) {
                var id1, id2, item;

                for (id1 in this.components[type].elements) {
                    for (id2 in this.components[type].elements[id1].children) {
                        if (id2 == id) {
                            return this.components[type].elements[id1].children[id2];
                        }
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

                return this.superMember(se.Panel, 'show');
            }

        }

    });

    function getMetaId(meta) {
        return meta.vendor + '/' + meta.name;
    }

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
