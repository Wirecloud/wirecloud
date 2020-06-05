/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    /**
     * Permite distribuir contenidos según un border layout.
     */
    var HorizontalLayout = function HorizontalLayout(options) {
        StyledElements.StyledElement.call(this, []);

        this.options = utils.merge({
            'class': ''
        }, options);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = utils.appendWord(this.options.class, "se-horizontal-layout");

        this.west = new StyledElements.Container({'class': 'se-hl-west-container'});
        this.center = new StyledElements.Container({'class': 'se-hl-center-container'});
        this.east = new StyledElements.Container({'class': 'se-hl-east-container'});

        this.west.insertInto(this.wrapperElement);
        this.center.insertInto(this.wrapperElement);
        this.east.insertInto(this.wrapperElement);
    };
    utils.inherit(HorizontalLayout, StyledElements.StyledElement);

    HorizontalLayout.prototype.repaint = function repaint(temporal) {
        this.west.repaint(temporal);
        this.center.repaint(temporal);
        this.east.repaint(temporal);
    };

    HorizontalLayout.prototype.getWestContainer = function getWestContainer() {
        return this.west;
    };

    HorizontalLayout.prototype.getCenterContainer = function getCenterContainer() {
        return this.center;
    };

    HorizontalLayout.prototype.getEastContainer = function getEastContainer() {
        return this.east;
    };

    StyledElements.HorizontalLayout = HorizontalLayout;

})(StyledElements.Utils);
