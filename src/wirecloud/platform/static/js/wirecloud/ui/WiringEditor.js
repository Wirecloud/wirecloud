/*
 *     DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER
 *
 *     Copyright (c) 2012-2016 Universidad Politécnica de Madrid
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

/* global gettext, LayoutManagerFactory, StyledElements, Wirecloud */


Wirecloud.ui = Wirecloud.ui || {};

(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class WiringEditor.
     * @extends {Alternative}
     *
     * @constructor
     * @param {Number} id
     *      [TODO: description]
     * @param {PlainObject} [options]
     *      [TODO: description]
     */
    ns.WiringEditor = utils.defineClass({

        constructor: function WiringEditor(id, options) {

            options = utils.updateObject({}, options);
            options.extraClass = "wiring-view";

            this.superClass(id, options);

            createAndSetUpLayout.call(this);

            createAndSetUpComponentManager.call(this);
            createAndSetUpBehaviourEngine.call(this);
            createAndSetUpConnectionEngine.call(this);

            this.suggestionManager = new ns.WiringEditor.KeywordSuggestion();

            this.selectedComponents = {operator: {}, widget: {}};
            this.selectedCount = 0;

            this.sortableComponent = null;
            this.autoOperatorId = 1;
        },

        inherit: se.Alternative,

        members: {

            view_name: "wiring",

            /**
             * @override
             */
            _onhidden: function _onhidden(hidden) {

                this.superMember(se.Alternative, '_onhidden', hidden);

                if (hidden) {
                    tearDownView.call(this);
                } else {
                    setUpView.call(this);
                }

                return this;
            },

            /**
             * [TODO: createComponent description]
             *
             * @param {Wiring.Component} wiringComponent
             *      [TODO: description]
             * @param {PlainObject} [options]
             *      [TODO: description]
             * @returns {ComponentDraggable}
             *      [description]
             */
            createComponent: function createComponent(wiringComponent, options) {
                var component;

                options = utils.updateObject({commit: true, removecascade_allowed: this.behaviourEngine.enabled}, options);

                component = new ns.WiringEditor.ComponentDraggable(wiringComponent, options);
                component
                    // TODO: .on('endpointadded', component_onendpointadded.bind(this))
                    .on('change', function () {
                        this.behaviourEngine.updateComponent(component, component.toJSON());
                    }.bind(this))
                    .on('click', component_onclick.bind(this))
                    .on('dragstart', component_ondragstart.bind(this))
                    .on('drag', component_ondrag.bind(this))
                    .on('dragend', component_ondragend.bind(this))
                    .on('sortstart', component_onsortstart.bind(this))
                    .on('sortend', component_onsortend.bind(this))
                    .on('optremove', function () {
                        this.behaviourEngine.removeComponent(component);
                    }.bind(this))
                    .on('optremovecascade', function () {
                        this.behaviourEngine.removeComponent(component, true);
                    }.bind(this))
                    .on('optshare', function () {
                        this.behaviourEngine.updateComponent(component, component.toJSON(), true);
                    }.bind(this))
                    .on('remove', component_onremove.bind(this));

                component.forEachEndpoint(bindEndpoint.bind(this));
                this.initialMessage.hide();

                if (options.commit) {
                    this.layout.content.appendChild(component);
                    this.behaviourEngine.updateComponent(component, component.toJSON());
                    disableComponent.call(this, component);
                }

                return component;
            },

            /**
             * @override
             */
            buildStateData: function buildStateData() {
                var currentState = Wirecloud.HistoryManager.getCurrentState();

                return {
                    workspace_owner: currentState.workspace_owner,
                    workspace_name: currentState.workspace_name,
                    view: this.view_name
                };
            },

            /**
             * @override
             */
            getBreadcrum: function getBreadcrum() {
                var i, workspace_breadcrum = LayoutManagerFactory.getInstance()
                    .viewsByName.workspace.getBreadcrum();

                for (i = 0; i < workspace_breadcrum.length; i += 1) {
                    delete workspace_breadcrum[i].menu;
                }

                workspace_breadcrum.push({
                    label: this.view_name
                });

                return workspace_breadcrum;
            },

            /**
             * @override
             */
            getTitle: function getTitle() {
                return utils.interpolate(gettext("%(workspace_title)s - Wiring"), {
                    workspace_title: LayoutManagerFactory.getInstance().viewsByName.workspace.getTitle()
                });
            },

            /**
             * @override
             */
            getToolbarButtons: function getToolbarButtons() {
                return [this.btnFindComponents, this.btnListBehaviours];
            },

            /**
             * @override
             */
            goUp: function goUp() {

                LayoutManagerFactory.getInstance().changeCurrentView('workspace');

                return this;
            },

            /**
             * [TODO: toJSON description]
             *
             * @returns {PlainObject}
             *      [TODO: description]
             */
            toJSON: function toJSON() {
                var wiringStatus = Wirecloud.Wiring.normalize();

                this.connectionEngine.forEachConnection(function (connection) {
                    wiringStatus.connections.push(connection._connection);
                });

                this.behaviourEngine.forEachComponent(function (component) {

                    if (component.type === 'operator') {
                        wiringStatus.operators[component.id] = component._component;
                    }
                });

                wiringStatus.visualdescription = this.behaviourEngine.toJSON();

                return wiringStatus;
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var bindEndpoint = function bindEndpoint(endpoint) {
        /*jshint validthis:true */

        this.connectionEngine.appendEndpoint(endpoint);
        this.suggestionManager.appendEndpoint(endpoint);

        endpoint
            .on('mouseenter', function () {
                if (!this.connectionEngine.temporalConnection) {
                    this.suggestionManager.showSuggestions(endpoint);
                }
            }.bind(this))
            .on('mouseleave', function () {
                if (!this.connectionEngine.temporalConnection) {
                    this.suggestionManager.hideSuggestions(endpoint);
                }
            }.bind(this));
    };

    var createAndSetUpBehaviourEngine = function createAndSetUpBehaviourEngine() {
        /*jshint validthis:true */

        this.behaviourEngine = new ns.WiringEditor.BehaviourEngine();
        this.behaviourEngine
            .on('activate', behaviour_onactivate.bind(this))
            .on('change', behaviour_onchange.bind(this))
            .on('enable', behaviourengine_onenable.bind(this));

        this.layout.addPanel(this.behaviourEngine);

        return this;
    };

    var createAndSetUpComponentManager = function createAndSetUpComponentManager() {
        /*jshint validthis:true */

        this.componentManager =  new ns.WiringEditor.ComponentShowcase(this.layout, {
            getComponentDraggable: function (component) {
                return this.createComponent(component, {commit: false});
            }.bind(this),
            createWiringComponent: function (meta) {
                return meta.instantiate(this.autoOperatorId++, this.workspace.wiring);
            }.bind(this)
        });

        this.layout.addPanel(this.componentManager);

        return this;
    };

    var createAndSetUpConnectionEngine = function createAndSetUpConnectionEngine() {
        /*jshint validthis:true */

        this.connectionEngine = new ns.WiringEditor.ConnectionEngine(this.layout.content, findWiringEngine.bind(this));
        this.connectionEngine
            .on('dragstart', connection_ondragstart.bind(this))
            .on('dragend', connection_ondragend.bind(this))
            .on('establish', connection_onestablish.bind(this))
            .on('duplicate', connection_onduplicate.bind(this));

        return this;
    };

    var findWiringEngine = function findWiringEngine() {
        /*jshint validthis:true */
        return this.workspace.wiring;
    };

    var createAndSetUpLayout = function createAndSetUpLayout() {
        /*jshint validthis:true */

        this.layout = new se.OffCanvasLayout();
        this.layout.sidebar.addClassName("wiring-sidebar");
        this.layout.content.addClassName("wiring-diagram");
        this.layout.footer.addClassName("wiring-footer");

        setUpNavbarView.call(this);

        this.initialMessage = createInitialMessage();
        this.layout.content.appendChild(this.initialMessage);

        this.layout
            .on('slideOut', function () {
                this.btnFindComponents.active = false;
                this.btnListBehaviours.active = false;
            }.bind(this))
            .on('slideIn', function (offcanvas, panel) {
                this.btnFindComponents.active = panel.hasClassName("panel-components");
                this.btnListBehaviours.active = panel.hasClassName("panel-behaviours");
            }.bind(this));

        var wiringLegend = document.createElement('div');

        wiringLegend.className = "wiring-legend";
        wiringLegend.innerHTML =
            '<span class="wiring-element element-connection">' +
                '<span class="color"></span>' +
                '<span class="title">' + utils.gettext("Connections") + '</span>' +
            '</span>' +
            '<span class="wiring-element element-operator">' +
                '<span class="color"></span>' +
                '<span class="title">' + utils.gettext("Operators") + '</span>' +
            '</span>' +
            '<span class="wiring-element element-widget">' +
                '<span class="color"></span>' +
                '<span class="title">' + utils.gettext("Widgets") + '</span>' +
            '</span>';

        var wiringLogger = document.createElement('div');
        var currentBehaviour = document.createElement('span');

        wiringLogger.className = 'wiring-logger';
        wiringLogger.appendChild(currentBehaviour);

        this.legend = {
            title: currentBehaviour,
            connections: wiringLegend.querySelector('.element-connection .color'),
            operators: wiringLegend.querySelector('.element-operator .color'),
            widgets: wiringLegend.querySelector('.element-widget .color')
        };

        this.layout.footer
            .appendChild(wiringLogger)
            .appendChild(wiringLegend);

        this.layout.content.get().addEventListener('click', layout_onclick.bind(this));
        this.appendChild(this.layout);

        return this;
    };

    var createInitialMessage = function createInitialMessage() {
        var alert = new se.Alert({
            title: gettext("Hello, welcome to the Wiring Editor view!"),
            message: gettext("In this view you can connect all the components of your dashboard in a visual way."),
            state: 'info',
            alignment: 'static-top'
        });

        alert.heading.addClassName('text-center');
        alert.addNote(new StyledElements.Fragment(utils.gettext("Open the sidebar using the <em>Find components</em> button and drag &amp; drop components (operators/widgets) from the sidebar for being able to connect them as you wish.")));

        return alert;
    };

    var setUpNavbarView = function setUpNavbarView() {
        /*jshint validthis:true */

        this.btnFindComponents = new se.ToggleButton({
            title: gettext("Find components"),
            extraClass: "btn-find-components",
            iconClass: "icon-archive",
            stackedIconClass: "icon-plus-sign"
        });
        this.btnFindComponents.on('click', function (button) {
            this.componentManager.setUp();
            showSelectedPanel.call(this, button, 0);
        }.bind(this));

        this.btnListBehaviours = new se.ToggleButton({
            title: gettext("List behaviours"),
            extraClass: "btn-list-behaviours",
            iconClass: "icon-sitemap"
        });
        this.btnListBehaviours.on('click', function (button) {
            showSelectedPanel.call(this, button, 1);
        }.bind(this));

        return this;
    };

    var disableComponent = function disableComponent(component) {
        /*jshint validthis:true */
        var item = this.componentManager.getComponent(component.type, component.id);

        if (item != null) {
            item.disable();
        }

        return this;
    };

    var tearDownView = function tearDownView() {
        /*jshint validthis:true */

        this.workspace.wiring.load(this.toJSON()).save();
        readyView.call(this);

        Wirecloud.UserInterfaceManager.rootKeydownHandler = null;

        return this;
    };

    var readyView = function readyView() {
        /*jshint validthis:true */

        this.layout.slideOut();

        this.behaviourEngine.clear().disable();

        this.componentManager.clear().setUp();

        this.suggestionManager.enable();

        this.sortableComponent = null;
        this.autoOperatorId = 1;

        return this;
    };

    var setUpView = function setUpView() {
        /*jshint validthis:true */

        this.workspace = Wirecloud.activeWorkspace;
        this.errorMessages = [];

        readyView.call(this);
        loadWiringStatus.call(this);

        Wirecloud.UserInterfaceManager.rootKeydownHandler = document_onkeydown.bind(this);

        return this;
    };

    var loadWiringStatus = function loadWiringStatus() {
        /*jshint validthis:true */

        var wiringEngine, visualStatus;

        wiringEngine = this.workspace.wiring;
        visualStatus = wiringEngine.status.visualdescription;

        // Loading the widgets used in the workspace...
        loadWidgets.call(this, wiringEngine.widgets, visualStatus.components.widget);
        // ...completed.

        // Loading the operators uploaded in this account...
        var operators = Wirecloud.wiring.OperatorFactory.getAvailableOperators();
        loadOperators.call(this, operators, wiringEngine.operators, visualStatus);
        // ...completed.

        // Loading the connections established in the workspace...
        loadConnections.call(this, wiringEngine.connections, visualStatus);
        // ...completed.

        this.behaviourEngine.loadBehaviours(visualStatus.behaviours);

        return this;
    };

    var loadConnections = function loadConnections(connections, vInfo) {
        /*jshint validthis:true */

        var list1 = [], list2 = [];

        connections.forEach(function (c, i) {
            var source, target, errorCount = 0;

            if (c.volatile) {
                return;
            }

            try {
                source = findEndpoint.call(this, 'source', c.source.toJSON(), c.source);
            } catch (e) {
                this.errorMessages.push(e);
                errorCount++;
            }

            try {
                target = findEndpoint.call(this, 'target', c.target.toJSON(), c.target);
            } catch (e) {
                this.errorMessages.push(e);
                errorCount++;
            }

            if (!errorCount) {
                list1.push({
                    source: source,
                    target: target,
                    meta: c,
                    options: {}
                });
            }
        }, this);

        vInfo.connections.forEach(function (v, i) {
            var source, target, found;

            try {
                v = utils.updateObject(ns.WiringEditor.Connection.VISUAL_INFO, v);

                found = list1.some(function (c) {
                    if (c.source.id == v.sourcename && c.target.id == v.targetname) {
                        c.options.sourceHandle = v.sourcehandle;
                        c.options.targetHandle = v.targethandle;

                        return true;
                    }
                });

                if (!found) {
                    // The connection does not have business info.
                }
            } catch (e) {
                this.errorMessages.push(e);
            }
        }, this);

        list1.concat(list2).forEach(function (c) {
            this.connectionEngine.connect(c.meta, c.source, c.target, c.options);
        }, this);

        return this;
    };

    var loadOperators = function loadOperators(operators, operatorsInUse, vInfo) {
        /*jshint validthis:true */

        Object.keys(operators).forEach(function (uri) {
            this.componentManager.addMeta(operators[uri]);
        }, this);

        Object.keys(operatorsInUse).forEach(function (id) {

            if (!operatorsInUse[id].missing) {
                this.componentManager.addWiringComponent(operatorsInUse[id]);
            }

            if (!operatorsInUse[id].volatile) {
                this.createComponent(operatorsInUse[id], vInfo.components.operator[id]);

                if (parseInt(id, 10) >= this.autoOperatorId) {
                    this.autoOperatorId = parseInt(id, 10) + 1;
                }
            }
        }, this);

        // TODO: for id vInfo.components.operator && operatorInfo.name != ""

        return this;
    };

    var loadWidgets = function loadWidgets(wiringWidgets, visualWidgets) {
        /*jshint validthis:true */

        var id, message, widget;

        for (id in wiringWidgets) {
            widget = wiringWidgets[id];

            this.componentManager
                .addMeta(widget.meta)
                .addWiringComponent(widget);

            if (widget.id in visualWidgets) {
                this.createComponent(widget, visualWidgets[widget.id]);
            }

            delete visualWidgets[id];
        }

        for (id in visualWidgets) {
            message = utils.gettext("The widget %(id)s (%(uri)s) does not exist.");
            widget = new Wirecloud.wiring.MissingWidget(id, this.workspace.wiring, visualWidgets[id], message);
            this.createComponent(widget, visualWidgets[id]);
        }

        return this;
    };

    var findEndpoint = function findEndpoint(type, bInfo, wiringEndpoint) {
        /*jshint validthis:true */
        var component, endpoint;

        component = this.behaviourEngine.components[bInfo.type][bInfo.id];

        if (!component) {
            component = this.componentManager.getComponent(bInfo.type, bInfo.id);

            if (!component) {
                throw new Error("A missing component could not recover.");
            }

            component = this.createComponent(component._component);
        }

        endpoint = component.getEndpoint(type, bInfo.endpoint);
        if (endpoint == null) {
            if (wiringEndpoint != null) {
                return component.appendEndpoint(type, wiringEndpoint).getEndpoint(type, bInfo.endpoint);
            } else {
                throw new Error("Missing endpoint from view info.");
            }
        } else {
            return endpoint;
        }
    };

    var findEndpointById = function findEndpointById(type, id) {
        /*jshint validthis:true */

        var kwargs = id.split("/");

        if (kwargs.length != 3) {
            throw utils.createError('EndpointError', "A %(type)s-endpoint is malformed.", {
                type: type
            });
        }

        return findEndpoint.call(this, type, {
            type: kwargs[0],
            id: parseInt(kwargs[1]),
            endpoint: kwargs[2]
        });
    };

    var clearComponentSelection = function clearComponentSelection() {
        var type, id, component;

        for (type in this.selectedComponents) {
            for (id in this.selectedComponents[type]) {
                component = this.selectedComponents[type][id];
                component.setUp();
                delete component.initialPosition;
                delete this.selectedComponents[type][id];
            }
        }

        this.selectedCount = 0;
    };

    var document_onkeydown = function document_onkeydown(key, modifiers) {
        var type, id, component, componentsToRemove = [];

        switch (key) {
        case 'Backspace':
        case 'Delete':

            if (hasSelectedComponents.call(this)) {

                for (type in this.selectedComponents) {
                    for (id in this.selectedComponents[type]) {
                        component = this.selectedComponents[type][id];

                        if (component.isRemovable()) {
                            componentsToRemove.push(component);
                        }
                    }
                }

                if (componentsToRemove.length) {
                    this.behaviourEngine.removeComponentList(componentsToRemove);
                    clearComponentSelection.call(this);
                }
            }

            return true;
        }
    };

    var hasSelectedComponents = function hasSelectedComponents() {
        return Object.keys(this.selectedComponents.operator).length > 0 || Object.keys(this.selectedComponents.widget).length > 0;
    };

    var behaviourengine_onenable = function behaviourengine_onenable(behaviourEngine, enabled) {
        /*jshint validthis:true */

        this.connectionEngine.forEachConnection(function (connection) {
            connection.removeAllowed = true;
            connection.background = false;
            this.behaviourEngine.updateConnection(connection, connection.toJSON());
        }.bind(this));

        this.behaviourEngine.forEachComponent(function (component) {
            component.removeCascadeAllowed = enabled;
            component.removeAllowed = true;
            component.background = false;
            this.behaviourEngine.updateComponent(component, component.toJSON());
        }.bind(this));
    };

    var behaviour_onactivate = function behaviour_onactivate(behaviourEngine, behaviour, viewpoint) {
        /*jshint validthis:true */

        var currentStatus = behaviour.getCurrentStatus();

        switch (viewpoint) {
        case ns.WiringEditor.BehaviourEngine.GLOBAL:

            this.connectionEngine.forEachConnection(function (connection) {
                connection.removeAllowed = (behaviourEngine.filterByConnection(connection).length == 1);
                connection.show().background = !behaviour.hasConnection(connection);
            });

            this.behaviourEngine.forEachComponent(function (component) {
                component.removeAllowed = (behaviourEngine.filterByComponent(component).length == 1);
                component.removeCascadeAllowed = true;
                component.background = !behaviour.hasComponent(component);
            });

            break;
        }

        behaviour_onchange.call(this, behaviourEngine, currentStatus, true);
    };

    var connection_onduplicate = function connection_onduplicate(connectionEngine, connection) {
        /*jshint validthis:true */

        if (connection.background) {
            this.behaviourEngine.updateConnection(connection, connection.toJSON(), true);
        }
    };

    var connection_onestablish = function connection_onestablish(connectionEngine, connection, connectionBackup) {
        /*jshint validthis:true */

        this.behaviourEngine.updateConnection(connection, connection.toJSON());

        connection
            .on('change', function () {
                this.behaviourEngine.updateConnection(connection, connection.toJSON());
            }.bind(this))
            .on('optremove', function () {
                this.behaviourEngine.removeConnection(connection);
            }.bind(this))
            .on('optshare', function () {
                this.behaviourEngine.updateConnection(connection, connection.toJSON(), true);
            }.bind(this));

        if (connectionBackup != null) {
            this.behaviourEngine.removeConnection(connectionBackup);

            if (this.behaviourEngine.hasConnection(connectionBackup)) {
                showConnectionChangeModal.call(this, connectionBackup);
            }
        }
    };

    var showConnectionChangeModal = function showConnectionChangeModal(connection) {
        /*jshint validthis:true */
        var modal, message;
        var builder = new se.GUIBuilder();

        message = builder.parse(builder.DEFAULT_OPENING + utils.gettext("The connection will also be modified for the rest of behaviours, would you like to continue?") + builder.DEFAULT_CLOSING);

        modal = new Wirecloud.ui.AlertWindowMenu();
        modal.setMsg(message);
        modal.acceptHandler = function () {
            this.behaviourEngine.removeConnection(connection, true);
        }.bind(this);
        modal.show();
    };

    var component_onremove = function component_onremove(component) {
        /*jshint validthis:true */

        component.forEachEndpoint(function (endpoint) {
            this.connectionEngine.removeEndpoint(endpoint);
            this.suggestionManager.removeEndpoint(endpoint);
        }.bind(this));

        if (component.id in this.selectedComponents[component.type]) {
            delete this.selectedComponents[component.type][component.id];
            this.selectedCount--;
        }

        if (!component.missing) {
            this.componentManager.getComponent(component.type, component.id).enable();
        }

        if (!this.behaviourEngine.hasComponents()) {
            this.initialMessage.show();
        }
    };

    var connection_ondragstart = function connection_ondragstart(connectionEngine, connection, initialEndpoint, realEndpoint) {
        /*jshint validthis:true */

        this.collapsedComponents = [];

        this.behaviourEngine.forEachComponent(function (component) {

            if (component.collapsed) {
                component.collapsed = false;
                this.collapsedComponents.push(component);
            }
        }.bind(this));

        if (this.connectionEngine._connectionBackup != null) {
            this.suggestionManager.hideSuggestions(realEndpoint);
            this.suggestionManager.showSuggestions(initialEndpoint);
        }
    };

    var connection_ondragend = function connection_ondragend(connectionEngine, connection, initialEndpoint) {
        /*jshint validthis:true */

        if (this.collapsedComponents != null) {

            this.collapsedComponents.forEach(function (component) {
                component.collapsed = true;
            });

            delete this.collapsedComponents;
        }

        this.suggestionManager.hideSuggestions(initialEndpoint);
    };

    var behaviour_onchange = function behaviour_onchange(behaviourEngine, currentStatus, enabled) {
        /*jshint validthis:true */

        if (enabled) {
            currentStatus.title = "<strong>" + utils.gettext("Behaviour") + ":</strong> " + currentStatus.title;
        }

        this.legend.title.innerHTML = currentStatus.title;
        this.legend.connections.textContent = currentStatus.connections;
        this.legend.operators.textContent = currentStatus.components.operator;
        this.legend.widgets.textContent = currentStatus.components.widget;

        return this;
    };

    var layout_onclick = function layout_onclick() {
        /*jshint validthis:true */

        var type, id;

        this.layout.slideOut();

        clearComponentSelection.call(this);

        if (this.sortableComponent != null) {
            this.sortableComponent.setUp();
            this.sortableComponent = null;
        }

        this.connectionEngine.setUp();
    };

    var showSelectedPanel = function showSelectedPanel(button, panelIndex) {
        /*jshint validthis:true */

        if (button.active) {
            this.layout.slideIn(panelIndex);
        } else {
            this.layout.slideOut();
        }

        return this;
    };

    var component_onclick = function component_onclick(component, event) {
        /*jshint validthis:true */

        var type, id;

        if (!component.active && component.id in this.selectedComponents[component.type]) {
            if (event.ctrlKey || event.metaKey) {
                delete component.initialPosition;
                delete this.selectedComponents[component.type][component.id];
                this.selectedCount--;
            } else {
                if (this.selectedCount > 1) {
                    for (type in this.selectedComponents) {
                        for (id in this.selectedComponents[type]) {
                            this.selectedComponents[type][id].active = false;
                            delete this.selectedComponents[type][id].initialPosition;
                            delete this.selectedComponents[type][id];
                        }
                    }
                    this.selectedCount = 0;
                    component.active = true;
                } else {
                    delete component.initialPosition;
                    delete this.selectedComponents[component.type][component.id];
                    this.selectedCount = 0;
                }
            }
        }

        if (component.active && !(component.id in this.selectedComponents[component.type])) {
            this.selectedComponents[component.type][component.id] = component;
            this.selectedCount++;
        }
    };

    var component_ondragstart = function component_ondragstart(component, event) {
        /*jshint validthis:true */

        var type, id, selectedComponent;

        if (this.sortableComponent != null) {
            this.sortableComponent.setUp();
            this.sortableComponent = null;
        }

        if (event.ctrlKey || event.metaKey) {
            if (!(component.id in this.selectedComponents[component.type])) {
                this.selectedComponents[component.type][component.id] = component;
                this.selectedCount++;
            }
        } else {
            if (!(component.id in this.selectedComponents[component.type])) {
                for (type in this.selectedComponents) {
                    for (id in this.selectedComponents[type]) {
                        this.selectedComponents[type][id].active = false;
                        delete this.selectedComponents[type][id].initialPosition;
                        delete this.selectedComponents[type][id];
                    }
                }
                this.selectedCount = 0;
            }
        }

        if (component.id in this.selectedComponents[component.type]) {

            for (type in this.selectedComponents) {
                for (id in this.selectedComponents[type]) {
                    selectedComponent = this.selectedComponents[type][id];
                    selectedComponent.initialPosition = selectedComponent.position();
                }
            }
        }
    };

    var component_ondrag = function component_ondrag(component, x, y) {
        /*jshint validthis:true */

        var type, id, selectedComponent;

        for (type in this.selectedComponents) {
            for (id in this.selectedComponents[type]) {
                if (component.type !== type || component.id != id) {
                    selectedComponent = this.selectedComponents[type][id];
                    selectedComponent.position({
                        x: selectedComponent.initialPosition.x + x,
                        y: selectedComponent.initialPosition.y + y
                    });
                }
            }
        }
    };

    var component_ondragend = function component_ondragend(component) {
        /*jshint validthis:true */

        var type, id, selectedComponent;

        for (type in this.selectedComponents) {
            for (id in this.selectedComponents[type]) {
                selectedComponent = this.selectedComponents[type][id];
                selectedComponent.active = true;

                if (component.type !== type || component.id != id) {
                    selectedComponent.trigger('change', {position: selectedComponent.position()});
                }
            }
        }
    };

    var component_onsortstart = function component_onsortstart(component) {

        if (this.sortableComponent != null && !this.sortableComponent.equals(component)) {
            this.sortableComponent.setUp();
        }

        this.sortableComponent = component;
        this.connectionEngine.enabled = false;
        this.suggestionManager.disable();
    };

    var component_onsortend = function component_onsortend(component) {
        /*jshint validthis:true */
        this.connectionEngine.enabled = true;
        this.suggestionManager.enable();
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
