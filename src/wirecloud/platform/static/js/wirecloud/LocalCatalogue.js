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

/* globals Wirecloud */


(function (utils) {

    "use strict";

    /*************************************************************************
     * Private methods
     *************************************************************************/

    var uninstallOrDeleteSuccessCallback = function uninstallOrDeleteSuccessCallback(resource, next, result, monitor) {
        var i, resource_full_id, index;

        if (result.affectedVersions == null) {
            result.affectedVersions = [resource.version];
        }

        switch (resource.type) {
        case 'widget':
            monitor.update(100 / 3, utils.gettext('Unloading affected widgets'));
            result.affectedVersions.forEach(function (version) {
                var new_meta = Wirecloud.activeWorkspace.resources.remove(resource.group_id + '/' + version);
                if (new_meta != null) {
                    Wirecloud.activeWorkspace.widgets.forEach(function (widget) {
                        if (widget.meta.uri == new_meta.uri) {
                            widget.upgrade(new_meta);
                        }
                    });
                }
            });
            monitor.update(200 / 3, utils.gettext('Purging widget info'));
            break;
        case 'operator':
            monitor.update(100 / 3, utils.gettext('Unloading affected operators'));
            result.affectedVersions.forEach(function (version) {
                var new_meta = Wirecloud.activeWorkspace.resources.remove(resource.group_id + '/' + version);
                if (new_meta != null) {
                    Wirecloud.activeWorkspace.wiring.operators.forEach(function (operator) {
                        if (operator.meta.uri == new_meta.uri) {
                            operator.upgrade(new_meta);
                        }
                    });
                }
            });
            monitor.update(200 / 3, utils.gettext('Purging operator info'));
            break;
        case 'mashup':
            monitor.update(200 / 3, utils.gettext('Purging mashup info'));
        }

        for (i = 0; i < result.affectedVersions.length; i++) {
            try {
                resource_full_id = resource.group_id + '/' + result.affectedVersions[i];
                resource = this.resources[resource_full_id];
                delete this.resources[resource_full_id];
                delete this.resourcesByType[resource.type][resource_full_id];

                index = this.resourceVersions[resource.group_id].indexOf(resource);
                this.resourceVersions[resource.group_id].splice(index, 1);
            } catch (e) {}
        }

        monitor.finish();
        utils.callCallback(next);
    };

    var uninstallSuccessCallback = function uninstallSuccessCallback(resource, options, response) {
        var result = JSON.parse(response.responseText);
        uninstallOrDeleteSuccessCallback.call(this, resource, options.onSuccess, result, options.request_task);
    };

    var uninstallErrorCallback = function uninstallErrorCallback(options, response) {
        var msg = Wirecloud.GlobalLogManager.formatAndLog(utils.gettext("Error uninstalling resource: %(errorMsg)s."), response);

        if (typeof options.onFailure === 'function') {
            options.onFailure(msg);
        }
    };

    var loadSuccessCallback = function loadSuccessCallback(context, transport) {
        var resources, resource_id, msg;

        resources = JSON.parse(transport.responseText);

        this.resources = {};
        this.resourceVersions = {};
        this.resourcesByType = {};

        for (resource_id in resources) {
            try {
                this._includeResource.call(this, resources[resource_id]);
            } catch (e) {
                msg = utils.gettext("Error loading %(resource)s metadata");
                Wirecloud.GlobalLogManager.log(
                    utils.interpolate(msg, {resource: resource_id}),
                    {details: e}
                );
            }
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

            this._includeResource.call(this, resource_data);
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

        if (Wirecloud.contextManager.get('username') !== 'anonymous') {
            Wirecloud.io.makeRequest(Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION, {
                method: 'GET',
                requestHeaders: {'Accept': 'application/json'},
                onSuccess: loadSuccessCallback.bind(this, context),
                onFailure: loadFailureCallback.bind(this, context)
            });
        } else {
            loadSuccessCallback.call(this, context, {responseText: "{}"});
        }
    };

    LocalCatalogue.uninstallResource = function uninstallResource(resource, options) {
        var url, msg;

        options = utils.merge({
            allversions: false
        }, options);

        if (options.allversions) {
            url = Wirecloud.URLs.LOCAL_UNVERSIONED_RESOURCE_ENTRY.evaluate({
                vendor: resource.vendor,
                name: resource.name
            });
            msg = utils.interpolate(utils.gettext("Uninstalling all versions of %(title)s (%(group_id)s)"), resource);
        } else {
            url = Wirecloud.URLs.LOCAL_RESOURCE_ENTRY.evaluate({
                vendor: resource.vendor,
                name: resource.name,
                version: resource.version.text
            });
            msg = utils.interpolate(utils.gettext("Uninstalling %(title)s (%(uri)s)"), resource);
        }

        if (options.monitor == null) {
            options.monitor = Wirecloud.UserInterfaceManager.createTask(msg, 1);
            options.request_task = options.monitor.nextSubtask('Sending request to the server');
        } else {
            options.request_task = options.monitor.nextSubtask(msg);
        }

        // Send request to uninstall de widget
        Wirecloud.io.makeRequest(url + '?affected=true', {
            method: 'DELETE',
            requestHeaders: {'Accept': 'application/json'},
            onSuccess: uninstallSuccessCallback.bind(this, resource, options),
            onFailure: uninstallErrorCallback.bind(this, options),
            onComplete: options.onComplete
        });
    };

    LocalCatalogue.deleteResource = function deleteResource(resource, options) {
        if (options == null) {
            options = {};
        }

        options.onSuccess = uninstallOrDeleteSuccessCallback.bind(this, resource, options.onSuccess);
        Wirecloud.WirecloudCatalogue.prototype.deleteResource.call(this, resource, options);
    };

    LocalCatalogue.addPackagedResource = function addPackagedResource(data, options) {
        if (options == null) {
            options = {};
        }

        options.onSuccess = function (next, main_resource, extra_resources) {
            process_packaged_upload_response.call(this, next, [main_resource].concat(extra_resources));
        }.bind(this, options.onSuccess);

        Wirecloud.WirecloudCatalogue.prototype.addPackagedResource.call(this, data, options);
    };

    LocalCatalogue.addResourceFromURL = function addResourceFromURL(url, options) {
        if (typeof options != 'object') {
            options = {};
        }

        Wirecloud.io.makeRequest(Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION, {
            method: 'POST',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify({
                url: url,
                force_create: !!options.forceCreate,
                install_embedded_resources: true,
                market_endpoint: options.market_info
            }),
            onSuccess: function (response) {
                var response_data;

                response_data = JSON.parse(response.responseText);
                process_upload_response.call(this, [response_data.resource_details].concat(response_data.extra_resources));

                if (options.monitor) {
                    options.monitor.finish();
                }
                utils.callCallback(options.onSuccess);
            }.bind(this),
            onFailure: function (response) {
                var msg = Wirecloud.GlobalLogManager.formatAndLog(utils.gettext("Error adding resource from URL: %(errorMsg)s."), response);

                if (options.monitor) {
                    options.monitor.fail();
                }
                utils.callCallback(options.onFailure, msg);
            },
            onComplete: function () {
                utils.callCallback(options.onComplete);
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

    LocalCatalogue._includeResource = function _includeResource(resource_data) {
        var resource, resource_id, resource_full_id;

        resource_id = resource_data.vendor + '/' + resource_data.name;
        resource_full_id = resource_id + '/' + resource_data.version;

        switch (resource_data.type) {
        case 'widget':
            resource = new Wirecloud.WidgetMeta(resource_data);
            if (Wirecloud.activeWorkspace != null) {
                Wirecloud.activeWorkspace.widgets.forEach(function (widget) {
                    if (widget.missing && widget.meta.uri == resource.uri) {
                        widget.upgrade(resource);
                    }
                });
            }
            break;
        case 'operator':
            resource = new Wirecloud.wiring.OperatorMeta(resource_data);
            if (Wirecloud.activeWorkspace != null) {
                try {
                    Wirecloud.activeWorkspace.wiring.operators.forEach(function (operator) {
                        if (operator.missing && operator.meta.uri == resource.uri) {
                            operator.upgrade(resource);
                        }
                    });
                } catch (error) {}
            }
            break;
        case 'mashup':
            resource = new Wirecloud.MashableApplicationComponent(resource_data);
        }
        if (Wirecloud.activeWorkspace != null) {
            Wirecloud.activeWorkspace.resources.restore(resource);
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

    LocalCatalogue.hasAlternativeVersion = function hasAlternativeVersion(mac) {
        var versions = this.resourceVersions[mac.group_id];
        return versions != null && (versions.length > 1 || versions.length === 1 && !versions[0].is(mac));
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
        var id = [resource.vendor, resource.name, resource.version].join('/');
        return this.resourceExistsId(id);
    };

    Wirecloud.LocalCatalogue = LocalCatalogue;

})(Wirecloud.Utils);
