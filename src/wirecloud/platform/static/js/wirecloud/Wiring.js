/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, interpolate, Wirecloud*/

(function () {

    "use strict";

    var Wiring, findEntity, unload, addIWidget, removeIWidget,
        iwidget_added_listener, iwidget_removed_listener,
        iwidget_unload_listener, restore_connections, unload_operators;

    /*****************
     * Private methods
     *****************/
    findEntity = function findEntity(desc) {
        switch (desc.type) {
        case 'iwidget':
            return this.iwidgets[desc.id];
        case 'ioperator':
            return this.ioperators[desc.id];
        }
    };

    var findEndpoint = function findEndpoint(entity, desc, type) {
        if (entity instanceof Wirecloud.wiring.GhostEntity) {
            if (!(desc.endpoint in entity[type])) {
                if (type === 'outputs') {
                    entity[type][desc.endpoint] = new Wirecloud.wiring.GhostSourceEndpoint(entity, desc.endpoint);
                } else {
                    entity[type][desc.endpoint] = new Wirecloud.wiring.GhostTargetEndpoint(entity, desc.endpoint);
                }
            }
        }

        return entity[type][desc.endpoint];
    };

    restore_connections = function restore_connections(entity) {
        var i, connection, sourceEntity, sourceEndpoint, targetEntity,
            targetEndpoint, msg;

        for (i = 0; i < this.status.connections.length; i += 1) {
            connection = this.status.connections[i];
            sourceEntity = findEntity.call(this, connection.source);
            targetEntity = findEntity.call(this, connection.target);

            if (entity != null && sourceEntity != entity && targetEntity != entity) {
                // This connection has nothing to do with the especified entity, ignore it
                continue;
            }

            if (sourceEntity == null || targetEntity == null) {
                msg = gettext('The connection between %(source)s and %(target)s could not be established');
                msg = interpolate(msg, {
                    source: JSON.stringify(connection.source),
                    target: JSON.stringify(connection.target)
                }, true);
                this.logManager.log(msg);
                continue;
            }

            sourceEndpoint = findEndpoint(sourceEntity, connection.source, 'outputs');
            targetEndpoint = findEndpoint(targetEntity, connection.target, 'inputs');
            if (sourceEndpoint != null && targetEndpoint != null) {
                sourceEndpoint.connect(targetEndpoint);
            } else {
                msg = gettext('The connection between %(source)s and %(target)s could not be established');
                msg = interpolate(msg, {
                    source: JSON.stringify(connection.source),
                    target: JSON.stringify(connection.target)
                }, true);
                this.logManager.log(msg);
            }
        }
    };

    unload = function unload() {
        var widgets, key, i;

        if (this.status == null) {
            return;
        }

        this.events.unload.dispatch();

        widgets = this.workspace.getIWidgets();
        for (i = 0; i < widgets.length; i++) {
            this.iwidgets[widgets[i].id].fullDisconnect();
        }

        for (key in this.ioperators) {
            this.ioperators[key].fullDisconnect();
        }

        this.events.unloaded.dispatch();
        this.logManager.newCycle();

        this.status = null;
    };

    addIWidget = function addIWidget(iwidget) {

        if (iwidget.id in this.iwidgets) {
            var msg = gettext("Error adding iWidget into the wiring module of the workspace: Widget instance already exists.");
            this.logManager.log(msg);
            return;
        }

        iwidget.addEventListener('unload', this._iwidget_unload_listener);
        this.iwidgets[iwidget.id] = iwidget;
    };

    removeIWidget = function removeIWidget(iwidget) {
        var widgetEntry, i, connection;

        if (!(iwidget.id in this.iwidgets)) {
            var msg = gettext("Error: trying to remove an inexistant iWidget from the wiring module.");
            this.logManager.log(msg);
            return;
        }

        iwidget.fullDisconnect();

        if (this.status.views != null && this.status.views[0].iwidgets[iwidget.id]) {
            delete this.status.views[0].iwidgets[iwidget.id];
        }

        for (i = this.status.connections.length - 1; i >= 0 ; i -= 1) {
            connection = this.status.connections[i];

            if (connection.source.type === 'iwidget' && connection.source.id === iwidget.id) {
                this.status.connections.splice(i, 1);
                this.status.views[0].connections.splice(i, 1);
            } else if (connection.target.type === 'iwidget' && connection.target.id === iwidget.id) {
                this.status.connections.splice(i, 1);
                this.status.views[0].connections.splice(i, 1);
            }
        }

        iwidget.removeEventListener('unload', this._iwidget_unload_listener);
        delete this.iwidgets[iwidget.id];
    };

    iwidget_added_listener = function iwidget_added_listener(workspace, iwidget) {
        addIWidget.call(this, iwidget);
    };

    iwidget_removed_listener = function iwidget_removed_listener(workspace, iwidget) {
        removeIWidget.call(this, iwidget);
    };

    iwidget_unload_listener = function iwidget_unload_listener(iWidget) {
        var key, entry = this.iwidgets[iWidget.id];

        for (key in entry.inputs) {
            entry.inputs[key].callback = null;
        }
    };

    unload_operators = function unload_operators(resource_details, version) {
        var id, operator, msg, ghost_operator, i, endpoint, key, uri;

        uri = resource_details.vendor + '/' + resource_details.name + '/' + version;

        for (id in this.ioperators) {
            if (this.ioperators[id].meta.uri === uri) {
                operator = this.ioperators[id];
                this.ioperators[id].destroy();

                ghost_operator = new Wirecloud.wiring.GhostOperator(id, this.status.operators[id]);
                this.ioperators[id] = ghost_operator;

                // Preserve preferences
                ghost_operator.preferences = {};
                for (key in operator.preferences) {
                    ghost_operator.preferences[key] = {
                        "readOnly": operator.preferences[key].readOnly,
                        "hidden": operator.preferences[key].hidden,
                        "value": operator.preferences[key].value
                    };
                }

                // GhostEndpoints
                for (i = 0; i < operator.meta.inputs.length; i++) {
                    endpoint = new Wirecloud.wiring.GhostTargetEndpoint(ghost_operator, operator.meta.inputs[i].name);
                    ghost_operator.inputs[endpoint.name] = endpoint;
                }
                for (i = 0; i < operator.meta.outputs.length; i++) {
                    endpoint = new Wirecloud.wiring.GhostSourceEndpoint(ghost_operator, operator.meta.outputs[i].name);
                    ghost_operator.outputs[endpoint.name] = endpoint;
                }

                msg = gettext('operator instance %(ioperator_id)s was unloaded as %(operator)s operator has been uninstalled');
                msg = interpolate(msg, {ioperator_id: id, operator: operator.meta.uri}, true);
                this.logManager.log(msg);
            }
        }
    };

    /*************
     * Constructor
     *************/

    Wiring = function Wiring(workspace) {
        this.status = null;
        this.workspace = workspace;
        this.iwidgets = {};
        this.ioperators = {};
        Object.defineProperty(this, 'logManager', {value: new Wirecloud.wiring.LogManager(this)});

        this._iwidget_unload_listener = iwidget_unload_listener.bind(this);
        this._iwidget_added_listener = iwidget_added_listener.bind(this);
        this._iwidget_removed_listener = iwidget_removed_listener.bind(this);

        this.workspace.addEventListener('iwidgetadded', this._iwidget_added_listener);
        this.workspace.addEventListener('iwidgetremoved', this._iwidget_removed_listener);

        StyledElements.ObjectWithEvents.call(this, ['load', 'loaded', 'unload', 'unloaded']);
    };
    Wiring.prototype = new StyledElements.ObjectWithEvents();

    Wiring.prototype.load = function load(status) {
        var operators, id, operator_info, old_operators, msg;

        if (status == null || status === '') {
            unload.call(this);
            return;
        }

        if (typeof status === 'string') {
            status = JSON.parse(status);
        }

        unload.call(this);

        this.events.load.dispatch();

        if (!('views' in status) || !Array.isArray(status.views)) {
            status.views = [];
        }

        if (status.views.length === 0) {
            status.views.push({
                label: 'default',
                iwidgets: {},
                operators: {},
                multiconnectors: {},
                connections: []
            });
        }

        if (this.workspace.owned) {
            operators = Wirecloud.wiring.OperatorFactory.getAvailableOperators();
        } else {
            operators = this.workspace.resources.getAvailableResourcesByType('operator');
        }
        old_operators = this.ioperators;
        this.ioperators = {};
        for (id in status.operators) {
            operator_info = status.operators[id];
            if (id in old_operators) {
                this.ioperators[id] = old_operators[id];
                delete old_operators[id];

                if (this.ioperators[id] instanceof Wirecloud.wiring.GhostOperator) {
                    msg = gettext('%(operator)s operator is not available for this account');
                    msg = interpolate(msg, {operator: operator_info.name}, true);
                    this.logManager.log(msg);
                }
            } else {
                if (operator_info.name in operators) {
                    try {
                        this.ioperators[id] = operators[operator_info.name].instantiate(id, operator_info, this);
                    } catch (e) {
                        msg = gettext('Error instantiating the %(operator)s operator');
                        msg = interpolate(msg, {operator: operator_info.name}, true);
                        this.logManager.log(msg);
                        this.ioperators[id] = new Wirecloud.wiring.GhostOperator(id, operator_info);
                        if (id in status.views[0].operators) {
                            this.ioperators[id].fillFromViewInfo(status.views[0].operators[id]);
                        }
                    }
                } else {
                    msg = gettext('%(operator)s operator is not available for this account');
                    msg = interpolate(msg, {operator: operator_info.name}, true);
                    this.logManager.log(msg);
                    this.ioperators[id] = new Wirecloud.wiring.GhostOperator(id, operator_info);
                    if (id in status.views[0].operators) {
                        this.ioperators[id].fillFromViewInfo(status.views[0].operators[id]);
                    }
                }
            }
        }
        for (id in old_operators) {
            old_operators[id].destroy();
        }

        this.status = status;
        restore_connections.call(this);

        this.events.loaded.dispatch();
    };

    Wiring.prototype.save = function save() {
        Wirecloud.io.makeRequest(Wirecloud.URLs.WIRING_ENTRY.evaluate({workspace_id: this.workspace.id}), {
            method: 'PUT',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            postBody: JSON.stringify(this.status)
        });
    };

    Wiring.prototype.destroy = function destroy() {
        var key, i;

        for (key in this.iwidgets) {
            this.iwidgets[key].fullDisconnect();
        }
        this.iwidgets = null;

        for (key in this.ioperators) {
            this.ioperators[key].destroy();
        }
        this.ioperators = null;


        this.workspace.removeEventListener('iwidgetadded', this._iwidget_added_listener);
        this.workspace.removeEventListener('iwidgetremoved', this._iwidget_removed_listener);

        this.workspace = null;
    };

    Wiring.prototype._notifyOperatorInstall = function _notifyOperatorInstall(operator) {
        var id, operator_info, ioperator, msg;

        for (id in this.status.operators) {
            operator_info = this.status.operators[id];
            if (operator_info.name === operator.uri) {
                this.ioperators[id].fullDisconnect();
                try {
                    ioperator = operator.instantiate(id, operator_info, this);
                    this.ioperators[id] = ioperator;
                    // TODO
                    // This code remove operator not available error counts
                    // Search a better way
                    this.logManager.errorCount -= 1;
                } catch (e) {
                    msg = gettext('Error instantiating the %(operator)s operator');
                    msg = interpolate(msg, {operator: operator_info.name}, true);
                    this.logManager.log(msg);
                }

                // Restore ioperators connections
                restore_connections.call(this, ioperator);
            }
        }
    };

    Wiring.prototype._notifyOperatorUninstall = function _notifyOperatorUninstall(resource_details, versions) {
        var i;

        for (i = 0; i < versions.length; i++) {
            unload_operators.call(this, resource_details, versions[i]);
        }
    };

    Wirecloud.Wiring = Wiring;
    Wirecloud.wiring = {}; // TODO

})();
