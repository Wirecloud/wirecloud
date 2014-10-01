/*
 *     Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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
        Object.defineProperty(this, 'meta', {value: meta});
        Object.defineProperty(this, 'name', {value: meta.name});
        Object.defineProperty(this, 'friendcode', {value: meta.friendcode});
        Object.defineProperty(this, 'label', {value: meta.label});
        Object.defineProperty(this, 'description', {value: meta.description});
        Object.defineProperty(this, 'iwidget', {value: iwidget});

        Wirecloud.wiring.TargetEndpoint.call(this, this.meta.name, this.meta.type, this.meta.friendcode, 'iwidget_' + iwidget.id + '_' + this.meta.name);
    };
    WidgetTargetEndpoint.prototype = new Wirecloud.wiring.TargetEndpoint();

    WidgetTargetEndpoint.prototype.serialize = function serialize() {
        return {
            'type': 'iwidget',
            'id': this.iwidget.id,
            'endpoint': this.meta.name
        };
    };

    WidgetTargetEndpoint.prototype.getFinalSlots = function getFinalSlots() {

        var result, action_label = this.meta.action_label;

        if (!action_label || action_label === '') {
            action_label = gettext('Use in %(slotName)s');
            action_label = interpolate(action_label, {slotName: this.meta.label}, true);
        }

        result = this.serialize();
        result.action_label = action_label;
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
                    msg = gettext('Exception catched while processing an event that reached the "%(inputendpoint)s" input endpoint');
                    msg = interpolate(msg, {inputendpoint: this.meta.name}, true);
                    details = this.iwidget.logManager.formatException(error);
                    this.iwidget.logManager.log(msg, {details: details});
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
