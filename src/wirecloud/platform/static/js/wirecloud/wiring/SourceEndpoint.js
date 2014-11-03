/*
 *     Copyright 2008-2014 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

    var SourceEndpoint = function SourceEndpoint(name, type, friendCode, id) {
        Wirecloud.wiring.Endpoint.call(this, name, type, friendCode, id);
        this.outputs = [];
    };
    SourceEndpoint.prototype = new Wirecloud.wiring.Endpoint();

    SourceEndpoint.prototype.connect = function connect(out) {
        if (!(out instanceof Wirecloud.wiring.TargetEndpoint)) {
            throw new TypeError('Invalid target endpoint');
        }

        this.outputs.push(out);

        out._addInput(this);
    };

    SourceEndpoint.prototype.disconnect = function disconnect(out) {
        var index = this.outputs.indexOf(out);

        if (index != -1) {
            this.outputs.splice(index, 1);
            out._removeInput(this);
        }
    };

    SourceEndpoint.prototype.fullDisconnect = function fullDisconnect() {
        // Outputs
        var outputs = Wirecloud.Utils.clone(this.outputs);
        for (var i = 0; i < outputs.length; ++i) {
            this.disconnect(outputs[i]);
        }
    };

    /**
     * Sets the value for this <code>Wirecloud.wiring.SourceEndpoint</code>. Also, this method propagates this
     * new value to the output connectables.
     */
    SourceEndpoint.prototype.propagate = function propagate(value, options) {
        var i;

        options = Wirecloud.Utils.merge({
            initial: false
        }, options);

        for (i = 0; i < this.outputs.length; ++i) {
            this.outputs[i].propagate(value, options);
        }
    };

    SourceEndpoint.prototype.getFinalSlots = function getFinalSlots() {
        var slots = [];

        for (var i = 0; i < this.outputs.length; ++i) {
            var currentSlots = this.outputs[i].getFinalSlots();
            if (currentSlots && currentSlots.length > 0) {
                slots = slots.concat(currentSlots);
            }
        }

        return slots;
    };

    Wirecloud.wiring.SourceEndpoint = SourceEndpoint;
})();
