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

/*global gettext, StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    var GhostSourceEndpoint = function GhostSourceEndpoint(entity, endpoint) {
        Object.defineProperties(this, {
            'entity': {value: entity},
            'name': {value: endpoint},
            'label': {value: endpoint},
            'type': {value: 'ioperator'},
            'friendcode': {value: 'ghost_null'}
        });
    };
    GhostSourceEndpoint.prototype = new Wirecloud.wiring.SourceEndpoint();

    GhostSourceEndpoint.prototype.serialize = function serialize() {
        return {
            'type': this.type,
            'id': this.entity.id,
            'endpoint': this.name
        };
    };

    Wirecloud.wiring.GhostSourceEndpoint = GhostSourceEndpoint;

    var GhostTargetEndpoint = function GhostTargetEndpoint(entity, endpoint) {
        Object.defineProperties(this, {
            'entity': {value: entity},
            'name': {value: endpoint},
            'label': {value: endpoint},
            'type': {value: 'ioperator'},
            'friendcode': {value: 'ghost_null'}
        });
    };
    GhostTargetEndpoint.prototype = new Wirecloud.wiring.TargetEndpoint();

    GhostTargetEndpoint.prototype.propagate = function propagate(newValue, options) {
        // Do nothing
    };

    GhostTargetEndpoint.prototype.serialize = function serialize() {
        return {
            'type': this.type,
            'id': this.entity.id,
            'endpoint': this.name
        };
    };

    Wirecloud.wiring.GhostTargetEndpoint = GhostTargetEndpoint;

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
