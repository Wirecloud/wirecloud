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
    var GadgetInterface = function GadgetInterface(igadget, arrowCreator) {
        var i, name, variables, variable, anchor, anchorDiv, anchorLabel, desc, nameDiv, nameElement;

        this.targetAnchors = [];
        this.sourceAnchors = [];
        StyledElements.Container.call(this, {'class': 'igadget'}, []);
        this.gadgetHeader = document.createElement("div");
        this.gadgetHeader.addClassName("header");
        this.wrapperElement.appendChild(this.gadgetHeader);

        //make draggable
        this.draggable = new Draggable(this.wrapperElement, this.gadgetHeader, this,
            function () {},
            function (e, draggable, widget) {
                widget.repaint();
            },
			function () {},
            function () {return true}
        );

        //gadget name
        nameElement = document.createElement("span");
        nameElement.setTextContent(igadget.name);
        this.gadgetHeader.appendChild(nameElement);

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
                anchor = new Wirecloud.ui.WiringEditor.SourceAnchor(variable, arrowCreator);
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
                anchorDiv.appendChild(anchor);
                this.sourceDiv.appendChild(anchorDiv);
                this.sourceAnchors.push(anchor);
            //each Slot
            } else if (variable.vardef.aspect === Variable.prototype.SLOT) {
                anchor = new Wirecloud.ui.WiringEditor.TargetAnchor(variable, arrowCreator);
                anchorDiv = new StyledElements.Container();
                desc = variable.vardef.description;
                if (desc == '') {
                    desc = variable.vardef.label;
                }
                anchorDiv.wrapperElement.setAttribute('title', desc);
                anchorLabel = document.createElement("span");
                anchorLabel.setTextContent(variable.vardef.label);
                anchorDiv.appendChild(anchor);
                anchorDiv.appendChild(anchorLabel);
                this.targetDiv.appendChild(anchorDiv);
                this.targetAnchors.push(anchor);
            }
        }

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
    /*
     * Container
     */
    GadgetInterface.prototype = new StyledElements.Container({'extending': true});

    /*
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
