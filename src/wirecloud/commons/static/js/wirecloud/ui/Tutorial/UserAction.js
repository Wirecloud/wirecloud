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
    var UserAction = function UserAction(tutorial, options) {
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
        this.activeLayer = true;
        this.elemToApplyNextStepEvent = options.elemToApplyNextStepEvent;
        if (this.elemToApplyNextStepEvent == null) {
            this.elemToApplyNextStepEvent == this.element;
        }

        this.eventToDeactivateLayer = options.eventToDeactivateLayer;
        this.elemToApplyDeactivateLayerEvent = options.elemToApplyDeactivateLayerEvent;

        this.wrapperElement = document.createElement("div");
        if (options.msg != null){
            this.wrapperElement.addClassName("userAction");
        } else {
            this.wrapperElement.addClassName("empty");
        }
        this.layer.appendChild(this.wrapperElement);

        this.cancelButton = new StyledElements.StyledButton({
            'title': gettext("Cancel"),
            'class': 'button cancelButton',
            'plain': true
        });

        // Handler
        this.cancelButton.addEventListener('click', function () {
            this.element.removeClassName('tuto_highlight');
            this.tutorial.destroy(true);
        }.bind(this));

        this.cancelButton.insertInto(this.wrapperElement);
        this.textElement = document.createElement("span");
        this.textElement.textContent = options.msg;
        this.arrow = document.createElement("div");
        this.arrow.addClassName("popUpArrowDiv");
        this.arrow.addClassName("icon-hand-up");
        this.wrapperElement.appendChild(this.textElement);
        this.wrapperElement.appendChild(this.arrow);
    };

    /**
     * set this SimpleDescription as the last one, don't need next button.
     */
    UserAction.prototype.setLast = function setLast() {
        this.last = true;
    };

    /**
     * set next handler
     */
    UserAction.prototype.setNext = function setNext() {
        this.nextHandler = nextHandler.bind(this);
    };

    /**
     * set next handler
     */
    UserAction.prototype.deactivateLayer = function deactivateLayer() {
        this.tutorial.deactivateLayer();
    };

    /**
     * set next handler
     */
    var nextHandler = function nextHandler(e) {
        //e.stopPropagation();
        //e.cancelBubble = true;
        if (this.element != null) {
            this.element.removeClassName('tuto_highlight');
        }

        if (this.event == null) {
            this.elemToApplyNextStepEvent.removeEventListener('click', this.nextHandler, true);
        } else {
            this.elemToApplyNextStepEvent.removeEventListener(this.event, this.nextHandler);
        }

        if (this.eventToDeactivateLayer != null) {
            this.elemToApplyDeactivateLayerEvent.removeEventListener(this.eventToDeactivateLayer, this.deactivateLayer.bind(this), false);
        }

        this.tutorial.nextStep();
    };

    var _activate = function _activate(element, withoutCloseButton) {
        var pos, descSize;
        if (element == null){
            return null;
        }
        if (withoutCloseButton) {
            this.wrapperElement.removeChild(this.cancelButton.wrapperElement);
        }
        this.element = element;

        if (this.elemToApplyDeactivateLayerEvent) {
            this.elemToApplyDeactivateLayerEvent = this.elemToApplyDeactivateLayerEvent();
        } else {
            this.elemToApplyDeactivateLayerEvent = this.element;
        }

        if (this.elemToApplyNextStepEvent) {
            this.elemToApplyNextStepEvent = this.elemToApplyNextStepEvent();
        } else {
            this.elemToApplyNextStepEvent = this.element;
        }

        this.tutorial.setControlLayer(this.element);

        pos = this.element.getBoundingClientRect();
        switch (this.position) {
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
        default:
            //downRight
            this.wrapperElement.style.top = (pos.top + pos.height + 20) + 'px'
            this.wrapperElement.style.left = (pos.left + pos.width + 20) + 'px';
            this.arrow.style.top = '-20px';
            this.arrow.style.left = '-20px';
            break;
        }

        this.arrow.addClassName(this.position);

        if (this.event == null) {
            this.elemToApplyNextStepEvent.addEventListener('click', this.nextHandler, true);
        } else {
            this.elemToApplyNextStepEvent.addEventListener(this.event, this.nextHandler);
        }

        if (this.eventToDeactivateLayer != null) {
            this.elemToApplyDeactivateLayerEvent.addEventListener(this.eventToDeactivateLayer, this.deactivateLayer.bind(this), false);
        }

        this.wrapperElement.addClassName("activeStep");
        if (this.element != null) {
            this.element.addClassName('tuto_highlight');
        }
    };

    /**
     * activate this step
     */
    UserAction.prototype.activate = function activate(withoutCloseButton) {
        if (this.options.asynchronous) {
            this.element(_activate.bind(this));
        } else {
            _activate.call(this, this.element(), withoutCloseButton);
        }
    };

    /**
     * Destroy
     */
    UserAction.prototype.destroy = function destroy() {
        if (typeof this.element === 'function') {
            this.element = null;
        } else {
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
    Wirecloud.ui.Tutorial.UserAction = UserAction;
})();
