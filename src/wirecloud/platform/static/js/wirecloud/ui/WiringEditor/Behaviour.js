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
     * Create a new instance of class Behavior.
     * @extends {Panel}
     *
     * @constructor
     * @param {Object.<String, *>} [options]
     *      [description]
     */
    ns.Behavior = utils.defineClass({

        constructor: function Behavior(options) {
            var descriptionElement;

            options = utils.updateObject(defaults, options);

            if (!options.title) {
                options.title = defaults.title;
            }

            if (!options.description) {
                options.description = defaults.description;
            }

            this.btnShowInfo = new se.Button({
                'title': gettext("Settings"),
                'class': 'btn-show-settings',
                'iconClass': 'icon-tasks'
            });
            this.btnShowInfo.on('click', displayUpdateForm, this);

            this.btnRemove = new se.Button({
                'title': gettext("Remove"),
                'class': 'btn-activate',
                'iconClass': 'icon-remove'
            });
            this.btnRemove.on('click', handleOnRemove, this);

            this.superClass(events, {
                extraClass: 'behavior',
                title: options.title,
                optionList: [this.btnShowInfo, this.btnRemove]
            });

            this.title.addClass('se-link behavior-title');

            descriptionElement = document.createElement('p');
            descriptionElement.className = 'behavior-description';
            descriptionElement.textContent = options.description;
            this.body.append(descriptionElement);

            Object.defineProperty(this, 'description', {
                get: function get() {
                    return descriptionElement.textContent;
                },
                set: function set(value) {
                    descriptionElement.textContent = value ? value : defaults.description;
                }
            });

            this.active = options.active;
            this.components = options.components;
            this.connections = options.connections;
        },

        inherit: se.Panel,

        members: {

            /**
             * @override
             */
            _onclick: function _onclick(event) {
                if (!this.active) {
                    this.superMember('_onclick', event);
                }
            },

            /**
             * [empty description]
             *
             * @returns {Behavoir}
             *      [description]
             */
            empty: function empty() {
                this.components = {
                    operator: {},
                    widget: {}
                };
                this.connections.length = 0;

                return this;
            },

            /**
             * [equals description]
             *
             * @param {Behavior} behavior
             *      [description]
             * @returns {Boolean}
             *      [description]
             */
            equals: function equals(behavior) {
                return behavior instanceof ns.Behavior && Object.is(this, behavior);
            },

            /**
             * [findComponent description]
             *
             * @param {String} type
             *      [description]
             * @param {String|Number} id
             *      [description]
             * @returns {Object.<String, *>}
             *      [description]
             */
            findComponent: function findComponent(type, id) {
                return this.components[type][id];
            },

            /**
             * [findConnection description]
             *
             * @param {String} sourceName
             *      [description]
             * @param {String} targetName
             *      [description]
             * @returns {Object.<String, *>}
             *      [description]
             */
            findConnection: function findConnection(sourceName, targetName) {
                var index = getConnectionIndex.call(this, sourceName, targetName);

                return index !== -1 ? this.connections[index] : null;
            },

            /**
             * [hasComponent description]
             *
             * @param {String} type
             *      [description]
             * @param {String|Number} id
             *      [description]
             * @returns {Boolean}
             *      [description]
             */
            hasComponent: function hasComponent(type, id) {
                return id in this.components[type];
            },

            /**
             * [hasComponentView description]
             *
             * @param {String} type
             *      [description]
             * @param {String|Number} id
             *      [description]
             * @returns {Boolean}
             *      [description]
             */
            hasComponentView: function hasComponentView(type, id) {
                return Object.keys(this.components[type][id] || {}).length > 0;
            },

            /**
             * [hasConnection description]
             *
             * @param {String} sourceName
             *      [description]
             * @param {String} targetName
             *      [description]
             * @returns {Boolean}
             *      [description]
             */
            hasConnection: function hasConnection(sourceName, targetName) {
                return this.connections.some(function (connection) {
                    return connection.sourcename == sourceName && connection.targetname == targetName;
                });
            },

            /**
             * [removeComponent description]
             *
             * @param {String} type
             *      [description]
             * @param {String|Number} id
             *      [description]
             * @returns {Behavoir}
             *      [description]
             */
            removeComponent: function removeComponent(type, id) {
                delete this.components[type][id];

                return this.trigger('update', this);
            },

            /**
             * [removeConnection description]
             *
             * @param {String} sourceName
             *      [description]
             * @param {String} targetName
             *      [description]
             * @returns {Behavoir}
             *      [description]
             */
            removeConnection: function removeConnection(sourceName, targetName) {
                var index = getConnectionIndex.call(this, sourceName, targetName);

                if (index !== -1) {
                    this.connections.splice(index, 1);
                }

                return this.trigger('update', this);
            },

            /**
             * [serialize description]
             *
             * @returns {Object.<String, *>}
             *      [description]
             */
            serialize: function serialize() {
                return {
                    title: this.title.text(),
                    description: this.description,
                    active: this.active,
                    components: this.components,
                    connections: this.connections
                };
            },

            /**
             * [updateComponent description]
             *
             * @param {String} type
             *      [description]
             * @param {String|Number} id
             *      [description]
             * @param  {[type]} view [description]
             * @returns {Behavoir}
             *      [description]
             */
            updateComponent: function updateComponent(type, id, view) {
                view = view || {};

                if (this.hasComponentView(type, id) && !Object.keys(view).length) {
                    return this;
                }

                this.components[type][id] = view;

                return this.trigger('update', this);
            },

            /**
             * @public
             * @function
             *
             * @param {Object.<String, *>} data
             * @returns {Behavior} The instance on which this function was called.
             */
            updateConnection: function updateConnection(view) {
                var index = getConnectionIndex.call(this, view.sourcename, view.targetname);

                if (index !== -1) {
                    this.connections[index] = {
                        sourcename: view.sourcename,
                        targetname: view.targetname
                    };
                } else {
                    this.connections.push({
                        sourcename: view.sourcename,
                        targetname: view.targetname
                    });
                }

                return this.trigger('update', this);
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var defaults = {
        title: "New behavior",
        description: "No description provided.",
        active: false,
        components: {
            operator: {},
            widget: {}
        },
        connections: []
    };

    var events = ['remove', 'update'];

    var displayUpdateForm = function displayUpdateForm() {
        var dialog = new Wirecloud.ui.FormWindowMenu([
                {name: 'title', label: gettext("Title"), type: 'text'},
                {name: 'description', label: gettext("Description"), type: 'longtext'}
            ],
            gettext("Behavior Info"),
            'behavior-update-form');

        dialog.executeOperation = function (data) {
            updateInfo.call(this, data);
        }.bind(this);

        dialog.show();
        dialog.setValue({
            title: this.title.text(),
            description: this.description
        });
    };

    var getConnectionIndex = function getConnectionIndex(sourceName, targetName) {
        var connection, found, i, index = -1;

        for (found = false, i = 0; !found && i < this.connections.length; i++) {
            connection = this.connections[i];

            if (connection.sourcename == sourceName && connection.targetname == targetName) {
                found = true;
                index = i;
            }
        }

        return index;
    };

    var handleOnRemove = function handleOnRemove(event) {
        var dialog, message;

        message = gettext("The following operation is irreversible " +
            "and removes the selected behavior completely. " +
            "Would you like to continue?");

        dialog = new Wirecloud.ui.AlertWindowMenu({
            acceptLabel: gettext("Yes, remove"),
            cancelLabel: gettext("No, thank you")
        });
        dialog.setMsg(message);
        dialog.acceptHandler = function () {
            this.trigger('remove', this, event);
        }.bind(this);
        dialog.show();
    };

    var updateInfo = function updateInfo(data) {
        this.title.text(data.title ? data.title : defaults.title);
        this.description = data.description;
        this.trigger('update', this);
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
