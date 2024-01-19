/*
 *     Copyright (c) 2015-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2023 Future Internet Consulting and Development Solutions S.L.
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


(function () {

    "use strict";

    const _DashboardManagementAPI = function _DashboardManagementAPI(parent, platform, _) {
        let resource_workspace, resource_element, counter;

        const Wirecloud = platform.Wirecloud;
        const resource = parent.MashupPlatform.priv.resource;
        const workspaceview = parent.MashupPlatform.priv.workspaceview;
        const InputEndpoint = parent.MashupPlatform.priv.InputEndpoint;
        const OutputEndpoint = parent.MashupPlatform.priv.OutputEndpoint;
        counter = 1;
        const privates = new WeakMap();

        if ('widget' in parent.MashupPlatform) {
            resource_workspace = resource.tab.workspace;
            resource_element = resource.wrapperElement;
        } else {
            resource_workspace = resource.wiring.workspace;
        }


        // Widget facade
        const Widget = function Widget(real_widget) {
            const inputs = {};
            for (const endpoint_name in real_widget.inputs) {
                inputs[endpoint_name] = new InputEndpoint(real_widget.inputs[endpoint_name], false);
            }

            const outputs = {};
            for (const endpoint_name in real_widget.outputs) {
                outputs[endpoint_name] = new OutputEndpoint(real_widget.outputs[endpoint_name], false);
            }

            Object.defineProperties(this, {
                'inputs': {value: inputs},
                'outputs': {value: outputs}
            });

            privates.set(this, real_widget);
        };

        Widget.prototype.addEventListener = function addEventListener() {
            const real_widget = privates.get(this);
            real_widget.addEventListener.apply(real_widget, arguments);
        };

        Widget.prototype.remove = function remove() {
            privates.get(this).remove();
        };

        // Operator facade
        const Operator = function Operator(real_operator) {
            const inputs = {};
            for (const endpoint_name in real_operator.inputs) {
                inputs[endpoint_name] = new InputEndpoint(real_operator.inputs[endpoint_name], false);
            }

            const outputs = {};
            for (const endpoint_name in real_operator.outputs) {
                outputs[endpoint_name] = new OutputEndpoint(real_operator.outputs[endpoint_name], false);
            }

            Object.defineProperties(this, {
                'inputs': {value: inputs},
                'outputs': {value: outputs}
            });

            privates.set(this, real_operator);
        };

        Operator.prototype.addEventListener = function addEventListener() {
            const real_operator = privates.get(this);
            real_operator.addEventListener.apply(real_operator, arguments);
        };

        Operator.prototype.remove = function remove() {
            privates.get(this).remove();
        };

        // Workspace facade
        const Workspace = function Workspace(workspace) {
            Object.defineProperties(this, {
                'id': {value: workspace.id},
                'owner': {value: workspace.owner},
                'name': {value: workspace.name},
                'url': {value: workspace.url}
            });
        };

        /**
         * Opens this workspace
         */
        Workspace.prototype.open = function open(options) {
            return openWorkspace(this, options);
        };

        /**
         * Deletes/Removes this workspace
         */
        Workspace.prototype.remove = function remove(options) {
            // We call this method remove because delete is a reserved word
            return removeWorkspace(this, options);
        };

        const openWorkspace = function openWorkspace(workspace, options) {
            if (options == null) {
                options = {};
            }
            // force history to push
            options.history = "push";

            const task = Wirecloud.changeActiveWorkspace(workspace, options);
            // support deprecated onSuccess and onFailure callbacks
            task.then(options.onSuccess, options.onFailure);
            return task;
        };

        const removeWorkspace = function removeWorkspace(workspace, options) {
            if (options == null) {
                options = {};
            }
            const dialog = new Wirecloud.ui.AlertWindowMenu(
                Wirecloud.Utils.interpolate(Wirecloud.Utils.gettext('Do you really want to remove the "%(name)s" workspace?'), {
                    name: workspace.owner + '/' + workspace.name
                })
            );
            dialog.setHandler(() => {
                Wirecloud.removeWorkspace(workspace).then(options.onSuccess, options.onFailure);
            }).show();
        };

        const addWidget = function addWidget(ref, options) {

            if (ref == null) {
                throw new TypeError('missing widget_ref parameter');
            }

            const widget_def = Wirecloud.LocalCatalogue.getResourceId(ref);
            if (widget_def == null || widget_def.type !== 'widget') {
                throw new TypeError('invalid widget ref');
            }

            options = options != null ? options : {};
            options.permissions = {
                viewer: Wirecloud.Utils.merge({
                    close: true,
                    rename: false,
                    move: true
                }, options.permissions)
            };
            options.permissions.editor = options.permissions.viewer;

            const tab = workspaceview.activeTab;

            options = Wirecloud.Utils.merge(options, {
                id: resource.id + '/' + counter++,
                commit: false,
                layout: 1,
                volatile: true,
                refiframe: resource_element
            });

            const widget = tab.createWidget(widget_def, options);
            resource.addEventListener('unload', widget.remove.bind(widget));

            return new Widget(widget.model);
        };

        const addOperator = function addOperator(ref, options) {
            const operator_def = Wirecloud.LocalCatalogue.getResourceId(ref);
            if (operator_def == null || operator_def.type !== 'operator') {
                throw new TypeError('invalid operator ref');
            }

            // default options
            options = Wirecloud.Utils.merge({
                permissions: null,
                preferences: {},
                properties: {}
            }, options);

            options.permissions = Wirecloud.Utils.merge({
                close: true
            }, options.permissions);

            // Filter operator options
            options = {
                id: resource.id + '/' + counter++,
                volatile: true,
                permissions: options.permissions,
                properties: options.properties,
                preferences: options.preferences
            };
            const operator = resource_workspace.wiring.createOperator(operator_def, options);
            resource.addEventListener('unload', operator.destroy.bind(operator));
            return (new Operator(operator));
        };

        const createWorkspace = function createWorkspace(options) {
            Wirecloud.createWorkspace(options).then((workspace) => {
                if (options != null && typeof options.onSuccess === 'function') {
                    try {
                        options.onSuccess(new Workspace(workspace));
                    } catch (e) {}
                }
            }, (error) => {
                if (options != null && typeof options.onFailure === 'function') {
                    try {
                        options.onFailure("" + error);
                    } catch (e) {}
                }
            });
        };

        if ('widget' in parent.MashupPlatform) {
            Object.defineProperties(parent.MashupPlatform.widget, {
                createInputEndpoint: {value: function createInputEndpoint(callback) {
                    const endpoint = new Wirecloud.wiring.WidgetTargetEndpoint(resource);
                    endpoint.callback = callback;
                    return new InputEndpoint(endpoint, true);
                }},
                createOutputEndpoint: {value: function createOutputEndpoint() {
                    return new OutputEndpoint(new Wirecloud.wiring.WidgetSourceEndpoint(resource), true);
                }}
            });
        } else {
            Object.defineProperties(parent.MashupPlatform.operator, {
                createInputEndpoint: {value: function createInputEndpoint(callback) {
                    const endpoint = new Wirecloud.wiring.OperatorTargetEndpoint(resource);
                    endpoint.callback = callback;
                    return new InputEndpoint(endpoint, true);
                }},
                createOutputEndpoint: {value: function createOutputEndpoint() {
                    return new OutputEndpoint(new Wirecloud.wiring.OperatorSourceEndpoint(resource), true);
                }}
            });
        }

        Object.defineProperties(parent.MashupPlatform.mashup, {
            addWidget: {value: addWidget},
            addOperator: {value: addOperator},
            createWorkspace: {value: createWorkspace},
            openWorkspace: {value: openWorkspace},
            removeWorkspace: {value: removeWorkspace},
        });
    };

    window._privs._DashboardManagementAPI = _DashboardManagementAPI;

    // Detects if this is inside an iframe (will use version v1, which defines the MashupPlatform in the window)
    if (window.parent !== window) {
        window._privs._DashboardManagementAPI(window, window.parent);
    }

})();
