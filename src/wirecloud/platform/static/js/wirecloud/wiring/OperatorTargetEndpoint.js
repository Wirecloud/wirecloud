/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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


(function (ns, utils) {

    "use strict";

    const is_target_endpoint = function is_target_endpoint(list) {
        if (list == null) {
            return true;
        }

        for (let i = 0; i < list.length; i += 1) {
            const target = list[i];
            if ((target.type === this.component.meta.type) && (target.id === this.component.id) && (target.endpoint === this.name)) {
                return true;
            }
        }
        return false;
    };

    ns.OperatorTargetEndpoint = class OperatorTargetEndpoint extends ns.TargetEndpoint {

        constructor(operator, meta) {
            const id = meta != null ? 'operator/' + operator.id + '/' + meta.name : null;

            super(id, meta);

            Object.defineProperties(this, {
                component: {value: operator},
                meta: {value: meta},
                missing: {value: false}
            });

            this.callback = null;
        }

        toString() {
            return this.id;
        }

        toJSON() {
            return {
                type: this.component.meta.type,
                id: this.component.id,
                endpoint: this.name
            };
        }

        getReachableEndpoints() {
            let actionlabel = this.meta.actionlabel;
            if (!actionlabel || actionlabel === '') {
                actionlabel = utils.gettext('Use in %(endpointName)s');
                actionlabel = utils.interpolate(actionlabel, {endpointName: this.meta.label}, true);
            }

            const result = this.toJSON();
            result.actionlabel = actionlabel;

            return [result];
        }

        propagate(newValue, options) {
            if (!options || is_target_endpoint.call(this, options.targetEndpoints)) {
                if (this.component.loaded) {
                    if (this.callback == null) {
                        const msg = utils.interpolate(
                            utils.gettext('Exception catched while processing an event that reached the "%(inputendpoint)s" input endpoint'),
                            {inputendpoint: this.meta.name},
                            true
                        );
                        const details = utils.gettext('Operator has not registered a callback for this input endpoint');
                        this.component.logManager.log(msg, {details: details});
                        return;
                    }
                    try {
                        this.callback.call(this.component, newValue);
                    } catch (error) {
                        if (error instanceof Wirecloud.wiring.EndpointTypeError || error instanceof Wirecloud.wiring.EndpointValueError) {
                            throw error;
                        } else {
                            const msg = utils.interpolate(
                                utils.gettext('Exception catched while processing an event that reached the "%(inputendpoint)s" input endpoint'),
                                {inputendpoint: this.meta.name},
                                true
                            );
                            const details = this.component.logManager.formatException(error);
                            this.component.logManager.log(msg, {details: details});
                        }
                    }
                } else {
                    this.component.pending_events.push({'endpoint': this.meta.name, 'value': newValue});
                }
            }
        }

    }

})(Wirecloud.wiring, Wirecloud.Utils);
