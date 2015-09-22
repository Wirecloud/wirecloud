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

/*global MashupPlatform*/

(function () {

    "use strict";

    var Wirecloud, id, idx, tmp, i, current;

    Wirecloud = window.parent.Wirecloud;

    // Get id from the URL
    idx = document.URL.lastIndexOf('#');
    tmp = document.URL.substr(idx + 1);
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
    var InputEndpoint = function InputEndpoint(real_endpoint, internal) {

        Object.defineProperties(this, {
            internal: {value: internal},
            connected: {
                get: function () {
                    return real_endpoint.inputs.length !== 0;
                }
            },
            connect: {
                value: function connect(outputendpoint) {
                    if (!(outputendpoint instanceof OutputEndpoint) && !(outputendpoint instanceof Wirecloud.wiring.SourceEndpoint)) {
                        throw new TypeError();
                    }
                    if (outputendpoint instanceof OutputEndpoint && (this.internal && outputendpoint.internal)) {
                        throw new TypeError();
                    }

                    if (outputendpoint instanceof Wirecloud.wiring.SourceEndpoint) {
                        var connection = Wirecloud.activeWorkspace.wiring.createConnection(false, outputendpoint, real_endpoint);
                        Wirecloud.activeWorkspace.wiring.status.connections.push(connection);
                        connection.establish();
                    } else {
                        outputendpoint.connect(real_endpoint);
                    }
                }
            }
        });

        Object.freeze(this);
    };
    MashupPlatform.priv.InputEndpoint = InputEndpoint;

    var OutputEndpoint = function OutputEndpoint(real_endpoint, internal) {

        Object.defineProperties(this, {
            internal: {value: internal},
            connected: {
                get: function () {
                    return real_endpoint.outputList.length !== 0;
                }
            },
            connect: {
                value: function connect(inputendpoint) {
                    if (!(inputendpoint instanceof InputEndpoint) && !(inputendpoint instanceof Wirecloud.wiring.TargetEndpoint)) {
                        throw new TypeError();
                    }
                    if (inputendpoint instanceof InputEndpoint && (this.internal && inputendpoint.internal)) {
                        throw new TypeError();
                    }

                    if (inputendpoint instanceof Wirecloud.wiring.TargetEndpoint) {
                        var connection = Wirecloud.activeWorkspace.wiring.createConnection(false, real_endpoint, inputendpoint);
                        Wirecloud.activeWorkspace.wiring.status.connections.push(connection);
                        connection.establish();
                    } else {
                        inputendpoint.connect(real_endpoint);
                    }
                }
            }
        });

        if (internal) {
            Object.defineProperties(this, {
                pushEvent: {
                    value: function pushEvent(data) {
                        real_endpoint.propagate(data);
                    }
                }
            });
        }

        Object.freeze(this);
    };
    MashupPlatform.priv.OutputEndpoint = OutputEndpoint;

})();
