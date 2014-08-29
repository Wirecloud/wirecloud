/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var Operator = function Operator(operator_meta, id, operator_status, wiring) {
        var i, inputs, outputs, data_uri, preferenceList, preferences, readonly, hidden, key, value;

        if (["object", "undefined"].indexOf(typeof operator_status) === -1) {
            throw new TypeError('invalid operator status');
        }
        if (operator_status == null) {
            operator_status = {};
        }
        if (operator_status.preferences == null) {
            operator_status.preferences = {};
        }

        StyledElements.ObjectWithEvents.call(this, ['load', 'unload']);

        Object.defineProperties(this, {
            meta: {value: operator_meta},
            name: {value: operator_meta.name},
            title: {value: operator_meta.title},
            id: {value: "" + id},
            wiring: {value: wiring}
        });
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

        preferenceList = [];
        preferences = {};
        for (i = 0; i < this.meta.preferenceList.length; i++) {
            key = this.meta.preferenceList[i].name;
            if (key in operator_status.preferences) {
                value = operator_status.preferences[key].value;
                readonly = operator_status.preferences[key].readonly;
                hidden = operator_status.preferences[key].hidden;
            } else {
                value = this.meta.preferenceList[i].default;
                readonly = hidden = false;
            }
            preferences[key] = new Wirecloud.UserPref(this.meta.preferenceList[i], readonly, hidden, value);
            preferenceList.push(preferences[key]);
        }
        Object.freeze(preferenceList);
        Object.defineProperty(this, 'preferenceList', {value: preferenceList});
        Object.freeze(preferences);
        Object.defineProperty(this, 'preferences', {value: preferences});

        if (wiring instanceof Wirecloud.Wiring) {
            this.element = document.createElement('iframe');
            this.element.className = 'ioperator';
            data_uri = Wirecloud.URLs.OPERATOR_ENTRY.evaluate({vendor: operator_meta.vendor, name: operator_meta.name, version: operator_meta.version.text}) + '#id=' + id;
            this.element.addEventListener('load', function () {
                this.logManager.log('Operator loaded', Wirecloud.constants.LOGGING.INFO_MSG);
                this.loaded = true;
                this.events.load.dispatch(this);
                for (var i = 0; i < this.pending_events.length; i += 1) {
                    this.inputs[this.pending_events[i].endpoint].propagate(this.pending_events[i].value);
                }
                this.pending_events = [];
            }.bind(this), true);
            this.element.addEventListener('unload', function () {
                this.logManager.log('Operator unloaded', Wirecloud.constants.LOGGING.INFO_MSG);
                this.loaded = false;
                this.events.unload.dispatch(this);
            }.bind(this), true);
            this.element.setAttribute('type', 'text/html');
            this.element.setAttribute('src', data_uri);
            document.getElementById('workspace').appendChild(this.element);
        }
    };
    Operator.prototype = new StyledElements.ObjectWithEvents();

    Operator.prototype.registerPrefCallback = function registerPrefCallback(prefCallback) {
        this.prefCallback = prefCallback;
    };

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
