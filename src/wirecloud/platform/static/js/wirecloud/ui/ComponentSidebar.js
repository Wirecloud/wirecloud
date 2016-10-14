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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    ns.ComponentSidebar = function ComponentSidebar() {

        se.StyledElement.call(this, ['add', 'create']);

        this.components = {mashup: {}, widget: {}};
        this.groups = {};

        this.mashupButton = new se.ToggleButton({
            class: 'btn-list-mashup-group wc-filter-type-mashup',
            state: 'primary',
            text: utils.gettext('Mashups')
        });
        this.mashupButton
            .addEventListener('click', function () {
                this.mashupButton.active = true;
                this.widgetButton.active = false;
                this.searchComponents.search_scope = 'mashup';
                this.searchComponents.refresh();
            }.bind(this));

        this.widgetButton = new se.ToggleButton({
            class: 'btn-list-widget-group wc-filter-type-widget',
            state: 'primary',
            text: utils.gettext('Widgets')
        });
        this.widgetButton
            .addEventListener('click', function () {
                this.mashupButton.active = false;
                this.widgetButton.active = true;
                this.searchComponents.search_scope = 'widget';
                this.searchComponents.refresh();
            }.bind(this));

        var resource_painter = {
            paint: function paint(group) {
                var id;

                group = new ns.WiringEditor.ComponentGroup(group, this.searchComponents.search_scope === "widget" ? utils.gettext("Add to workspace") : utils.gettext("Merge"));
                group.addEventListener('btncreate.click', createcomponent_onclick.bind(this));

                if (this.components.mashup[group.id] != null) {
                    for (id in this.components.mashup[group.id]) {
                        group.addComponent(this.components.mashup[group.id][id]);
                    }
                }

                if (this.components.widget[group.id] != null) {
                    for (id in this.components.widget[group.id]) {
                        group.addComponent(this.components.widget[group.id][id]);
                    }
                }

                this.groups[group.id] = group;
                return group;
            }.bind(this)
        };

        this.searchComponents = new Wirecloud.ui.MACSearch({
            template: 'wirecloud/component_sidebar',
            extra_template_context: {
                typebuttons: new se.Fragment([this.mashupButton, this.widgetButton])
            },
            scope: 'widget',
            resource_painter: resource_painter
        });
        this.searchComponents.addEventListener('search', clearAll.bind(this));
        this.widgetButton.active = true;
        this.wrapperElement = this.searchComponents.get();
        this.wrapperElement.classList.add("wc-resource-list");
    };

    utils.inherit(ns.ComponentSidebar, se.StyledElement, {

        addComponent: function addComponent(wiringComponent) {
            var group_id = wiringComponent.meta.group_id,
                type = wiringComponent.meta.type;

            if (!(group_id in this.components[type])) {
                this.components[type][group_id] = {};
            }

            var component = new ns.WiringEditor.Component(wiringComponent);

            component.addEventListener('click', function () {
                this.dispatchEvent('add', component);
            }.bind(this));

            this.components[type][group_id][component.id] = component;

            if (group_id in this.groups) {
                this.groups[group_id].addComponent(component);
            }

            return component;
        },

        clear: function clear() {
            this.searchComponents.clear();
            this.components = {mashup: {}, widget: {}};
            return this;
        },

        findComponent: function findComponent(type, id) {
            var group_id;

            for (group_id in this.components[type]) {
                if (id in this.components[type][group_id]) {
                    return this.components[type][group_id][id];
                }
            }

            return null;
        },

        forEachComponent: function forEachComponent(callback) {
            var type, id, group_id;

            for (type in this.components) {
                for (group_id in this.components[type]) {
                    for (id in this.components[type][group_id]) {
                        callback(this.components[type][group_id][id]);
                    }
                }
            }

            return this;
        },

        removeComponent: function removeComponent(component) {
            var group_id = component.meta.group_id;

            this.components[component.meta.type][group_id][component.id].remove();
            delete this.components[component.meta.type][group_id][component.id];

            return this;
        }

    });

    var clearAll = function clearAll() {
        this.groups = {};
    };

    var createcomponent_onclick = function createcomponent_onclick(group, button) {
        this.dispatchEvent('create', group, button);
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
