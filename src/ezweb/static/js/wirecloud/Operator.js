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
    var name, description, inputs, outputs;

    if (!('name' in desc) || desc.name.trim() === '') {
        throw new TypeError(gettext('missing operator name'));
    }
    name = desc.name.trim();
    Object.defineProperty(this, 'name', {value: name});

    description = desc.description;
    if (description == null || description.trim() === '') {
        description = '';
    }
    Object.defineProperty(this, 'description', {value: description});

    inputs = desc.inputs;
    if (inputs == null) {
        inputs = {};
    }
    Object.defineProperty(this, 'inputs', {value: inputs});

    outputs = desc.outputs;
    if (outputs == null) {
        outputs = {};
    }
    Object.defineProperty(this, 'outputs', {value: outputs});

    if (inputs.length === 0 && outputs.length === 0) {
        throw new TypeError();
    }
};

OperatorMeta.prototype.instanciate = function instanciate(id) {
    return new Operator(this, id);
};

var Operator = function Operator(operator_meta, id) {
    var key, inputs, outputs;

    Object.defineProperty(this, 'meta', {value: operator_meta});
    Object.defineProperty(this, 'name', {value: operator_meta.name});
    Object.defineProperty(this, 'id', {value: id});

    inputs = this.meta.inputs;
    this.inputs = {};
    for (key in inputs) {
        this.inputs[key] = new OperatorTargetEndpoint(this, inputs[key]);
    }

    outputs = this.meta.outputs;
    this.outputs = {};
    for (key in outputs) {
        this.outputs[key] = new OperatorSourceEndpoint(this, outputs[key]);
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


var OperatorTargetEndpoint = function OperatorTargetEndpoint(operator, meta) {
    Object.defineProperty(this, 'meta', {value: meta});
    Object.defineProperty(this, 'name', {value: meta.name});
    Object.defineProperty(this, 'label', {value: meta.label});
    Object.defineProperty(this, 'description', {value: meta.description});
    Object.defineProperty(this, 'operator', {value: operator});

    this.connectable = this;
    wOut.call(this, this.meta.name, this.meta.type, this.operator.id + '_' + this.meta.name);
};
OperatorTargetEndpoint.prototype = new wOut();

OperatorTargetEndpoint.prototype.serialize = function serialize() {
    return {
        'type': 'ioperator',
        'id': this.operator.id,
        'endpoint': this.meta.name
    };
};

OperatorTargetEndpoint.prototype._is_target_slot = function _is_target_slot(variable, list) {
    var i, slot;

    if (list == null) {
        return true;
    }

    for (i = 0; i < list.length; i += 1) {
        slot = list[i];
        if (slot.ioperator == this.operator.id && slot.name == this.meta.name) {
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
    Object.defineProperty(this, 'operator', {value: operator});
    Object.defineProperty(this, 'label', {value: meta.label});
    Object.defineProperty(this, 'description', {value: meta.description});
    Object.defineProperty(this, 'operator', {value: operator});

    this.connectable = this; // TODO
    wIn.call(this, this.meta.name, this.meta.type, this.operator.id + '_' + this.meta.name);
};
OperatorSourceEndpoint.prototype = new wIn();

OperatorSourceEndpoint.prototype.serialize = function serialize() {
    return {
        'type': 'ioperator',
        'id': this.operator.id,
        'endpoint': this.meta.name
    };
};
