/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    const onchange = function onchange() {
        if (this.inputElement.files) {
            this.dispatchEvent('fileselect', this.inputElement.files);
            this.inputElement.value = '';
        }
    };

    se.FileButton = class FileButton extends se.Button {

        constructor(options) {
            var defaultOptions = {
                'multiple': true
            };
            options = utils.merge(defaultOptions, options);

            super(options);

            Object.defineProperty(this, 'inputElement', {value: document.createElement("input")});
            this.inputElement.setAttribute("type", "file");
            this.inputElement.setAttribute("tabindex", "-1");
            this.inputElement.multiple = options.multiple;
            this.wrapperElement.appendChild(this.inputElement);

            this.events.fileselect = new StyledElements.Event();

            /* Internal events */
            this._onchange = onchange.bind(this);

            this.inputElement.addEventListener('change', this._onchange, true);
        }

        destroy() {
            this.inputElement.removeEventListener('change', this._onchange, true);

            delete this._onchange;

            super.destroy();
        }

    }

})(StyledElements, StyledElements.Utils);
