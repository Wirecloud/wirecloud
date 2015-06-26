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

Wirecloud.ui.WiringEditor = (function (se) {

    "use strict";

    // ==================================================================================
    // CLASS CONSTRUCTOR
    // ==================================================================================

    /**
     * Create a new instance of class WiringEditor.
     * @class
     *
     * @param {String} id
     * @param {Object.<String, *>} [options]
     */
    var WiringEditor = function WiringEditor(id, options) {
        var i;

        options['class'] = 'wiring-view';
        StyledElements.Alternative.call(this, id, options);

        for (i = 0; i < WiringEditor.defaults.eventList.length; i++) {
            this.events[WiringEditor.defaults.eventList[i]] = new StyledElements.Event();
        }

        this.layout = new se.OffCanvasLayout();
        this.appendChild(this.layout);

        buildWirecloudToolbar.call(this);

        buildWiringSidebar.call(this);
        buildWiringBottombar.call(this);

        this.layout.content.addClass('wiring-diagram');
        this.layout.footer.addClass('wiring-footer');

        // Manage the alert for an empty wiring
        this.entitiesNumber = 0;

        this.alertEmptyWiring = new StyledElements.Alert({
            state: 'info',
            alignment: 'static-top',
            title: "Hi, welcome to the mashup's wiring view!",
            message: "In this edition area, you can add web applications (widgets/operators) from the sidebar and then, connect them each other."
        });
        this.alertEmptyWiring
            .addNote("Only if a web application provides input or output endpoints, it will be connectable with others.")
            .hide();
        this.alertEmptyWiring.heading
            .addClass('text-center');
        this.layout.content.append(this.alertEmptyWiring);

        /* CONNECTION ENGINE SETTING */

        this.connectionEngine = new WiringEditor.Canvas(this.layout.content);

        this.connectionEngine.addEventListener('establish', function (eventTarget) {
            this.connections.push(eventTarget.connection);
            shareConnection.call(this, eventTarget.connection);
        }.bind(this));

        this.connectionEngine.addEventListener('duplicate', function (eventTarget) {
            var connection, found, i;

            for (found = false, i = 0; !found && i < this.connections.length; i++) {
                if (this.connections[i].sourceName == eventTarget.sourceName &&
                    this.connections[i].targetName == eventTarget.targetName) {
                    connection = this.connections[i];
                    found = true;
                }
            }

            if (found && connection.onbackground) {
                shareConnection.call(this, connection);
            }
        }.bind(this));

        this.connectionEngine.addEventListener('detach', function (eventTarget) {
            var found, i, index;

            for (found = false, i = 0; !found && i < this.connections.length; i++) {
                if (this.connections[i].sourceName == eventTarget.sourceName &&
                    this.connections[i].targetName == eventTarget.targetName) {
                    found = true;
                    index = i;
                }
            }

            if (found) {
                switch (this.behaviorEngine.removeConnection(eventTarget.sourceName, eventTarget.targetName, eventTarget.cascadeRemove)) {
                case WiringEditor.BehaviorEngine.CONNECTION_REMOVED:
                    eventTarget.connection.onbackground = true;
                    break;
                case WiringEditor.BehaviorEngine.CONNECTION_REMOVED_FULLY:
                    this.connections.splice(index, 1);
                }
            }
        }.bind(this));

        this.connectionEngine.addEventListener('share', function (eventTarget) {
            shareConnection.call(this, eventTarget.connection);
        }.bind(this));

        this.connectionEngine.addEventListener('unselectall', function () {
            this.layout.slideOut();
            this.ChangeObjectEditing(null);
        }.bind(this));

        this.connectionEngine.addEventListener('update', function (eventTarget) {
            if (!eventTarget.connection.onbackground) {
                this.behaviorEngine.updateConnection(eventTarget.connection.serialize(), true);
            }
        }.bind(this));

        this.enableAnchors = this.enableAnchors.bind(this);
        this.disableAnchors = this.disableAnchors.bind(this);

        this.componentsCollapsed = [];

        this.components = {
            operator: {},
            widget: {}
        };

        this.arrowCreator = new Wirecloud.ui.WiringEditor.ArrowCreator(this.connectionEngine, this,
            function () {
                var component, componentId, componentType;

                this.componentsCollapsed = [];

                for (componentType in this.components) {
                    for (componentId in this.components[componentType]) {
                        component = this.components[componentType][componentId];
                        if (component.collapsed) {
                            component.collapsed = false;
                            this.componentsCollapsed.push(component);
                        }
                    }
                }
            }.bind(this),
            function () {},
            this.enableAnchors
        );
        this._startdrag_map_func = function (anchor) {
            anchor.addEventListener('startdrag', this.disableAnchors);
        }.bind(this);

        // Initialize key listener
        this._keydownListener = keydownListener.bind(this);
        this._keyupListener = keyupListener.bind(this);

        this.addEventListener('show', renewInterface.bind(this));
        this.addEventListener('hide', clearInterface.bind(this));
    };

    WiringEditor.OPERATOR_TYPE = 'operator';
    WiringEditor.WIDGET_TYPE = 'widget';

    WiringEditor.COMPONENT_TYPES = [
        WiringEditor.OPERATOR_TYPE,
        WiringEditor.WIDGET_TYPE
    ];

    WiringEditor.defaults = {

        eventList: [
            'operatoradded', 'operatoraddfail', 'componentremoved',
            'widgetadded', 'widgetaddfail'
        ]

    };

    WiringEditor.prototype = new StyledElements.Alternative();

    // ==================================================================================
    // PUBLIC METHODS
    // ==================================================================================

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

    WiringEditor.prototype.getToolbarButtons = function getToolbarButtons() {
        if (this.behaviorEngine.enabled) {
            if (this.behaviorEngine.viewpoint === 0) {
                return [this.btnAddComponents, this.btnListBehaviors, this.btnToggleViewpoint, this.btnEmptyBehavior];
            } else {
                return [this.btnListBehaviors, this.btnToggleViewpoint];
            }
        } else {
            return [this.btnAddComponents, this.btnListBehaviors];
        }
    };

    // ==================================================================================
    // PRIVATE METHODS
    // ==================================================================================

    var startBehaviorEngine = function startBehaviorEngine() {
        this.behaviorEngine
            .on('activate', function (behavior, viewpoint) {
            var component, componentId, componentType, connection, i;

                LayoutManagerFactory.getInstance().header.refresh();
                this.connectionEngine.unselectArrow();

            if (viewpoint === 0) {

                for (i = 0; i < this.connections.length; i++) {
                    connection = this.connections[i];
                    if (behavior.hasConnection(connection.sourceName, connection.targetName)) {
                        connection.onbackground = false;
                    } else {
                        connection.onbackground = true;
                    }
                }

                for (componentType in this.components) {
                    for (componentId in this.components[componentType]) {
                        component = this.components[componentType][componentId];
                        component.setVisualInfo(this.behaviorEngine.findComponent(componentType, componentId));

                        if (behavior.hasComponent(componentType, componentId)) {
                            component.onbackground = false;
                        } else {
                            component.onbackground = true;
                        }
                    }
                }

                for (componentType in this.components) {
                    for (componentId in this.components[componentType]) {
                        component = this.components[componentType][componentId];
                        component.repaint();
                    }
                }
            } else {

                for (componentType in this.components) {
                    for (componentId in this.components[componentType]) {
                        component = this.components[componentType][componentId];

                        if (behavior.hasComponent(componentType, componentId)) {
                            component.sleek = true;
                            component.setVisualInfo(this.behaviorEngine.findComponent(componentType, componentId));
                        } else {
                            component.hidden = true;
                        }
                    }
                }

                for (i = 0; i < this.connections.length; i++) {
                    connection = this.connections[i];
                    if (behavior.hasConnection(connection.sourceName, connection.targetName)) {
                        connection.onbackground = false;
                    } else {
                        connection.hidden = true;
                    }
                }

                for (componentType in this.components) {
                    for (componentId in this.components[componentType]) {
                        component = this.components[componentType][componentId];

                        if (behavior.hasComponent(componentType, componentId)) {
                            component.repaint();
                        }
                    }
                }

            }

            }.bind(this))
            .on('beforeEmpty', function (behavior) {
                Object.keys(this.components).forEach(function (type) {
                    Object.keys(this.components[type]).forEach(function (id) {
                        var component = this.components[type][id];

                        if (behavior.hasComponent(type, id)) {
                            this.removeComponent(type, id, false);
                        }
                    }, this);
                }, this);
            }.bind(this))
            .on('enable', function (enabled) {
                LayoutManagerFactory.getInstance().header.refresh();
                this.connectionEngine.unselectArrow();

                Object.keys(this.components).forEach(function (type) {
                    Object.keys(this.components[type]).forEach(function (id) {
                        var component = this.components[type][id];

                        this.behaviorEngine.updateComponent(type, id, component.serialize());

                        if (!enabled) {
                            component.onbackground = false;
                        }
                    }, this);
                }, this);

                this.connections.forEach(function (connection) {
                    this.behaviorEngine.updateConnection(connection.serialize());

                    if (!enabled) {
                        connection.onbackground = false;
                    }
                }, this);
            }.bind(this));
    };

    var buildWirecloudToolbar = function buildWirecloudToolbar() {
        this.btnAddComponents = new StyledElements.ToggleButton({
            'iconClass': 'icon-archive',
            'stackedIconClass': 'icon-plus-sign',
            'stackedIconposition': 'bottom-right',
            'title': gettext("Add components"),
            'class': "btn-add-components"
        });
        this.btnAddComponents.on('click', function (element) {
            if (!element.active) {
                this.layout.slideOut();
            } else {
                this.layout.slideIn(0);
            }
        }.bind(this));

        this.btnListBehaviors = new StyledElements.ToggleButton({
            'iconClass': 'icon-sitemap',
            'title': gettext("List behaviors"),
            'class': "btn-list-behaviors"
        });
        this.btnListBehaviors.on('click', function (element) {
            if (!element.active) {
                this.layout.slideOut();
            } else {
                this.layout.slideIn(1);
            }
        }.bind(this));

        this.btnToggleViewpoint = new StyledElements.ToggleButton({
            'iconClass': 'icon-picture',
            'title': gettext("Toggle viewpoint"),
            'class': "btn-toggle-viewpoint",
            'stackedIconClass': 'icon-globe'
        });
        this.btnToggleViewpoint.on('click', function () {
            this.layout.slideOut();
            this.behaviorEngine.toggleViewpoint();
        }.bind(this));

        this.btnEmptyBehavior = new StyledElements.Button({
            'iconClass': 'icon-eraser',
            'title': gettext("Empty behavior"),
            'class': "btn-empty-behavior"
        });
        this.btnEmptyBehavior.on('click', function () {
            var dialog, message;

            message = gettext("The following operation is irreversible " +
                "and cleans all components and connections belonging to the current behavior. " +
                "Would you like to continue?");

            dialog = new Wirecloud.ui.AlertWindowMenu({
                'acceptLabel': gettext("Yes"),
                'cancelLabel': gettext("No, thank you")
            });

            dialog.setMsg(message);
            dialog.acceptHandler = function () {
                this.behaviorEngine.emptyBehavior();
            }.bind(this);

            this.layout.slideOut();
            dialog.show();
        }.bind(this));
    };

    var buildWiringSidebar = function buildWiringSidebar() {
        this.layout.sidebar.addClass("wiring-sidebar");

        this.componentManager = new WiringEditor.ComponentManager();
        this.behaviorEngine = new WiringEditor.BehaviorEngine();

        this.layout
            .addPanel(this.componentManager)
            .addPanel(this.behaviorEngine)
            .on('slideOut', function () {
                this.btnAddComponents.active = false;
                this.btnListBehaviors.active = false;
            }.bind(this))
            .on('slideIn', function (panel) {
                this.btnAddComponents.active = panel.hasClass("panel-components");
                this.btnListBehaviors.active = panel.hasClass("panel-behaviors");
            }.bind(this));

        startBehaviorEngine.call(this);
    };

    var buildWiringBottombar = function buildWiringBottombar() {
        var wiringLegend = document.createElement('div');

        wiringLegend.className = "wiring-legend";
        wiringLegend.innerHTML =
            '<span class="wiring-element element-connection">' +
                '<span class="color"></span>' +
                '<span class="title">Connections</span>' +
            '</span>' +
            '<span class="wiring-element element-operator">' +
                '<span class="color"></span>' +
                '<span class="title">Operators</span>' +
            '</span>' +
            '<span class="wiring-element element-widget">' +
                '<span class="color"></span>' +
                '<span class="title">Widgets</span>' +
            '</span>';

        var wiringLogger = document.createElement('div');
        var currentBehavior = document.createElement('span');

        wiringLogger.className = 'wiring-logger';
        wiringLogger.appendChild(currentBehavior);

        this.behaviorEngine.addLogger(currentBehavior,
            wiringLegend.querySelector('.element-connection .color'),
            wiringLegend.querySelector('.element-operator .color'),
            wiringLegend.querySelector('.element-widget .color'));

        this.layout.footer
            .append(wiringLogger)
            .append(wiringLegend);
    };

    /**
     * @Private
     * keydown handler for ctrl Multiselection
     */
    var keydownListener = function keydownListener(event) {
        if (event.keyCode == 17) {
            this.ctrlPushed = true;
            this.layout.content.addClass('selecting');
        }
    };

    /**
     * @Private
     * keyup handler for ctrl Multiselection
     */
    var keyupListener = function keyupListener(event) {
        if (event.keyCode == 17) {
            this.ctrlPushed = false;
            this.layout.content.removeClass('selecting');
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
                this.componentManager.addComponent('operator', operator_interface);
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
                    this.componentManager.removeComponent('operator', versionInfo.miniOperator);
                    operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, operator, this, true);
                    this.componentManager.addComponent('operator', operator_interface);
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

            // Add the new operator
            operator_interface = this.addIOperator(operator_instance, operator.endpoints, operator.position);
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
            entity = this.components.operator[theEndpoint.id];
        } else {
            entity = this.components.widget[theEndpoint.id];
        }
        anchor = entity.addGhostEndpoint(theEndpoint, isSource);

        // Coherency of the recommendations
        this.recommendations.add_anchor_to_recommendations(anchor);
        this._startdrag_map_func(anchor);
    };

    /**
     * @private
     * @function
     */
    var isConnectionEndpoint = function isConnectionEndpoint(type, id, connectionList) {
        var found, i, source, target;

        for (found = false, i = 0; !found && i < connectionList.length; i++) {
            source = connectionList[i].source;
            target = connectionList[i].target;

            if (source.type == type && source.id == id || target.type == type && target.id == id) {
                found = true;
            }
        }

        return found;
    };

    /**
     * @Private
     * load wiring from status and workspace info
     */
    var loadWiring = function loadWiring(workspace, status) {
        var availableOperatorGroup, componentId, componentObj, componentType,
            connectionList, connection, i, operatorGroup, pk, sourceName,
            status, targetName, widgetList;

        this.targetsOn = true;
        this.sourcesOn = true;
        this.targetAnchorList = [];
        this.sourceAnchorList = [];
        this.selectedOps = {};
        this.selectedOps.length = 0;
        this.selectedWids = {};
        this.selectedWids.length = 0;
        this.selectedCount = 0;
        this.headerHeight = document.getElementById('wirecloud_header').offsetHeight;
        this.ctrlPushed = false;
        this.nextOperatorId = 0;
        this.EditingObject = null;
        this.entitiesNumber = 0;
        this.recommendationsActivated = false;
        this.recommendations = new Wirecloud.ui.RecommendationManager();
        this.operatorVersions = {};

        this.componentManager
            .empty()
            .setUp();
        this.btnToggleViewpoint.active = false;

        this.gridFullHeight = parseFloat(this.layout.content.style('height'));
        this.gridFullWidth = parseFloat(this.layout.content.style('width'));
        this.fullHeaderHeight = LayoutManagerFactory.getInstance().mainLayout.getNorthContainer().wrapperElement.getBoundingClientRect().height;

        status = this.behaviorEngine.setUp(status);

        this.behaviorEngine.readonly = true;
        this.components = {};
        this.componentsMissingCount = 0;

        // Loading the widgets that are being used in the workspace...
        componentType = WiringEditor.WIDGET_TYPE;
        this.components[componentType] = {};

        // Get all widgets available in the workspace.
        widgetList = workspace.getIWidgets();

        // Get the existing connections in the wiring's trading description.
        connectionList = status.connections;

        for (i = 0; i < widgetList.length; i++) {
            componentId = widgetList[i].id;

            // Add the widget into panel of components.
            componentObj = new WiringEditor.WidgetInterface(this, widgetList[i], this, true);
            this.componentManager.addComponent(componentType, componentObj);

            // If the widget is already available in the mashup's wiring...
            if (this.behaviorEngine.hasComponent(componentType, componentId)) {
                // it will be disabled from panel of components.
                componentObj.disable();
                // it will be added into wiring's diagram.
                this.addComponent(componentType, componentId, widgetList[i]);
            }
            // If the widget exists as connection endpoint
            else if (isConnectionEndpoint.call(this, componentType, componentId, connectionList)) {
                // it will be disabled from panel of components.
                componentObj.disable();
                // it will be added into wiring's diagram.
                this.behaviorEngine.readonly = false;
                this.addComponent(componentType, componentId, widgetList[i]);
                this.behaviorEngine.readonly = true;
            }
        }

        var currentComponents = Object.keys(this.components[componentType]);

        // Paint the reference of widgets that are missing.
        for (pk in this.behaviorEngine.description.components[componentType]) {
            if (currentComponents.indexOf(pk) == -1) {
                addMissingWidget.call(this, pk, this.behaviorEngine.findComponent(componentType, pk));
            }
        }
        // ...load completed.

        // Loading the operators that are being used in the workspace...
        componentType = WiringEditor.OPERATOR_TYPE;
        this.components[componentType] = {};

        // Get all operators available in the user's account.
        availableOperatorGroup = Wirecloud.wiring.OperatorFactory.getAvailableOperators();

        // Get all operators available in the workspace (trading description).
        operatorGroup = workspace.wiring.ioperators;

        // Add all operators into panel of components.
        for (pk in availableOperatorGroup) {
            generateMiniOperator.call(this, availableOperatorGroup[pk]);
        }

        // Add the operators in use into wiring's diagram.
        for (componentId in operatorGroup) {
            // If the operator has visual description...
            if (this.behaviorEngine.hasComponent(componentType, componentId)) {
                // it will be added into wiring's diagram.
                this.addComponent(componentType, componentId, operatorGroup[componentId]);
            }
            // otherwise, the operator does not have visual description...
            else {
                // it will be added into wiring's diagram.
                this.behaviorEngine.readonly = false;
                this.addComponent(componentType, componentId, operatorGroup[componentId]);
                this.behaviorEngine.readonly = true;
            }
        }

        // Loading the connections established in the workspace...
        this.connections = [];

        for (i = 0; i < connectionList.length; i++) {
            connection = connectionList[i];
            // Get the absolute name of each endpoint.
            sourceName = getEndpointName.call(this, connection.source);
            targetName = getEndpointName.call(this, connection.target);

            // If the connection can be established...
            if (connectionAvailable.call(this, connection)) {
                // and if the connection has visual description...
                if (this.behaviorEngine.hasConnection(sourceName, targetName)) {
                    // it will be added into wiring's diagram.
                    this.generateConnection(connection, sourceName, targetName);
                }
                // otherwise, the connection does not have visual description.
                else {
                    this.behaviorEngine.readonly = false;
                    this.generateConnection(connection, sourceName, targetName);
                    this.behaviorEngine.readonly = true;
                }
            }
            // otherwise, the connection has an endpoint misplaced...
            else {
                // and it will remove of the behavior engine.
                this.behaviorEngine.removeConnection(sourceName, targetName, true);
            }
        }
        // ...load completed.

        this.behaviorEngine.readonly = false;
        this.behaviorEngine.activate();
        this.activateCtrlMultiSelect();

        this.valid = true;
        if (this.entitiesNumber === 0) {
            this.alertEmptyWiring.show();
        }

        this.recommendations.init(widgetList, availableOperatorGroup);
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
        for (key in this.components.widget) {
            this.layout.content.remove(this.components.widget[key]);
            this.components.widget[key].destroy();
        }
        for (key in this.components.operator) {
            this.layout.content.remove(this.components.operator[key]);
            this.components.operator[key].destroy();
        }

        this.deactivateCtrlMultiSelect();

        this.connectionEngine.clear();
        this.componentManager.empty();
        this.arrows = [];
        this.connections = [];
        this.components = {
            'operator': {},
            'widget': {}
        };
        this.recommendations.destroy();
    };

    /**
     * @Private
     * set max width for widget or operator sources and targets Div
     */
    var setSourceTargetMaxWidths = function setSourceTargetMaxWidths(theInterface, maxWidth) {
        var sources, targets, sourcesVirginDims, targetsVirginDims, currentFontSize;

        // Current font-size from css
        currentFontSize = parseFloat(this.layout.content.style('fontSize')) * parseInt(getComputedStyle(this.wrapperElement).fontSize);

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
        this.componentManager.removeComponent('operator', miniOperator);
        if (this.operatorVersions[versionIndex].lastVersion.compareTo(versionInfo.version) > 0) {
            // Old Version
            versionInfo.operatorInterface.wrapperElement.classList.add('old');
        }
        this.componentManager.addComponent('operator', versionInfo.operatorInterface);
        this.operatorVersions[versionIndex].currentVersion = versionInfo.version;
        this.operatorVersions[versionIndex].miniOperator = versionInfo.operatorInterface;
        return;
    };

    /**
     * returns the dom element asociated with the grid
     */
    WiringEditor.prototype.getGridElement = function getGridElement() {
        return this.layout.content.get();
    };

    /**
     * Create New Connection
     */
    WiringEditor.prototype.generateConnection = function generateConnection(connection, sourceName, targetName) {
        var startAnchor, endAnchor, readOnly, extraclass, arrow, multi, pos, msg, iwidget, entity, isGhost;
        var connectionView;

        startAnchor = findEndpoint.call(this, connection.source);

        endAnchor = findEndpoint.call(this, connection.target);

        if (startAnchor !== null && endAnchor !== null) {
            connectionView = this.behaviorEngine.findConnection(sourceName, targetName);

            try {
                if ('readonly' in connection && connection.readonly) {
                    // Increase ReadOnly connection count in each entity
                    startAnchor.getComponent().incReadOnlyConnectionsCount();
                    endAnchor.getComponent().incReadOnlyConnectionsCount();
                }

                // Create arrow
                isGhost = startAnchor.context.data instanceof Wirecloud.wiring.GhostSourceEndpoint || endAnchor.context.data instanceof Wirecloud.wiring.GhostTargetEndpoint;
                arrow = this.connectionEngine.drawArrow(startAnchor.getCoordinates(this.layout.content.get()),
                                              endAnchor.getCoordinates(this.layout.content.get()), "connection", connection.readonly, isGhost);

                // Set arrow anchors
                arrow.setStartAnchor(startAnchor);
                startAnchor.addArrow(arrow);
                arrow.setEndAnchor(endAnchor);
                endAnchor.addArrow(arrow);

                // Set arrow pullers
                if (connectionView != null) {
                    arrow.setPullerStart(connectionView.sourcehandle);
                    arrow.setPullerEnd(connectionView.targethandle);
                }

                // Draw the arrow
                arrow.redraw();

                this.connectionEngine.events.establish.dispatch({
                    'connection': arrow,
                    'sourceComponent': arrow.sourceComponent,
                    'sourceEndpoint': arrow.startAnchor,
                    'sourceName': arrow.sourceName,
                    'targetComponent': arrow.targetComponent,
                    'targetEndpoint': arrow.endAnchor,
                    'targetName': arrow.targetName
                });
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
            this.generateConnection(connection, connectionView);
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
        this.layout.content.removeClass('selecting');
    };

    /**
     * Saves the wiring state.
     */
    WiringEditor.prototype.serialize = function serialize() {
        var wiringState, key, i, ioperator, pref;

        this.layout.slideOut(0);
        wiringState = this.behaviorEngine.serialize();

        for (key in this.components.operator) {
            ioperator = this.components.operator[key].getIOperator();

            wiringState.operators[key] = {
                'id': key,
                'name': ioperator.meta.uri,
                'preferences': {}
            };
            for (pref in ioperator.preferences) {
                wiringState.operators[key].preferences[pref] = {
                    "readonly": ioperator.preferences[pref].readonly,
                    "hidden": ioperator.preferences[pref].hidden,
                    "value": ioperator.preferences[pref].value
                };
            }
        }

        for (i = 0; i < this.connections.length; i++) {
            wiringState.connections.push(this.connections[i].getBusinessInfo());
        }

        return wiringState;
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
        if ((this.selectedOps.length !== 0) || (this.selectedWids.length !== 0)) {
            //('error resetSelection' + this.selectedOps + this.selectedWids);
        }
    };

    /**
     * check if the position of the event occurred within the grid
     */
    WiringEditor.prototype.withinGrid = function withinGrid(event) {
        var clientX, clientY, box;

        box = this.layout.content.getBoundingClientRect();

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

    var shareComponent = function shareComponent(component) {
        this.behaviorEngine.updateComponent(component.componentType, component.componentId, component.serialize());
        component.onbackground = false;

        return this;
    };

    var shareConnection = function shareConnection(connection) {
        if (this.behaviorEngine.enabled) {
            shareComponent.call(this, connection.sourceComponent);
            shareComponent.call(this, connection.targetComponent);

            this.behaviorEngine.updateConnection(connection.serialize());
            connection.onbackground = false;
        } else {
            this.behaviorEngine.updateConnection(connection.serialize());
        }

        return this;
    };

    /**
     * add IWidget.
     */
    WiringEditor.prototype.addIWidget = function addIWidget(iwidget, enpPointPos, position, collapsed) {
        var widget_interface, i, anchor;

        widget_interface = new Wirecloud.ui.WiringEditor.WidgetInterface(this, iwidget, this.arrowCreator, false, enpPointPos);

        widget_interface.addEventListener('dragstop', function (eventTarget) {
            widget_interface.setPosition(_correctComponentPosition.call(this, eventTarget.componentPosition));
            widget_interface.repaint();

            if (this.behaviorEngine.viewpoint === 0) {
                this.behaviorEngine.updateComponent(WiringEditor.WIDGET_TYPE, eventTarget.componentId, widget_interface.serialize(), widget_interface.onbackground);
            } else {
                this.behaviorEngine.updateComponent(WiringEditor.WIDGET_TYPE, eventTarget.componentId, widget_interface.serialize(), true);
            }
        }.bind(this));

        widget_interface.addEventListener('dragstart', function (eventTarget) {
            var connection;

            if (this.connectionEngine.hasSelected()) {
                connection = this.connectionEngine.getSelected();

                //if (connection.)
                this.connectionEngine.unselectArrow();

            }
        }.bind(this));

        widget_interface.addEventListener('collapse', function (componentInfo) {
            this.behaviorEngine.updateComponent(WiringEditor.WIDGET_TYPE, componentInfo.id, widget_interface.serialize(), true);
        }.bind(this));

        widget_interface.addEventListener('expand', function (componentInfo) {
            this.behaviorEngine.updateComponent(WiringEditor.WIDGET_TYPE, componentInfo.id, widget_interface.serialize(), true);
        }.bind(this));

        widget_interface.addEventListener('sortstop', function (eventTarget) {
            this.behaviorEngine.updateComponent(WiringEditor.WIDGET_TYPE, eventTarget.componentId, widget_interface.serialize());
        }.bind(this));

        widget_interface.addEventListener('optremove', function (eventTarget) {
            var dialog, message, componentType, componentId;

            componentId = eventTarget.componentId;
            componentType = WiringEditor.WIDGET_TYPE;

            if (this.behaviorEngine.findBehaviorByComponent(componentType, componentId).length > 1) {
                message = gettext('This component belongs to other behaviors. ' +
                    'Do you want to delete it from them too?');

                dialog = new Wirecloud.ui.AlertWindowMenu({
                    'cancelLabel': gettext("No, just here")
                });
                dialog.setMsg(message);
                dialog.acceptHandler = this.removeComponent.bind(this, componentType, componentId, true);
                dialog.cancelHandler = this.removeComponent.bind(this, componentType, componentId);
                dialog.show();
            } else {
                this.removeComponent(componentType, componentId);
            }
        }.bind(this));

        widget_interface.addEventListener('optshare', function (eventTarget) {
            shareComponent.call(this, widget_interface);
        }.bind(this));

        this.layout.content.append(widget_interface);

        if (typeof collapsed == 'boolean') {
            widget_interface.collapsed = collapsed;
        }

        widget_interface.setPosition(_correctComponentPosition.call(this, position));

        this.events.widgetadded.dispatch();

        this.components.widget[iwidget.id] = widget_interface;
        this.behaviorEngine.updateComponent('widget', iwidget.id, widget_interface.serialize());

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

        this.entitiesNumber += 1;
        this.alertEmptyWiring.hide();

        return widget_interface;
    };

    var _correctComponentPosition = function _correctComponentPosition(position) {
        var min_x_coord = 15, min_y_coord = 5;

        if (typeof position !== 'object') {
            position = {
                'x': min_x_coord,
                'y': min_y_coord
            };
        }

        if (position.x < min_x_coord) {
            position.x = min_x_coord;
        }

        if (position.y < min_y_coord) {
            position.y = min_y_coord;
        }

        return position;
    };

    var _removeComponent = function _removeComponent(componentType, componentId) {
        var anchor, component, i;

        component = this.components[componentType][componentId];
        component.unselect(false);
        this.layout.content.remove(component);

        for (i = 0; i < component.sourceAnchors.length; i += 1) {
            anchor = component.sourceAnchors[i];
            this.sourceAnchorList.splice(this.sourceAnchorList.indexOf(anchor), 1);
            this.recommendations.remove_anchor_to_recommendations(anchor);
        }

        for (i = 0; i < component.targetAnchors.length; i += 1) {
            anchor = component.targetAnchors[i];
            this.targetAnchorList.splice(this.targetAnchorList.indexOf(anchor), 1);
            this.recommendations.remove_anchor_to_recommendations(anchor);
        }

        delete this.components[componentType][componentId];
        component.destroy();

        this.entitiesNumber -= 1;
        if (!this.entitiesNumber) {
            this.alertEmptyWiring.show();
        }

        if (componentType == WiringEditor.WIDGET_TYPE) {
            this.componentManager.enableWidget(componentId);
        }

        return this;
    };

    WiringEditor.prototype.connectComponents = function connectComponents(sourceEndpoint, targetEndpoint) {
        var startAnchor, endAnchor, readOnly, extraclass, arrow, multi, pos, msg, iwidget, entity, isGhost;
        var connectionView;

        startAnchor = findComponent.call(this, sourceEndpoint.type, sourceEndpoint.name).getEndpointByName('source', sourceEndpoint.endpointName).endpointAnchor;
        endAnchor = findComponent.call(this, targetEndpoint.type, targetEndpoint.name).getEndpointByName('target', targetEndpoint.endpointName).endpointAnchor;

        arrow = this.connectionEngine.drawArrow(startAnchor.getCoordinates(this.layout.content.get()),
            endAnchor.getCoordinates(this.layout.content.get()), "connection", false, false);

        // Set arrow anchors
        arrow.setStartAnchor(startAnchor);
        startAnchor.addArrow(arrow);
        arrow.setEndAnchor(endAnchor);
        endAnchor.addArrow(arrow);

        // Draw the arrow
        arrow.redraw();

        this.connectionEngine.events.establish.dispatch({
            'connection': arrow,
            'sourceComponent': arrow.sourceComponent,
            'sourceEndpoint': arrow.startAnchor,
            'sourceName': arrow.sourceName,
            'targetComponent': arrow.targetComponent,
            'targetEndpoint': arrow.endAnchor,
            'targetName': arrow.targetName
        });

        return arrow;
    };

    WiringEditor.prototype.addComponentByName = function addComponentByName(type, name, x, y) {
        var component, obj, endpoints, position;

        endpoints = {
            'source': [],
            'target': []
        };
        position = {
            'x': x,
            'y': y
        };

        switch (type) {
        case WiringEditor.OPERATOR_TYPE:
            obj = this.componentManager.getComponent(type, name);
            component = this.addIOperator(obj.ioperator, endpoints, position);
            break;
        case WiringEditor.WIDGET_TYPE:
            obj = this.componentManager.getComponent(type, name);
            component = this.addIWidget(obj.iwidget, endpoints, position);
            obj.disable();
            break;
        }

        return component;
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {Number} componentId
     * @param {Object.<String *>} componentObj
     * @returns {WiringEditor} The instance on which this function was called.
     */
    WiringEditor.prototype.addComponent = function addComponent(componentType, componentId, componentObj) {
        var componentView, operatorId;

        if (WiringEditor.COMPONENT_TYPES.indexOf(componentType) == -1) {
            return this;
        }

        if (!(componentView=this.behaviorEngine.findComponent(componentType, componentId))) {
            componentView = {
                collapsed: false,
                endpoints: {
                    'source': [],
                    'target': []
                },
                position: _correctComponentPosition({
                    'x': -1,
                    'y': -1
                })
            };

            componentView.position.x += (this.componentsMissingCount * 10);
            componentView.position.y += (this.componentsMissingCount * 30);

            this.componentsMissingCount += 1;
            // TODO: attach this error to wirecloud logger.
        }

        if (!('endpoints' in componentView)) {
            componentView.endpoints = {
                'source': [],
                'target': []
            };
        }

        if (!('collapsed' in componentView)) {
            componentView.collapsed = false;
        }

        switch (componentType) {
        case WiringEditor.OPERATOR_TYPE:
            operatorId = parseInt(componentId, 10);

            if (this.nextOperatorId <= operatorId) {
                // Make this.nextOperatorId is always greater than the highest of all operators
                this.nextOperatorId = operatorId + 1;
            }

            this.addIOperator(componentObj, componentView.endpoints, componentView.position, componentView.collapsed);
            break;
        case WiringEditor.WIDGET_TYPE:
            this.addIWidget(componentObj, componentView.endpoints, componentView.position, componentView.collapsed);
            break;
        }

        return this;
    };

    /**
     * @public
     * @function
     *
     * @param {String} componentType
     * @param {Number} componentId
     * @param {Boolean} [cascadeRemove=false]
     * @returns {WiringEditor} The instance on which this function was called.
     */
    WiringEditor.prototype.removeComponent = function removeComponent(componentType, componentId, cascadeRemove) {
        var dialog, message;

        if (WiringEditor.COMPONENT_TYPES.indexOf(componentType) == -1) {
            return this;
        }

        if (typeof cascadeRemove !== 'boolean') {
            cascadeRemove = false;
        }

        switch (this.behaviorEngine.removeComponent(componentType, componentId, cascadeRemove)) {
        case WiringEditor.BehaviorEngine.COMPONENT_REMOVED:
            this.components[componentType][componentId].emptyConnections().onbackground = true;
            break;
        case WiringEditor.BehaviorEngine.COMPONENT_REMOVED_FULLY:
            _removeComponent.call(this, componentType, componentId);
            this.events.componentremoved.dispatch({
                'componentType': componentType,
                'componentId': componentId
            });
            break;
        case WiringEditor.BehaviorEngine.COMPONENT_UNREACHABLE:
            // TODO
            break;
        case WiringEditor.BehaviorEngine.COMPONENT_NOT_FOUND:
            // TODO
            break;
        }

        return this;
    };

    /**
     * add IOperator.
     */
    WiringEditor.prototype.addIOperator = function addIOperator(ioperator, enpPointPos, position, collapsed) {
        var instantiated_operator, operator_interface, i, anchor;

        if (ioperator instanceof Wirecloud.wiring.OperatorMeta) {
            instantiated_operator = ioperator.instantiate(this.nextOperatorId, null, this);
            this.nextOperatorId++;
        } else {
            instantiated_operator = ioperator;
        }

        operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, instantiated_operator, this.arrowCreator, false, enpPointPos);

        operator_interface.addEventListener('collapse', function (componentInfo) {
            this.behaviorEngine.updateComponent(WiringEditor.OPERATOR_TYPE, componentInfo.id, operator_interface.serialize());
        }.bind(this));

        operator_interface.addEventListener('expand', function (componentInfo) {
            this.behaviorEngine.updateComponent(WiringEditor.OPERATOR_TYPE, componentInfo.id, operator_interface.serialize());
        }.bind(this));

        operator_interface.addEventListener('dragstart', function (eventTarget) {
            this.connectionEngine.unselectArrow();
        }.bind(this));

        operator_interface.addEventListener('dragstop', function (eventTarget) {
            operator_interface.setPosition(_correctComponentPosition.call(this, eventTarget.componentPosition));
            operator_interface.repaint();

            if (this.behaviorEngine.viewpoint === 0) {
                this.behaviorEngine.updateComponent(WiringEditor.OPERATOR_TYPE, eventTarget.componentId, operator_interface.serialize(), operator_interface.onbackground);
            } else {
                this.behaviorEngine.updateComponent(WiringEditor.OPERATOR_TYPE, eventTarget.componentId, operator_interface.serialize(), true);
            }
        }.bind(this));

        operator_interface.addEventListener('sortstop', function (eventTarget) {
            this.behaviorEngine.updateComponent(WiringEditor.OPERATOR_TYPE, eventTarget.componentId, operator_interface.serialize());
        }.bind(this));

        operator_interface.addEventListener('optremove', function (eventTarget) {
            var dialog, message, componentType, componentId;

            componentId = eventTarget.componentId;
            componentType = WiringEditor.OPERATOR_TYPE;

            if (this.behaviorEngine.findBehaviorByComponent(componentType, componentId).length > 1) {
                message = gettext('This component belongs to other behaviors. ' +
                    'Do you want to delete it from them too?');

                dialog = new Wirecloud.ui.AlertWindowMenu({
                    'cancelLabel': gettext("No, just here")
                });
                dialog.setMsg(message);
                dialog.acceptHandler = this.removeComponent.bind(this, componentType, componentId, true);
                dialog.cancelHandler = this.removeComponent.bind(this, componentType, componentId);
                dialog.show();
            } else {
                this.removeComponent(componentType, componentId);
            }
        }.bind(this));

        operator_interface.addEventListener('optshare', function (eventTarget) {
            shareComponent.call(this, operator_interface);
        }.bind(this));

        this.layout.content.append(operator_interface);

        if (typeof collapsed == 'boolean') {
            operator_interface.collapsed = collapsed;
        }

        operator_interface.setPosition(_correctComponentPosition.call(this, position));

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

        this.components.operator[operator_interface.getId()] = operator_interface;

        this.behaviorEngine.updateComponent('operator', operator_interface.getId(), operator_interface.serialize());

        this.entitiesNumber += 1;
        this.alertEmptyWiring.hide();

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
                this.selectedOps[key].setPosition({x: this.selectedOps[key].initPos.x + xDelta, y: this.selectedOps[key].initPos.y + yDelta});
                this.selectedOps[key].repaint();
            }
        }

        for (key in this.selectedWids) {
            if (key != 'length') {
                this.selectedWids[key].setPosition({x: this.selectedWids[key].initPos.x + xDelta, y: this.selectedWids[key].initPos.y + yDelta});
                this.selectedWids[key].repaint();
            }
        }
    };

    /**
     * drag all selected objects.
     */
    WiringEditor.prototype.onFinishSelectedObjects = function onFinishSelectedObjects() {
        var key, position, desp;
        var min_x_coord = 15, min_y_coord = 5;

        if (this.selectedCount <= 1) {
            return;
        }

        //find the most negative X and Y
        desp = {'x': min_x_coord, 'y': min_y_coord};
        for (key in this.selectedOps) {
            if (key != 'length') {
                position = this.selectedOps[key].getStylePosition();

                if (position.x < desp.x) {
                    desp.x = position.x;
                }

                if (position.y < desp.y) {
                    desp.y = position.y;
                }
            }
        }

        for (key in this.selectedWids) {
            if (key != 'length') {
                position = this.selectedWids[key].getStylePosition();

                if (position.x < desp.x) {
                    desp.x = position.x;
                }

                if (position.y < desp.y) {
                    desp.y = position.y;
                }
            }
        }

        if (desp.y >= min_y_coord) {
            desp.y = 0;
        } else {
            desp.y = Math.abs(desp.y - min_y_coord);
        }
        if (desp.x >= min_x_coord) {
            desp.x = 0;
        } else {
            desp.x = Math.abs(desp.x - min_x_coord);
        }

        //set position of the selected group
        for (key in this.selectedOps) {
            if (key != 'length') {
                position = this.selectedOps[key].getStylePosition();
                position.x += desp.x;
                position.y += desp.y;
                this.selectedOps[key].setPosition(position);
                this.selectedOps[key].repaint();
            }
        }

        for (key in this.selectedWids) {
            if (key != 'length') {
                position = this.selectedWids[key].getStylePosition();
                position.x += desp.x;
                position.y += desp.y;
                this.selectedWids[key].setPosition(position);
                this.selectedWids[key].repaint();
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

        for (i = 0; i < this.componentsCollapsed.length; i++) {
            this.componentsCollapsed[i].collapsed = true;
        }

        this.componentsCollapsed = [];
    };

    /**
     * Disables all anchor that cannot be connected to the given anchor.
     */
    WiringEditor.prototype.disableAnchors = function disableAnchors(anchor) {
        var i, anchorList, anchor_aux;
        anchorList = [];
        anchor_aux = anchor;

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
     *  Set Zoom level
     */
    WiringEditor.prototype.setZoomLevel = function setZoomLevel(percent) {
        var key, invertPercent, calculatedHeight, calculatedWidth, calculatedLeft, top, left, currentSize;

        // Initial size
        currentSize = parseFloat(this.layout.content.style('fontSize'));
        // Change general grid zoom
        changeZoom(this.layout.content.get(), percent);
        for (key in this.components.operator) {
            this.layout.content.remove(this.components.operator[key]);
            setEntityMaxWidth.call(this, this.components.operator[key]);
            this.layout.content.append(this.components.operator[key]);
            // To avoid scroll problems
            this.components.operator[key].wrapperElement.style.minWidth = this.components.operator[key].getBoundingClientRect().width + 'px';
            // Calculate new position
            top = parseFloat(this.components.operator[key].wrapperElement.style.top);
            left = parseFloat(this.components.operator[key].wrapperElement.style.left);
            this.components.operator[key].wrapperElement.style.top = ((top / currentSize) * percent) + 'px';
            this.components.operator[key].wrapperElement.style.left = ((left / currentSize) * percent) + 'px';
            this.components.operator[key].repaint();
        }
        for (key in this.components.widget) {
            this.layout.content.remove(this.components.widget[key]);
            setEntityMaxWidth.call(this, this.components.widget[key]);
            this.layout.content.append(this.components.widget[key]);
            // To avoid scroll problems
            this.components.widget[key].wrapperElement.style.minWidth = this.components.widget[key].getBoundingClientRect().width + 'px';
            // Calculate new position
            top = parseFloat(this.components.widget[key].wrapperElement.style.top);
            left = parseFloat(this.components.widget[key].wrapperElement.style.left);
            this.components.widget[key].wrapperElement.style.top = ((top / currentSize) * percent) + 'px';
            this.components.widget[key].wrapperElement.style.left = ((left / currentSize) * percent) + 'px';
            this.components.widget[key].repaint();
        }
    };

    var addMissingWidget = function addMissingWidget(componentId, componentView) {
        var name, endpoints, componentObj;

        if ('name' in componentView) {
            name = componentView.name;
        } else {
            name = gettext('Unknown Name');
        }

        if (!('endpoints' in componentView)) {
            componentView.endpoints = {
                'source': [],
                'target': []
            };
        }

        try {
            componentObj = {
                'id': componentId,
                'name': name,
                'ghost': true,
                'widget': {
                    'id': name,
                    'uri': name
                }
            };
            componentObj.meta = componentObj.widget;
            this.addIWidget(componentObj, componentView.endpoints, componentView.position);
        } catch (e) {
            throw new Error('WiringEditor error (critical). Creating GhostWidget: [id: ' + componentId + '; name: ' + name + '] ' + e.message);
        }
    };

    /**
     * @private
     * @function
     *
     * @param {Object.<String, *>} connection
     * @returns {Boolean}
     */
    var connectionAvailable = function connectionAvailable(connection) {
        var sourceEndpoint, targetEndpoint;

        try {
            sourceEndpoint = findEndpoint.call(this, connection.source);
            targetEndpoint = findEndpoint.call(this, connection.target);
        } catch(e) {
            return false;
        }

        return sourceEndpoint != null && targetEndpoint != null;
    };

    /**
     * @private
     * @function
     *
     * @param {Object.<String, *>} endpointView
     * @returns {Endpoint}
     */
    var findEndpoint = function findEndpoint(endpointView) {
        var component, wiringError;

        if (WiringEditor.COMPONENT_TYPES.indexOf(endpointView.type) == -1) {
            wiringError = new Error("Looking for the endpoint <" + endpointView.endpoint + "> of a connection.");
            wiringError.name = 'Type Unsupported';

            throw wiringError;
        }

        if (!(endpointView.id in this.components[endpointView.type])) {
            wiringError = new Error("Looking for the endpoint <" + endpointView.endpoint + "> of a connection.");
            wiringError.name = 'Component Not Found';

            throw wiringError;
        }

        component = this.components[endpointView.type][endpointView.id];

        return component.getAnchor(endpointView.endpoint);
    };

    var findComponent = function findComponent(type, name) {
        var id, component = null;

        for (id in this.components[type]) {
            if (this.components[type][id].title == name) {
                return this.components[type][id];
            }
        }

        return null;
    };

    /**
     * @private
     * @function
     *
     * @param {Object.<String, *>} endpointView
     * @returns {Endpoint}
     */
    var getEndpointName = function getEndpointName(endpointView) {
        return [endpointView.type, endpointView.id, endpointView.endpoint].join('/');
    };

    /**
     *  Generic zoom setter
     */
    var changeZoom = function changeZoom(element, level) {
        element.style.fontSize = level + 'em';
    };

    return WiringEditor;

})(StyledElements);
