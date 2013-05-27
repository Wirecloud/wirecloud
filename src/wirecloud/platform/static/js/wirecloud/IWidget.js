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

/*global IWidgetLogManager, StyledElements, Widget, Wirecloud*/

(function () {

    "use strict";

    var old_context_api_adaptor_callback = function old_context_api_adaptor_callback(new_values) {
        var key, variables;

        variables = this.layout.dragboard.getWorkspace().varManager.getIWidgetVariables(this.id);
        for (key in variables) {
            var variable = variables[key];
            if (variable.vardef.aspect === 'GCTX' && variable.vardef.concept in new_values) {
                variable.annotate(new_values[variable.vardef.concept]);
                variable.set(new_values[variable.vardef.concept]);
            }
        }
    };

    /**
     */
    var IWidget = function IWidget(widget, options) {

        if (typeof options !== 'object' || !(widget instanceof Widget)) {
            throw new TypeError();
        }

        Object.defineProperty(this, 'widget', {value: widget});
        this.id = options.id;
        this.readOnly = options.readOnly;
        this.layout = options.layout;

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

        StyledElements.ObjectWithEvents.call(this, ['load', 'unload']);
    };
    IWidget.prototype = new StyledElements.ObjectWithEvents();

    IWidget.prototype.isAllowed = function isAllowed(action) {
        switch (action) {
        case "close":
            return !this.readOnly && this.layout.dragboard.getWorkspace().isAllowed('add_remove_iwidgets');
        case "move":
        case "resize":
            var dragboard = this.layout.dragboard;
            return !dragboard.tab.readOnly && dragboard.getWorkspace().isAllowed('edit_layout');
        case "minimize":
            return this.layout.dragboard.getWorkspace().isAllowed('edit_layout');
        default:
            return false;
        }
    };

    IWidget.prototype.getVariable = function getVariable(name) {
        var variable;

        variable = this.layout.dragboard.getWorkspace().varManager.findVariable(this.id, name);
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
            this.layout.dragboard.getWorkspace().contextManager.addCallback(callback);
            break;
        case 'platform':
            OpManagerFactory.getInstance().contextManager.addCallback(callback);
            break;
        default:
            throw new TypeError('invalid scope');
        }

        this.callbacks[scope].push(callback);
    };

    IWidget.prototype._unload = function _unload() {
        var i, workspace, opManager;

        // Remove context callbacks
        for (i = 0; i < this.callbacks.iwidget.length; i += 1) {
            this.contextManager.removeCallback(this.callbacks.iwidget[i]);
        }

        workspace = this.layout.dragboard.getWorkspace();
        for (i = 0; i < this.callbacks.mashup.length; i += 1) {
            workspace.contextManager.removeCallback(this.callbacks.mashup[i]);
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
    };

    IWidget.prototype.buildInterface = function buildInterface(view) {
        return new Wirecloud.ui.IWidgetView(this, view);
    };

    /**
     * This method must be called to avoid memory leaks caused by circular references.
     */
    IWidget.prototype.destroy = function destroy() {

        if (this.loaded) {
            this.events.unload.dispatch(this);
        }

        this.layout.dragboard.getWorkspace().varManager.removeInstance(this.id);
        this.contextManager.removeCallback(this._old_context_api_adaptor_callback);
        this.contextManager = null;
        this.logManager.close();
        this.logManager = null;
    };

    Wirecloud.IWidget = IWidget;
})();
