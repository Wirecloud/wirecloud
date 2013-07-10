/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, interpolate, wOut, Wirecloud*/

(function () {

    "use strict";

    var OperatorTargetEndpoint = function OperatorTargetEndpoint(operator, meta) {
        Object.defineProperty(this, 'meta', {value: meta});
        Object.defineProperty(this, 'name', {value: meta.name});
        Object.defineProperty(this, 'friendcode', {value: meta.friendcode});
        Object.defineProperty(this, 'label', {value: meta.label});
        Object.defineProperty(this, 'description', {value: meta.description});
        Object.defineProperty(this, 'operator', {value: operator});

        this.connectable = this;
        wOut.call(this, this.meta.name, this.meta.type, this.meta.friendcode, 'ioperator_' + this.operator.id + '_' + this.meta.name);
    };
    OperatorTargetEndpoint.prototype = new wOut();

    OperatorTargetEndpoint.prototype.serialize = function serialize() {
        return {
            'type': 'ioperator',
            'id': this.operator.id,
            'endpoint': this.meta.name
        };
    };

    OperatorTargetEndpoint.prototype._is_target_slot = function _is_target_slot(list) {
        var i, target;

        if (list == null) {
            return true;
        }

        for (i = 0; i < list.length; i += 1) {
            target = list[i];
            if ((target.type === 'ioperator') && (target.id == this.operator.id) && (target.endpoint == this.meta.name)) {
                return true;
            }
        }
        return false;
    };

    OperatorTargetEndpoint.prototype.getFinalSlots = function getFinalSlots() {
        var action_label = this.meta.action_label, result;
        if (!action_label || action_label === '') {
            action_label = gettext('Use in %(slotName)s');
            action_label = interpolate(action_label, {slotName: this.meta.label}, true);
        }

        result = this.serialize();
        result.action_label = action_label;

        return [result];
    };

    OperatorTargetEndpoint.prototype._annotate = function _anotate(value, source, options) {
    };

    OperatorTargetEndpoint.prototype.propagate = function propagate(newValue, options) {
        if (!options || this._is_target_slot(options.targetEndpoints)) {
            if (this.operator.loaded) {
                try {
                    this.callback.call(this.operator, newValue);
                } catch (e) {
                }
            } else {
                this.operator.pending_events.push({'endpoint': this.meta.name, 'value': newValue});
            }
        }
    };

    Wirecloud.wiring.OperatorTargetEndpoint = OperatorTargetEndpoint;

})();
