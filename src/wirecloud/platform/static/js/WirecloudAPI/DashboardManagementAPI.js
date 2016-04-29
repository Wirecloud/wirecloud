/*
 *     Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global MashupPlatform*/

(function () {

    "use strict";

    var platform, Wirecloud, resource, InputEndpoint, OutputEndpoint, resource_workspace, resource_element, counter;

    platform = window.parent;
    Wirecloud = platform.Wirecloud;
    resource = MashupPlatform.priv.resource;
    InputEndpoint = MashupPlatform.priv.InputEndpoint;
    OutputEndpoint = MashupPlatform.priv.OutputEndpoint;
    counter = 1;

    if ('widget' in MashupPlatform) {
        resource_workspace = resource.workspace;
        resource_element = resource_workspace.getIWidget(resource.id).content;
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
            'outputs': {value: outputs},
            'remove': {
                value: function close() {
                    real_widget.remove();
                }
            }
        });
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
            'outputs': {value: outputs},
            'remove': {
                value: function close() {
                    real_operator.remove();
                }
            }
        });
    };

    // Workspace facade
    var Workspace = function Workspace(workspace) {
        Object.defineProperties(this, {
            'owner': {value: workspace.owner},
            'name': {value: workspace.name},
            'url': {value: workspace.url}
        });
    };

    var addWidget = function addWidget(ref, options) {

        if (ref == null) {
            throw new TypeError('missing widget_ref parameter');
        }

        // default options
        options = Wirecloud.Utils.merge({
            title: null,
            refposition: null,
            permissions: null,
            preferences: {},
            properties: {},
            top: "0px",
            left: "0px",
            width: null, //auto
            height: null
        }, options);

        options.permissions = Wirecloud.Utils.merge({
                close: true,
                rename: false
        }, options.permissions);

        var widget_def = Wirecloud.LocalCatalogue.getResourceId(ref);
        if (widget_def == null || widget_def.type !== 'widget') {
            throw new TypeError('invalid widget ref');
        }
        var widget_title = options.title ? options.title : widget_def.title;
        var layout = Wirecloud.activeWorkspace.getActiveDragboard().freeLayout;

        if (options.refposition != null) {
            var current_position = Wirecloud.Utils.getRelativePosition(resource_element, resource.tab.wrapperElement);
            options.left = (current_position.x + options.refposition.left - layout.dragboardLeftMargin) + "px";
            options.top = (current_position.y + options.refposition.bottom - layout.dragboardTopMargin) + "px";
        }

        var widgetinfo = {
            id: resource.id + '/' + counter++,
            title: widget_title,
            volatile: true,
            permissions: options.permissions,
            properties: options.properties,
            preferences: options.preferences,
            top: options.top,
            left: options.left,
            width: options.width,
            height: options.height
        };
        var widget = new platform.IWidget(widget_def, layout, widgetinfo);
        Wirecloud.activeWorkspace.getActiveDragboard().addIWidget(widget);
        resource.addEventListener('unload', widget.remove.bind(widget));

        return new Widget(widget.internal_iwidget);
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
            volatile: true,
            permissions: options.permissions,
            properties: options.properties,
            preferences: options.preferences
        };
        var operator = resource_workspace.wiring._instantiate_operator(resource.id + '/' + counter++, operator_def, options);
        resource.addEventListener('unload', operator.destroy.bind(operator));
        operator.load();
        return (new Operator(operator));
    };

    var onCreateWorkspaceSuccess = function onCreateWorkspaceSuccess(workspace) {
        this(new Workspace(workspace));
    };

    var createWorkspace = function createWorkspace(options) {
        if (options != null && typeof options.onSuccess === 'function') {
            options.onSuccess = onCreateWorkspaceSuccess.bind(options.onSuccess);
        }

        Wirecloud.createWorkspace(options);
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
        createWorkspace: {value: createWorkspace}
    });

})();
