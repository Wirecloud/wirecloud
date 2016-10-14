/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    ns.ComponentShowcase = function ComponentShowcase() {

        se.StyledElement.call(this, ['add', 'create']);

        this.components = {operator: {}, widget: {}};
        this.groups = {};

        this.operatorButton = new se.ToggleButton({
            class: 'btn-list-operator-group',
            state: 'primary',
            text: utils.gettext('Operators')
        });
        this.operatorButton
            .addEventListener('click', function () {
                this.operatorButton.active = true;
                this.widgetButton.active = false;
                this.searchComponents.search_scope = 'operator';
                this.searchComponents.refresh();
            }.bind(this));

        this.widgetButton = new se.ToggleButton({
            class: 'btn-list-widget-group',
            state: 'primary',
            text: utils.gettext('Widgets')
        });
        this.widgetButton
            .addEventListener('click', function () {
                this.operatorButton.active = false;
                this.widgetButton.active = true;
                this.searchComponents.search_scope = 'widget';
                this.searchComponents.refresh();
            }.bind(this));

        var resource_painter = {
            paint: function paint(group) {
                var id;

                group = new ns.ComponentGroup(group);
                group.addEventListener('btncreate.click', createcomponent_onclick.bind(this));

                if (this.components.operator[group.id] != null) {
                    for (id in this.components.operator[group.id]) {
                        group.addComponent(this.components.operator[group.id][id]);
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
                typebuttons: new se.Fragment([this.operatorButton, this.widgetButton])
            },
            scope: 'widget',
            resource_painter: resource_painter
        });
        this.searchComponents.addEventListener('search', clearAll.bind(this));
        this.widgetButton.active = true;
        this.wrapperElement = this.searchComponents.get();
    };

    utils.inherit(ns.ComponentShowcase, se.StyledElement, {

        addComponent: function addComponent(wiringComponent) {
            var group_id = wiringComponent.meta.group_id,
                type = wiringComponent.meta.type;

            if (!(group_id in this.components[type])) {
                this.components[type][group_id] = {};
            }

            var component = new ns.Component(wiringComponent);

            component.draggable = new Wirecloud.ui.Draggable(component.get(), {component: component},
                component_ondragstart.bind(this),
                component_ondrag.bind(this),
                component_ondragend.bind(this),
                function canDrag() {return component.enabled;}
            );

            this.components[type][group_id][component.id] = component;

            if (group_id in this.groups) {
                this.groups[group_id].addComponent(component);
            }

            return component;
        },

        clear: function clear() {
            this.searchComponents.clear();
            this.components = {operator: {}, widget: {}};
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

        removeComponent: function removeComponent(type, component) {
            var group_id = component.meta.group_id;

            this.components[type][group_id][component.id].remove();
            delete this.components[type][group_id][component.id];

            return this;
        }

    });

    var clearAll = function clearAll() {
        this.groups = {};
    };


    var component_ondragstart = function component_ondragstart(draggable, context, event) {
        this.dispatchEvent('add', context);

        var bcr = context.layout.getBoundingClientRect();

        context.element.appendTo(context.layout.slideOut().parentElement);

        context.x = event.clientX - bcr.left - (context.element.wrapperElement.offsetWidth / 2);
        context.y = event.clientY - bcr.top - (context.element.heading.wrapperElement.offsetHeight / 2);

        context.component.used = true;

        context.element
            .addClassName("cloned dragging")
            .position({
                x: context.x,
                y: context.y
            });
    };

    var createcomponent_onclick = function createcomponent_onclick(group, button) {
        this.dispatchEvent('create', group, button);
    };

    var component_ondrag = function component_ondrag(event, draggable, context, xDelta, yDelta) {
        var layout;

        if (!context.layout.content.has(context.element)) {
            layout = context.layout.content.get();

            context.x += layout.scrollLeft;
            context.y += layout.scrollTop;

            context.element.remove();
            context.layout.content.appendChild(context.element);
        }

        context.element.position({
            x: context.x + xDelta,
            y: context.y + yDelta
        });
    };

    var component_ondragend = function component_ondragend(draggable, context) {

        if (!context.layout.content.has(context.element)) {
            context.element.remove();
            context.layout.content.appendChild(context.element);
        }

        context.element.removeClassName("cloned dragging");
        context.element.dispatchEvent('change', context.element.toJSON());

        context.layout.slideIn(1);
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
