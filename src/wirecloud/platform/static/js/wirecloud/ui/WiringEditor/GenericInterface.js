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

/*global Draggable, gettext, StyledElements, Wirecloud, EzWebExt, LayoutManagerFactory */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    /*
     * GenericInterface Class
     */
    var GenericInterface = function GenericInterface(extending, wiringEditor, title, manager, className, clone) {
        if (extending === true) {
            return;
        }
        var i, name, variables, variable, anchor, anchorDiv, anchorLabel, desc, nameDiv, nameElement, del_button, copy;

        StyledElements.Container.call(this, {'class': className}, []);

        this.editingPos = false;
        this.targetAnchorsByName = {};
        this.sourceAnchorsByName = {};
        this.targetAnchors = [];
        this.sourceAnchors = [];
        this.wiringEditor = wiringEditor;
        this.title = title;
        this.className = className;
        this.initPos = {'x': 0, 'y': 0};
        this.draggableSources = [];
        this.draggableTargets = [];

        if (manager instanceof Wirecloud.ui.WiringEditor.ArrowCreator) {
            this.isMiniInterface = false;
            this.arrowCreator = manager;
        } else {
            this.isMiniInterface = true;
            this.arrowCreator = null;
        }
        this.header = document.createElement("div");
        this.header.classList.add('header');
        this.wrapperElement.appendChild(this.header);

        //widget name
        this.nameElement = document.createElement("span");
        this.nameElement.textContent = title;
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
                if (className == 'iwidget') {
                    this.wiringEditor.removeIWidget(this);
                } else {
                    this.wiringEditor.removeIOperator(this);
                }
            }.bind(this));

            // edit_position button, not for miniInterface
            this.editPos_button = new StyledElements.StyledButton({
                'title': gettext("edit_Pos"),
                'class': 'editPos_button',
                'plain': true
            });
            this.editPos_button.insertInto(this.header);
            this.editPos_button.addEventListener('click', function () {
                this.wiringEditor.ChangeObjectEditing(this);
            }.bind(this));

        }

        //sources and targets for the widget
        this.sourceDiv = document.createElement("div");
        this.sourceDiv.classList.add("sources");
        this.targetDiv = document.createElement("div");
        this.targetDiv.classList.add("targets");
        this.resourcesDiv = document.createElement("div");
        this.resourcesDiv.appendChild(this.targetDiv);
        this.resourcesDiv.appendChild(this.sourceDiv);
        this.wrapperElement.appendChild(this.resourcesDiv);

        //draggable
        if (!this.isMiniInterface) {
            this.makeDraggable();
        } else { //miniInterface
            this.draggable = new Draggable(this.wrapperElement, {iObject: this},
                function onStart(draggable, context) {
                    var miniwidget_clon, pos_miniwidget, headerHeight;

                    headerHeight = context.iObject.wiringEditor.getBoundingClientRect().top;

                    //initial position
                    pos_miniwidget = context.iObject.getBoundingClientRect();
                    context.y = pos_miniwidget.top - (headerHeight);
                    context.x = pos_miniwidget.left;
                    //create a miniwidget clon
                    if (context.iObject instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
                        miniwidget_clon = new Wirecloud.ui.WiringEditor.WidgetInterface(context.iObject.wiringEditor,
                                            context.iObject.iwidget, context.iObject.wiringEditor, true);
                    } else {
                        miniwidget_clon = new Wirecloud.ui.WiringEditor.OperatorInterface(context.iObject.wiringEditor,
                                            context.iObject.ioperator, context.iObject.wiringEditor, true);
                    }
                    miniwidget_clon.addClassName('clon');
                    //set the clon position over the originar miniWidget
                    miniwidget_clon.setBoundingClientRect(pos_miniwidget,
                     {top: -headerHeight, left: 0, width: -2, height: -10});
                    // put the miniwidget clon in the layout
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
    var getElementPos = function getElementPos(elemList, elem) {
        var i;

        for (i = 0; i < elemList.length; i++) {
            if (elem === elemList[i]) {
                return i;
            }
        }
    };

    /*************************************************************************
     * Public methods
     *************************************************************************/
    /**
     * Making Interface Draggable.
     */
    GenericInterface.prototype.makeDraggable = function makeDraggable() {
        this.draggable = new Draggable(this.wrapperElement, {iObject: this},
            function onStart(draggable, context) {
                var position;
                context.y = context.iObject.wrapperElement.style.top === "" ? 0 : parseInt(context.iObject.wrapperElement.style.top, 10);
                context.x = context.iObject.wrapperElement.style.left === "" ? 0 : parseInt(context.iObject.wrapperElement.style.left, 10);
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
                //pseudoClick
                if ((Math.abs(context.x - position.posX) < 2) && (Math.abs(context.y - position.posY) < 2)) {
                    if (context.preselected) {
                        context.iObject.unselect(true);
                    }
                } else {
                    if (!context.preselected) {
                        context.iObject.unselect(true);
                    }
                }
            },
            function () {return true; }
        );
    };

    /**
     * Make draggable all sources and targets for sorting
     */
    GenericInterface.prototype.makeSlotsDraggable = function makeSlotsDraggable() {
        var i;
        for (i = 0; i < this.draggableSources.length; i ++) {
            this.makeSlotDraggable(this.draggableSources[i], this.wiringEditor.layout.center, 'source_clon');
        }
        for (i = 0; i < this.draggableTargets.length; i ++) {
            this.makeSlotDraggable(this.draggableTargets[i], this.wiringEditor.layout.center, 'target_clon');
        }
    };

    /**
     * Make draggable a specific sources or targets for sorting
     */
    GenericInterface.prototype.makeSlotDraggable = function makeSlotDraggable(element, place, className) {
        element.draggable = new Draggable(element.wrapperElement, {iObject: element, genInterface: this, wiringEditor: this.wiringEditor},
            function onStart(draggable, context) {
                    var clon, pos_miniwidget, gridbounds, childsN, childPos;

                    //initial position
                    pos_miniwidget = context.iObject.wrapperElement.getBoundingClientRect();
                    gridbounds = context.wiringEditor.getGridElement().getBoundingClientRect();
                    context.y = pos_miniwidget.top - gridbounds.top;
                    context.x = pos_miniwidget.left - gridbounds.left;
                    //create clon
                    context.iObject.wrapperElement.classList.add('moving');
                    clon = context.iObject.wrapperElement.cloneNode(true);
                    clon.classList.add(className);
                    // put the clon in place
                    place.wrapperElement.appendChild(clon);
                    //set the clon position over the originar miniWidget
                    clon.style.height = (pos_miniwidget.height) + 'px';
                    clon.style.left = (context.x) + 'px';
                    clon.style.top = (context.y) + 'px';
                    clon.style.width = (pos_miniwidget.width) + 'px';
                    //put the clon in the context.iObjectClon
                    context.iObjectClon = clon;
                    //put the reference height for change position
                    context.refHeigth = context.iObject.wrapperElement.getBoundingClientRect().height + 2;
                    context.refHeigthUp = context.refHeigth;
                    context.refHeigthDown = context.refHeigth;
                    childsN = context.iObject.wrapperElement.parentNode.childElementCount;
                    childPos = getElementPos(context.iObject.wrapperElement.parentNode.children, context.iObject.wrapperElement);
                    context.maxUps = childPos;
                    context.maxDowns = childsN - (childPos + 1);
                },
                function onDrag(e, draggable, context, xDelta, yDelta) {
                    var top;

                    context.iObjectClon.style.left = (context.x + xDelta) + 'px';
                    context.iObjectClon.style.top = (context.y + yDelta) + 'px';

                    top = parseInt(context.iObjectClon.style.top, 10);
                    if (((context.y - top) > context.refHeigthUp) && (context.maxUps > 0)) {
                        context.maxDowns += 1;
                        context.maxUps -= 1;
                        context.refHeigthUp += context.refHeigth;
                        context.refHeigthDown -= context.refHeigth;
                        context.genInterface.up(context.iObject);
                    } else if (((top - context.y) > context.refHeigthDown) && (context.maxDowns > 0)) {
                        context.maxUps += 1;
                        context.maxDowns -= 1;
                        context.refHeigthDown += context.refHeigth;
                        context.refHeigthUp -= context.refHeigth;
                        context.genInterface.down(context.iObject);
                    }
                },
                function onFinish(draggable, context, e) {
                    context.iObject.wrapperElement.classList.remove('moving');
                    if (context.iObjectClon.parentNode) {
                        context.iObjectClon.parentNode.removeChild(context.iObjectClon);
                    }
                    context.iObjectClon = null;
                },
                function () {return true; }
        );
    };

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
    GenericInterface.prototype.addSource = function addSource(label, desc, name, anchorContext) {
        var anchor, anchorDiv, labelDiv, anchorLabel, multiconnector, id, objectId, friendCode;
        //anchorDiv
        anchorDiv = document.createElement("div");
        //if the output have not description, take the label
        if (desc === '') {
            desc = label;
        }
        anchorDiv.setAttribute('title', desc);
        //anchor visible label
        anchorLabel = document.createElement("span");
        anchorLabel.textContent = label;

        labelDiv = document.createElement("div");
        anchorDiv.appendChild(labelDiv);
        labelDiv.setAttribute('class', 'labelDiv');
        labelDiv.appendChild(anchorLabel);

        if (!this.isMiniInterface) {
            anchor = new Wirecloud.ui.WiringEditor.SourceAnchor(anchorContext, this.arrowCreator);
            anchorDiv.appendChild(anchor.wrapperElement);

            friendCode = anchor.context.data.connectable._friendCode;
            if (this.wiringEditor.sourceAnchorsByFriendCode[friendCode] == null) {
                this.wiringEditor.sourceAnchorsByFriendCode[friendCode] = [];
            }
            this.wiringEditor.sourceAnchorsByFriendCode[friendCode].push(anchor);

            //multiconnector button
            this.multiButton = new StyledElements.StyledButton({
                'title': gettext("highlight"),
                'class': 'multiconnector_icon',
                'plain': true
            });
            this.multiButton.addEventListener('click', function (e) {
                if (this instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
                    objectId = (this.iwidget.getId());
                } else {
                    objectId = (this.getId());
                }
                multiconnector = new Wirecloud.ui.WiringEditor.Multiconnector(this.wiringEditor.nextMulticonnectorId, objectId, name,
                                            this.wiringEditor.layout.getCenterContainer().wrapperElement,
                                            this.wiringEditor, anchor, null, null);
                this.wiringEditor.nextMulticonnectorId = parseInt(this.wiringEditor.nextMulticonnectorId, 10) + 1;
                this.wiringEditor.addMulticonnector(multiconnector);
                multiconnector.addMainArrow();
            }.bind(this));

            anchorDiv.appendChild(this.multiButton.wrapperElement);
            labelDiv.addEventListener('mouseover', function (e) {
                this.wiringEditor.emphasize(anchor);
            }.bind(this));
            labelDiv.addEventListener('mouseout', function (e) {
                this.wiringEditor.deemphasize(anchor);
            }.bind(this));
            // Sticky effect

            anchorDiv.addEventListener('mouseover', function (e) {
                anchor._mouseover_callback(e);
            }.bind(this));
            anchorDiv.addEventListener('mouseout', function (e) {
                anchor._mouseout_callback(e);
            }.bind(this));

            // Connect anchor whith mouseup on the label
            anchorDiv.addEventListener('mouseup', function (e) {
                anchor._mouseup_callback(e);
            }.bind(this));

            this.sourceAnchorsByName[name] = anchor;
            this.sourceAnchors.push(anchor);
        } else {
            //PseudoAnchors for mini interfaces
            anchor = document.createElement('div');
            anchor.className = 'anchor';
            anchorDiv.appendChild(anchor);
        }
        this.sourceDiv.appendChild(anchorDiv);
        this.draggableSources.push({'wrapperElement': anchorDiv, 'context': anchorContext});
    };

    /**
     * add Target.
     */
    GenericInterface.prototype.addTarget = function addTarget(label, desc, name, anchorContext) {
        var anchor, anchorDiv, labelDiv, anchorLabel, multiconnector, id, objectId, friendCode;
        //anchorDiv
        anchorDiv = document.createElement("div");
        //if the input have not description, take the label
        if (desc === '') {
            desc = label;
        }
        anchorDiv.setAttribute('title', desc);
        //anchor visible label
        anchorLabel = document.createElement("span");
        anchorLabel.textContent = label;

        labelDiv = document.createElement("div");
        anchorDiv.appendChild(labelDiv);
        labelDiv.setAttribute('class', 'labelDiv');
        labelDiv.appendChild(anchorLabel);

        if (!this.isMiniInterface) {
            anchor = new Wirecloud.ui.WiringEditor.TargetAnchor(anchorContext, this.arrowCreator);

            friendCode = anchor.context.data.connectable._friendCode;
            if (this.wiringEditor.targetAnchorsByFriendCode[friendCode] == null) {
                this.wiringEditor.targetAnchorsByFriendCode[friendCode] = [];
            }
            this.wiringEditor.targetAnchorsByFriendCode[friendCode].push(anchor);

            //multiconnector button
            this.multiButton = new StyledElements.StyledButton({
                'title': gettext("highlight"),
                'class': 'multiconnector_icon',
                'plain': true
            });
            this.multiButton.addEventListener('click', function (e) {
                if (this instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
                    objectId = this.iwidget.getId();
                } else {
                    objectId = this.getId();
                }
                multiconnector = new Wirecloud.ui.WiringEditor.Multiconnector(this.wiringEditor.nextMulticonnectorId, objectId, name,
                                            this.wiringEditor.layout.getCenterContainer().wrapperElement,
                                            this.wiringEditor, anchor, null, null);
                this.wiringEditor.nextMulticonnectorId = parseInt(this.wiringEditor.nextMulticonnectorId, 10) + 1;
                this.wiringEditor.addMulticonnector(multiconnector);
                multiconnector.addMainArrow();
            }.bind(this));
            anchorDiv.appendChild(this.multiButton.wrapperElement);
            anchorDiv.appendChild(anchor.wrapperElement);
            labelDiv.addEventListener('mouseover', function (e) {
                this.wiringEditor.emphasize(anchor);
            }.bind(this));
            labelDiv.addEventListener('mouseout', function (e) {
                this.wiringEditor.deemphasize(anchor);
            }.bind(this));

            // Sticky effect
            anchorDiv.addEventListener('mouseover', function (e) {
                anchor._mouseover_callback(e);
            }.bind(this));
            anchorDiv.addEventListener('mouseout', function (e) {
                anchor._mouseout_callback(e);
            }.bind(this));

            // Connect anchor whith mouseup on the label
            anchorDiv.addEventListener('mouseup', function (e) {
                anchor._mouseup_callback(e);
            }.bind(this));

            this.targetAnchorsByName[name] = anchor;
            this.targetAnchors.push(anchor);
        } else {
            //PseudoAnchors for mini interfaces
            anchor = document.createElement('div');
            anchor.className = 'anchor';
            anchorDiv.appendChild(anchor);
        }
        this.targetDiv.appendChild(anchorDiv);
        this.draggableTargets.push({'wrapperElement': anchorDiv, 'context': anchorContext});
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

    GenericInterface.prototype.select = function select(withCtrl) {
        var i, j, arrows;
        if (this.hasClassName('disabled')) {
            return;
        }
        if (this.hasClassName('selected')) {
            return;
        }
        if (!(this.wiringEditor.ctrlPushed) && (this.wiringEditor.selectedCount > 0) && (withCtrl)) {
            this.wiringEditor.resetSelection();
        }
        this.selected = true;
        this.addClassName('selected');
        //arrows
        for (i = 0; i < this.targetAnchors.length; i += 1) {
            arrows = this.targetAnchors[i].arrows;
            for (j = 0; j < arrows.length; j += 1) {
                arrows[j].emphasize();
            }
        }
        for (i = 0; i < this.sourceAnchors.length; i += 1) {
            arrows = this.sourceAnchors[i].arrows;
            for (j = 0; j < arrows.length; j += 1) {
                arrows[j].emphasize();
            }
        }
        this.wiringEditor.addSelectedObject(this);
    };

    GenericInterface.prototype.unselect = function unselect(withCtrl) {
        var i, j, arrows;
        this.selected = false;
        this.removeClassName('selected');
        //arrows
        for (i = 0; i < this.targetAnchors.length; i += 1) {
            arrows = this.targetAnchors[i].arrows;
            for (j = 0; j < arrows.length; j += 1) {
                arrows[j].deemphasize();
            }
        }
        for (i = 0; i < this.sourceAnchors.length; i += 1) {
            arrows = this.sourceAnchors[i].arrows;
            for (j = 0; j < arrows.length; j += 1) {
                arrows[j].deemphasize();
            }
        }
        this.wiringEditor.removeSelectedObject(this);
        if (!(this.wiringEditor.ctrlPushed) && (this.wiringEditor.selectedCount > 0) && (withCtrl)) {
            this.wiringEditor.resetSelection();
        }
    };

    /**
     * Destroy
     */
    GenericInterface.prototype.destroy = function destroy() {
        var i, j, arrows, cList;

        this.unselect();
        if (this.editingPos === true) {
            this.disableEdit();
        }
        StyledElements.Container.prototype.destroy.call(this);

        for (i = 0; i < this.sourceAnchors.length; i += 1) {
            arrows = this.sourceAnchors[i].arrows.slice(0);
            for (j = 0; j < arrows.length; j += 1) {
                cList = arrows[j].wrapperElement.classList;
                if (!cList.contains('multiconnector_arrow')) {
                    arrows[j].destroy();
                } else {
                    this.wiringEditor.removeMulticonnector(this.wiringEditor.multiconnectors[arrows[j].multiId]);
                    arrows = this.sourceAnchors[i].arrows.slice(0);
                    j = 0;
                }
            }
            this.sourceAnchors[i].destroy();
        }

        for (i = 0; i < this.targetAnchors.length; i += 1) {
            arrows = this.targetAnchors[i].arrows.slice(0);
            for (j = 0; j < arrows.length; j += 1) {
                cList = arrows[j].wrapperElement.classList;
                if (!cList.contains('multiconnector_arrow')) {
                    arrows[j].destroy();
                } else {
                    this.wiringEditor.removeMulticonnector(this.wiringEditor.multiconnectors[arrows[j].multiId]);
                    arrows = this.targetAnchors[i].arrows.slice(0);
                    j = 0;
                }
            }
            this.targetAnchors[i].destroy();
        }
        this.draggable.destroy();
        this.draggable = null;
        this.draggableSources = null;
        this.draggableTargets = null;
    };

    /**
     * edit source and targets positions
     */
    GenericInterface.prototype.editPos = function editPos() {
        var obj;
        obj = null;
        if (this.targetAnchors.length === this.sourceAnchors.length === 1) {
            return;
        }

        if (this.editingPos === true) {
            this.disableEdit();
        } else {
            this.enableEdit();
            obj = this;
        }
        this.repaint();
        return obj;
    };

    /**
     * enable poditions editor
     */
    GenericInterface.prototype.enableEdit = function enableEdit() {
        this.draggable.destroy();
        this.editingPos = true;
        this.sourceDiv.classList.add("editing");
        this.targetDiv.classList.add("editing");
        this.addClassName("editing");
        this.makeSlotsDraggable();
    };

    /**
     * disable poditions editor
     */
    GenericInterface.prototype.disableEdit = function disableEdit() {
        var i;

        this.makeDraggable();
        this.editingPos = false;
        this.sourceDiv.classList.remove("editing");
        this.targetDiv.classList.remove("editing");
        this.removeClassName("editing");
        for (i = 0; i < this.draggableSources.length; i ++) {
            this.draggableSources[i].draggable.destroy();
        }
        for (i = 0; i < this.draggableTargets.length; i ++) {
            this.draggableTargets[i].draggable.destroy();
        }
    };

    /**
     * Move an endpoint up 1 position.
     */
    GenericInterface.prototype.up = function up(element) {
        element.wrapperElement.parentNode.insertBefore(element.wrapperElement, element.wrapperElement.previousElementSibling);
        this.repaint();
    };

    /**
     * Move an endpoint down 1 position.
     */
    GenericInterface.prototype.down = function down(element) {
        if (element.wrapperElement.nextElementSibling !== null) {
            element.wrapperElement.parentNode.insertBefore(element.wrapperElement, element.wrapperElement.nextElementSibling.nextElementSibling);
            this.repaint();
        }
    };

    /**
     * get sources and targets titles lists in order to save positions
     */
    GenericInterface.prototype.getInOutPositions = function getInOutPositions() {
        var i, sources, targets;

        sources = [];
        targets = [];
        for (i = 0; i < this.sourceDiv.childNodes.length; i ++) {
            sources[i] = this.getNameForSort(this.sourceDiv.childNodes[i], 'source');
        }
        for (i = 0; i < this.targetDiv.childNodes.length; i ++) {
            targets[i] = this.getNameForSort(this.targetDiv.childNodes[i], 'target');
        }
        return {'sources': sources, 'targets': targets};
    };

    /**
     * get the source or target name for the especific node
     */
    GenericInterface.prototype.getNameForSort = function getNameForSort(node, type) {
        var i;

        if (type === 'source') {
            for (i = 0; this.draggableSources.length; i ++) {
                if (this.draggableSources[i].wrapperElement === node) {
                    if (this.className === 'iwidget') {
                        return this.draggableSources[i].context.data.vardef.name;
                    } else {
                        return this.draggableSources[i].context.data.name;
                    }
                }
            }
        } else {
            for (i = 0; this.draggableTargets.length; i ++) {
                if (this.draggableTargets[i].wrapperElement === node) {
                    if (this.className === 'iwidget') {
                        return this.draggableTargets[i].context.data.vardef.name;
                    } else {
                        return this.draggableTargets[i].context.data.name;
                    }
                }
            }
        }
    };


    /*************************************************************************
     * Make WidgetInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.GenericInterface = GenericInterface;
})();
