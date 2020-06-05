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

    var TargetEndpoint = function TargetEndpoint() {
        Wirecloud.wiring.Endpoint.call(this);
        this.inputs = [];
        this.connections = [];
    };
    utils.inherit(TargetEndpoint, Wirecloud.wiring.Endpoint);

    TargetEndpoint.prototype.connect = function connect(input, connection) {
        if (!(input instanceof Wirecloud.wiring.SourceEndpoint)) {
            throw new TypeError('Invalid source endpoint');
        }

        input.connect(this, connection);
    };

    TargetEndpoint.prototype.disconnect = function disconnect(input) {
        if (!(input instanceof Wirecloud.wiring.SourceEndpoint)) {
            throw new TypeError('Invalid source endpoint');
        }

        input.disconnect(this);
    };

    TargetEndpoint.prototype.propagate = function propagate(data, options) {
        // Do nothing by default
    };

    /**
     * @private
     */
    TargetEndpoint.prototype._addInput = function _addInput(input, connection) {
        this.inputs.push(input);
        this.connections.push(connection);
    };

    /**
     * @private
     */
    TargetEndpoint.prototype._removeInput = function _removeInput(input, connection) {
        var index = this.inputs.indexOf(input);

        this.inputs.splice(index, 1);
        this.connections.splice(index, 1);
    };

    TargetEndpoint.prototype.fullDisconnect = function fullDisconnect() {
        // Disconnecting inputs
        var inputs = this.inputs.slice(0);
        for (var i = 0; i < inputs.length; ++i) {
            inputs[i].disconnect(this);
        }
    };

    Wirecloud.wiring.TargetEndpoint = TargetEndpoint;

})(Wirecloud.Utils);
