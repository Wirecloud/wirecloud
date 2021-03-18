/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


(function (utils) {

    "use strict";

    /**
     * @class This class represents a dragboard cursor. It is usually used in drag
     *        & drop operations and always represents the place where an iWidget is
     *        going to be placed.
     *
     * @author Álvaro Arranz
     *
     * @param iWidget iWidget that is going to be represented by the new dragboard
     *                cursor
     */
    const DragboardCursor = function DragboardCursor(widget) {
        this.widget = widget;

        this.id = 'cursor';
        this.position = widget.position;
        this.shape = widget.shape;
        this.layout = widget.layout;

        this.element = document.createElement("div");
        this.element.setAttribute("class", "dragboardcursor");

        // Set width and height
        this.element.style.height = widget.wrapperElement.offsetHeight + "px";
        this.element.style.width = widget.wrapperElement.offsetWidth + "px";

        // Set position
        this.layout.updatePosition(this.widget, this.element);

        // assign the created element
        widget.tab.wrapperElement.insertBefore(this.element, widget.wrapperElement);
    };

    /**
     * This method must be called to avoid memory leaks caused by circular
     * references.
     */
    DragboardCursor.prototype.destroy = function destroy() {
        this.element.remove();
    };

    DragboardCursor.prototype.setPosition = function setPosition(position) {
        this.position = position;

        if (this.element !== null) { // if visible
            this.layout.updatePosition({position: position}, this.element);
        }
    };

    Wirecloud.ui.DragboardCursor = DragboardCursor;

})(Wirecloud.Utils);
