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

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * Creates a new instance of class Endpoint.
     *
     * @extends {StyledElements.StyledElement}
     * @name Wirecloud.ui.WiringEditor.Endpoint
     *
     * @constructor
     * @param {String} type
     *      [TODO: description]
     * @param {Wiring.Endpoint} wiringEndpoint
     *      [TODO: description]
     * @param {ComponentDraggable} component
     *      [TODO: description]
     */
    ns.Endpoint = function Endpoint(type, wiringEndpoint, component) {
        se.StyledElement.call(this, events);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "endpoint";

        this.titleElement = document.createElement('span');
        this.titleElement.className = "endpoint-title";
        this.wrapperElement.appendChild(this.titleElement);

        this.anchorElement = document.createElement('span');
        this.anchorElement.className = "endpoint-anchor";
        this.wrapperElement.appendChild(this.anchorElement);

        this._endpoint = wiringEndpoint;
        this.component = component;

        this.activeCount = 0;
        this.connections = [];

        Object.defineProperties(this, {

            active: {
                get: function get() {return this.hasClassName('active');},
                set: function set(value) {this.toggleClassName('active', value);}
            },

            anchorPosition: {
                get: function get() {return getAnchorPosition.call(this);}
            },

            editableConnection: {
                get: function get() {return getEditableConnection.call(this);}
            },

            id: {value: [component.type, component.id, wiringEndpoint.name].join("/")},

            index: {
                get: function get() {return parseInt(this.get().getAttribute('data-index'), 10);},
                set: function set(value) {this.get().setAttribute('data-index', value);}
            },

            friendcodeList: {value: wiringEndpoint.friendcodeList},

            missing: {
                get: function get() {return this.hasClassName('missing');},
                set: function set(value) {this.toggleClassName('missing', value);}
            },

            name: {value: wiringEndpoint.name},

            title: {
                get: function get() {return this.titleElement.textContent;},
                set: function set(value) {this.titleElement.textContent = value;}
            },

            type: {value: type}

        });
        this.get().setAttribute('data-name', this._endpoint.name);

        this.title = wiringEndpoint.label;
        if (wiringEndpoint.missing) {
            this.missing = true;
        }

        this.rightAnchorPoint = false;

        this.tooltip = new se.Popover({
            title: wiringEndpoint.label,
            content: wiringEndpoint.description !== '' ? wiringEndpoint.description : utils.gettext("No description provided."),
            placement: ['top', 'bottom', 'right', 'left']
        });
        this.tooltip.bind(this.get(), 'hover');

        this.get().addEventListener('mousedown', endpoint_onmousedown.bind(this));
        this.get().addEventListener('mouseenter', endpoint_onmouseenter.bind(this));
        this.get().addEventListener('mouseleave', endpoint_onmouseleave.bind(this));
        this.get().addEventListener('mouseup', endpoint_onmouseup.bind(this));
    };

    utils.inherit(ns.Endpoint, se.StyledElement, /** @lends Wirecloud.ui.WiringEditor.Endpoint.prototype */ {

        /**
         * [TODO: activate description]
         *
         * @returns {Endpoint}
         *      The instance on which the member is called.
         */
        activate: function activate() {

            if (this.activeCount === 0) {
                this.active = true;
            }

            this.activeCount++;

            return this;
        },

        /**
         * [TODO: activateAll description]
         *
         * @returns {Endpoint}
         *      The instance on which the member is called.
         */
        activateAll: function activateAll() {
            return this.forEachConnection(function (connection) {
                connection.activate();
            });
        },

        /**
         * [TODO: appendConnection description]
         *
         * @param {Connection} connection
         *      [TODO: description]
         * @returns {Endpoint}
         *      The instance on which the member is called.
         */
        appendConnection: function appendConnection(connection, updateEndpoint) {

            this.connections.push(connection);

            if (!!updateEndpoint) {
                connection.refreshEndpoint(this);
            }

            return this.dispatchEvent('connectionadded', connection);
        },

        /**
         * [TODO: deactivate description]
         *
         * @returns {Endpoint}
         *      The instance on which the member is called.
         */
        deactivate: function deactivate() {

            if (this.activeCount === 0) {
                return this;
            }

            this.activeCount--;

            if (this.activeCount === 0) {
                this.active = false;
            }

            return this;
        },

        /**
         * [TODO: deactivateAll description]
         *
         * @returns {Endpoint}
         *      The instance on which the member is called.
         */
        deactivateAll: function deactivateAll() {
            return this.forEachConnection(function (connection) {
                connection.deactivate();
            });
        },

        /**
         * [TODO: empty description]
         *
         * @returns {Endpoint}
         *      The instance on which the member is called.
         */
        empty: function empty() {
            var i;

            for (i = this.connections.length - 1; i >= 0; i--) {
                this.connections[i].remove();
            }

            return this;
        },

        /**
         * [TODO: equals description]
         *
         * @param {Endpoint} endpoint
         *      [TODO: description]
         * @returns {Boolean}
         *      [TODO: description]
         */
        equals: function equals(endpoint) {

            if (!(endpoint instanceof ns.Endpoint)) {
                return false;
            }

            return this.type === endpoint.type && this.id === endpoint.id;
        },

        /**
         * [TODO: forEachConnection description]
         *
         * @param {Function} callback
         *      [TODO: description]
         * @returns {Endpoint}
         *      The instance on which the member is called.
         */
        forEachConnection: function forEachConnection(callback) {

            for (var i = this.connections.length - 1; i >= 0; i--) {
                callback(this.connections[i], i);
            }

            return this;
        },

        /**
         * [TODO: getConnectionTo description]
         *
         * @param {Endpoint} endpoint
         *      [description]
         * @returns {Connection}
         *      [TODO: description]
         */
        getConnectionTo: function getConnectionTo(endpoint) {
            var connection, i;

            for (i = this.connections.length - 1; connection == null && i >= 0; i--) {
                if (this.connections[i].hasEndpoint(endpoint)) {
                    connection = this.connections[i];
                }
            }

            return connection;
        },

        /**
         * @param {Connection} connection
         * @returns {Boolean}
         */
        hasConnection: function hasConnection(connection) {

            if (!(connection instanceof ns.Connection)) {
                return false;
            }

            return this.connections.some(function (connectionSaved) {
                return connectionSaved.equals(connection);
            });
        },

        /**
         * [TODO: hasConnections description]
         *
         * @returns {Boolean}
         *      [TODO: description]
         */
        hasConnections: function hasConnections() {
            return this.connections.length > 0;
        },

        /**
         * [TODO: hasConnectionTo description]
         *
         * @param {Endpoint} endpoint
         *      [TODO: description]
         * @returns {Boolean}
         *      [TODO: description]
         */
        hasConnectionTo: function hasConnectionTo(endpoint) {
            return this.connections.some(function (connection) {
                return connection.hasEndpoint(endpoint);
            });
        },

        /**
         * [TODO: refresh description]
         *
         * @returns {Endpoint}
         *      The instance on which the member is called.
         */
        refresh: function refresh() {
            return this.connections.forEach(function (connection) {
                connection.refresh();
            });
        },

        /**
         * [TODO: removeConnection description]
         *
         * @param {Connection} connection
         *      [TODO: description]
         * @returns {Endpoint}
         *      The instance on which the member is called.
         */
        removeConnection: function removeConnection(connection) {
            var index = this.connections.indexOf(connection);

            if (index !== -1) {
                this.connections.splice(index, 1);
                this.dispatchEvent('connectionremoved', connection);
            }

            return this;
        },

        /**
         * [TODO: toggleActive description]
         *
         * @param {Boolean} active
         *      [TODO: description]
         * @returns {Endpoint}
         *      The instance on which the member is called.
         */
        toggleActive: function toggleActive(active) {
            return active ? this.activate() : this.deactivate();
        },

        /**
         * [TODO: toJSON description]
         *
         * @returns {PlainObject}
         *      [TODO: description]
         */
        toJSON: function toJSON() {
            return {
                type: this.component.type,
                id: this.component.id,
                endpoint: this.name
            };
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var events = ['click', 'connectionadded', 'connectionremoved', 'mousedown', 'mouseenter', 'mouseleave', 'mouseup'];

    var endpoint_onmousedown = function endpoint_onmousedown(event) {

        if (this.enabled && event.button === 0) {
            event.stopPropagation();
            event.preventDefault();  // Required for disabling text selection
            this.dispatchEvent('mousedown', event);
        }
    };

    var endpoint_onmouseenter = function endpoint_onmouseenter(event) {

        if (this.enabled) {
            event.stopPropagation();
            this.dispatchEvent('mouseenter', event);
        }
    };

    var endpoint_onmouseleave = function endpoint_onmouseleave(event) {

        if (this.enabled) {
            event.stopPropagation();
            this.dispatchEvent('mouseleave', event);
        }
    };

    var endpoint_onmouseup = function endpoint_onmouseup(event) {

        if (this.enabled && event.button === 0) {
            event.stopPropagation();
            event.preventDefault();  // Required for disabling text selection
            this.dispatchEvent('mouseup', event);
        }
    };

    var getAnchorPosition = function getAnchorPosition() {
        var layout    = this.component.parent(),
            layoutBCR = layout.getBoundingClientRect(),
            anchorBCR = this.anchorElement.getBoundingClientRect();

        var anchorPosition = {
            x: Math.round(anchorBCR.left - (layoutBCR.left + 1) + layout.scrollLeft),
            y: Math.round(anchorBCR.top + (this.anchorElement.offsetHeight / 2) - (layoutBCR.top + 1) + layout.scrollTop)
        };

        if (this.rightAnchorPoint) {
            anchorPosition.x = Math.round(anchorPosition.x + this.anchorElement.offsetWidth);
        }

        return anchorPosition;
    };

    var getEditableConnection = function getEditableConnection() {
        var connection, i;

        for (i = 0; connection == null && i < this.connections.length; i++) {
            if (this.connections[i].editable) {
                connection = this.connections[i];
            }
        }

        return connection;
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
