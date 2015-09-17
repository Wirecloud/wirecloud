/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

            this._widget_onunload = widget_onunload.bind(this);
            this._widget_onadded = widget_onadded.bind(this);
            this._widget_onremoved = widget_onremoved.bind(this);

            this.workspace.addEventListener('iwidgetadded', this._widget_onadded);
            this.workspace.addEventListener('iwidgetremoved', this._widget_onremoved);
        },

        inherit: se.ObjectWithEvents,

        statics: {

            normalize: function normalize(status) {
                return utils.updateObject({
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
            }

        },

        members: {

            _notifyOperatorInstall: function _notifyOperatorInstall(operatorMeta) {
                var id, missing_operator, operator;

                for (id in this.status.operators) {
                    missing_operator = this.status.operators[id];

                    if (missing_operator.missing && missing_operator.meta.uri === operatorMeta.uri) {
                        missing_operator.fullDisconnect();

                        // create a new operator
                        operator = operatorMeta.instantiate(id, this, missing_operator.toJSON());
                        operator.load();
                        this.status.operators[id] = operator;

                        // TODO: This code remove operator not available error counts (Search a better way)
                        this.logManager.errorCount -= 1;

                        // restore operator connections
                        reconnect.call(this, operator);
                    }
                }
            },

            _notifyOperatorUninstall: function _notifyOperatorUninstall(resourceDetails, versions) {
                var i;

                for (i = 0; i < versions.length; i++) {
                    operatormeta_onunload.call(this, resourceDetails.vendor, resourceDetails.name, versions[i]);
                }
            },

            _operator_onload: function _operator_onload(id, operatorMeta, businessInfo) {
                var operator = operatorMeta.instantiate(id, this, businessInfo);

                operator
                    .on('remove', operator_onremove.bind(this))
                    .load();

                this.status.operators[operator.id] = operator;

                return operator;
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
                    this.status.operators[id].remove();
                }

                this.workspace.removeEventListener('iwidgetadded', this._widget_onadded);
                this.workspace.removeEventListener('iwidgetremoved', this._widget_onremoved);

                return this;
            },

            load: function load(status) {
                var id, old_operators, operator;

                wiring_onunload.call(this);
                old_operators = this.status.operators;

                this.trigger('load');

                for (id in status.operators) {
                    operator = status.operators[id];

                    if (id in old_operators) {
                        delete old_operators[id];
                    }

                    if (operator instanceof ns.wiring.MissingOperator) {
                        this.logManager.log(operator.reason);
                    }

                    operator.load();
                }

                for (id in old_operators) {
                    old_operators[id].remove();
                }

                this.status = status;
                reconnect.call(this);

                return this.trigger('loaded');
            },

            save: function save() {

                Wirecloud.io.makeRequest(Wirecloud.URLs.WIRING_ENTRY.evaluate({workspace_id: this.workspace.id}), {
                    method: 'PUT',
                    contentType: 'application/json',
                    requestHeaders: {Accept: 'application/json'},
                    postBody: JSON.stringify(this.status)
                });

                return this;
            },

            unmarshall: function unmarshall(status) {
                var connection_info, errorCount, i, id, operator_info, operators, source, target;

                status = ns.Wiring.normalize(status);

                if (this.workspace.owned) {
                    operators = Wirecloud.wiring.OperatorFactory.getAvailableOperators();
                } else {
                    operators = this.workspace.resources.getAvailableResourcesByType('operator');
                }

                // Convert operator into instances
                for (id in status.operators) {
                    operator_info = status.operators[id];

                    if (operator_info.name in operators) {
                        try {
                            status.operators[id] = operators[operator_info.name].instantiate(id, this, operator_info);
                        } catch (e) {
                            status.operators[id] = new ns.wiring.MissingOperator(id, this, operator_info, utils.gettext("The operator (%(id)s) of (%(uri)s) could not be created."));
                            if (id in status.visualdescription.components.operator) {
                                status.operators[id].loadVisualInfo(status.visualdescription.components.operator[id]);
                            }
                        }
                    } else {
                        status.operators[id] = new ns.wiring.MissingOperator(id, this, operator_info, utils.gettext("The operator (%(id)s) of (%(uri)s) does not exist."));
                        if (id in status.visualdescription.components.operator) {
                            status.operators[id].loadVisualInfo(status.visualdescription.components.operator[id]);
                        }
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

    function getEndpoint(operators, widgets, endpointGroup, endpointInfo) {
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

        if (component instanceof ns.wiring.MissingComponent) {
            if (!(endpointInfo.endpoint in component[endpointGroup])) {
                component.addMissingEndpoint(endpointGroup, endpointInfo.endpoint);
            }
        }

        return component[endpointGroup][endpointInfo.endpoint];
    }

    function reconnect(component) {

        this.status.connections.forEach(function (connection) {
            connection.refreshEndpoint(component);
            connection.establish();
        });

        return this;
    }

    function disconnect() {
        var i;

        for (i = this.status.connections.length - 1; i >= 0; i--) {
            this.status.connections[i].detach();
        }

        return this;
    }

    function wiring_onunload() {

        this.trigger('unload');

        disconnect.call(this);
        this.logManager.newCycle();

        this.trigger('unloaded');
    }

    function operatormeta_onunload(vendor, name, version) {
        var id, missing_operator, operator, uri;

        uri = vendor + '/' + name + '/' + version;

        for (id in this.status.operators) {
            if (this.status.operators[id].meta.uri === uri) {
                operator = this.status.operators[id];
                operator.remove();

                missing_operator = new ns.wiring.MissingOperator(id, this, operator.toJSON(), utils.gettext("The operator (%(id)s) use a recently uninstalled '%(uri)s'."));
                this.status.operators[id] = missing_operator;

                operator.meta.outputList.forEach(function (endpoint) {
                    missing_operator.addMissingEndpoint('outputs', endpoint.name);
                });
                operator.meta.inputList.forEach(function (endpoint) {
                    missing_operator.addMissingEndpoint('inputs', endpoint.name);
                });
            }
        }
    }

    function getEndpointInfo(endpointName) {
        var splitText = endpointName.split("/");

        return {type: splitText[0], id: splitText[1], endpoint: splitText[2]};
    }

    function connection_hasComponent(connectionInfo, component) {
        var source = getEndpointInfo(connectionInfo.sourcename),
            target = getEndpointInfo(connectionInfo.targetname);

        if (source.type === component.meta.type && source.id === component.id) {
            return true;
        }

        if (target.type === component.meta.type && target.id === component.id) {
            return true;
        }

        return false;
    }

    function removeComponent(component) {
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
    }

    function removeComponentInfo(component, status) {
        var connection, i;

        for (i = status.connections.length - 1; i >= 0; i--) {
            if (connection_hasComponent(status.connections[i], component)) {
                status.connections.splice(i, 1);
            }
        }

        delete status.components[component.meta.type][component.id];
    }

    function operator_onremove(operator) {
        delete this.status.operators[operator.id];
    }

    function widget_onadded(workspace, widget) {

        if (widget.id in this.widgets) {
            this.logManager.log(utils.interpolate(utils.gettext("The widget (%(title)s) already exist."), widget));
        } else {
            widget.on('unload', this._widget_onunload);
            this.widgets[widget.id] = widget;
        }
    }

    function widget_onremoved(workspace, widget) {

        if (widget.id in this.widgets) {
            removeComponent.call(this, widget);
            widget.off('unload', this._widget_onunload);
            delete this.widgets[widget.id];
        } else {
            this.logManager.log(utils.interpolate(utils.gettext("The widget (%(title)s) to remove does not exist."), widget));
        }
    }

    function widget_onunload(widget) {
        var name;

        for (name in widget.inputs) {
            widget.inputs[name].callback = null;
        }
    }

})(Wirecloud, StyledElements, StyledElements.Utils);
