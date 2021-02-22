/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    se.VerticalLayout = class VerticalLayout extends se.StyledElement {

        constructor(options) {
            super([]);

            this.options = utils.merge({
                class: ""
            }, options);

            this.wrapperElement = document.createElement("div");
            this.wrapperElement.className = utils.appendWord(this.options.class, "se-vertical-layout");

            this.north = new StyledElements.Container({class: "se-vl-north-container"});
            this.center = new StyledElements.Container({class: "se-vl-center-container"});
            this.south = new StyledElements.Container({class: "se-vl-south-container"});

            this.north.insertInto(this.wrapperElement);
            this.center.insertInto(this.wrapperElement);
            this.south.insertInto(this.wrapperElement);
        }

        repaint(temporal) {
            this.north.repaint(temporal);
            this.center.repaint(temporal);
            this.south.repaint(temporal);
        }

    }

})(StyledElements, StyledElements.Utils);
