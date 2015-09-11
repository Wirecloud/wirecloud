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

/* global StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class Endpoint.
     * @extends {StyledElement}
     *
     * @constructor
     * @param {String} type
     *      [TODO: description]
     * @param {Wiring.Endpoint} wiringEndpoint
     *      [TODO: description]
     * @param {ComponentDraggable} component
     *      [TODO: description]
     */
    ns.Endpoint = utils.defineClass({

        constructor: function Endpoint(type, wiringEndpoint, component) {

            this.superClass(events);

            this.wrapperElement = document.createElement('div');
            this.wrapperElement.className = "endpoint";

            this.titleElement = document.createElement('span');
            this.titleElement.className = "endpoint-title";
            this.append(this.titleElement);

            this.anchorElement = document.createElement('span');
            this.anchorElement.className = "endpoint-anchor";
            this.append(this.anchorElement);

            this._endpoint = wiringEndpoint;
            this.component = component;

            this.activeCount = 0;
            this.connections = [];

            Object.defineProperties(this, {

                active: {
                    get: function get() {return this.hasClass('active');},
                    set: function set(value) {this.toggleClass('active', value);}
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

                keywords: {value: wiringEndpoint.friendcode.trim().split(/\s+/)},

                missing: {
                    get: function get() {return this.hasClass('missing');},
                    set: function set(value) {this.toggleClass('missing', value);}
                },

                name: {value: wiringEndpoint.name},

                title: {
                    get: function get() {return this.titleElement.textContent;},
                    set: function set(value) {this.titleElement.textContent = value;}
                },

                type: {value: type}

            });

            this.title = wiringEndpoint.label;
            if (wiringEndpoint.missing) {
                this.missing = true;
            }

            this.rightAnchorPoint = false;

            this.tooltip = new se.Tooltip({content: wiringEndpoint.description, placement: ['top']});
            this.tooltip.bind(this.get());

            this.get().addEventListener('mousedown', endpoint_onmousedown.bind(this));
            this.get().addEventListener('mouseenter', endpoint_onmouseenter.bind(this));
            this.get().addEventListener('mouseleave', endpoint_onmouseleave.bind(this));
            this.get().addEventListener('mouseup', endpoint_onmouseup.bind(this));
        },

        inherit: se.StyledElement,

        members: {

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
            appendConnection: function appendConnection(connection) {

                this.connections.push(connection);

                return this.trigger('connectionadded', connection);
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

                this.connections.forEach(function (connection, index) {
                    callback(connection, index);
                });

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
             * [TODO: hasEditableConnection description]
             *
             * @returns {Boolean}
             *      [TODO: description]
             */
            hasEditableConnection: function hasEditableConnection() {
                return this.connections.some(function (connection) {
                    return connection.editable;
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

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var events = ['click', 'connectionadded', 'dragenter', 'dragleave', 'mousedown', 'mouseenter', 'mouseleave', 'mouseup'];

    function endpoint_onmousedown(event) {

        if (this.enabled && event.which === 1) {
            event.stopPropagation();
            this.trigger('mousedown', event);
        }
    }

    function endpoint_onmouseenter(event) {

        if (this.enabled) {
            event.stopPropagation();

            switch (event.which) {
            case 0: // No button pressed.
                this.trigger('mouseenter', event);
                break;
            case 1: // Left mouse button pressed.
                this.trigger('dragenter', event);
                break;
            default:
                // Otherwise, do nothing.
                break;
            }
        }
    }

    function endpoint_onmouseleave(event) {

        if (this.enabled) {
            event.stopPropagation();

            switch (event.which) {
            case 0: // No button pressed.
                this.trigger('mouseleave', event);
                break;
            case 1: // Left mouse button pressed.
                this.trigger('dragleave', event);
                break;
            default:
                // Otherwise, do nothing.
                break;
            }
        }
    }

    function endpoint_onmouseup(event) {

        if (this.enabled && event.which === 1) {
            event.stopPropagation();
            this.trigger('mouseup', event);
        }
    }

    function getAnchorPosition() {
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
    }

    function getEditableConnection() {
        var connection, i;

        for (i = 0; connection == null && i < this.connections.length; i++) {
            if (this.connections[i].editable) {
                connection = this.connections[i];
            }
        }

        return connection;
    }

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
