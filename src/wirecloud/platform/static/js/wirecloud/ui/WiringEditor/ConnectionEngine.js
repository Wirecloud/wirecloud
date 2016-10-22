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
     * Create a new instance of class ConnectionEngine.
     * @extends {StyledElement}
     *
     * @constructor
     * @param {Container} container
     *      [TODO: description]
     * @param {Function} findWiringEngine
     *      [TODO: description]
     */
    ns.ConnectionEngine = function ConnectionEngine(container, findWiringEngine) {
        se.StyledElement.call(this, events);

        this.wrapperElement = document.createElementNS(ns.ConnectionEngine.SVG_NS, 'svg');
        this.wrapperElement.setAttribute('class', "we-connections-layer");

        this.connections = [];
        this.connectionsElement = document.createElementNS(ns.ConnectionEngine.SVG_NS, 'g');
        this.wrapperElement.appendChild(this.connectionsElement);

        this.optionsElement = document.createElement('div');

        this.endpoints = {source: [], target: []};

        this.container = container;
        this.container.appendChild(this.wrapperElement);
        this.container.appendChild(this.optionsElement);
        this.container.get().addEventListener('scroll', container_onscroll.bind(this));

        this._ondrag = connection_ondrag.bind(this);
        this._ondragend = connection_ondragend.bind(this);

        Object.defineProperties(this, {

            wiringEngine: {
                get: function get() {return findWiringEngine();}
            }

        });

        this.endpoint_ondragstart = endpoint_ondragstart.bind(this);
        this.endpoint_onmouseenter = endpoint_onmouseenter.bind(this);
        this.endpoint_onmouseleave = endpoint_onmouseleave.bind(this);
        this.endpoint_ondragend = endpoint_ondragend.bind(this);
    };

    ns.ConnectionEngine.CONNECTION_INVALID = -1;
    ns.ConnectionEngine.CONNECTION_ESTABLISHED =  0;
    ns.ConnectionEngine.CONNECTION_DUPLICATE = 1,
    ns.ConnectionEngine.SVG_NS = "http://www.w3.org/2000/svg";

    utils.inherit(ns.ConnectionEngine, se.StyledElement, {

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
                .addEventListener('mousedown', this.endpoint_ondragstart)
                .addEventListener('mouseenter', this.endpoint_onmouseenter)
                .addEventListener('mouseleave', this.endpoint_onmouseleave)
                .addEventListener('mouseup', this.endpoint_ondragend);

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
                this.activeConnection.click();
            }

            return this;
        },

        /**
         * @override
         */
        clear: function clear() {
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

        getConnection: function getConnection(sourceId, targetId) {
            var i, connection;

            for (i = 0; i < this.connections.length && !connection; i++) {
                if (this.connections[i].sourceId == sourceId && this.connections[i].targetId == targetId) {
                    connection = this.connections[i];
                }
            }

            return connection;
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
                    .removeEventListener('mousedown', this.endpoint_ondragstart)
                    .removeEventListener('mouseenter', this.endpoint_onmouseenter)
                    .removeEventListener('mouseleave', this.endpoint_onmouseleave)
                    .removeEventListener('mouseup', this.endpoint_ondragend);

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

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var events = ['click', 'cancel', 'dragstart', 'dragend', 'duplicate', 'establish'];

    var opposites = {
        source: 'target',
        target: 'source'
    };

    var appendConnection = function appendConnection(connection, backupConnection) {

        this.connections.push(connection);
        connection.options.appendTo(this.optionsElement);

        connection
            .addEventListener('click', connection_onclick.bind(this))
            .addEventListener('customizestart', connection_oncustomizestart.bind(this))
            .addEventListener('remove', connection_onremove.bind(this));

        return this.dispatchEvent('establish', connection, backupConnection);
    };

    var connection_onclick = function connection_onclick(connection) {

        if (!connection.editable) {

            if (!connection.equals(this.editableConnection)) {
                stopCustomizing.call(this);
            }

            if (connection.active) {
                if (this.hasActiveConnection() && !connection.equals(this.activeConnection)) {
                    this.activeConnection.click();
                }
                this.activeConnection = connection;
                this.dispatchEvent('click', connection);
            } else {
                delete this.activeConnection;
            }
        }
    };

    var connection_onremove = function connection_onremove(connection) {
        var index = this.connections.indexOf(connection);

        if (index != -1) {
            if (connection.equals(this.activeConnection)) {
                this.deactivateAll();
            }
            this.optionsElement.removeChild(connection.options.get());
            this.connections.splice(index, 1);
        }
    };

    var stopCustomizing = function stopCustomizing() {

        if (this.editableConnection != null) {
            this.editableConnection.editable = false;
            delete this.editableConnection;
        }
    };

    var connection_oncustomizestart = function connection_oncustomizestart(connection) {

        this.setUp();
        this.editableConnection = connection;
    };

    var endpoint_ondragstart = function endpoint_ondragstart(endpoint) {
        var connection = new ns.Connection();
        var initialEndpoint;

        if (!this.enabled) {
            return;
        }

        if (endpoint.hasConnection(this.activeConnection)) {
            if (this.activeConnection.background) {
                this.activeConnection.click();
                initialEndpoint = endpoint;
            } else {
                this.activeConnection.addClassName('temporal');
                initialEndpoint = this.activeConnection[opposites[endpoint.type]].endpoint;
                this._connectionBackup = this.activeConnection;
            }
        } else {
            initialEndpoint = endpoint;
        }

        this.setUp();
        disableEndpoints.call(this, initialEndpoint.type);

        this.wrapperElement.classList.add('dragging');

        connection
            .stickEndpoint(initialEndpoint)
            .appendTo(this.connectionsElement);

        document.addEventListener('mousemove', this._ondrag);
        document.addEventListener('mouseup', this._ondragend);

        this.dispatchEvent('dragstart', connection, initialEndpoint, endpoint);

        this.temporalInitialEndpoint = initialEndpoint;
        this.temporalConnection = connection;
    };

    var connection_ondrag = function connection_ondrag(event) {
        var parent    = this.container.get(),
            parentBCR = parent.getBoundingClientRect();

        this.temporalConnection.updateCursorPosition({
            x: event.clientX + parent.scrollLeft - parentBCR.left,
            y: event.clientY + parent.scrollTop - parentBCR.top
        });
    };

    var connection_ondragend = function connection_ondragend(event) {
        event.preventDefault();
        event.stopPropagation();
        endpoint_ondragend.call(this);
    };

    var endpoint_ondragend = function endpoint_ondragend(finalEndpoint) {

        if (!this.enabled || !this.temporalConnection) {
            return;
        }

        this.wrapperElement.classList.remove('dragging');
        enableEndpoints.call(this, this.temporalInitialEndpoint.type);

        if (this._connectionBackup != null) {
            this._connectionBackup.removeClassName('temporal');
        }

        switch (validateConnection(this.temporalInitialEndpoint, finalEndpoint)) {
        case ns.ConnectionEngine.CONNECTION_ESTABLISHED:
            this.temporalConnection
                .stickEndpoint(finalEndpoint)
                .createAndBind(false, this.wiringEngine);
            appendConnection.call(this, this.temporalConnection, this._connectionBackup);

            if (this._connectionBackup != null) {
                this.temporalConnection.click();
            }

            break;
        case ns.ConnectionEngine.CONNECTION_DUPLICATE:
            this.temporalConnection.remove();
            this.dispatchEvent('duplicate', this.temporalInitialEndpoint.getConnectionTo(finalEndpoint).click(), this._connectionBackup);
            break;
        default:

            if (this._connectionBackup != null) {
                this._connectionBackup.click();
            }

            this.temporalConnection.remove();
            this.dispatchEvent('cancel');
        }

        document.removeEventListener('mousemove', this._ondrag);
        document.removeEventListener('mouseup', this._ondragend);

        this.dispatchEvent('dragend', this.temporalConnection, this.temporalInitialEndpoint);

        delete this.temporalInitialEndpoint;
        delete this._connectionBackup;
        delete this.temporalConnection;
    };

    var container_onscroll = function container_onscroll(event) {
        var parent  = this.container.get(),
            scrollX = parent.scrollLeft,
            scrollY = parent.scrollTop;

        this.connectionsElement.setAttribute('transform', "translate(" + (-scrollX) + " " + (-scrollY) + ")");

        this.wrapperElement.style.top = scrollY + 'px';
        this.wrapperElement.style.left = scrollX + 'px';
    };

    var disableEndpoints = function disableEndpoints(type) {

        this.endpoints[type].forEach(function (endpoint) {
            endpoint.disable();
        });

        return this;
    };

    var enableEndpoints = function enableEndpoints(type) {

        this.endpoints[type].forEach(function (endpoint) {
            endpoint.enable();
        });

        return this;
    };

    var endpoint_onmouseenter = function endpoint_onmouseenter(endpoint) {

        if (this.temporalConnection != null) {
            endpoint.activate();
            this.temporalConnection.stickEndpoint(endpoint, {establish: false});
            document.removeEventListener('mousemove', this._ondrag);
        }
    };

    var endpoint_onmouseleave = function endpoint_onmouseleave(endpoint) {

        if (this.temporalConnection != null) {
            endpoint.deactivate();
            this.temporalConnection.unstickEndpoint(endpoint);
            document.addEventListener('mousemove', this._ondrag);
            document.addEventListener('touchmove', this._ondrag);
        }
    };

    var validateConnection = function validateConnection(initialEndpoint, finalEndpoint) {
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
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
