/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var WidgetTargetEndpoint = function WidgetTargetEndpoint(widget, meta) {
        Object.defineProperties(this, {
            component: {value: widget},
            meta: {value: meta},
            missing: {value: false}
        });

        if (meta != null) {
            Object.defineProperties(this, {
                name: {value: meta.name},
                friendcode: {value: meta.friendcode},
                label: {value: meta.label},
                description: {value: meta.description ? meta.description : ""},
                id: {value: 'widget/' + this.component.id + '/' + this.meta.name},
            });
        }

        this.callback = null;

        Wirecloud.wiring.TargetEndpoint.call(this);
    };
    utils.inherit(WidgetTargetEndpoint, Wirecloud.wiring.TargetEndpoint);

    WidgetTargetEndpoint.prototype.toString = function toString() {
        return this.id;
    };

    WidgetTargetEndpoint.prototype.toJSON = function toJSON() {
        return {
            type: this.component.meta.type,
            id: this.component.id,
            endpoint: this.name
        };
    };

    WidgetTargetEndpoint.prototype.getReachableEndpoints = function getReachableEndpoints() {

        var result, actionlabel = this.meta.actionlabel;

        if (!actionlabel || actionlabel === '') {
            actionlabel = utils.gettext('Use in %(endpointName)s');
            actionlabel = utils.interpolate(actionlabel, {endpointName: this.meta.label}, true);
        }

        result = this.toJSON();
        result.actionlabel = actionlabel;
        result.iWidgetName = this.component.title;

        return [result];
    };

    WidgetTargetEndpoint.prototype.propagate = function propagate(newValue, options) {
        var msg, details;

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
            if (target.type === this.component.meta.type && (target.id === this.component.id) && (target.endpoint === this.name)) {
                return true;
            }
        }
        return false;
    };

    Wirecloud.wiring.WidgetTargetEndpoint = WidgetTargetEndpoint;

})(Wirecloud.Utils);
