/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
 *     (C) Copyright 2012 Center for Open Middleware
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

/*global Constants, EzWebExt, LayoutManagerFactory, OperatorMeta, opManager, StyledElements, Wirecloud, gettext, Draggable, BrowserUtilsFactory */
if (!Wirecloud.ui) {
    // TODO this line should live in another file
    Wirecloud.ui = {};
}

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

        this.layout.getWestContainer().addClassName('menubar');
        this.accordion = new StyledElements.Accordion();
        this.mini_widget_section = this.accordion.createContainer({title: 'Widgets'});
        this.mini_operator_section = this.accordion.createContainer({title: 'Operators'});
        this.layout.getWestContainer().appendChild(this.accordion);
        this.layout.getCenterContainer().addClassName('grid');

        this.layout.getCenterContainer().wrapperElement.addEventListener("scroll", this.scrollHandler.bind(this), false);

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
        this.canvas.addEventListener('arrowadded', function (canvas, arrow) {
            this.arrows.push(arrow);

        }.bind(this));
        this.canvas.addEventListener('arrowremoved', function (canvas, arrow) {
            var pos;
            if (arrow.startMulti != null) {
                this.multiconnectors[arrow.startMulti].removeArrow(arrow);
            }
            if (arrow.endMulti != null) {
                this.multiconnectors[arrow.endMulti].removeArrow(arrow);
            }
            if (arrow.multiId != null) {
                this.removeMulticonnector(this.multiconnectors[arrow.multiId]);
            }
            pos = this.arrows.indexOf(arrow);
            this.arrows.splice(pos, 1);
        }.bind(this));

        this.canvas.addEventListener('unselectall', function () {
            this.ChangeObjectEditing(null);
        }.bind(this));

        this.enableAnchors = this.enableAnchors.bind(this);
        this.disableAnchors = this.disableAnchors.bind(this);

        this.arrowCreator = new Wirecloud.ui.WiringEditor.ArrowCreator(this.canvas, this,
            function () {},
            function () {},
            this.enableAnchors,
            function () {}
        );
        this._startdrag_map_func = function (anchor) {
            anchor.addEventListener('startdrag', this.disableAnchors);
        }.bind(this);

        // Initialize key listener
        this._keydownListener = keydownListener.bind(this);
        this._keyupListener = keyupListener.bind(this);
    };
    WiringEditor.prototype = new StyledElements.Alternative();

    WiringEditor.prototype.view_name = 'wiring';

    /*************************************************************************
     * Private methods
     *************************************************************************/
    /**
     * @Private
     * keydown handler for ctrl Multiselection
     */
    var keydownListener = function keydownListener(event) {
        if (event.keyCode == 17) {
            this.ctrlPushed = true;
            this.layout.getCenterContainer().addClassName('selecting');
        }
    };

    /**
     * @Private
     * keyup handler for ctrl Multiselection
     */
    var keyupListener = function keyupListener(event) {
        if (event.keyCode == 17) {
            this.ctrlPushed = false;
            this.layout.getCenterContainer().removeClassName('selecting');
        }
    };

    /**
     * @Private
     * finds anchors from the serialized string
     */
    var findAnchor = function findAnchor(desc, workspace) {
        var iwidget_interface, iwidget, endPointPos;

        switch (desc.type) {
        case 'iwidget':
            if (this.iwidgets[desc.id] != null) {
                return this.iwidgets[desc.id].getAnchor(desc.endpoint);
            } else {
                iwidget = workspace.getIWidget(desc.id);
                if (iwidget != null) {
                    endPointPos = {'sources': [], 'targets': []};
                    iwidget_interface = this.addIWidget(this, iwidget, endPointPos);
                    iwidget_interface.setPosition({posX: 0, posY: 0});
                    this.mini_widgets[iwidget.getId()].disable();
                } else {
                    throw new Error('Widget not found');
                }
                return iwidget_interface.getAnchor(desc.endpoint);
            }
            break;
        case 'ioperator':
            if (this.ioperators[desc.id] != null) {
                return this.ioperators[desc.id].getAnchor(desc.endpoint);
            }
        }
    };


    var loadWiring = function loadWiring(workspace, WiringStatus) {
        var iwidgets, iwidget, key, i, widget_interface, miniwidget_interface, ioperators, operator,
            operator_interface, operator_instance, operatorKeys, connection, connectionView, startAnchor,
            endAnchor, arrow, isMenubarRef, miniwidget_clon, pos, op_id, multiconnectors, multi, multiInstance,
            multi_id, anchor;

        if (WiringStatus == null) {
            WiringStatus = {
                views: [
                    {
                        label: 'default',
                        iwidgets: {
                        },
                        operators: {
                        },
                        multiconnectors: {
                        },
                        connections: [
                        ]
                    }
                ],
                operators: {
                },
                connections: [
                ]
            };
        }

        if (WiringStatus.views == null) {
            WiringStatus.views = [
                {
                    label: 'default',
                    iwidgets: {},
                    operators: {}
                }
            ];
        }

        this.targetsOn = true;
        this.sourcesOn = true;
        this.targetAnchorList = [];
        this.sourceAnchorList = [];
        this.arrows = [];
        this.iwidgets = {};
        this.multiconnectors = {};
        this.mini_widgets = {};
        this.ioperators = {};
        this.highlightedObjects = [];
        this.selectedOps = {};
        this.selectedOps.length = 0;
        this.selectedWids = {};
        this.selectedWids.length = 0;
        this.selectedMulti = {};
        this.selectedMulti.length = 0;
        this.selectedCount = 0;
        this.ctrlPushed = false;
        this.generalHighlighted = true;
        this.nextOperatorId = 0;
        this.nextMulticonnectorId = 0;
        this.sourceAnchorsByFriendCode = {};
        this.targetAnchorsByFriendCode = {};
        this.EditingObject = null;

        iwidgets = workspace.getIWidgets();

        for (i = 0; i < iwidgets.length; i++) {
            iwidget = iwidgets[i];
            // mini widgets
            isMenubarRef = true;
            miniwidget_interface = new Wirecloud.ui.WiringEditor.WidgetInterface(this, iwidget, this, isMenubarRef);
            this.mini_widgets[iwidget.getId()] = miniwidget_interface;
            this.mini_widget_section.appendChild(miniwidget_interface);

            // widget
            if (iwidget.getId() in WiringStatus.views[0].iwidgets) {
                miniwidget_interface.disable();
                widget_interface = this.addIWidget(this, iwidget, WiringStatus.views[0].iwidgets[iwidget.getId()].endPointsInOuts);
                widget_interface.setPosition(WiringStatus.views[0].iwidgets[iwidget.getId()].widget);
            }
        }

        // mini operators
        ioperators = Wirecloud.wiring.OperatorFactory.getAvailableOperators();
        for (key in ioperators) {
            isMenubarRef = true;
            operator = ioperators[key];
            operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, operator, this, isMenubarRef);
            this.mini_operator_section.appendChild(operator_interface);
        }

        // operators
        ioperators = workspace.wiring.ioperators;
        for (key in ioperators) {
            operator_instance = ioperators[key];
            op_id = operator_instance.id;
            if (this.NextOperatorId < op_id) {
                this.NextOperatorId = op_id;
            }

            operator_interface = this.addIOperator(operator_instance, WiringStatus.views[0].operators[key].endPointsInOuts);
            if (key in WiringStatus.views[0].operators) {
                operator_interface.setPosition(WiringStatus.views[0].operators[key].widget);
            }
            if (key >= this.nextOperatorId) {
                this.nextOperatorId = parseInt(key, 10) + 1;
            }
        }

        // multiconnectors
        multiconnectors = WiringStatus.views[0].multiconnectors;
        for (key in multiconnectors) {
            multi = multiconnectors[key];
            if (this.nextMulticonnectorId <= multi.id) {
                this.nextMulticonnectorId = parseInt(multi.id, 10) + 1;
            }
            if (multi.objectType == 'ioperator') {
                anchor = this.ioperators[multi.objectId].getAnchor(multi.sourceName);
            } else {
                anchor = this.iwidgets[multi.objectId].getAnchor(multi.sourceName);
            }
            multiInstance = new Wirecloud.ui.WiringEditor.Multiconnector(multi.id, multi.objectId, multi.sourceName,
                                            this.layout.getCenterContainer().wrapperElement,
                                            this, anchor, multi.pos, multi.height);
            multiInstance = this.addMulticonnector(multiInstance);
            multiInstance.addMainArrow(multi.pullerStart, multi.pullerEnd);
        }

        // connections
        for (i = 0; i < WiringStatus.connections.length; i += 1) {
            connection = WiringStatus.connections[i];
            connectionView = WiringStatus.views[0].connections[i];
            startAnchor = findAnchor.call(this, connection.source, workspace);
            endAnchor = findAnchor.call(this, connection.target, workspace);

            arrow = this.canvas.drawArrow(startAnchor.getCoordinates(this.layout.getCenterContainer().wrapperElement),
            endAnchor.getCoordinates(this.layout.getCenterContainer().wrapperElement));
            arrow.startAnchor = startAnchor;
            startAnchor.addArrow(arrow);
            arrow.endAnchor = endAnchor;
            endAnchor.addArrow(arrow);
            arrow.addClassName('arrow');
            arrow.setPullerStart(connectionView.pullerStart);
            arrow.setPullerEnd(connectionView.pullerEnd);
            if (connectionView.startMulti != null) {
                multi = this.multiconnectors[connectionView.startMulti];
                arrow.startMulti = connectionView.startMulti;
                pos = multi.getCoordinates(this.layout);
                arrow.setStart(pos);
                arrow.redraw();
                multi.addArrow(arrow);
            }
            if (connectionView.endMulti != null) {
                arrow.endMulti = connectionView.endMulti;
                multi = this.multiconnectors[connectionView.endMulti];
                pos = multi.getCoordinates(this.layout);
                arrow.setEnd(pos);
                arrow.redraw();
                multi.addArrow(arrow);
            }
        }
        this.activateCtrlMultiSelect();
        this.valid = true;
    };

    /**
     * @Private
     * repaint the wiringEditor interface
     */
    var renewInterface = function renewInterface() {
        var workspace, wiringStatus, layoutManager, msg;

        layoutManager = LayoutManagerFactory.getInstance();
        this.valid = false;

        try {

            workspace = opManager.activeWorkspace; // FIXME this is the current way to obtain the current workspace
            wiringStatus = workspace.wiring.status;
            loadWiring.call(this, workspace, wiringStatus);

        } catch (err) {

            try {
                clearInterface.call(this);
            } catch (e1) {
                msg = gettext('Unrecoverable error while loading wiring data into the wiring editor');
                layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
            }

            var yesHandler = function () {
                wiringStatus = EzWebExt.clone(wiringStatus);
                delete wiringStatus.views;
                try {
                    loadWiring.call(this, workspace, wiringStatus);
                } catch (e2) {
                    try {
                        clearInterface.call(this);
                    } catch (e3) {}
                    // Use setTimeout as at the end of the yesHandler all window menus are closed including the one we are opening now
                    setTimeout(function () {
                        msg = gettext('Error trying to recover wiring status.');
                        layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                    }, 0);
                }
            };
            var noHandler = function () {
                layoutManager.changeCurrentView('workspace');
            };
            layoutManager.showYesNoDialog(
                gettext("There was an error loading the wiring status into the Wiring Editor. Do you want Wirecloud to try to recover the state of your connections automatically?"),
                yesHandler.bind(this),
                noHandler.bind(this));
        }
    };

    /**
     * @Private
     * clean the WiringEditor interface.
     */
    var clearInterface = function clearInterface() {
        var key, workspace;

        workspace = opManager.activeWorkspace; // FIXME this is the current way to obtain the current workspace
        if (this.valid) {
            workspace.wiring.load(this.serialize());
            workspace.wiring.save();
        }
        for (key in this.iwidgets) {
            this.layout.getCenterContainer().removeChild(this.iwidgets[key]);
            this.iwidgets[key].destroy();
        }
        for (key in this.ioperators) {
            this.layout.getCenterContainer().removeChild(this.ioperators[key]);
            this.ioperators[key].destroy();
        }
        for (key in this.multiconnectors) {
            this.layout.getCenterContainer().removeChild(this.multiconnectors[key]);
            this.multiconnectors[key].destroy();
        }
        this.deactivateCtrlMultiSelect();

        this.canvas.clear();
        this.mini_widget_section.clear();
        this.mini_operator_section.clear();
        this.arrows = [];
        this.mini_widgets = {};
        this.iwidgets = {};
        this.ioperators = {};
        this.multiconnectors = {};
    };

    /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     * activate handlers for ctrl Multiselection
     */
    WiringEditor.prototype.activateCtrlMultiSelect = function activateCtrlMultiSelect() {
        document.addEventListener("keydown", this._keydownListener, false);
        document.addEventListener("keyup", this._keyupListener, false);
    };

    /**
     * deactivate handlers for ctrl Multiselection
     */
    WiringEditor.prototype.deactivateCtrlMultiSelect = function deactivateCtrlMultiSelect() {
        document.removeEventListener("keydown", this._keydownListener, false);
        document.removeEventListener("keyup", this._keyupListener, false);
        this.ctrlPushed = false;
        this.layout.getCenterContainer().removeClassName('selecting');
    };

    /**
     * Saves the wiring state.
     */
    WiringEditor.prototype.serialize = function serialize() {
        var pos, i, key, widget, arrow, operator_interface, WiringStatus, multiconnector, height, inOutPos, positions;

        // positions
        WiringStatus = {
            views: [
                {
                    label: 'default',
                    iwidgets: {
                    },
                    operators: {
                    },
                    multiconnectors: {
                    },
                    connections: [
                    ]
                }
            ],
            operators: {
            },
            connections: [
            ]
        };

        for (key in this.iwidgets) {
            widget = this.iwidgets[key];
            pos = widget.getStylePosition();
            inOutPos = widget.getInOutPositions();
            positions = {'widget' : pos, 'endPointsInOuts' : inOutPos};
            WiringStatus.views[0].iwidgets[key] = positions;
        }

        for (key in this.ioperators) {
            operator_interface = this.ioperators[key];
            pos = operator_interface.getStylePosition();
            inOutPos = operator_interface.getInOutPositions();
            positions = {'widget' : pos, 'endPointsInOuts' : inOutPos};
            WiringStatus.operators[key] = {"name" : operator_interface.getIOperator().meta.uri, 'id' : key};
            WiringStatus.views[0].operators[key] = positions;
        }

        for (key in this.multiconnectors) {
            multiconnector = this.multiconnectors[key];
            //TODO: this position is not exact
            pos = multiconnector.getStylePosition();
            height = parseFloat(multiconnector.wrapperElement.style.height);
            WiringStatus.views[0].multiconnectors[key] = {
                'id' : key,
                'pos' : pos,
                'height' : height,
                'objectId' : multiconnector.objectId,
                'sourceName' : multiconnector.sourceName,
                'objectType' : multiconnector.context.iObject.className,
                'pullerStart': multiconnector.mainArrow.getPullerStart(),
                'pullerEnd': multiconnector.mainArrow.getPullerEnd()
            };
        }

        for (i = 0; i < this.arrows.length; i++) {
            arrow = this.arrows[i];
            WiringStatus.connections.push({
                'source': arrow.startAnchor.serialize(),
                'target': arrow.endAnchor.serialize()
            });
            WiringStatus.views[0].connections.push({
                'pullerStart': arrow.getPullerStart(),
                'pullerEnd': arrow.getPullerEnd(),
                'startMulti': arrow.startMulti,
                'endMulti': arrow.endMulti
            });
        }

        return WiringStatus;
    };

    /**
     * general Highlight switch on.
     */
    WiringEditor.prototype.generalHighlight = function generalHighlight() {
        var i, key;

        this.highlightedObjects = [];
        for (i in this.ioperators) {
            this.ioperators[i].highlight();
            this.highlightedObjects.push(this.ioperators[i]);
        }

        for (key in this.iwidgets) {
            this.iwidgets[key].highlight();
            this.highlightedObjects.push(this.iwidgets[key]);
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

        for (key in this.iwidgets) {
            this.iwidgets[key].unhighlight();
        }

        this.highlightedObjects = [];
    };

    /**
     * add selectd object.
     */
    WiringEditor.prototype.addSelectedObject = function addSelectedObject(object) {
        if (object instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
            this.selectedWids[object.iwidget.getId()] = object;
            this.selectedWids.length += 1;
        } else if (object instanceof Wirecloud.ui.WiringEditor.OperatorInterface) {
            this.selectedOps[object.getId()] = object;
            this.selectedOps.length += 1;
        } else if (object instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
            this.selectedMulti[object.getId()] = object;
            this.selectedMulti.length += 1;
        }
        this.selectedCount += 1;
    };

    /**
     * remove selected object.
     */
    WiringEditor.prototype.removeSelectedObject = function removeSelectedObject(object) {
        if (object instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
            delete this.selectedWids[object.iwidget.getId()];
            this.selectedWids.length -= 1;
        } else if (object instanceof Wirecloud.ui.WiringEditor.OperatorInterface) {
            delete this.selectedOps[object.getId()];
            this.selectedOps.length -= 1;
        } else if (object instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
            delete this.selectedMulti[object.getId()];
            this.selectedMulti.length -= 1;
        }
        if (this.selectedCount > 0) {
            this.selectedCount -= 1;
        } else {
            //error
        }
    };

    /**
     * reset selected object.
     */
    WiringEditor.prototype.resetSelection = function resetSelection() {
        var key;
        for (key in this.selectedOps) {
            if (key != 'length') {
                this.selectedOps[key].unselect(false);
            }
        }
        for (key in this.selectedWids) {
            if (key != 'length') {
                this.selectedWids[key].unselect(false);
            }
        }
        for (key in this.selectedMulti) {
            if (key != 'length') {
                this.selectedMulti[key].unselect(false);
            }
        }
        if ((this.selectedOps.length !== 0) || (this.selectedWids.length !== 0) || (this.selectedMulti.length !== 0)) {
            //('error resetSelection' + this.selectedOps + this.selectedWids);
        }
    };

    /**
     * Highlight object.
     */
    WiringEditor.prototype.highlightEntity = function highlightEntity(object) {
        this.highlightedObjects.push(object);
    };

    /**
     * Unhighlight object.
     */
    WiringEditor.prototype.unhighlightEntity = function unhighlightEntity(object) {
        var pos = this.highlightedObjects.indexOf(object);
        delete this.highlightedObjects[pos];
    };

    /**
     * check if the position of the event occurred within the grid
     */
    WiringEditor.prototype.withinGrid = function withinGrid(event) {
        var box = this.layout.getCenterContainer().getBoundingClientRect();

        return (event.clientX > box.left) && (event.clientX < box.right) &&
               (event.clientY > box.top) && (event.clientY < box.bottom);
    };

    /**
     * add IWidget.
     */
    WiringEditor.prototype.addIWidget = function addIWidget(wiringEditor, iwidget, enpPointPos) {
        var widget_interface, auxDiv;

        widget_interface = new Wirecloud.ui.WiringEditor.WidgetInterface(wiringEditor, iwidget, this.arrowCreator, false, enpPointPos);
        this.iwidgets[iwidget.getId()] = widget_interface;

        auxDiv = document.createElement('div');
        auxDiv.style.width = '2000px';
        auxDiv.style.height = '1000px';
        this.layout.getCenterContainer().appendChild(auxDiv);

        widget_interface.insertInto(auxDiv);

        widget_interface.wrapperElement.style.minWidth = widget_interface.getBoundingClientRect().width + 'px';
        this.layout.getCenterContainer().removeChild(auxDiv);

        this.layout.getCenterContainer().appendChild(widget_interface);

        widget_interface.sourceAnchors.map(this._startdrag_map_func);
        widget_interface.targetAnchors.map(this._startdrag_map_func);

        this.targetAnchorList = this.targetAnchorList.concat(widget_interface.targetAnchors);
        this.sourceAnchorList = this.sourceAnchorList.concat(widget_interface.sourceAnchors);

        widget_interface.wrapperElement.style.minWidth = widget_interface.getBoundingClientRect().width + 'px';
        return widget_interface;
    };

    /**
     * add IOperator.
     */
    WiringEditor.prototype.addIOperator = function addIOperator(ioperator, enpPointPos) {
        var instantiated_operator, operator_interface, auxDiv;

        if (ioperator instanceof OperatorMeta) {
            instantiated_operator = ioperator.instantiate(this.nextOperatorId, true);
            this.nextOperatorId++;
        } else {
            instantiated_operator = ioperator;
        }

        operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, instantiated_operator, this.arrowCreator, false, enpPointPos);
        auxDiv = document.createElement('div');
        auxDiv.style.width = '2000px';
        auxDiv.style.height = '1000px';
        this.layout.getCenterContainer().appendChild(auxDiv);

        operator_interface.insertInto(auxDiv);

        operator_interface.wrapperElement.style.minWidth = operator_interface.getBoundingClientRect().width + 'px';
        this.layout.getCenterContainer().removeChild(auxDiv);

        this.layout.getCenterContainer().appendChild(operator_interface);

        operator_interface.sourceAnchors.map(this._startdrag_map_func);
        operator_interface.targetAnchors.map(this._startdrag_map_func);

        this.targetAnchorList = this.targetAnchorList.concat(operator_interface.targetAnchors);
        this.sourceAnchorList = this.sourceAnchorList.concat(operator_interface.sourceAnchors);

        this.ioperators[operator_interface.getId()] = operator_interface;
        return operator_interface;
    };

    /**
     * starDrag all selected objects.
     */
    WiringEditor.prototype.onStarDragSelected = function starDragSelected() {
        var key, pos;
        if (this.selectedCount <= 1) {
            return;
        }

        for (key in this.selectedOps) {
            if (key != 'length') {
                pos = this.selectedOps[key].initPos;
                pos.y = this.selectedOps[key].wrapperElement.style.top === "" ? 0 : parseInt(this.selectedOps[key].wrapperElement.style.top, 10);
                pos.x = this.selectedOps[key].wrapperElement.style.left === "" ? 0 : parseInt(this.selectedOps[key].wrapperElement.style.left, 10);
            }
        }
        for (key in this.selectedWids) {
            if (key != 'length') {
                pos = this.selectedWids[key].initPos;
                pos.y = this.selectedWids[key].wrapperElement.style.top === "" ? 0 : parseInt(this.selectedWids[key].wrapperElement.style.top, 10);
                pos.x = this.selectedWids[key].wrapperElement.style.left === "" ? 0 : parseInt(this.selectedWids[key].wrapperElement.style.left, 10);
            }
        }
        for (key in this.selectedMulti) {
            if (key != 'length') {
                pos = this.selectedMulti[key].initPos;
                pos.y = this.selectedMulti[key].wrapperElement.style.top === "" ? 0 : parseInt(this.selectedMulti[key].wrapperElement.style.top, 10);
                pos.x = this.selectedMulti[key].wrapperElement.style.left === "" ? 0 : parseInt(this.selectedMulti[key].wrapperElement.style.left, 10);
            }
        }
    };

    /**
     * drag all selected objects.
     */
    WiringEditor.prototype.onDragSelectedObjects = function dragSelectedObjects(xDelta, yDelta) {
        var key;
        if (this.selectedCount <= 1) {
            return;
        }

        for (key in this.selectedOps) {
            if (key != 'length') {
                this.selectedOps[key].setPosition({posX: this.selectedOps[key].initPos.x + xDelta, posY: this.selectedOps[key].initPos.y + yDelta});
                this.selectedOps[key].repaint();
            }
        }
        for (key in this.selectedWids) {
            if (key != 'length') {
                this.selectedWids[key].setPosition({posX: this.selectedWids[key].initPos.x + xDelta, posY: this.selectedWids[key].initPos.y + yDelta});
                this.selectedWids[key].repaint();
            }
        }
        for (key in this.selectedMulti) {
            if (key != 'length') {
                this.selectedMulti[key].setPosition({posX: this.selectedMulti[key].initPos.x + xDelta, posY: this.selectedMulti[key].initPos.y + yDelta});
                this.selectedMulti[key].repaint();
            }
        }
    };

    /**
     * drag all selected objects.
     */
    WiringEditor.prototype.onFinishSelectedObjects = function onFinishSelectedObjects() {
        var key, position, desp;
        if (this.selectedCount <= 1) {
            return;
        }

        //find the most negative X and Y
        desp = {'x': 0, 'y': 0};
        for (key in this.selectedOps) {
            if (key != 'length') {
                position = this.selectedOps[key].getStylePosition();
                if (position.posX < 0) {
                    if (position.posX < desp.x) {
                        desp.x = position.posX;
                    }
                }
                if (position.posY < 0) {
                    if (position.posY < desp.y) {
                        desp.y = position.posY;
                    }
                }

            }
        }
        for (key in this.selectedWids) {
            if (key != 'length') {
                position = this.selectedWids[key].getStylePosition();
                if (position.posX < 0) {
                    if (position.posX < desp.x) {
                        desp.x = position.posX;
                    }
                }
                if (position.posY < 0) {
                    if (position.posY < desp.y) {
                        desp.y = position.posY;
                    }
                }
            }
        }
        for (key in this.selectedMulti) {
            if (key != 'length') {
                position = this.selectedMulti[key].getStylePosition();
                if (position.posX < 0) {
                    if (position.posX < desp.x) {
                        desp.x = position.posX;
                    }
                }
                if (position.posY < 0) {
                    if (position.posY < desp.y) {
                        desp.y = position.posY;
                    }
                }
            }
        }
        if ((desp.y >= 0) && (desp.x >= 0)) {
            return;
        }
        if (desp.y >= 0) {
            desp.y = 0;
        } else {
            desp.y -= 8;
        }
        if (desp.x >= 0) {
            desp.x = 0;
        } else {
            desp.x -= 8;
        }
        //set position of the selected group
        for (key in this.selectedOps) {
            if (key != 'length') {
                position = this.selectedOps[key].getStylePosition();
                position.posX -= desp.x;
                position.posY -= desp.y;
                this.selectedOps[key].setPosition(position);
                this.selectedOps[key].repaint();
            }
        }
        for (key in this.selectedWids) {
            if (key != 'length') {
                position = this.selectedWids[key].getStylePosition();
                position.posX -= desp.x;
                position.posY -= desp.y;
                this.selectedWids[key].setPosition(position);
                this.selectedWids[key].repaint();
            }
        }
        for (key in this.selectedMulti) {
            if (key != 'length') {
                position = this.selectedMulti[key].getStylePosition();
                position.posX -= desp.x;
                position.posY -= desp.y;
                this.selectedMulti[key].setPosition(position);
                this.selectedMulti[key].repaint();
            }
        }
    };

    /**
     * Reenables all anchor disabled previously.
     */
    WiringEditor.prototype.ChangeObjectEditing = function ChangeObjectEditing(obj) {
        this.resetSelection();
        if (obj == null) {
            if (this.EditingObject != null) {
                this.EditingObject.editPos();
                this.EditingObject = null;
            }
        } else {
            if (this.EditingObject === obj) {
                this.EditingObject.editPos();
                this.EditingObject = null;
            } else {
                obj.editPos();
                if (this.EditingObject != null) {
                    this.EditingObject.editPos();
                }
                this.EditingObject = obj;
            }
        }
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

    /**
     * remove a iWidget.
     */
    WiringEditor.prototype.removeIWidget = function removeIWidget(widget_interface) {
        widget_interface.unselect(false);
        delete this.iwidgets[widget_interface.getIWidget().getId()];
        this.layout.getCenterContainer().removeChild(widget_interface);
        widget_interface.destroy();
        this.mini_widgets[widget_interface.getIWidget().getId()].enable();
    };

    /**
     * remove a iOperator.
     */
    WiringEditor.prototype.removeIOperator = function removeIOperator(operator_interface) {
        operator_interface.unselect(false);
        delete this.ioperators[operator_interface.getIOperator().id];
        this.layout.getCenterContainer().removeChild(operator_interface);
        operator_interface.destroy();
    };

    /**
     * add a multiconnector.
     */
    WiringEditor.prototype.addMulticonnector = function addMulticonnector(multiconnector) {
        var id;

        if (multiconnector.id == null) {
            id = this.nextMulticonnectorId;
            this.nextMulticonnectorId = parseInt(id, 10) + 1;
        } else {
            id = multiconnector.id;
        }
        this.layout.getCenterContainer().appendChild(multiconnector);
        this.multiconnectors[id] = multiconnector;
        return this.multiconnectors[id];
        /* TODO: anchor enable-disable for multiconnector
        this.targetAnchorList = this.targetAnchorList.concat(widget_interface.targetAnchors);
        this.sourceAnchorList = this.sourceAnchorList.concat(widget_interface.sourceAnchors);
*/
    };

    /**
     * remove a multiconnector.
     */
    WiringEditor.prototype.removeMulticonnector = function removeMulticonnector(multiConnector) {
        this.layout.getCenterContainer().removeChild(multiConnector);
        multiConnector.destroy(true);
        delete this.multiconnectors[multiConnector.id];
    };

    /**
     * emphasize anchors.
     */
    WiringEditor.prototype.emphasize = function emphasize(anchor) {
        var friendCode, anchors, i;

        anchor.wrapperElement.parentNode.addClassName('highlight_main');
        friendCode = anchor.context.data.connectable._friendCode;
        if (anchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            anchors = this.sourceAnchorsByFriendCode[friendCode];
        } else {
            anchors = this.targetAnchorsByFriendCode[friendCode];
        }
        if (anchors != null) {
            for (i = 0; i < anchors.length; i += 1) {
                this.highlightAnchorLabel(anchors[i]);
            }
        }
    };

    /**
     * deemphasize anchors.
     */
    WiringEditor.prototype.deemphasize = function deemphasize(anchor) {
        var friendCode, anchors, i;

        anchor.wrapperElement.parentNode.removeClassName('highlight_main');
        friendCode = anchor.context.data.connectable._friendCode;
        if (anchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            anchors = this.sourceAnchorsByFriendCode[friendCode];
        } else {
            anchors = this.targetAnchorsByFriendCode[friendCode];
        }
        if (anchors != null) {
            for (i = 0; i < anchors.length; i += 1) {
                this.unhighlightAnchorLabel(anchors[i]);
            }
        }
    };

    /**
     * highlight anchor.
     */
    WiringEditor.prototype.highlightAnchorLabel = function highlightAnchorLabel(anchor) {
        anchor.wrapperElement.parentNode.addClassName('highlight');
    };

    /**
     * unhighlight anchor.
     */
    WiringEditor.prototype.unhighlightAnchorLabel = function unhighlightAnchorLabel(anchor) {
        anchor.wrapperElement.parentNode.removeClassName('highlight');
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

   /**
     *  scrollHandler, using canvas for transformate the arrows layer
     */
    WiringEditor.prototype.scrollHandler = function scrollHandler() {
        var top, left, oc, scrollX, scrollY, param;
        oc = this.layout.getCenterContainer();

        scrollX = parseInt(oc.wrapperElement.scrollLeft, 10);
        scrollY = parseInt(oc.wrapperElement.scrollTop, 10);
        param = "translate(" + (-scrollX) + " " + (-scrollY) + ")";
        this.canvas.canvasElement.generalLayer.setAttribute('transform', param);
        this.canvas.canvasElement.style.top = scrollY + 'px';
        this.canvas.canvasElement.style.left = scrollX + 'px';
        this.highlight_button.wrapperElement.style.top = scrollY + 'px';
        this.highlight_button.wrapperElement.style.left = scrollX + 'px';
    };

    /*************************************************************************
     * Make WiringEditor public
     *************************************************************************/
    Wirecloud.ui.WiringEditor = WiringEditor;

})();
