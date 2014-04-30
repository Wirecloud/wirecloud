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

/*global StyledElements, Wirecloud, gettext */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor SourceAnchor
     *************************************************************************/
    /**
     * Multiconnector Class
     */
    var Multiconnector = function Multiconnector(id, objectId, sourceName, layer, wiringEditor, initAnchor, endPos, height) {
        var coord, mainAnchor;

        this.id = id;
        this.objectId = objectId;
        this.sourceName = sourceName;
        this.wiringEditor = wiringEditor;
        this.initAnchor = initAnchor;
        this.mainElement = document.createElement("div");
        this.mainElement.classList.add('mainElement');
        this.statusBar = document.createElement("div");
        this.statusBar.classList.add('statusBar');
        this.menuBar = document.createElement("div");
        this.menuBar.classList.add('menuBar');
        this.arrows = [];
        this.layer = layer;
        this.height = height;
        this.arrowPositions = [];
        this.type = null;
        this.initPos = {'x': 0, 'y': 0};
        this.sticky = null;

        if (height == null || height >= 26) {
            // Default 30 px height for multiconnector
            height = 30;
        } else {
            // Transform 'em' in 'px'. When (font-size == 1em) -> 1px == 0.054em
            height = height / 0.054;
        }
        this.height = height;

        if (this.initAnchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            Wirecloud.ui.WiringEditor.TargetAnchor.call(this, initAnchor.context,
                                    initAnchor.context.iObject.arrowCreator);
            this.type = 'target';
        } else {
            Wirecloud.ui.WiringEditor.SourceAnchor.call(this, initAnchor.context,
                                    initAnchor.context.iObject.arrowCreator);
            this.type = 'source';
        }

        this.wrapperElement.appendChild(this.menuBar);
        this.wrapperElement.appendChild(this.mainElement);
        this.wrapperElement.appendChild(this.statusBar);
        this.addClassName('multiconnector');
        this.removeClassName('icon-circle');

        // Initial Position
        if (endPos == null) {
            coord = this.initAnchor.getCoordinates(this.wiringEditor.layout.getCenterContainer().wrapperElement);
        } else {
            coord = endPos;
        }

        if (this.initAnchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            if (endPos == null) {
                // 60 px initial distane between widget and multionnector + 30 px for the multiconnector width
                coord.posX -= (60 + 30);
            }
            this.wrapperElement.classList.add('target');
            mainAnchor = new Wirecloud.ui.WiringEditor.TargetAnchor(initAnchor.context, initAnchor.context.iObject.arrowCreator);
        } else {
            if (endPos == null) {
                // 60 px initial distane between widget and multionnector
                coord.posX += 60;
            }
            this.wrapperElement.classList.add('source');
            mainAnchor = new Wirecloud.ui.WiringEditor.SourceAnchor(initAnchor.context, initAnchor.context.iObject.arrowCreator);
        }
        mainAnchor.wrapperElement.classList.add('main');

        // Put this main anchor in the middle
        mainAnchor.wrapperElement.style.top = ((height - 20) / 2) + 'px';
        this.mainElement.appendChild(mainAnchor.wrapperElement);

        this.mainAnchor = mainAnchor;
        this.mainAnchor.disable();

        // Drag zone
        this.movZone = new StyledElements.StyledButton({
            'title': gettext("Drag & Drop"),
            'class': 'dragZone icon-move',
            'plain': true
        });
        this.movZone.wrapperElement.style.top = (((height - 20) / 2) + 2) + 'px';
        this.mainElement.appendChild(this.movZone.wrapperElement);

        // General position
        if (endPos == null) {
            coord.posY -= (height / 2);
        }
        this.wrapperElement.style.height = (height * 0.054) + 'em';
        this.wrapperElement.style.width = '1.63em';
        this.setPosition(coord);

        // Draggable
        this.draggable = new Wirecloud.ui.Draggable(this.movZone.wrapperElement, {iObject: this},
            function onStart(draggable, context) {
                context.y = context.iObject.wrapperElement.style.top === "" ? 0 : parseInt(context.iObject.wrapperElement.style.top, 10);
                context.x = context.iObject.wrapperElement.style.left === "" ? 0 : parseInt(context.iObject.wrapperElement.style.left, 10);
                context.iObject.disable();
                context.preselected = context.iObject.selected;
                context.iObject.select(true);
                context.iObject.wiringEditor.onStarDragSelected();
            },
            function onDrag(e, draggable, context, xDelta, yDelta) {
                context.iObject.setPosition({posX: context.x + xDelta, posY: context.y + yDelta});
                context.iObject.repaint();
                context.iObject.wiringEditor.onDragSelectedObjects(xDelta, yDelta);
            },
            function onFinish(draggable, context) {
                context.iObject.wiringEditor.onFinishSelectedObjects();
                var position = context.iObject.getStylePosition();
                if (position.posX < 0) {
                    position.posX = 8;
                }
                if (position.posY < 0) {
                    position.posY = 8;
                }
                context.iObject.setPosition(position);
                context.iObject.repaint();
                // PseudoClick
                if ((Math.abs(context.x - position.posX) < 2) && (Math.abs(context.y - position.posY) < 2)) {
                    if (context.preselected) {
                        context.iObject.unselect(true);
                    }
                } else {
                    if (!context.preselected) {
                        context.iObject.unselect(true);
                    }
                }
                context.iObject.enable();
            },
            function () {return true; }
        );
    };

    Multiconnector.prototype = new Wirecloud.ui.WiringEditor.Anchor(true);

    /**
     * Add the main arrow betwen the widget/operator and this multiconnector
     */
    Multiconnector.prototype.addMainArrow = function addMainArrow(pullerStart, pullerEnd) {
        var arrow;
        if (this.initAnchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            arrow = this.wiringEditor.canvas.drawArrow(this.mainAnchor.getCoordinates(this.layer),
                    this.initAnchor.getCoordinates(this.layer), 'multiconnector_arrow');
            arrow.startAnchor = this.mainAnchor;
            this.mainAnchor.addArrow(arrow);
            arrow.endAnchor = this.initAnchor;
            this.initAnchor.addArrow(arrow);
            arrow.multiId = this.id;
        } else {
            arrow = this.wiringEditor.canvas.drawArrow(this.initAnchor.getCoordinates(this.layer),
                    this.mainAnchor.getCoordinates(this.layer), 'multiconnector_arrow');
            arrow.startAnchor = this.initAnchor;
            this.initAnchor.addArrow(arrow);
            arrow.endAnchor = this.mainAnchor;
            this.mainAnchor.addArrow(arrow);
            arrow.multiId = this.id;
        }
        arrow.addClassName('arrow');
        if (pullerStart != null) {
            arrow.setPullerStart(pullerStart);
        }
        if (pullerEnd != null) {
            arrow.setPullerEnd(pullerEnd);
        }
        this.mainArrow = arrow;
        this.mainArrow.redraw();
        // Recalculate positions for arrows
        this.calculatePosibleAnchors();
    };


    /**
     * Add an Arrow in Multiconnector
     */
    Multiconnector.prototype.addArrow = function addArrow(theArrow) {
        this.arrows.push(theArrow);
        this.reorganizeArrows();
    };

    /**
     * Get the Multiconnector Id
     */
    Multiconnector.prototype.getId = function getId() {
        return this.id;
    };

    /**
     * Calculate the posible arrow coordinates in this multiconnector
     */
    var coord;
    Multiconnector.prototype.calculatePosibleAnchors = function calculatePosibleAnchors() {
        var i, currentSize;

        currentSize = parseFloat(this.layer.style.fontSize);
        this.mainAnchor.wrapperElement.style.top = (((this.height - 20) / 2) * currentSize) + 'px';
        this.movZone.wrapperElement.style.top = ((((this.height - 20) / 2) + 2) * currentSize) + 'px';
        coord = this.mainAnchor.getCoordinates(this.wiringEditor.layout.getCenterContainer().wrapperElement);
        coord.posY -= (this.height / 2) * currentSize;
        this.arrowPositions = [];
        if (this.initAnchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            coord.posX -= 58 * currentSize;
        } else {
            coord.posX -= 3 * currentSize;
        }

        if (this.height * currentSize < (40 * currentSize)) {
            this.arrowPositions.push({'coord': {'posX': (coord.posX + 30 * currentSize), 'posY': coord.posY + 15 * currentSize}, 'free': true});
            return;
        }
        for (i = coord.posY + 15 * currentSize; i <= (coord.posY + ((this.height - 10) * currentSize)); i += 15 * currentSize) {
            this.arrowPositions.push({'coord': {'posX': (coord.posX + 30 * currentSize), 'posY': i}, 'free': true});
        }
    };

    /**
     * Reorganize the arrows in the positions specified by arrowPositions
     * and sorted by posY destiny coordenate
     */
    Multiconnector.prototype.reorganizeArrows = function reorganizeArrows() {
        var i, j, arrow, pos, arrowsAux, totalPos, lastMax, highestArrow;
        pos = 0;
        totalPos = this.arrowPositions.length;
        arrowsAux = [];

        if (this.arrows.length === 0) {
            return;
        }

        // Sort by posY coordinate
        lastMax = 99999;
        highestArrow = -1;
        for (i = 0; i < this.arrows.length; i += 1) {
            highestArrow = this.searchMaxYArrow(lastMax, arrowsAux);
            if (highestArrow != null) {
                arrowsAux.push(this.arrows[highestArrow]);
                if (this.type == 'source') {
                    lastMax = this.arrows[highestArrow].end.posY;
                } else if (this.type == 'target') {
                    lastMax = this.arrows[highestArrow].start.posY;
                }
            }
        }
        for (j = 0; j < arrowsAux.length ; j += 1) {
            arrow = arrowsAux[arrowsAux.length - 1 - j];
            pos = this.arrowPositions[j].coord;
            this.arrowPositions[j].free = false;
            if (this.type == 'source') {
                arrow.setStart(pos);
            } else if (this.type == 'target') {
                arrow.setEnd(pos);
            }
            arrow.redraw();
        }
    };

    /**
     * Return the highest coordinate Y Arrow
     */
    Multiconnector.prototype.searchMaxYArrow = function searchMaxArrow(lastMax, findedArrows) {
        var maxY, i, y, highestArrow;
        maxY = -1000;

        for (i = 0; i < this.arrows.length; i += 1) {
            if (this.type == 'source') {
                y = this.arrows[i].end.posY;
                if ((y > maxY) && (y < lastMax)) {
                    maxY = y;
                    highestArrow = i;
                } else if ((y == lastMax) && (findedArrows.indexOf(this.arrows[i]) == -1)) {
                    maxY = y;
                    highestArrow = i;
                }
            } else if (this.type == 'target') {
                y = this.arrows[i].start.posY;
                if ((y > maxY) && (y < lastMax)) {
                    maxY = y;
                    highestArrow = i;
                } else if ((y == lastMax) && (findedArrows.indexOf(this.arrows[i]) == -1)) {
                    maxY = y;
                    highestArrow = i;
                }
            } else {
                highestArrow = null;
            }
        }
        return highestArrow;
    };

    /**
     * Stick arrow
     */
    Multiconnector.prototype.stick = function stick() {
        return this.getCoordinates(null, true);
    };

    /**
     * Unstick arrow
     */
    Multiconnector.prototype.unstick = function unstick() {
        if (this.sticky != null) {
            this.arrowPositions[this.sticky].free = true;
            this.sticky = null;
            this.resize(-15);
        } else {
            // Changing endpoints positions or bug
        }
    };

    /**
     * Get the coordinates to put an arrow in the multiconnector
     */
    Multiconnector.prototype.getCoordinates = function getCoordinates(layer, sticky) {
        var i;

        for (i = 0; i < this.arrowPositions.length; i += 1) {
            if (this.sticky != null) {
                i = this.sticky;
                this.sticky = null;
                return this.arrowPositions[i].coord;
            }
            if (this.arrowPositions[i].free) {
                this.arrowPositions[i].free = false;
                if (sticky) {
                    this.sticky = i;
                    return this.arrowPositions[i].coord;
                }
                return this.arrowPositions[i].coord;
            }
        }
        // No free anchors
        this.resize(15);
        return this.getCoordinates(layer, sticky);
    };

    /**
     * Resize the multiconnector
     */
    Multiconnector.prototype.resize = function resize(dif) {
        if (this.wrapperElement == null || (this.height + dif) < 30) {
            return;
        }
        this.height += dif;
        this.wrapperElement.style.height = (this.height * 0.054) + 'em';
        this.wrapperElement.style.top = (parseInt(this.wrapperElement.style.top, 10) - dif) + 'px';
        this.movZone.wrapperElement.style.top = ((this.height - 20) / 2) + 'px';
        this.mainAnchor.wrapperElement.style.top = ((this.height - 20) / 2) + 'px';
        this.repaint();
    };

     /**
     * Remove an arrow in the multiconnector
     */
    Multiconnector.prototype.removeArrow = function removeArrow(theArrow) {
        var index = this.arrows.indexOf(theArrow);
        if (index !== -1) {
            this.arrows.splice(index, 1);
            this.freeAnchor(theArrow);
        } else {
            this.freeAnchor(theArrow);
        }
    };


     /**
     * Get the coordinates to put an arrow in the multiconnector
     */
    Multiconnector.prototype.freeAnchor = function freeAnchor(theArrow) {
        var pos, i;
        if (theArrow.startMulti  == this.id) {
            pos = theArrow.start;
        } else if (theArrow.endMulti == this.id) {
            pos = theArrow.end;
        } else {
            // Error: 1.trying liberate anchor. Arrow don't connected with this multiconnector;
            return;
        }
        for (i = 0; i < this.arrowPositions.length; i += 1) {
            if (this.arrowPositions[i].coord.posY == pos.posY && this.arrowPositions[i].coord.posX == pos.posX) {
                this.arrowPositions[i].free = true;
                if (this.height > 40) {
                    this.resize(-15);
                }
                return;
            }
        }
        // Error:trying liberate anchor in multiconnector. Arrow don't find in multiconnector (inconsistent);
        return;
    };

    /**
     * Get the Multiconnector style position.
     */
    Multiconnector.prototype.getStylePosition = function getStylePosition() {
        var coordinates;
        coordinates = {posX: parseInt(this.wrapperElement.style.left, 10),
                       posY: parseInt(this.wrapperElement.style.top, 10)};
        return coordinates;
    };

    /**
     * Repaint
     */
    Multiconnector.prototype.repaint = function repaint(special) {
        var i, entity;

        if (this.initAnchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            this.mainArrow.setStart(this.mainAnchor.getCoordinates(this.layer));
        } else {
            this.mainArrow.setEnd(this.mainAnchor.getCoordinates(this.layer));
        }

        this.mainArrow.redraw();

        // Connections
        this.calculatePosibleAnchors();
        this.reorganizeArrows();
        // 'special' indicate if this repaint is invoked from another multiconnector
        if (!special) {
            // Making repaints if this multiconnector is connected with others multiconnectors
            for (i = 0; i < this.arrows.length; i += 1) {
                if (this.initAnchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
                    entity = this.arrows[i].startMulti;
                } else if (this.initAnchor instanceof Wirecloud.ui.WiringEditor.SourceAnchor) {
                    entity = this.arrows[i].endMulti;
                }
                if (entity != null) {
                    // special = true;
                    this.wiringEditor.multiconnectors[entity].repaint(true);
                }
            }
        }
    };

    /**
     * Get the Multiconnector position.
     */
    Multiconnector.prototype.getPosition = function getPosition() {
        var coordinates = {posX: this.wrapperElement.offsetLeft,
                           posY: this.wrapperElement.offsetTop};
        return coordinates;
    };

    /**
     * get the Multiconnector style position.
     */
    Multiconnector.prototype.getStylePosition = function getStylePosition() {
        var coordinates;
        coordinates = {posX: parseInt(this.wrapperElement.style.left, 10),
                       posY: parseInt(this.wrapperElement.style.top, 10)};
        return coordinates;
    };

    /**
     * set the Multiconnector position.
     */
    Multiconnector.prototype.setPosition = function setPosition(coordinates) {
        this.wrapperElement.style.left = coordinates.posX + 'px';
        this.wrapperElement.style.top = coordinates.posY + 'px';
    };

    /**
     *  add new class in to the Multiconnector
     */
    Multiconnector.prototype.addClassName = function addClassName(className) {
        var atr;

        if (className == null) {
            return;
        }

        atr = this.wrapperElement.getAttribute('class');
        if (atr == null) {
            atr = '';
        }
        this.wrapperElement.setAttribute('class', Wirecloud.Utils.appendWord(atr, className));
    };

    /**
     * remove a Multiconnector Class name
     */
    Multiconnector.prototype.removeClassName = function removeClassName(className) {
        var atr;

        if (className == null) {
            return;
        }

        atr = this.wrapperElement.getAttribute('class');
        if (atr == null) {
            atr = '';
        }
        this.wrapperElement.setAttribute('class', Wirecloud.Utils.removeWord(atr, className));
    };

    /**
     * Select this Multiconnector
     */
    Multiconnector.prototype.select = function select(withCtrl) {
        var i;
        if (this.hasClassName('selected')) {
            return;
        }
        if (!(this.wiringEditor.ctrlPushed) && (this.wiringEditor.selectedCount > 0) && (withCtrl)) {
            this.wiringEditor.resetSelection();
        }
        this.selected = true;
        this.addClassName('selected');

        // Arrows
        this.mainArrow.emphasize();
        for (i = 0; i < this.arrows.length; i += 1) {
            this.arrows[i].emphasize();
        }
        this.wiringEditor.addSelectedObject(this);
    };

    /**
     * Unselect this Multiconnector
     */
    Multiconnector.prototype.unselect = function unselect(withCtrl) {
        var i;
        this.selected = false;
        this.removeClassName('selected');
        //arrows
        this.mainArrow.deemphasize();
        for (i = 0; i < this.arrows.length; i += 1) {
            this.arrows[i].deemphasize();
        }

        this.wiringEditor.removeSelectedObject(this);
        if (!(this.wiringEditor.ctrlPushed) && (this.wiringEditor.selectedCount > 0) && (withCtrl)) {
            this.wiringEditor.resetSelection();
        }
    };

    /**
     * Destroy
     */
    Multiconnector.prototype.destroy = function destroy(totally) {
        var i;

        Wirecloud.ui.WiringEditor.Anchor.prototype.destroy.call(this);

        this.wrapperElement = null;
        this.mainElement = null;
        this.statusBar = null;
        this.menuBar = null;
        // canvas == null to avoid the event arrowremoved in this arrow
        this.mainArrow.canvas = null;
        this.mainArrow.destroy();
        if (totally) {
            for (i = this.arrows.length - 1; i >= 0; i -= 1) {
                this.arrows[i].destroy();
            }
        }
    };

    /*************************************************************************
     * Make Multiconnector public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.Multiconnector = Multiconnector;
})();

