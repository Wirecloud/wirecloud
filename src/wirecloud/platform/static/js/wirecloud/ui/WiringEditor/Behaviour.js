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

        if (!options.title) {
            options.title = ns.Behaviour.JSON_TEMPLATE.title;
        }

        if (!options.description) {
            options.description = ns.Behaviour.JSON_TEMPLATE.description;
        }

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
                set: function set(value) {descriptionElement.textContent = value ? value : ns.Behaviour.JSON_TEMPLATE.description;}
            },

            index: {
                get: function () {
                    return this.get().getAttribute('data-index');
                },
                set: function (value) {
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
        title: utils.gettext("New behaviour"),
        description: utils.gettext("No description provided."),
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
         * @param {Behaviour} behaviour
         *      [TODO: description]
         * @returns {Boolean}
         *      [TODO: description]
         */
        equals: function equals(behaviour) {
            return (behaviour instanceof ns.Behaviour) && (this === behaviour);
        },

        getConnectionIndex: function getConnectionIndex(connection) {
            var _connection, found, i, index = -1;

            for (found = false, i = 0; !found && i < this.connections.length; i++) {
                _connection = this.connections[i];

                if (_connection.sourcename == connection.sourceId && _connection.targetname == connection.targetId) {
                    found = true;
                    index = i;
                }
            }

            return index;
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
         * [TODO: hasComponent description]
         *
         * @param {Component} component
         *      [TODO: description]
         * @returns {Boolean}
         *      [TODO: description]
         */
        hasComponent: function hasComponent(component) {
            return component.id in this.components[component.type];
        },

        /**
         * [TODO: hasComponentView description]
         *
         * @param {Component} component
         *      [TODO: description]
         * @returns {Boolean}
         *      [TODO: description]
         */
        hasComponentView: function hasComponentView(component) {
            return Object.keys(this.components[component.type][component.id] || {}).length > 0;
        },

        /**
         * [TODO: hasConnection description]
         *
         * @param {Connection} connection
         *      [TODO: description]
         * @returns {Boolean}
         *      [TODO: description]
         */
        hasConnection: function hasConnection(connection) {
            return this.connections.some(function (vInfo) {
                return vInfo.sourcename == connection.sourceId && vInfo.targetname == connection.targetId;
            });
        },

        /**
         * [TODO: removeComponent description]
         *
         * @param {ComponentDraggable} component
         *      [TODO: description]
         * @returns {Behaviour}
         *      The instance on which the member is called.
         */
        removeComponent: function removeComponent(component) {

            if (this.hasComponent(component)) {
                delete this.components[component.type][component.id];
            }

            return this.dispatchEvent('change');
        },

        /**
         * [TODO: removeConnection description]
         *
         * @param {Connection} connection
         *      [TODO: description]
         * @returns {Behaviour}
         *      The instance on which the member is called.
         */
        removeConnection: function removeConnection(connection) {
            var index = this.getConnectionIndex(connection);

            if (index !== -1) {
                this.connections.splice(index, 1);
            }

            return this.dispatchEvent('change');
        },

        /**
         * [TODO: showLogs description]
         *
         * @returns {Behaviour}
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
         * [TODO: showSettings description]
         *
         * @returns {Behaviour}
         *      The instance on which the member is called.
         */
        showSettings: function showSettings() {

            displayUpdateForm.call(this);

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
         * [TODO: updateComponent description]
         *
         * @param {ComponentDraggable} component
         *      [TODO: description]
         * @param {PlainObject} [view]
         *      [TODO: description]
         * @returns {Behaviour}
         *      The instance on which the member is called.
         */
        updateComponent: function updateComponent(component, view) {
            var name;

            if (!this.hasComponent(component)) {
                this.components[component.type][component.id] = {};
            }

            view = view || {};

            for (name in view) {
                this.components[component.type][component.id][name] = view[name];
            }

            return this.dispatchEvent('change');
        },

        /**
         * [TODO: updateConnection description]
         *
         * @param {Connection} connection
         *      [TODO: description]
         * @param {PlainObject} [view]
         *      [TODO: description]
         * @returns {Behaviour}
         *      The instance on which the member is called.
         */
        updateConnection: function updateConnection(connection, view) {
            var name, index;

            index = this.getConnectionIndex(connection);

            if (index < 0) {
                index = this.connections.push({
                    sourcename: connection.sourceId,
                    targetname: connection.targetId
                });
            }

            view = view || {};

            for (name in view) {
                this.connections[index][name] = view[name];
            }

            return this.dispatchEvent('change');
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
            acceptLabel: utils.gettext("Continue"),
            cancelLabel: utils.gettext("No, thank you")
        });
        dialog.setMsg(message);
        dialog.acceptHandler = function () {
            this.dispatchEvent('optremove');
        }.bind(this);
        dialog.show();
    };

    var displayUpdateForm = function displayUpdateForm() {
        var dialog = new Wirecloud.ui.FormWindowMenu(
            [
                {name: 'title', label: utils.gettext("Title"), type: 'text'},
                {name: 'description', label: utils.gettext("Description"), type: 'longtext'}
            ],
            utils.gettext("Behaviour settings"),
            'behaviour-update-form'
        );

        dialog.executeOperation = function (data) {
            updateInfo.call(this, data);
        }.bind(this);

        dialog.show();
        dialog.setValue(this);
    };

    var updateInfo = function updateInfo(data) {
        this.setTitle(data.title ? data.title : ns.Behaviour.JSON_TEMPLATE.title);
        this.description = data.description;
        this.dispatchEvent('change');
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
