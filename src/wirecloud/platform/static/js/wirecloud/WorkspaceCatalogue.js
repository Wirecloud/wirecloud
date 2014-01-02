/*
 *     Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var includeResource = function includeResource(resource_data) {
        var resource, resource_id, resource_full_id;

        resource_id = resource_data.vendor + '/' + resource_data.name;
        resource_full_id = resource_id + '/' + resource_data.version;

        switch (resource_data.type) {
        case 'widget':
            resource = new Wirecloud.Widget(resource_data);
            break;
        case 'operator':
            resource = new Wirecloud.wiring.OperatorMeta(resource_data);
            break;
        default:
            resource = resource_data;
        }

        if (!(resource_id in this.resourceVersions)) {
            this.resourceVersions[resource_id] = [];
        }

        this.resourceVersions[resource_id].push(resource);
        this.resources[resource_full_id] = resource;

        if (!(resource_data.type in this.resourcesByType)) {
            this.resourcesByType[resource_data.type] = {};
        }
        this.resourcesByType[resource_data.type][resource_full_id] = resource;
    };

    var loadSuccessCallback = function loadFailureCallback(context, transport) {
        var resources, resource_id;

        resources = JSON.parse(transport.responseText);

        this.resources = {};
        this.resourceVersions = {};
        this.resourcesByType = {};

        for (resource_id in resources) {
            includeResource.call(this, resources[resource_id]);
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
