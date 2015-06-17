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
    var Widget = function Widget(widget, tab, options) {
        Wirecloud.WidgetBase.call(this, widget, tab, options);
    };
    Wirecloud.Utils.inherit(Widget, Wirecloud.WidgetBase);

    /**
     * Renames this iWidget.
     *
     * @param {String} iwidgetName New name for this iWidget.
     */
    Widget.prototype.setName = function setName(new_name, options) {
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

    Widget.prototype.remove = function remove(options) {
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
    Widget.prototype.destroy = function destroy() {

        if (this.loaded) {
            this.events.unload.dispatch(this);
            this.loaded = false;
        }

        this.contextManager = null;
        this.logManager.close();
    };

    Wirecloud.Widget = Widget;

})();
