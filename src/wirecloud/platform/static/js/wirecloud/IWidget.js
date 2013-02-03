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

        this.contextManager = new Wirecloud.ContextManager(this, {
            'xPosition': 0,
            'yPosition': 0,
            'height': 0,
            'width': 0,
            'heightInPixels': 0,
            'widthInPixels': 0
        });
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

    IWidget.prototype.registerPrefCallback = function registerPrefCallback(prefCallback) {
        this.prefCallback = prefCallback;
    };

    /**
     * This method must be called to avoid memory leaks caused by circular references.
     */
    IWidget.prototype.destroy = function destroy() {

        if (this.loaded) {
            this.events.unload.dispatch(this);
        }

        this.contextManager = null;
        this.logManager.close();
        this.logManager = null;
    };

    Wirecloud.IWidget = IWidget;
})();
