/*
 *     (C) Copyright 2013 Universidad Politécnica de Madrid
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

/*global IWidgetLogManager, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var old_context_api_adaptor_callback = function old_context_api_adaptor_callback(new_values) {
        var key, variables;

        variables = this.workspace.varManager.getIWidgetVariables(this.id);
        for (key in variables) {
            var variable = variables[key];
            if (variable.vardef.aspect === 'GCTX' && variable.vardef.concept in new_values) {
                variable.annotate(new_values[variable.vardef.concept]);
                variable.set(new_values[variable.vardef.concept]);
            }
        }
    };

    var renameSuccess = function renameSuccess(options, old_name, new_name, response) {
        this.name = new_name;

        var msg = gettext("Name changed from \"%(oldName)s\" to \"%(newName)s\" succesfully");
        msg = interpolate(msg, {oldName: old_name, newName: new_name}, true);
        this.logManager.log(msg, Constants.Logging.INFO_MSG);

        this.events.name_changed.dispatch(new_name);

        if (options.onSuccess === 'function') {
            try {
                options.onSuccess();
            } catch (e) {}
        }
    };

    var renameFailure = function renameFailure(options, response) {
        var msg = gettext("Error renaming iwidget from persistence: %(errorMsg)s.");
        msg = this.internal_iwidget.logManager.formatError(msg, transport, e);
        this.log(msg);

        if (options.onFailure === 'function') {
            try {
                options.onFailure(msg);
            } catch (e) {}
        }
    };

    /**
     */
    var IWidget = function IWidget(widget, tab, options) {

        var key;

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

        this.callbacks = {
            'iwidget': [],
            'mashup': [],
            'platform': []
        };
        this.contextManager = new Wirecloud.ContextManager(this, {
            'xPosition': 0,
            'yPosition': 0,
            'height': 0,
            'width': 0,
            'heightInPixels': 0,
            'widthInPixels': 0
        });
        this._old_context_api_adaptor_callback = old_context_api_adaptor_callback.bind(this);
        this.contextManager.addCallback(this._old_context_api_adaptor_callback);
        this.logManager = new IWidgetLogManager(this);
        this.prefCallback = null;

        StyledElements.ObjectWithEvents.call(this, ['load', 'unload', 'name_changed']);
    };
    IWidget.prototype = new StyledElements.ObjectWithEvents();

    IWidget.prototype.isAllowed = function isAllowed(action) {
        switch (action) {
        case "close":
            return !this.readOnly && this.workspace.isAllowed('add_remove_iwidgets');
        case "move":
        case "resize":
            return !this.tab.readOnly && this.workspace.isAllowed('edit_layout');
        case "minimize":
            return this.workspace.isAllowed('edit_layout');
        default:
            return false;
        }
    };

    IWidget.prototype.getVariable = function getVariable(name) {
        var variable;

        variable = this.workspace.varManager.findVariable(this.id, name);
        if (variable.vardef.aspect === 'PROP') {
            return variable;
        } else {
            return null;
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
            OpManagerFactory.getInstance().contextManager.addCallback(callback);
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
        var msg, errorCount;

        if (this.loaded || !element.hasAttribute('src') ) {
            return;
        }

        msg = gettext('iWidget loaded');
        this.logManager.log(msg, Constants.Logging.INFO_MSG);

        this.loaded = true;

        errorCount = this.logManager.getErrorCount();
        if (errorCount > 0) {
            msg = ngettext("%(errorCount)s error for the iWidget \"%(name)s\" was notified before it was loaded",
                               "%(errorCount)s errors for the iWidget \"%(name)s\" were notified before it was loaded",
                               errorCount);
            msg = interpolate(msg, {errorCount: errorCount, name: this.name}, true);
            this.logManager.log(msg, Constants.Logging.WARN_MSG);
        }

        element.contentDocument.defaultView.addEventListener('unload',
            this._notifyUnloaded.bind(this),
            true);

        /* Propagate pending events */
        for (var i = 0; i < this.pending_events.length; i += 1) {
            this.inputs[this.pending_events[i].endpoint].propagate(this.pending_events[i].value);
        }
        this.pending_events = [];

        this.events['load'].dispatch(this);
    };

    IWidget.prototype._notifyUnloaded = function _notifyUnloaded() {
        var i, opManager;

        if (!this.loaded) {
            return;
        }

        var msg = gettext('iWidget unloaded');
        this.logManager.log(msg, Constants.Logging.INFO_MSG);
        this.logManager.newCycle();

        // Remove context callbacks
        for (i = 0; i < this.callbacks.iwidget.length; i += 1) {
            this.contextManager.removeCallback(this.callbacks.iwidget[i]);
        }

        for (i = 0; i < this.callbacks.mashup.length; i += 1) {
            this.workspace.contextManager.removeCallback(this.callbacks.mashup[i]);
        }

        opManager = OpManagerFactory.getInstance();
        for (i = 0; i < this.callbacks.platform.length; i += 1) {
            opManager.contextManager.removeCallback(this.callbacks.platform[i]);
        }

        this.callbacks = {
            'iwidget': [],
            'mashup': [],
            'platform': []
        };

        // Remove preferences callback
        this.prefCallback = null;

        this.loaded = false;
        this.events['unload'].dispatch(this);
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
                workspace_id: this.workspace.getId(),
                tab_id: this.tab.getId(),
                iwidget_id: this.id
            });
            Wirecloud.io.makeRequest(iwidgetUrl, {
                method: 'POST',
                contentType: 'application/json',
                postBody: JSON.stringify({name: new_name}),
                onSuccess: renameSuccess.bind(this, options, old_name, new_name),
                onFailure: renameFailure.bind(this, options)
            });
        }
    };

    /**
     * This method must be called to avoid memory leaks caused by circular references.
     */
    IWidget.prototype.destroy = function destroy() {

        if (this.loaded) {
            this.events.unload.dispatch(this);
        }

        this.workspace.varManager.removeInstance(this.id);
        this.contextManager.removeCallback(this._old_context_api_adaptor_callback);
        this.contextManager = null;
        this.logManager.close();
        this.logManager = null;
    };

    Wirecloud.IWidget = IWidget;
})();
