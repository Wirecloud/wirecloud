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
            this.element.classList.remove('tuto_highlight');
        }
        this.tutorial.nextStep();
    };

    var _activate = function _activate(element, withoutCloseButton) {
        if (element != null) {
            this.element = element;
        }

        if (element != null) {
            this.popup = new Wirecloud.ui.Tutorial.PopUp(this.element, {
                highlight: true,
                msg: this.options.msg,
                position: this.position,
                closable: !withoutCloseButton
            });
            this.layer.appendChild(this.popup.wrapperElement);
            this.popup.repaint();
            this.popup.addEventListener('close', this.tutorial.destroy.bind(this.tutorial, true));

            this.tutorial.setControlLayer(element, true);
        } else {
            //transparent Control Layer
            this.tutorial.resetControlLayer();
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
        if (this.popup) {
            this.popup.destroy();
        }
        this.textElement = null;
        this.arrow = null;
    };

    /*************************************************************************
     * Make Anchor public
     *************************************************************************/
    Wirecloud.ui.Tutorial.AutoAction = AutoAction;
})();
