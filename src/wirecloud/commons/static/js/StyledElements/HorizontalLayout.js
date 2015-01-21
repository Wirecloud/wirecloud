/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global StyledElements, Wirecloud*/

(function () {

    "use strict";

    /**
     * Permite distribuir contenidos según un border layout.
     */
    var HorizontalLayout = function HorizontalLayout(options) {
        StyledElements.StyledElement.call(this, []);

        this.options = StyledElements.Utils.merge({
            'class': '',
            'autoHeight': true
        }, options);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = StyledElements.Utils.appendWord(this.options['class'], "horizontal_layout");

        this.west = new StyledElements.Container({'class': 'west_container'});
        this.center = new StyledElements.Container({'class': 'center_container'});
        this.east = new StyledElements.Container({'class': 'east_container'});

        this.west.insertInto(this.wrapperElement);
        this.center.insertInto(this.wrapperElement);
        this.east.insertInto(this.wrapperElement);
    };
    HorizontalLayout.prototype = new StyledElements.StyledElement();

    HorizontalLayout.prototype.insertInto = function insertInto(element, refElement) {
        StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);
        this.repaint();
    };

    HorizontalLayout.prototype.repaint = function repaint(temporal) {
        var usableWidth = this.wrapperElement.offsetWidth;

        var v1 = this.west.wrapperElement.offsetWidth;
        var v2 = usableWidth - this.east.wrapperElement.offsetWidth;
        var centerWidth = v2 - v1;
        if (centerWidth < 0) {
            centerWidth = 0;
        }

        var height = Math.max(
            this.west.wrapperElement.offsetHeight,
            this.center.wrapperElement.offsetHeight,
            this.east.wrapperElement.offsetHeight
        );

        this.center.wrapperElement.style.width = centerWidth + 'px';
        this.center.wrapperElement.style.left = v1 + 'px';
        this.east.wrapperElement.style.left = v2 + 'px';
        if (this.options.autoHeight) {
            this.wrapperElement.style.height = height + 'px';
        }

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
})();
