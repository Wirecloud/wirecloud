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
     * GadgetInterface Class
     */
    var GadgetInterface = function GadgetInterface(wiringEditor, igadget, manager) {
        var i, name, variables, variable, anchor, anchorDiv, anchorLabel, desc, nameDiv, nameElement,
            arrowCreator = null;

        this.targetAnchorsByName = {};
        this.sourceAnchorsByName = {};
        this.targetAnchors = [];
        this.sourceAnchors = [];
        StyledElements.Container.call(this, {'class': 'igadget'}, []);
        this.gadgetHeader = document.createElement("div");
        this.gadgetHeader.addClassName("header");
        this.wrapperElement.appendChild(this.gadgetHeader);

        //make draggable
        if (manager instanceof Wirecloud.ui.WiringEditor.ArrowCreator) {
            this.isMiniGadget = false;
            arrowCreator = manager;
            this.draggable = new Draggable(this.wrapperElement, this.wrapperElement, this,
                function () {},
                function (e, draggable, widget) {
                    widget.repaint();
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
        } else if (manager instanceof Wirecloud.ui.WiringEditor) {
            this.isMiniGadget = true;
            this.draggable = new Draggable(this.wrapperElement, this.wrapperElement, this,
                function () {},
                function (e, draggable, widget) {
                    widget.repaint();
                },
		        function onFinish(draggable, igadget_interface) {
		            var position, new_igadget_interface = manager.addIGadget(wiringEditor, igadget);

                    // MAGIC code
		            position = igadget_interface.getPosition();
		            igadget_interface.setPosition({posX: 0, posY: 0});
		            position.posY -= 68 - igadget_interface.wrapperElement.offsetTop;
		            new_igadget_interface.setPosition(position);

		            igadget_interface.disable();
		        },
                function (draggable, data) {return data.enabled}
            );
        }

        //gadget name
        this.igadget = igadget;
        nameElement = document.createElement("span");
        nameElement.setTextContent(igadget.name);
        this.gadgetHeader.appendChild(nameElement);

        if (!this.isMiniGadget) {
            // close button
            var del_button = new StyledElements.StyledButton({
                'title': gettext("Remove"),
                'class': 'closebutton',
                'plain': true
            });
            del_button.insertInto(this.gadgetHeader);
            del_button.addEventListener('click', function () {
                wiringEditor.removeGadget(this);
            }.bind(this));
        }

        //sources and targets for the gadget
        variables = opManager.activeWorkSpace.varManager.getIGadgetVariables(igadget.getId());
        this.targetDiv = new StyledElements.Container({"class": "targets"});
        this.sourceDiv = new StyledElements.Container({"class": "sources"});
		this.appendChild(this.sourceDiv);
        this.appendChild(this.targetDiv);
        for (name in variables) {
            variable = variables[name];
            //each Event
            if (variable.vardef.aspect === Variable.prototype.EVENT) {
                anchorDiv = new StyledElements.Container();
                desc = variable.vardef.description;
                //if the variable have not description, take the label
                if (desc == '') {
                    desc = variable.vardef.label;
                }
                anchorDiv.wrapperElement.setAttribute('title', desc);
                //anchor visible label
                anchorLabel = document.createElement("span");
                anchorLabel.setTextContent(variable.vardef.label);
                anchorDiv.appendChild(anchorLabel);
                if (arrowCreator != null) {
                    anchor = new Wirecloud.ui.WiringEditor.SourceAnchor(variable, arrowCreator);
                    this.sourceAnchorsByName[variable.vardef.name] = anchor;
                    this.sourceAnchors.push(anchor);
                } else {
                    // Psuedo-anchor
                    anchor = document.createElement('div');
                    anchor.className = 'anchor';
                }
                anchorDiv.appendChild(anchor);
                this.sourceDiv.appendChild(anchorDiv);

            //each Slot
            } else if (variable.vardef.aspect === Variable.prototype.SLOT) {
                anchorDiv = new StyledElements.Container();
                desc = variable.vardef.description;
                if (desc == '') {
                    desc = variable.vardef.label;
                }
                anchorDiv.wrapperElement.setAttribute('title', desc);
                anchorLabel = document.createElement("span");
                anchorLabel.setTextContent(variable.vardef.label);
                if (arrowCreator != null) {
                    anchor = new Wirecloud.ui.WiringEditor.TargetAnchor(variable, arrowCreator);
                    this.targetAnchorsByName[variable.vardef.name] = anchor;
                    this.targetAnchors.push(anchor);
                } else {
                    // Psuedo-anchor
                    anchor = document.createElement('div');
                    anchor.className = 'anchor';
                }
                anchorDiv.appendChild(anchor);
                anchorDiv.appendChild(anchorLabel);
                this.targetDiv.appendChild(anchorDiv);
            }
        }
        Object.defineProperty(this, 'sourceAnchorsByName', {value: this.sourceAnchorsByName});
        Object.defineProperty(this, 'targetAnchorsByName', {value: this.targetAnchorsByName});
        Object.preventExtensions(this.sourceAnchorsByName);
        Object.preventExtensions(this.targetAnchorsByName);
        Object.defineProperty(this, 'sourceAnchors', {value: this.sourceAnchors});
        Object.defineProperty(this, 'targetAnchors', {value: this.targetAnchors});
        Object.preventExtensions(this.sourceAnchors);
        Object.preventExtensions(this.targetAnchors);
    };
    /*************************************************************************
     * Private methods
     *************************************************************************/

     /*************************************************************************
     * Public methods
     *************************************************************************/
    /**
     * Container
     */
    GadgetInterface.prototype = new StyledElements.Container({'extending': true});

    /**
     * get the gadget name.
     */
    GadgetInterface.prototype.getIGadget = function getIGadget() {
        return this.igadget;
    };
    
    /**
     * get the gadget position.
     */
    GadgetInterface.prototype.getPosition = function getPosition () {
        var coordinates = {posX: this.wrapperElement.offsetLeft,
                           posY: this.wrapperElement.offsetTop};
        return coordinates;
    };
    
    /**
     * set the gadget position.
     */
    GadgetInterface.prototype.setPosition = function setPosition (coordinates) {
        this.wrapperElement.style.left = coordinates.posX + 'px';
        this.wrapperElement.style.top = coordinates.posY + 'px';
    };

    /**
     *  gets an anchor given a name
     */
    GadgetInterface.prototype.getAnchor = function getAnchor(name) {
        if (name in this.sourceAnchorsByName) {
            return this.sourceAnchorsByName[name];
        } else if (name in this.targetAnchorsByName) {
            return this.targetAnchorsByName[name];
        }
    };

    /**
     * Destroy
     */
    GadgetInterface.prototype.destroy = function destroy () {
        StyledElements.Container.prototype.destroy.call(this);
        this.draggable.destroy();
        this.draggable = null;
    };
    /*************************************************************************
     * Make GadgetInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.GadgetInterface = GadgetInterface;
})();
