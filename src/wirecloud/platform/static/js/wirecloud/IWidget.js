/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, interpolate, Tab, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var renameSuccess = function renameSuccess(options, old_name, new_name, response) {
        this.name = new_name;
        this.contextManager.modify({title: new_name});

        var msg = gettext("Name changed from \"%(oldName)s\" to \"%(newName)s\" succesfully");
        msg = interpolate(msg, {oldName: old_name, newName: new_name}, true);
        this.logManager.log(msg, Wirecloud.constants.LOGGING.INFO_MSG);

        this.events.name_changed.dispatch(new_name);

        if (options.onSuccess === 'function') {
            try {
                options.onSuccess();
            } catch (e) {}
        }
    };

    var renameFailure = function renameFailure(options, response) {
        var msg = gettext("Error renaming iwidget from persistence: %(errorMsg)s.");
        msg = this.logManager.formatError(msg, response);
        this.log(msg);

        if (options.onFailure === 'function') {
            try {
                options.onFailure(msg);
            } catch (e) {}
        }
    };

    var removeSuccess = function removeSuccess(options, response) {
        var msg = gettext("IWidget \"%(name)s\" removed from workspace succesfully");
        msg = interpolate(msg, {name: this.name}, true);
        this.logManager.log(msg, Wirecloud.constants.LOGGING.INFO_MSG);

        this.events.removed.dispatch(this);

        if (options.onSuccess === 'function') {
            try {
                options.onSuccess();
            } catch (e) {}
        }

        this.destroy();
    };

    var removeFailure = function removeFailure(options, response) {
        var msg = gettext("Error removing iwidget from persistence: %(errorMsg)s.");
        msg = this.logManager.formatError(msg, response);
        this.logManager.log(msg);

        if (options.onFailure === 'function') {
            try {
                options.onFailure(msg);
            } catch (e) {}
        }
    };

    /**
     */
    var IWidget = function IWidget(widget, tab, options) {

        var key, i, preferences, iwidget_pref_info, properties, iwidget_prop_info;

        if (typeof options !== 'object' || !(widget instanceof Wirecloud.Widget)) {
            throw new TypeError();
        }

        if (!(tab instanceof Tab)) {
            throw new TypeError();
        }

        Object.defineProperty(this, 'widget', {value: widget});
        Object.defineProperty(this, 'meta', {value: widget});
        Object.defineProperty(this, 'tab', {value: tab});
        Object.defineProperty(this, 'workspace', {value: tab.workspace});
        this.id = options.id;
        this.loaded = false;
        this.name = options.name;
        this.readOnly = options.readOnly;
        this.pending_events = [];

        this.inputs = {};
        for (key in this.meta.inputs) {
            this.inputs[key] = new Wirecloud.wiring.WidgetTargetEndpoint(this, this.meta.inputs[key]);
        }
        this.outputs = {};
        for (key in this.meta.outputs) {
            this.outputs[key] = new Wirecloud.wiring.WidgetSourceEndpoint(this, this.meta.outputs[key]);
        }

        preferences = this.meta.preferenceList;
        this.preferenceList = [];
        this.preferences = {};
        for (i = 0; i < preferences.length; i++) {
            iwidget_pref_info = options.preferences[preferences[i].name];
            if (iwidget_pref_info != null) {
                this.preferenceList[i] = new Wirecloud.UserPref(preferences[i], iwidget_pref_info.readonly, iwidget_pref_info.hidden, iwidget_pref_info.value);
            } else {
                this.preferenceList[i] = new Wirecloud.UserPref(preferences[i], false, false, preferences[i].default);
            }

            this.preferences[preferences[i].name] = this.preferenceList[i];
        }

        properties = this.meta.propertyList;
        this.propertyList = [];
        this.properties = {};
        this.propertyCommiter = new Wirecloud.PropertyCommiter(this);
        for (i = 0; i < properties.length; i++) {
            iwidget_prop_info = options.properties[properties[i].name];
            if (iwidget_prop_info != null) {
                this.propertyList[i] = new Wirecloud.PersistentVariable(properties[i], this.propertyCommiter, iwidget_prop_info.readonly, iwidget_prop_info.value);
            } else {
                this.propertyList[i] = new Wirecloud.PersistentVariable(properties[i], this.propertyCommiter, false, properties[i].meta.default);
            }
            this.properties[properties[i].name] = this.propertyList[i];
        }

        this.callbacks = {
            'iwidget': [],
            'mashup': [],
            'platform': []
        };
        this.contextManager = new Wirecloud.ContextManager(this, {
            'title': {
                label: gettext("Title"),
                description: gettext("Widget's title"),
                value: options.name
            },
            'xPosition': {
                label: gettext("X-Position"),
                description: gettext("Specifies the x-coordinate at which the widget is placed"),
                value: 0
            },
            'yPosition': {
                label: gettext("Y-Position"),
                description: gettext("Specifies the y-coordinate at which the widget is placed"),
                value: 0
            },
            'height': {
                label: gettext("Height"),
                description: gettext("Widget's height in layout cells"),
                value: 0
            },
            'width': {
                label: gettext("Width"),
                description: gettext("Widget's width in layout cells"),
                value: 0
            },
            'heightInPixels': {
                label: gettext("Height in pixels"),
                description: gettext("Widget's height in pixels"),
                value: 0
            },
            'widthInPixels': {
                label: gettext("Width in pixels"),
                description: gettext("Widget's width in pixels"),
                value: 0
            }
        });
        Object.defineProperty(this, 'logManager', {value: new Wirecloud.Widget.LogManager(this)});
        this.prefCallback = null;

        StyledElements.ObjectWithEvents.call(this, ['load', 'unload', 'removed', 'name_changed']);
    };
    IWidget.prototype = new StyledElements.ObjectWithEvents();

    IWidget.prototype.isAllowed = function isAllowed(action) {
        if (this.workspace.restricted) {
            return false;
        }

        switch (action) {
        case "close":
            return !this.readOnly && this.workspace.isAllowed('add_remove_iwidgets');
        case "move":
        case "resize":
            return !this.tab.readOnly && this.workspace.isAllowed('edit_layout');
        case "minimize":
            return this.workspace.isAllowed('edit_layout');
        case "rename":
        case "configure":
            return true;
        default:
            return false;
        }
    };

    IWidget.prototype.registerPrefCallback = function registerPrefCallback(prefCallback) {
        this.prefCallback = prefCallback;
    };

    IWidget.prototype.registerContextAPICallback = function registerContextAPICallback(scope, callback) {
        switch (scope) {
        case 'iwidget':
            this.contextManager.addCallback(callback);
            break;
        case 'mashup':
            this.workspace.contextManager.addCallback(callback);
            break;
        case 'platform':
            Wirecloud.contextManager.addCallback(callback);
            break;
        default:
            throw new TypeError('invalid scope');
        }

        this.callbacks[scope].push(callback);
    };

    /**
     * This function is called when the content of the iwidget has been loaded completly.
     *
     * @private
     */
    IWidget.prototype._notifyLoaded = function _notifyLoaded(element) {

        if (this.loaded || !element.hasAttribute('src')) {
            return;
        }

        this.logManager.log(gettext('iWidget loaded'), Wirecloud.constants.LOGGING.INFO_MSG);

        this.loaded = true;

        element.contentDocument.defaultView.addEventListener('unload',
            this._notifyUnloaded.bind(this),
            true);

        element.contentDocument.defaultView.addEventListener('keydown', function (event) {
            if (event.keyCode === 27 /* escape */) {
                Wirecloud.UserInterfaceManager.handleEscapeEvent();
            }
        }, true);

        /* Propagate pending events */
        for (var i = 0; i < this.pending_events.length; i += 1) {
            this.inputs[this.pending_events[i].endpoint].propagate(this.pending_events[i].value);
        }
        this.pending_events = [];

        this.events.load.dispatch(this);
    };

    IWidget.prototype._notifyUnloaded = function _notifyUnloaded() {
        var i;

        if (!this.loaded) {
            return;
        }

        this.logManager.log(gettext('iWidget unloaded'), Wirecloud.constants.LOGGING.INFO_MSG);
        this.logManager.newCycle();

        // Remove context callbacks
        for (i = 0; i < this.callbacks.iwidget.length; i += 1) {
            this.contextManager.removeCallback(this.callbacks.iwidget[i]);
        }

        for (i = 0; i < this.callbacks.mashup.length; i += 1) {
            this.workspace.contextManager.removeCallback(this.callbacks.mashup[i]);
        }

        for (i = 0; i < this.callbacks.platform.length; i += 1) {
            Wirecloud.contextManager.removeCallback(this.callbacks.platform[i]);
        }

        this.callbacks = {
            'iwidget': [],
            'mashup': [],
            'platform': []
        };

        // Commit any property change
        this.propertyCommiter.commit();

        // Remove preferences callback
        this.prefCallback = null;

        this.loaded = false;
        this.events.unload.dispatch(this);
    };

    IWidget.prototype.buildInterface = function buildInterface(template, view) {
        return new Wirecloud.ui.IWidgetView(this, template, view);
    };

    IWidget.prototype.fullDisconnect = function fullDisconnect() {
        var key, connectables;

        connectables = this.inputs;
        for (key in connectables) {
            connectables[key].fullDisconnect();
        }

        connectables = this.outputs;
        for (key in connectables) {
            connectables[key].fullDisconnect();
        }
    };

    /**
     * Renames this iWidget.
     *
     * @param {String} iwidgetName New name for this iWidget.
     */
    IWidget.prototype.setName = function setName(new_name, options) {
        var old_name = this.name;

        if (options == null) {
            options = {};
        }

        if (new_name !== null && new_name.length > 0) {
            var iwidgetUrl = Wirecloud.URLs.IWIDGET_ENTRY.evaluate({
                workspace_id: this.workspace.id,
                tab_id: this.tab.id,
                iwidget_id: this.id
            });
            Wirecloud.io.makeRequest(iwidgetUrl, {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify({name: new_name}),
                onSuccess: renameSuccess.bind(this, options, old_name, new_name),
                onFailure: renameFailure.bind(this, options)
            });
        }
    };

    IWidget.prototype.remove = function remove(options) {
        var url;

        if (options == null) {
            options = {};
        }

        url = Wirecloud.URLs.IWIDGET_ENTRY.evaluate({
            workspace_id: this.workspace.id,
            tab_id: this.tab.id,
            iwidget_id: this.id
        });
        Wirecloud.io.makeRequest(url, {
            method: 'DELETE',
            requestHeaders: {'Accept': 'application/json'},
            onSuccess: removeSuccess.bind(this, options),
            onFailure: removeFailure.bind(this, options)
        });
    };

    /**
     * This method must be called to avoid memory leaks caused by circular references.
     */
    IWidget.prototype.destroy = function destroy() {

        if (this.loaded) {
            this.events.unload.dispatch(this);
            this.loaded = false;
        }

        this.contextManager = null;
        this.logManager.close();
    };

    Wirecloud.IWidget = IWidget;

})();
