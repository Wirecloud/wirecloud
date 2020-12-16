/*
 *     Copyright 2013-2016 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

    const setDialogPosition = function setDialogPosition(ref_pos, pos) {
        switch (pos) {
        case 'up':
            this.htmlElement.style.top = (ref_pos.top - this.htmlElement.offsetHeight - 20) + 'px';
            this.htmlElement.style.left = (ref_pos.left + (ref_pos.width - this.htmlElement.offsetWidth) / 2) + 'px';
            break;
        case 'right':
            this.htmlElement.style.top = (ref_pos.top + (ref_pos.height - this.htmlElement.offsetHeight) / 2) + 'px';
            this.htmlElement.style.left = (ref_pos.right + 20) + 'px';
            break;
        case 'left':
            this.htmlElement.style.top = (ref_pos.top + (ref_pos.height - this.htmlElement.offsetHeight) / 2) + 'px';
            this.htmlElement.style.left = (ref_pos.left - this.htmlElement.offsetWidth - 20) + 'px';
            break;
        case 'down':
            this.htmlElement.style.top = (ref_pos.bottom + 20) + 'px';
            this.htmlElement.style.left = (ref_pos.left + (ref_pos.width - this.htmlElement.offsetWidth) / 2) + 'px';
            break;
        }
    };

    const standsOut = function standsOut() {
        const parent_box = document.body.getBoundingClientRect();
        const element_box = this.htmlElement.getBoundingClientRect();

        const visible_width = element_box.width - Math.max(element_box.right - parent_box.right, 0) - Math.max(parent_box.left - element_box.left, 0);
        const visible_height = element_box.height - Math.max(element_box.bottom - parent_box.bottom, 0) - Math.max(parent_box.top - element_box.top, 0);
        const element_area = element_box.width * element_box.height;
        const visible_area = visible_width * visible_height;
        return element_area - visible_area;
    };

    const fixPosition = function fixPosition(refPosition, weights, positions) {
        const best_weight = Math.min.apply(Math, weights);
        const index = weights.indexOf(best_weight);
        const position = positions[index];

        setDialogPosition.call(this, refPosition, position);

        // TODO
    };

    /**
     * activate this step
     */
    const _activate = function _activate() {
        this.htmlElement.classList.add("activeStep");

        if (typeof this.element === 'function') {
            this.currentElement = this.element();
            this.tutorial.setControlLayer(this.currentElement, true);
            this.currentElement.classList.add('tuto_highlight');
        } else {
            this.tutorial.resetControlLayer(false);
        }
        if (this.currentElement != null) {
            const ref_pos = this.currentElement.getBoundingClientRect();
            const weights = [];
            const positions = ['down', 'left', 'top', 'right'];
            let i = 0;
            do {
                setDialogPosition.call(this, ref_pos, positions[i]);
                weights.push(standsOut.call(this));
                i += 1;
            } while (weights[i - 1] > 0 && i < positions.length);

            if (weights[i - 1] > 0) {
                fixPosition.call(this, ref_pos, weights, positions);
            }

        } else {
            this.htmlElement.style.top = ((window.innerHeight / 2) - (this.htmlElement.offsetHeight / 2)) + 'px';
            this.htmlElement.style.left = ((window.innerWidth / 2) - (this.htmlElement.offsetWidth / 2)) + 'px';
        }
        this.nextButton.focus();
    };

    /**
     * Simple Description Constructor
     *
     */
    ns.SimpleDescription = class SimpleDescription extends Wirecloud.ui.WindowMenu {

        constructor(tutorial, options) {
            super(options.title, 'simpleDescription');

            this.options = options;
            this.element = options.elem;
            this.tutorial = tutorial;
            this.layer = tutorial.msgLayer;
            this.last = false;
            this.pos = options.pos;
            this.title = options.title;
            this.nextButtonText = utils.gettext('Next');
            if (options.nextButtonText) {
                this.nextButtonText = options.nextButtonText;
            }

            this.windowContent.innerHTML = options.msg;

            this.nextButton = new se.Button({
                'class': 'nextButton btn-primary',
                'text': utils.gettext(this.nextButtonText),
            });

            this.nextButton.insertInto(this.windowBottom);

            // Cancel button
            this.cancelButton = new se.Button({
                'class': 'cancelButton',
                'text': utils.gettext("Cancel"),
            });
            this.cancelButton.insertInto(this.windowBottom);
            this.cancelButton.addEventListener('click', this._closeListener);

            this.layer.appendChild(this.htmlElement);

            this.wrapperElement = this.htmlElement;
        }

        _closeListener(e) {
            super._closeListener(e);
            this.tutorial.destroy();
        }

        /**
         * get style position.
         */
        getStylePosition() {
            return {
                posX: parseInt(this.htmlElement.style.left, 10),
                posY: parseInt(this.htmlElement.style.top, 10)
            };
        }

        /**
         * set position.
         */
        setPosition(coordinates) {
            this.htmlElement.style.left = coordinates.posX + 'px';
            this.htmlElement.style.top = coordinates.posY + 'px';
        }

        /**
         * set this SimpleDescription as the last one, don't need next button.
         */
        setLast(buttonLabel, optionalHandler) {
            this.last = true;
            this.nextButton.remove();
            if (buttonLabel == null) {
                buttonLabel = utils.gettext('Close');
            }
            this.cancelButton.setLabel(utils.gettext(buttonLabel));
            if (optionalHandler != null) {
                this.cancelButton.removeEventListener('click', this._closeListener);
                this.cancelButton.addEventListener('click', optionalHandler.bind(this));
            }
        }

        /**
         * set next handler
         */
        setNext() {
            this.nextButton.addEventListener('click', function () {
                if (this.currentElement != null) {
                    this.currentElement.classList.remove('tuto_highlight');
                }
                this.tutorial.nextStep();
            }.bind(this));
        }

        /**
         * activate this step
         */
        activate() {
            if (this.options.asynchronous) {
                this.element(_activate.bind(this));
            } else {
                _activate.call(this);
            }
        }

    }

})(Wirecloud.ui.Tutorial, StyledElements, Wirecloud.Utils);
