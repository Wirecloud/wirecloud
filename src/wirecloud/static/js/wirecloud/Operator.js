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

var OperatorMeta = function OperatorMeta(desc) {
    var vendor, name, version, display_name, description, inputs, outputs;

    // Vendor
    if (!('vendor' in desc) || desc.vendor.trim() === '') {
        throw new TypeError(gettext('missing operator vendor'));
    }
    vendor = desc.vendor.trim();
    Object.defineProperty(this, 'vendor', {value: vendor});

    // Name
    if (!('name' in desc) || desc.name.trim() === '') {
        throw new TypeError(gettext('missing operator name'));
    }
    name = desc.name.trim();
    Object.defineProperty(this, 'name', {value: name});

    // Version
    if (!('version' in desc) || desc.version.trim() === '') {
        throw new TypeError(gettext('missing operator version'));
    }
    version = desc.version.trim();
    Object.defineProperty(this, 'version', {value: version});

    // URI
    uri = desc.name.trim();
    Object.defineProperty(this, 'uri', {value: vendor + '/' + name + '/' + version});

    if (!('display_name' in desc) || desc.display_name.trim() === '') {
        display_name = name;
    } else {
        display_name = desc.display_name;
    }
    Object.defineProperty(this, 'display_name', {value: display_name});

    description = desc.description;
    if (description == null || description.trim() === '') {
        description = '';
    }
    Object.defineProperty(this, 'description', {value: description});

    inputs = desc.wiring.slots;
    if (inputs == null) {
        inputs = {};
    }
    Object.defineProperty(this, 'inputs', {value: inputs});

    outputs = desc.wiring.events;
    if (outputs == null) {
        outputs = {};
    }
    Object.defineProperty(this, 'outputs', {value: outputs});

    if (inputs.length === 0 && outputs.length === 0) {
        throw new TypeError();
    }
};

OperatorMeta.prototype.instanciate = function instanciate(id/*TODO*/, wiringEditor) {
    return new Operator(this, id /* TODO */, wiringEditor);
};

var Operator = function Operator(operator_meta, id, /* TODO */ wiringEditor) {
    var i, inputs, outputs, data_uri;

    Object.defineProperty(this, 'meta', {value: operator_meta});
    Object.defineProperty(this, 'name', {value: operator_meta.name});
    Object.defineProperty(this, 'display_name', {value: operator_meta.display_name});
    Object.defineProperty(this, 'id', {value: id});

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

    if (!wiringEditor) {
        this.element = document.createElement('object');
        data_uri = Wirecloud.URLs.OPERATOR_ENTRY.evaluate({vendor: operator_meta.vendor, name: operator_meta.name, version: operator_meta.version}) + '#id=' + id;
        this.element.setAttribute('data', data_uri);
        document.body.appendChild(this.element);
    }
};

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
    if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
    }
};


var OperatorTargetEndpoint = function OperatorTargetEndpoint(operator, meta) {
    Object.defineProperty(this, 'meta', {value: meta});
    Object.defineProperty(this, 'name', {value: meta.name});
    Object.defineProperty(this, 'friendcode', {value: meta.friendcode});
    Object.defineProperty(this, 'label', {value: meta.label});
    Object.defineProperty(this, 'description', {value: meta.description});
    Object.defineProperty(this, 'operator', {value: operator});

    this.connectable = this;
    wOut.call(this, this.meta.name, this.meta.type, this.meta.friendcode, this.operator.id + '_' + this.meta.name);
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
    if (!options || this._is_target_slot(options.targetSlots)) {
        this.meta.callback.call(this.operator, newValue);
    }
};


var OperatorSourceEndpoint = function OperatorSourceEndpoint(operator, meta) {
    Object.defineProperty(this, 'meta', {value: meta});
    Object.defineProperty(this, 'name', {value: meta.name});
    Object.defineProperty(this, 'friendcode', {value: meta.friendcode});
    Object.defineProperty(this, 'operator', {value: operator});
    Object.defineProperty(this, 'label', {value: meta.label});
    Object.defineProperty(this, 'description', {value: meta.description});
    Object.defineProperty(this, 'operator', {value: operator});

    this.connectable = this; // TODO
    wIn.call(this, this.meta.name, this.meta.type, this.friendcode, this.operator.id + '_' + this.meta.name);
};
OperatorSourceEndpoint.prototype = new wIn();

OperatorSourceEndpoint.prototype.serialize = function serialize() {
    return {
        'type': 'ioperator',
        'id': this.operator.id,
        'endpoint': this.meta.name
    };
};
