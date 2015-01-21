/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global StyledElements*/

(function () {

    "use strict";

    /**
     *
     */
    var MenuItem = function MenuItem(text, handler, context) {
        StyledElements.StyledElement.call(this, ['click', 'mouseover', 'mouseout']);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.classList.add("se-popup-menu-item");

        var span = document.createElement("span");
        span.appendChild(document.createTextNode(text));
        this.wrapperElement.appendChild(span);

        this.run = handler;
        this.context = context;

        // Internal events
        this._mouseoverEventHandler = function (event) {
            if (this.enabled) {
                this.wrapperElement.classList.add("hovered");
                this.events.mouseover.dispatch(this);
            }
        }.bind(this);
        this.wrapperElement.addEventListener("mouseover", this._mouseoverEventHandler, false);
        this._mouseoutEventHandler = function (event) {
            if (this.enabled) {
                this.wrapperElement.classList.remove("hovered");
                this.events.mouseout.dispatch(this);
            }
        }.bind(this);
        this.wrapperElement.addEventListener("mouseout", this._mouseoutEventHandler, false);

        this._clickHandler = function (event) {
            event.stopPropagation();
            if (this.enabled) {
                this.wrapperElement.classList.remove("hovered");
                this.events.mouseout.dispatch(this);
                this.events.click.dispatch(this);
            }
        }.bind(this);
        this.wrapperElement.addEventListener("click", this._clickHandler, true);
    };
    MenuItem.prototype = new StyledElements.StyledElement();

    MenuItem.prototype.destroy = function destroy() {
        if (StyledElements.Utils.XML.isElement(this.wrapperElement.parentNode)) {
            StyledElements.Utils.removeFromParent(this.wrapperElement);
        }
        this.wrapperElement.removeEventListener("mouseover", this._mouseoverEventHandler, false);
        this.wrapperElement.removeEventListener("mouseout", this._mouseoutEventHandler, false);
        this.wrapperElement.removeEventListener("click", this._clickHandler, true);

        this._mouseoverEventHandler = null;
        this._mouseoutEventHandler = null;
        this._clickHandler = null;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.MenuItem = MenuItem;

})();
