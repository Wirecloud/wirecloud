/*
 *     (C) Copyright 2008-2013 Universidad Politécnica de Madrid
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

/*global Wirecloud*/

(function () {

    "use strict";

    var TargetEndpoint = function TargetEndpoint(name, type, friendCode, id) {
        Wirecloud.wiring.Endpoint.call(this, name, type, friendCode, id);
        this.inputs = [];
    };

    TargetEndpoint.prototype = new Wirecloud.wiring.Endpoint();

    /**
     * @private
     */
    TargetEndpoint.prototype._addInput = function _addInput(input) {
        this.inputs.push(input);
    };

    /**
     * @private
     */
    TargetEndpoint.prototype._removeInput = function _removeInput(input) {
        var index = this.inputs.indexOf(input);

        if (index != -1) {
            this.inputs.splice(index, input);
        }
    };

    TargetEndpoint.prototype.fullDisconnect = function fullDisconnect() {
        // Disconnecting inputs
        var inputs = this.inputs.slice(0);
        for (var i = 0; i < inputs.length; ++i) {
            inputs[i].disconnect(this);
        }
    };

    Wirecloud.wiring.TargetEndpoint = TargetEndpoint;

})();
