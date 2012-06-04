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

/*global gettext, LogManagerFactory, wEvent, wSlot, Wirecloud*/

(function () {

    "use strict";

    var Wiring, addIWidget, removeIWidget;

    /*****************
     * Private methods
     *****************/

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
            events: [],
            slots: [],
            connectables: []
        };

        // IWidget variables
        for (i = 0; i < connectables.events.length; i += 1) {
            variableDef = connectables.events[i];
            variable = varManager.getVariableByName(iWidgetId, variableDef.name);
            connectable = new wEvent(variable, variableDef.type, variableDef.friend_code, variableDef.connectable_id);
            widgetEntry.events.push(connectable);
            widgetEntry.connectables.push(connectable);
        }
        for (i = 0; i < connectables.slots.length; i += 1) {
            variableDef = connectables.slots[i];
            variable = varManager.getVariableByName(iWidgetId, variableDef.name);
            connectable = new wSlot(variable, variableDef.type, variableDef.friend_code, variableDef.connectable_id);
            widgetEntry.slots.push(connectable);
            widgetEntry.connectables.push(connectable);
        }

        iwidget.addEventListener('unload', this._iwidget_unload_listener);
        this.connectablesByWidget[iWidgetId] = widgetEntry;
    };

    removeIWidget = function removeIWidget(iwidget) {
        var widgetEntry, i;

        if (!(iwidget.getId() in this.connectablesByWidget)) {
            var msg = gettext("Error: trying to remove an inexistant iWidget from the wiring module.");
            LogManagerFactory.getInstance().log(msg);
            return;
        }

        widgetEntry = this.connectablesByWidget[iwidget.getId()];
        for (i = 0; i < widgetEntry.connectables.length; i += 1) {
            widgetEntry.connectables[i].destroy();
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

        this._iwidget_unload_listener = this._iwidget_unload_listener.bind(this);
        this._iwidget_added_listener = this._iwidget_added_listener.bind(this);
        this._iwidget_removed_listener = this._iwidget_removed_listener.bind(this);

        this.workspace.addEventListener('iwidgetadded', this._iwidget_added_listener);
        this.workspace.addEventListener('iwidgetremoved', this._iwidget_removed_listener);
    };

    Wiring.prototype.load = function load(status) {
        var widgets;

        if (typeof status === 'string') {
            status = JSON.parse(status);
        }

        widgets = this.workspace.getIGadgets();
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

        this.workspace.removeEventListener('iwidgetadded', this._iwidget_added_listener);
        this.workspace.removeEventListener('iwidgetremoved', this._iwidget_removed_listener);

        this.workspace = null;
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
        var i, entry = this.connectablesByWidget[iWidget.getId()];

        for (i = 0; i < entry.slots.length; i++) {
            entry.slots[i].variable.setHandler(null);
        }
    };

    Wirecloud.Wiring = Wiring;
})();
