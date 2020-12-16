/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements */


(function (se, utils) {

    "use strict";

    const clickCallback = function clickCallback(id, e) {
        e.preventDefault();
        e.stopPropagation();

        this.switchPill(id);
    };

    se.Pills = class Pills extends se.Container {

        constructor(options) {
            super(options, ['change']);

            this.wrapperElement = document.createElement("ul");
            this.wrapperElement.className = utils.appendWord(options.class, "se-pills");

            this.activePill = null;
            this.pills = {};
        }

        add(id, label) {
            var pill = document.createElement('li');
            pill.className = 'se-pill';
            pill.textContent = label;
            pill.addEventListener('click', clickCallback.bind(this, id), true);

            this.wrapperElement.appendChild(pill);

            this.pills[id] = pill;
        }

        switchPill(id) {
            if (!(id in this.pills)) {
                throw new TypeError('Invalid pill id');
            }

            if (id === this.activePill) {
                return;
            }

            if (this.activePill != null) {
                this.pills[this.activePill].classList.remove('active');
            }

            this.activePill = id;
            this.pills[this.activePill].classList.add('active');

            this.dispatchEvent('change', id);
        }

    }

})(StyledElements, StyledElements.Utils);
