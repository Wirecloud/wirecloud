/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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

    /**
     * Create a new instance of class Behaviour.
     * @extends {Panel}
     *
     * @constructor
     * @param {PlainObject} [options]
     *      [TODO: description]
     */
    ns.Behaviour = function Behaviour(index, options) {
        var descriptionElement;

        options = utils.updateObject(ns.Behaviour.JSON_TEMPLATE, options);

        this.title_tooltip = new se.Tooltip({content: options.title, placement: ["top", "bottom", "right", "left"]});

        this.btnPrefs = new se.PopupButton({
            title: utils.gettext("Preferences"),
            class: "we-prefs-btn",
            iconClass: "fa fa-reorder"
        });
        this.btnPrefs.popup_menu.append(new ns.BehaviourPrefs(this));

        this.btnRemove = new se.Button({
            title: utils.gettext("Remove"),
            class: "btn-remove",
            iconClass: "fa fa-times-circle"
        });
        this.btnRemove.addEventListener('click', btnremove_onclick.bind(this));

        se.Panel.call(this, {
            events: events,
            class: "behaviour",
            title: options.title,
            selectable: true,
            buttons: [this.btnPrefs, this.btnRemove]
        });

        this.heading.title.addClassName("se-link behaviour-title text-truncate");

        descriptionElement = document.createElement('p');
        descriptionElement.className = "behaviour-description";
        descriptionElement.textContent = options.description;
        this.body.appendChild(descriptionElement);

        Object.defineProperties(this, {

            description: {
                get: function get() {return descriptionElement.textContent;},
                set: function set(value) {
                    descriptionElement.textContent = value != null && value.trim() !== "" ? value : ns.Behaviour.JSON_TEMPLATE.description;
                }
            },

            index: {
                get: function () {
                    return Number(this.get().getAttribute('data-index'));
                },
                set: function (value) {
                    value = Number(value);
                    if (isNaN(value)) {
                        throw new TypeError("Invalid index value");
                    }
                    this.get().setAttribute('data-index', value);
                }
            },

            logManager: {value: new Wirecloud.LogManager(Wirecloud.GlobalLogManager)}

        });

        this.active = options.active;
        this.index = index;

        this.components = options.components;
        this.connections = options.connections;
    };

    ns.Behaviour.JSON_TEMPLATE = {
        title: "",
        description: "",
        active: false,
        components: {operator: {}, widget: {}},
        connections: []
    };

    utils.inherit(ns.Behaviour, se.Panel, {

        /**
         * @override
         */
        _onclick: function _onclick(event) {

            if (!this.active) {
                se.Panel.prototype._onclick.call(this, event);
            }

            return this;
        },

        /**
         * @override
         */
        clear: function clear() {

            this.components = {operator: {}, widget: {}};
            this.connections = [];

            return this.dispatchEvent('change');
        },

        /**
         * @override
         */
        setTitle: function setTitle(title) {
            var span;

            span = document.createElement('span');
            span.textContent = title;
            this.title_tooltip.options.content = title;
            this.title_tooltip.bind(span);

            return se.Panel.prototype.setTitle.call(this, span);
        },

        /**
         * [TODO: equals description]
         *
         * @param {Wirecloud.ui.WiringEditor.Behaviour} behaviour
         *      [TODO: description]
         * @returns {Boolean}
         *      [TODO: description]
         */
        equals: function equals(behaviour) {
            return this === behaviour;
        },

        getConnectionIndex: function getConnectionIndex(connection) {
            var _connection, i;

            for (i = 0; i < this.connections.length; i++) {
                _connection = this.connections[i];

                if (_connection.sourcename === connection.sourceId && _connection.targetname === connection.targetId) {
                    return i;
                }
            }

            return -1;
        },

        getCurrentStatus: function getCurrentStatus() {
            return {
                title: this.title,
                connections: this.connections.length,
                components: {
                    operator: Object.keys(this.components.operator).length,
                    widget: Object.keys(this.components.widget).length
                }
            };
        },

        /**
         * Checks if the given component is present in the behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.ComponentDraggable} component
         *      component to check
         * @returns {Boolean}
         *      true if the component is present on this behaviour
         */
        hasComponent: function hasComponent(component) {
            return component.id in this.components[component.type];
        },

        /**
         * Checks if the given connection is present in the behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.Connection} connection
         *      Connection to check
         * @returns {Boolean}
         *      true if the connection is present on this behaviour
         */
        hasConnection: function hasConnection(connection) {
            return this.connections.some(function (vInfo) {
                return vInfo.sourcename === connection.sourceId && vInfo.targetname === connection.targetId;
            });
        },

        /**
         * Removes a component from the behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.ComponentDraggable} component
         *      Component to remove from the behaviour
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        removeComponent: function removeComponent(component) {
            if (this.hasComponent(component)) {
                delete this.components[component.type][component.id];
                this.dispatchEvent('change');
            }
            return this;
        },

        /**
         * Removes a connection from the behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.Connection} connection
         *      Connection to remove
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        removeConnection: function removeConnection(connection) {
            var index = this.getConnectionIndex(connection);

            if (index !== -1) {
                this.connections.splice(index, 1);
                this.dispatchEvent('change');
            }

            return this;
        },

        /**
         * [TODO: showLogs description]
         *
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        showLogs: function showLogs() {
            var modal = new Wirecloud.ui.LogWindowMenu(this.logManager, {
                title: utils.interpolate(utils.gettext("%(behaviour_title)s's logs"), {
                    behaviour_title: this.title
                })
            });
            modal.show();

            return this;
        },

        /**
         * Displays a FormWindowMenu to update behaviour details
         *
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        showSettings: function showSettings() {

            var dialog = new Wirecloud.ui.FormWindowMenu(
                [
                    {name: "title", label: utils.gettext("Title"), required: true, type: "text"},
                    {name: "description", label: utils.gettext("Description"), type: "longtext"}
                ],
                utils.gettext("Behaviour settings"),
                "behaviour-update-form"
            );

            dialog.executeOperation = updateInfo.bind(this);
            dialog.show().setValue(this);

            return this;
        },

        /**
         * [TODO: toJSON description]
         *
         * @returns {PlainObject}
         *      [TODO: description]
         */
        toJSON: function toJSON() {
            return {
                title: this.title,
                description: this.description,
                active: this.active,
                components: this.components,
                connections: this.connections
            };
        },

        /**
         * Adds or updates a component
         *
         * @param {Wirecloud.ui.WiringEditor.ComponentDraggable} component
         *      Component to add/update
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        updateComponent: function updateComponent(component) {
            if (!this.hasComponent(component)) {
                this.components[component.type][component.id] = {};
                this.dispatchEvent('change');
            }

            return this;
        },

        /**
         * Adds or updates a connection in the behaviour
         *
         * @param {Wirecloud.ui.WiringEditor.Connection} connection
         *      Connection to add/update
         * @returns {Wirecloud.ui.WiringEditor.Behaviour}
         *      The instance on which the member is called.
         */
        updateConnection: function updateConnection(connection, view) {

            let index = this.getConnectionIndex(connection);

            if (index === -1) {
                index = this.connections.push({
                    sourcename: connection.sourceId,
                    targetname: connection.targetId
                });

                this.dispatchEvent('change');
            }

            return this;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var events = ['change', 'optremove'];

    var btnremove_onclick = function btnremove_onclick(event) {
        var dialog, message;

        message = utils.gettext("The following operation is irreversible and removes the behaviour completely. Would you like to continue?");

        dialog = new Wirecloud.ui.AlertWindowMenu({
            message: message,
            acceptLabel: utils.gettext("Continue"),
            cancelLabel: utils.gettext("No, thank you")
        });
        dialog.setHandler(() => {
            this.dispatchEvent('optremove');
        }).show();
    };

    var updateInfo = function updateInfo(data) {
        this.setTitle(data.title != null && data.title.trim() !== "" ? data.title : ns.Behaviour.JSON_TEMPLATE.title);
        this.description = data.description;
        this.dispatchEvent('change');
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
