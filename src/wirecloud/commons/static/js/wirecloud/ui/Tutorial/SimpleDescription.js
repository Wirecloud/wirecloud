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

    /**
     * Simple Description Constructor
     *
     */
    var SimpleDescription = function SimpleDescription(tutorial, options) {
        var nextLabel, pos, descSize;

        this.options = options;
        this.element = options.elem;
        this.tutorial = tutorial;
        this.layer = tutorial.msgLayer;
        this.last = false;
        this.pos = options.pos;
        this.title = options.title;
        this.nextButtonText = 'next';
        if (options.nextButtonText) {
            this.nextButtonText = options.nextButtonText;
        }

        Wirecloud.ui.WindowMenu.call(this, this.title, 'simpleDescription');

        try {
            this.windowContent.innerHTML = options.msg;
        } catch (e) {
            var msg = 'The provided message is not well formed';
        }

        this.nextButton = new StyledElements.StyledButton({
            'title': gettext("next"),
            'class': 'nextButton btn-primary',
            'text': gettext(this.nextButtonText),
        });

        this.nextButton.insertInto(this.windowBottom);

        // Cancel button
        this.cancelButton = new StyledElements.StyledButton({
            'title': gettext("Cancel"),
            'class': 'cancelButton',
            'text': gettext("cancel"),
        });
        this.cancelButton.insertInto(this.windowBottom);
        this.cancelButton.addEventListener('click', this._closeListener);

        this.layer.appendChild(this.htmlElement);

        // Position
        pos = document.body.getBoundingClientRect();
        descSize = {'width': this.htmlElement.getWidth()/2, 'height': this.htmlElement.getHeight()/2}
        this.htmlElement.style.top = ((pos.height/2) - descSize.height) + 'px';
        this.htmlElement.style.left = ((pos.width/2) - descSize.width) + 'px';

        this.wrapperElement = this.htmlElement;
    };

    SimpleDescription.prototype = new Wirecloud.ui.WindowMenu();

    SimpleDescription.prototype._closeListener = function _closeListener(e) {
        Wirecloud.ui.WindowMenu.prototype._closeListener.call(this, e);
        this.tutorial.destroy();
    };

    /**
     * get style position.
     */
    SimpleDescription.prototype.getStylePosition = function getStylePosition() {
        var coordinates;
        coordinates = {
            posX: parseInt(this.htmlElement.style.left, 10),
            posY: parseInt(this.htmlElement.style.top, 10)
        };
        return coordinates;
    };

    /**
     * set position.
     */
    SimpleDescription.prototype.setPosition = function setPosition(coordinates) {
        this.htmlElement.style.left = coordinates.posX + 'px';
        this.htmlElement.style.top = coordinates.posY + 'px';
    };

    /**
     * set the BoundingClientRect parameters
     */
    SimpleDescription.prototype.setBoundingClientRect = function setBoundingClientRect(BoundingClientRect, move) {
        this.htmlElement.style.height = (BoundingClientRect.height + move.height) + 'px';
        this.htmlElement.style.left = (BoundingClientRect.left + move.left) + 'px';
        this.htmlElement.style.top = (BoundingClientRect.top + move.top) + 'px';
        this.htmlElement.style.width = (BoundingClientRect.width + move.width) + 'px';
    };

    /**
     * set this SimpleDescription as the last one, don't need next button.
     */
    SimpleDescription.prototype.setLast = function setLast(buttonLabel, optionalHandler) {
        this.last = true;
        //this.windowBottom.removeChild(this.nextButton.wrapperElement);
        this.nextButton.wrapperElement.remove();
        if (buttonLabel == null) {
            buttonLabel = 'close'
        }
        this.cancelButton.setLabel(gettext(buttonLabel));
        if (optionalHandler != null) {
            this.cancelButton.removeEventListener('click', this._closeListener);
            this.cancelButton.addEventListener('click', optionalHandler.bind(this));
        }
    };

    /**
     * set next handler
     */
    SimpleDescription.prototype.setNext = function setNext() {
        this.nextButton.addEventListener('click', function () {
            if (this.element != null) {
                this.element.removeClassName('tuto_highlight');
            }
            this.tutorial.nextStep();
        }.bind(this));
    };

    /**
     * activate this step
     */
    var _activate = function _activate() {
        var pos;

        this.htmlElement.addClassName("activeStep");
        if (typeof this.element === 'function') {
            this.element = this.element();
            this.tutorial.setControlLayer(this.element, true);
            this.element.addClassName('tuto_highlight');
        } else {
            this.tutorial.resetControlLayer(false);
        }
        // I put this here because .getWidth() return different value when this.htmlElement haven't 'activeStep' className
        /*if (this.last) {
            this.cancelButton.wrapperElement.style.left = ((this.htmlElement.getWidth()/2) - (this.cancelButton.wrapperElement.getWidth()/2) - 4) + 'px';
        }*/
        if (this.element != null) {
            pos = this.element.getBoundingClientRect();
            switch(this.pos) {
                case('up'):
                    this.htmlElement.style.top = (pos.top - this.htmlElement.getHeight() - 20) + 'px';
                    break;
                case('right'):
                    this.htmlElement.style.left = (pos.right + 20) + 'px';
                    break;
                case('left'):
                    this.htmlElement.style.left = (pos.left - this.htmlElement.getWidth() - 20) + 'px';
                    break;
                case('down'):
                    this.htmlElement.style.top = (pos.bottom + 20) + 'px';
                    break;
                default:
                    break;
            }
        }
    };

     /**
     * activate this step
     */
    SimpleDescription.prototype.activate = function activate() {
        if (this.options.asynchronous) {
            this.element(_activate.bind(this));
        } else {
            _activate.call(this);
        }
    };

    /*************************************************************************
     * Make Anchor public
     *************************************************************************/
    Wirecloud.ui.Tutorial.SimpleDescription = SimpleDescription;
})();
