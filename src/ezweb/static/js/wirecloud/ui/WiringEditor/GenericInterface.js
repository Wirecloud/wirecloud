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

/*global Draggable, gettext, StyledElements, Wirecloud */

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
        var i, name, variables, variable, anchor, anchorDiv, anchorLabel, desc, nameDiv, nameElement, del_button;

        StyledElements.Container.call(this, {'class': className}, []);

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
                wiringEditor.removeInterface(this);
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
                    var position = data.getPosition();
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
            this.draggable = new Draggable(this.wrapperElement, this.wrapperElement, this,
                function () {},
                function (e, draggable, iObject) {
                    iObject.repaint();
                },
                this.onFinish.bind(this),
                function (draggable, data) {return data.enabled; }
            );
        }

        /*Object.defineProperty(this, 'sourceAnchorsByName', {value: this.sourceAnchorsByName});
        Object.defineProperty(this, 'targetAnchorsByName', {value: this.targetAnchorsByName});
        Object.preventExtensions(this.sourceAnchorsByName);
        Object.preventExtensions(this.targetAnchorsByName);
        Object.defineProperty(this, 'sourceAnchors', {value: this.sourceAnchors});
        Object.defineProperty(this, 'targetAnchors', {value: this.targetAnchors});
        Object.preventExtensions(this.sourceAnchors);
        Object.preventExtensions(this.targetAnchors);*/
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
