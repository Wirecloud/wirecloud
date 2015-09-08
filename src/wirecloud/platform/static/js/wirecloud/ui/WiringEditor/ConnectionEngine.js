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
     * Create a new instance of class ConnectionEngine.
     * @extends {StyledElement}
     *
     * @constructor
     * @param {Container} container
     *      [TODO: description]
     * @param {Function} findWiringEngine
     *      [TODO: description]
     */
    ns.ConnectionEngine = utils.defineClass({

        constructor: function ConnectionEngine(container, findWiringEngine) {
            this.superClass(events);

            this.wrapperElement = document.createElementNS(ns.ConnectionEngine.SVG_NS, 'svg');
            this.wrapperElement.setAttribute('class', "wiring-connections");

            this.connections = [];
            this.connectionsElement = document.createElementNS(ns.ConnectionEngine.SVG_NS, 'g');
            this.wrapperElement.appendChild(this.connectionsElement);

            this.endpoints = {source: [], target: []};

            this.container = container;
            this.container.append(this.wrapperElement);
            this.container.get().addEventListener('scroll', container_onscroll.bind(this));

            this._ondrag = connection_ondrag.bind(this);
            this._ondragend = connection_ondragend.bind(this);

            Object.defineProperties(this, {

                wiringEngine: {
                    get: function get() {return findWiringEngine();}
                }

            });

            this.endpoint_ondragstart = endpoint_ondragstart.bind(this);
            this.endpoint_ondragenter = endpoint_ondragenter.bind(this);
            this.endpoint_ondragleave = endpoint_ondragleave.bind(this);
            this.endpoint_ondragend = endpoint_ondragend.bind(this);
        },

        inherit: se.StyledElement,

        statics: {

            CONNECTION_INVALID: -1,

            CONNECTION_ESTABLISHED: 0,

            CONNECTION_DUPLICATE: 1,

            SVG_NS: "http://www.w3.org/2000/svg"

        },

        members: {

            /**
             * [TODO: activate description]
             *
             * @param {Connection} connection
             *      [TODO: description]
             * @returns {ConnectionEngine}
             *      The instance on which the member is called.
             */
            activate: function activate(connection) {

                this.deactivateAll();
                this.activeConnection = connection.activate();

                return this;
            },

            /**
             * [TODO: appendEndpoint description]
             *
             * @param {Endpoint} endpoint
             *      [TODO: description]
             * @returns {ConnectionEngine}
             *      The instance on which the member is called.
             */
            appendEndpoint: function appendEndpoint(endpoint) {

                this.endpoints[endpoint.type].push(endpoint);

                endpoint
                    .on('mousedown', this.endpoint_ondragstart)
                    .on('dragenter', this.endpoint_ondragenter)
                    .on('dragleave', this.endpoint_ondragleave)
                    .on('mouseup', this.endpoint_ondragend);

                return this;
            },

            /**
             * [TODO: connect description]
             *
             * @param  {Wiring.Connection} wiringConnection
             *      [TODO: description]
             * @param  {SourceEndpoint} source
             *      [TODO: description]
             * @param  {TargetEndpoint} target
             *      [TODO: description]
             * @param  {PlainObject} [options]
             *      [TODO: description]
             * @returns {Connection}
             *      [TODO: description]
             */
            connect: function connect(wiringConnection, source, target, options) {
                var connection;

                options = options || {};

                connection = new ns.Connection();
                connection
                    .stickEndpoint(source, {position: options.sourceHandle})
                    .stickEndpoint(target, {position: options.targetHandle, wiringConnection: wiringConnection})
                    .appendTo(this.connectionsElement);

                appendConnection.call(this, connection);
                connection.logManager.log(gettext("The connection was loaded successfully."), Wirecloud.constants.LOGGING.INFO_MSG);

                return this;
            },

            /**
             * [deactivateAll description]
             *
             * @returns {ConnectionEngine}
             *      The instance on which the member is called.
             */
            deactivateAll: function deactivateAll() {

                if (this.hasActiveConnection()) {
                    this.activeConnection.deactivate();
                    delete this.activeConnection;
                }

                return this;
            },

            /**
             * @override
             */
            empty: function empty() {
                var i;

                this.setUp();

                for (i = this.connections.length - 1; i >= 0; i--) {
                    this.connections[i].remove();
                }

                this.connections.length = 0;

                return this;
            },

            /**
             * [TODO: forEachConnection description]
             *
             * @param  {Function} callback
             *      [TODO: description]
             * @returns {ConnectionEngine}
             *      The instance on which the member is called.
             */
            forEachConnection: function forEachConnection(callback) {

                this.connections.forEach(function (connection, index) {
                    callback(connection, index);
                });

                return this;
            },

            /**
             * [TODO: hasActiveConnection description]
             *
             * @returns {Boolean}
             *      [TODO: description]
             */
            hasActiveConnection: function hasActiveConnection() {
                return this.activeConnection != null;
            },

            /**
             * [TODO: removeEndpoint description]
             *
             * @param {Endpoint} endpoint
             *      [TODO: description]
             * @returns {ConnectionEngine}
             *      The instance on which the member is called.
             */
            removeEndpoint: function removeEndpoint(endpoint) {
                var index = this.endpoints[endpoint.type].indexOf(endpoint);

                if (index != -1) {
                    endpoint
                        .off('mousedown', this.endpoint_ondragstart)
                        .off('dragenter', this.endpoint_ondragenter)
                        .off('dragleave', this.endpoint_ondragleave)
                        .off('mouseup', this.endpoint_ondragend);

                    this.endpoints[endpoint.type].splice(index, 1);
                }

                return this;
            },

            /**
             * [TODO: setUp description]
             *
             * @returns {ConnectionEngine}
             *      The instance on which the member is called.
             */
            setUp: function setUp() {

                stopCustomizing.call(this);
                this.deactivateAll();

                return this;
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var events = ['detach', 'dragstart', 'dragend', 'duplicate', 'establish'];

    function appendConnection(connection) {

        this.connections.push(connection);

        connection
            .on('click', connection_onclick.bind(this))
            .on('customizestart', connection_oncustomizestart.bind(this))
            .on('remove', connection_onremove.bind(this));

        return this.trigger('establish', connection);
    }

    function connection_onclick(connection) {

        if (!connection.editable) {

            if (!connection.equals(this.editableConnection)) {
                stopCustomizing.call(this);
            }

            if (connection.active) {
                this.deactivateAll();
            } else {
                this.activate(connection);
            }
        }
    }

    function connection_onremove(connection) {
        var index = this.connections.indexOf(connection);

        if (index != -1) {
            if (connection.equals(this.activeConnection)) {
                this.deactivateAll();
            }

            this.connections.splice(index, 1);
        }
    }

    function stopCustomizing() {

        if (this.editableConnection != null) {
            this.editableConnection.editable = false;
            delete this.editableConnection;
        }
    }

    function connection_oncustomizestart(connection) {

        this.setUp();
        this.editableConnection = connection;
    }

    function endpoint_ondragstart(initialEndpoint) {
        var connection = new ns.Connection();

        if (!this.enabled) {
            return;
        }

        this.setUp();
        disableEndpoints.call(this, initialEndpoint.type);

        connection
            .stickEndpoint(initialEndpoint)
            .appendTo(this.connectionsElement)
            .activate();

        document.addEventListener('mousemove', this._ondrag);
        document.addEventListener('mouseup', this._ondragend);

        this.trigger('dragstart', connection, initialEndpoint);

        this.temporalInitialEndpoint = initialEndpoint;
        this.temporalConnection = connection;
    }

    function connection_ondrag(event) {
        var parent    = this.container.get(),
            parentBCR = parent.getBoundingClientRect();

        this.temporalConnection.updateCursorPosition({
            x: event.clientX + parent.scrollLeft - parentBCR.left,
            y: event.clientY + parent.scrollTop - parentBCR.top
        });
    }

    function connection_ondragend(event) {
        endpoint_ondragend.call(this, null);
    }

    function endpoint_ondragend(finalEndpoint) {

        if (!this.enabled || !this.temporalConnection) {
            return;
        }

        enableEndpoints.call(this, this.temporalInitialEndpoint.type);

        this.temporalConnection.deactivate();

        switch (validateConnection(this.temporalInitialEndpoint, finalEndpoint)) {
        case ns.ConnectionEngine.CONNECTION_ESTABLISHED:
            this.temporalConnection
                .stickEndpoint(finalEndpoint)
                .createAndBind(false, this.wiringEngine);
            appendConnection.call(this, this.temporalConnection);
            this.temporalConnection.logManager.log(gettext("The connection was established successfully."), Wirecloud.constants.LOGGING.INFO_MSG);
            break;
        case ns.ConnectionEngine.CONNECTION_DUPLICATE:
            this.trigger('duplicate', this.temporalInitialEndpoint.getConnectionTo(finalEndpoint));
        default:
            this.temporalConnection.remove();
        }

        document.removeEventListener('mousemove', this._ondrag);
        document.removeEventListener('mouseup', this._ondragend);

        this.trigger('dragend', this.temporalConnection, this.temporalInitialEndpoint);

        delete this.temporalInitialEndpoint;
        delete this.temporalConnection;
    }

    function container_onscroll(event) {
        var parent  = this.container.get(),
            scrollX = parent.scrollLeft
            scrollY = parent.scrollTop;

        this.connectionsElement.setAttribute('transform', "translate(" + (-scrollX) + " " + (-scrollY) + ")");

        this.wrapperElement.style.top = scrollY + 'px';
        this.wrapperElement.style.left = scrollX + 'px';
    }

    function disableEndpoints(type) {

        this.endpoints[type].forEach(function (endpoint) {
            endpoint.disable();
        });

        return this;
    }

    function enableEndpoints(type) {

        this.endpoints[type].forEach(function (endpoint) {
            endpoint.enable();
        });

        return this;
    }

    function endpoint_ondragenter(endpoint) {

        if (this.temporalConnection != null) {
            endpoint.activate();
            this.temporalConnection.stickEndpoint(endpoint, {establish: false});
            document.removeEventListener('mousemove', this._ondrag);
        }
    }

    function endpoint_ondragleave(endpoint) {

        if (this.temporalConnection != null) {
            endpoint.deactivate();
            this.temporalConnection.unstickEndpoint(endpoint);
            document.addEventListener('mousemove', this._ondrag);
        }
    }

    function validateConnection(initialEndpoint, finalEndpoint) {
        var i;

        if (initialEndpoint == null || finalEndpoint == null) {
            return ns.ConnectionEngine.CONNECTION_INVALID;
        }

        if (initialEndpoint.type === finalEndpoint.type) {
            return ns.ConnectionEngine.CONNECTION_INVALID;
        }

        if (initialEndpoint.component.equals(finalEndpoint.component)) {
            return ns.ConnectionEngine.CONNECTION_INVALID;
        }

        if (initialEndpoint.hasConnectionTo(finalEndpoint)) {
            return ns.ConnectionEngine.CONNECTION_DUPLICATE;
        }

        return ns.ConnectionEngine.CONNECTION_ESTABLISHED;
    }

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
