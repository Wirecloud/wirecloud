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

/*global EzWebEffectBase, Wirecloud */

(function () {

    "use strict";

    var returnTrue = function returnTrue() {
        return true;
    };

    var cancel = function cancel() {
        return false;
    };

    var ResizeHandle = function ResizeHandle(resizableElement, handleElement, data, onStart, onResize, onFinish, canBeResized) {
        var xDelta = 0, yDelta = 0;
        var xStart = 0, yStart = 0;
        var yScroll = 0;
        var dragboardCover;
        var x, y;
        var endresize, resize, startresize, scroll;
        canBeResized = canBeResized ? canBeResized : returnTrue;


        // remove the events
        endresize = function (e) {
            e = e || window.event; // needed for IE

            // Only attend to left button (or right button for left-handed persons) events
            if (e.button !== 0) {
                return;
            }

            document.removeEventListener("mouseup", endresize, true);
            document.removeEventListener("mousemove", resize, true);

            dragboardCover.parentNode.removeEventListener("scroll", scroll, true);
            dragboardCover.parentNode.removeChild(dragboardCover);
            dragboardCover = null;

            handleElement.removeEventListener("mouseup", endresize, true);
            handleElement.removeEventListener("mousemove", resize, true);

            onFinish(resizableElement, handleElement, data);

            // Restore start event listener
            handleElement.addEventListener("mousedown", startresize, true);

            document.onmousedown = null; // reenable context menu
            document.onselectstart = null; // reenable text selection in IE
            document.oncontextmenu = null; // reenable text selection

            return false;
        };

        // fire each time the mouse is moved while resizing
        resize = function (e) {
            e = e || window.event; // needed for IE

            xDelta = xStart - parseInt(e.screenX, 10);
            yDelta = yStart - parseInt(e.screenY, 10);
            xStart = parseInt(e.screenX, 10);
            yStart = parseInt(e.screenY, 10);
            y = y - yDelta;
            x = x - xDelta;

            onResize(resizableElement, handleElement, data, x, y);
        };

        // fire each time the dragboard is scrolled while dragging
        scroll = function () {
            var dragboard = dragboardCover.parentNode;
            dragboardCover.style.height = dragboard.scrollHeight + "px";
            var scrollTop = parseInt(dragboard.scrollTop, 10);
            var scrollDelta = yScroll - scrollTop;
            y -= scrollDelta;
            yScroll = scrollTop;

            onResize(resizableElement, handleElement, data, x, y);
        };

        // initiate the resizing
        startresize = function (e) {
            e = e || window.event; // needed for IE

            if (!canBeResized(resizableElement, data)) {
                return false;
            }

            // Only attend to left button (or right button for left-handed persons) events
            if (e.button !== 0) {
                return;
            }

            document.oncontextmenu = cancel; // disable context menu
            document.onmousedown = cancel; // disable text selection
            document.onselectstart = cancel; // disable text selection in IE
            handleElement.removeEventListener("mousedown", startresize, true);

            xStart = parseInt(e.screenX, 10);
            yStart = parseInt(e.screenY, 10);
            x = resizableElement.offsetLeft + handleElement.offsetLeft + (handleElement.offsetWidth / 2);
            y = resizableElement.offsetTop + handleElement.offsetTop + (handleElement.offsetHeight / 2);
            document.addEventListener("mouseup", endresize, true);
            document.addEventListener("mousemove", resize, true);

            var dragboard = EzWebEffectBase.findDragboardElement(resizableElement);
            dragboardCover = document.createElement("div");
            dragboardCover.addClassName("cover");
            dragboardCover.addEventListener("mouseup", endresize, true);
            dragboardCover.addEventListener("mousemove", resize, true);

            dragboardCover.style.zIndex = "1000000";
            dragboardCover.style.position = "absolute";
            dragboardCover.style.top = "0";
            dragboardCover.style.left = "0";
            dragboardCover.style.width = "100%";
            dragboardCover.style.height = dragboard.scrollHeight + "px";

            yScroll = parseInt(dragboard.scrollTop, 10);

            dragboard.addEventListener("scroll", scroll, true);

            dragboard.insertBefore(dragboardCover, dragboard.firstChild);

            handleElement.addEventListener("mouseup", endresize, true);
            handleElement.addEventListener("mousemove", resize, true);

            onStart(resizableElement, handleElement, data);

            return false;
        };

        // Add event listener
        handleElement.addEventListener("mousedown", startresize, true);

        this.setResizableElement = function (element) {
            resizableElement = element;
        };

        this.destroy = function () {
            handleElement.removeEventListener("mousedown", startresize, true);
            startresize = null;
            resize = null;
            scroll = null;
            endresize = null;
            data = null;
            handleElement = null;
        };
    };

    Wirecloud.ui.ResizeHandle = ResizeHandle;
})();
