/*
 *     Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

    /**
     */
    var VolatileWidget = function VolatileWidget(widget, tab, options) {
        options = options || {};
        options.volatile = true;
        Wirecloud.WidgetBase.call(this, widget, tab, options);
    };
    Wirecloud.Utils.inherit(VolatileWidget, Wirecloud.WidgetBase);

    /**
     * Renames this iWidget.
     *
     * @param {String} iwidgetTitle New title for this iWidget.
     */
    VolatileWidget.prototype.setTitle = function setTitle(new_title, options) {
        var old_title = this.title;

        if (options == null) {
            options = {};
        }

        if (new_title !== null && new_title.length > 0) {
            this.title = new_title;
            this.contextManager.modify({title: new_title});
            var msg = gettext("Name changed from \"%(oldName)s\" to \"%(newName)s\" succesfully");
            msg = interpolate(msg, {oldName: old_title, newName: new_title}, true);
            this.logManager.log(msg, Wirecloud.constants.LOGGING.INFO_MSG);

            this.events.title_changed.dispatch(new_title);

            Wirecloud.Utils.callCallback(options.onSuccess);
        }
    };

    VolatileWidget.prototype.remove = function remove(options) {
        var url;

        if (options == null) {
            options = {};
        }

        var msg = gettext("Widget \"%(title)s\" removed from workspace succesfully");
        msg = interpolate(msg, {title: this.title}, true);
        this.logManager.log(msg, Wirecloud.constants.LOGGING.INFO_MSG);

        this.events.removed.dispatch(this);

        Wirecloud.Utils.callCallback(options.onSuccess);

        this.destroy();
    };

    /**
     * This method must be called to avoid memory leaks caused by circular references.
     */
    VolatileWidget.prototype.destroy = function destroy() {

        if (this.loaded) {
            this.events.unload.dispatch(this);
            this.loaded = false;
        }

        this.contextManager = null;
        this.logManager.close();
    };

    Wirecloud.VolatileWidget = VolatileWidget;

})();
