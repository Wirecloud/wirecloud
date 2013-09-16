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

/*global StyledElements, Wirecloud*/


(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    var PopUp = function PopUp(element, options) {
        var pos;

        StyledElements.ObjectWithEvents.call(this, ['close']);
        this.element = element;
        this.options = options;

        if (options.highlight === true) {
            element.addClassName('tuto_highlight');
        }

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = 'popup alert alert-info';

        // Close button
        if (options.closable) {
            this.cancelButton = new StyledElements.StyledButton({
                'title': gettext("Cancel"),
                'class': 'button icon-remove',
                'plain': true
            });

            this.cancelButton.addEventListener('click', function () {
                this.destroy();
                this.events.close.dispatch(this);
            }.bind(this));
            this.cancelButton.insertInto(this.wrapperElement);
        }

        // Message
        this.textElement = document.createElement("div");
        if (options.msg == null) {
            this.wrapperElement.classList.add("empty");
        } else {
            this.textElement.innerHTML = options.msg;
        }
        this.wrapperElement.appendChild(this.textElement);

        // Arrow
        this.arrow = document.createElement("div");
        this.arrow.addClassName("popUpArrowDiv");
        this.arrow.addClassName("icon-hand-up");
        this.wrapperElement.appendChild(this.arrow);

        // Position
        pos = element.getBoundingClientRect();
        switch (options.position) {
        default:
        case 'downRight':
            this.wrapperElement.style.top = (pos.top + pos.height + 22) + 'px'
            this.wrapperElement.style.left = (pos.left + pos.width + 22) + 'px';
            this.arrow.style.top = '-25px';
            this.arrow.style.left = '-25px';
            break;
        case 'downLeft':
            this.wrapperElement.style.top = (pos.top + pos.height + 23) + 'px';
            this.wrapperElement.style.left = (pos.left - this.wrapperElement.getWidth() - 28) + 'px';
            this.arrow.style.top = '-26px';
            this.arrow.style.left = (this.wrapperElement.getWidth()) + 'px';
            if (parseFloat(this.wrapperElement.style.left) < 0) {
                this.wrapperElement.style.left = 0;
                this.wrapperElement.style.width = pos.left + 'px';
            }
            break;
        case 'topRight':
            this.wrapperElement.style.top = (pos.top - pos.height - 31) + 'px'
            this.wrapperElement.style.left = (pos.left + pos.width + 20) + 'px';
            this.arrow.style.top = (this.wrapperElement.getHeight() + 1) + 'px';
            this.arrow.style.left = '-24px';
            break;
        case 'topLeft':
            this.wrapperElement.style.top = (pos.top - pos.height - 32) + 'px'
            this.wrapperElement.style.left = (pos.left - this.wrapperElement.getWidth() - 31) + 'px';
            this.arrow.style.top = (this.wrapperElement.getHeight() + 2) + 'px';
            this.arrow.style.left = (this.wrapperElement.getWidth() + 2) + 'px';
            if (parseFloat(this.wrapperElement.style.left) < 0) {
                this.wrapperElement.style.left = 0;
                this.wrapperElement.style.width = pos.left + 'px';
            }
            break;
        }

        this.arrow.addClassName(options.position);
    };
    PopUp.prototype = new StyledElements.ObjectWithEvents();

    /**
     * Destroy
     */
    PopUp.prototype.destroy = function destroy() {
        if (this.wrapperElement == null) {
            return;
        }

        if (this.options.highlight) {
            this.element.classList.remove('tuto_highlight');
        }
        if (this.wrapperElement.parentNode) {
            this.wrapperElement.parentNode.removeChild(this.wrapperElement);
        }
        this.wrapperElement = null;
        this.textElement = null;
        this.arrow = null;
    };

    /*************************************************************************
     * Make Anchor public
     *************************************************************************/
    Wirecloud.ui.Tutorial.PopUp = PopUp;
})();
