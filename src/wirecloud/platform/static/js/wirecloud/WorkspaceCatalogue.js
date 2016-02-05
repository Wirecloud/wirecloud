/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global Wirecloud*/

(function () {

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

        if (!(meta.type in this.resourcesByType)) {
            this.resourcesByType[meta.type] = {};
        }
        this.resourcesByType[meta.type][meta.uri] = meta;

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

    var loadSuccessCallback = function loadFailureCallback(context, transport) {
        var resources, resource_id;

        resources = JSON.parse(transport.responseText);

        this.resources = {};
        this.resourceVersions = {};
        this.resourcesByType = {};
        this.missingComponents = {};

        for (resource_id in resources) {
            loadResource.call(this, resources[resource_id]);
        }

        if (typeof context.onSuccess === 'function') {
            context.onSuccess(this);
        }
    };

    var loadFailureCallback = function loadFailureCallback(context, transport) {
        if (typeof context.onError === 'function') {
            context.onError(this);
        }
    };

    var createMissing = function createMissing(type, vendor, name, version) {
        var klass = type === 'widget' ? Wirecloud.WidgetMeta : Wirecloud.wiring.OperatorMeta;
        return new klass({
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

    var WorkspaceCatalogue = function WorkspaceCatalogue(workspace_id, options) {
        Object.defineProperty(this, 'workspace_id', {value: workspace_id});
        this.reload(options);
    };

    WorkspaceCatalogue.prototype.reload = function reload(options) {

        if (typeof options !== 'object') {
            options = {};
        }

        var context = {
            'onSuccess': options.onSuccess,
            'onError': options.onError
        };

        var url = Wirecloud.URLs.WORKSPACE_RESOURCE_COLLECTION.evaluate({workspace_id: this.workspace_id});
        Wirecloud.io.makeRequest(url, {
            method: 'GET',
            requestHeaders: {'Accept': 'application/json'},
            onSuccess: loadSuccessCallback.bind(this, context),
            onFailure: loadFailureCallback.bind(this, context)
        });
    };

    WorkspaceCatalogue.prototype.getAvailableResourcesByType = function getAvailableResourcesByType(type) {
        if (type in this.resourcesByType) {
            return this.resourcesByType[type];
        } else {
            return {};
        }
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
            delete this.resourcesByType[resource.type][resource.uri];
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
})();
