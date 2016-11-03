/*
 *     Copyright (c) 2013-2016 Universidad Politécnica de Madrid
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


(function () {

    "use strict";

    var _canBeDragged = function () {
        return true;
    };

    /**
     * @param draggableElement {HTMLElement} Element to drag
     * @param handler {HTMLElement} Element where the drag & drop operation must to be started
     * @param data {Object} context
     */
    var Draggable = function Draggable(handler, data, onStart, onDrag, onFinish, canBeDragged, onScroll) {
        var lastClientX, lastClientY;
        var xStart = 0, yStart = 0, xScrollStart = 0, yScrollStart = 0;
        var xScrollDelta, yScrollDelta;
        var dragboardCover;
        var draggable = this;
        var enddrag, drag, startdrag, scroll;
        canBeDragged = canBeDragged ? canBeDragged : _canBeDragged;

        // remove the events
        enddrag = function enddrag(e) {

            // Only attend to left button (or right button for left-handed persons) events
            if (e.type === 'mouseup' && e.button !== 0) {
                return;
            } else if (e.type === 'touchend' && e.touches.length > 0) {
                return;
            }

            document.removeEventListener("mouseup", enddrag, false);
            document.removeEventListener("touchend", enddrag, false);
            document.removeEventListener("mousemove", drag, false);
            document.removeEventListener("touchmove", drag, false);

            if (dragboardCover != null) {
                dragboardCover.parentNode.removeEventListener("scroll", scroll, true);
                dragboardCover.parentNode.removeChild(dragboardCover);
                dragboardCover = null;
            }

            onFinish(draggable, data, e);

            handler.addEventListener("mousedown", startdrag, false);
            handler.addEventListener("touchstart", startdrag, false);

            document.removeEventListener('contextmenu', Wirecloud.Utils.preventDefaultListener); // reenable context menu
            document.removeEventListener('mousedown', Wirecloud.Utils.preventDefaultListener); // reenable text selection
        };

        // fire each time it's dragged
        drag = function drag(e) {

            if ('touches' in e) {
                lastClientX = e.touches[0].clientX;
                lastClientY = e.touches[0].clientY;
                // Work around chrome bug: https://code.google.com/p/chromium/issues/detail?id=150779
                e.preventDefault();
            } else {
                lastClientX = e.clientX;
                lastClientY = e.clientY;
            }
            var xDelta = lastClientX - xStart - xScrollDelta;
            var yDelta = lastClientY - yStart - yScrollDelta;

            onDrag(e, draggable, data, xDelta, yDelta);
        };

        // initiate the drag
        startdrag = function startdrag(e) {

            // Only attend to left button (or right button for left-handed persons) events
            if (e.type === 'mousedown' && e.button !== 0) {
                return;
            }

            if (!canBeDragged(draggable, data)) {
                return false;
            }

            e.preventDefault(); // disable text selection caused by this event
            document.addEventListener('contextmenu', Wirecloud.Utils.preventDefaultListener); // disable context menu
            document.addEventListener('mousedown', Wirecloud.Utils.preventDefaultListener); // disable text selection in Firefox
            handler.removeEventListener("mousedown", startdrag, false);
            handler.removeEventListener("touchstart", startdrag, false);

            if ('touches' in e) {
                xStart = e.touches[0].clientX;
                yStart = e.touches[0].clientY;
            } else {
                xStart = e.clientX;
                yStart = e.clientY;
            }
            lastClientX = xStart;
            lastClientY = yStart;

            document.addEventListener("mouseup", enddrag, false);
            document.addEventListener("touchend", enddrag, false);
            document.addEventListener("mousemove", drag, false);
            document.addEventListener("touchmove", drag, false);

            yScrollDelta = 0;
            xScrollDelta = 0;

            var options = onStart(draggable, data, e);
            // TODO
            if (options != null && options.dragboard) {
                var dragboard = options.dragboard;
                dragboardCover = document.createElement("div");
                dragboardCover.className = "cover";
                dragboardCover.addEventListener("mouseup", enddrag, true);
                dragboardCover.addEventListener("touchend", enddrag, true);
                dragboardCover.addEventListener("mousemove", drag, true);
                dragboardCover.addEventListener("touchmove", drag, true);

                dragboardCover.style.zIndex = "1000000";
                dragboardCover.style.position = "absolute";
                dragboardCover.style.top = "0";
                dragboardCover.style.left = "0";
                dragboardCover.style.width = "100%";
                dragboardCover.style.height = dragboard.scrollHeight + "px";

                yScrollStart = parseInt(dragboard.scrollTop, 10);
                xScrollStart = parseInt(dragboard.scrollLeft, 10);

                dragboard.addEventListener("scroll", scroll, true);

                dragboard.insertBefore(dragboardCover, dragboard.firstChild);
            }

            e.stopPropagation();
        };

        // fire each time the dragboard is scrolled while dragging
        scroll = function scroll(e) {

            var dragboard = dragboardCover.parentNode;
            dragboardCover.style.height = dragboard.scrollHeight + "px";

            var scrollTop = parseInt(dragboard.scrollTop, 10);
            yScrollDelta = yScrollStart - scrollTop;

            var scrollLeft = parseInt(dragboard.scrollLeft, 10);
            xScrollDelta = xScrollStart - scrollLeft;

            var xDelta = lastClientX - xStart - xScrollDelta;
            var yDelta = lastClientY - yStart - yScrollDelta;

            onDrag(e, draggable, data, xDelta, yDelta);
        };

        // add mousedown event listener
        handler.addEventListener("mousedown", startdrag, false);
        handler.addEventListener("touchstart", startdrag, false);

        // =====================================================================
        // PUBLIC MEMBERS
        // =====================================================================

        this.destroy = function destroy() {
            handler.removeEventListener("mousedown", startdrag, false);
            handler.removeEventListener("touchstart", startdrag, false);
            startdrag = null;
            enddrag = null;
            drag = null;
            scroll = null;
            draggable = null;
            data = null;
            handler = null;
        };
    };

    Wirecloud.ui.Draggable = Draggable;

})();
