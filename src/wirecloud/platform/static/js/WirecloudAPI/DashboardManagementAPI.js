/*
 *     Copyright (c) 2015-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals MashupPlatform, WeakMap */


(function () {

    "use strict";

    var platform, Wirecloud, resource, InputEndpoint, OutputEndpoint, resource_workspace, resource_element, counter, workspaceview, privates;

    platform = window.parent;
    Wirecloud = platform.Wirecloud;
    resource = MashupPlatform.priv.resource;
    workspaceview = MashupPlatform.priv.workspaceview;
    InputEndpoint = MashupPlatform.priv.InputEndpoint;
    OutputEndpoint = MashupPlatform.priv.OutputEndpoint;
    counter = 1;
    privates = new WeakMap();

    if ('widget' in MashupPlatform) {
        resource_workspace = resource.tab.workspace;
        resource_element = resource.wrapperElement;
    } else {
        resource_workspace = resource.wiring.workspace;
    }


    // Widget facade
    var Widget = function Widget(real_widget) {
        var endpoint_name;

        var inputs = {};
        for (endpoint_name in real_widget.inputs) {
            inputs[endpoint_name] = new InputEndpoint(real_widget.inputs[endpoint_name], false);
        }

        var outputs = {};
        for (endpoint_name in real_widget.outputs) {
            outputs[endpoint_name] = new OutputEndpoint(real_widget.outputs[endpoint_name], false);
        }

        Object.defineProperties(this, {
            'inputs': {value: inputs},
            'outputs': {value: outputs}
        });

        privates.set(this, real_widget);
    };

    Widget.prototype.addEventListener = function addEventListener() {
        var real_widget = privates.get(this);
        real_widget.addEventListener.apply(real_widget, arguments);
    };

    Widget.prototype.remove = function remove() {
        privates.get(this).remove();
    };

    // Operator facade
    var Operator = function Operator(real_operator) {
        var endpoint_name;

        var inputs = {};
        for (endpoint_name in real_operator.inputs) {
            inputs[endpoint_name] = new InputEndpoint(real_operator.inputs[endpoint_name], false);
        }

        var outputs = {};
        for (endpoint_name in real_operator.outputs) {
            outputs[endpoint_name] = new OutputEndpoint(real_operator.outputs[endpoint_name], false);
        }

        Object.defineProperties(this, {
            'inputs': {value: inputs},
            'outputs': {value: outputs}
        });

        privates.set(this, real_operator);
    };

    Operator.prototype.addEventListener = function addEventListener() {
        var real_operator = privates.get(this);
        real_operator.addEventListener.apply(real_operator, arguments);
    };

    Operator.prototype.remove = function remove() {
        privates.get(this).remove();
    };

    // Workspace facade
    var Workspace = function Workspace(workspace) {
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

    var openWorkspace = function openWorkspace(workspace, options) {
        if (options == null) {
            options = {};
        }
        // force history to push
        options.history = "push";

        var task = Wirecloud.changeActiveWorkspace(workspace, options);
        // support deprecated onSuccess and onFailure callbacks
        task.then(options.onSuccess, options.onFailure);
        return task;
    };

    var removeWorkspace = function removeWorkspace(workspace, options) {
        if (options == null) {
            options = {};
        }
        var dialog = new Wirecloud.ui.AlertWindowMenu();

        dialog.setMsg(Wirecloud.Utils.interpolate(Wirecloud.Utils.gettext('Do you really want to remove the "%(name)s" workspace?'), {
            name: workspace.owner + '/' + workspace.name
        }));
        dialog.setHandler(function () {
            Wirecloud.removeWorkspace(workspace).then(options.onSuccess, options.onFailure);
        }.bind(this));
        dialog.show();
    };

    var addWidget = function addWidget(ref, options) {

        if (ref == null) {
            throw new TypeError('missing widget_ref parameter');
        }

        var widget_def = Wirecloud.LocalCatalogue.getResourceId(ref);
        if (widget_def == null || widget_def.type !== 'widget') {
            throw new TypeError('invalid widget ref');
        }

        // default options
        options = Wirecloud.Utils.merge({
            top: "0px",
            left: "0px",
        }, options);

        options.permissions = Wirecloud.Utils.merge({
            close: true,
            rename: false
        }, options.permissions);

        var tab = workspaceview.activeTab;
        var layout = tab.dragboard.freeLayout;

        if (options.refposition != null) {
            var current_position = Wirecloud.Utils.getRelativePosition(resource_element, tab.wrapperElement);
            options.left = (current_position.x + options.refposition.left - layout.dragboardLeftMargin) + "px";
            options.top = (current_position.y + options.refposition.bottom - layout.dragboardTopMargin) + "px";
        }

        options = Wirecloud.Utils.merge(options, {
            id: resource.id + '/' + counter++,
            commit: false,
            layout: 1,
            volatile: true
        });

        var widget = tab.createWidget(widget_def, options);
        resource.addEventListener('unload', widget.remove.bind(widget));

        return new Widget(widget.model);
    };

    var addOperator = function addOperator(ref, options) {
        var operator_def = Wirecloud.LocalCatalogue.getResourceId(ref);
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
        var operator = resource_workspace.wiring.createOperator(operator_def, options);
        resource.addEventListener('unload', operator.destroy.bind(operator));
        return (new Operator(operator));
    };

    var createWorkspace = function createWorkspace(options) {
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

    if ('widget' in MashupPlatform) {
        Object.defineProperties(MashupPlatform.widget, {
            createInputEndpoint: {value: function createInputEndpoint(callback) {
                var endpoint = new Wirecloud.wiring.WidgetTargetEndpoint(resource);
                endpoint.callback = callback;
                return new InputEndpoint(endpoint, true);
            }},
            createOutputEndpoint: {value: function createOutputEndpoint() {
                return new OutputEndpoint(new Wirecloud.wiring.WidgetSourceEndpoint(resource), true);
            }}
        });
    } else {
        Object.defineProperties(MashupPlatform.operator, {
            createInputEndpoint: {value: function createInputEndpoint(callback) {
                var endpoint = new Wirecloud.wiring.OperatorTargetEndpoint(resource);
                endpoint.callback = callback;
                return new InputEndpoint(endpoint, true);
            }},
            createOutputEndpoint: {value: function createOutputEndpoint() {
                return new OutputEndpoint(new Wirecloud.wiring.OperatorSourceEndpoint(resource), true);
            }}
        });
    }

    Object.defineProperties(MashupPlatform.mashup, {
        addWidget: {value: addWidget},
        addOperator: {value: addOperator},
        createWorkspace: {value: createWorkspace},
        openWorkspace: {value: openWorkspace},
        removeWorkspace: {value: removeWorkspace},
    });

})();
