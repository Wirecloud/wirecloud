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

(function (utils) {

    "use strict";

    var renameSuccess = function renameSuccess(options, old_title, new_title, response) {
        this.title = new_title;
        this.contextManager.modify({title: new_title});

        var msg = gettext("Name changed from \"%(oldName)s\" to \"%(newName)s\" succesfully");
        msg = interpolate(msg, {oldName: old_title, newName: new_title}, true);
        this.logManager.log(msg, Wirecloud.constants.LOGGING.INFO_MSG);

        this.events.title_changed.dispatch(new_title);

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
        var msg = gettext("IWidget \"%(title)s\" removed from workspace succesfully");
        msg = interpolate(msg, {title: this.title}, true);
        this.logManager.log(msg, Wirecloud.constants.LOGGING.INFO_MSG);

        this.trigger('removed');
        Wirecloud.Utils.callCallback(options.onSuccess);
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
        if (options == null) {
            options = {};
        }
        options.volatile = false;
        options.persist = function persist(changes, onSuccess, onFailure) {
            var url = Wirecloud.URLs.IWIDGET_ENTRY.evaluate({
                workspace_id: this.workspace.id,
                tab_id: this.tab.id,
                iwidget_id: this.id
            });
            Wirecloud.io.makeRequest(url, {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify(changes),
                onSuccess: onSuccess,
                onFailure: onFailure
            });
        };

        Wirecloud.WidgetBase.call(this, widget, tab, options);
        this.logManager.log(utils.gettext("The widget was created successfully."), Wirecloud.constants.LOGGING.INFO_MSG);
    };
    Wirecloud.Utils.inherit(Widget, Wirecloud.WidgetBase);

    Widget.prototype.isAllowed = function isAllowed(action) {
        if (this.workspace.restricted) {
            return false;
        }

        switch (action) {
        case "close":
            return this.permissions.close && this.workspace.isAllowed('add_remove_iwidgets');
        case "move":
        case "resize":
            return this.permissions[action] && !this.tab.readonly && this.workspace.isAllowed('edit_layout');
        case "minimize":
            return this.workspace.isAllowed('edit_layout');
        default:
            if (action in this.permissions) {
                return this.permissions[action];
            } else {
                return false;
            }
        }
    };

    /**
     * Renames this iWidget.
     *
     * @param {String} iwidgetTitle New title for this iWidget.
     */
    Widget.prototype.setTitle = function setTitle(new_title, options) {
        var old_title = this.title;

        if (options == null) {
            options = {};
        }

        if (new_title !== null && new_title.length > 0) {
            var iwidgetUrl = Wirecloud.URLs.IWIDGET_ENTRY.evaluate({
                workspace_id: this.workspace.id,
                tab_id: this.tab.id,
                iwidget_id: this.id
            });
            Wirecloud.io.makeRequest(iwidgetUrl, {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {'Accept': 'application/json'},
                postBody: JSON.stringify({title: new_title}),
                onSuccess: renameSuccess.bind(this, options, old_title, new_title),
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

})(StyledElements.Utils);
