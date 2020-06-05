/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var OperatorSourceEndpoint = function OperatorSourceEndpoint(operator, meta) {
        Object.defineProperties(this, {
            component: {value: operator},
            meta: {value: meta},
            missing: {value: false}
        });

        if (meta != null) {
            Object.defineProperties(this, {
                name: {value: meta.name},
                friendcode: {value: meta.friendcode},
                label: {value: meta.label},
                description: {value: meta.description ? meta.description : ""},
                id: {value: 'operator/' + this.component.id + '/' + this.meta.name},
            });
        }

        Wirecloud.wiring.SourceEndpoint.call(this);
    };
    utils.inherit(OperatorSourceEndpoint, Wirecloud.wiring.SourceEndpoint);

    OperatorSourceEndpoint.prototype.toString = function toString() {
        return this.id;
    };

    OperatorSourceEndpoint.prototype.toJSON = function toJSON() {
        return {
            type: this.component.meta.type,
            id: this.component.id,
            endpoint: this.name
        };
    };

    Wirecloud.wiring.OperatorSourceEndpoint = OperatorSourceEndpoint;

})(Wirecloud.Utils);
