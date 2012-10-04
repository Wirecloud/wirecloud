/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

/*globals StyledElements */

(function () {

    "use strict";

    /**
     *
     */
    var Fragment = function Fragment(elements) {
        if (Array.isArray(elements)) {
            this.elements = elements;
        } else {
            this.elements = [];
        }
    };
    Fragment.prototype = new StyledElements.StyledElement();

    Fragment.prototype.insertInto = function insertInto(element, refElement) {
        var i, currentElement;

        if (refElement instanceof StyledElements.StyledElement) {
            refElement = refElement.wrapperElement;
        }

        if (refElement != null) {
            for (i = 0; i < this.elements.length; i += 1) {
                currentElement = this.elements[i];
                if (currentElement instanceof StyledElements.StyledElement) {
                    currentElement.insertInto(element, refElement);
                } else {
                    element.insertBefore(currentElement, refElement);
                }
            }
        } else {
            for (i = 0; i < this.elements.length; i += 1) {
                currentElement = this.elements[i];
                element.appendChild(currentElement);
            }
        }
    };

    Fragment.prototype.appendChild = function appendChild(element) {
        this.elements.push(element);
    };

    StyledElements.Fragment = Fragment;
})();
