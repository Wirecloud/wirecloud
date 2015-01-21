/*
 *     Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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
    var BorderLayout = function BorderLayout(options) {
        StyledElements.StyledElement.call(this, []);

        options = StyledElements.Utils.merge({
            'class': ''
        }, options);

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = StyledElements.Utils.appendWord(options['class'], "border_layout");

        this.north = new StyledElements.Container({'class': 'north_container'});
        this.west = new StyledElements.Container({'class': 'west_container'});
        this.center = new StyledElements.Container({'class': 'center_container'});
        this.east = new StyledElements.Container({'class': 'east_container'});
        this.south = new StyledElements.Container({'class': 'south_container'});

        this.north.insertInto(this.wrapperElement);
        this.west.insertInto(this.wrapperElement);
        this.center.insertInto(this.wrapperElement);
        this.east.insertInto(this.wrapperElement);
        this.south.insertInto(this.wrapperElement);
    };
    BorderLayout.prototype = new StyledElements.StyledElement();

    BorderLayout.prototype.repaint = function repaint(temporal) {
        var usableArea = {
            'width' : this.wrapperElement.offsetWidth,
            'height': this.wrapperElement.offsetHeight
        };

        var h1 = this.north.wrapperElement.offsetHeight;
        var h2 = usableArea.height - this.south.wrapperElement.offsetHeight;
        var centerHeight = h2 - h1;
        if (centerHeight < 0) {
            centerHeight = 0;
        }

        var v1 = this.west.wrapperElement.offsetWidth;
        var v2 = usableArea.width - this.east.wrapperElement.offsetWidth;
        var centerWidth = v2 - v1;
        if (centerWidth < 0) {
            centerWidth = 0;
        }

        this.west.wrapperElement.style.top = h1 + 'px';
        this.west.wrapperElement.style.height = centerHeight + 'px';
        this.center.wrapperElement.style.top = h1 + 'px';
        this.center.wrapperElement.style.height = centerHeight + 'px';
        this.center.wrapperElement.style.width = centerWidth + 'px';
        this.center.wrapperElement.style.left = v1 + 'px';
        this.east.wrapperElement.style.top = h1 + 'px';
        this.east.wrapperElement.style.height = centerHeight + 'px';
        this.east.wrapperElement.style.left = v2 + 'px';

        this.south.wrapperElement.style.top = h2 + 'px';

        this.north.repaint(temporal);
        this.west.repaint(temporal);
        this.center.repaint(temporal);
        this.east.repaint(temporal);
        this.south.repaint(temporal);
    };

    BorderLayout.prototype.getNorthContainer = function getNorthContainer() {
        return this.north;
    };

    BorderLayout.prototype.getWestContainer = function getWestContainer() {
        return this.west;
    };

    BorderLayout.prototype.getCenterContainer = function getCenterContainer() {
        return this.center;
    };

    BorderLayout.prototype.getEastContainer = function getEastContainer() {
        return this.east;
    };

    BorderLayout.prototype.getSouthContainer = function getSouthContainer() {
        return this.south;
    };

    StyledElements.BorderLayout = BorderLayout;
})();
