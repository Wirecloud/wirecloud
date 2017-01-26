/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var unload_affected_components = function unload_affected_components(resource, result) {
        var task_title;
        switch (resource.type) {
        case 'widget':
            task_title = utils.gettext('Unloading affected operators');
            break;
        case 'operator':
            task_title = utils.gettext('Unloading affected operators');
            break;
        case 'mashup':
            return Promise.resolve(result);
        }

        return new Wirecloud.Task(task_title, function (resolve, reject, update) {
            switch (resource.type) {
            case 'widget':
                result.affectedVersions.forEach(function (version) {
                    var new_meta = Wirecloud.activeWorkspace.resources.remove(resource.group_id + '/' + version);
                    if (new_meta != null) {
                        Wirecloud.activeWorkspace.widgets.forEach(function (widget) {
                            if (widget.meta.uri === new_meta.uri) {
                                widget.upgrade(new_meta);
                            }
                        });
                    }
                });
                break;
            case 'operator':
                result.affectedVersions.forEach(function (version) {
                    var new_meta = Wirecloud.activeWorkspace.resources.remove(resource.group_id + '/' + version);
                    if (new_meta != null) {
                        Wirecloud.activeWorkspace.wiring.operators.forEach(function (operator) {
                            if (operator.meta.uri === new_meta.uri) {
                                operator.upgrade(new_meta);
                            }
                        });
                    }
                });
                break;
            }
            resolve(result);
        });
    };

    var purge_component_info = function purge_component_info(resource, result) {
        var task_title = utils.interpolate(
            utils.gettext("Purging %(componenttype)s info"),
            {
                componenttype: resource.type
            }
        );

        return new Wirecloud.Task(task_title, function (resolve, reject) {
            result.affectedVersions.forEach(function (version) {
                var resource_full_id, index;
                try {
                    resource_full_id = resource.group_id + '/' + version;
                    resource = this.resources[resource_full_id];
                    delete this.resources[resource_full_id];
                    delete this.resourcesByType[resource.type][resource_full_id];

                    index = this.resourceVersions[resource.group_id].indexOf(resource);
                    this.resourceVersions[resource.group_id].splice(index, 1);
                } catch (e) {}
            }, this);
            resolve(result);
        }.bind(this));
    };

    var process_upload_response = function process_upload_response(response_data) {
        return new Promise(function (resolve, reject) {
            var components = [response_data.resource_details].concat(response_data.extra_resources);
            components.forEach(function (component) {
                var id = [component.vendor, component.name, component.version].join('/');
                if (!this.resourceExistsId(id)) {
                    this._includeResource.call(this, component);
                }
            }, this);
        }.bind(this));
    };

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    var LocalCatalogue = new Wirecloud.WirecloudCatalogue({name: 'local', permissions: {'delete': false}});

    LocalCatalogue.reload = function reload() {
        var request;

        if (Wirecloud.contextManager.get('username') !== 'anonymous') {
            request = Wirecloud.io.makeRequest(Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION, {
                method: 'GET',
                requestHeaders: {'Accept': 'application/json'}
            });
        } else {
            request = new Wirecloud.Task("", (resolve) => {
                resolve({responseText: "[]"});
            });
        }

        return request.then((response) => {
            var resources, resource_id, msg;

            resources = JSON.parse(response.responseText);

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
            return Promise.resolve();
        });
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

        // Send request to uninstall de widget
        return Wirecloud.io.makeRequest(url + '?affected=true', {
            method: 'DELETE',
            requestHeaders: {'Accept': 'application/json'}
        }).then(function (response) {
            return new Promise(function (resolve, reject) {
                var result;
                if (response.status !== 200) {
                    reject(new Error("Unexpected response from server"));
                }

                try {
                    result = JSON.parse(response.responseText);
                    if (result.affectedVersions == null) {
                        result.affectedVersions = [resource.version];
                    }
                } catch (e) {
                    reject(e);
                    return;
                }
                resolve(result);
            });
        }).then(unload_affected_components.bind(this, resource))
        .then(purge_component_info.bind(this, resource))
        .toTask(msg);
    };

    LocalCatalogue.deleteResource = function deleteResource(resource, options) {
        return Wirecloud.WirecloudCatalogue.prototype.deleteResource.call(this, resource, options)
            .then(unload_affected_components.bind(this, resource))
            .then(purge_component_info.bind(this, resource));
    };

    LocalCatalogue.addPackagedResource = function addPackagedResource(data, options) {
        var task = Wirecloud.WirecloudCatalogue.prototype.addPackagedResource.call(this, data, options);
        task.then(process_upload_response.bind(this));
        return task;
    };

    LocalCatalogue.addResourceFromURL = function addResourceFromURL(url, options) {
        if (typeof options !== 'object') {
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
                process_upload_response.call(this, response_data);
            }.bind(this),
            onFailure: function (response) {
                var msg = Wirecloud.GlobalLogManager.formatAndLog(utils.gettext("Error adding resource from URL: %(errorMsg)s."), response);
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
                    if (widget.missing && widget.meta.uri === resource.uri) {
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
                        if (operator.missing && operator.meta.uri === resource.uri) {
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
