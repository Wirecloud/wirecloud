/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
            if (target.type === this.component.meta.type && (target.id === this.component.id) && (target.endpoint === this.name)) {
                return true;
            }
        }
        return false;
    };

    ns.WidgetTargetEndpoint = class WidgetTargetEndpoint extends ns.TargetEndpoint {

        constructor(widget, meta) {
            const id = meta != null ? 'widget/' + widget.id + '/' + meta.name : null;

            super(id, meta);

            Object.defineProperties(this, {
                component: {value: widget},
                meta: {value: meta},
                missing: {value: false}
            });

            this.callback = null;
        };

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
            result.iWidgetName = this.component.title;

            return [result];
        }

        propagate(newValue, options) {
            let msg, details;

            if (!options || is_target_endpoint.call(this, options.targetEndpoints)) {
                if (this.component.loaded) {
                    if (this.callback == null) {
                        msg = utils.gettext('Exception catched while processing an event that reached the "%(inputendpoint)s" input endpoint');
                        msg = utils.interpolate(msg, {inputendpoint: this.meta.name}, true);
                        details = utils.gettext('Widget has not registered a callback for this input endpoint');
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
                    // We have to call the load on the associated WidgetView
                    this.component.tab.workspace.view.findWidget(this.component.id).load();
                }
            }
        }

    }

})(Wirecloud.wiring, Wirecloud.Utils);
