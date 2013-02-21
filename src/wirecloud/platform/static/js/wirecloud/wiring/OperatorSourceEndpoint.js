/*
 *     (C) Copyright 2012-2013 Universidad Politécnica de Madrid
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

