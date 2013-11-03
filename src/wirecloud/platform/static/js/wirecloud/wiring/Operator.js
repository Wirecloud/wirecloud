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

/*global StyledElements, Wirecloud*/

(function () {

    "use strict";

    var Operator = function Operator(operator_meta, id, operator_status, /* TODO */ wiringEditor) {
        var i, inputs, outputs, data_uri, preferences, key;

        StyledElements.ObjectWithEvents.call(this, ['load', 'unload']);

        Object.defineProperty(this, 'meta', {value: operator_meta});
        Object.defineProperty(this, 'name', {value: operator_meta.name});
        Object.defineProperty(this, 'display_name', {value: operator_meta.display_name});
        Object.defineProperty(this, 'id', {value: id});
        Object.defineProperty(this, 'logManager', {value: new Wirecloud.wiring.OperatorLogManager(this)});

        this.loaded = false;

        inputs = this.meta.inputs;
        this.inputs = {};
        for (i = 0; i < inputs.length; i++) {
            this.inputs[inputs[i].name] = new Wirecloud.wiring.OperatorTargetEndpoint(this, inputs[i]);
        }

        outputs = this.meta.outputs;
        this.outputs = {};
        for (i = 0; i < outputs.length; i++) {
            this.outputs[outputs[i].name] = new Wirecloud.wiring.OperatorSourceEndpoint(this, outputs[i]);
        }

        this.pending_events = [];

        preferences = {};
        if (operator_status) {
            for (key in operator_status.preferences) {
                preferences[key] = operator_status.preferences[key];
            }
        }

        for (key in this.meta.preferences) {
            if (!(key in preferences)) {
                preferences[key] = {
                    'readonly': false,
                    'hidden': false,
                    'value': this.meta.preferences[key].default_value
                };
            }
        }
        Object.freeze(preferences);
        Object.defineProperty(this, 'preferences', {value: preferences});

        if (!wiringEditor) {
            this.element = document.createElement('object');
            data_uri = Wirecloud.URLs.OPERATOR_ENTRY.evaluate({vendor: operator_meta.vendor, name: operator_meta.name, version: operator_meta.version}) + '#id=' + id;
            this.element.addEventListener('load', function () {
                this.loaded = true;
                this.events.load.dispatch(this);
                for (var i = 0; i < this.pending_events.length; i += 1) {
                    this.inputs[this.pending_events[i].endpoint].propagate(this.pending_events[i].value);
                }
                this.pending_events = [];
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

    Operator.prototype.fullDisconnect = function fullDisconnect() {
        var key, connectables;

        connectables = this.inputs;
        for (key in connectables) {
            connectables[key].fullDisconnect();
        }

        connectables = this.outputs;
        for (key in connectables) {
            connectables[key].fullDisconnect();
        }
    };

    Operator.prototype.destroy = function destroy() {
        this.fullDisconnect();

        if (this.loaded) {
            this.events.unload.dispatch(this);
        }

        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    };

    Wirecloud.Operator = Operator;
})();
