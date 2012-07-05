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

/*global gettext, IGadget, LogManagerFactory, wEvent, wSlot, Wirecloud*/

(function () {

    "use strict";

    var Wiring, findConnectable, unload, addIWidget, removeIWidget;

    /*****************
     * Private methods
     *****************/
    findConnectable = function findConnectable(desc) {
        var entry;

        switch (desc.type) {
        case 'iwidget':
            entry = this.connectablesByWidget[desc.id];
            if (desc.endpoint in entry.events) {
                return entry.events[desc.endpoint];
            } else {
                return entry.slots[desc.endpoint];
            }
            break;
        case 'ioperator':
            entry = this.ioperators[desc.id];
            if (desc.endpoint in entry.inputs) {
                return entry.inputs[desc.endpoint];
            } else {
                return entry.outputs[desc.endpoint];
            }
            break;
        }
    };

    unload = function unload() {
        var widgets, key, i, j, connectables;

        widgets = this.workspace.getIGadgets();
        for (i = 0; i < widgets.length; i++) {
            connectables = this.connectablesByWidget[widgets[i].getId()].connectables;
            for (j = 0; j < connectables.length; j++) {
                connectables[j].fullDisconnect();
            }
        }

        for (key in this.ioperators) {
            this.ioperators[key].fullDisconnect();
        }
    };

    addIWidget = function addIWidget(iwidget) {
        var varManager, iWidgetId, widgetEntry, i, variableDef,
            connectables, variable, connectable;

        iWidgetId = iwidget.getId();
        if (iWidgetId in this.connectablesByWidget) {
            var msg = gettext("Error adding iWidget into the wiring module of the workspace: Widget instance already exists.");
            LogManagerFactory.getInstance().log(msg);
            return;
        }

        varManager = this.workspace.getVarManager();
        connectables  = iwidget.getGadget().getTemplate().getConnectables();

        widgetEntry = {
            events: {},
            slots: {},
            connectables: []
        };

        // IWidget variables
        for (i = 0; i < connectables.events.length; i += 1) {
            variableDef = connectables.events[i];
            variable = varManager.getVariableByName(iWidgetId, variableDef.name);
            connectable = new wEvent(variable, variableDef.type, variableDef.friend_code, variableDef.connectable_id);
            widgetEntry.events[connectable._name] = connectable;
            widgetEntry.connectables.push(connectable);
        }

        for (i = 0; i < connectables.slots.length; i += 1) {
            variableDef = connectables.slots[i];
            variable = varManager.getVariableByName(iWidgetId, variableDef.name);
            connectable = new wSlot(variable, variableDef.type, variableDef.friend_code, variableDef.connectable_id);
            widgetEntry.slots[connectable._name] = connectable;
            widgetEntry.connectables.push(connectable);
        }

        iwidget.addEventListener('unload', this._iwidget_unload_listener);
        this.connectablesByWidget[iWidgetId] = widgetEntry;
    };

    removeIWidget = function removeIWidget(iwidget) {
        var widgetEntry, i, connection;

        if (!(iwidget.getId() in this.connectablesByWidget)) {
            var msg = gettext("Error: trying to remove an inexistant iWidget from the wiring module.");
            LogManagerFactory.getInstance().log(msg);
            return;
        }

        widgetEntry = this.connectablesByWidget[iwidget.getId()];
        for (i = 0; i < widgetEntry.connectables.length; i += 1) {
            widgetEntry.connectables[i].destroy();
        }

        for (i = this.status.connections.length - 1; i >= 0 ; i -= 1) {
            connection = this.status.connections[i];

            if (connection.source.type === 'iwidget' && connection.source.id === iwidget.getId()) {
                this.status.connections.splice(i, 1);
            } else if (connection.target.type === 'iwidget' && connection.target.id === iwidget.getId()) {
                this.status.connections.splice(i, 1);
            }
        }

        iwidget.removeEventListener('unload', this._iwidget_unload_listener);
        delete this.connectablesByWidget[iwidget.getId()];
    };

    /*************
     * Constructor
     *************/

    Wiring = function Wiring(workspace) {
        this.workspace = workspace;
        this.connectablesByWidget = {};
        this.ioperators = {};

        this._iwidget_unload_listener = this._iwidget_unload_listener.bind(this);
        this._iwidget_added_listener = this._iwidget_added_listener.bind(this);
        this._iwidget_removed_listener = this._iwidget_removed_listener.bind(this);

        this.workspace.addEventListener('iwidgetadded', this._iwidget_added_listener);
        this.workspace.addEventListener('iwidgetremoved', this._iwidget_removed_listener);
    };

    Wiring.prototype.load = function load(status) {
        var connection, sourceConnectable, targetConnectable, operators, id,
            operator_info, i, old_operators;

        if (status == null || status === '') {
            this.status = null;
            unload.call(this);
            return;
        }

        if (typeof status === 'string') {
            status = JSON.parse(status);
        }

        unload.call(this);

        operators = Wirecloud.wiring.OperatorFactory.getAvailableOperators();
        old_operators = this.ioperators;
        this.ioperators = {};
        for (id in status.operators) {
            operator_info = status.operators[id];
            if (id in old_operators) {
                this.ioperators[id] = old_operators[id];
                delete old_operators[id];
            } else {
                this.ioperators[id] = operators[operator_info.name].instanciate(id);
            }
        }
        for (id in old_operators) {
            old_operators[id].destroy();
        }

        for (i = 0; i < status.connections.length; i += 1) {
            connection = status.connections[i];
            sourceConnectable = findConnectable.call(this, connection.source);
            targetConnectable = findConnectable.call(this, connection.target);
            sourceConnectable.connect(targetConnectable);
        }

        this.status = status;
    };

    Wiring.prototype.save = function save() {
        Wirecloud.io.makeRequest(Wirecloud.URLs.WIRING_ENTRY.evaluate({id: this.workspace.getId()}), {
            method: 'PUT',
            contentType: 'application/json',
            postBody: Object.toJSON(this.status)
        });
    };

    Wiring.prototype.destroy = function destroy() {
        var key, i, entry;

        for (key in this.connectablesByWidget) {
            entry = this.connectablesByWidget[key];
            for (i = 0; i < entry.connectables.length; i += 1) {
                entry.connectables[i].destroy();
            }
        }
        this.connectablesByWidget = null;

        for (key in this.ioperators) {
            this.ioperators[key].fullDisconnect();
        }
        this.ioperators = null;


        this.workspace.removeEventListener('iwidgetadded', this._iwidget_added_listener);
        this.workspace.removeEventListener('iwidgetremoved', this._iwidget_removed_listener);

        this.workspace = null;
    };

    Wiring.prototype.pushEvent = function pushEvent(iWidget, outputName, data) {
        var entry;

        if (iWidget instanceof IGadget) {
            iWidget = iWidget.getId();
        }

        entry = this.connectablesByWidget[iWidget].events[outputName];
        entry.propagate(data);
    };

    Wiring.prototype.registerCallback = function registerCallback(iWidget, inputName, callback) {
        var entry;

        if (iWidget instanceof IGadget) {
            iWidget = iWidget.getId();
        }

        entry = this.connectablesByWidget[iWidget].slots[inputName];

        entry.variable.setHandler(callback);
    };

    /*****************
     * private methods
     *****************/

    Wiring.prototype._iwidget_added_listener = function _iwidget_added_listener(workspace, iwidget) {
        addIWidget.call(this, iwidget);
    };

    Wiring.prototype._iwidget_removed_listener = function _iwidget_removed_listener(workspace, iwidget) {
        removeIWidget.call(this, iwidget);
    };

    Wiring.prototype._iwidget_unload_listener = function _iwidget_unload_listener(iWidget) {
        var key, entry = this.connectablesByWidget[iWidget.getId()];

        for (key in entry.slots) {
            entry.slots[key].variable.setHandler(null);
        }
    };

    Wirecloud.Wiring = Wiring;
})();
