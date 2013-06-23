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

/*global Constants, EzWebExt, LayoutManagerFactory, opManager, StyledElements, Wirecloud, gettext, WidgetOutputEndpoint */
if (!Wirecloud.ui) {

    Wirecloud.ui = {};
}

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/

    var WiringEditor = function WiringEditor(id, options) {
        if (id == null) {
            return;
        }
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

        // Wiring alert for empty WiringEditor
        this.entitiesNumber = 0;
        this.emptyBox = document.createElement('div');

        this.emptyBox.classList.add('wiringEmptyBox');
        this.emptyBox.classList.add('alert');
        this.emptyBox.classList.add('alert-info');
        this.emptyBox.classList.add('alert-block');

        // Title
        var pTitle = document.createElement('h4');
        pTitle.textContent = gettext("Welcome to the Wiring Editor view!");
        this.emptyBox.appendChild(pTitle);

        // Control panel
        this.controlPanel = document.createElement('div');
        this.controlPanel.classList.add('controlPanel');
        this.MinimizeAllOperatorsButton = new StyledElements.StyledButton({
                'title': gettext("Maximize all operators"),
                'class': 'ResizeAllOperatorsButton icon-resize-full',
                'plain': true
            });
        this.MinimizeAllOperatorsButton.insertInto(this.controlPanel);
        this.MinimizeAllOperatorsButton.addEventListener('click', function () {
            var key;
            if (this.MinimizeAllOperatorsButton.hasClassName('icon-resize-full')) {
                // Maximize all operators
                for (key in this.currentlyInUseOperators) {
                    if (this.currentlyInUseOperators[key].isMinimized) {
                        this.currentlyInUseOperators[key].restore();
                    }
                }
                this.MinimizeAllOperatorsButton.removeClassName('icon-resize-full');
                this.MinimizeAllOperatorsButton.addClassName('icon-resize-small');
            } else {
                // Minimize all operators
                for (key in this.currentlyInUseOperators) {
                    if (!this.currentlyInUseOperators[key].isMinimized) {
                        this.currentlyInUseOperators[key].minimize();
                    }
                }
                this.MinimizeAllOperatorsButton.removeClassName('icon-resize-small');
                this.MinimizeAllOperatorsButton.addClassName('icon-resize-full');
            }
        }.bind(this));
        this.layout.getCenterContainer().wrapperElement.appendChild(this.controlPanel);

        // Message
        var message = document.createElement('p');
        message.innerHTML = gettext("Please drag some widgets and operators from the stencil on the left, and drop them into this area. <br/>Then, link outputs with inputs to wire the resources.");
        this.emptyBox.appendChild(message);
        this.layout.getCenterContainer().wrapperElement.appendChild(this.emptyBox);
        this.emptyBox.classList.add('hidden');

        // canvas for arrows
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
            if (pos != -1) {
                this.arrows.splice(pos, 1);
            }
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

        this._semantic_anchor_map_func = function (anchor) {
            var rec, anchors, i, entityId, anchorId;

            if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
                entityId = anchor.context.iObject.iwidget.widget.id;
                if (anchor.context.data.vardef) {
                    anchorId = anchor.context.data.vardef.name;
                } else {
                    anchorId = anchor.context.data.name;
                }
            } else {
                entityId = anchor.context.iObject.ioperator.meta.uri;
                anchorId = anchor.context.data.name;
            }
            //semantic recommendations
            for (rec in this.recommendations) {
                for (anchors in this.recommendations[rec]) {
                    for (i = 0; i < this.recommendations[rec][anchors].length; i += 1) {
                        if ((this.recommendations[rec][anchors][i].destination == entityId) &&
                            (this.recommendations[rec][anchors][i].destinationEndpoint == anchorId)) {
                            if (this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode] == null) {
                                this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode] = {};
                            }
                            if (this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec] == null) {
                                this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec] = {};
                            }
                            if (this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec][anchors] == null) {
                                this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec][anchors] = [];
                            }
                            this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec][anchors].push(anchor);
                        }
                    }
                }
            }
        }.bind(this);

        this._remove_semantic_anchor_map_func = function (anchor) {
            var rec, anchors, i, entityId, anchorId, mc, entity, endpoint, index;

            if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
                entityId = anchor.context.iObject.iwidget.widget.id;
                if (anchor.context.data.vardef) {
                    anchorId = anchor.context.data.vardef.name;
                } else {
                    anchorId = anchor.context.data.name;
                }
            } else {
                entityId = anchor.context.iObject.ioperator.meta.uri;
                if (anchor.context.data.vardef) {
                    anchorId = anchor.context.data.vardef.name;
                } else {
                    anchorId = anchor.context.data.name;
                }
            }
            //semantic recommendations
            for (rec in this.recommendations) {
                for (anchors in this.recommendations[rec]) {
                    for (i = 0; i < this.recommendations[rec][anchors].length; i += 1) {
                        if ((this.recommendations[rec][anchors][i].destination == entityId) &&
                            (this.recommendations[rec][anchors][i].destinationEndpoint == anchorId)) {
                            index = this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec][anchors].indexOf(anchor);
                            this.anchorsInvolved[this.recommendations[rec][anchors][i].matchCode][rec][anchors].splice(index, 1);
                            }
                    }
                }
            }
            //cleaning
            for (mc in this.anchorsInvolved) {
                for (entity in this.anchorsInvolved[mc]) {
                    for (endpoint in this.anchorsInvolved[mc][entity]) {
                        if (this.anchorsInvolved[mc][entity][endpoint].length === 0) {
                            delete this.anchorsInvolved[mc][entity][endpoint];
                        }
                    }
                    if (isEmpty(this.anchorsInvolved[mc][entity])) {
                        delete this.anchorsInvolved[mc][entity];
                    }
                }
            }
        }.bind(this);

        this._keydownListener = keydownListener.bind(this);
        this._keyupListener = keyupListener.bind(this);

        // info del navegador
        var navegador = navigator.userAgent;
        if (navegador.indexOf('MSIE') != -1) {
            this.navigator = "explorer";
        } else if (navegador.indexOf('Firefox') != -1) {
            this.navigator = "firefox";
        } else if (navegador.indexOf('Chrome') != -1) {
            this.navigator = "chrome";
        } else if (navegador.indexOf('Opera') != -1) {
            this.navigator = "opera";
        } else {
            this.navigator = "nisu";
        }
    };
    WiringEditor.prototype = new StyledElements.Alternative();

    WiringEditor.prototype.view_name = 'wiring';

    /*************************************************************************
     * Private methods
     *************************************************************************/
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
                    this.mini_widgets[iwidget.id].disable();
                } else {
                    throw new Error('Widget not found');
                }
                return iwidget_interface.getAnchor(desc.endpoint);
            }
            break;
        case 'ioperator':
            if (this.currentlyInUseOperators[desc.id] != null) {
                return this.currentlyInUseOperators[desc.id].getAnchor(desc.endpoint);
            }
        }
    };

    /**
     * @Private
     * load wiring from status and workspace info
     */
    var loadWiring = function loadWiring(workspace, WiringStatus) {
        var iwidgets, iwidget, widget_interface, miniwidget_interface, reallyInUseOperators,
            operator, operator_interface, operator_instance, connection, connectionView, startAnchor,
            endAnchor, arrow, isMenubarRef, pos, op_id, multiconnectors, multi, multiInstance, key,
            anchor, endpoint_order, operators, k, entitiesIds, currentSource, currentTarget, i,
            availableOperators, position, extraclass, readOnly;

        if (WiringStatus == null) {
            WiringStatus = {};
        }

        if (!Array.isArray(WiringStatus.connections)) {
            WiringStatus.connections = [];
        }

        if (typeof WiringStatus.operators !== "object") {
            WiringStatus.operators = {};
        }

        if (!Array.isArray(WiringStatus.views)) {
            WiringStatus.views = [
                {
                    label: 'default',
                    iwidgets: {},
                    operators: {},
                    multiconnectors: {},
                    connections: []
                }
            ];
        }

        /* semantic recommendations */
        /* colorCodes = {'EQUIVALENT': 'green', 'SUBSUMED':'green', 'SUBSUMES':'orange', 'DISJOINT':'red', 'OVERLAP':'grey', 'NONE':'grey'} */
        this.semanticStatus = JSON.parse('{"matchings":[{"origin":"Morfeo/Flickr/2.53/urlImage","destination":"Morfeo/Web Browser/0.5/url","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Search/1.24/keyword","destination":"Morfeo/Flickr/2.53/keyword","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Flickr/2.53/urlImage","destination":"Morfeo/Multimedia Viewer/0.5/uriSlot","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Multimedia Viewer/0.5/uriEvent","destination":"Morfeo/Web Browser/0.5/url","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Multimedia Viewer/0.5/urlEvent","destination":"Morfeo/Web Browser/0.5/url","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Flickr/2.53/keyword_event","destination":"EzWeb/Wikipedia/2.31/keyword","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Search/1.24/keyword","destination":"EzWeb/Wikipedia/2.31/keyword","matchCode":"EQUIVALENT"},{"origin":"EzWeb/Wikipedia/2.31/url","destination":"Morfeo/Web Browser/0.5/url","matchCode":"EQUIVALENT"},{"origin":"EzWeb/Wikipedia/2.31/url","destination":"Morfeo/Multimedia Viewer/0.5/uriSlot","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Search/1.24/keyword","destination":"CoNWeT/sendsms/0.1/message","matchCode":"EQUIVALENT"}],"timestamp":"2013-02-15 14:02:55.273","id":"1"}');
        //this.semanticStatus = JSON.parse('{"matchings":[{"origin":"Morfeo/Flickr/2.53/urlImage","destination":"Morfeo/Web Browser/0.5/url","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Flickr/2.53/Keyword_event","destination":"Morfeo/Flickr/2.53/Keyword","matchCode":"DISJOINT"},{"origin":"Morfeo/Search/1.24/keyword","destination":"Morfeo/Flickr/2.53/keyword","matchCode":"SUBSUMED"},{"origin":"Morfeo/Flickr/2.53/urlImage","destination":"Morfeo/Multimedia Viewer/0.5/uriSlot","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Multimedia Viewer/0.5/uriEvent","destination":"Morfeo/Web Browser/0.5/url","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Multimedia Viewer/0.5/urlEvent","destination":"Morfeo/Web Browser/0.5/url","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Flickr/2.53/keyword_event","destination":"EzWeb/Wikipedia/2.31/keyword","matchCode":"EQUIVALENT"},{"origin":"Morfeo/Search/1.24/keyword","destination":"EzWeb/Wikipedia/2.31/keyword","matchCode":"SUBSUMES"},{"origin":"EzWeb/Wikipedia/2.31/url","destination":"Morfeo/Web Browser/0.5/url","matchCode":"OVERLAP"},{"origin":"EzWeb/Wikipedia/2.31/url","destination":"Morfeo/Multimedia Viewer/0.5/uriSlot","matchCode":"EQUIVALENT"}],"timestamp":"2013-02-15 14:02:55.273","id":"1"}');
        this.recommendations = {};

        this.targetsOn = true;
        this.sourcesOn = true;
        this.targetAnchorList = [];
        this.sourceAnchorList = [];
        this.arrows = [];
        this.iwidgets = {};
        this.multiconnectors = {};
        this.mini_widgets = {};
        this.currentlyInUseOperators = {};
        this.selectedOps = {};
        this.selectedOps.length = 0;
        this.selectedWids = {};
        this.selectedWids.length = 0;
        this.selectedMulti = {};
        this.selectedMulti.length = 0;
        this.selectedCount = 0;
        this.menubarWidth = document.getElementsByClassName('menubar')[0].getWidth();
        this.headerHeight = document.getElementById('wirecloud_header').getHeight() - 5;
        this.ctrlPushed = false;
        this.nextOperatorId = 0;
        this.nextMulticonnectorId = 0;
        this.recommendationsActivated = false;
        this.anchorsInvolved = {'EQUIVALENT': {},
                                'SUBSUMED': {},
                                'SUBSUMES': {},
                                'HASPART' : {},
                                'DISJOINT': {},
                                'OVERLAP': {},
                                'NONE': {}};
        this.EditingObject = null;
        this.entitiesNumber = 0;

        iwidgets = workspace.getIWidgets();
        availableOperators = Wirecloud.wiring.OperatorFactory.getAvailableOperators();

        //Semantic Status by entity ID
        entitiesIds = [];
        for (i = 0; i < iwidgets.length; i++) {
            iwidget = iwidgets[i];
            //dont repeat any iwidget.
            if (entitiesIds.indexOf(iwidget.widget.getId()) == -1) {
                entitiesIds.push(iwidget.widget.getId());
            }
        }
        for (key in availableOperators) {
            entitiesIds.push(availableOperators[key].uri);
        }
        this.refactorSemanticInfo(entitiesIds);

        // Widgets
        for (i = 0; i < iwidgets.length; i++) {
            iwidget = iwidgets[i];
            // mini widgets
            isMenubarRef = true;
            miniwidget_interface = new Wirecloud.ui.WiringEditor.WidgetInterface(this, iwidget, this, isMenubarRef);
            this.mini_widgets[iwidget.id] = miniwidget_interface;
            this.mini_widget_section.appendChild(miniwidget_interface);

            // widget
            for (k = 0; k < WiringStatus.views.length; k ++) {
                if (iwidget.id in WiringStatus.views[k].iwidgets) {
                    miniwidget_interface.disable();
                    widget_interface = this.addIWidget(this, iwidget, WiringStatus.views[k].iwidgets[iwidget.id].endPointsInOuts);
                    widget_interface.setPosition(WiringStatus.views[k].iwidgets[iwidget.id].widget);
                    break;
                }
            }
        }

        // Ghost Widgets!
        var ghostName;
        for (k = 0; k < WiringStatus.views.length; k ++) {
            for (key in WiringStatus.views[k].iwidgets) {
                if (!this.iwidgets[key]) {
                    // Widget Name if is known
                    if (WiringStatus.views[k].iwidgets[key].name != null) {
                        ghostName = WiringStatus.views[k].iwidgets[key].name;
                    } else {
                        ghostName = gettext("unknown name");
                    }
                    iwidget = {
                        'id': key,
                        'display_name': ghostName,
                        'ghost': true
                    };
                    iwidget['widget'] = iwidget;
                    widget_interface = this.addIWidget(this, iwidget, WiringStatus.views[k].iwidgets[key].endPointsInOuts);
                    widget_interface.setPosition(WiringStatus.views[k].iwidgets[key].widget);
                }
            }
        }

        // mini operators
        for (key in availableOperators) {
            isMenubarRef = true;
            operator = availableOperators[key];
            operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, operator, this, isMenubarRef);
            this.mini_operator_section.appendChild(operator_interface);
        }

        // operators
        reallyInUseOperators = workspace.wiring.ioperators;
        operators = WiringStatus.operators;
        for (key in operators) {
            if (!(key in reallyInUseOperators)) {
                // Ghost Operator
                operator_instance = {'id': operators[key].id, 'name': operators[key].name, 'ghost': true};
            } else {
                operator_instance = reallyInUseOperators[key];
            }
            op_id = operator_instance.id;
            if (this.nextOperatorId < op_id) {
                this.nextOperatorId = op_id + 1;
            }

            endpoint_order = {'sources': [], 'targets': []};
            position = null;
            for (i = 0; i < WiringStatus.views.length; i ++) {
                if (key in WiringStatus.views[i].operators) {
                    if ('endPointsInOuts' in WiringStatus.views[i].operators[key]) {
                        endpoint_order = WiringStatus.views[i].operators[key].endPointsInOuts;
                    }
                    position = WiringStatus.views[i].operators[key].widget;
                    break;
                }
            }
            operator_interface = this.addIOperator(operator_instance, endpoint_order);
            if (position != null) {
                operator_interface.setPosition(position);
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
                anchor = this.currentlyInUseOperators[multi.objectId].getAnchor(multi.sourceName);
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
        if (!('connections' in WiringStatus.views[0])) {
            WiringStatus.views[0].connections = [];
        }

        for (i = 0; i < WiringStatus.connections.length; i += 1) {
            connection = WiringStatus.connections[i];
            if (i in WiringStatus.views[0].connections) {
                connectionView = WiringStatus.views[0].connections[i];
            } else {
                connectionView = {};
            }
            startAnchor = findAnchor.call(this, connection.source, workspace);
            endAnchor = findAnchor.call(this, connection.target, workspace);

            if (startAnchor !== null && endAnchor !== null) {
                if (connection.readOnly) {
                    readOnly = true;
                    extraclass = 'readOnly';
                    startAnchor.context.iObject.incReadOnlyConnectionsCount();
                    endAnchor.context.iObject.incReadOnlyConnectionsCount();
                } else {
                    readOnly = false;
                    extraclass = null;
                }
                arrow = this.canvas.drawArrow(startAnchor.getCoordinates(this.layout.getCenterContainer().wrapperElement),
                                              endAnchor.getCoordinates(this.layout.getCenterContainer().wrapperElement), extraclass, readOnly);
                arrow.startAnchor = startAnchor;
                startAnchor.addArrow(arrow);
                arrow.endAnchor = endAnchor;
                endAnchor.addArrow(arrow);
                if ((startAnchor.isSubAnchor) || (endAnchor.isSubAnchor)) {
                    arrow.addClassName('arrow subdataConnection');
                    if (startAnchor.isSubAnchor) {
                        currentSource = startAnchor;
                        currentTarget = endAnchor;
                    } else {
                        currentSource = endAnchor;
                        currentTarget = startAnchor;
                    }
                    currentSource.context.iObject.addSubdataConnection(currentSource.context.data.name.split("/")[0], currentSource.context.data.name, arrow, currentSource, currentTarget, true);
                } else {
                    arrow.addClassName('arrow');
                }
                arrow.setPullerStart(connectionView.pullerStart);
                arrow.setPullerEnd(connectionView.pullerEnd);
                if (connectionView.startMulti != null) {
                    multi = this.multiconnectors[connectionView.startMulti];
                    arrow.startMulti = connectionView.startMulti;
                    pos = multi.getCoordinates(this.layout);
                    arrow.setStart(pos);
                    multi.addArrow(arrow);
                }
                if (connectionView.endMulti != null) {
                    arrow.endMulti = connectionView.endMulti;
                    multi = this.multiconnectors[connectionView.endMulti];
                    pos = multi.getCoordinates(this.layout);
                    arrow.setEnd(pos);
                    multi.addArrow(arrow);
                }
                arrow.redraw();
            }
        }

        // Minimize all operators
        for (key in this.currentlyInUseOperators) {
            if (!this.currentlyInUseOperators[key].isMinimized) {
                this.currentlyInUseOperators[key].minimize();
            }
        }

        this.activateCtrlMultiSelect();
        this.valid = true;
        if (this.entitiesNumber === 0) {
            this.emptyBox.classList.remove('hidden');
        }
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
                    setTimeout(function () {
                        try {
                            clearInterface.call(this);
                        } catch (e1) {
                            msg = gettext('Fatal error loading wiring data');
                            layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                        }
                        // private functions
                        var yesHandler2 = function () {
                            wiringStatus = null;
                            try {
                                loadWiring.call(this, workspace, wiringStatus);
                            } catch (e4) {
                                try {
                                    clearInterface.call(this);
                                } catch (e5) {}
                                // Use setTimeout as at the end of the yesHandler all window menus are closed including the one we are opening now
                                setTimeout(function () {
                                    msg = gettext('Fatal error loading wiring data');
                                    layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
                                }, 0);
                            }
                        }.bind(this);
                        var noHandler2 = function () {
                            layoutManager.changeCurrentView('workspace');
                        }.bind(this);
                        var msg = gettext("Unrecoverable error while loading wiring data. Do you want to start with an empty wiring?");
                        var dialog = new Wirecloud.ui.AlertWindowMenu();
                        dialog.setMsg(msg);
                        dialog.setHandler(yesHandler2, noHandler2);
                        dialog.show();
                    }.bind(this), 0);
                }
            }.bind(this);
            var noHandler = function () {
                layoutManager.changeCurrentView('workspace');
            };
            var msg = gettext("There was an error loading the wiring status. Do you want Wirecloud to try to recover the state of your connections automatically?");
            var dialog = new Wirecloud.ui.AlertWindowMenu();
            dialog.setMsg(msg);
            dialog.setHandler(yesHandler, noHandler);
            dialog.show();
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
        for (key in this.currentlyInUseOperators) {
            this.layout.getCenterContainer().removeChild(this.currentlyInUseOperators[key]);
            this.currentlyInUseOperators[key].destroy();
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
        this.currentlyInUseOperators = {};
        this.multiconnectors = {};
        this.anchorsInvolved = {};
    };

    /*************************************************************************
     * Public methods
     *************************************************************************/

    /**
     * returns the dom element asociated with the grid
     */
    WiringEditor.prototype.getGridElement = function getGridElement() {
        return this.layout.getCenterContainer().wrapperElement;
    };

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
     * add new entity to this.recommendations
     */
    WiringEditor.prototype.refactorSemanticInfo = function refactorSemanticInfo(entitiesIds) {
        var matchings, i, origin, destination, matchCode, originEndpoint, destinationEndpoint, match;

        matchings = this.semanticStatus.matchings;

        for (i = 0; i < matchings.length; i += 1) {
            match = matchings[i].origin.split('/');
            origin = match.slice(0,3).join('/');
            originEndpoint = match.slice(3, match.length).join('/');
            match = matchings[i].destination.split('/');
            destination = match.slice(0,3).join('/');
            destinationEndpoint = match.slice(3, match.length).join('/');
            matchCode = matchings[i].matchCode;
            if ((entitiesIds.indexOf(origin) == -1) || (entitiesIds.indexOf(destination) == -1)) {
                continue;
            }
            if (!this.recommendations.hasOwnProperty(origin)) {
                this.recommendations[origin] = {};
            }
            if (this.recommendations[origin][originEndpoint] == null) {
                this.recommendations[origin][originEndpoint] = [];
            }
            this.recommendations[origin][originEndpoint].push({'destination': destination,
                                                            'destinationEndpoint': destinationEndpoint,
                                                            'matchCode': matchCode});

            //las relacciones son relaccion bidireccionales.
            if (!this.recommendations.hasOwnProperty(destination)) {
                this.recommendations[destination] = {};
            }
            if (this.recommendations[destination][destinationEndpoint] == null) {
                this.recommendations[destination][destinationEndpoint] = [];
            }
            this.recommendations[destination][destinationEndpoint].push({'destination': origin,
                                                                      'destinationEndpoint': originEndpoint,
                                                                      'matchCode': matchCode});
        }
    };

    /**
     * Saves the wiring state.
     */
    WiringEditor.prototype.serialize = function serialize() {
        var pos, i, key, widget, arrow, operator_interface, ioperator,
        WiringStatus, multiconnector, height, inOutPos, positions, name;

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
            positions = {'widget' : pos, 'endPointsInOuts' : inOutPos, 'name': widget.iwidget.widget.id};
            WiringStatus.views[0].iwidgets[key] = positions;
        }

        for (key in this.currentlyInUseOperators) {
            if (this.currentlyInUseOperators[key].isMinimized) {
                this.currentlyInUseOperators[key].restore(true);
            }
            operator_interface = this.currentlyInUseOperators[key];
            pos = operator_interface.getStylePosition();
            inOutPos = operator_interface.getInOutPositions();
            positions = {'widget' : pos, 'endPointsInOuts' : inOutPos};
            ioperator = operator_interface.getIOperator();
            WiringStatus.operators[key] = {"name" : ioperator.meta.uri, 'id' : key, 'preferences': ioperator.preferences};
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
            if (!arrow.hasClassName('full') && !arrow.hasClassName('hollow')) {
                if (arrow.hasClassName('readOnly')) {
                    WiringStatus.connections.push({
                        'readOnly': true,
                        'source': arrow.startAnchor.serialize(),
                        'target': arrow.endAnchor.serialize()
                    });
                } else {
                    WiringStatus.connections.push({
                        'source': arrow.startAnchor.serialize(),
                        'target': arrow.endAnchor.serialize()
                    });
                }
                WiringStatus.views[0].connections.push({
                    'pullerStart': arrow.getPullerStart(),
                    'pullerEnd': arrow.getPullerEnd(),
                    'startMulti': arrow.startMulti,
                    'endMulti': arrow.endMulti
                });
            }
        }

        return WiringStatus;
    };

    /**
     * add selectd object.
     */
    WiringEditor.prototype.addSelectedObject = function addSelectedObject(object) {
        if (object instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
            this.selectedWids[object.getId()] = object;
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
            delete this.selectedWids[object.getId()];
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
        this.iwidgets[iwidget.id] = widget_interface;

        auxDiv = document.createElement('div');
        //width and height to avoid scroll problems
        auxDiv.style.width = '2000px';
        auxDiv.style.height = '1000px';
        this.layout.getCenterContainer().appendChild(auxDiv);

        widget_interface.insertInto(auxDiv);

        widget_interface.wrapperElement.style.minWidth = widget_interface.getBoundingClientRect().width + 'px';
        this.layout.getCenterContainer().removeChild(auxDiv);

        this.layout.getCenterContainer().appendChild(widget_interface);

        //semantic recommendations
        widget_interface.sourceAnchors.map(this._semantic_anchor_map_func);
        widget_interface.targetAnchors.map(this._semantic_anchor_map_func);

        widget_interface.sourceAnchors.map(this._startdrag_map_func);
        widget_interface.targetAnchors.map(this._startdrag_map_func);

        this.targetAnchorList = this.targetAnchorList.concat(widget_interface.targetAnchors);
        this.sourceAnchorList = this.sourceAnchorList.concat(widget_interface.sourceAnchors);

        widget_interface.wrapperElement.style.minWidth = widget_interface.getBoundingClientRect().width + 'px';

        this.entitiesNumber += 1;
        this.emptyBox.classList.add('hidden');

        return widget_interface;
    };

    /**
     * add IOperator.
     */
    WiringEditor.prototype.addIOperator = function addIOperator(ioperator, enpPointPos) {
        var instantiated_operator, operator_interface, auxDiv;

        if (ioperator instanceof Wirecloud.wiring.OperatorMeta) {
            instantiated_operator = ioperator.instantiate(this.nextOperatorId, true, this);
            this.nextOperatorId++;
        } else {
            instantiated_operator = ioperator;
        }

        operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, instantiated_operator, this.arrowCreator, false, enpPointPos);

        auxDiv = document.createElement('div');
        //width and height to avoid scroll problems
        auxDiv.style.width = '2000px';
        auxDiv.style.height = '1000px';
        this.layout.getCenterContainer().appendChild(auxDiv);

        operator_interface.insertInto(auxDiv);

        operator_interface.wrapperElement.style.minWidth = operator_interface.getBoundingClientRect().width + 'px';
        this.layout.getCenterContainer().removeChild(auxDiv);

        this.layout.getCenterContainer().appendChild(operator_interface);

        //semantic recommendations
        operator_interface.sourceAnchors.map(this._semantic_anchor_map_func);
        operator_interface.targetAnchors.map(this._semantic_anchor_map_func);

        operator_interface.sourceAnchors.map(this._startdrag_map_func);
        operator_interface.targetAnchors.map(this._startdrag_map_func);

        this.targetAnchorList = this.targetAnchorList.concat(operator_interface.targetAnchors);
        this.sourceAnchorList = this.sourceAnchorList.concat(operator_interface.sourceAnchors);

        this.currentlyInUseOperators[operator_interface.getId()] = operator_interface;

        this.entitiesNumber += 1;
        this.emptyBox.classList.add('hidden');

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
        var i, anchorList, anchor_aux;
        anchorList = [];
        if (anchor instanceof Wirecloud.ui.WiringEditor.Multiconnector) {
            anchor_aux = anchor.initAnchor;
        } else {
            anchor_aux = anchor;
        }
        if (anchor_aux instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
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
        var i;
        widget_interface.unselect(false);
        delete this.iwidgets[widget_interface.getIWidget().id];
        this.layout.getCenterContainer().removeChild(widget_interface);

        //semantic recommendations
        widget_interface.sourceAnchors.map(this._remove_semantic_anchor_map_func);
        widget_interface.targetAnchors.map(this._remove_semantic_anchor_map_func);

        for (i = 0; i < widget_interface.sourceAnchors.length; i += 1) {
            this.sourceAnchorList.splice(this.sourceAnchorList.indexOf(widget_interface.sourceAnchors[i]), 1);
        }
        for (i = 0; i < widget_interface.targetAnchors.length; i += 1) {
            this.targetAnchorList.splice(this.targetAnchorList.indexOf(widget_interface.targetAnchors[i]), 1);
        }

        widget_interface.destroy();
        this.mini_widgets[widget_interface.getIWidget().id].enable();

        this.entitiesNumber -= 1;
        if (this.entitiesNumber === 0) {
            this.emptyBox.classList.remove('hidden');
        }
    };

    /**
     * remove a iOperator.
     */
    WiringEditor.prototype.removeIOperator = function removeIOperator(operator_interface) {
        var i;
        operator_interface.unselect(false);
        delete this.currentlyInUseOperators[operator_interface.getIOperator().id];
        this.layout.getCenterContainer().removeChild(operator_interface);

        //semantic recommendations
        operator_interface.sourceAnchors.map(this._remove_semantic_anchor_map_func);
        operator_interface.targetAnchors.map(this._remove_semantic_anchor_map_func);

        for (i = 0; i < operator_interface.sourceAnchors.length; i += 1) {
            this.sourceAnchorList.splice(this.sourceAnchorList.indexOf(operator_interface.sourceAnchors[i]), 1);
        }
        for (i = 0; i < operator_interface.targetAnchors.length; i += 1) {
            this.targetAnchorList.splice(this.targetAnchorList.indexOf(operator_interface.targetAnchors[i]), 1);
        }

        operator_interface.destroy();

        this.entitiesNumber -= 1;
        if (this.entitiesNumber === 0) {
            this.emptyBox.classList.remove('hidden');
        }
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

        this._startdrag_map_func(multiconnector);

        if (multiconnector.initAnchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            this.targetAnchorList = this.targetAnchorList.concat(multiconnector);
        } else {
            this.sourceAnchorList = this.sourceAnchorList.concat(multiconnector);
        }
        return this.multiconnectors[id];
    };

    /**
     * remove a multiconnector.
     */
    WiringEditor.prototype.removeMulticonnector = function removeMulticonnector(multiConnector) {
        this.layout.getCenterContainer().removeChild(multiConnector);
        if (multiConnector.initAnchor instanceof Wirecloud.ui.WiringEditor.TargetAnchor) {
            this.targetAnchorList.splice(this.targetAnchorList.indexOf(multiConnector), 1);
        } else {
            this.sourceAnchorList.splice(this.sourceAnchorList.indexOf(multiConnector), 1);
        }
        multiConnector.destroy(true);
        delete this.multiconnectors[multiConnector.id];
    };

    /**
     * emphasize anchors.
     */
    WiringEditor.prototype.emphasize = function emphasize(anchor, isCreatingArrow) {
        var rec, widgetId, achorId;

        if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.OperatorInterface) {
            widgetId = anchor.context.iObject.ioperator.meta.uri;
            achorId = anchor.context.data.name;
        } else if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
            widgetId = anchor.context.iObject.iwidget.widget.id;
            if (anchor.context.data instanceof WidgetOutputEndpoint) {
                achorId = anchor.context.data.name;
            } else {
                if (!anchor.context.iObject.iwidget.ghost) {
                    achorId = anchor.context.data.vardef.name;
                } else {
                    achorId = anchor.context.data;
                }
            }
        }

        rec = this.getRecommendations(anchor, widgetId, achorId, false);
        this.highlightRecommendations(rec);

        if (isCreatingArrow){
            this.recommendationsActivated = true;
        }
    };

    /**
     * deemphasize anchors.
     */
    WiringEditor.prototype.deemphasize = function deemphasize(anchor) {
        var rec, widgetId, achorId;

        if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.OperatorInterface) {
            widgetId = anchor.context.iObject.ioperator.meta.uri;
            achorId = anchor.context.data.name;
        } else if (anchor.context.iObject instanceof Wirecloud.ui.WiringEditor.WidgetInterface) {
            widgetId = anchor.context.iObject.iwidget.widget.id;
            if (anchor.context.data instanceof WidgetOutputEndpoint) {
                achorId = anchor.context.data.name;
            } else {
                if (!anchor.context.iObject.iwidget.ghost) {
                    achorId = anchor.context.data.vardef.name;
                } else {
                    achorId = anchor.context.data;
                }
            }
        }

        rec = this.getRecommendations(anchor, widgetId, achorId, true);
        this.unhighlightRecommendations(rec);

        this.recommendationsActivated = false;
    };

    /**
     * getRecommendations
     */
    WiringEditor.prototype.getRecommendations = function getRecommendations(anchor, widgetId, achorId, isEmphasized) {
        var mainAnchorClass, mainAnchorRef, recommendations, recTag, keyValues, anchorList, anchorListFiltered, i;

        keyValues = {'NONE': 0, 'OVERLAP': 1, 'SUBSUMES': 2, 'SUBSUMED': 3, 'HASPART': 4, 'DISJOINT': 5, 'EQUIVALENT': 6};
        recommendations = {};
        mainAnchorRef = 0;
        mainAnchorClass = 'NONE';
        for (recTag in this.anchorsInvolved) {
            if (this.anchorsInvolved[recTag][widgetId] != null &&
                    this.anchorsInvolved[recTag][widgetId][achorId] != null) {
                anchorList = this.anchorsInvolved[recTag][widgetId][achorId];
                anchorListFiltered = [];
                for (i = 0; i< anchorList.length; i += 1) {
                    if (anchorList[i].context.iObject != anchor.context.iObject){
                        // only if the anchor and anchorList[i] are not part of the same widget
                        anchorListFiltered[i] = anchorList[i];
                    }
                }
                if (!isEmpty(anchorListFiltered) && (mainAnchorRef < keyValues[recTag])) {
                    mainAnchorRef = keyValues[recTag];
                    mainAnchorClass = recTag;
                }
                recommendations[recTag] = anchorListFiltered;
            }
        }
        if (isEmphasized) {
            this.unhighlightAnchorLabel(anchor, mainAnchorClass);
        } else {
            this.highlightAnchorLabel(anchor, mainAnchorClass);
        }
        return recommendations;
    };

    /**
     * highlightRecommendations
     */
    WiringEditor.prototype.highlightRecommendations = function highlightRecommendations(recHash) {
        var i, key;

        for (key in recHash){
            for (i = 0; i < recHash[key].length; i += 1) {
                this.highlightAnchorLabel(recHash[key][i], key);
            }
        }
    };

    /**
     * unhighlightRecommendations
     */
    WiringEditor.prototype.unhighlightRecommendations = function unhighlightRecommendations(recHash) {
        var i, key;

        for (key in recHash){
            for (i = 0; i < recHash[key].length; i += 1) {
                this.unhighlightAnchorLabel(recHash[key][i], key);
            }
        }
    };

    /**
     * highlight anchor.
     */
    WiringEditor.prototype.highlightAnchorLabel = function highlightAnchorLabel(anchor, matchCode) {
        var code;

        code = matchCode.toLowerCase();
        anchor.wrapperElement.parentNode.classList.add('highlight');
        anchor.wrapperElement.parentNode.classList.add(code);
    };

     /**
      * unhighlight anchor.
      */
    WiringEditor.prototype.unhighlightAnchorLabel = function unhighlightAnchorLabel(anchor, matchCode) {
        var code;

        code = matchCode.toLowerCase();
        anchor.wrapperElement.parentNode.classList.remove('highlight');
        anchor.wrapperElement.parentNode.classList.remove(code);
    };

    /**
     * getBreadcrum
     */
    WiringEditor.prototype.getBreadcrum = function getBreadcrum() {
        var i, workspace_breadcrum = LayoutManagerFactory.getInstance().viewsByName.workspace.getBreadcrum();

        for (i = 0; i < workspace_breadcrum.length; i += 1) {
            delete workspace_breadcrum[i].menu;
        }

        workspace_breadcrum.push({
            'label': 'wiring'
        });

        return workspace_breadcrum;
    };

   /**
     *  scrollHandler, using canvas for transformate the arrows layer
     */
    WiringEditor.prototype.scrollHandler = function scrollHandler() {
        var oc, scrollX, scrollY, param;
        oc = this.layout.getCenterContainer();

        scrollX = parseInt(oc.wrapperElement.scrollLeft, 10);
        scrollY = parseInt(oc.wrapperElement.scrollTop, 10);
        param = "translate(" + (-scrollX) + " " + (-scrollY) + ")";
        this.canvas.canvasElement.generalLayer.setAttribute('transform', param);
        this.canvas.canvasElement.style.top = scrollY + 'px';
        this.canvas.canvasElement.style.left = scrollX + 'px';
        this.controlPanel.style.top = scrollY + 'px';
        this.controlPanel.style.left = scrollX + 'px';
    };

    /*************************************************************************
     * Make WiringEditor public
     *************************************************************************/
    Wirecloud.ui.WiringEditor = WiringEditor;

})();
