/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

/*global gettext, interpolate, LayoutManagerFactory, LogManagerFactory, OpManagerFactory, Wirecloud*/

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

    var uninstallOrDeleteSuccessCallback = function uninstallOrDeleteSuccessCallback(transport) {
        var layoutManager, result, opManager, i, widgetId;

        switch (this.resource.type) {
        case 'widget':
            layoutManager = LayoutManagerFactory.getInstance();
            result = JSON.parse(transport.responseText);

            layoutManager.logSubTask(gettext('Removing affected iWidgets'));
            opManager = OpManagerFactory.getInstance();
            for (i = 0; i < result.removedIWidgets.length; i += 1) {
                if (opManager.activeWorkspace.getIWidget(result.removedIWidgets[i]) != null) {
                    opManager.removeInstance(result.removedIWidgets[i], true);
                }
            }

            layoutManager.logSubTask(gettext('Purging widget info'));
            break;
        case 'operator':
            layoutManager = LayoutManagerFactory.getInstance();
            layoutManager.logSubTask(gettext('Uninstantiating affected operators'));
            opManager = OpManagerFactory.getInstance();
            opManager.activeWorkspace.wiring._notifyOperatorUninstall(this.resource);
            layoutManager.logSubTask(gettext('Purging operator info'));
            break;
        }

        try {
            delete this.catalogue.resources[this.resource.getURI()];
            delete this.catalogue.resourcesByType[this.resource.type][this.resource.getURI()];
        } catch (e) {}

        if (typeof this.onSuccess === 'function') {
            this.onSuccess();
        }
    };

    var uninstallErrorCallback = function uninstallErrorCallback(transport, e) {
        var msg, logManager;

        logManager = LogManagerFactory.getInstance();
        msg = logManager.formatError(gettext("Error uninstalling resource: %(errorMsg)s."), transport, e);

        logManager.log(msg);

        if (typeof this.onError === 'function') {
            this.onError(msg);
        }
    };

    var deleteErrorCallback = function deleteErrorCallback(transport, e) {
        var msg, logManager;

        logManager = LogManagerFactory.getInstance();
        msg = logManager.formatError(gettext("Error deleting resource: %(errorMsg)s."), transport, e);

        logManager.log(msg);

        if (typeof this.onError === 'function') {
            this.onError(msg);
        }
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
            context.onSuccess();
        }
    };

    var loadFailureCallback = function loadFailureCallback(context, transport) {
        if (typeof context.onError === 'function') {
            context.onError();
        }
    };

    var process_upload_response = function process_upload_response(response_data) {
        var i, id, resource_data;

        if (!Array.isArray(response_data)) {
            response_data = [response_data];
        }

        for (i = 0; i < response_data.length; i += 1) {
            resource_data = response_data[i];
            id = [resource_data.vendor, resource_data.name, resource_data.version].join('/');
            if (this.resourceExistsId(id)) {
                continue;
            }

            includeResource.call(this, resource_data);
        }
    };

    var process_packaged_upload_response = function process_packaged_upload_response(next, response_data) {
        process_upload_response.call(this, response_data);

        if (typeof next === 'function') {
            try {
                next();
            } catch (e) {}
        }
    };

    /*************************************************************************
     * Public methods
     *************************************************************************/

    var LocalCatalogue = new Wirecloud.WirecloudCatalogue({name: 'local', permissions: {'delete': false}});

    LocalCatalogue.reload = function reload(options) {

        if (typeof options !== 'object') {
            options = {};
        }

        var context = {
            'onSuccess': options.onSuccess,
            'onError': options.onError
        };

        Wirecloud.io.makeRequest(Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION, {
            method: 'GET',
            onSuccess: loadSuccessCallback.bind(this, context),
            onFailure: loadFailureCallback.bind(this, context)
        });
    };

    LocalCatalogue.uninstallResource = function uninstallResource(resource, options) {
        var url, context;

        url = Wirecloud.URLs.LOCAL_RESOURCE_ENTRY.evaluate({
            vendor: resource.vendor,
            name: resource.name,
            version: resource.version.text
        });

        context = {
            catalogue: this,
            resource: resource,
            onSuccess: options.onSuccess,
            onError: options.onFailure
        };

        // Send request to uninstall de widget
        Wirecloud.io.makeRequest(url + '?affected=true', {
            method: 'DELETE',
            onSuccess: uninstallOrDeleteSuccessCallback.bind(context),
            onFailure: uninstallErrorCallback.bind(context),
            onException: uninstallErrorCallback.bind(context),
            onComplete: options.onComplete
        });
    };

    LocalCatalogue.deleteResource = function deleteResource(resource, onSuccess, onError) {
        var url, context;

        url = this.RESOURCE_ENTRY.evaluate({
            vendor: resource.vendor,
            name: resource.name,
            version: resource.version.text
        });

        context = {
            catalogue: this,
            resource: resource,
            onSuccess: onSuccess,
            onError: onError
        };

        // Send request to delete de widget
        Wirecloud.io.makeRequest(url, {
            method: 'DELETE',
            onSuccess: uninstallOrDeleteSuccessCallback.bind(context),
            onFailure: deleteErrorCallback.bind(context),
            onException: deleteErrorCallback.bind(context)
        });
    };

    LocalCatalogue.addPackagedResource = function addPackagedResource(data, options) {
        if (options == null) {
            options = {};
        }

        options.onSuccess = process_packaged_upload_response.bind(this, options.onSuccess);

        Wirecloud.WirecloudCatalogue.prototype.addPackagedResource.call(this, data, options);
    };

    LocalCatalogue.addResourceFromURL = function addResourceFromURL(url, options) {
        if (typeof options != 'object') {
            options = {};
        }

        Wirecloud.io.makeRequest(Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION, {
            method: 'POST',
            contentType: 'application/json',
            postBody: JSON.stringify({
                template_uri: url,
                packaged: !!options.packaged,
                force_create: !!options.forceCreate,
                market_endpoint: options.market_info
            }),
            onSuccess: function (transport) {
                var i, id, response_data, resource_data;

                response_data = JSON.parse(transport.responseText);
                process_upload_response.call(this, response_data);

                if (typeof options.onSuccess === 'function') {
                    options.onSuccess();
                }
            }.bind(this),
            onFailure: function (transport) {
                var msg = LogManagerFactory.getInstance().formatError(gettext("Error adding resource from URL: %(errorMsg)s."), transport);
                LogManagerFactory.getInstance().log(msg);

                if (typeof options.onFailure === 'function') {
                    options.onFailure(msg);
                }
            },
            onComplete: function () {
                if (typeof options.onComplete === 'function') {
                    options.onComplete();
                }
            }
        });
    };

    LocalCatalogue.getAvailableResourcesByType = function getAvailableResourcesByType(type) {
        if (type in this.resourcesByType) {
            return this.resourcesByType[type];
        } else {
            return {};
        }
    };

    LocalCatalogue.getResourceId = function getResourceId(id) {
        return this.resources[id];
    };

    LocalCatalogue.getResource = function getResource(vendor, name, version) {
        var id = [vendor, name, version].join('/');
        return this.getResourceId(id);
    };

    LocalCatalogue.resourceExistsId = function resourceExistsId(id) {
        return this.getResourceId(id) != null;
    };

    LocalCatalogue.resourceExists = function resourceExists(resource) {
        var id = [resource.vendor, resource.name, resource.version.text].join('/');
        return this.resourceExistsId(id);
    };

    Wirecloud.LocalCatalogue = LocalCatalogue;
})();
