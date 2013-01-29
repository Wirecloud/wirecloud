(function () {

    "use strict";

    var _canBeDragged = function () {
        return true;
    };

    var _cancel = function () {
        return false;
    };

    /**
     * @param draggableElement {HTMLElement} Element to drag
     * @param handler {HTMLElement} Element where the drag & drop operation must to be started
     * @param data {Object} context
     */
    var Draggable = function Draggable(handler, data, onStart, onDrag, onFinish, canBeDragged, onScroll) {
        var xStart = 0, yStart = 0, xScrollStart = 0, yScrollStart = 0;
        var xScrollDelta, yScrollDelta;
        var dragboardCover;
        var draggable = this;
        var enddrag, drag, startdrag, scroll;
        canBeDragged = canBeDragged ? canBeDragged : _canBeDragged;

        // remove the events
        enddrag = function enddrag(e) {

            // Only attend to left button (or right button for left-handed persons) events
            if (e.button !== 0) {
                return;
            }

            document.removeEventListener("mouseup", enddrag, false);
            document.removeEventListener("mousemove", drag, false);

            if (dragboardCover != null) {
                dragboardCover.parentNode.removeEventListener("scroll", scroll, true);
                dragboardCover.parentNode.removeChild(dragboardCover);
                dragboardCover = null;
            }

            onFinish(draggable, data, e);

            handler.addEventListener("mousedown", startdrag, false);

            document.onmousedown = null; // reenable context menu
            document.onselectstart = null; // reenable text selection in IE
            document.oncontextmenu = null; // reenable text selection
        };

        // fire each time it's dragged
        drag = function drag(e) {

            var clientX = parseInt(e.clientX, 10);
            var clientY = parseInt(e.clientY, 10);
            var xDelta = clientX - xStart - xScrollDelta;
            var yDelta = clientY - yStart - yScrollDelta;

            onDrag(e, draggable, data, xDelta, yDelta);
        };

        // initiate the drag
        startdrag = function startdrag(e) {

            // Only attend to left button (or right button for left-handed persons) events
            if (e.button !== 0) {
                return false;
            }

            if (!canBeDragged(draggable, data)) {
                return false;
            }

            document.oncontextmenu = _cancel; // disable context menu
            document.onmousedown = _cancel; // disable text selection in Firefox
            document.onselectstart = _cancel; // disable text selection in IE
            handler.removeEventListener("mousedown", startdrag, false);

            xStart = parseInt(e.clientX, 10);
            yStart = parseInt(e.clientY, 10);

            document.addEventListener("mouseup", enddrag, false);
            document.addEventListener("mousemove", drag, false);

            yScrollDelta = 0;
            xScrollDelta = 0;

            var options = onStart(draggable, data, e);
            // TODO
            if (options != null && options.dragboard) {
                var dragboard = options.dragboard;
                dragboardCover = document.createElement("div");
                dragboardCover.className = "cover";
                dragboardCover.addEventListener("mouseup", enddrag, true);
                dragboardCover.addEventListener("mousemove", drag, true);

                dragboardCover.style.zIndex = "1000000";
                dragboardCover.style.position = "absolute";
                dragboardCover.style.top = "0";
                dragboardCover.style.left = "0";
                dragboardCover.style.width = "100%";
                dragboardCover.style.height = dragboard.scrollHeight + "px";

                yScrollStart = parseInt(dragboard.scrollTop, 10);
                xScrollStart = parseInt(dragboard.scrollLeft, 10);

                dragboardCover.addEventListener("scroll", scroll, true);

                dragboard.insertBefore(dragboardCover, dragboard.firstChild);
            }
            e.stopPropagation();
            return false;
        };

        // fire each time the dragboard is scrolled while dragging
        scroll = function scroll(e) {

            var dragboard = dragboardCover.parentNode;
            dragboardCover.style.height = dragboard.scrollHeight + "px";
            var scrollTop = parseInt(dragboard.scrollTop, 10);

            // yScrollDeltaDiff = diff between old scroll y delta and the new scroll y delta
            var oldYDelta = yScrollDelta;
            yScrollDelta = yScrollStart - scrollTop;
            var yScrollDeltaDiff = yScrollDelta - oldYDelta;

            var scrollLeft = parseInt(dragboard.scrollLeft, 10);
            // xScrollDeltaDiff = diff between old scroll x delta and the new scroll x delta
            var oldXDelta = xScrollDelta;
            xScrollDelta = xScrollStart - scrollLeft;
            var xScrollDeltaDiff = xScrollDelta - oldXDelta;

            onScroll(e, draggable, data, xScrollDeltaDiff, yScrollDeltaDiff);
        };

        // add mousedown event listener
        handler.addEventListener("mousedown", startdrag, false);

        /**********
         * Public methods
         **********/

        this.destroy = function destroy() {
            handler.removeEventListener("mousedown", startdrag, false);
            startdrag = null;
            enddrag = null;
            drag = null;
            scroll = null;
            draggable = null;
            data = null;
            handler = null;
        };
    };

    window.Draggable = Draggable;
})();
