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

/* globals StyledElements */


(function (se, utils) {

    "use strict";

    /**
     * Permite distribuir contenidos según un border layout.
     */
    se.HorizontalLayout = class HorizontalLayout extends se.StyledElement {

        constructor(options) {
            super([]);

            this.options = utils.merge({
                class: ''
            }, options);

            this.wrapperElement = document.createElement('div');
            this.wrapperElement.className = utils.appendWord(this.options.class, "se-horizontal-layout");

            this.west = new StyledElements.Container({class: 'se-hl-west-container'});
            this.center = new StyledElements.Container({class: 'se-hl-center-container'});
            this.east = new StyledElements.Container({class: 'se-hl-east-container'});

            this.west.insertInto(this.wrapperElement);
            this.center.insertInto(this.wrapperElement);
            this.east.insertInto(this.wrapperElement);
        }

        repaint(temporal) {
            this.west.repaint(temporal);
            this.center.repaint(temporal);
            this.east.repaint(temporal);
        }

        /**
         * @deprecated
         */
        getWestContainer() {
            return this.west;
        }

        /**
         * @deprecated
         */
        getCenterContainer() {
            return this.center;
        }

        /**
         * @deprecated
         */
        getEastContainer() {
            return this.east;
        }

    }

})(StyledElements, StyledElements.Utils);
