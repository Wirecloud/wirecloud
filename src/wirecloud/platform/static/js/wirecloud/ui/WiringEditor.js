/*
 *     DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER
 *
 *     Copyright (c) 2012-2014 Universidad Politécnica de Madrid
 *     Copyright (c) 2012-2014 the Center for Open Middleware
 *
 *     Licensed under the Apache License, Version 2.0 (the
 *     "License"); you may not use this file except in compliance
 *     with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing,
 *     software distributed under the License is distributed on an
 *     "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *     KIND, either express or implied.  See the License for the
 *     specific language governing permissions and limitations
 *     under the License.
 */

/*global LayoutManagerFactory, opManager, StyledElements, Wirecloud, gettext */
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
        if (id == null) {
            return;
        }
        options['class'] = 'wiring_editor';
        StyledElements.Alternative.call(this, id, options);

        var events = ['operatorremoved', 'widgetremoved', 'widgetadded',
                      'operatoradded', 'widgetaddfail', 'operatoraddfail'];
        for (var i = 0; i < events.length; i++) {
            this.events[events[i]] = new StyledElements.Event();
        }

        this.addEventListener('show', renewInterface.bind(this));
        this.addEventListener('hide', clearInterface.bind(this));

        this.layout = new StyledElements.BorderLayout({class: 'containerLayer'});
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
            this.enableAnchors
        );
        this._startdrag_map_func = function (anchor) {
            anchor.addEventListener('startdrag', this.disableAnchors);
        }.bind(this);

        // Initialize key listener
        this._keydownListener = keydownListener.bind(this);
        this._keyupListener = keyupListener.bind(this);

        this.addEventListener('operatorremoved', function (entity) {
            this.removeIOperator(entity);
        }.bind(this));

        this.addEventListener('widgetremoved', function (entity) {
            this.removeIWidget(entity);
        }.bind(this));

    };

    WiringEditor.prototype = new StyledElements.Alternative();

    WiringEditor.prototype.view_name = 'wiring';

    WiringEditor.prototype.buildStateData = function buildStateData() {
        var currentState, data;

        currentState = Wirecloud.HistoryManager.getCurrentState();
        data = {
            workspace_creator: currentState.workspace_creator,
            workspace_name: currentState.workspace_name,
            view: 'wiring'
        };

        return data;
    };

    WiringEditor.prototype.goUp = function goUp() {
        LayoutManagerFactory.getInstance().changeCurrentView('workspace');
    };

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
        var iwidget_interface, iwidget, endPointPos, entity;

        switch (desc.type) {
        case 'iwidget':
            if (this.iwidgets[desc.id] != null) {
                entity =  this.iwidgets[desc.id];
            } else {
                iwidget = workspace.getIWidget(desc.id);
                if (iwidget != null) {
                    endPointPos = {'sources': [], 'targets': []};
                    iwidget_interface = this.addIWidget(this, iwidget, endPointPos);
                    iwidget_interface.setPosition({posX: 0, posY: 0});
                    this.mini_widgets[iwidget.id].disable();
                    entity = iwidget_interface;
                } else {
                    throw new Error('Widget not found');
                }
            }
            break;
        case 'ioperator':
            if (this.currentlyInUseOperators[desc.id] != null) {
                entity = this.currentlyInUseOperators[desc.id];
            } else {
                throw new Error('Operator not found. Id: ' + desc.id);
            }
            break;
        }
        return entity.getAnchor(desc.endpoint);
    };

    var normalizeWiringStatus = function normalizeWiringStatus(WiringStatus) {

        var i;

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

        for (i = 0; i < WiringStatus.views.length; i+=1) {
            // widgets
            if (WiringStatus.views[i].widgets == null) {
                WiringStatus.views[i].widgets = {};
            }

            // operators
            if (WiringStatus.views[i].operators == null) {
                WiringStatus.views[i].operators = {};
            }

            // multiconnectors
            if (WiringStatus.views[i].multiconnectors == null) {
                WiringStatus.views[i].multiconnectors = {};
            }

            // connections
            if (!Array.isArray(WiringStatus.views[i].connections)) {
                WiringStatus.views[i].connections = [];
            }
        }

        return WiringStatus;

    };

    /**
     * @Private
     * Create Mini Widget for menubar
     */
    var generateMiniWidget = function generateMiniWidget (iwidget) {
        var miniwidget_interface;
        try {
            miniwidget_interface = new Wirecloud.ui.WiringEditor.WidgetInterface(this, iwidget, this, true);
            this.mini_widgets[iwidget.id] = miniwidget_interface;
            this.mini_widget_section.appendChild(miniwidget_interface);
        } catch (e){
            throw new Error('WiringEditor error (critical). Creating MiniWidget: ' + e.message);
        }
    };

    /**
     * @Private
     * Create Mini Operator for menubar
     */
    var generateMiniOperator = function generateMiniOperator (operator) {
        var operator_interface, comp, versionInfo;

        try {
            versionInfo = this.operatorVersions[operator.vendor + '/' + operator.name];
            if (!versionInfo) {
                // New operator
                operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, operator, this, true);
                this.mini_operator_section.appendChild(operator_interface);
                this.operatorVersions[operator.vendor + '/' + operator.name] = {
                    'lastVersion': operator.version,
                    'currentVersion': operator.version,
                    'versions': [{'version': operator.version, 'operatorInterface': operator_interface}],
                    'miniOperator': operator_interface
                };
            } else {
                // Other operator version
                comp = versionInfo.lastVersion.compareTo(operator.version);
                if (comp < 0) {
                    // upgrade
                    this.mini_operator_section.removeChild(versionInfo.miniOperator);
                    operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, operator, this, true);
                    this.mini_operator_section.appendChild(operator_interface);
                    this.operatorVersions[operator.vendor + '/' + operator.name].lastVersion = operator.version;
                    this.operatorVersions[operator.vendor + '/' + operator.name].currentVersion = operator.version;
                    this.operatorVersions[operator.vendor + '/' + operator.name].versions.push({'version': operator.version, 'operatorInterface': operator_interface});
                    this.operatorVersions[operator.vendor + '/' + operator.name].miniOperator = operator_interface;
                } else if (comp > 0) {
                    // old version
                    operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, operator, this, true);
                    this.operatorVersions[operator.vendor + '/' + operator.name].versions.push({'version': operator.version, 'operatorInterface': operator_interface});
                } else {
                    // Same version. weird...
                    return;
                }
            }

        } catch (e){
            throw new Error('WiringEditor error (critical). Creating MiniOperator: ' + e.message);
        }
    };

    /**
     * @Private
     * Create New widget
     */
    var generateWidget = function generateWidget (iwidget, widgetView) {
        var widget_interface;

        try {
            widget_interface = this.addIWidget(this, iwidget, widgetView.endPointsInOuts);

            // Set Widget Position
            if ('position' in widgetView) {
                widget_interface.setPosition(widgetView.position);
            }
        } catch (e) {
            throw new Error('WiringEditor error (critical). Creating Widget: ' + e.message);;
        }
    };

    /**
     * @Private
     * Create a ghost widget
     */
    var generateGhostWidget = function generateGhostWidget (view, id) {
        var ghostName, iwidget, widget_interface;

        try {
            // Widget Name, if is known...
            if (view.iwidgets[id].name != null) {
                ghostName = view.iwidgets[id].name;
            } else {
                ghostName = gettext("unknown name");
            }
            iwidget = {
                'id': id,
                'name': ghostName,
                'ghost': true,
                'widget': {
                'id': view.iwidgets[id].name,
                'uri': view.iwidgets[id].name
                }
            };
            iwidget.meta = iwidget.widget;
            widget_interface = this.addIWidget(this, iwidget, view.iwidgets[id].endPointsInOuts);

            // Set position
            if ('position' in view.iwidgets[id]) {
                widget_interface.setPosition(view.iwidgets[id].position);
            }
        } catch (e) {
            throw new Error('WiringEditor error (critical). Creating GhostWidget: [id: ' + id + '; name: ' + ghostName + '] ' + e.message);
        }
    };

    /**
     * @Private
     * Create New Operator or Ghost Operator
     */
    var generateOperator = function generateOperator (id, operator, reallyInUseOperators, availableOperators) {
        var operator_instance, op_id, i, endpoint_order, position, is_minimized, operator_interface;

        try {
            operator_instance = reallyInUseOperators[id];
            // Get operator id
            op_id = parseInt(operator_instance.id, 10);
            if (this.nextOperatorId <= op_id) {
                // Make this.nextOperatorId is always greater than the highest of all operators
                this.nextOperatorId = op_id + 1;
            }

            // Get the endpoint order info if available
            endpoint_order = {'sources': [], 'targets': []};
            position = null;
            for (i = 0; i < this.wiringStatus.views.length; i ++) {
                if (id in this.wiringStatus.views[i].operators) {
                    if ('endPointsInOuts' in this.wiringStatus.views[i].operators[id]) {
                        endpoint_order = this.wiringStatus.views[i].operators[id].endPointsInOuts;
                    }
                    is_minimized = true;
                    if ('minimized' in this.wiringStatus.views[i].operators[id]) {
                        is_minimized = this.wiringStatus.views[i].operators[id].minimized;
                    }
                    position = this.wiringStatus.views[i].operators[id].position;
                    break;
                }
            }

            // Add the new operator
            operator_interface = this.addIOperator(operator_instance, endpoint_order);
            if (position != null) {
                operator_interface.setPosition(position);
            }

            // Set the minimized operator attribute
            if (is_minimized) {
                operator_interface.minimize(true);
            }
        } catch (e) {
            var errorMainmsg, detailmsg, msg;

            errorMainmsg = 'WiringEditor error (critical).'
            detailmsg = ' [id: ' + id +'; name: ' + operator_instance +';] ';
            if (operator_instance.ghost) {
                // Error creating GhostOperator
                msg = ' Operator Not Found. GhostOperator creation Failed';
                throw new Error(errorMainmsg + msg + detailmsg + e.message);
            } else {
                // Error creating Operator
                msg = ' Operator creation Failed';
                throw new new Error(errorMainmsg + msg + detailmsg + e.message);
            }
        }

    };

    /**
     * @Private
     * Create New Multiconnector
     */
    var generateMulticonnector = function generateMulticonnector (multi) {
        var anchor, multiInstance;

        try {
            if (this.nextMulticonnectorId <= multi.id) {
                this.nextMulticonnectorId = parseInt(multi.id, 10) + 1;
            }
            if (multi.objectType == 'ioperator') {
                anchor = this.currentlyInUseOperators[multi.objectId].getAnchor(multi.sourceName);
            } else {
                anchor = this.iwidgets[multi.objectId].getAnchor(multi.sourceName);
            }
            if (!anchor) {
                // Future Ghost
                return;
            }
            multiInstance = new Wirecloud.ui.WiringEditor.Multiconnector(multi.id, multi.objectId, multi.sourceName,
                                            this.layout.getCenterContainer().wrapperElement,
                                            this, anchor, multi.pos, multi.height);
            multiInstance = this.addMulticonnector(multiInstance);
            multiInstance.addMainArrow(multi.pullerStart, multi.pullerEnd);
        } catch (e) {
            throw new Error('WiringEditor error. Creating Multiconnector: [id: ' + multi.id + '] ' + e.message);
        }
    };

    /**
     * @Private
     * Add Ghost Endpoint in theEndpoint widget or operator
     */
    var insertGhostEndpoint = function insertGhostEndpoint(connection, isSource) {
        var entity, theEndpoint, anchor;

        if(isSource) {
            theEndpoint = connection.source;
        } else {
            theEndpoint = connection.target;
        }
        if (theEndpoint.type == 'ioperator') {
            entity = this.currentlyInUseOperators[theEndpoint.id];
        } else {
            entity = this.iwidgets[theEndpoint.id];
        }
        anchor = entity.addGhostEndpoint(theEndpoint, isSource);

        // Coherency of the recommendations
        this.recommendations.add_anchor_to_recommendations(anchor);
        this._startdrag_map_func(anchor);
    };

    /**
     * @Private
     * load wiring from status and workspace info
     */
    var loadWiring = function loadWiring(workspace, WiringStatus) {
        var iwidgets, iwidget, reallyInUseOperators, connectionView,
            multiconnectors, key, operators, k, i, availableOperators;

        this.wiringStatus = normalizeWiringStatus(WiringStatus);

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
        this.menubarWidth = document.getElementsByClassName('menubar')[0].offsetWidth;
        this.headerHeight = document.getElementById('wirecloud_header').offsetHeight;
        this.ctrlPushed = false;
        this.nextOperatorId = 0;
        this.nextMulticonnectorId = 0;
        this.EditingObject = null;
        this.entitiesNumber = 0;
        this.recommendationsActivated = false;
        this.recommendations = new Wirecloud.ui.RecommendationManager();
        this.operatorVersions = {};

        this.gridFullHeight = parseFloat(this.layout.getCenterContainer().wrapperElement.style.height);
        this.gridFullWidth = parseFloat(this.layout.getCenterContainer().wrapperElement.style.width);
        this.fullHeaderHeight = LayoutManagerFactory.getInstance().mainLayout.getNorthContainer().wrapperElement.getBoundingClientRect().height;
        // Set 100% Zoom in grid
        this.layout.getCenterContainer().wrapperElement.style.fontSize = '1em';

        iwidgets = workspace.getIWidgets();
        availableOperators = Wirecloud.wiring.OperatorFactory.getAvailableOperators();

        /* Generate Wiring Views */

        // Create Widgets
        for (i = 0; i < iwidgets.length; i++) {
            // Create Menubar mini-widget
            iwidget = iwidgets[i];
            generateMiniWidget.call(this, iwidget);

            // Create widget
            for (k = 0; k < this.wiringStatus.views.length; k ++) {
                // Each view
                if (iwidget.id in this.wiringStatus.views[k].iwidgets) {
                    // Disable mini-widget
                    this.mini_widgets[iwidget.id].disable();
                    // Add new Widget
                    generateWidget.call(this, iwidget, this.wiringStatus.views[k].iwidgets[iwidget.id]);
                    break;
                }
            }
        }

        // Ghost Widgets!
        for (k = 0; k < this.wiringStatus.views.length; k ++) {
            for (key in this.wiringStatus.views[k].iwidgets) {
                if (!this.iwidgets[key]) {
                    // Add new Ghost Widget
                    generateGhostWidget.call(this, this.wiringStatus.views[k], key);
                }
            }
        }

        // Create Menuban mini-operators
        for (key in availableOperators) {
            generateMiniOperator.call(this, availableOperators[key]);
        }

        // Create operators and Ghost Operators
        reallyInUseOperators = workspace.wiring.ioperators;
        operators = this.wiringStatus.operators;
        for (key in operators) {
            generateOperator.call(this, key, operators[key], reallyInUseOperators, availableOperators);
        }

        // Create Multiconnectors
        multiconnectors = this.wiringStatus.views[0].multiconnectors;
        for (key in multiconnectors) {
            generateMulticonnector.call(this, multiconnectors[key]);
        }

        // Create connections
        for (i = 0; i < this.wiringStatus.connections.length; i += 1) {
            connectionView = {};
            for (k = 0; k < this.wiringStatus.views.length; k ++) {
                if (i in this.wiringStatus.views[k].connections) {
                    connectionView = this.wiringStatus.views[k].connections[i];
                    break;
                }
            }
            this.generateConnection(workspace, this.wiringStatus.connections[i], connectionView);
        }

        this.activateCtrlMultiSelect();
        this.valid = true;
        if (this.entitiesNumber === 0) {
            this.emptyBox.classList.remove('hidden');
        }
        this.recommendations.init(iwidgets, availableOperators);
        this.removeClassName('disabled');
    };

    /**
     * @Private
     * repaint the wiringEditor interface
     */
    var renewInterface = function renewInterface() {
        var workspace, wiringStatus, layoutManager, msg, dialog;

        layoutManager = LayoutManagerFactory.getInstance();
        this.valid = false;

        try {

            workspace = Wirecloud.activeWorkspace;
            wiringStatus = workspace.wiring.status;
            loadWiring.call(this, workspace, wiringStatus);

        } catch (err) {
            try {
                clearInterface.call(this);
            } catch (e1) {
                msg = gettext('Unrecoverable error while loading wiring data into the wiring editor');
                (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
            }

            var yesHandler = function () {
                wiringStatus = Wirecloud.Utils.clone(wiringStatus);
                delete wiringStatus.views;
                try {
                    loadWiring.call(this, workspace, wiringStatus);
                } catch (e2) {
                    setTimeout(function () {
                        try {
                            clearInterface.call(this);
                        } catch (e1) {
                            msg = gettext('Fatal error loading wiring data');
                            (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
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
                                    (new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG)).show();
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
            var msg = new StyledElements.Fragment(gettext("<p>There was an error loading the wiring status. Do you want WireCloud to try to recover the state of your connections automatically?</p>"));
            var details = new StyledElements.Expander({title: gettext('Details')});
            msg.appendChild(details);
            details.appendChild(document.createTextNode(err.message));

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

        this.addClassName('disabled');
        workspace = Wirecloud.activeWorkspace;
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
        this.recommendations.destroy();
    };

    /**
     * @Private
     * set max width for widget or operator
     */
    var setEntityMaxWidth = function setEntityMaxWidth(theInterface) {
        var auxDiv, titleSpan, virginDimensions;

        var currentSize = parseFloat(this.layout.getCenterContainer().wrapperElement.style.fontSize);
        var defaultMaxWidgetWidth = 22 * currentSize;

        auxDiv = document.createElement('div');
        theInterface.insertInto(auxDiv);
        auxDiv.classList.add('calculateEntitySizeDiv');
        titleSpan = theInterface.wrapperElement.getElementsByClassName('header')[0].getElementsByTagName('span')[0];

        //width and height to avoid scroll problems
        auxDiv.style.width = '10000px';
        auxDiv.style.height = '10000px';
        this.layout.getCenterContainer().appendChild(auxDiv);

        theInterface.wrapperElement.style.maxWidth = '';
        theInterface.wrapperElement.style.minWidth = '';
        resetMaxWidth(theInterface);

        virginDimensions = theInterface.getBoundingClientRect();

        theInterface.wrapperElement.style.maxWidth = defaultMaxWidgetWidth + 'em';

        if (theInterface.getBoundingClientRect().height != virginDimensions.height) {
            setSourceTargetMaxWidths.call(this, theInterface, defaultMaxWidgetWidth)
        }
        theInterface.wrapperElement.style.minWidth = '';

        // Fix text-align ceneter problem when text-overflow: ellipsis
        if (titleSpan.offsetWidth < titleSpan.scrollWidth) {
            // text-overflow: ellipsis ON
            titleSpan.style.textAlign = 'left'
        } else {
            titleSpan.style.textAlign = 'center'
        }

        this.layout.getCenterContainer().removeChild(auxDiv);
    };

    /**
     * @Private
     * set max width for widget or operator sources and targets Div
     */
    var setSourceTargetMaxWidths = function setSourceTargetMaxWidths(theInterface, maxWidth) {
        var sources, targets, sourcesVirginDims, targetsVirginDims, currentFontSize;

        // Current font-size from css
        currentFontSize = parseFloat(this.layout.getCenterContainer().wrapperElement.style.fontSize) * parseInt(getComputedStyle(this.wrapperElement).fontSize);

        // Sources
        sources = theInterface.wrapperElement.getElementsByClassName('sources')[0];
        sourcesVirginDims = sources.getBoundingClientRect();

        // Targets
        targets = theInterface.wrapperElement.getElementsByClassName('targets')[0];
        targetsVirginDims = targets.getBoundingClientRect();

        // Check the problem
        if ((sourcesVirginDims.width / currentFontSize > maxWidth / 2) && (targetsVirginDims.width / currentFontSize > maxWidth / 2)) {
            // Both divs are too wide
            setMaxWidth.call(this, sources, maxWidth / 2, currentFontSize);
            setMaxWidth.call(this, targets, maxWidth / 2, currentFontSize);
        } else if (sourcesVirginDims.width / currentFontSize <= maxWidth / 2) {
            // Targets div is too wide
            setMaxWidth.call(this, targets, maxWidth - (sourcesVirginDims.width / currentFontSize), currentFontSize);
        } else if (targetsVirginDims.width / currentFontSize <= maxWidth / 2) {
            // Sources div is too wide
            setMaxWidth.call(this, sources, maxWidth - (targetsVirginDims.width / currentFontSize), currentFontSize);
        }
    };

    /**
     * @Private
     * set max width for each span in source or target div
     */
    var setMaxWidth = function setMaxWidth(theDiv, width, currentFontSize) {
        var theSpans, i, balancedWidth, acumulatedPaddings, theDivComputed, theSpanParentComputed;

        theSpans = theDiv.getElementsByTagName('span');

        theDivComputed = getComputedStyle(theDiv);
        theSpanParentComputed = getComputedStyle(theSpans[0].parentElement);
        acumulatedPaddings = 0;
        // Add paddings of theDiv element in acumulatedPaddings var
        acumulatedPaddings += (parseFloat(theDivComputed.paddingRight) + parseFloat(theDivComputed.paddingLeft)) / currentFontSize;
        // Add margins of theDiv element in acumulatedPaddings var
        acumulatedPaddings += (parseFloat(theDivComputed.marginRight) + parseFloat(theDivComputed.marginLeft)) / currentFontSize;

        // Add paddings of theSpans.parent element in acumulatedPaddings var
        acumulatedPaddings += (parseFloat(theSpanParentComputed.paddingRight) + parseFloat(theSpanParentComputed.paddingLeft)) / currentFontSize;
        // Add margins of theSpans.parent element in acumulatedPaddings var
        acumulatedPaddings += (parseFloat(theSpanParentComputed.marginRight) + parseFloat(theSpanParentComputed.marginLeft)) / currentFontSize;

        balancedWidth = width - acumulatedPaddings;

        for (i = 0; i < theSpans.length; i++){
            if (theSpans[i].offsetWidth / currentFontSize > balancedWidth) {
                // change only the too wide spans
                theSpans[i].style.width = balancedWidth + 'em';
            }
        }
    };

    var resetMaxWidth = function resetMaxWidth(theInterface) {
        var theSourcesSpans, theTargetSpans, targets, sources, i;

        // Sources
        sources = theInterface.wrapperElement.getElementsByClassName('sources')[0];
        theSourcesSpans = sources.getElementsByTagName('span');

        // Targets
        targets = theInterface.wrapperElement.getElementsByClassName('targets')[0];
        theTargetSpans = targets.getElementsByTagName('span');

        for (i = 0; i < theSourcesSpans.length; i++){
            theSourcesSpans[i].style.width =  '';
        }

        for (i = 0; i < theTargetSpans.length; i++){
            theTargetSpans[i].style.width =  '';
        }
    };

    /**
     * Change Operator miniInterface version in menubar
     */
    WiringEditor.prototype.setOperatorVersion = function setOperatorVersion(miniOperator, versionInfo) {
        var versionIndex;

        versionIndex = miniOperator.ioperator.vendor + '/' + miniOperator.ioperator.name;
        if (this.operatorVersions[versionIndex].currentVersion.compareTo(versionInfo.version) == 0) {
            // Same Version
            return;
        }

        //Change Version
        this.mini_operator_section.removeChild(miniOperator);
        if (this.operatorVersions[versionIndex].lastVersion.compareTo(versionInfo.version) > 0) {
            // Old Version
            versionInfo.operatorInterface.wrapperElement.classList.add('old');
        }
        this.mini_operator_section.appendChild(versionInfo.operatorInterface);
        this.operatorVersions[versionIndex].currentVersion = versionInfo.version;
        this.operatorVersions[versionIndex].miniOperator = versionInfo.operatorInterface;
        return;
    };

    /**
     * returns the dom element asociated with the grid
     */
    WiringEditor.prototype.getGridElement = function getGridElement() {
        return this.layout.getCenterContainer().wrapperElement;
    };

    /**
     * Create New Connection
     */
    WiringEditor.prototype.generateConnection = function generateConnection (workspace, connection, connectionView) {
        var startAnchor, endAnchor, readOnly, extraclass, arrow, multi, pos, msg, iwidget, entity, isGhost;

        // Find start Anchor
        startAnchor = findAnchor.call(this, connection.source, workspace);

        // Find end Anchor
        endAnchor = findAnchor.call(this, connection.target, workspace);

        if (startAnchor !== null && endAnchor !== null) {
            try {
                if (connection.readOnly) {
                    // Set ReadOnly connection
                    readOnly = true;
                    extraclass = 'readOnly';
                    // Increase ReadOnly connection count in each entity
                    startAnchor.context.iObject.incReadOnlyConnectionsCount();
                    endAnchor.context.iObject.incReadOnlyConnectionsCount();
                } else {
                    // Normal connection
                    readOnly = false;
                    extraclass = null;
                }

                // Create arrow
                isGhost = startAnchor.context.data instanceof Wirecloud.wiring.GhostSourceEndpoint || endAnchor.context.data instanceof Wirecloud.wiring.GhostTargetEndpoint;
                arrow = this.canvas.drawArrow(startAnchor.getCoordinates(this.layout.getCenterContainer().wrapperElement),
                                              endAnchor.getCoordinates(this.layout.getCenterContainer().wrapperElement), extraclass, readOnly, isGhost);

                // Set arrow anchors
                arrow.startAnchor = startAnchor;
                startAnchor.addArrow(arrow);
                arrow.endAnchor = endAnchor;
                endAnchor.addArrow(arrow);
                arrow.addClassName('arrow');

                // Set arrow pullers
                arrow.setPullerStart(connectionView.pullerStart);
                arrow.setPullerEnd(connectionView.pullerEnd);

                // Set connection with multiconnectors involved
                if (connectionView.startMulti != null) {
                    multi = this.multiconnectors[connectionView.startMulti];
                    if (multi) {
                        arrow.startMulti = connectionView.startMulti;
                        pos = multi.getCoordinates(this.layout);
                        arrow.setStart(pos);
                        multi.addArrow(arrow);
                    }
                }
                if (connectionView.endMulti != null) {
                    multi = this.multiconnectors[connectionView.endMulti];
                    if (multi) {
                        arrow.endMulti = connectionView.endMulti;
                        pos = multi.getCoordinates(this.layout);
                        arrow.setEnd(pos);
                        multi.addArrow(arrow);
                    }
                }

                // Draw the arrow
                arrow.redraw();
            } catch (e) {
                // TODO: Warning remove view for this connection and redo
                msg = 'Creating connection. betwen [' + startAnchor.context.data.id + '] and [' + endAnchor.context.data.id + ']. ';
                throw new Error('WiringEditor error.' + msg + e.message);
            }
        } else {
            // Ghost Endpoint
            if (!startAnchor) {
                insertGhostEndpoint.call(this, connection, true);
            }
            if (!endAnchor) {
                insertGhostEndpoint.call(this, connection, false);
            }
            this.generateConnection(workspace, connection, connectionView);
        }
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
     * Saves the wiring state.
     */
    WiringEditor.prototype.serialize = function serialize() {
        var pos, i, key, widget, arrow, operator_interface, ioperator,
        WiringStatus, multiconnector, height, inOutPos, positions, name,
        is_minimized, pref;

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
            positions = {'position': pos, 'endPointsInOuts': inOutPos, 'name': widget.iwidget.widget.id};
            WiringStatus.views[0].iwidgets[key] = positions;
        }

        for (key in this.currentlyInUseOperators) {
            is_minimized = this.currentlyInUseOperators[key].isMinimized;
            if (is_minimized) {
                this.currentlyInUseOperators[key].restore(true);
            }
            operator_interface = this.currentlyInUseOperators[key];
            pos = operator_interface.getStylePosition();
            inOutPos = operator_interface.getInOutPositions();
            positions = {
                'minimized': is_minimized,
                'position': pos,
                'endPointsInOuts': inOutPos
            };
            ioperator = operator_interface.getIOperator();
            WiringStatus.operators[key] = {
                'id': key,
                'name': ioperator.meta.uri,
                'preferences': {}
            };
            for (pref in ioperator.preferences) {
                WiringStatus.operators[key].preferences[pref] = {
                    "readOnly": ioperator.preferences[pref].readOnly,
                    "hidden": ioperator.preferences[pref].hidden,
                    "value": ioperator.preferences[pref].value
                };
            }
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
                WiringStatus.connections.push({
                    'readOnly': arrow.hasClassName('readOnly'),
                    'source': arrow.startAnchor.serialize(),
                    'target': arrow.endAnchor.serialize(),
                    'isGhost': arrow.isGhost
                });
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
        var clientX, clientY, box;

        box = this.layout.getCenterContainer().getBoundingClientRect();

        if ('touches' in event) {
            clientX = event.changedTouches[0].clientX;
            clientY = event.changedTouches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        return (clientX > box.left) && (clientX < box.right) &&
               (clientY > box.top) && (clientY < box.bottom);
    };

    /**
     * add IWidget.
     */
    WiringEditor.prototype.addIWidget = function addIWidget(wiringEditor, iwidget, enpPointPos) {
        var widget_interface, i, anchor;

        widget_interface = new Wirecloud.ui.WiringEditor.WidgetInterface(wiringEditor, iwidget, this.arrowCreator, false, enpPointPos);
        this.iwidgets[iwidget.id] = widget_interface;

        setEntityMaxWidth.call(this, widget_interface);

        this.layout.getCenterContainer().appendChild(widget_interface);

        this.events.widgetadded.dispatch();

        for (i = 0; i < widget_interface.sourceAnchors.length; i += 1) {
            anchor = widget_interface.sourceAnchors[i];
            this.recommendations.add_anchor_to_recommendations(anchor);
        }
        for (i = 0; i < widget_interface.targetAnchors.length; i += 1) {
            anchor = widget_interface.targetAnchors[i];
            this.recommendations.add_anchor_to_recommendations(anchor);
        }

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
        var instantiated_operator, operator_interface, i, anchor;

        if (ioperator instanceof Wirecloud.wiring.OperatorMeta) {
            instantiated_operator = ioperator.instantiate(this.nextOperatorId, null, this);
            this.nextOperatorId++;
        } else {
            instantiated_operator = ioperator;
        }

        operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, instantiated_operator, this.arrowCreator, false, enpPointPos);

        setEntityMaxWidth.call(this, operator_interface);

        this.layout.getCenterContainer().appendChild(operator_interface);

        this.events.operatoradded.dispatch();

        for (i = 0; i < operator_interface.sourceAnchors.length; i += 1) {
            anchor = operator_interface.sourceAnchors[i];
            this.recommendations.add_anchor_to_recommendations(anchor);
        }
        for (i = 0; i < operator_interface.targetAnchors.length; i += 1) {
            anchor = operator_interface.targetAnchors[i];
            this.recommendations.add_anchor_to_recommendations(anchor);
        }

        operator_interface.sourceAnchors.map(this._startdrag_map_func);
        operator_interface.targetAnchors.map(this._startdrag_map_func);

        this.targetAnchorList = this.targetAnchorList.concat(operator_interface.targetAnchors);
        this.sourceAnchorList = this.sourceAnchorList.concat(operator_interface.sourceAnchors);

        operator_interface.wrapperElement.style.minWidth = operator_interface.getBoundingClientRect().width + 'px';

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
        var i, anchor;
        widget_interface.unselect(false);
        delete this.iwidgets[widget_interface.getIWidget().id];
        this.layout.getCenterContainer().removeChild(widget_interface);

        for (i = 0; i < widget_interface.sourceAnchors.length; i += 1) {
            anchor = widget_interface.sourceAnchors[i];
            this.sourceAnchorList.splice(this.sourceAnchorList.indexOf(anchor), 1);
            this.recommendations.remove_anchor_to_recommendations(anchor);
        }
        for (i = 0; i < widget_interface.targetAnchors.length; i += 1) {
            anchor = widget_interface.targetAnchors[i];
            this.targetAnchorList.splice(this.targetAnchorList.indexOf(anchor), 1);
            this.recommendations.remove_anchor_to_recommendations(anchor);
        }

        widget_interface.destroy();
        if (widget_interface.getIWidget().id in this.mini_widgets) {
            this.mini_widgets[widget_interface.getIWidget().id].enable();
        } // else ghost widget

        this.entitiesNumber -= 1;
        if (this.entitiesNumber === 0) {
            this.emptyBox.classList.remove('hidden');
        }
    };

    /**
     * remove a iOperator.
     */
    WiringEditor.prototype.removeIOperator = function removeIOperator(operator_interface) {
        var i, anchor;
        operator_interface.unselect(false);
        delete this.currentlyInUseOperators[operator_interface.getIOperator().id];
        this.layout.getCenterContainer().removeChild(operator_interface);

        for (i = 0; i < operator_interface.sourceAnchors.length; i += 1) {
            anchor = operator_interface.sourceAnchors[i];
            this.sourceAnchorList.splice(this.sourceAnchorList.indexOf(anchor), 1);
            this.recommendations.remove_anchor_to_recommendations(anchor);
        }
        for (i = 0; i < operator_interface.targetAnchors.length; i += 1) {
            anchor = operator_interface.targetAnchors[i];
            this.targetAnchorList.splice(this.targetAnchorList.indexOf(anchor), 1);
            this.recommendations.remove_anchor_to_recommendations(anchor);
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
     * getTitle
     */
    WiringEditor.prototype.getTitle = function getTitle() {
        var workspace_title = LayoutManagerFactory.getInstance().viewsByName.workspace.getTitle();
        return Wirecloud.Utils.interpolate(gettext('%(workspace_title)s - Wiring'), {workspace_title: workspace_title});
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
    };


    /**
     *  Set Zoom level
     */
    WiringEditor.prototype.setZoomLevel = function setZoomLevel(percent) {
        var key, invertPercent, calculatedHeight, calculatedWidth, calculatedLeft, top, left, currentSize;

        // Initial size
        currentSize = parseFloat(this.layout.getCenterContainer().wrapperElement.style.fontSize);
        // Change general grid zoom
        changeZoom(this.layout.getCenterContainer().wrapperElement, percent);
        for (key in this.currentlyInUseOperators) {
            this.layout.getCenterContainer().removeChild(this.currentlyInUseOperators[key]);
            setEntityMaxWidth.call(this, this.currentlyInUseOperators[key]);
            this.layout.getCenterContainer().appendChild(this.currentlyInUseOperators[key]);
            // To avoid scroll problems
            this.currentlyInUseOperators[key].wrapperElement.style.minWidth = this.currentlyInUseOperators[key].getBoundingClientRect().width + 'px';
            // Calculate new position
            top = parseFloat(this.currentlyInUseOperators[key].wrapperElement.style.top);
            left = parseFloat(this.currentlyInUseOperators[key].wrapperElement.style.left);
            this.currentlyInUseOperators[key].wrapperElement.style.top = ((top / currentSize) * percent) + 'px';
            this.currentlyInUseOperators[key].wrapperElement.style.left = ((left / currentSize) * percent) + 'px';
            this.currentlyInUseOperators[key].repaint();
        }
        for (key in this.iwidgets) {
            this.layout.getCenterContainer().removeChild(this.iwidgets[key]);
            setEntityMaxWidth.call(this, this.iwidgets[key]);
            this.layout.getCenterContainer().appendChild(this.iwidgets[key]);
            // To avoid scroll problems
            this.iwidgets[key].wrapperElement.style.minWidth = this.iwidgets[key].getBoundingClientRect().width + 'px';
            // Calculate new position
            top = parseFloat(this.iwidgets[key].wrapperElement.style.top);
            left = parseFloat(this.iwidgets[key].wrapperElement.style.left);
            this.iwidgets[key].wrapperElement.style.top = ((top / currentSize) * percent) + 'px';
            this.iwidgets[key].wrapperElement.style.left = ((left / currentSize) * percent) + 'px';
            this.iwidgets[key].repaint();
        }
        for (key in this.multiconnectors) {
            // Calculate new position
            top = parseFloat(this.multiconnectors[key].wrapperElement.style.top);
            left = parseFloat(this.multiconnectors[key].wrapperElement.style.left);
            this.multiconnectors[key].wrapperElement.style.top = ((top / currentSize) * percent) + 'px';
            this.multiconnectors[key].wrapperElement.style.left = ((left / currentSize) * percent) + 'px';
            this.multiconnectors[key].repaint();
        }
    };

    /**
     *  Generic zoom setter
     */
    var changeZoom = function changeZoom(element, level) {
        element.style.fontSize = level + 'em';
    };

    /*************************************************************************
     * Make WiringEditor public
     *************************************************************************/
    Wirecloud.ui.WiringEditor = WiringEditor;

})();
