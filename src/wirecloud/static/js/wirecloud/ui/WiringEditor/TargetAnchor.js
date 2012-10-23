/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
 *     (C) Copyright 2012 Center for Open Middleware
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


/*global StyledElements, Wirecloud */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor TargetAnchor
     *************************************************************************/
    /*
     * TargetAnchor Class
     */
    var TargetAnchor = function TargetAnchor(context, arrowCreator) {
        this.context = context;
        Wirecloud.ui.WiringEditor.Anchor.call(this, false, arrowCreator);
        this.arrowCreator = arrowCreator;
    };
    TargetAnchor.prototype = new Wirecloud.ui.WiringEditor.Anchor(true);

    /*************************************************************************
     * Public methods
     *************************************************************************/
    TargetAnchor.prototype.repaint = function repaint(temporal) {
        var i, coordinates;

        coordinates = this.getCoordinates(document.getElementsByClassName('grid')[0]);
        /* Multiple Connector */
        for (i = 0; i < this.arrows.length; i += 1) {
            if (this.arrows[i].endMulti == null) {
                this.arrows[i].setEnd(coordinates);
                this.arrows[i].redraw();
            }
            if (this.arrows[i].startMulti != null) {
                this.context.iObject.wiringEditor.multiconnectors[this.arrows[i].startMulti].repaint();
            }
        }
    };

    /*************************************************************************
     * Make TargetAnchor public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.TargetAnchor = TargetAnchor;
})();
