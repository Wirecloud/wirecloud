/*
 *     Copyright 2008-2016 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


(function (utils) {

    "use strict";

    var SourceEndpoint = function SourceEndpoint() {
        Wirecloud.wiring.Endpoint.call(this);
        this.outputList = [];
        this.connections = [];
    };
    utils.inherit(SourceEndpoint, Wirecloud.wiring.Endpoint);

    SourceEndpoint.prototype.connect = function connect(out, connection) {
        if (!(out instanceof Wirecloud.wiring.TargetEndpoint)) {
            throw new TypeError('Invalid target endpoint');
        }

        if (this.outputList.indexOf(out) === -1) {
            this.outputList.push(out);
            this.connections.push(connection);
            out._addInput(this, connection);
            connection._connect();
        }
    };

    SourceEndpoint.prototype.disconnect = function disconnect(out) {
        var connection, index;

        if (!(out instanceof Wirecloud.wiring.TargetEndpoint)) {
            throw new TypeError('Invalid target endpoint');
        }

        index = this.outputList.indexOf(out);

        if (index !== -1) {
            this.outputList.splice(index, 1);
            connection = this.connections[index];
            this.connections.splice(index, 1);
            out._removeInput(this, connection);
            connection._disconnect();
        }
    };

    SourceEndpoint.prototype.fullDisconnect = function fullDisconnect() {
        // Outputs
        var outputs = utils.clone(this.outputList);
        for (var i = 0; i < outputs.length; ++i) {
            this.disconnect(outputs[i]);
        }
    };

    SourceEndpoint.prototype.formatException = function formatException(exception) {
        return exception.toString();
    };

    /**
     * Propagates the event to all the TargetEndpoints connected to this
     * SourceEndpoint.
     */
    SourceEndpoint.prototype.propagate = function propagate(value, options) {
        var i, errorDetails, targetEndpoint, connection;

        var outputs = utils.clone(this.outputList);

        for (i = 0; i < outputs.length; ++i) {
            targetEndpoint = outputs[i];
            connection = this.connections[i];
            try {
                targetEndpoint.propagate(value, options);
            } catch (error) {
                errorDetails = this.formatException(error);
                connection.logManager.log(errorDetails);
            }
        }
    };

    SourceEndpoint.prototype.getReachableEndpoints = function getReachableEndpoints() {
        var endpoints = [];

        for (var i = 0; i < this.outputList.length; ++i) {
            var currentEndpoints = this.outputList[i].getReachableEndpoints();
            if (currentEndpoints.length > 0) {
                endpoints = endpoints.concat(currentEndpoints);
            }
        }

        return endpoints;
    };

    Wirecloud.wiring.SourceEndpoint = SourceEndpoint;

})(Wirecloud.Utils);
