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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    ns.GhostSourceEndpoint = class GhostSourceEndpoint extends ns.SourceEndpoint {

        constructor(entity, endpoint) {
            const id = entity.meta.type + '/' + entity.id + '/' + endpoint;
            super(id, {name: endpoint, label: endpoint});

            Object.defineProperties(this, {
                component: {value: entity},
                meta: {value: null},
                missing: {value: true}
            });
        }

        propagate() {
            // Do nothing as this endpoint is missing
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


    ns.GhostTargetEndpoint = class GhostTargetEndpoint extends ns.TargetEndpoint {

        constructor(entity, endpoint) {
            const id = entity.meta.type + '/' + entity.id + '/' + endpoint;
            super(id, {name: endpoint, label: endpoint});

            Object.defineProperties(this, {
                component: {value: entity},
                meta: {value: null},
                missing: {value: true}
            });
        }

        propagate() {
            // Do nothing as this endpoint is missing
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

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
