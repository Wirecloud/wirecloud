/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    /**
     * set next handler
     */
    const nextHandler = function nextHandler() {
        if (this.currentElement != null) {
            this.currentElement.classList.remove('tuto_highlight');
        }
        this.tutorial.nextStep();
    };

    const _activate = function _activate(element) {
        this.currentElement = typeof(element) === "function" ? element() : element;

        if (this.currentElement != null) {
            if (this.options.msg) {
                this.popup = new Wirecloud.ui.Tutorial.PopUp(this.currentElement, {
                    highlight: true,
                    msg: this.options.msg,
                    position: this.position,
                    closable: true
                });
                this.layer.appendChild(this.popup.wrapperElement);
                this.popup.repaint();
                this.popup.addEventListener('close', this.tutorial.destroy.bind(this.tutorial, true));
            }
            this.tutorial.setControlLayer(this.currentElement, true);
        } else {
            // transparent Control Layer
            this.tutorial.resetControlLayer();
        }

        this.action(this, this.currentElement);
    };

    ns.AutoAction = class AutoAction {

        constructor(tutorial, options) {
            this.options = options;
            // Normalize asynchronous option
            this.options.asynchronous = !!this.options.asynchronous;
            this.layer = tutorial.msgLayer;
            this.last = false;
            this.tutorial = tutorial;
            this.element = options.elem;
            this.currentElement = null;
            this.position = options.pos;
            this.event = options.event;
            this.action = options.action;
        }

        /**
         * set this SimpleDescription as the last one, don't need next button.
         */
        setLast() {
            this.last = true;
        }

        /**
         * set next handler
         */
        setNext() {
            this.nextHandler = nextHandler.bind(this);
        }

        /**
         * activate this step
         */
        activate() {
            if (this.options.asynchronous) {
                this.element(_activate.bind(this));
            } else {
                _activate.call(this, this.element);
            }
        }

        /**
         * Destroy
         */
        destroy() {
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
        }

    }

})(Wirecloud.ui.Tutorial, StyledElements, Wirecloud.Utils);
