/*
 *     Copyright (c) 2008-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global IWidget, Wirecloud*/

(function () {

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
    var DragboardCursor = function DragboardCursor(iWidget) {
        this.refIWidget = iWidget;

        var positiontmp = iWidget.getPosition();
        this.position = positiontmp.clone();

        this.code = 'cursor';
        this.layout = iWidget.layout;
        this.width = iWidget.getWidth();
        this.height = iWidget.getHeight();
        this.heightInPixels = iWidget.element.offsetHeight;
        this.widthInPixels = iWidget.element.offsetWidth;
    };

    DragboardCursor.prototype.getWidth = function getWidth() {
        return this.width;
    };

    DragboardCursor.prototype.getHeight = function getHeight() {
        return this.height;
    };

    DragboardCursor.prototype.paint = function paint(dragboard) {
        var dragboardCursor = document.createElement("div");
        dragboardCursor.setAttribute("class", "dragboardcursor");

        // Set width and height
        dragboardCursor.style.height = this.heightInPixels + "px";
        dragboardCursor.style.width = this.widthInPixels + "px";

        // Set position
        dragboardCursor.style.left = (this.layout.getColumnOffset(this.position.x) - 2) + "px"; // TODO -2 px for borders
        dragboardCursor.style.top = (this.layout.getRowOffset(this.position.y) - 2) + "px"; // TODO -2 px for borders

        // assign the created element
        dragboard.insertBefore(dragboardCursor, this.refIWidget.element);
        this.element = dragboardCursor;
    };

    /**
     * This method must be called to avoid memory leaks caused by circular
     * references.
     */
    DragboardCursor.prototype.destroy = function destroy() {
        if (Wirecloud.Utils.XML.isElement(this.element)) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
    };

    DragboardCursor.prototype.getPosition = IWidget.prototype.getPosition;

    DragboardCursor.prototype.setPosition = function setPosition(position) {
        this.position = position;

        if (this.element !== null) { // if visible
            this.element.style.left = (this.layout.getColumnOffset(position.x) - 2) + "px"; // TODO -2 px for borders
            this.element.style.top = (this.layout.getRowOffset(position.y) - 2) + "px"; // TODO -2 px for borders
        }
    };

    Wirecloud.ui.DragboardCursor = DragboardCursor;

})();
