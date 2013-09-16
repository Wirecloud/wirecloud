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
    var AutoAction = function AutoAction(tutorial, options) {
        var pos;

        this.options = options;
        // Normalize asynchronous option
        this.options.asynchronous = !!this.options.asynchronous;
        this.layer = tutorial.msgLayer;
        this.last = false;
        this.tutorial = tutorial;
        this.element = options.elem;
        this.position = options.pos;
        this.event = options.event;
        this.action = options.action;

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = 'alert alert-info';
        if (options.msg != null){
            this.wrapperElement.addClassName("userAction");
        } else {
            this.wrapperElement.addClassName("empty");
        }
        this.layer.appendChild(this.wrapperElement);

        this.cancelButton = new StyledElements.StyledButton({
            'title': gettext("Cancel"),
            'class': 'button icon-remove',
            'plain': true
        });

        // Handler
        this.cancelButton.addEventListener('click', function () {
            this.tutorial.destroy(true);
        }.bind(this));

        this.cancelButton.insertInto(this.wrapperElement);
        this.textElement = document.createElement("span");
        this.textElement.innerHTML = options.msg;
        this.arrow = document.createElement("div");
        this.arrow.addClassName("popUpArrowDiv");
        this.arrow.addClassName("icon-hand-up");
        this.wrapperElement.appendChild(this.textElement);
        this.wrapperElement.appendChild(this.arrow);
    };

    /**
     * set this SimpleDescription as the last one, don't need next button.
     */
    AutoAction.prototype.setLast = function setLast() {
        this.last = true;
    };

    /**
     * set next handler
     */
    AutoAction.prototype.setNext = function setNext() {
        this.nextHandler = nextHandler.bind(this);
    };

    /**
     * set next handler
     */
    var nextHandler = function nextHandler() {
        if (this.element != null) {
            this.element.removeClassName('tuto_highlight');
        }
        this.tutorial.nextStep();
    };

    var _activate = function _activate(element, withoutCloseButton) {
        var pos, descSize;

        if (withoutCloseButton) {
            this.wrapperElement.removeChild(this.cancelButton.wrapperElement);
        }
        this.element = element;
        if (element != null) {
            this.tutorial.setControlLayer(element, true);
        } else {
            //transparent Control Layer
            this.tutorial.resetControlLayer();
        }

        if (element != null) {
            pos = this.element.getBoundingClientRect();
            switch (this.position) {
            case 'downRight':
                this.wrapperElement.style.top = (pos.top + pos.height + 20) + 'px'
                this.wrapperElement.style.left = (pos.left + pos.width + 20) + 'px';
                this.arrow.style.top = '-20px';
                this.arrow.style.left = '-20px';
                break;
            case 'downLeft':
                this.wrapperElement.style.top = (pos.top + pos.height + 20) + 'px';
                this.wrapperElement.style.left = (pos.left - this.wrapperElement.getWidth() - 20) + 'px';
                this.arrow.style.top = '-20px';
                this.arrow.style.left = (this.wrapperElement.getWidth() - 10) + 'px';
                if (parseFloat(this.wrapperElement.style.left) < 0) {
                    this.wrapperElement.style.left = 0;
                    this.wrapperElement.style.width = pos.left + 'px';
                }
                break;
            case 'topRight':
                this.wrapperElement.style.top = (pos.top - this.wrapperElement.getHeight() - pos.height - 10) + 'px';
                this.wrapperElement.style.left = (pos.left + pos.width) + 'px';
                this.arrow.style.top = (this.wrapperElement.getHeight()) + 'px';
                this.arrow.style.left = '-10px';
                break;
            case 'topLeft':
                this.wrapperElement.style.top = (pos.top - this.wrapperElement.getHeight() - pos.height - 10) + 'px';
                this.wrapperElement.style.left = (pos.left - this.wrapperElement.getWidth() - 20) + 'px';
                this.arrow.style.top = (this.wrapperElement.getHeight()) + 'px';
                this.arrow.style.left = (this.wrapperElement.getWidth()) + 'px';
                if (parseFloat(this.wrapperElement.style.left) < 0) {
                    this.wrapperElement.style.left = 0;
                    this.wrapperElement.style.width = pos.left + 'px';
                }
                break;
            default:
                //downRight
                this.wrapperElement.style.top = (pos.top + pos.height + 20) + 'px'
                this.wrapperElement.style.left = (pos.left + pos.width + 20) + 'px';
                this.arrow.style.top = '-20px';
                this.arrow.style.left = '-20px';
                break;
            }
        }

        this.arrow.addClassName(this.position);

        this.wrapperElement.addClassName("activeStep");
        if (this.element != null) {
            this.element.addClassName('tuto_highlight');
        }
        this.action(this, this.element);
    };

    /**
     * activate this step
     */
    AutoAction.prototype.activate = function activate(withoutCloseButton) {
        if (this.element == null) {
            _activate.call(this, null, withoutCloseButton);
        } else if (this.options.asynchronous) {
            this.element(_activate.bind(this));
        } else {
            _activate.call(this, this.element(), withoutCloseButton);
        }
    };

    /**
     * Destroy
     */
    AutoAction.prototype.destroy = function destroy() {
        if (typeof this.element === 'function') {
            this.element = null;
        } else if (this.element != null) {
            this.element.removeEventListener('click', this.nextHandler, true);
        }
        this.layer.removeChild(this.wrapperElement);
        this.wrapperElement = null;
        this.textElement = null;
        this.arrow = null;
    };

    /*************************************************************************
     * Make Anchor public
     *************************************************************************/
    Wirecloud.ui.Tutorial.AutoAction = AutoAction;
})();
