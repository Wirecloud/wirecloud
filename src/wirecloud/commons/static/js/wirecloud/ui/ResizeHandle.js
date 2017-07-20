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

(function () {

    "use strict";

    var returnTrue = function returnTrue() {
        return true;
    };

    var ResizeHandle = function ResizeHandle(resizableElement, handleElement, data, onStart, onResize, onFinish, canBeResized) {
        var xDelta = 0, yDelta = 0;
        var xStart = 0, yStart = 0;
        var scrollDelta, scrollStart = 0;
        var dragboardCover, dragboard;
        var x, y;
        var endresize, resize, startresize, scroll;
        canBeResized = canBeResized ? canBeResized : returnTrue;


        // remove the events
        endresize = function endresize(e) {

            // Only attend to left button (or right button for left-handed persons) events
            if (e.type === 'mouseup' && e.button !== 0) {
                return;
            } else if (e.type === 'touchend' && e.touches.length > 0) {
                return;
            }

            if (handleElement.ownerDocument !== document) {
                handleElement.ownerDocument.removeEventListener("mouseup", endresize, false);
                handleElement.ownerDocument.removeEventListener("touchend", endresize, false);
                handleElement.ownerDocument.removeEventListener("mousemove", resize, false);
                handleElement.ownerDocument.removeEventListener("touchmove", resize, false);
            } else {
                document.removeEventListener("mouseup", endresize, false);
                document.removeEventListener("touchend", endresize, false);
                document.removeEventListener("mousemove", resize, false);
                document.removeEventListener("touchmove", resize, false);
            }

            if (dragboard != null) {
                dragboard.removeEventListener("scroll", scroll, true);
                dragboard = null;
            }
            dragboardCover.remove();
            dragboardCover = null;

            handleElement.removeEventListener("mouseup", endresize, false);
            handleElement.removeEventListener("touchend", endresize, false);
            handleElement.removeEventListener("mousemove", resize, false);
            handleElement.removeEventListener("touchmove", resize, false);

            onFinish(resizableElement, handleElement, data);

            // Restore start event listener
            handleElement.addEventListener("mousedown", startresize, false);
            handleElement.addEventListener("touchstart", startresize, false);

            document.removeEventListener('mousedown', Wirecloud.Utils.preventDefaultListener, false); // reenable text selection
            document.removeEventListener('contextmenu', Wirecloud.Utils.preventDefaultListener, false); // reenable context menu
        };

        // fire each time the mouse is moved while resizing
        resize = function resize(e) {
            var clientX, clientY;

            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
                // Work around chrome bug: https://code.google.com/p/chromium/issues/detail?id=150779
                e.preventDefault();
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            xDelta = clientX - xStart;
            yDelta = clientY - yStart;

            onResize(resizableElement, handleElement, data, x + xDelta, y + yDelta - scrollDelta);
        };

        // fire each time the dragboard is scrolled while dragging
        scroll = function scroll() {
            dragboardCover.style.height = dragboard.scrollHeight + "px";
            var scrollTop = parseInt(dragboard.scrollTop, 10);
            scrollDelta = scrollStart - scrollTop;

            onResize(resizableElement, handleElement, data, x + xDelta, y + yDelta - scrollDelta);
        };

        // initiate the resizing
        startresize = function startresize(e) {

            // Only attend to left button (or right button for left-handed persons) events
            if (e.type === 'mousedown' && e.button !== 0) {
                return;
            }

            if (!canBeResized(resizableElement, data)) {
                return false;
            }

            e.stopPropagation();

            document.addEventListener('contextmenu', Wirecloud.Utils.preventDefaultListener, false); // disable context menu
            document.addEventListener('mousedown', Wirecloud.Utils.preventDefaultListener, false); // disable text selection
            handleElement.removeEventListener("mousedown", startresize, false);
            handleElement.removeEventListener("touchstart", startresize, false);

            if ('touches' in e) {
                xStart = e.touches[0].clientX;
                yStart = e.touches[0].clientY;
            } else {
                xStart = e.clientX;
                yStart = e.clientY;
            }
            x = resizableElement.offsetLeft + handleElement.offsetLeft + (handleElement.offsetWidth / 2);
            y = resizableElement.offsetTop + handleElement.offsetTop + (handleElement.offsetHeight / 2);

            if (handleElement.ownerDocument !== document) {
                handleElement.ownerDocument.addEventListener("mouseup", endresize, false);
                handleElement.ownerDocument.addEventListener("touchend", endresize, false);
                handleElement.ownerDocument.addEventListener("mousemove", resize, false);
                handleElement.ownerDocument.addEventListener("touchmove", resize, false);
            } else {
                document.addEventListener("mouseup", endresize, false);
                document.addEventListener("touchend", endresize, false);
                document.addEventListener("mousemove", resize, false);
                document.addEventListener("touchmove", resize, false);
            }

            var dragboard = document.body;
            dragboardCover = document.createElement("div");
            dragboardCover.className = "cover";
            dragboardCover.addEventListener("mouseup", endresize, true);
            dragboardCover.addEventListener("mousemove", resize, true);

            dragboardCover.style.zIndex = "1000000";
            dragboardCover.style.position = "absolute";
            dragboardCover.style.top = "0";
            dragboardCover.style.left = "0";
            dragboardCover.style.width = "100%";

            document.body.insertBefore(dragboardCover, document.body.firstChild);

            if (handleElement.ownerDocument === document) {
                dragboardCover.style.height = dragboard.scrollHeight + "px";
                scrollStart = dragboard.scrollTop;
                scrollDelta = 0;

                dragboard.insertBefore(dragboardCover, dragboard.firstChild);
                dragboard.addEventListener("scroll", scroll, true);
            } else {
                dragboardCover.style.height = document.body.scrollHeight + "px";
                scrollStart = 0;
                scrollDelta = 0;
            }

            onStart(resizableElement, handleElement, data);

            return false;
        };

        // Add event listener
        handleElement.addEventListener("mousedown", startresize, false);
        handleElement.addEventListener("touchstart", startresize, false);

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
