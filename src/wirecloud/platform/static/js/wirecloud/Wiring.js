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

/* global StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    ns.wiring = {}; // TODO: move to another file

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class Wiring.
     * @extends {ObjectWithEvents}
     *
     * @constructor
     * @param {Workspace} workspace
     *      [TODO: description]
     */
    ns.Wiring = utils.defineClass({

        constructor: function Wiring(workspace) {
            this.superClass(['load', 'loaded', 'unload', 'unloaded']);
            this.widgets = {};

            Object.defineProperties(this, {
                // TODO: remove this properties.
                ioperators: {get: function get() {return this.operators;}},
                iwidgets: {get: function get() {return this.widgets;}},
                // TODO: remove this properties.
                connections: {
                    get: function get() {return this.status.connections;}
                },
                logManager: {value: new ns.wiring.LogManager(this)},
                operators: {
                    get: function get() {return this.status.operators;}
                },
                status: {value: ns.Wiring.normalize(), writable: true},
                workspace: {value: workspace}
            });

            this.autoOperatorId = 1;

            this._widget_onadded = widget_onadded.bind(this);
            this._widget_onremoved = widget_onremoved.bind(this);

            this.workspace.addEventListener('iwidgetadded', this._widget_onadded);
            this.workspace.addEventListener('iwidgetremoved', this._widget_onremoved);
        },

        inherit: se.ObjectWithEvents,

        statics: {

            normalize: function normalize(status) {
                var new_status = utils.updateObject({
                    version: '2.0',
                    connections: [],
                    operators: {},
                    visualdescription: {
                        behaviours: [],
                        components: {
                            operator: {},
                            widget: {}
                        },
                        connections: []
                    }
                }, status);

                normalize_object(new_status.visualdescription.components.operator, normalize_visual_component);
                normalize_object(new_status.visualdescription.components.widget, normalize_visual_component);

                return new_status;
            }

        },

        members: {

            _notifyOperatorInstall: function _notifyOperatorInstall(operatorMeta) {
                var id, current_operator, operator;

                for (id in this.status.operators) {
                    current_operator = this.status.operators[id];

                    if (current_operator.missing && current_operator.meta.uri === operatorMeta.uri) {
                        current_operator.meta = operatorMeta;
                    }
                }
            },

            _instantiate_operator: function _instantiate_operator(id, operatorMeta, businessInfo) {
                var operator = operatorMeta.instantiate(id, this, businessInfo);

                operator
                    .on('upgraded', component_onupgraded.bind(this))
                    .on('unload', component_onunload)
                    .on('remove', operator_onremove.bind(this))
                    .load();

                this.status.operators[operator.id] = operator;

                return operator;
            },

            /**
             * Create a new instance of the given componentMeta.
             *
             * @param {(Wirecloud.wiring.OperatorMeta|Wirecloud.WidgetMeta)} componentMeta A valid component meta.
             * @param {?Function} [next] A callback that receives the component created.
             * @return {Wirecloud.Wiring} The instance on which this method is called.
             */
            createComponent: function createComponent(componentMeta, options) {
                var newComponent;

                if (componentMeta.type === 'operator') {
                    newComponent = componentMeta.instantiate(this.autoOperatorId++, this);

                    utils.callCallback(options.onSuccess, newComponent);
                } else { // componentMeta.type === 'widget'
                    componentMeta.instantiate(options);
                }

                return this;
            },

            createConnection: function createConnection(readonly, source, target) {
                return new ns.wiring.Connection(readonly, source, target, this);
            },

            destroy: function destroy() {
                var id;

                for (id in this.widgets) {
                    this.widgets[id].fullDisconnect();
                }

                for (id in this.status.operators) {
                    this.status.operators[id].destroy();
                }

                this.workspace.removeEventListener('iwidgetadded', this._widget_onadded);
                this.workspace.removeEventListener('iwidgetremoved', this._widget_onremoved);

                return this;
            },

            load: function load(status) {
                var connection, i, id, old_operators, operator;

                wiring_onunload.call(this);
                old_operators = this.status.operators;

                this.trigger('load');

                this.autoOperatorId = 1;

                for (id in status.operators) {
                    operator = status.operators[id];

                    if (parseInt(id, 10) >= this.autoOperatorId) {
                        this.autoOperatorId = parseInt(id, 10) + 1;
                    }

                    if (id in old_operators) {
                        delete old_operators[id];
                    }

                    if (operator.missing) {
                        this.logManager.log(operator.reason);
                    }

                    operator
                        .on('upgraded', component_onupgraded.bind(this))
                        .on('unload', component_onunload)
                        .on('remove', operator_onremove.bind(this))
                        .load();
                }

                for (id in old_operators) {
                    operator = old_operators[id];
                    if (operator.volatile) {
                        status.operators[id] = operator;
                    } else {
                        operator.remove();
                    }
                }

                for (i = this.status.connections.length - 1; i >= 0; i--) {
                    connection = this.status.connections[i];

                    if (connection.volatile) {
                        status.connections.push(connection);
                    }
                }

                this.status = status;
                this.status.connections.forEach(function (connection) {
                    connection.establish();
                });

                return this.trigger('loaded');
            },

            save: function save() {

                Wirecloud.io.makeRequest(Wirecloud.URLs.WIRING_ENTRY.evaluate({workspace_id: this.workspace.id}), {
                    method: 'PUT',
                    contentType: 'application/json',
                    requestHeaders: {Accept: 'application/json'},
                    postBody: JSON.stringify(this.toJSON())
                });

                return this;
            },

            toJSON: function toJSON() {
                var connection, i, id, operator, status;

                status = ns.Wiring.normalize();

                for (id in this.status.operators) {
                    operator = this.status.operators[id];

                    if (!operator.volatile) {
                        status.operators[id] = operator;
                    }
                }

                for (i = this.status.connections.length - 1; i >= 0; i--) {
                    connection = this.status.connections[i];

                    if (!connection.volatile) {
                        status.connections.push(connection);
                    }
                }

                status.visualdescription = this.status.visualdescription;

                return status;
            },

            unmarshall: function unmarshall(status) {
                var connection_info, errorCount, i, id, operator_info,
                    operator_visual_info, meta, source, target;

                status = ns.Wiring.normalize(status);

                // Convert operator into instances
                for (id in status.operators) {
                    operator_info = status.operators[id];

                    meta = this.workspace.resources.getOrCreateMissing(operator_info.name, 'operator');
                    status.operators[id] = meta.instantiate(id, this, operator_info);

                    if (meta.missing && id in status.visualdescription.components.operator) {
                        operator_visual_info = status.visualdescription.components.operator[id];

                        operator_visual_info.endpoints.source.forEach(function (name) {
                            addMissingEndpoint(this, 'outputs', name);
                        }, status.operators[id]);

                        operator_visual_info.endpoints.target.forEach(function (name) {
                            addMissingEndpoint(this, 'inputs', name);
                        }, status.operators[id]);
                    }
                }

                // Convert connections into instances
                for (i = status.connections.length - 1; i >= 0; i--) {
                    connection_info = utils.updateObject(ns.wiring.Connection.JSON_TEMPLATE, status.connections[i]);
                    errorCount = 0;

                    try {
                        source = getEndpoint.call(this, status.operators, this.widgets, 'outputs', connection_info.source);
                    } catch (e) {
                        this.logManager.log(e.toString());
                        status.connections.splice(i, 1);
                        errorCount++;
                    }

                    try {
                        target = getEndpoint.call(this, status.operators, this.widgets, 'inputs', connection_info.target);
                    } catch (e) {
                        this.logManager.log(e.toString());
                        errorCount++;
                    }

                    if (!errorCount) {
                        status.connections[i] = new ns.wiring.Connection(connection_info.readonly, source, target, this);
                    } else {
                        status.connections.splice(i, 1);
                    }
                }

                return status;
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var normalize_visual_component = function normalize_visual_component(component) {
        return utils.updateObject({
            name: "",
            position: {
                x: 0,
                y: 0
            },
            collapsed: false,
            endpoints: {
                source: [],
                target: []
            }
        }, component);
    };

    var normalize_object = function normalize_object(object, normalizer) {
        for (var key in object) {
            object[key] = normalizer(object[key]);
        }
    };

    var addMissingEndpoint = function addMissingEndpoint(component, endpointGroup, name) {
        var endpoint, info;

        info = {
            name: name,
            friendcode: ''
        };

        switch (endpointGroup) {
        case 'inputs':
            endpoint = new ns.wiring.GhostTargetEndpoint(component, name);
            component.inputs[name] = endpoint;
            if (component.meta.missing && !(name in component.meta.inputs)) {
                component.meta.inputs[name] = info;
                component.meta.inputList.push(info);
            }
            break;
        case 'outputs':
            endpoint = new ns.wiring.GhostSourceEndpoint(component, name);
            component.outputs[name] = endpoint;
            if (component.meta.missing && !(name in component.meta.outputs)) {
                component.meta.outputs[name] = info;
                component.meta.outputList.push(info);
            }
            break;
        }

        return endpoint;
    };

    var getEndpointOrCreateMissing = function getEndpointOrCreateMissing(component, type, name) {
        if (name in component[type]) {
            return component[type][name];
        } else {
            return addMissingEndpoint(component, type, name);
        }
    };

    var getEndpoint = function getEndpoint(operators, widgets, endpointGroup, endpointInfo) {
        var component;

        switch (endpointInfo.type) {
        case 'widget':
            component = widgets[endpointInfo.id];
            break;
        case 'operator':
            component = operators[endpointInfo.id];
            break;
        }

        if (component == null) {
            throw new Error(utils.interpolate(utils.gettext("The %(type)s (%(id)s) does not exist."), {
                type: endpointInfo.type,
                id: endpointInfo.id
            }));
        }

        return getEndpointOrCreateMissing(component, endpointGroup, endpointInfo.endpoint);
    };

    var reconnect = function reconnect(component) {
        this.status.connections.forEach(function (connection) {
            if (connection.source.component.is(component)) {
                connection.updateEndpoint(getEndpointOrCreateMissing(component, 'outputs', connection.source.name));
            } else if (connection.target.component.is(component)) {
                connection.updateEndpoint(getEndpointOrCreateMissing(component, 'inputs', connection.target.name));
            }
        });
        this.logManager.newCycle();
    };

    var disconnect = function disconnect() {
        var i;

        for (i = this.status.connections.length - 1; i >= 0; i--) {
            this.status.connections[i].detach();
        }

        return this;
    };

    var wiring_onunload = function wiring_onunload() {

        this.trigger('unload');

        disconnect.call(this);
        this.logManager.newCycle();

        this.trigger('unloaded');
    };

    var getEndpointInfo = function getEndpointInfo(endpointName) {
        var splitText = endpointName.split("/");

        return {type: splitText[0], id: splitText[1], endpoint: splitText[2]};
    };

    var connection_hasComponent = function connection_hasComponent(connectionInfo, component) {
        var source = getEndpointInfo(connectionInfo.sourcename),
            target = getEndpointInfo(connectionInfo.targetname);

        if (source.type === component.meta.type && source.id === component.id) {
            return true;
        }

        if (target.type === component.meta.type && target.id === component.id) {
            return true;
        }

        return false;
    };

    var removeComponent = function removeComponent(component) {
        var connection, i;

        component.fullDisconnect();

        for (i = this.status.connections.length - 1; i >= 0; i--) {
            connection = this.status.connections[i];

            if (connection.source.component === component || connection.target.component === component) {
                this.status.connections.splice(i, 1);
            }
        }

        removeComponentInfo(component, this.status.visualdescription);

        for (i = this.status.visualdescription.behaviours.length - 1; i >= 0; i--) {
            removeComponentInfo(component, this.status.visualdescription.behaviours[i]);
        }

        return this;
    };

    var removeComponentInfo = function removeComponentInfo(component, status) {
        var connection, i;

        for (i = status.connections.length - 1; i >= 0; i--) {
            if (connection_hasComponent(status.connections[i], component)) {
                status.connections.splice(i, 1);
            }
        }

        delete status.components[component.meta.type][component.id];
    };

    var operator_onremove = function operator_onremove(operator) {
        delete this.status.operators[operator.id];
    };

    var widget_onadded = function widget_onadded(workspace, widget) {

        if (widget.id in this.widgets) {
            this.logManager.log(utils.interpolate(utils.gettext("The widget (%(title)s) already exist."), widget));
        } else {
            widget
                .on('upgraded', component_onupgraded.bind(this))
                .on('unload', component_onunload);
            this.widgets[widget.id] = widget;
        }
    };

    var component_onupgraded = function component_onupgraded(component, new_meta) {
        component.fullDisconnect();
        reconnect.call(this, component);
    };

    var widget_onremoved = function widget_onremoved(workspace, widget) {

        if (widget.id in this.widgets) {
            removeComponent.call(this, widget);
            widget.off('unload', component_onunload);
            delete this.widgets[widget.id];
        } else {
            this.logManager.log(utils.interpolate(utils.gettext("The widget (%(title)s) to remove does not exist."), widget));
        }
    };

    var component_onunload = function component_onunload(component) {
        var name;

        for (name in component.inputs) {
            component.inputs[name].callback = null;
        }
    };

})(Wirecloud, StyledElements, StyledElements.Utils);
