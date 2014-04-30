/*
 *     DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER
 *
 *     Copyright (c) 2012-2013 Universidad Politécnica de Madrid
 *     Copyright (c) 2012-2013 the Center for Open Middleware
 *
 *     Licensed under the Apache License, Version 2.0 (the
 *     "License"); you may not use this file except in compliance
 *     with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing,
 *     software distributed under the License is distributed on an
 *     "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *     KIND, either express or implied.  See the License for the
 *     specific language governing permissions and limitations
 *     under the License.
 */


/*global StyledElements, Wirecloud */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor SourceAnchor
     *************************************************************************/
    /**
     * SourceAnchor Class
     */
    var SourceAnchor = function SourceAnchor(context, arrowCreator, subAnchors, isGhost) {
        this.context = context;
        Wirecloud.ui.WiringEditor.Anchor.call(this, false, arrowCreator, isGhost);
        this.arrowCreator = arrowCreator;
        if (subAnchors != null) {
            this.isSubAnchor = true;
            this.subAnchors = subAnchors;
        } else {
            this.isSubAnchor = false;
            this.subAnchors = null;
        }
    };
    SourceAnchor.prototype = new Wirecloud.ui.WiringEditor.Anchor(true);

    /*************************************************************************
     * Public methods
     *************************************************************************/
    /**
     * Repaint the SourceAnchor
     */
    SourceAnchor.prototype.repaint = function repaint() {
        var i, coordinates;

        coordinates = this.getCoordinates(this.context.iObject.wiringEditor.getGridElement());
        for (i = 0; i < this.arrows.length; i += 1) {
            if (this.arrows[i].startMulti == null) {
                this.arrows[i].setStart(coordinates);
                this.arrows[i].redraw();
            }
            if (this.arrows[i].endMulti != null) {
                this.context.iObject.wiringEditor.multiconnectors[this.arrows[i].endMulti].repaint();
            }
        }
    };

    /*************************************************************************
     * Make SourceAnchor public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.SourceAnchor = SourceAnchor;
})();
