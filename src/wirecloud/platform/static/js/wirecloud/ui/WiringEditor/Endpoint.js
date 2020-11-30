/*
 *     Copyright (c) 2015-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.
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

    ns.Endpoint = class Endpoint extends se.StyledElement {

        /**
         * Creates a visual representation of a wiring endpoint for being used on
         * the Wiring Editor user interface.
         *
         * @extends {StyledElements.StyledElement}
         * @name Wirecloud.ui.WiringEditor.Endpoint
         *
         * @constructor
         * @param {String} type
         *      `"source"` for output endpoints and `"target"` for input endpoints
         * @param {Wirecloud.wiring.Endpoint} wiringEndpoint
         *      Real endpoint instance
         * @param {Wirecloud.ui.WiringEditor.ComponentDraggable} component
         *      WiringEditor component associated with the endpoint
         */
        constructor(wiringEndpoint, component) {
            let type;

            if (wiringEndpoint instanceof Wirecloud.wiring.SourceEndpoint) {
                type = "source";
            } else if (wiringEndpoint instanceof Wirecloud.wiring.TargetEndpoint) {
                type = "target";
            } else {
                throw new TypeError('invalid wiringEndpoint parameter');
            }

            super(events);

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

                anchorPosition: {
                    get: getAnchorPosition
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

            this.rightAnchorPoint = type === "source";

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
        }

        get active() {
            return this.hasClassName('active');
        }

        set active(value) {
            this.toggleClassName('active', value);
        }

        /**
         * Increments the activation count for this endpoint and, if the
         * activation count is 0 before calling, activates this endpoint.
         *
         * @returns {Wirecloud.ui.WiringEditor.Endpoint}
         *      The instance on which the member is called.
         */
        activate() {

            if (this.activeCount === 0) {
                this.active = true;
            }

            this.activeCount++;

            return this;
        }

        /**
         * Activates all the connections associated with this endpoint
         *
         * @returns {Wirecloud.ui.WiringEditor.Endpoint}
         *      The instance on which the member is called.
         */
        activateAll() {
            return this.forEachConnection(function (connection) {
                connection.activate();
            });
        }

        /**
         * Appends a connection to this endpoint.
         *
         * @param {Connection} connection
         *      Connection to append
         * @param {Boolean} [updateEndpoint]
         *      `true` for calling `refreshEndpoint` on the connection
         * @returns {Wirecloud.ui.WiringEditor.Endpoint}
         *      The instance on which the member is called.
         */
        appendConnection(connection, updateEndpoint) {

            this.connections.push(connection);

            if (!!updateEndpoint) {
                connection.refreshEndpoint(this);
            }

            return this.dispatchEvent('connectionadded', connection);
        }

        /**
         * Decrements the activation count and, if the activation count is 1,
         * deactivates this endpoint.
         *
         * @returns {Wirecloud.ui.WiringEditor.Endpoint}
         *      The instance on which the member is called.
         */
        deactivate() {

            if (this.activeCount === 0) {
                return this;
            }

            this.activeCount--;

            if (this.activeCount === 0) {
                this.active = false;
            }

            return this;
        }

        /**
         * Deactivates all the connections associated with this endpoint
         *
         * @returns {Wirecloud.ui.WiringEditor.Endpoint}
         *      The instance on which the member is called.
         */
        deactivateAll() {
            return this.forEachConnection(function (connection) {
                connection.deactivate();
            });
        }

        /**
         * Equality comparison with other value.
         *
         * @param endpoint
         *      value to check if represents the same endpoint
         * @returns {Boolean}
         *      `true` if endpoint represents the same endpoint,
         *      `false` otherwise
         */
        equals(endpoint) {

            if (!(endpoint instanceof ns.Endpoint)) {
                return false;
            }

            return this.type === endpoint.type && this.id === endpoint.id;
        }

        /**
         * Loops over all the connections associated with this endpoint
         *
         * @param {Function} callback
         *      Callback to call for each connection
         * @returns {Wirecloud.ui.WiringEditor.Endpoint}
         *      The instance on which the member is called.
         */
        forEachConnection(callback) {

            for (var i = this.connections.length - 1; i >= 0; i--) {
                callback(this.connections[i], i);
            }

            return this;
        }

        /**
         * Gets the connection whose other endpoint is connected to the given
         * endpoint.
         *
         * @param {Wirecloud.ui.WiringEditor.Endpoint} endpoint
         *      Target endpoint of the connection to search
         * @returns {Wirecloud.ui.WiringEditor.Connection}
         *      Found connection
         */
        getConnectionTo(endpoint) {
            var connection = this.connections.find((connection) => {
                return connection.hasEndpoint(endpoint);
            });

            return connection || null;
        }

        /**
         * @param {Connection} connection
         * @returns {Boolean}
         */
        hasConnection(connection) {

            if (!(connection instanceof ns.Connection)) {
                return false;
            }

            return this.connections.some(function (connectionSaved) {
                return connectionSaved.equals(connection);
            });
        }

        /**
         * Checks if the enpdoint has associated connections
         *
         * @returns {Boolean}
         *      `true` if the endpoint has associated connections
         */
        hasConnections() {
            return this.connections.length > 0;
        }

        /**
         * Checks if the endpoint has an associated connection whose other
         * endpoint is the given one.
         *
         * @param {Wirecloud.ui.WiringEditor.Endpoint} endpoint
         *      Endpoint to use for searching the connection
         * @returns {Boolean}
         *      `true` if there is such connection
         */
        hasConnectionTo(endpoint) {
            return this.connections.some(function (connection) {
                return connection.hasEndpoint(endpoint);
            });
        }

        /**
         * Refreshes all the connections associated with this endpoint.
         *
         * @returns {Wirecloud.ui.WiringEditor.Endpoint}
         *      The instance on which the member is called.
         */
        refresh() {
            this.connections.forEach(function (connection) {
                connection.refresh();
            });

            return this;
        }

        /**
         * Removes the connection from the list of associated connections.
         *
         * @param {Connection} connection
         *      Connection to remove
         * @returns {Wirecloud.ui.WiringEditor.Endpoint}
         *      The instance on which the member is called.
         */
        removeConnection(connection) {
            var index = this.connections.indexOf(connection);

            if (index !== -1) {
                this.connections.splice(index, 1);
                this.dispatchEvent('connectionremoved', connection);
            }

            return this;
        }

        /**
         * TODO
         *
         * @param {Boolean} active
         *      `true` for activating the endpoint, `false` for deactivating it
         * @returns {Endpoint}
         *      The instance on which the member is called.
         */
        toggleActive(active) {
            return active ? this.activate() : this.deactivate();
        }

    }

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
            anchorPosition.x = Math.round(anchorPosition.x + anchorBCR.width);
        }

        return anchorPosition;
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
