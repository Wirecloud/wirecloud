/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

    /**
     * GhostEndpoint
     */
    var GhostEndpoint = function GhostEndpoint(theEndpoint, entity, isSource) {
        var nameList, subdata, i;

        this.entity = entity;
        this.name = theEndpoint.endpoint;
        this.type = theEndpoint.type;
        this.friendcode = 'ghost_null';
    };

    /**
     * Serialize GhostEndpoint
     */
    GhostEndpoint.prototype.serialize = function serialize() {
        return {
            'type': this.type,
            'id': this.entity.id,
            'endpoint': this.name
        };
    };

    Wirecloud.wiring.GhostEndpoint = GhostEndpoint;

})();
