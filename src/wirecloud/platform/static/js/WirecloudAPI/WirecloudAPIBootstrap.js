/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2023 Future Internet Consulting and Development Solutions S.L.
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

(function () {
    "use strict";

    window._privs = {};

    const _APIBootstrap = function (Wirecloud, utils, parent, id, viewid) {
        let tmp, i, current, connection;

        // Get id from the URL
        tmp = document.location.hash.substr(1);
        tmp = tmp.split("&");
        for (i = 0; i < tmp.length; i++) {
            current = tmp[i];
            current = current.split("=", 2);
            if (current[0] === "id" && id === undefined) {
                id = decodeURIComponent(current[1]);
            } else if (current[0] === "workspaceview" && viewid === undefined) {
                viewid = decodeURIComponent(current[1]);
            }
        }

        // API declaration
        Object.defineProperty(parent, 'MashupPlatform', {value: {}});

        const workspaceview = viewid ? Wirecloud.UserInterfaceManager.workspaceviews[viewid] : Wirecloud.activeWorkspace.view;

        // Temporal dict with private references. This private dict is removed in
        // WirecloudAPIClosure.js
        parent.MashupPlatform.priv = {
            id: id,
            workspaceview: workspaceview
        };


        // Endpoint facades
        const InputEndpoint = function InputEndpoint(real_endpoint, dynamic) {

            privates.set(this, {
                dynamic: dynamic,
                real_endpoint: real_endpoint
            });

            Object.defineProperty(this, "connected", {
                get: inputendpoint_get_connected
            });
        };

        const inputendpoint_get_connected = function inputendpoint_get_connected() {
            return privates.get(this).real_endpoint.inputs.length !== 0;
        };

        InputEndpoint.prototype.connect = function connect(outputendpoint) {
            if (outputendpoint == null || !(outputendpoint instanceof OutputEndpoint)) {
                throw new TypeError("outputendpoint must be an output endpoint instance");
            }

            const real_inputendpoint = privates.get(this).real_endpoint;
            const real_outputendpoint = privates.get(outputendpoint).real_endpoint;

            create_connection(real_outputendpoint, real_inputendpoint);
        };

        InputEndpoint.prototype.disconnect = function disconnect(outputendpoint) {
            let index;

            if (outputendpoint != null && !(outputendpoint instanceof OutputEndpoint)) {
                throw new TypeError("outputendpoint must be null or an output endpoint instance");
            }

            const real_inputendpoint = privates.get(this).real_endpoint;

            if (outputendpoint != null) {
                const real_outputendpoint = privates.get(outputendpoint).real_endpoint;
                index = real_outputendpoint.outputList.indexOf(real_inputendpoint);
                if (index !== -1) {
                    connection = real_outputendpoint.connections[index];
                    remove_connection(connection);
                }
            } else {
                // Currently, all the connections associated with volatile components
                // are the ones created by the widget/operator
                real_inputendpoint.connections.filter(function (connection) {
                    return connection.source.component.volatile || connection.target.component.volatile;
                }).forEach(remove_connection);
            }
        };
        parent.MashupPlatform.priv.InputEndpoint = InputEndpoint;

        const OutputEndpoint = function OutputEndpoint(real_endpoint, dynamic) {

            privates.set(this, {
                dynamic: dynamic,
                real_endpoint: real_endpoint
            });

            Object.defineProperty(this, "connected", {
                get: outputendpoint_get_connected
            });
        };

        const outputendpoint_get_connected = function get_connected() {
            return privates.get(this).real_endpoint.outputList.length !== 0;
        };

        OutputEndpoint.prototype.connect = function connect(inputendpoint) {
            if (inputendpoint == null || !(inputendpoint instanceof InputEndpoint)) {
                throw new TypeError("inputendpoint must be an input endpoint instance");
            }

            const real_inputendpoint = privates.get(inputendpoint).real_endpoint;
            const real_outputendpoint = privates.get(this).real_endpoint;

            create_connection(real_outputendpoint, real_inputendpoint);
        };

        OutputEndpoint.prototype.disconnect = function disconnect(inputendpoint) {
            let index;

            if (inputendpoint != null && !(inputendpoint instanceof InputEndpoint)) {
                throw new TypeError("inputendpoint must be null or an input endpoint instance");
            }

            const real_outputendpoint = privates.get(this).real_endpoint;

            if (inputendpoint != null) {
                const real_inputendpoint = privates.get(inputendpoint).real_endpoint;
                index = real_outputendpoint.outputList.indexOf(real_inputendpoint);
                if (index !== -1) {
                    connection = real_outputendpoint.connections[index];
                    remove_connection(connection);
                }
            } else {
                // Currently, all the connections associated with volatile components
                // are the ones created by the widget/operator
                real_outputendpoint.connections.filter(function (connection) {
                    return connection.source.component.volatile || connection.target.component.volatile;
                }).forEach(remove_connection);
            }
        };

        OutputEndpoint.prototype.pushEvent = function pushEvent(data) {
            privates.get(this).real_endpoint.propagate(data);
        };

        parent.MashupPlatform.priv.OutputEndpoint = OutputEndpoint;

        const create_connection = function create_connection(output, input) {
            if (output.component === input.component) {
                throw new TypeError("connections between endpoints of the same component are not allowed");
            }

            connection = workspaceview.model.wiring.createConnection(output, input, {
                commit: true
            });
        };

        const remove_connection = function remove_connection(connection) {
            connection.remove();
        };

        const privates = new WeakMap();

    };

    window._privs._APIBootstrap = _APIBootstrap;

    // Detects if this is inside an iframe (will use version v1, which defines the MashupPlatform in the window)
    if (window.parent !== window) {
        window._privs._APIBootstrap(window.parent.Wirecloud, window.parent.Wirecloud.Utils, window);
    }
})();
