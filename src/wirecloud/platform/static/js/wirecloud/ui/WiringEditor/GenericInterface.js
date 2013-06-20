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

/*global Draggable, gettext, interpolate, StyledElements, Wirecloud, EzWebExt, WidgetOutputEndpoint ,LayoutManagerFactory */

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    /**
     * GenericInterface Class
     */
    var GenericInterface = function GenericInterface(extending, wiringEditor, title, manager, className, isGhost) {
        if (extending === true) {
            return;
        }
        var del_button, item, type, msg, ghostNotification;

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
        this.activatedTree = null;
        this.hollowConnections = {};
        this.fullConnections = {};
        this.subdataConnections = {};
        this.isMinimized = false;
        this.minWidth = '';
        this.movement = false;
        this.numberOfSources = 0;
        this.numberOfTargets = 0;
        this.potentialArrow = null;
        // only for minimize maximize operators.
        this.initialPos = null;
        this.isGhost = isGhost;

        if (manager instanceof Wirecloud.ui.WiringEditor.ArrowCreator) {
            this.isMiniInterface = false;
            this.arrowCreator = manager;
        } else {
            this.isMiniInterface = true;
            this.arrowCreator = null;
        }

        // Interface buttons
        if (!this.isMiniInterface) {
            if (className == 'iwidget') {
                type = 'widget';
            } else {
                type = 'operator';
            }

            // header, sources and targets for the widget
            this.resourcesDiv = new StyledElements.BorderLayout({'class': "geContainer"});
            this.sourceDiv = this.resourcesDiv.getEastContainer();
            this.sourceDiv.addClassName("sources");
            this.targetDiv = this.resourcesDiv.getWestContainer();
            this.targetDiv.addClassName("targets");
            this.header = this.resourcesDiv.getNorthContainer();
            this.header.addClassName('header');

            this.wrapperElement.appendChild(this.resourcesDiv.wrapperElement);

            // ghost interface
            if (isGhost) {
                this.wrapperElement.classList.add('ghost');
                ghostNotification = document.createElement("span");
                ghostNotification.classList.add('ghostNotification');
                msg = gettext('Warning: %(type)s not found!');
                msg = interpolate(msg, {type: type}, true);
                ghostNotification.textContent = msg;
                this.header.appendChild(ghostNotification);
            }

            // widget name
            this.nameElement = document.createElement("span");
            this.nameElement.textContent = title;
            this.header.appendChild(this.nameElement);

            // close button
            del_button = new StyledElements.StyledButton({
                'title': gettext("Remove"),
                'class': 'closebutton icon-remove',
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

            // special icon for minimized interface
            this.iconAux = document.createElement("div");
            this.iconAux.classList.add("specialIcon");
            this.iconAux.classList.add("icon-cogs");
            this.iconAux.setAttribute('title', title);
            // TODO firefox differences with absolute elements position
            if  (this.wiringEditor.navigator == "firefox") {
                this.iconAux.classList.add("firefoxCorrection");
            }
            this.resourcesDiv.wrapperElement.appendChild(this.iconAux);
            this.iconAux.addEventListener('click', function () {
                if (!this.movement) {
                    this.restore();
                }
            }.bind(this));

            // add a menu button except on mini interfaces
            this.menu_button = new StyledElements.PopupButton({
                'title': gettext("Menu"),
                'class': 'editPos_button icon-cog',
                'plain': true
            });
            this.menu_button.insertInto(this.header);
            this.menu_button.popup_menu.append(new Wirecloud.ui.WiringEditor.GenericInterfaceSettingsMenuItems(this));

        } else { //miniInterface
            this.header = document.createElement("div");
            this.header.classList.add('header');
            this.wrapperElement.appendChild(this.header);
            //widget name
            this.nameElement = document.createElement("span");
            this.nameElement.textContent = title;
            this.header.appendChild(this.nameElement);
        }

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
            if (elem == elemList[i]) {
                return i;
            }
        }
    };

    /**
     * @Private
     * is empty object?
     */
    var isEmpty = function isEmpty(obj) {
        for(var key in obj) {
            return false;
        }
        return true;
    };

    var createMulticonnector = function createMulticonnector(name, anchor) {
        var objectId, multiconnector;

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
    };

    /**
     * format Tree
     */
    var formatTree = function(treeDiv, entityHeiht, entityWidth) {
        var nLeafs, heightPerLeaf, branchList, i, nleafsAux, desp,
            checkbox, label, height, firstFrame, firstTree, width,
            diff, treeWidth;

        firstFrame = treeDiv.getElementsByClassName("labelsFrame")[0];
        firstTree = treeDiv.getElementsByClassName("tree")[0];
        diff = (firstTree.getBoundingClientRect().top - firstFrame.getBoundingClientRect().top);
        if (diff == -10) {
            return;
        }
        firstFrame.style.top = diff + 10 + 'px';
        height = firstFrame.getBoundingClientRect().height + 10;
        width = firstFrame.getBoundingClientRect().width;
        firstTree.style.height = height + 10 + 'px';
        treeWidth = treeDiv.getBoundingClientRect().width;
        if (treeWidth < entityWidth- 14) {
            treeDiv.style.width = entityWidth - 14 + 'px';
            treeDiv.style.left = 7 + 'px';
        }
        treeDiv.style.height = height + 'px';
        // Vertical Alignment
        nLeafs = treeDiv.getElementsByClassName('leaf').length;
        heightPerLeaf = height/nLeafs;

        branchList = treeDiv.getElementsByClassName("dataTree branch");
        for (i = 0; i < branchList.length; i += 1) {
            nleafsAux = branchList[i].getElementsByClassName('leaf').length;
            desp = -(((nleafsAux/2) * heightPerLeaf) - (heightPerLeaf/2)) +"px";
            label = branchList[i].getElementsByClassName('labelTree')[branchList[i].getElementsByClassName('labelTree').length - 1];
            checkbox = branchList[i].getElementsByClassName('subAnchor')[branchList[i].getElementsByClassName('subAnchor').length - 1];
            label.style.top = desp;
            checkbox.style.top = desp;
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
            function onStart(draggable, context, e) {
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
            function onFinish(draggable, context, e) {
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
                    context.iObject.movement = false;
                } else {
                    if (!context.preselected) {
                        context.iObject.unselect(true);
                    }
                    context.iObject.movement = true;
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
                function onFinish(draggable, context) {
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
     * generate SubTree
     */
    GenericInterface.prototype.generateSubTree = function(anchorContext, subAnchors) {
        var treeFrame, key, lab, checkbox, subdata, subTree, labelsFrame, context, name;

        treeFrame = document.createElement("div");
        treeFrame.classList.add('subTree');
        labelsFrame = document.createElement("div");
        labelsFrame.classList.add('labelsFrame');
        treeFrame.appendChild(labelsFrame);
        if (!isEmpty(subAnchors.subdata)) {
            for (key in subAnchors.subdata) {
                lab = document.createElement("span");
                lab.classList.add("labelTree");
                lab.textContent = subAnchors.subdata[key].label;
                name  = anchorContext.data.name + "/" + key;
				//TODO wirecloud Mode
                context = {'data': new WidgetOutputEndpoint(name, anchorContext.data, anchorContext.data.iWidget), 'iObject': this};
                checkbox = new Wirecloud.ui.WiringEditor.SourceAnchor(context, anchorContext.iObject.arrowCreator, subAnchors.subdata[key]);
                checkbox.wrapperElement.classList.add("subAnchor");
                checkbox.wrapperElement.classList.add("icon-circle");
                this.sourceAnchorsByName[name] = checkbox;
                this.sourceAnchors.push(checkbox);
                subdata = document.createElement("div");
                subdata.classList.add("dataTree");
                // emphasize listeners
                lab.addEventListener('mouseover', checkbox.emphasize.bind(checkbox), false);
                lab.addEventListener('mouseout', checkbox.deemphasize.bind(checkbox), false);
                // Sticky effect
                lab.addEventListener('mouseover', checkbox._mouseover_callback, false);
                lab.addEventListener('mouseout', checkbox._mouseout_callback, false);
                // Connect anchor whith mouseup on the label
                lab.addEventListener('mouseup', checkbox._mouseup_callback, false);
                subTree = this.generateSubTree(context, subAnchors.subdata[key], checkbox);
                if (subTree !== null) {
                    subdata.appendChild(subTree);
                    subdata.classList.add("branch");
                } else{
                    subdata.classList.add("leaf");
                }
                subdata.appendChild(lab);
                subdata.appendChild(checkbox.wrapperElement);
                labelsFrame.appendChild(subdata);
            }
            return treeFrame;
        } else {
            return null;
        }
    };

    /**
     * generate Tree
     */
    GenericInterface.prototype.generateTree = function(anchorContext, subtree, anchor, label, closeHandler) {
        var subAnchors, treeFrame, lab, checkbox, subdata,
            key, subTree, subTreeFrame, labelsFrame, labelMain, close_button, context, name;

        treeFrame = document.createElement("div");
        treeFrame.classList.add('tree');
        // close button
        close_button = new StyledElements.StyledButton({
            'title': gettext("Hide"),
            'class': 'hideTreeButton icon-remove',
            'plain': true
        });
        close_button.insertInto(treeFrame);
        close_button.addEventListener('click', function () {closeHandler();}, false);

        subAnchors = JSON.parse(subtree);
        subTreeFrame = null;
        labelsFrame = document.createElement("div");
        labelsFrame.classList.add('labelsFrame');
        if (subAnchors !== null) {
            subTreeFrame = document.createElement("div");
            subTreeFrame.classList.add('subTree');
            for (key in subAnchors) {
                lab = document.createElement("span");
                lab.classList.add("labelTree");
                lab.textContent = subAnchors[key].label;
                name = anchorContext.data.vardef.name + "/" + key;

                context = {'data': new WidgetOutputEndpoint(name, anchorContext.data, anchorContext.data.iWidget), 'iObject': this};
                checkbox = new Wirecloud.ui.WiringEditor.SourceAnchor(context, anchorContext.iObject.arrowCreator, subAnchors[key]);
                checkbox.wrapperElement.classList.add("subAnchor");
                checkbox.wrapperElement.classList.add("icon-circle");
                this.sourceAnchorsByName[name] = checkbox;
                this.sourceAnchors.push(checkbox);
                subdata = document.createElement("div");
                subdata.classList.add("dataTree");
                // emphasize listeners
                lab.addEventListener('mouseover', checkbox.emphasize.bind(checkbox), false);
                lab.addEventListener('mouseout', checkbox.deemphasize.bind(checkbox), false);
                // Sticky effect
                lab.addEventListener('mouseover', checkbox._mouseover_callback, false);
                lab.addEventListener('mouseout', checkbox._mouseout_callback, false);
                // Connect anchor whith mouseup on the label
                lab.addEventListener('mouseup', checkbox._mouseup_callback, false);
                subTree = this.generateSubTree(context, subAnchors[key], checkbox);
                if (subTree !== null) {
                    subdata.appendChild(subTree);
                    subdata.classList.add("branch");
                } else{
                    subdata.classList.add("leaf");
                }

                subdata.appendChild(lab);
                subdata.appendChild(checkbox.wrapperElement);
                labelsFrame.appendChild(subdata);
                subTreeFrame.appendChild(labelsFrame);
            }
        }

        lab = document.createElement("span");
        lab.classList.add("labelTree");
        lab.textContent = label;
        name = anchorContext.data.vardef.name + "/" + anchorContext.data.vardef.name;
        context = {'data': new WidgetOutputEndpoint(name, anchorContext.data, anchorContext.data.iWidget), 'iObject': this};
        checkbox = new Wirecloud.ui.WiringEditor.SourceAnchor(context, anchorContext.iObject.arrowCreator, subAnchors);
        checkbox.wrapperElement.classList.add("subAnchor");
        checkbox.wrapperElement.classList.add("icon-circle");
        this.sourceAnchorsByName[name] = checkbox;
        this.sourceAnchors.push(checkbox);
        subdata = document.createElement("div");
        subdata.classList.add("dataTree");
        // emphasize listeners
        lab.addEventListener('mouseover', function () {
            this.wiringEditor.emphasize(checkbox);
        }.bind(this));
        lab.addEventListener('mouseout', function () {
            this.wiringEditor.deemphasize(checkbox);
        }.bind(this));

        // Sticky effect
        lab.addEventListener('mouseover', function (e) {
            checkbox._mouseover_callback(e);
        }.bind(this));
        lab.addEventListener('mouseout', function (e) {
            checkbox._mouseout_callback(e);
        }.bind(this));

        // Connect anchor whith mouseup on the label
        lab.addEventListener('mouseup', function (e) {
            checkbox._mouseup_callback(e);
        }.bind(this));
        if (subTreeFrame !== null) {
            subdata.appendChild(subTreeFrame);
            subdata.classList.add("branch");
        } else {
            subdata.classList.add("leaf");
        }
        subdata.appendChild(lab);
        subdata.appendChild(checkbox.wrapperElement);
        labelMain = document.createElement("div");
        labelMain.classList.add('labelsFrame');
        labelMain.appendChild(subdata);
        treeFrame.appendChild(labelMain);
        return treeFrame;
    };

    /**
     *  handler for show/hide anchorTrees
     */
    GenericInterface.prototype.subdataHandler = function subdataHandler(treeDiv, name) {
        var initialHeiht, initialWidth, key, i, externalRep, layer,
            subDataArrow, firstIndex, mainEndpoint, mainSubEndPoint, theArrow, mainEndpointArrows;

        if (treeDiv == null) {
            // descend canvas
            this.wiringEditor.canvas.canvasElement.classList.remove("elevated");

            // hide tree
            this.activatedTree.classList.remove('activated');
            this.activatedTree = null;

            // deactivate subdataMode
            this.wrapperElement.classList.remove('subdataMode');

            // hide subdata connections, and show hollow and full connections
            if (!isEmpty(this.subdataConnections[name])) {
                for (key in this.subdataConnections[name]) {
                    firstIndex = this.subdataConnections[name][key].length - 1;
                    for (i = firstIndex; i >= 0 ; i -= 1) {
                        externalRep = this.subdataConnections[name][key][i].externalRep;
                        subDataArrow = this.subdataConnections[name][key][i].subDataArrow;
                        externalRep.show();
                        if (externalRep.hasClassName('hollow')) {
                            subDataArrow.hide();
                        } else {
                            // Remove all subconnections that represent full connections
                            subDataArrow.destroy();
                            this.subdataConnections[name][key].splice(i, 1);
                            this.fullConnections[name][key].splice(this.fullConnections[name][key].indexOf(externalRep), 1);
                        }
                    }
                }
            }
        } else {
            // elevate canvas
            this.wiringEditor.canvas.canvasElement.classList.add("elevated");

            // show tree
            initialHeiht = this.wrapperElement.getBoundingClientRect().height - this.header.getBoundingClientRect().height;
            initialWidth = this.wrapperElement.getBoundingClientRect().width;
            treeDiv.classList.add('activated');
            this.activatedTree = treeDiv;
            formatTree(treeDiv, initialHeiht, initialWidth);

            // activate subdataMode
            this.wrapperElement.classList.add('subdataMode');

            // add a subconnection for each main connexion in the main endpoint
            layer = this.wiringEditor.arrowCreator.layer;
            mainEndpoint = this.sourceAnchorsByName[name];
            mainSubEndPoint = this.sourceAnchorsByName[name + "/" + name];
            mainEndpointArrows = mainEndpoint.getArrows();
            for (i = 0; i < mainEndpointArrows.length ; i += 1) {
                if (!mainEndpointArrows[i].hasClassName('hollow')) {
                    // new full subConnection
                    theArrow = this.wiringEditor.canvas.drawArrow(mainSubEndPoint.getCoordinates(layer), mainEndpointArrows[i].endAnchor.getCoordinates(layer), "arrow subdataConnection full");
                    theArrow.setEndAnchor(mainEndpointArrows[i].endAnchor);
                    theArrow.setStartAnchor(mainSubEndPoint);
                    mainSubEndPoint.addArrow(theArrow);
                    mainEndpointArrows[i].endAnchor.addArrow(theArrow);

                    // add this connections to subdataConnections
                    if (this.subdataConnections[name] == null) {
                        this.subdataConnections[name] = {};
                    }
                    if (this.subdataConnections[name][name + "/" + name] == null) {
                        this.subdataConnections[name][name + "/" + name] = [];
                    }
                    this.subdataConnections[name][name + "/" + name].push({'subDataArrow' : theArrow, 'externalRep': mainEndpointArrows[i]});

                    // add this connections to fullConnections
                    if (this.fullConnections[name] == null) {
                        this.fullConnections[name] = {};
                    }
                    if (this.fullConnections[name][name + "/" + name] == null) {
                        this.fullConnections[name][name + "/" + name] = [];
                    }
                    this.fullConnections[name][name + "/" + name].push(mainEndpointArrows[i]);
                }
            }

            // show subdata connections, and hide hollow connections
            for (key in this.subdataConnections[name]) {
                for (i = 0; i < this.subdataConnections[name][key].length ; i += 1) {
                    this.subdataConnections[name][key][i].externalRep.hide();
                    this.subdataConnections[name][key][i].subDataArrow.show();
                }
            }
        }
        this.repaint();
        this.wiringEditor.activatedTree = this.activatedTree;
    };

    /**
     * add subdata connection.
     */
    GenericInterface.prototype.addSubdataConnection = function addSubdataConnection(endpoint, subdatakey, connection, sourceAnchor, targetAnchor, isLoadingWiring) {
        var theArrow, mainEndpoint, layer;

        if (this.subdataConnections[endpoint] == null) {
            this.subdataConnections[endpoint] = {};
        }
        if (this.subdataConnections[endpoint][subdatakey] == null) {
            this.subdataConnections[endpoint][subdatakey] = [];
        }

        layer = this.wiringEditor.arrowCreator.layer;
        mainEndpoint = this.sourceAnchorsByName[endpoint];
        if ((endpoint + "/" + endpoint) == subdatakey) {
            // add full connection
            if (this.fullConnections[endpoint] == null) {
                this.fullConnections[endpoint] = {};
            }
            if (this.fullConnections[endpoint][subdatakey] == null) {
                this.fullConnections[endpoint][subdatakey] = [];
            }
            connection.addClassName('full');
            theArrow = this.wiringEditor.canvas.drawArrow(mainEndpoint.getCoordinates(layer), targetAnchor.getCoordinates(layer), "arrow");
            this.fullConnections[endpoint][subdatakey].push(theArrow);
        } else {
            // add a hollow connection
            if (this.hollowConnections[endpoint] == null) {
                this.hollowConnections[endpoint] = {};
            }
            if (this.hollowConnections[endpoint][subdatakey] == null) {
                this.hollowConnections[endpoint][subdatakey] = [];
            }
            theArrow = this.wiringEditor.canvas.drawArrow(mainEndpoint.getCoordinates(layer), targetAnchor.getCoordinates(layer), "arrow hollow");
            this.hollowConnections[endpoint][subdatakey].push(theArrow);
        }
        theArrow.setEndAnchor(targetAnchor);
        theArrow.setStartAnchor(mainEndpoint);
        mainEndpoint.addArrow(theArrow);
        targetAnchor.addArrow(theArrow);
        if (isLoadingWiring) {
            connection.hide();
        } else {
            theArrow.hide();
        }
        this.subdataConnections[endpoint][subdatakey].push({'subDataArrow' : connection, 'externalRep': theArrow});
    };

    /**
     * remove subdata connection.
     */
    GenericInterface.prototype.removeSubdataConnection = function removeSubdataConnection(endpoint, subdatakey, connection) {
        var i, externalRep;

        if ((endpoint + "/" + endpoint) == subdatakey) {
            // remove full connection
            if (this.fullConnections[endpoint] != null && this.fullConnections[endpoint][subdatakey] != null) {
                for (i = 0; i < this.subdataConnections[endpoint][subdatakey].length ; i += 1) {
                    if (this.subdataConnections[endpoint][subdatakey][i].subDataArrow == connection) {
                        externalRep = this.subdataConnections[endpoint][subdatakey][i].externalRep;
                        this.fullConnections[endpoint][subdatakey].splice(this.fullConnections[endpoint][subdatakey].indexOf(externalRep), 1);
                        externalRep.destroy();
                        connection.destroy();
                        this.subdataConnections[endpoint][subdatakey].splice(i, 1);
                        break;
                    }
                }
            } else {
                //error
            }
        } else {
            // remove a hollow connection
            if (this.hollowConnections[endpoint] != null && this.hollowConnections[endpoint][subdatakey] != null) {
                for (i = 0; i < this.subdataConnections[endpoint][subdatakey].length ; i += 1) {
                    if (this.subdataConnections[endpoint][subdatakey][i].subDataArrow == connection) {
                        externalRep = this.subdataConnections[endpoint][subdatakey][i].externalRep;
                        this.hollowConnections[endpoint][subdatakey].splice(this.hollowConnections[endpoint][subdatakey].indexOf(externalRep), 1);
                        externalRep.destroy();
                        connection.destroy();
                        this.subdataConnections[endpoint][subdatakey].splice(i, 1);
                        break;
                    }
                }
            } else {
                //error
            }
        }
    };

    /**
     * add Source.
     */
    GenericInterface.prototype.addSource = function addSource(label, desc, name, anchorContext) {
        var anchor, anchorDiv, labelDiv, anchorLabel, treeDiv, subAnchors;

        // sources counter
        this.numberOfSources += 1;

        // anchorDiv
        anchorDiv = document.createElement("div");
        // if the output have not description, take the label
        if (desc === '') {
            desc = label;
        }
        anchorDiv.setAttribute('title', desc);
        anchorDiv.setAttribute('class', 'anchorDiv');
        // anchor visible label
        anchorLabel = document.createElement("span");
        anchorLabel.textContent = label;

        labelDiv = document.createElement("div");
        anchorDiv.appendChild(labelDiv);
        labelDiv.setAttribute('class', 'labelDiv');
        labelDiv.appendChild(anchorLabel);


        if (!this.isMiniInterface) {
            anchor = new Wirecloud.ui.WiringEditor.SourceAnchor(anchorContext, this.arrowCreator);
            labelDiv.appendChild(anchor.wrapperElement);

            anchor.menu.append(new StyledElements.MenuItem(gettext('Add multiconnector'), createMulticonnector.bind(this, name, anchor)));
            // tree test
            if ((label == "Image URL") ||(label == "Point od interest") ) {
                anchorContext.data.subdata = "{\"FN\": {\"label\": \"Full Name\", \"description\": \"Full name of the contact\", \"semanticType\": \"pedrooooo\", \"subdata\": {\"firstname\": {\"label\": \"First name\", \"description\": \"First name of the contact\", \"semanticType\": \"pedrooooo2\", \"subdata\": {}}, \"lastname\": {\"label\": \"Last name\", \"description\": \"Last name of the contact\", \"semanticType\": \"pedrooooo3\", \"subdata\": {}}}}, \"ADDR\": {\"label\": \"Address\", \"description\": \"Address of the contact\", \"semanticType\": \"pedrooooo4\", \"subdata\": {}}}";
                subAnchors = anchorContext.data.subdata;
            } else {
                subAnchors = null;
            }
            // tree test

            subAnchors = anchorContext.data.subdata;
            if (subAnchors != null) {
                // generate tree
                treeDiv = document.createElement("div");
                treeDiv.classList.add('anchorTree');
                treeDiv.addEventListener('click', function (e) {
                    e.stopPropagation();
                }.bind(this), false);
                treeDiv.addEventListener('mousedown', function (e) {
                    e.stopPropagation();
                }.bind(this), false);
                treeDiv.appendChild(this.generateTree(anchorContext, subAnchors, anchor, label, this.subdataHandler.bind(this, null, name)));
                this.wrapperElement.appendChild(treeDiv);

                // handler for subdata tree
                anchor.menu.append(new StyledElements.MenuItem(gettext("Unfold data structure"), this.subdataHandler.bind(this, treeDiv, name)));
            }

            labelDiv.addEventListener('mouseover', function () {
                if (!this.wiringEditor.recommendationsActivated) {
                    this.wiringEditor.emphasize(anchor);
                }
            }.bind(this));
            labelDiv.addEventListener('mouseout', function () {
                if (!this.wiringEditor.recommendationsActivated) {
                    this.wiringEditor.deemphasize(anchor);
                }
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
        var anchor, anchorDiv, labelDiv, anchorLabel;

        // targets counter
        this.numberOfTargets += 1;

        //anchorDiv
        anchorDiv = document.createElement("div");
        //if the input have not description, take the label
        if (desc === '') {
            desc = label;
        }
        anchorDiv.setAttribute('title', desc);
        anchorDiv.setAttribute('class', 'anchorDiv');
        //anchor visible label
        anchorLabel = document.createElement("span");
        anchorLabel.textContent = label;

        labelDiv = document.createElement("div");
        labelDiv.setAttribute('class', 'labelDiv');
        labelDiv.appendChild(anchorLabel);
        anchorDiv.appendChild(labelDiv);

        if (!this.isMiniInterface) {
            anchor = new Wirecloud.ui.WiringEditor.TargetAnchor(anchorContext, this.arrowCreator);
            labelDiv.appendChild(anchor.wrapperElement);

            anchor.menu.append(new StyledElements.MenuItem(gettext('Add multiconnector'), createMulticonnector.bind(this, name, anchor)));

            labelDiv.addEventListener('mouseover', function () {
                if (!this.wiringEditor.recommendationsActivated) {
                    this.wiringEditor.emphasize(anchor);
                }
            }.bind(this));
            labelDiv.addEventListener('mouseout', function () {
                if (!this.wiringEditor.recommendationsActivated) {
                    this.wiringEditor.deemphasize(anchor);
                }
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

    /**
     * select this genericInterface
     */
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

    /**
     * unselect this genericInterface
     */
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
        this.wrapperElement = null;
        this.hollowConnections = null;
        this.subdataConnections = null;
    };

    /**
     * edit source and targets positions
     */
    GenericInterface.prototype.editPos = function editPos() {
        var obj;
        obj = null;
        if ((this.targetAnchors.length <= 1) && (this.sourceAnchors.length <= 1)) {
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
        this.sourceDiv.wrapperElement.classList.add("editing");
        this.targetDiv.wrapperElement.classList.add("editing");
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
        this.sourceDiv.wrapperElement.classList.remove("editing");
        this.targetDiv.wrapperElement.classList.remove("editing");
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
        for (i = 0; i < this.sourceDiv.wrapperElement.childNodes.length; i ++) {
            sources[i] = this.getNameForSort(this.sourceDiv.wrapperElement.childNodes[i], 'source');
        }
        for (i = 0; i < this.targetDiv.wrapperElement.childNodes.length; i ++) {
            targets[i] = this.getNameForSort(this.targetDiv.wrapperElement.childNodes[i], 'target');
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
                        if (!this.isGhost) {
                            return this.draggableSources[i].context.data.vardef.name;
                        } else {
                            return this.draggableSources[i].context.data.label;
                        }
                    } else {
                        return this.draggableSources[i].context.data.name;
                    }
                }
            }
        } else {
            for (i = 0; this.draggableTargets.length; i ++) {
                if (this.draggableTargets[i].wrapperElement === node) {
                    if (this.className === 'iwidget') {
                        if (!this.isGhost) {
                            return this.draggableTargets[i].context.data.vardef.name;
                        } else {
                            return this.draggableTargets[i].context.data.label;
                        }
                    } else {
                        return this.draggableTargets[i].context.data.name;
                    }
                }
            }
        }
    };

    /**
     * change to minimized view for operators
     */
    GenericInterface.prototype.minimize = function minimize(omitEffects) {

        if (!omitEffects) {
            this.resizeTransitStart();
        }

        this.initialPos = this.wrapperElement.getBoundingClientRect();
        this.minWidth = this.wrapperElement.style.minWidth;

        this.wrapperElement.classList.add('reducedInt');
        this.wrapperElement.style.minWidth = '55px';

        this.wrapperElement.style.top = (this.initialPos.top - this.wiringEditor.headerHeight) + ((this.initialPos.height - 8) / 2) - 12 + 'px';
        this.wrapperElement.style.left = (this.initialPos.left - this.wiringEditor.menubarWidth) + (this.initialPos.width / 2) - 32 + 'px';

        this.isMinimized = true;
    };

    /**
     * change to normal view for operators
     */
    GenericInterface.prototype.restore = function restore(omitEffects) {
        var currentPos;

        if (!omitEffects) {
            this.resizeTransitStart();
        }

        currentPos = this.wrapperElement.getBoundingClientRect();
        this.wrapperElement.style.top = (currentPos.top - this.wiringEditor.headerHeight) - ((this.initialPos.height + 8) / 2) + 'px';
        this.wrapperElement.style.left = (currentPos.left - this.wiringEditor.menubarWidth) - (this.initialPos.width / 2) + 32 + 'px';

        this.wrapperElement.style.minWidth = this.minWidth;

        this.wrapperElement.classList.remove('reducedInt');

        this.isMinimized = false;
    };

    /**
     * Resize Transit Start
     */
    GenericInterface.prototype.resizeTransitStart = function resizeTransitStart() {
        var interval;

        // transition events
        this.wrapperElement.classList.add('flex');
        /*this.wrapperElement.addEventListener('webkitTransitionEnd', this.resizeTransitEnd.bind(this), false);
        this.wrapperElement.addEventListener('transitionend', this.resizeTransitEnd.bind(this), false);
        this.wrapperElement.addEventListener('oTransitionEnd', this.resizeTransitEnd.bind(this), false);*/
        interval = setInterval(this.animateArrows.bind(this), 20);
        setTimeout(function () {
            clearInterval(interval);
        }, 400);

        setTimeout(function () {
            this.resizeTransitEnd();
        }.bind(this), 450);

    };

    /**
     * Resize Transit End
     */
    GenericInterface.prototype.resizeTransitEnd = function resizeTransitEnd() {
        // transition events
        this.wrapperElement.classList.remove('flex');
        /*this.wrapperElement.removeEventListener('webkitTransitionEnd', this.resizeTransitEnd.bind(this), false);
        this.wrapperElement.removeEventListener('transitionend', this.resizeTransitEnd.bind(this), false);
        this.wrapperElement.removeEventListener('oTransitionEnd', this.resizeTransitEnd.bind(this), false);*/
        this.repaint();
    };

    /**
     * Animated arrows for the transitions betwen minimized an normal shape
     */
    GenericInterface.prototype.animateArrows = function animateArrows() {
        var key, layer;

        for (key in this.sourceAnchorsByName) {
            this.sourceAnchorsByName[key].repaint();
        }

        for (key in this.targetAnchorsByName) {
            this.targetAnchorsByName[key].repaint();
        }

        if (this.potentialArrow != null) {
            layer = this.wiringEditor.canvas.getHTMLElement().parentNode;
            if (this.potentialArrow.startAnchor != null) {
                // from source to target
                this.potentialArrow.setStart(this.potentialArrow.startAnchor.getCoordinates(layer));
            } else {
                // from target to source
                this.potentialArrow.setEnd(this.potentialArrow.endAnchor.getCoordinates(layer));
            }
        }
    };

    /*************************************************************************
     * Make GenericInterface public
     *************************************************************************/
    Wirecloud.ui.WiringEditor.GenericInterface = GenericInterface;
})();
