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
     * Create a new instance of class Behaviour.
     * @extends {Panel}
     *
     * @constructor
     * @param {PlainObject} [options]
     *      [TODO: description]
     */
    ns.Behaviour = utils.defineClass({

        constructor: function Behaviour(options) {
            var descriptionElement;

            options = utils.updateObject(ns.Behaviour.JSON_TEMPLATE, options);

            if (!options.title) {
                options.title = ns.Behaviour.JSON_TEMPLATE.title;
            }

            if (!options.description) {
                options.description = ns.Behaviour.JSON_TEMPLATE.description;
            }

            this.btnPrefs = new se.PopupButton({
                title: gettext("Preferences"),
                extraClass: "btn-show-prefs",
                iconClass: "icon-reorder"
            });
            this.btnPrefs.popup_menu.append(new ns.BehaviourPrefs(this));

            this.btnRemove = new se.Button({
                title: gettext("Remove"),
                extraClass: "btn-remove",
                iconClass: "icon-remove-sign"
            });
            this.btnRemove.on('click', btnremove_onclick.bind(this));

            this.superClass({
                events: events,
                extraClass: "behaviour",
                title: options.title,
                selectable: true,
                buttons: [this.btnPrefs, this.btnRemove]
            });

            this.heading.title.addClass("se-link behaviour-title");

            descriptionElement = document.createElement('p');
            descriptionElement.className = "behaviour-description";
            descriptionElement.textContent = options.description;
            this.body.append(descriptionElement);

            Object.defineProperties(this, {

                description: {
                    get: function get() {return descriptionElement.textContent;},
                    set: function set(value) {descriptionElement.textContent = value ? value : ns.Behaviour.JSON_TEMPLATE.description;}
                },

                logManager: {value: new ns.BehaviourLogManager(this)}

            });

            this.active = options.active;

            this.components = options.components;
            this.connections = options.connections;
        },

        inherit: se.Panel,

        statics: {

            JSON_TEMPLATE: {
                title: gettext("New behaviour"),
                description: gettext("No description provided."),
                active: false,
                components: {operator: {}, widget: {}},
                connections: []
            }

        },

        members: {

            /**
             * @override
             */
            _onclick: function _onclick(event) {

                if (!this.active) {
                    this.superMember(se.Panel, '_onclick', event);
                }

                return this;
            },

            /**
             * @override
             */
            empty: function empty() {

                this.components = {operator: {}, widget: {}};
                this.connections = [];

                return this.trigger('change');
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
                return behaviour instanceof ns.Behaviour && Object.is(this, behaviour);
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

                return this.trigger('change');
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

                return this.trigger('change');
            },

            /**
             * [TODO: showLogs description]
             *
             * @returns {Behaviour}
             *      The instance on which the member is called.
             */
            showLogs: function showLogs() {
                var modal = new Wirecloud.ui.LogWindowMenu(this.logManager);
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

                return this.trigger('change');
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
                var name, vInfo, index = this.getConnectionIndex(connection);

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

                return this.trigger('change');
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var events = ['change', 'optremove'];

    function btnremove_onclick(event) {
        var dialog, message;

        message = gettext("The following operation is irreversible " +
            "and removes the behaviour completely. " +
            "Would you like to continue?");

        dialog = new Wirecloud.ui.AlertWindowMenu({
            acceptLabel: gettext("Continue"),
            cancelLabel: gettext("No, thank you")
        });
        dialog.setMsg(message);
        dialog.acceptHandler = function () {
            this.trigger('optremove');
        }.bind(this);
        dialog.show();
    }

    function displayUpdateForm() {
        var dialog = new Wirecloud.ui.FormWindowMenu([
                {name: 'title', label: gettext("Title"), type: 'text'},
                {name: 'description', label: gettext("Description"), type: 'longtext'}
            ],
            gettext("Behaviour settings"),
            'behaviour-update-form');

        dialog.executeOperation = function (data) {
            updateInfo.call(this, data);
        }.bind(this);

        dialog.show();
        dialog.setValue({
            title: this.title,
            description: this.description
        });
    }

    function updateInfo(data) {
        this.heading.title.text(data.title ? data.title : ns.Behaviour.JSON_TEMPLATE.title);
        this.description = data.description;
        this.trigger('change');
    }

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
