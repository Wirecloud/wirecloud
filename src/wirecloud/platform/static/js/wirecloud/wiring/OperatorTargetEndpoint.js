/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var OperatorTargetEndpoint = function OperatorTargetEndpoint(operator, meta) {
        Object.defineProperties(this, {
            component: {value: operator},
            meta: {value: meta},
            missing: {value: false}
        });

        if (meta != null) {
            Object.defineProperties(this, {
                name: {value: meta.name},
                friendcode: {value: meta.friendcode},
                label: {value: meta.label},
                description: {value: meta.description ? meta.description : ""},
                id: {value: 'operator/' + operator.id + '/' + this.meta.name},
            });
        }

        this.callback = null;

        Wirecloud.wiring.TargetEndpoint.call(this);
    };
    utils.inherit(OperatorTargetEndpoint, Wirecloud.wiring.TargetEndpoint);

    OperatorTargetEndpoint.prototype.toString = function toString() {
        return this.id;
    };

    OperatorTargetEndpoint.prototype.toJSON = function toJSON() {
        return {
            type: this.component.meta.type,
            id: this.component.id,
            endpoint: this.name
        };
    };

    OperatorTargetEndpoint.prototype.getReachableEndpoints = function getReachableEndpoints() {
        var actionlabel = this.meta.actionlabel, result;
        if (!actionlabel || actionlabel === '') {
            actionlabel = utils.gettext('Use in %(endpointName)s');
            actionlabel = utils.interpolate(actionlabel, {endpointName: this.meta.label}, true);
        }

        result = this.toJSON();
        result.actionlabel = actionlabel;

        return [result];
    };

    OperatorTargetEndpoint.prototype.propagate = function propagate(newValue, options) {
        var msg, details;

        if (!options || is_target_endpoint.call(this, options.targetEndpoints)) {
            if (this.component.loaded) {
                if (this.callback == null) {
                    msg = utils.gettext('Exception catched while processing an event that reached the "%(inputendpoint)s" input endpoint');
                    msg = utils.interpolate(msg, {inputendpoint: this.meta.name}, true);
                    details = utils.gettext('Operator has not registered a callback for this input endpoint');
                    this.component.logManager.log(msg, {details: details});
                    return;
                }
                try {
                    this.callback.call(this.component, newValue);
                } catch (error) {
                    if (error instanceof Wirecloud.wiring.EndpointTypeError || error instanceof Wirecloud.wiring.EndpointValueError) {
                        throw error;
                    } else {
                        msg = utils.gettext('Exception catched while processing an event that reached the "%(inputendpoint)s" input endpoint');
                        msg = utils.interpolate(msg, {inputendpoint: this.meta.name}, true);
                        details = this.component.logManager.formatException(error);
                        this.component.logManager.log(msg, {details: details});
                    }
                }
            } else {
                this.component.pending_events.push({'endpoint': this.meta.name, 'value': newValue});
            }
        }
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var is_target_endpoint = function is_target_endpoint(list) {
        var i, target;

        if (list == null) {
            return true;
        }

        for (i = 0; i < list.length; i += 1) {
            target = list[i];
            if ((target.type === this.component.meta.type) && (target.id === this.component.id) && (target.endpoint === this.name)) {
                return true;
            }
        }
        return false;
    };

    Wirecloud.wiring.OperatorTargetEndpoint = OperatorTargetEndpoint;

})(Wirecloud.Utils);
