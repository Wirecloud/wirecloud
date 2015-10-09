/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, interpolate, Wirecloud*/

(function () {

    "use strict";

    var is_target_endpoint = function is_target_endpoint(list) {
        var i, target;

        if (list == null) {
            return true;
        }

        for (i = 0; i < list.length; i += 1) {
            target = list[i];
            if (target.type === 'iwidget' && (target.id == this.widget.id) && (target.endpoint == this.meta.name)) {
                return true;
            }
        }
        return false;
    };

    var WidgetTargetEndpoint = function WidgetTargetEndpoint(iwidget, meta) {
        Object.defineProperty(this, 'iwidget', {value: iwidget});
        Object.defineProperty(this, 'component', {value: iwidget});

        Object.defineProperty(this, 'meta', {value: meta});
        if (meta != null) {
            Object.defineProperty(this, 'name', {value: meta.name});
            Object.defineProperty(this, 'missing', {value: false});
            Object.defineProperty(this, 'friendcode', {value: meta.friendcode});
            Object.defineProperty(this, 'keywords', {value: meta.friendcode.trim().split(/\s+/)});
            Object.defineProperty(this, 'label', {value: meta.label});
            Object.defineProperty(this, 'description', {value: meta.description ? meta.description : gettext("No description provided.")});
            Object.defineProperty(this, 'id', {value: 'widget/' + iwidget.id + '/' + this.meta.name});
        }

        Wirecloud.wiring.TargetEndpoint.call(this);
    };
    WidgetTargetEndpoint.prototype = new Wirecloud.wiring.TargetEndpoint();

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
            actionlabel = gettext('Use in %(endpointName)s');
            actionlabel = interpolate(actionlabel, {endpointName: this.meta.label}, true);
        }

        result = this.toJSON();
        result.actionlabel = actionlabel;
        result.iWidgetName = this.iwidget.name;

        return [result];
    };

    WidgetTargetEndpoint.prototype.propagate = function propagate(newValue, options) {
        var msg, details;

        if (!options || is_target_endpoint.call(this, options.targetEndpoints)) {
            if (this.iwidget.loaded) {
                if (this.callback == null) {
                    msg = gettext('Exception catched while processing an event that reached the "%(inputendpoint)s" input endpoint');
                    msg = interpolate(msg, {inputendpoint: this.meta.name}, true);
                    details = gettext('Widget has not registered a callback for this input endpoint');
                    this.iwidget.logManager.log(msg, {details: details});
                    return;
                }
                try {
                    this.callback.call(this.iwidget, newValue);
                } catch (error) {
                    if (error instanceof Wirecloud.wiring.EndpointTypeError || error instanceof Wirecloud.wiring.EndpointValueError) {
                        throw error;
                    } else {
                        msg = gettext('Exception catched while processing an event that reached the "%(inputendpoint)s" input endpoint');
                        msg = interpolate(msg, {inputendpoint: this.meta.name}, true);
                        details = this.iwidget.logManager.formatException(error);
                        this.iwidget.logManager.log(msg, {details: details});
                    }
                }
            } else {
                this.iwidget.pending_events.push({'endpoint': this.meta.name, 'value': newValue});
                // TODO
                Wirecloud.activeWorkspace.getIWidget(this.iwidget.id).load();
            }
        }
    };

    Wirecloud.wiring.WidgetTargetEndpoint = WidgetTargetEndpoint;

})();
