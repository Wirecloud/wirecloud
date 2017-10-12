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

    var unload_affected_components = function unload_affected_components(component, result) {
        var task_title;
        switch (component.type) {
        case 'widget':
            task_title = utils.gettext('Unloading affected widgets');
            break;
        case 'operator':
            task_title = utils.gettext('Unloading affected operators');
            break;
        case 'mashup':
            return Promise.resolve(result);
        }

        return new Wirecloud.Task(task_title, function (resolve, reject, update) {
            for (var workspaceid in Wirecloud.workspaceInstances) {
                var workspace = Wirecloud.workspaceInstances[workspaceid];
                if (!(workspace instanceof Wirecloud.Workspace)) {
                    continue;
                }
                result.affectedVersions.forEach((version) => {
                    var list;
                    var new_meta = workspace.resources.remove(component.group_id + '/' + version);
                    if (new_meta != null) {
                        if (component.type === "widget") {
                            list = workspace.widgets;
                        } else /* if component.type === "operator") */ {
                            list = workspace.wiring.operators;
                        }
                        list.forEach(function (component) {
                            if (component.meta.uri === new_meta.uri) {
                                component.upgrade(new_meta);
                            }
                        });
                    }
                });
            }
            resolve(result);
        });
    };

    var purge_component_info = function purge_component_info(component, result) {
        var task_title = utils.interpolate(
            utils.gettext("Purging %(componenttype)s info"),
            {
                componenttype: component.type
            }
        );

        return new Wirecloud.Task(task_title, function (resolve, reject) {
            result.affectedVersions.forEach(function (version) {
                var component_full_id, index;
                try {
                    component_full_id = component.group_id + '/' + version;
                    component = this.resources[component_full_id];
                    delete this.resources[component_full_id];

                    index = this.resourceVersions[component.group_id].indexOf(component);
                    this.resourceVersions[component.group_id].splice(index, 1);
                    if (this.resourceVersions[component.group_id].length === 0) {
                        delete this.resourceVersions[component.group_id];
                    }
                    this.dispatchEvent('uninstall', component);
                    this.dispatchEvent('change', 'uninstall', component);
                } catch (e) {}
            }, this);
            resolve(result);
        }.bind(this));
    };

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    var LocalCatalogue = new Wirecloud.WirecloudCatalogue({name: 'local', permissions: {'delete': false}});

    /**
     * Clears the component cache and init it with then
     */
    LocalCatalogue.reload = function reload() {
        var request;

        this.resources = {};
        this.resourceVersions = {};

        if (Wirecloud.contextManager.get('isanonymous') === false) {
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

    /**
     * Makes unavaliable a component for the logged user
     *
     * @param {Wirecloud.MashableApplicationComponent} component
     *
     * component to uninstall
     *
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `allversions`: uninstall all versions of the component
     *
     * @returns {Wirecloud.Task}
     */
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
            if (response.status !== 200) {
                return Promise.reject(new Error("Unexpected response from server"));
            }

            try {
                var result = JSON.parse(response.responseText);
                if (result.affectedVersions == null) {
                    result.affectedVersions = [resource.version];
                }
            } catch (e) {
                return Promise.reject(e);
            }
            return Promise.resolve(result);
        }).then(unload_affected_components.bind(this, resource))
        .then(purge_component_info.bind(this, resource))
        .toTask(msg);
    };

    /**
     * Removes this component from the server, making it unavaliable for all the users.
     *
     * @returns {Wirecloud.Task}
     */
    LocalCatalogue.deleteResource = function deleteResource(resource, options) {
        return Wirecloud.WirecloudCatalogue.prototype.deleteResource.call(this, resource, options)
            .then(unload_affected_components.bind(this, resource))
            .then(purge_component_info.bind(this, resource));
    };

    /**
     * Installs a component making it available for the logged user.
     *
     * @param {Object} options
     * - `install_embedded_resources` (boolean, default: false)
     *
     * @returns {Wirecloud.Task}
     */
    LocalCatalogue.addComponent = function addComponent(options) {
        var task = Wirecloud.WirecloudCatalogue.prototype.addComponent.call(this, options);
        task.then((response_data) => {
            var components;
            if ('resource_details' in response_data) {
                components = [response_data.resource_details].concat(response_data.extra_resources);
            } else {
                components = [response_data];
            }
            components.forEach((component) => {
                var id = [component.vendor, component.name, component.version].join('/');
                if (!this.resourceExistsId(id)) {
                    component = this._includeResource.call(this, component);
                    this.dispatchEvent('install', component);
                    this.dispatchEvent('change', 'install', component);
                }
            });
            return Promise.resolve(response_data);
        });
        return task;
    };

    LocalCatalogue._includeResource = function _includeResource(component_data) {
        var component, component_id, component_full_id;

        component_id = component_data.vendor + '/' + component_data.name;
        component_full_id = component_id + '/' + component_data.version;

        switch (component_data.type) {
        case 'widget':
            component = new Wirecloud.WidgetMeta(component_data);
            if (Wirecloud.activeWorkspace != null) {
                Wirecloud.activeWorkspace.widgets.forEach(function (widget) {
                    if (widget.missing && widget.meta.uri === component.uri) {
                        widget.upgrade(component);
                    }
                });
            }
            break;
        case 'operator':
            component = new Wirecloud.wiring.OperatorMeta(component_data);
            if (Wirecloud.activeWorkspace != null) {
                try {
                    Wirecloud.activeWorkspace.wiring.operators.forEach(function (operator) {
                        if (operator.missing && operator.meta.uri === component.uri) {
                            operator.upgrade(component);
                        }
                    });
                } catch (error) {}
            }
            break;
        case 'mashup':
            component = new Wirecloud.MashableApplicationComponent(component_data);
            break;
        default:
            var msg = utils.interpolate(utils.gettext("Invalid component type: %(type)s"), {
                type: component_data.type
            });
            throw new TypeError(msg);
        }

        if (Wirecloud.activeWorkspace != null) {
            Wirecloud.activeWorkspace.resources.restore(component);
        }

        if (!(component_id in this.resourceVersions)) {
            this.resourceVersions[component_id] = [];
        }

        this.resourceVersions[component_id].push(component);
        this.resources[component_full_id] = component;

        return component;
    };

    /**
     * Checks if there is other alternative versions for the given component.
     *
     * @param {Wirecloud.MashableApplicationComponent} component
     *    The component to search for an alternative versions
     *
     * @returns {Boolean}
     */
    LocalCatalogue.hasAlternativeVersion = function hasAlternativeVersion(component) {
        var versions = this.resourceVersions[component.group_id];
        return versions != null && (versions.length > 1 || versions.length === 1 && !versions[0].is(component));
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
