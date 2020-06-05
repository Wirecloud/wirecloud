/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

    var clickCallback = function clickCallback(id, e) {
        e.preventDefault();
        e.stopPropagation();

        this.switchPill(id);
    };

    var Pills = function Pills(options) {
        var defaultOptions = {
            'class': ''
        };
        options = utils.merge(defaultOptions, options);

        StyledElements.StyledElement.call(this, ['change']);

        this.wrapperElement = document.createElement("ul");
        this.wrapperElement.className = utils.appendWord(options.class, "se-pills");

        this.activePill = null;
        this.pills = {};
    };
    utils.inherit(Pills, StyledElements.Container);

    Pills.prototype.add = function add(id, label) {
        var pill = document.createElement('li');
        pill.className = 'se-pill';
        pill.textContent = label;
        pill.addEventListener('click', clickCallback.bind(this, id), true);

        this.wrapperElement.appendChild(pill);

        this.pills[id] = pill;
    };

    Pills.prototype.switchPill = function switchPill(id) {
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
    };

    StyledElements.Pills = Pills;

})(StyledElements.Utils);
