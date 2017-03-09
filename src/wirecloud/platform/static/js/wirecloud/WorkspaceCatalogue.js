/*
 *     Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

    /*************************************************************************
     * Private methods
     *************************************************************************/

    var _addComponent = function _addComponent(meta) {
        if (!(meta.group_id in this.resourceVersions)) {
            this.resourceVersions[meta.group_id] = [];
        }

        this.resourceVersions[meta.group_id].push(meta);
        this.resources[meta.uri] = meta;

        delete this.missingComponents[meta.uri];
    };

    var loadResource = function loadResource(resource_data) {
        var resource;

        switch (resource_data.type) {
        case 'widget':
            resource = new Wirecloud.WidgetMeta(resource_data);
            break;
        case 'operator':
            resource = new Wirecloud.wiring.OperatorMeta(resource_data);
            break;
        case 'mashup':
            resource = resource_data;
            break;
        default:
            return;
        }

        _addComponent.call(this, resource);
    };

    var loadSuccessCallback = function loadSuccessCallback(response) {
        var resources, resource_id, msg;

        if (response.status != 200) {
            throw Error('Unexpected error code');
        }

        resources = JSON.parse(response.responseText);

        this.resources = {};
        this.resourceVersions = {};
        this.missingComponents = {};

        for (resource_id in resources) {
            try {
                loadResource.call(this, resources[resource_id]);
            } catch (e) {
                msg = utils.gettext("Error loading %(resource)s metadata");
                Wirecloud.GlobalLogManager.log(
                    utils.interpolate(msg, {resource: resource_id}),
                    {details: e}
                );
            }
        }
    };

    var createMissing = function createMissing(type, vendor, name, version) {
        var Klass = type === 'widget' ? Wirecloud.WidgetMeta : Wirecloud.wiring.OperatorMeta;
        return new Klass({
            vendor: vendor,
            name: name,
            version: version,
            type: type,
            missing: true,
            preferences: [],
            properties: [],
            requirements: [],
            wiring: {}
        });
    };

    /*************************************************************************
     * Public methods
     *************************************************************************/

    var WorkspaceCatalogue = function WorkspaceCatalogue(workspace_id) {
        Object.defineProperty(this, 'workspace_id', {value: workspace_id});
    };

    WorkspaceCatalogue.prototype.reload = function reload() {

        var url = Wirecloud.URLs.WORKSPACE_RESOURCE_COLLECTION.evaluate({workspace_id: this.workspace_id});
        return Wirecloud.io.makeRequest(url, {
            method: 'GET',
            requestHeaders: {'Accept': 'application/json'}
        }).then(loadSuccessCallback.bind(this))
            .toTask("Requesting workspace components");
    };

    WorkspaceCatalogue.prototype.remove = function remove(resource) {
        var index, new_meta;

        if (typeof resource === "string") {
            resource = this.getResourceId(resource);
        } else {
            resource = this.getResourceId(resource.uri);
        }

        if (resource != null) {
            delete this.resources[resource.uri];
            index = this.resourceVersions[resource.group_id].indexOf(resource);
            this.resourceVersions[resource.group_id].splice(index, 1);

            new_meta = createMissing(resource.type, resource.vendor, resource.name, resource.version.text);
            this.missingComponents[resource.uri] = new_meta;
            return new_meta;
        }
    };

    WorkspaceCatalogue.prototype.addComponent = function addComponent(meta) {
        _addComponent.call(this, meta);
    };

    WorkspaceCatalogue.prototype.restore = function restore(meta) {
        if (meta.uri in this.missingComponents) {
            _addComponent.call(this, meta);
        }
    };

    WorkspaceCatalogue.prototype.getOrCreateMissing = function getOrCreateMissing(id, type) {
        var component = this.getResourceId(id);

        if (component == null) {
            if (!(id in this.missingComponents)) {
                var id_parts = id.split('/');
                this.missingComponents[id] = createMissing(type, id_parts[0], id_parts[1], id_parts[2]);
            }
            component = this.missingComponents[id];
        }

        return component;
    };

    WorkspaceCatalogue.prototype.findResource = function findResource(type, id, newMissingResource) {
        var component = this.resources[id];

        if (component == null && !!newMissingResource) {
            if (!(id in this.missingComponents)) {
                var id_parts = id.split('/');
                this.missingComponents[id] = createMissing(type, id_parts[0], id_parts[1], id_parts[2]);
            }
            component = this.missingComponents[id];
        }

        return component;
    };

    WorkspaceCatalogue.prototype.getResourceId = function getResourceId(id) {
        return this.resources[id];
    };

    WorkspaceCatalogue.prototype.getResource = function getResource(vendor, name, version) {
        var id = [vendor, name, version].join('/');
        return this.getResourceId(id);
    };

    WorkspaceCatalogue.prototype.resourceExistsId = function resourceExistsId(id) {
        return this.getResourceId(id) != null;
    };

    WorkspaceCatalogue.prototype.resourceExists = function resourceExists(resource) {
        var id = [resource.vendor, resource.name, resource.version.text].join('/');
        return this.resourceExistsId(id);
    };

    Wirecloud.WorkspaceCatalogue = WorkspaceCatalogue;

})(Wirecloud.Utils);
