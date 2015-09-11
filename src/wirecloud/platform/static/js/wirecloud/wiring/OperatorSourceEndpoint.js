/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global Wirecloud */

(function () {

    "use strict";

    var OperatorSourceEndpoint = function OperatorSourceEndpoint(operator, meta) {
        Object.defineProperty(this, 'operator', {value: operator});
        Object.defineProperty(this, 'component', {value: operator});

        Object.defineProperty(this, 'meta', {value: meta});
        if (meta != null) {
            Object.defineProperty(this, 'name', {value: meta.name});
            Object.defineProperty(this, 'missing', {value: false});
            Object.defineProperty(this, 'friendcode', {value: meta.friendcode});
            Object.defineProperty(this, 'keywords', {value: meta.friendcode.trim().split(/\s+/)});
            Object.defineProperty(this, 'label', {value: meta.label});
            Object.defineProperty(this, 'description', {value: meta.description ? meta.description : gettext("No description provided.")});
            Object.defineProperty(this, 'id', {value: 'operator/' + this.operator.id + '/' + this.meta.name});
        }

        Wirecloud.wiring.SourceEndpoint.call(this);
    };
    OperatorSourceEndpoint.prototype = new Wirecloud.wiring.SourceEndpoint();

    OperatorSourceEndpoint.prototype.serialize = function serialize() {
        return {
            'type': 'operator',
            'id': this.operator.id,
            'endpoint': this.meta.name
        };
    };

    Wirecloud.wiring.OperatorSourceEndpoint = OperatorSourceEndpoint;

})();
