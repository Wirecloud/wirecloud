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
/*global gettext, Element, WindowMenu, BrowserUtilsFactory, Event, LayoutManagerFactory, StyledElements, interpolate */

(function () {

    "use strict";
    
    /*************************************************************************
     * Constructor
     *************************************************************************/
    /*
     * OperatorInterface Class
     */
    var OperatorInterface = function OperatorInterface(wiringEditor, ioperator, manager) {
        var i, anchor, anchorDiv, anchorLabel, desc, nameDiv, nameElement, label, arrowCreator = null,
            inputs, outputs;

        this.ioperator = ioperator;
        this.targetAnchorsByName = {};
        this.targetAnchors = []
        this.sourceAnchorsByName = {};
        this.sourceAnchors = [];
        StyledElements.Container.call(this, {'class': 'ioperator'}, []);
        this.shaperDiv = document.createElement("div");
        this.shaperDiv.addClassName("shaperDiv");
        this.wrapperElement.appendChild(this.shaperDiv);
        this.operatorHeader = document.createElement("div");
        this.operatorHeader.addClassName("header");
        this.shaperDiv.appendChild(this.operatorHeader);

        if (manager instanceof Wirecloud.ui.WiringEditor.ArrowCreator) {
            arrowCreator = manager;
            this.isMiniGadget = false;
            this.draggable = new Draggable(this.wrapperElement, this.wrapperElement, this,
                function () {},
                function (e, draggable, operator) {
                    operator.repaint();
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
                function () {return true}
            );
        } else {
            this.isMiniGadget = true;
            this.draggable = new Draggable(this.wrapperElement, this.wrapperElement, this,
                function () {},
                function (e, draggable, operator) {
                    operator.repaint();
                },
                function onFinish(draggable, data) {
                    var operator_interface = manager.addIOperator(ioperator.meta);
                    operator_interface.setPosition(data.getPosition());
                    data.setPosition({posX: 0, posY: 0});
                },
                function (draggable, data) {return data.enabled}
            );
        }
        
        //operator name
        nameElement = document.createElement("span");
        nameElement.setTextContent(ioperator.getName());
        this.operatorHeader.appendChild(nameElement);
        if (!this.isMiniGadget) {
            //close button
            var del_button = new StyledElements.StyledButton({
                'title': gettext("Remove"),
                'class': 'closebutton',
                'plain': true
            });
            del_button.insertInto(this.operatorHeader);
            del_button.addEventListener('click', function () {
                wiringEditor.removeOperator(this);
            }.bind(this));
        }
        //sources and targets Divs for the operator
        inputs = ioperator.getInputs();
        outputs = ioperator.getOutputs();
        this.sourceDiv = document.createElement("div");
        this.sourceDiv.addClassName("sources");
        this.targetDiv = document.createElement("div");
        this.targetDiv.addClassName("targets");
                this.shaperDiv.appendChild(this.sourceDiv);
        this.shaperDiv.appendChild(this.targetDiv);
        
        //sources & targets anchors (sourceAnchor and targetAnchor)
        for (i = 0; i < outputs.length; i++) {
            anchorDiv = document.createElement("div");
            desc = outputs[i].meta.getDescription();
            label = outputs[i].meta.getLabel();
            //if the output have not description, take the label
            if (desc == '') {
                desc = label;
            }
            anchorDiv.setAttribute('title', desc);
            //anchor visible label
            anchorLabel = document.createElement("span");
            anchorLabel.setTextContent(label);
            anchorDiv.appendChild(anchorLabel);
            if (arrowCreator != null) {
                anchor = new Wirecloud.ui.WiringEditor.SourceAnchor(outputs[i], arrowCreator);
                anchorDiv.appendChild(anchor.wrapperElement);
                this.sourceAnchorsByName[outputs[i].meta.getName()] = anchor;
                this.sourceAnchors.push(anchor);
            } else {
                // Psuedo-anchor
                anchor = document.createElement('div');
                anchor.className = 'anchor';
                anchorDiv.appendChild(anchor);
            }
            this.sourceDiv.appendChild(anchorDiv);
        }
        for (i = 0; i < inputs.length; i++) {
            anchorDiv = document.createElement("div");
            desc = inputs[i].meta.getDescription();
            label = inputs[i].meta.getLabel();
            //if the output have not description, take the label
            if (desc == '') {
                desc = label;
            }
            anchorDiv.setAttribute('title', desc);
            //anchor visible label
            anchorLabel = document.createElement("span");
            anchorLabel.setTextContent(label);
            anchorDiv.appendChild(anchorLabel);
            if (arrowCreator != null) {
                anchor = new Wirecloud.ui.WiringEditor.TargetAnchor(inputs[i], arrowCreator);
                anchorDiv.appendChild(anchor.wrapperElement);
                this.targetAnchorsByName[inputs[i].meta.getName()] = anchor;
                this.targetAnchors.push(anchor);
            } else {
                // Psuedo-anchor
                anchor = document.createElement('div');
                anchor.className = 'anchor';
                anchorDiv.appendChild(anchor);
            }
            this.targetDiv.appendChild(anchorDiv);
        }

        Object.defineProperty(this, 'sourceAnchors', {value: this.sourceAnchors});
        Object.defineProperty(this, 'targetAnchors', {value: this.targetAnchors});
        Object.defineProperty(this, 'sourceAnchorsByName', {value: this.sourceAnchorsByName});
        Object.defineProperty(this, 'targetAnchorsByName', {value: this.targetAnchorsByName});
        Object.preventExtensions(this.sourceAnchors);
        Object.preventExtensions(this.targetAnchors);
        Object.preventExtensions(this.sourceAnchorsByName);
        Object.preventExtensions(this.targetAnchorsByName);
    };
    /*************************************************************************
     * Private methods
     *************************************************************************/
     
     /*************************************************************************
     * Public methods
     *************************************************************************/

    /*
     * Container
     */
    OperatorInterface.prototype = new StyledElements.Container({'extending': true});

    /*
     * get the gadget name, (same name for all operator instances of the same operatorMeta).
     */
    OperatorInterface.prototype.getName = function getName () {
        return this.ioperator.getName();
    };

    /*
     * get the gadget instance id, (unique for each ioperator).
     */
    OperatorInterface.prototype.getId = function get () {
        return this.ioperator.getId();
    };

    OperatorInterface.prototype.getIOperator = function getIOperator() {
        return this.ioperator;
    };

    OperatorInterface.prototype.repaint = function repaint (temporal) {
        var key;

        StyledElements.Container.prototype.repaint.apply(this, arguments);

        for (key in this.sourceAnchorsByName) {
            this.sourceAnchorsByName[key].repaint(temporal);
        }

        for (key in this.targetAnchorsByName) {
            this.targetAnchorsByName[key].repaint(temporal);
        }
    };

    /*
     * get the gadget position.
     */
    OperatorInterface.prototype.getPosition = function getPosition () {
        var coordinates = {posX: this.wrapperElement.offsetLeft,
                           posY: this.wrapperElement.offsetTop};
        return coordinates;
    };

    /**
     *  gets an anchor given a name
     */
    OperatorInterface.prototype.getAnchor = function getAnchor(name) {
        if (name in this.sourceAnchorsByName) {
            return this.sourceAnchorsByName[name];
        } else if (name in this.targetAnchorsByName) {
            return this.targetAnchorsByName[name];
        }
    };

    /*
     * set the gadget position.
     */
    OperatorInterface.prototype.setPosition = function setPosition (coordinates) {
        this.wrapperElement.style.left = coordinates.posX + 'px';
        this.wrapperElement.style.top = coordinates.posY + 'px';
    };

    /*
     * Destroy
     */
    OperatorInterface.prototype.destroy = function destroy () {
        
        StyledElements.Container.prototype.destroy.call(this);
        this.draggable.destroy();
        this.draggable = null;
    };
    /*************************************************************************
     * Make OperatorInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.OperatorInterface = OperatorInterface;
})();
