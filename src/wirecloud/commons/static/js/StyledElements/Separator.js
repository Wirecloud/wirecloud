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

(function () {

    "use strict";

    /**
     * @experimental
     *
     */
    var Separator = function Separator() {
        StyledElements.StyledElement.call(this, []);

        this.wrapperElement = document.createElement("hr");
    };
    Separator.prototype = new StyledElements.StyledElement();

    Separator.prototype.destroy = function destroy() {
        if (StyledElements.Utils.XML.isElement(this.wrapperElement.parentNode)) {
            StyledElements.Utils.removeFromParent(this.wrapperElement);
        }

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.Separator = Separator;

})();
