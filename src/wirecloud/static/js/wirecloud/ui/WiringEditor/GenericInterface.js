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

/*global Draggable, gettext, StyledElements, Wirecloud, EzWebExt, LayoutManagerFactory */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    /*
     * GenericInterface Class
     */
    var GenericInterface = function GenericInterface(extending, wiringEditor, tittle, manager, className, clone) {
        if (extending === true) {
            return;
        }
        var i, name, variables, variable, anchor, anchorDiv, anchorLabel, desc, nameDiv, nameElement, del_button, highlight_button, copy;

        StyledElements.Container.call(this, {'class': className}, []);

        this.highlighted = true;

        this.targetAnchorsByName = {};
        this.sourceAnchorsByName = {};
        this.targetAnchors = [];
        this.sourceAnchors = [];
        this.wiringEditor = wiringEditor;
        this.tittle = tittle;
        this.className = className;
        if (manager instanceof Wirecloud.ui.WiringEditor.ArrowCreator) {
            this.isMiniInterface = false;
            this.arrowCreator = manager;
        } else {
            this.isMiniInterface = true;
            this.arrowCreator = null;
        }
        this.header = document.createElement("div");
        this.header.addClassName("header");
        this.wrapperElement.appendChild(this.header);

        //gadget name
        this.nameElement = document.createElement("span");
        this.nameElement.setTextContent(tittle);
        this.header.appendChild(this.nameElement);

        // close button, not for miniInterface
        if (!this.isMiniInterface) {
            del_button = new StyledElements.StyledButton({
                'title': gettext("Remove"),
                'class': 'closebutton',
                'plain': true
            });
            del_button.insertInto(this.header);
            del_button.addEventListener('click', function () {
                if (className == 'igadget') {
                    this.wiringEditor.removeIGadget(this);
                } else {
                    this.wiringEditor.removeIOperator(this);
                }
            }.bind(this));

            // highlight button, not for miniInterface
            /*highlight_button = new StyledElements.StyledCheckBox({
                'title': gettext("highlight"),
                'initiallyChecked': 'true'
            });*/
            this.highlight_button = new StyledElements.StyledButton({
                'title': gettext("highlight"),
                'class': 'highlight_button activated',
                'plain': true
            });
            this.highlight_button.insertInto(this.header);
            this.highlight_button.addEventListener('click', function () {
                if (this.highlighted) {
                    this.wiringEditor.unhighlightEntity(this);
                    this.unhighlight();
                } else {
                    this.wiringEditor.highlightEntity(this);
                    this.highlight();
                }
            }.bind(this));
        }

        //sources and targets for the gadget
        this.sourceDiv = document.createElement("div");
        this.sourceDiv.addClassName("sources");
        this.targetDiv = document.createElement("div");
        this.targetDiv.addClassName("targets");
        this.wrapperElement.appendChild(this.sourceDiv);
        this.wrapperElement.appendChild(this.targetDiv);

        //draggable
        if (!this.isMiniInterface) {
            this.draggable = new Draggable(this.wrapperElement, {iObject: this},
                function onStart(draggable, context) {
                    context.y = context.iObject.wrapperElement.style.top === "" ? 0 : parseInt(context.iObject.wrapperElement.style.top, 10);
                    context.x = context.iObject.wrapperElement.style.left === "" ? 0 : parseInt(context.iObject.wrapperElement.style.left, 10);
                },
                function onDrag(e, draggable, context, xDelta, yDelta) {
                    context.iObject.setPosition({posX: context.x + xDelta, posY: context.y + yDelta});
                    context.iObject.repaint();
                },
                function onFinish(draggable, context) {
                    var position = context.iObject.getStylePosition();
                    if (position.posX < 0) {
                        position.posX = 8;
                    }
                    if (position.posY < 0) {
                        position.posY = 8;
                    }
                    context.iObject.setPosition(position);
                    context.iObject.repaint();
                },
                function () {return true; }
            );
        } else { //miniInterface
            /*if (!clone) {
                this.wrapperElement.addEventListener('mousedown', this.wiringEditor.starDrag.bind(this));
            } else if (clone) {
                this.addClassName('clone');
            }*/
            this.draggable = new Draggable(this.wrapperElement, {iObject: this},
                function onStart(draggable, context) {
                    var miniwidget_clon, pos_miniwidget;

                    //initial position
                    pos_miniwidget = context.iObject.getBoundingClientRect();
                    context.y = pos_miniwidget.top - 73;
                    context.x = pos_miniwidget.left;
                    //create a minigadget clon
                    if (context.iObject instanceof Wirecloud.ui.WiringEditor.GadgetInterface) {
                        miniwidget_clon = new Wirecloud.ui.WiringEditor.GadgetInterface(context.iObject.wiringEditor,
                                            context.iObject.igadget, context.iObject.wiringEditor, true);
                    } else {
                        miniwidget_clon = new Wirecloud.ui.WiringEditor.OperatorInterface(context.iObject.wiringEditor,
                                            context.iObject.ioperator, context.iObject.wiringEditor, true);
                    }
                    miniwidget_clon.addClassName('clon');
                    //set the clon position over the originar miniGadget
                    miniwidget_clon.setBoundingClientRect(pos_miniwidget,
                     {top: -73, left: 0, width: -2, height: -10});
                    // put the minigadget clon in the layout
                    context.iObject.wiringEditor.layout.wrapperElement.appendChild(miniwidget_clon.wrapperElement);
                    //put the clon in the context.iObject
                    context.iObjectClon = miniwidget_clon;
                },
                function onDrag(e, draggable, context, xDelta, yDelta) {
                    context.iObjectClon.setPosition({posX: context.x + xDelta, posY: context.y + yDelta});
                    context.iObjectClon.repaint();
                },
                this.onFinish.bind(this),
                function () {return true; }
            );

        }//else miniInterface
    };
    GenericInterface.prototype = new StyledElements.Container({'extending': true});

    /*************************************************************************
     * Private methods
     *************************************************************************/

    /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     * get the GenericInterface position.
     */
    GenericInterface.prototype.getPosition = function getPosition() {
        var coordinates = {posX: this.wrapperElement.offsetLeft,
                           posY: this.wrapperElement.offsetTop};
        return coordinates;
    };

    /**
     * get the GenericInterface style position.
     */
    GenericInterface.prototype.getStylePosition = function getStylePosition() {
        var coordinates;
        coordinates = {posX: parseInt(this.wrapperElement.style.left, 10),
                       posY: parseInt(this.wrapperElement.style.top, 10)};
        return coordinates;
    };

    /**
     *  gets an anchor given a name
     */
    GenericInterface.prototype.getAnchor = function getAnchor(name) {
        if (name in this.sourceAnchorsByName) {
            return this.sourceAnchorsByName[name];
        } else if (name in this.targetAnchorsByName) {
            return this.targetAnchorsByName[name];
        }
    };

    /**
     * set the GenericInterface position.
     */
    GenericInterface.prototype.setPosition = function setPosition(coordinates) {
        this.wrapperElement.style.left = coordinates.posX + 'px';
        this.wrapperElement.style.top = coordinates.posY + 'px';
    };

    /**
     * set the BoundingClientRect parameters
     */
    GenericInterface.prototype.setBoundingClientRect = function setBoundingClientRect(BoundingClientRect, move) {
        this.wrapperElement.style.height = (BoundingClientRect.height + move.height) + 'px';
        this.wrapperElement.style.left = (BoundingClientRect.left + move.left) + 'px';
        this.wrapperElement.style.top = (BoundingClientRect.top + move.top) + 'px';
        this.wrapperElement.style.width = (BoundingClientRect.width + move.width) + 'px';
    };

    /**
     * set the initial position in the menubar, miniobjects.
     */
    GenericInterface.prototype.setMenubarPosition = function setMenubarPosition(menubarPosition) {
        this.menubarPosition = menubarPosition;
    };

    /**
     * set the initial position in the menubar, miniobjects.
     */
    GenericInterface.prototype.getMenubarPosition = function getMenubarPosition() {
        return this.menubarPosition;
    };
    /**
     * generic repaint
     */
    GenericInterface.prototype.repaint = function repaint(temporal) {
        var key;

        StyledElements.Container.prototype.repaint.apply(this, arguments);

        for (key in this.sourceAnchorsByName) {
            this.sourceAnchorsByName[key].repaint(temporal);
        }

        for (key in this.targetAnchorsByName) {
            this.targetAnchorsByName[key].repaint(temporal);
        }
    };

    /**
     * add Source.
     */
    GenericInterface.prototype.addSource = function addSourceAnchor(label, desc, name, anchorContext) {
        var anchor, anchorDiv, anchorLabel;
        //anchorDiv
        anchorDiv = document.createElement("div");
        //if the output have not description, take the label
        if (desc === '') {
            desc = label;
        }
        anchorDiv.setAttribute('title', desc);
        //anchor visible label
        anchorLabel = document.createElement("span");
        anchorLabel.setTextContent(label);
        anchorDiv.appendChild(anchorLabel);
        if (!this.isMiniInterface) {
            anchor = new Wirecloud.ui.WiringEditor.SourceAnchor(anchorContext, this.arrowCreator);
            anchorDiv.appendChild(anchor.wrapperElement);
            this.sourceAnchorsByName[name] = anchor;
            this.sourceAnchors.push(anchor);
        } else {
            //PseudoAnchors for mini interfaces
            anchor = document.createElement('div');
            anchor.className = 'anchor';
            anchorDiv.appendChild(anchor);
        }
        this.sourceDiv.appendChild(anchorDiv);
    };

    /**
     * add Target.
     */
    GenericInterface.prototype.addTarget = function addTarget(label, desc, name, anchorContext) {
        var anchor, anchorDiv, anchorLabel;
        //anchorDiv
        anchorDiv = document.createElement("div");
        //if the input have not description, take the label
        if (desc === '') {
            desc = label;
        }
        anchorDiv.setAttribute('title', desc);
        //anchor visible label
        anchorLabel = document.createElement("span");
        anchorLabel.setTextContent(label);
        anchorDiv.appendChild(anchorLabel);
        if (!this.isMiniInterface) {
            anchor = new Wirecloud.ui.WiringEditor.TargetAnchor(anchorContext, this.arrowCreator);
            anchorDiv.appendChild(anchor.wrapperElement);
            this.targetAnchorsByName[name] = anchor;
            this.targetAnchors.push(anchor);
        } else {
            //PseudoAnchors for mini interfaces
            anchor = document.createElement('div');
            anchor.className = 'anchor';
            anchorDiv.appendChild(anchor);
        }
        this.targetDiv.appendChild(anchorDiv);
    };

    /**
     *  add new class in to the genericInterface
     */
    GenericInterface.prototype.addClassName = function addClassName(className) {
        var atr;

        if (className == null) {
            return;
        }

        atr = this.wrapperElement.getAttribute('class');
        if (atr == null) {
            atr = '';
        }
        this.wrapperElement.setAttribute('class', EzWebExt.appendWord(atr, className));
    };

    /**
     * remove a genericInterface Class name
     */
    GenericInterface.prototype.removeClassName = function removeClassName(className) {
        var atr;

        if (className == null) {
            return;
        }

        atr = this.wrapperElement.getAttribute('class');
        if (atr == null) {
            atr = '';
        }
        this.wrapperElement.setAttribute('class', EzWebExt.removeWord(atr, className));
    };

    GenericInterface.prototype.highlight = function highlight() {
        var i;
        this.highlighted = true;
        this.removeClassName('disabled');
        this.highlight_button.addClassName('activated');
        for (i = 0; i < this.targetAnchors.length; i++) {
            this.targetAnchors[i].highlightArrows();

        }
        for (i = 0; i < this.sourceAnchors.length; i++) {
            this.sourceAnchors[i].highlightArrows();
        }
    };

    GenericInterface.prototype.unhighlight = function unhighlight() {
        var i;
        this.highlighted = false;
        this.addClassName('disabled');
        this.highlight_button.removeClassName('activated');
        for (i = 0; i < this.targetAnchors.length; i++) {
            this.targetAnchors[i].unhighlightArrows();

        }
        for (i = 0; i < this.sourceAnchors.length; i++) {
            this.sourceAnchors[i].unhighlightArrows();
        }
    };

    /**
     * Destroy
     */
    GenericInterface.prototype.destroy = function destroy() {
        var i, j, arrows;

        StyledElements.Container.prototype.destroy.call(this);

        for (i = 0; i < this.sourceAnchors.length; i += 1) {
            arrows = this.sourceAnchors[i].arrows.clone();
            for (j = 0; j < arrows.length; j += 1) {
                arrows[j].destroy();
            }
        }

        for (i = 0; i < this.targetAnchors.length; i += 1) {
            arrows = this.targetAnchors[i].arrows.clone();
            for (j = 0; j < arrows.length; j += 1) {
                arrows[j].destroy();
            }
        }
        this.draggable.destroy();
        this.draggable = null;
    };

    /*************************************************************************
     * Make GadgetInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.GenericInterface = GenericInterface;
})();
