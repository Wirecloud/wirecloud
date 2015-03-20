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

Wirecloud.ui.WiringEditor = (function () {

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

        this.layout = new StyledElements.OffCanvasLayout({
            'direction': "to-left"
        });
        this.appendChild(this.layout);

        buildWirecloudToolbar.call(this);

        buildWiringSidebar.call(this);
        buildWiringBottombar.call(this);

        this.layout.content.addClassName('wiring-diagram');
        this.layout.footer.addClassName('wiring-bottombar');

        // Manage the alert for an empty wiring
        this.entitiesNumber = 0;

        this.alertEmptyWiring = new StyledElements.Alert({
            'contextualClass': "info",
            'placement': "static-top",
        });
        this.alertEmptyWiring.setHeadline("Hi, welcome to the mashup's wiring view!");
        this.alertEmptyWiring.setContent("In this edition area, you can add web applications (widgets/operators) from the sidebar and then, connect them each other.");
        this.alertEmptyWiring.addBlockquote("Only if a web application provides input or output endpoints, it will be connectable with others.");
        this.alertEmptyWiring.hide();
        this.layout.content.appendChild(this.alertEmptyWiring);

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
                switch (this.behaviourEngine.removeConnection(eventTarget.sourceName, eventTarget.targetName, eventTarget.cascadeRemove)) {
                case WiringEditor.BehaviourEngine.CONNECTION_REMOVED:
                    eventTarget.connection.onbackground = true;
                    break;
                case WiringEditor.BehaviourEngine.CONNECTION_REMOVED_FULLY:
                    this.connections.splice(index, 1);
                }
            }
        }.bind(this));

        this.connectionEngine.addEventListener('share', function (eventTarget) {
            shareConnection.call(this, eventTarget.connection);
        }.bind(this));

        this.connectionEngine.addEventListener('unselectall', function () {
            this.layout.slideUp();
            this.ChangeObjectEditing(null);
        }.bind(this));

        this.connectionEngine.addEventListener('update', function (eventTarget) {
            if (!eventTarget.connection.onbackground) {
                this.behaviourEngine.updateConnection(eventTarget.connection.serialize(), true);
            }
        }.bind(this));

        this.enableAnchors = this.enableAnchors.bind(this);
        this.disableAnchors = this.disableAnchors.bind(this);

        this.arrowCreator = new Wirecloud.ui.WiringEditor.ArrowCreator(this.connectionEngine, this,
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
        if (this.behaviourEngine.behavioursEnabled) {
            if (this.behaviourEngine.globalViewpointActive()) {
                this.btnRemoveBehaviour.setDisabled(!this.behaviourEngine.erasureEnabled);
                return [this.btnComponents, this.btnBehaviours, this.btnEmptyBehaviour, this.btnRemoveBehaviour];
            } else {
                return [this.btnBehaviours];
            }
        } else {
            return [this.btnComponents, this.btnBehaviours];
        }
    };

    // ==================================================================================
    // PRIVATE METHODS
    // ==================================================================================

    var startBehaviourEngine = function startBehaviourEngine() {
        this.behaviourEngine.addEventListener('activate', function (eventTarget) {
            var component, componentId, componentType, connection, i;

            LayoutManagerFactory.getInstance().header.refresh();

            if (eventTarget.globalViewpoint) {

                for (i = 0; i < this.connections.length; i++) {
                    connection = this.connections[i];
                    if (eventTarget.behaviour.containsConnection(connection.sourceName, connection.targetName)) {
                        connection.onbackground = false;
                    } else {
                        connection.onbackground = true;
                    }
                }

                for (componentType in this.components) {
                    for (componentId in this.components[componentType]) {
                        component = this.components[componentType][componentId];
                        component.setVisualInfo(this.behaviourEngine.getComponentView(componentType, componentId));

                        if (eventTarget.behaviour.containsComponent(componentType, componentId)) {
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

                        if (eventTarget.behaviour.containsComponent(componentType, componentId)) {
                            component.sleek = true;
                            component.setVisualInfo(this.behaviourEngine.getComponentView(componentType, componentId));
                        } else {
                            component.hidden = true;
                        }
                    }
                }

                for (i = 0; i < this.connections.length; i++) {
                    connection = this.connections[i];
                    if (eventTarget.behaviour.containsConnection(connection.sourceName, connection.targetName)) {
                        connection.onbackground = false;
                    } else {
                        connection.hidden = true;
                    }
                }

                for (componentType in this.components) {
                    for (componentId in this.components[componentType]) {
                        component = this.components[componentType][componentId];

                        if (eventTarget.behaviour.containsComponent(componentType, componentId)) {
                            component.repaint();
                        }
                    }
                }

            }
        }.bind(this));

        this.behaviourEngine.addEventListener('append', function (eventTarget) {
            eventTarget.behaviour.addEventListener('activate', function() {
                this.behaviourEngine.activateBehaviour(eventTarget.behaviour);
            }.bind(this));

            eventTarget.behaviour.addEventListener('activate.dblclick', function() {
                this.layout.slideUp();
            }.bind(this));

            eventTarget.behaviour.addEventListener('open', function() {
                var btnSave = new StyledElements.StyledButton({
                    'text': gettext("Save changes"),
                    'class': 'btn-primary'
                });

                var dialog = new Wirecloud.ui.FormWindowMenu([
                        {name: 'title', label: gettext("Title"), type: 'text'},
                        {name: 'description', label: gettext("Description"), type: 'longtext'}
                    ],
                    gettext("Information of the behaviour"),
                    'form-update-behaviour',
                    {
                        acceptButton: btnSave
                    });

                dialog.executeOperation = function (data) {
                    eventTarget.behaviour.updateInfo(data);
                };

                dialog.show();
                dialog.setValue(eventTarget.behaviour.getInfo());
            }.bind(this));
        }.bind(this));

        this.behaviourEngine.addEventListener('create', function (eventTarget) {
            var btnSave = new StyledElements.StyledButton({
                'text': gettext("New behaviour"),
                'class': 'btn-primary'
            });

            var dialog = new Wirecloud.ui.FormWindowMenu([
                    {name: 'title', label: gettext("Title"), type: 'text'},
                    {name: 'description', label: gettext("Description"), type: 'longtext'}
                ],
                gettext("Create a new behaviour"),
                'form-create-behaviour',
                {
                    acceptButton: btnSave
                });

            dialog.executeOperation = function (data) {
                var behaviour = eventTarget.behaviourEngine.createBehaviour(data);

                eventTarget.behaviourEngine.appendBehaviour(behaviour);
                this.btnRemoveBehaviour.setDisabled(!this.behaviourEngine.erasureEnabled);
            }.bind(this);

            dialog.show();
        }.bind(this));

        this.behaviourEngine.addEventListener('beforeEmpty', function (eventTarget) {
            var component, componentId, componentType, connection, i, idList;

            for (componentType in this.components) {
                idList = Object.keys(this.components[componentType]);

                for (i = 0; i < idList.length; i++) {
                    component = this.components[componentType][idList[i]];

                    if (eventTarget.behaviour.containsComponent(componentType, idList[i])) {
                        this.removeComponent(componentType, idList[i], false);
                    }
                }
            }
        }.bind(this));

        this.behaviourEngine.addEventListener('enable', function (eventTarget) {
            var component, componentId, componentType, connection, i;

            LayoutManagerFactory.getInstance().header.refresh();

            if (eventTarget.isEnabled) {
                for (componentType in this.components) {
                    for (componentId in this.components[componentType]) {
                        component = this.components[componentType][componentId];
                        this.behaviourEngine.updateComponent(componentType, componentId, component.serialize());
                    }
                }

                for (i = 0; i < this.connections.length; i++) {
                    connection = this.connections[i];
                    this.behaviourEngine.updateConnection(connection.serialize());
                }
            } else {
                for (componentType in this.components) {
                    for (componentId in this.components[componentType]) {
                        component = this.components[componentType][componentId];
                        component.onbackground = false;
                    }
                }

                for (i = 0; i < this.connections.length; i++) {
                    connection = this.connections[i];
                    connection.onbackground = false;
                }
            }
        }.bind(this));

        this.behaviourEngine.addEventListener('remove', function (eventTarget) {
            this.btnRemoveBehaviour.setDisabled(!this.behaviourEngine.erasureEnabled);
        }.bind(this));
    };

    var buildWirecloudToolbar = function buildWirecloudToolbar() {
        this.btnComponents = new StyledElements.ToggleButton({
            'iconClass': 'icon-archive',
            'stackedIconClass': 'icon-plus-sign',
            'stackedIconposition': 'bottom-right',
            'title': gettext("Components"),
            'class': "opt-components"
        });
        this.btnComponents.addEventListener('click', function (styledElement) {
            if (styledElement.active) {
                this.layout.slideUp();
            } else {
                this.componentManager.activeDefaultSection();
                this.layout.slideDown(0);
            }
        }.bind(this));

        this.btnBehaviours = new StyledElements.ToggleButton({
            'iconClass': 'icon-sitemap',
            'title': gettext("Behaviours"),
            'class': "opt-behaviours"
        });
        this.btnBehaviours.addEventListener('click', function (styledElement) {
            if (styledElement.active) {
                this.layout.slideUp();
            } else {
                this.layout.slideDown(1);
            }
        }.bind(this));

        this.btnEmptyBehaviour = new StyledElements.StyledButton({
            'iconClass': 'icon-eraser',
            'title': gettext("Empty behaviour"),
            'class': "opt-empty-behaviour"
        });
        this.btnEmptyBehaviour.addEventListener('click', function (styledElement) {
            var dialog, message;

            message = gettext("The following operation is irreversible " +
                "and cleans all components and connections belonging to the current behaviour. " +
                "Would you like to continue?");

            dialog = new Wirecloud.ui.AlertWindowMenu({
                'acceptLabel': gettext("Yes, empty"),
                'cancelLabel': gettext("No, thank you")
            });

            dialog.setMsg(message);
            dialog.acceptHandler = this.behaviourEngine.emptyBehaviour.bind(this.behaviourEngine);
            dialog.show();
        }.bind(this));

        this.btnRemoveBehaviour = new StyledElements.StyledButton({
            'iconClass': 'icon-trash',
            'title': gettext("Remove behaviour"),
            'class': "opt-remove-behaviour btn-danger"
        });
        this.btnRemoveBehaviour.addEventListener('click', function (styledElement) {
            var dialog, message;

            message = gettext("The following operation is irreversible " +
                "and completely removes the current behaviour. " +
                "Would you like to continue?");

            dialog = new Wirecloud.ui.AlertWindowMenu({
                'acceptLabel': gettext("Yes, remove"),
                'cancelLabel': gettext("No, thank you")
            });

            dialog.setMsg(message);
            dialog.acceptHandler = this.behaviourEngine.removeBehaviour.bind(this.behaviourEngine);
            dialog.show();
        }.bind(this));
    };

    var buildWiringSidebar = function buildWiringSidebar() {
        this.layout.sidebar.addClassName('wiring-sidebar');

        this.componentManager = new WiringEditor.ComponentManager();
        this.layout.appendPanel(this.componentManager);

        this.behaviourEngine = new WiringEditor.BehaviourEngine();
        this.layout.appendPanel(this.behaviourEngine);
        startBehaviourEngine.call(this);

        this.layout.addEventListener('slideup', function () {
            this.btnComponents.active = false;
            this.btnBehaviours.active = false;
        }.bind(this));
        this.layout.addEventListener('slidedown', function (panelOpened) {
            if (panelOpened.wrapperElement.classList.contains('panel-components')) {
                this.btnComponents.active = true;
                this.btnBehaviours.active = false;
            } else {
                this.btnComponents.active = false;
                this.btnBehaviours.active = true;
            }
        }.bind(this));
    };

    var buildWiringBottombar = function buildWiringBottombar() {
        var wiringLegend = document.createElement('div');

        wiringLegend.className = "wiring-legend";
        wiringLegend.innerHTML =
            '<div class="wiring-element legend-connections">' +
                '<div class="symbols"><div class="symbol-fg"></div></div>' +
                '<div class="title">Connections</div>' +
            '</div>' +
            '<div class="wiring-element legend-operators">' +
                '<div class="symbols"><div class="symbol-fg"></div></div>' +
                '<div class="title">Operators</div>' +
            '</div>' +
            '<div class="wiring-element legend-widgets">' +
                '<div class="symbols"><div class="symbol-fg"></div></div>' +
                '<div class="title">Widgets</div>' +
            '</div>';

        this.layout.footer.appendChild(wiringLegend);
    };

    /**
     * @Private
     * keydown handler for ctrl Multiselection
     */
    var keydownListener = function keydownListener(event) {
        if (event.keyCode == 17) {
            this.ctrlPushed = true;
            this.layout.content.addClassName('selecting');
        }
    };

    /**
     * @Private
     * keyup handler for ctrl Multiselection
     */
    var keyupListener = function keyupListener(event) {
        if (event.keyCode == 17) {
            this.ctrlPushed = false;
            this.layout.content.removeClassName('selecting');
        }
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
     * Create Mini Operator for menubar
     */
    var generateMiniOperator = function generateMiniOperator (operator) {
        var operator_interface, comp, versionInfo;

        try {
            versionInfo = this.operatorVersions[operator.vendor + '/' + operator.name];
            if (!versionInfo) {
                // New operator
                operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, operator, this, true);
                this.componentManager.appendOperator(operator_interface);
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
                    this.componentManager.removeOperator(versionInfo.miniOperator);
                    operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, operator, this, true);
                    this.componentManager.appendOperator(operator_interface);
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
     * Create New Multiconnector
     */
    var generateMulticonnector = function generateMulticonnector (multi) {
        var anchor, multiInstance;

        try {
            if (this.nextMulticonnectorId <= multi.id) {
                this.nextMulticonnectorId = parseInt(multi.id, 10) + 1;
            }
            if (multi.objectType == 'ioperator') {
                anchor = this.components.operator[multi.objectId].getAnchor(multi.sourceName);
            } else {
                anchor = this.components.widget[multi.objectId].getAnchor(multi.sourceName);
            }
            if (!anchor) {
                // Future Ghost
                return;
            }
            multiInstance = new Wirecloud.ui.WiringEditor.Multiconnector(multi.id, multi.objectId, multi.sourceName,
                                            this.layout.content.wrapperElement,
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
     * @Private
     * load wiring from status and workspace info
     */
    var loadWiring = function loadWiring(workspace, WiringStatus) {
        var availableOperatorGroup, componentId, componentObj, componentType,
            connectionList, connection, i, operatorGroup, pk, sourceName,
            status, targetName, widgetList;

        this.targetsOn = true;
        this.sourcesOn = true;
        this.targetAnchorList = [];
        this.sourceAnchorList = [];
        this.multiconnectors = {};
        this.selectedOps = {};
        this.selectedOps.length = 0;
        this.selectedWids = {};
        this.selectedWids.length = 0;
        this.selectedMulti = {};
        this.selectedMulti.length = 0;
        this.selectedCount = 0;
        this.headerHeight = document.getElementById('wirecloud_header').offsetHeight;
        this.ctrlPushed = false;
        this.nextOperatorId = 0;
        this.nextMulticonnectorId = 0;
        this.EditingObject = null;
        this.entitiesNumber = 0;
        this.recommendationsActivated = false;
        this.recommendations = new Wirecloud.ui.RecommendationManager();
        this.operatorVersions = {};

        this.componentManager.activeDefaultSection();

        this.gridFullHeight = parseFloat(this.layout.content.wrapperElement.style.height);
        this.gridFullWidth = parseFloat(this.layout.content.wrapperElement.style.width);
        this.fullHeaderHeight = LayoutManagerFactory.getInstance().mainLayout.getNorthContainer().wrapperElement.getBoundingClientRect().height;

        status = this.behaviourEngine.loadWiring(WiringStatus);

        this.behaviourEngine.readonly = true;
        this.components = {};

        // Loading the widgets that are being used in the workspace...
        componentType = WiringEditor.WIDGET_TYPE;
        this.components[componentType] = {};

        // Get all widgets available in the workspace.
        widgetList = workspace.getIWidgets();

        for (i = 0; i < widgetList.length; i++) {
            componentId = widgetList[i].id;

            // Add the widget into panel of components.
            componentObj = new WiringEditor.WidgetInterface(this, widgetList[i], this, true);
            this.componentManager.addComponent(componentType, componentId, componentObj);

            // If the widget is already available in the mashup's wiring...
            if (this.behaviourEngine.containsComponent(componentType, componentId)) {
                // it will be disabled from panel of components.
                componentObj.disable();
                // it will be added into wiring's diagram.
                this.addComponent(componentType, componentId, widgetList[i]);
            }
        }

        // Clean the reference of widgets that are misplaced.
        this.behaviourEngine.cleanComponentGroup(componentType, Object.keys(this.components[componentType]));
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
            if (this.behaviourEngine.containsComponent(componentType, componentId)) {
                // it will be added into wiring's diagram.
                this.addComponent(componentType, componentId, operatorGroup[componentId]);
            }
            // otherwise, the operator is misplaced.
            else {
                // TODO:
            }
        }

        // Clean the reference of operators that are misplaced.
        this.behaviourEngine.cleanComponentGroup(componentType, Object.keys(this.components[componentType]));
        // ...load completed.

        // Loading the connections established in the workspace...
        this.connections = [];

        // Get the existing connections in the wiring's trading description.
        connectionList = status.connections;

        for (i = 0; i < connectionList.length; i++) {
            connection = connectionList[i];
            // Get the absolute name of each endpoint.
            sourceName = getEndpointName.call(this, connection.source);
            targetName = getEndpointName.call(this, connection.target);

            // If the connection can be established...
            if (connectionAvailable.call(this, connection)) {
                // and if the connection has visual description...
                if (this.behaviourEngine.containsConnection(sourceName, targetName)) {
                    // it will be added into wiring's diagram.
                    this.generateConnection(connection, sourceName, targetName);
                }
                // otherwise, the connection is misplaced.
                else {
                    // TODO:
                }
            }
            // otherwise, the connection has an endpoint misplaced...
            else {
                // and it will remove of the behaviour engine.
                this.behaviourEngine.removeConnection(sourceName, targetName, true);
            }
        }
        // ...load completed.

        this.btnRemoveBehaviour.setDisabled(!this.behaviourEngine.erasureEnabled);

        this.behaviourEngine.readonly = false;
        this.behaviourEngine.activateBehaviour();
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
            this.layout.content.removeChild(this.components.widget[key]);
            this.components.widget[key].destroy();
        }
        for (key in this.components.operator) {
            this.layout.content.removeChild(this.components.operator[key]);
            this.components.operator[key].destroy();
        }
        for (key in this.multiconnectors) {
            this.layout.content.removeChild(this.multiconnectors[key]);
            this.multiconnectors[key].destroy();
        }
        this.deactivateCtrlMultiSelect();

        this.connectionEngine.clear();
        this.componentManager.clear();
        this.arrows = [];
        this.connections = [];
        this.components = {
            'operator': {},
            'widget': {}
        };
        this.multiconnectors = {};
        this.recommendations.destroy();
    };

    /**
     * @Private
     * set max width for widget or operator sources and targets Div
     */
    var setSourceTargetMaxWidths = function setSourceTargetMaxWidths(theInterface, maxWidth) {
        var sources, targets, sourcesVirginDims, targetsVirginDims, currentFontSize;

        // Current font-size from css
        currentFontSize = parseFloat(this.layout.content.wrapperElement.style.fontSize) * parseInt(getComputedStyle(this.wrapperElement).fontSize);

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
        this.componentManager.removeOperator(miniOperator);
        if (this.operatorVersions[versionIndex].lastVersion.compareTo(versionInfo.version) > 0) {
            // Old Version
            versionInfo.operatorInterface.wrapperElement.classList.add('old');
        }
        this.componentManager.appendOperator(versionInfo.operatorInterface);
        this.operatorVersions[versionIndex].currentVersion = versionInfo.version;
        this.operatorVersions[versionIndex].miniOperator = versionInfo.operatorInterface;
        return;
    };

    /**
     * returns the dom element asociated with the grid
     */
    WiringEditor.prototype.getGridElement = function getGridElement() {
        return this.layout.content.wrapperElement;
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
            connectionView = this.behaviourEngine.getConnectionView(sourceName, targetName);

            try {
                if (connection.readonly) {
                    // Increase ReadOnly connection count in each entity
                    startAnchor.getComponent().incReadOnlyConnectionsCount();
                    endAnchor.getComponent().incReadOnlyConnectionsCount();
                }

                // Create arrow
                isGhost = startAnchor.context.data instanceof Wirecloud.wiring.GhostSourceEndpoint || endAnchor.context.data instanceof Wirecloud.wiring.GhostTargetEndpoint;
                arrow = this.connectionEngine.drawArrow(startAnchor.getCoordinates(this.layout.content.wrapperElement),
                                              endAnchor.getCoordinates(this.layout.content.wrapperElement), "connection", connection.readonly, isGhost);

                // Set arrow anchors
                arrow.setStartAnchor(startAnchor);
                startAnchor.addArrow(arrow);
                arrow.setEndAnchor(endAnchor);
                endAnchor.addArrow(arrow);

                // Set arrow pullers
                arrow.setPullerStart(connectionView.pullerStart);
                arrow.setPullerEnd(connectionView.pullerEnd);

                // Draw the arrow
                arrow.redraw();
                this.connections.push(arrow);
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
        this.layout.content.removeClassName('selecting');
    };

    /**
     * Saves the wiring state.
     */
    WiringEditor.prototype.serialize = function serialize() {
        var wiringState, key, i, ioperator, pref;

        this.layout.slideUp(0);
        wiringState = this.behaviourEngine.serialize();

        for (key in this.components.operator) {
            ioperator = this.components.operator[key].getIOperator();

            wiringState.operators[key] = {
                'id': key,
                'name': ioperator.meta.uri,
                'preferences': {}
            };
            for (pref in ioperator.preferences) {
                wiringState.operators[key].preferences[pref] = {
                    "readOnly": ioperator.preferences[pref].readOnly,
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
        this.behaviourEngine.updateComponent(component.componentType, component.componentId, component.serialize());
        component.onbackground = false;

        return this;
    };

    var shareConnection = function shareConnection(connection) {
        if (this.behaviourEngine.behavioursEnabled) {
            shareComponent.call(this, connection.sourceComponent);
            shareComponent.call(this, connection.targetComponent);

            this.behaviourEngine.updateConnection(connection.serialize());
            connection.onbackground = false;
        } else {
            this.behaviourEngine.updateConnection(connection.serialize());
        }

        return this;
    };

    /**
     * add IWidget.
     */
    WiringEditor.prototype.addIWidget = function addIWidget(iwidget, enpPointPos, position) {
        var widget_interface, i, anchor;

        widget_interface = new Wirecloud.ui.WiringEditor.WidgetInterface(this, iwidget, this.arrowCreator, false, enpPointPos);

        widget_interface.addEventListener('dragstop', function (eventTarget) {
            widget_interface.setPosition(_correctComponentPosition.call(this, eventTarget.componentPosition));
            widget_interface.repaint();

            if (this.behaviourEngine.globalViewpointActive()) {
                this.behaviourEngine.updateComponent(WiringEditor.WIDGET_TYPE, eventTarget.componentId, widget_interface.serialize(), widget_interface.onbackground);
            } else {
                this.behaviourEngine.updateComponent(WiringEditor.WIDGET_TYPE, eventTarget.componentId, widget_interface.serialize(), true);
            }
        }.bind(this));

        widget_interface.addEventListener('sortstop', function (eventTarget) {
            this.behaviourEngine.updateComponent(WiringEditor.WIDGET_TYPE, eventTarget.componentId, widget_interface.serialize());
        }.bind(this));

        widget_interface.addEventListener('optremove', function (eventTarget) {
            var dialog, message, componentType, componentId;

            componentId = eventTarget.componentId;
            componentType = WiringEditor.WIDGET_TYPE;

            if (this.behaviourEngine.getByComponent(componentType, componentId).length > 1) {
                message = gettext('This component belongs to other behaviours. ' +
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

        this.layout.content.appendChild(widget_interface);
        widget_interface.setPosition(_correctComponentPosition.call(this, position));

        this.events.widgetadded.dispatch();

        this.components.widget[iwidget.id] = widget_interface;
        this.behaviourEngine.updateComponent('widget', iwidget.id, widget_interface.serialize());

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
        if (typeof position !== 'object') {
            position = {
                'x': 15,
                'y': 5
            };
        }

        if (position.x < 15) {
            position.x = 15;
        }

        if (position.y < 5) {
            position.y = 5;
        }

        return position;
    };

    var _removeComponent = function _removeComponent(componentType, componentId) {
        var anchor, component, i;

        component = this.components[componentType][componentId];
        component.unselect(false);
        this.layout.content.removeChild(component);

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

        componentView = this.behaviourEngine.getComponentView(componentType, componentId);

        switch (componentType) {
        case WiringEditor.OPERATOR_TYPE:
            operatorId = parseInt(componentId, 10);

            if (this.nextOperatorId <= operatorId) {
                // Make this.nextOperatorId is always greater than the highest of all operators
                this.nextOperatorId = operatorId + 1;
            }

            this.addIOperator(componentObj, componentView.endpoints, componentView.position);
            break;
        case WiringEditor.WIDGET_TYPE:
            this.addIWidget(componentObj, componentView.endpoints, componentView.position);
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

        switch (this.behaviourEngine.removeComponent(componentType, componentId, cascadeRemove)) {
        case WiringEditor.BehaviourEngine.COMPONENT_REMOVED:
            this.components[componentType][componentId].emptyConnections().onbackground = true;
            break;
        case WiringEditor.BehaviourEngine.COMPONENT_REMOVED_FULLY:
            _removeComponent.call(this, componentType, componentId);
            this.events.componentremoved.dispatch({
                'componentType': componentType,
                'componentId': componentId
            });
            break;
        case WiringEditor.BehaviourEngine.COMPONENT_UNREACHABLE:
            // TODO
            break;
        case WiringEditor.BehaviourEngine.COMPONENT_NOT_FOUND:
            // TODO
            break;
        }

        return this;
    };

    /**
     * add IOperator.
     */
    WiringEditor.prototype.addIOperator = function addIOperator(ioperator, enpPointPos, position) {
        var instantiated_operator, operator_interface, i, anchor;

        if (ioperator instanceof Wirecloud.wiring.OperatorMeta) {
            instantiated_operator = ioperator.instantiate(this.nextOperatorId, null, this);
            this.nextOperatorId++;
        } else {
            instantiated_operator = ioperator;
        }

        operator_interface = new Wirecloud.ui.WiringEditor.OperatorInterface(this, instantiated_operator, this.arrowCreator, false, enpPointPos);

        operator_interface.addEventListener('dragstop', function (eventTarget) {
            operator_interface.setPosition(_correctComponentPosition.call(this, eventTarget.componentPosition));
            operator_interface.repaint();

            if (this.behaviourEngine.globalViewpointActive()) {
                this.behaviourEngine.updateComponent(WiringEditor.OPERATOR_TYPE, eventTarget.componentId, operator_interface.serialize(), operator_interface.onbackground);
            } else {
                this.behaviourEngine.updateComponent(WiringEditor.OPERATOR_TYPE, eventTarget.componentId, operator_interface.serialize(), true);
            }
        }.bind(this));

        operator_interface.addEventListener('sortstop', function (eventTarget) {
            this.behaviourEngine.updateComponent(WiringEditor.OPERATOR_TYPE, eventTarget.componentId, operator_interface.serialize());
        }.bind(this));

        operator_interface.addEventListener('optremove', function (eventTarget) {
            var dialog, message, componentType, componentId;

            componentId = eventTarget.componentId;
            componentType = WiringEditor.OPERATOR_TYPE;

            if (this.behaviourEngine.getByComponent(componentType, componentId).length > 1) {
                message = gettext('This component belongs to other behaviours. ' +
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

        this.layout.content.appendChild(operator_interface);
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

        this.behaviourEngine.updateComponent('operator', operator_interface.getId(), operator_interface.serialize());

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
        this.layout.content.appendChild(multiconnector);
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
        this.layout.content.removeChild(multiConnector);
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
     *  Set Zoom level
     */
    WiringEditor.prototype.setZoomLevel = function setZoomLevel(percent) {
        var key, invertPercent, calculatedHeight, calculatedWidth, calculatedLeft, top, left, currentSize;

        // Initial size
        currentSize = parseFloat(this.layout.content.wrapperElement.style.fontSize);
        // Change general grid zoom
        changeZoom(this.layout.content.wrapperElement, percent);
        for (key in this.components.operator) {
            this.layout.content.removeChild(this.components.operator[key]);
            setEntityMaxWidth.call(this, this.components.operator[key]);
            this.layout.content.appendChild(this.components.operator[key]);
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
            this.layout.content.removeChild(this.components.widget[key]);
            setEntityMaxWidth.call(this, this.components.widget[key]);
            this.layout.content.appendChild(this.components.widget[key]);
            // To avoid scroll problems
            this.components.widget[key].wrapperElement.style.minWidth = this.components.widget[key].getBoundingClientRect().width + 'px';
            // Calculate new position
            top = parseFloat(this.components.widget[key].wrapperElement.style.top);
            left = parseFloat(this.components.widget[key].wrapperElement.style.left);
            this.components.widget[key].wrapperElement.style.top = ((top / currentSize) * percent) + 'px';
            this.components.widget[key].wrapperElement.style.left = ((left / currentSize) * percent) + 'px';
            this.components.widget[key].repaint();
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
            wiringError = new Error("Looking for the endpoint <" + endpointView.name + "> of a connection.");
            wiringError.name = 'Type Unsupported';

            throw wiringError;
        }

        if (!(endpointView.id in this.components[endpointView.type])) {
            wiringError = new Error("Looking for the endpoint <" + endpointView.name + "> of a connection.");
            wiringError.name = 'Component Not Found';

            throw wiringError;
        }

        component = this.components[endpointView.type][endpointView.id];

        return component.getAnchor(endpointView.name);
    };

    /**
     * @private
     * @function
     *
     * @param {Object.<String, *>} endpointView
     * @returns {Endpoint}
     */
    var getEndpointName = function getEndpointName(endpointView) {
        return [endpointView.type, endpointView.id, endpointView.name].join('/');
    };

    /**
     *  Generic zoom setter
     */
    var changeZoom = function changeZoom(element, level) {
        element.style.fontSize = level + 'em';
    };

    return WiringEditor;

})();
