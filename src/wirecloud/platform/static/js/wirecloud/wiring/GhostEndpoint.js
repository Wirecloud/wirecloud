/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var GhostEntity = function GhostEntity(id, info) {
        if (arguments.length === 0) {
            return;
        }

        if (info.preferences == null) {
            info.preferences = {};
        }

        Object.defineProperties(this, {
            'id':    {value: id},
            'meta':  {value: {
                    uri: info.name,
                    preferenceList: []
                }
            },
            'name':  {value: info.name},
            'title': {value: info.name},
            'preferences': {value: info.preferences, writable: true}
        });
        this.inputs = {};
        this.outputs = {};
    };

    GhostEntity.prototype.fillFromViewInfo = function fillFromViewInfo(data) {
        var i, endpoint;

        if (!('endPointsInOuts' in data)) {
            return;
        }

        if ('sources' in data.endPointsInOuts) {
            for (i = 0; i < data.endPointsInOuts.sources.length; i++) {
                endpoint = new Wirecloud.wiring.GhostSourceEndpoint(this, data.endPointsInOuts.sources[i]);
                this.outputs[endpoint.name] = endpoint;
            }
        }

        if ('targets' in data.endPointsInOuts) {
            for (i = 0; i < data.endPointsInOuts.targets.length; i++) {
                endpoint = new Wirecloud.wiring.GhostTargetEndpoint(this, data.endPointsInOuts.targets[i]);
                this.inputs[endpoint.name] = endpoint;
            }
        }
    };

    GhostEntity.prototype.destroy = function destroy() {};

    GhostEntity.prototype.fullDisconnect = function fullDisconnect() {
        var key, connectables;

        connectables = this.inputs;
        for (key in connectables) {
            connectables[key].fullDisconnect();
        }

        connectables = this.outputs;
        for (key in connectables) {
            connectables[key].fullDisconnect();
        }
    };

    Wirecloud.wiring.GhostEntity = GhostEntity;

    var GhostOperator = function GhostOperator(id, info) {
        GhostEntity.call(this, id, info);
    };
    GhostOperator.prototype = new GhostEntity();

    Wirecloud.wiring.GhostOperator = GhostOperator;

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

})();
