/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    const disableCallback = function disableCallback(e) {

        if (e.button !== 0) {
            return;
        }

        var boundingBox = this.wrapperElement.getBoundingClientRect();

        if (e.clientX < boundingBox.left || e.clientX > boundingBox.right || e.clientY < boundingBox.top || e.clientY > boundingBox.bottom) {
            setTimeout(this.hide.bind(this), 0);
        }
    };

    se.PopupMenu = class PopupMenu extends se.PopupMenuBase {

        /**
         * @since 0.5
         * @extends StyledElements.PopupMenuBase
         */
        constructor(options) {
            super(options);

            this._disableCallback = disableCallback.bind(this);
        }

        show(refPosition) {
            document.addEventListener("click", this._disableCallback, true);

            return super.show(refPosition);
        }

        hide() {
            super.hide();

            document.removeEventListener("click", this._disableCallback, true);
            document.removeEventListener("contextmenu", this._disableCallback, true);

            return this;
        }

        destroy() {
            this._disableCallback = null;

            super.destroy();
        }

    }

})(StyledElements, StyledElements.Utils);
