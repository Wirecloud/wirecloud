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

/* global StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class ComponentGroup.
     * @extends {StyledElement}
     *
     * @constructor
     * @param {StyledElement} layout
     *      [TODO: description]
     * @param {PlainObject} [options]
     *      [TODO: description]
     */
    ns.ComponentGroup = utils.defineClass({

        constructor: function ComponentGroup(meta, layout, options) {

            options = utils.updateObject(defaults, options);
            this.superClass();

            this.wrapperElement = document.createElement('div');
            this.wrapperElement.className = "component-group";

            this.meta = new ns.ComponentMeta(meta);
            this.meta.version.on('change', version_onchange.bind(this));
            this.meta.appendTo(this.wrapperElement);

            this.layout = layout;
            this.createWiringComponent = options.createWiringComponent;
            this.getComponentDraggable = options.getComponentDraggable;

            this.versions = {};
            this.children = {};

            this.currentVersion = null;
            this.latestVersion = null;

            this.meta.btnAdd.on('click', btncreate_onclick.bind(this));

            Object.defineProperties(this, {
                id: {value: meta.group_id},
                type: {value: meta.type}
            });
            this.get().setAttribute('data-id', this.id);
        },

        inherit: se.StyledElement,

        members: {

            /**
             * [TODO: _oncomponentadded description]
             * @protected
             *
             * @param {Component} component
             *      [TODO: description]
             * @returns {ComponentGroup}
             *      The instance on which the member is called.
             */
            _oncomponentadded: function _oncomponentadded(component) {

                component.draggable = new Wirecloud.ui.Draggable(component.get(), {component: component},
                    component_ondragstart.bind(this),
                    component_ondrag.bind(this),
                    component_ondragend.bind(this),
                    function canDrag() {return component.enabled;}
                );

                return this;
            },

            /**
             * [TODO: appendVersion description]
             *
             * @param {OperatorMeta|WidgetMeta} meta
             *      [TODO: description]
             * @returns {ComponentGroup}
             *      The instance on which the member is called.
             */
            appendVersion: function appendVersion(meta) {
                this.versions[meta.version] = meta;
                this.meta.version.addEntries([{label: 'v' + meta.version.text, value: meta.version.text}]);

                if (this.latestVersion == null || this.latestVersion.version.compareTo(meta.version) < 0) {
                    showLatestVersion.call(this, meta);
                }

                return this;
            },

            /**
             * [TODO: appendWiringComponent description]
             * @param {Operator|Widget} wiringComponent
             *      [TODO: description]
             * @returns {ComponentGroup}
             *      The instance on which the member is called.
             */
            appendWiringComponent: function appendWiringComponent(wiringComponent) {
                var component = new ns.Component(wiringComponent);

                this.children[component.id] = component.appendTo(this.wrapperElement);

                return this._oncomponentadded(component);
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var defaults = {
        createWiringComponent: null,
        getComponentDraggable: null,
    };

    var btncreate_onclick = function btncreate_onclick() {
        this.createWiringComponent(this.currentVersion, {
            onSuccess: function (wiringComponent) {
                this.appendWiringComponent(wiringComponent);
            }.bind(this)
        });
    };

    var component_ondragstart = function component_ondragstart(draggable, context, event) {
        var bcr = this.layout.getBoundingClientRect();

        context.element = this.getComponentDraggable(context.component._component);
        context.element.appendTo(this.layout.slideOut().get());

        context.x = event.clientX - bcr.left - (context.element.wrapperElement.offsetWidth / 2);
        context.y = event.clientY - bcr.top - (context.element.heading.wrapperElement.offsetHeight / 2);

        context.component.disable();

        context.element
            .addClassName("cloned dragging")
            .position({
                x: context.x,
                y: context.y
            });
    };

    var component_ondrag = function component_ondrag(event, draggable, context, xDelta, yDelta) {
        var layout;

        if (!this.layout.content.has(context.element)) {
            layout = this.layout.content.get();

            context.x += layout.scrollLeft;
            context.y += layout.scrollTop;

            context.element.remove();
            this.layout.content.appendChild(context.element);
        }

        context.element.position({
            x: context.x + xDelta,
            y: context.y + yDelta
        });
    };

    var component_ondragend = function component_ondragend(draggable, context) {

        if (!this.layout.content.has(context.element)) {
            context.element.remove();
            this.layout.content.appendChild(context.element);
        }

        context.element.removeClassName("cloned dragging");
        context.element.trigger('change', context.element.toJSON());

        this.layout.slideIn(0);
    };

    var version_onchange = function version_onchange(select) {
        this.currentVersion = this.versions[select.getValue()];
        this.meta.showVersion(this.currentVersion);
    };

    var showLatestVersion = function showLatestVersion(meta) {
        this.latestVersion = meta;
        this.currentVersion = meta;
        this.meta.version.setValue(meta.version);

        return this;
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
