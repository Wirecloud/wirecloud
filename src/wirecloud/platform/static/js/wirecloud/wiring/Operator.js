/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

(function () {

    "use strict";

    var Operator = function Operator(operator_meta, id, operator_status, /* TODO */ wiringEditor) {
        var i, inputs, outputs, data_uri, preferences, key;

        StyledElements.ObjectWithEvents.call(this, ['load', 'unload']);

        Object.defineProperty(this, 'meta', {value: operator_meta});
        Object.defineProperty(this, 'name', {value: operator_meta.name});
        Object.defineProperty(this, 'display_name', {value: operator_meta.display_name});
        Object.defineProperty(this, 'id', {value: id});

        this.loaded = false;

        inputs = this.meta.inputs;
        this.inputs = {};
        for (i = 0; i < inputs.length; i++) {
            this.inputs[inputs[i].name] = new OperatorTargetEndpoint(this, inputs[i]);
        }

        outputs = this.meta.outputs;
        this.outputs = {};
        for (i = 0; i < outputs.length; i++) {
            this.outputs[outputs[i].name] = new OperatorSourceEndpoint(this, outputs[i]);
        }

        preferences = {}
        if (operator_status) {
            for (key in operator_status.preferences) {
                preferences[key] = operator_status.preferences[key];
            }
        }

        for (key in this.meta.preferences) {
            if (!(key in preferences)) {
                preferences[key] = this.meta.preferences[key].default_value;
            }
        }
        Object.defineProperty(this, 'preferences', {value: preferences});

        if (!wiringEditor) {
            this.element = document.createElement('object');
            data_uri = Wirecloud.URLs.OPERATOR_ENTRY.evaluate({vendor: operator_meta.vendor, name: operator_meta.name, version: operator_meta.version}) + '#id=' + id;
            this.element.addEventListener('load', function () {
                this.loaded = true;
                this.events.load.dispatch(this);
            }.bind(this), true);
            this.element.addEventListener('unload', function () {
                this.loaded = false;
                this.events.unload.dispatch(this);
            }.bind(this), true);
            this.element.setAttribute('data', data_uri);
            document.body.appendChild(this.element);
        }
    };
    Operator.prototype = new StyledElements.ObjectWithEvents();

    Operator.prototype.sendEvent = function sendEvent(endpoint_name, data) {
        this.outputs[endpoint_name].propagate(data);
    };

    Operator.prototype.fullDisconnect = function fullDisconnect() {
        var i, connectables;

        connectables = this.inputs;
        for (i = 0; i < connectables.length; i++) {
            connectables[i].fullDisconnect();
        }

        connectables = this.outputs;
        for (i = 0; i < connectables.length; i++) {
            connectables[i].fullDisconnect();
        }
    };

    Operator.prototype.destroy = function destroy() {
        if (this.loaded) {
            this.events.unload.dispatch(this);
        }

        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    };

    Wirecloud.Operator = Operator;
})();
