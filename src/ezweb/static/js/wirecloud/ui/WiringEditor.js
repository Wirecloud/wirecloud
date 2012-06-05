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

/*global LayoutManagerFactory, opManager, StyledElements, Wirecloud, gettext */
if (!Wirecloud.ui) {
    // TODO this line should live in another file
    Wirecloud.ui = {};
}

var WiringStatus = {
    views: [
        {
            label: 'default',
            igadgets: {
            },
            operators: {
            },
            nextOperatorId: 0
        }
    ],
    operators: {
    },
    connections: [
    ]
};

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    var WiringEditor = function WiringEditor(id, options) {
        options['class'] = 'wiring_editor';
        StyledElements.Alternative.call(this, id, options);

        this.addEventListener('show', renewInterface.bind(this));
        this.addEventListener('hide', clearInterface.bind(this));

        this.layout = new StyledElements.BorderLayout();
        this.appendChild(this.layout);

        this.layout.getNorthContainer().addClassName('menubar');
        this.layout.getCenterContainer().addClassName('grid');

        // general highlight button
        this.highlight_button = new StyledElements.StyledButton({
            'title': gettext("general highlight"),
            'class': 'generalHighlight_button',
            'plain': true
        });
        this.highlight_button.insertInto(this.layout.getCenterContainer());
        this.highlight_button.addClassName('activated');
        this.highlight_button.addEventListener('click', function () {
            if (this.generalHighlighted) {
                this.highlight_button.removeClassName('activated');
                this.generalUnhighlight();
                this.generalHighlighted = false;
            } else {
                this.generalHighlight();
                this.highlight_button.addClassName('activated');
                this.generalHighlighted = true;
            }
        }.bind(this), true);

        //canvas for arrows
        this.canvas = new Wirecloud.ui.WiringEditor.Canvas();
        this.canvasElement = this.canvas.getHTMLElement();
        this.layout.getCenterContainer().appendChild(this.canvasElement);

        this.enableAnchors = this.enableAnchors.bind(this);
        this.disableAnchors = this.disableAnchors.bind(this);

        this.arrowCreator = new Wirecloud.ui.WiringEditor.ArrowCreator(this.canvas, this,
            function () {},
            function () {},
            this.enableAnchors,
            function () {},
            //adding arrow to WiringEditor.arrows list
            function (data, theArrow) {
                data.arrows.push(theArrow);
            }
        );
        this._startdrag_map_func = function (anchor) {
            anchor.addEventListener('startdrag', this.disableAnchors);
        }.bind(this);
    };
    WiringEditor.prototype = new StyledElements.Alternative();

    WiringEditor.prototype.view_name = 'wiring';

    /*************************************************************************
     * Private methods
     *************************************************************************/

    /**
     * @Private
     * finds anchors from the serialized string
     */
    var findAnchor = function findAnchor(desc) {
        switch (desc.type) {
        case 'igadget':
            return this.igadgets[desc.igadget].getAnchor(desc.varname);
        case 'ioperator':
            return this.ioperators[desc.ioperator].getAnchor(desc.endpoint);
        }
    };

    /**
     * @Private
     * repaint the wiringEditor interface
     */
    var renewInterface = function renewInterface() {
        var igadgets, igadget, key, i, gadget_interface, minigadget_interface, ioperators, operator,
            operator_interface, operator_instance, operatorKeys, meta, connection, startAnchor, endAnchor,
            arrow, workspace;

        workspace = opManager.activeWorkSpace; // FIXME this is the current way to obtain the current workspace

        this.nextOperatorId = WiringStatus.views[0].nextOperatorId;
        this.targetsOn = this.sourcesOn = true;
        this.targetAnchorList = [];
        this.sourceAnchorList = [];
        this.arrows = [];
        this.igadgets = {};
        this.ioperators = {};
        this.selectedObjects = [];
        this.generalHighlighted = true;

        igadgets = workspace.getIGadgets();

        for (i = 0; i < igadgets.length; i++) {
            igadget = igadgets[i];
            // mini widgets
            minigadget_interface = new Wirecloud.ui.WiringEditor.GadgetInterface(this, igadget, this);
            this.layout.getNorthContainer().appendChild(minigadget_interface);
            // widget
            if (igadget.getId() in WiringStatus.views[0].igadgets) {
                minigadget_interface.disable();
                gadget_interface = this.addIGadget(this, igadget);
                gadget_interface.setPosition(WiringStatus.views[0].igadgets[igadget.getId()]);
            }
        }
        // mini operators
        ioperators = Wirecloud.wiring.OperatorFactory.getAvailableOperators();
        for (key in ioperators) {
            operator = ioperators[key];
            operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, operator.instanciate(-1), this);
            this.layout.getNorthContainer().appendChild(operator_interface);
        }

        // operators
        for (key in WiringStatus.views[0].operators) {
            operator_instance = WiringStatus.operators[key];
            operator_instance.id = key;

            meta = ioperators[operator_instance.name];
            operator_interface = this.addIOperator(meta, operator_instance);
            operator_interface.setPosition(WiringStatus.views[0].operators[key]);
        }

        // connenctions
        for (i = 0; i < WiringStatus.connections.length; i += 1) {
            connection = WiringStatus.connections[i];
            startAnchor = findAnchor.call(this, connection.source);
            endAnchor = findAnchor.call(this, connection.target);
            arrow = this.canvas.drawArrow(startAnchor.getCoordinates(this.layout.getCenterContainer().wrapperElement),
                 endAnchor.getCoordinates(this.layout.getCenterContainer().wrapperElement));
            arrow.startAnchor = startAnchor;
            startAnchor.addArrow(arrow);
            arrow.endAnchor = endAnchor;
            endAnchor.addArrow(arrow);
            arrow.addClassName('arrow');
            arrow.setPullerStart(connection.pullerStart);
            arrow.setPullerEnd(connection.pullerEnd);

            this.arrows.push(arrow);
        }
    };

    /**
     * @Private
     * clean the WiringEditor interface.
     */
    var clearInterface = function clearInterface() {
        var i, key, workspace;

        this.serialize();
        workspace = opManager.activeWorkSpace; // FIXME this is the current way to obtain the current workspace
        workspace.wiring.load(WiringStatus);

        for (i = 0; i < this.arrows.length; i++) {
            this.arrows[i].destroy();
        }
        this.canvas.clear();

        for (key in this.igadgets) {
            this.layout.getCenterContainer().removeChild(this.igadgets[key]);
            this.igadgets[key].destroy();
        }
        for (key in this.ioperators) {
            this.layout.getCenterContainer().removeChild(this.ioperators[key]);
            this.ioperators[key].destroy();
        }

        this.layout.getNorthContainer().clear();
        this.arrows = [];
        this.igadgets = {};
        this.ioperators = {};
    };

    /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     * Saves the wiring state.
     */
    WiringEditor.prototype.serialize = function serialize() {
        var pos, i, key, gadget, arrow, operator_interface;

        // positions
        WiringStatus = {
            views: [
                {
                    label: 'default',
                    igadgets: {
                    },
                    operators: {
                    },
                    nextOperatorId: this.nextOperatorId
                }
            ],
            operators: {
            },
            connections: [
            ]
        };

        for (key in this.igadgets) {
            gadget = this.igadgets[key];
            pos = gadget.getStylePosition();
            WiringStatus.views[0].igadgets[gadget.getIGadget().getId()] = pos;
        }

        for (i in this.ioperators) {
            operator_interface = this.ioperators[i];
            pos = operator_interface.getStylePosition();
            WiringStatus.operators[operator_interface.getId()] = {"name" : operator_interface.getName(), 'id' : operator_interface.getId()};
            WiringStatus.views[0].operators[operator_interface.getId()] = pos;
        }

        for (i = 0; i < this.arrows.length; i++) {
            arrow = this.arrows[i];
            WiringStatus.connections.push({
                'source': arrow.startAnchor.serialize(),
                'target': arrow.endAnchor.serialize(),
                'pullerStart': arrow.getPullerStart(),
                'pullerEnd': arrow.getPullerEnd()
            });
        }
    };

    /**
     * general Highlight switch on.
     */
    WiringEditor.prototype.generalHighlight = function generalHighlight() {
        var i, key;

        this.selectedObjects = [];
        for (i in this.ioperators) {
            this.ioperators[i].highlight();
            this.selectedObjects.push(this.ioperators[i]);
        }

        for (key in this.igadgets) {
            this.igadgets[key].highlight();
            this.selectedObjects.push(this.igadgets[key]);
        }
    };

    /**
     * general Highlight switch off.
     */
    WiringEditor.prototype.generalUnhighlight = function generalUnhighlight() {
        var key;

        for (key in this.ioperators) {
            this.ioperators[key].unhighlight();
        }

        for (key in this.igadgets) {
            this.igadgets[key].unhighlight();
        }

        this.selectedObjects = [];
    };

    /**
     * Highlight object.
     */
    WiringEditor.prototype.highlightEntity = function highlightEntity(object) {
        this.selectedObjects.push(object);
    };

    /**
     * Unhighlight object.
     */
    WiringEditor.prototype.unhighlightEntity = function unhighlightEntity(object) {
        var pos = this.selectedObjects.indexOf(object);
        delete this.selectedObjects[pos];
    };

    WiringEditor.prototype.addIGadget = function addIGadget(wiringEditor, igadget) {
        var gadget_interface = new Wirecloud.ui.WiringEditor.GadgetInterface(wiringEditor, igadget, this.arrowCreator);

        this.igadgets[igadget.getId()] = gadget_interface;
        this.layout.getCenterContainer().appendChild(gadget_interface);

        gadget_interface.sourceAnchors.map(this._startdrag_map_func);
        gadget_interface.targetAnchors.map(this._startdrag_map_func);

        this.targetAnchorList = this.targetAnchorList.concat(gadget_interface.targetAnchors);
        this.sourceAnchorList = this.sourceAnchorList.concat(gadget_interface.sourceAnchors);

        return gadget_interface;
    };

    WiringEditor.prototype.addIOperator = function addIOperator(ioperator, initial_status) {
        var instanciated_operator, operator_interface;

        if (initial_status != null) {
            instanciated_operator = ioperator.instanciate(initial_status.id);
        } else {
            instanciated_operator = ioperator.instanciate(this.nextOperatorId);
            this.nextOperatorId++;
        }

        operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, instanciated_operator, this.arrowCreator);
        this.layout.getCenterContainer().appendChild(operator_interface);

        operator_interface.sourceAnchors.map(this._startdrag_map_func);
        operator_interface.targetAnchors.map(this._startdrag_map_func);

        this.targetAnchorList = this.targetAnchorList.concat(operator_interface.targetAnchors);
        this.sourceAnchorList = this.sourceAnchorList.concat(operator_interface.sourceAnchors);

        this.ioperators[operator_interface.getId()] = operator_interface;
        return operator_interface;
    };

    /**
     * Reenables all anchor disabled previously.
     */
    WiringEditor.prototype.enableAnchors = function enableAnchors() {
        var i;

        if (!this.sourcesOn) {
            for (i = 0; i < this.sourceAnchorList.length; i++) {
                this.sourceAnchorList[i].enable();
                this.sourcesOn = true;
            }
        } else if (!this.targetsOn) {
            for (i = 0; i < this.targetAnchorList.length; i++) {
                this.targetAnchorList[i].enable();
                this.targetsOn = true;
            }
        }
    };

    /**
     * Disables all anchor that cannot be connected to the given anchor.
     */
    WiringEditor.prototype.disableAnchors = function disableAnchors(anchor) {
        var i, anchorList = [];
        if (anchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            anchorList = this.targetAnchorList;
            this.targetsOn = false;
        } else {
            anchorList = this.sourceAnchorList;
            this.sourcesOn = false;
        }
        for (i = 0; i < anchorList.length; i++) {
            anchorList[i].disable();
        }
    };

    WiringEditor.prototype.removeGadget = function removeGadget(gadget_interface) {
        delete this.igadgets[gadget_interface.getIGadget().getId()];
        this.layout.getCenterContainer().removeChild(gadget_interface);
        gadget_interface.destroy();
    };

    WiringEditor.prototype.removeIOperator = function removeIOperator(operator_interface) {
        delete this.ioperators[operator_interface.getIOperator().id];
        this.layout.getCenterContainer().removeChild(operator_interface);
        operator_interface.destroy();
    };

    WiringEditor.prototype.removeArrow = function removeArrow(arrow) {
        var pos;
        pos = this.arrows.indexOf(arrow);
        this.arrows.splice(pos, 1);
        arrow.destroy();
    };

    /**
     * getBreadcrum
     */
    WiringEditor.prototype.getBreadcrum = function getBreadcrum() {
        var workspace_breadcrum = LayoutManagerFactory.getInstance().viewsByName.workspace.getBreadcrum().slice();

        workspace_breadcrum.push({
            'label': 'wiring'
        });

        return workspace_breadcrum;
    };

    /*************************************************************************
     * Make WiringEditor public
     *************************************************************************/
    Wirecloud.ui.WiringEditor = WiringEditor;

})();
