/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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


(function (ns, utils) {

    "use strict";

    ns.OperatorSourceEndpoint = class OperatorSourceEndpoint extends ns.SourceEndpoint {

        constructor(operator, meta) {
            const id = meta != null ? 'operator/' + operator.id + '/' + meta.name : null;

            super(id, meta);

            Object.defineProperties(this, {
                component: {value: operator},
                meta: {value: meta},
                missing: {value: false}
            });
        }

        toString() {
            return this.id;
        }

        toJSON() {
            return {
                type: this.component.meta.type,
                id: this.component.id,
                endpoint: this.name
            };
        }

    }

})(Wirecloud.wiring, Wirecloud.Utils);
