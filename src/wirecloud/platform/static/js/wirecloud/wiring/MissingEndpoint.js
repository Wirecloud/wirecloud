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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    var GhostSourceEndpoint = function GhostSourceEndpoint(entity, endpoint) {
        Object.defineProperties(this, {
            id: {value: entity.meta.type + '/' + entity.id + '/' + endpoint},
            component: {value: entity},
            name: {value: endpoint},
            label: {value: endpoint},
            description: {value: ''},
            friendcode: {value: ''},
            missing: {value: true}
        });

        ns.SourceEndpoint.call(this);
    };
    utils.inherit(GhostSourceEndpoint, ns.SourceEndpoint, {

        propagate: function propagate() {
            // Do nothing as this endpoint is missing
        },

        toString: function toString() {
            return this.id;
        },

        toJSON: function toJSON() {
            return {
                type: this.component.meta.type,
                id: this.component.id,
                endpoint: this.name
            };
        }

    });

    Wirecloud.wiring.GhostSourceEndpoint = GhostSourceEndpoint;

    var GhostTargetEndpoint = function GhostTargetEndpoint(entity, endpoint) {
        Object.defineProperties(this, {
            id: {value: entity.meta.type + '/' + entity.id + '/' + endpoint},
            component: {value: entity},
            name: {value: endpoint},
            label: {value: endpoint},
            description: {value: ''},
            friendcode: {value: ''},
            missing: {value: true}
        });

        ns.TargetEndpoint.call(this);
    };
    utils.inherit(GhostTargetEndpoint, Wirecloud.wiring.TargetEndpoint, {

        propagate: function propagate() {
            // Do nothing as this endpoint is missing
        },

        toString: function toString() {
            return this.id;
        },

        toJSON: function toJSON() {
            return {
                type: this.component.meta.type,
                id: this.component.id,
                endpoint: this.name
            };
        }

    });

    Wirecloud.wiring.GhostTargetEndpoint = GhostTargetEndpoint;

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
