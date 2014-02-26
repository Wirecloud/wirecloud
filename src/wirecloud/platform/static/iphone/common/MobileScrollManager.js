/*
 *     Copyright (c) 2011-2012 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global Wirecloud*/

(function () {

    "use strict";

    function MobileScrollManager(element, options) {
        var touchstart, touchend, touchmove,
            searchTarget, scrollParentY, scrollParentX,
            baseX, baseY, baseScrollTop, baseScrollLeft,
            target, defaultOptions;

        searchTarget = function (element, property, nextLevel) {
            var computedStyle, prop_value, currentElement = element;

            while (currentElement !== null) {
                computedStyle = element.ownerDocument.defaultView.getComputedStyle(currentElement, null);
                prop_value = computedStyle.getPropertyValue(property);
                if (prop_value === 'auto' || prop_value === 'scroll') {
                    return currentElement;
                }
                currentElement = currentElement.parentElement;
            }

            if (nextLevel && element.ownerDocument !== nextLevel.ownerDocument) {
                return searchTarget(nextLevel, property, null);
            }
            return null;
        };

        scrollParentY = function (element, extraScroll) {
            var newScrollTop,
                newExtraScroll = 0,
                parentElement;

            parentElement = searchTarget(element.parentElement, 'overflow-y');

            if (parentElement !== null) {
                newScrollTop = parentElement.scrollTop + extraScroll;
                if (newScrollTop < 0) {
                    newExtraScroll = newScrollTop;
                    newScrollTop = 0;
                } else if ((newScrollTop + target.clientHeight > target.scrollHeight)) {
                    newExtraScroll = newScrollTop;
                    newScrollTop = parentElement.scrollHeight - parentElement.clientHeight;
                    newExtraScroll -= newScrollTop;
                }
                parentElement.scrollTop = newScrollTop;
                if (newExtraScroll !== 0) {
                    scrollParentY(parentElement.parentElement, newExtraScroll);
                }
            }
        };

        scrollParentX = function (element, extraScroll) {
            var parentElement = searchTarget(element.parentElement, 'overflow-x');

            if (parentElement !== null) {
                parentElement.scrollLeft += extraScroll;
                //scrollParentX(parentElement.parentElement, newExtraScroll);
            }
        };

        touchstart = function (event) {
            target = searchTarget(event.target, 'overflow-y');

            if (target !== null) {
                baseX = event.touches[0].screenX;
                baseY = event.touches[0].screenY;
                baseScrollTop = target.scrollTop;
                baseScrollLeft = target.scrollLeft;
            }
        };

        touchmove = function (event) {
            var tmpScroll;

            if (target === null || event.touches.length > 1) {
                return;
            }

            var eventX = event.touches[0].screenX;
            var eventY = event.touches[0].screenY;
            var newScrollLeft = baseScrollLeft + (baseX - eventX);
            var newScrollTop = baseScrollTop + (baseY - eventY);
            baseX = eventX;
            baseY = eventY;

            if (newScrollLeft < 0) {
                if (options.propagate) {
                    scrollParentX(target, newScrollLeft);
                }
                newScrollLeft = 0;
            } else if ((newScrollLeft + target.clientWidth > target.scrollWidth)) {
                tmpScroll = newScrollLeft;
                newScrollLeft = target.scrollWidth - target.clientWidth;
                if (options.propagate) {
                    tmpScroll -= newScrollLeft;
                    scrollParentX(target, tmpScroll);
                }
            }

            if (newScrollTop < 0) {
                if (options.propagate) {
                    scrollParentY(target, newScrollTop);
                }
                newScrollTop = 0;
            } else if ((newScrollTop + target.clientHeight > target.scrollHeight)) {
                tmpScroll = newScrollTop;
                newScrollTop = target.scrollHeight - target.clientHeight;
                if (options.propagate) {
                    tmpScroll -= newScrollTop;
                    scrollParentY(target, tmpScroll);
                }
            }

            baseScrollLeft = newScrollLeft;
            baseScrollTop = newScrollTop;
            target.scrollLeft = newScrollLeft;
            target.scrollTop = newScrollTop;

            if (options.propagate === false) {
                event.stopPropagation();
                event.preventDefault();
            }
        };

        touchend = function (event) {
            target = null;
            if (options.onend) {
                try {
                    options.onend.call(this);
                } catch (e) {}
            }
            if (options.propagate === false) {
                event.stopPropagation();
                event.preventDefault();
            }
        };

        defaultOptions = {
            'capture': true,
            'propagate': true,
            'parentContainer': null,
            'onend': null
        };
        options = Wirecloud.Utils.merge(defaultOptions, options);

        element.addEventListener('touchstart', touchstart, options.capture);
        element.addEventListener('touchmove', touchmove, options.capture);
        element.addEventListener('touchend', touchend, options.capture);
        element.addEventListener('touchcancel', touchend, options.capture);
    }

    window.MobileScrollManager = MobileScrollManager;

})();
