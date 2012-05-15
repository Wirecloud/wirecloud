/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50, prototypejs: true */
/*global StyledElements, Wirecloud */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor SourceAnchor
     *************************************************************************/
    /*
     * SourceAnchor Class
     */
    var SourceAnchor = function SourceAnchor(context, arrowCreator) {
        this.context = context;
        Wirecloud.ui.WiringEditor.Anchor.call(this, false, arrowCreator);
    };
    SourceAnchor.prototype = new Wirecloud.ui.WiringEditor.Anchor(true);

    /*************************************************************************
     * Public methods
     *************************************************************************/
    SourceAnchor.prototype.repaint = function repaint(temporal) {
        var i, coordinates;

        coordinates = this.getCoordinates(document.getElementsByClassName('wiring_editor')[0]);
        for (i = 0; i < this.arrows.length; i += 1) {
            this.arrows[i].setStart(coordinates);
            this.arrows[i].redraw();
        }
    };

    /*************************************************************************
     * Make SourceAnchor public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.SourceAnchor = SourceAnchor;
})();
