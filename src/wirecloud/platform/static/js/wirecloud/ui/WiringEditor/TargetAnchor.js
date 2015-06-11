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
     * Constructor TargetAnchor
     *************************************************************************/
    /**
     * TargetAnchor Class
     */
    var TargetAnchor = function TargetAnchor(context, arrowCreator, isGhost) {
        this.context = context;
        this.superClass(arrowCreator, isGhost);
        this.arrowCreator = arrowCreator;
        this.type = 'target';
    };

    StyledElements.Utils.inherit(TargetAnchor, Wirecloud.ui.WiringEditor.Anchor);

    /*************************************************************************
     * Public methods
     *************************************************************************/
    /**
     * repaint the TargetAnchor
     */
    TargetAnchor.prototype.repaint = function repaint() {
        var i, coordinates;

        coordinates = this.getCoordinates(this.context.iObject.wiringEditor.getGridElement());
        for (i = 0; i < this.arrows.length; i += 1) {
            this.arrows[i].setEnd(coordinates);
            this.arrows[i].redraw();
        }
    };

    /*************************************************************************
     * Make TargetAnchor public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.TargetAnchor = TargetAnchor;
})();
