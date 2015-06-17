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
        Wirecloud.WidgetBase.call(this, widget, tab, options);
    };
    Wirecloud.Utils.inherit(VolatileWidget, Wirecloud.WidgetBase);

    /**
     * Renames this iWidget.
     *
     * @param {String} iwidgetName New name for this iWidget.
     */
    VolatileWidget.prototype.setName = function setName(new_name, options) {
        var old_name = this.name;

        if (options == null) {
            options = {};
        }

        if (new_name !== null && new_name.length > 0) {
            this.name = new_name;
            this.contextManager.modify({title: new_name});
            var msg = gettext("Name changed from \"%(oldName)s\" to \"%(newName)s\" succesfully");
            msg = interpolate(msg, {oldName: old_name, newName: new_name}, true);
            this.logManager.log(msg, Wirecloud.constants.LOGGING.INFO_MSG);

            this.events.name_changed.dispatch(new_name);

            Wirecloud.Utils.callCallback(options.onSuccess);
        }
    };

    VolatileWidget.prototype.remove = function remove(options) {
        var url;

        if (options == null) {
            options = {};
        }

        var msg = gettext("Widget \"%(name)s\" removed from workspace succesfully");
        msg = interpolate(msg, {name: this.name}, true);
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
