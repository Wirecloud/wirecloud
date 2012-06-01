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

/*global Draggable, gettext, StyledElements, Wirecloud, EzWebExt */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    /*
     * GenericInterface Class
     */
    var GenericInterface = function GenericInterface(extending, wiringEditor, tittle, manager, className) {
        if (extending === true) {
            return;
        }
        var i, name, variables, variable, anchor, anchorDiv, anchorLabel, desc, nameDiv, nameElement, del_button, highlight_button;

        StyledElements.Container.call(this, {'class': className}, []);

        this.highlighted = true;

        this.targetAnchorsByName = {};
        this.sourceAnchorsByName = {};
        this.targetAnchors = [];
        this.sourceAnchors = [];
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
                    wiringEditor.removeGadget(this);
                } else {
                    wiringEditor.removeOperator(this);
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
                    wiringEditor.unhighlightEntity(this);
                    this.unhighlight();
                } else {
                    wiringEditor.highlightEntity(this);
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
            this.draggable = new Draggable(this.wrapperElement, this.wrapperElement, this,
                function () {},
                function (e, draggable, iObject) {
                    iObject.repaint();
                },
                function onFinish(draggable, data) {
                    var position = data.getStylePosition();
                    if (position.posX < 0) {
                        position.posX = 0;
                    }
                    if (position.posY < 0) {
                        position.posY = 0;
                    }
                    data.setPosition(position);
                    data.repaint();
                },
                function () {return true; }
            );
        } else {
            this.draggable = new Draggable(this.wrapperElement, this.wrapperElement, {initialPos: null, entity: this},
                function onStart(draggable, data, event) {
                    var objectPos;
                    objectPos = data.entity.getPosition();
                    recalculateEventOffset(event);
                    objectPos.posX = objectPos.posX - event.offsetX;
                    objectPos.posY = objectPos.posY - event.offsetY;
                    data.initialPos = objectPos;
                },
                function (e, draggable, data, X, Y) {
                    data.entity.repaint();
                },
                this.onFinish.bind(this),
                function (draggable, data) {return data.entity.enabled; }
            );
        }
    };
    GenericInterface.prototype = new StyledElements.Container({'extending': true});


    /*************************************************************************
     * Private methods
     *************************************************************************/
    /**
    * change the value of event.offsetX and offsetY, for the offsetLeft and 
    * offsetTop acumulated from initial element to the iObject container.
    */
    var recalculateEventOffset = function (ev) {
        var offsetLeft, offsetTop, menubarOffsetLeft, menubarOffsetTop, pointerMov;
        offsetLeft = 0;
        offsetTop = 0;
        menubarOffsetLeft = 0;
        menubarOffsetTop = 0;
        var target = ev.target;
        while (!target.hasClassName('menubar')) {
            menubarOffsetLeft += target.offsetLeft;
            target = target.parentNode;
        }
        target = ev.target;
        while (!target.hasClassName('menubar')) {
            menubarOffsetTop += target.offsetTop;
            target = target.parentNode;
        }
        target = ev.target;
        while (!target.hasClassName('container')) {
            offsetLeft += target.offsetLeft;
            target = target.parentNode;
        }
        target = ev.target;
        while (!target.hasClassName('container')) {
            offsetTop += target.offsetTop;
            target = target.parentNode;
        }
        pointerMov = {posX: ev.clientX - menubarOffsetLeft, posY: ev.clientY - menubarOffsetTop - 90};

        ev.offsetX =  offsetLeft + pointerMov.posX;
        ev.offsetY =  offsetTop + pointerMov.posY;
        return ev;
    };
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
        this.draggable.destroy();
        this.draggable = null;
    };

    /*************************************************************************
     * Make GadgetInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.GenericInterface = GenericInterface;
})();
