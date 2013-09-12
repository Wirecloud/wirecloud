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

/*global Wirecloud*/


(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    var PopUp = function PopUp(element, text, position) {
        var pos;

        this.element = element;
        element.addClassName('tuto_highlight');
        this.wrapperElement = document.createElement("div");
        this.wrapperElement.addClassName("popUp");
        document.body.appendChild(this.wrapperElement);
        this.textElement = document.createElement("span");
        this.textElement.textContent = text;
        this.arrow = document.createElement("div");
        this.arrow.addClassName("popUpArrowDiv");
        this.arrow.addClassName("icon-hand-up");
        this.wrapperElement.appendChild(this.textElement);
        this.wrapperElement.appendChild(this.arrow);
        pos = element.getBoundingClientRect();
        switch (position) {
        case 'downRight':
            this.wrapperElement.style.top = (pos.top + pos.height + 10) + 'px';
            this.wrapperElement.style.left = (pos.left + pos.width + 10) + 'px';
            this.arrow.style.top = '-20px';
            this.arrow.style.left = '-20px';
            break;
        case 'downLeft':
            this.wrapperElement.style.top = (pos.top + pos.height + 10) + 'px';
            this.wrapperElement.style.left = (pos.left - this.wrapperElement.getBoundingClientRect().width - 10) + 'px';
            this.arrow.style.top = '-20px';
            this.arrow.style.left = (this.wrapperElement.getBoundingClientRect().width - 20) + 'px';
            if (parseFloat(this.wrapperElement.style.left) < 0) {
                this.wrapperElement.style.left = 0;
                this.wrapperElement.style.width = pos.left + 'px';
            }
            break;
        case 'topRight':
            this.wrapperElement.style.top = (pos.top - this.wrapperElement.getBoundingClientRect().height - 10) + 'px';
            this.wrapperElement.style.left = (pos.left + pos.width + 10) + 'px';
            this.arrow.style.top = (this.wrapperElement.getBoundingClientRect().height - 10) + 'px';
            this.arrow.style.left = '-20px';
            break;
        case 'topLeft':
            this.wrapperElement.style.top = (pos.top - this.wrapperElement.getBoundingClientRect().height - 10) + 'px';
            this.wrapperElement.style.left = (pos.left - this.wrapperElement.getBoundingClientRect().width - 10) + 'px';
            this.arrow.style.top = (this.wrapperElement.getBoundingClientRect().height - 10) + 'px';
            this.arrow.style.left = (this.wrapperElement.getBoundingClientRect().width - 10) + 'px';
            if (parseFloat(this.wrapperElement.style.left) < 0) {
                this.wrapperElement.style.left = 0;
                this.wrapperElement.style.width = pos.left + 'px';
            }
            break;
        default:
            this.wrapperElement.style.top = pos.top + 'px';
            this.wrapperElement.style.left = pos.left + 'px';
        }

        this.arrow.addClassName(this.position);
    };

    /**
     * Destroy
     */
    PopUp.prototype.destroy = function destroy() {
        this.element.removeClassName('tuto_highlight');
        this.wrapperElement.parentNode.removeChild(this.wrapperElement);
        this.wrapperElement = null;
        this.textElement = null;
        this.arrow = null;
    };

    /*************************************************************************
     * Make Anchor public
     *************************************************************************/
    Wirecloud.ui.Tutorial.PopUp = PopUp;
})();
