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

/* globals MashupPlatform */

(function (Wirecloud, utils) {

    "use strict";

    var id, tmp, i, current;

    // Get id from the URL
    tmp = document.location.hash.substr(1);
    tmp = tmp.split("&");
    for (i = 0; i < tmp.length; i++) {
        current = tmp[i];
        current = current.split("=", 2);
        if (current[0] === "id") {
            id = current[1];
            break;
        }
    }

    // API declaration
    Object.defineProperty(window, 'MashupPlatform', {value: {}});

    // Temporal dict with private references. This private dict is removed in
    // WirecloudAPIClosure.js
    MashupPlatform.priv = {id: id};


    // Endpoint facades
    var InputEndpoint = function InputEndpoint(real_endpoint, dynamic) {

        Object.defineProperty(this, privateKeys.real_endpoint, {
            value: real_endpoint
        });

        Object.defineProperty(this, privateKeys.dynamic, {
            value: dynamic
        });

        Object.defineProperty(this, "connected", {
            get: inputendpoint_get_connected
        });
    };

    var inputendpoint_get_connected = function inputendpoint_get_connected() {
        return this[privateKeys.real_endpoint].inputs.length !== 0;
    };

    InputEndpoint.prototype.connect = function connect(outputendpoint) {
        if (outputendpoint == null || !(outputendpoint instanceof OutputEndpoint)) {
            throw new TypeError("outputendpoint must be an output endpoint instance");
        }
        if (this[privateKeys.real_endpoint].component === outputendpoint[privateKeys.real_endpoint].component) {
            throw new TypeError("connections between endpoints of the same component are not allowed");
        }

        var connection = Wirecloud.activeWorkspace.wiring.createConnection(false, outputendpoint[privateKeys.real_endpoint], this[privateKeys.real_endpoint]);
        Wirecloud.activeWorkspace.wiring.status.connections.push(connection);
        connection.establish();
    };

    InputEndpoint.prototype.disconnect = function disconnect(outputendpoint) {
        var connection, index, wiring;

        if (outputendpoint != null && !(outputendpoint instanceof OutputEndpoint)) {
            throw new TypeError("outputendpoint must be null or an output endpoint instance");
        }
        if (outputendpoint != null) {
            index = outputendpoint[privateKeys.real_endpoint].outputList.indexOf(this[privateKeys.real_endpoint]);
            if (index !== -1) {
                connection = outputendpoint[privateKeys.real_endpoint].connections[index];
                remove_connection(connection);
            }
        } else {
            // Currently, all the connections associated with volatile components
            // are the ones created by the widget/operator
            this[privateKeys.real_endpoint].connections.filter(function (connection) {
                return connection.source.component.volatile || connection.target.component.volatile;
            }).forEach(remove_connection);
        }
    };
    MashupPlatform.priv.InputEndpoint = InputEndpoint;

    var OutputEndpoint = function OutputEndpoint(real_endpoint, dynamic) {

        Object.defineProperty(this, privateKeys.real_endpoint, {
            value: real_endpoint
        });

        Object.defineProperty(this, privateKeys.dynamic, {
            value: dynamic
        });

        Object.defineProperty(this, "connected", {
            get: outputendpoint_get_connected
        });
    };

    var outputendpoint_get_connected = function get_connected() {
        return this[privateKeys.real_endpoint].outputList.length !== 0;
    };

    OutputEndpoint.prototype.connect = function connect(inputendpoint) {
        if (inputendpoint == null || !(inputendpoint instanceof InputEndpoint)) {
            throw new TypeError("inputendpoint must be an input endpoint instance");
        }
        if (this[privateKeys.real_endpoint].component === inputendpoint[privateKeys.real_endpoint].component) {
            throw new TypeError("connections between endpoints of the same component are not allowed");
        }

        var connection = Wirecloud.activeWorkspace.wiring.createConnection(false, this[privateKeys.real_endpoint], inputendpoint[privateKeys.real_endpoint]);
        Wirecloud.activeWorkspace.wiring.status.connections.push(connection);
        connection.establish();
    };

    OutputEndpoint.prototype.disconnect = function disconnect(inputendpoint) {
        var connection, index;

        if (inputendpoint != null && !(inputendpoint instanceof InputEndpoint)) {
            throw new TypeError("inputendpoint must be null or an input endpoint instance");
        }
        if (inputendpoint != null) {
            index = this[privateKeys.real_endpoint].outputList.indexOf(inputendpoint[privateKeys.real_endpoint]);
            if (index !== -1) {
                connection = this[privateKeys.real_endpoint].connections[index];
                remove_connection(connection);
            }
        } else {
            // Currently, all the connections associated with volatile components
            // are the ones created by the widget/operator
            this[privateKeys.real_endpoint].connections.filter(function (connection) {
                return connection.source.component.volatile || connection.target.component.volatile;
            }).forEach(remove_connection);
        }
    };

    OutputEndpoint.prototype.pushEvent = function pushEvent(data) {
        this[privateKeys.real_endpoint].propagate(data);
    };

    MashupPlatform.priv.OutputEndpoint = OutputEndpoint;

    var remove_connection = function remove_connection(connection) {
        var index, wiring;

        wiring = Wirecloud.activeWorkspace.wiring;
        connection.detach();
        index = wiring.connections.indexOf(connection);
        wiring.connections.splice(connection, 1);
    };

    var privateKeys = utils.privateKeys("dynamic", "real_endpoint");

})(window.parent.Wirecloud, window.parent.Wirecloud.Utils);
