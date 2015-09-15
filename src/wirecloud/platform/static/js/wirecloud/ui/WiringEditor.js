/*
 *     DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER
 *
 *     Copyright (c) 2012-2015 Universidad Politécnica de Madrid
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

                options = utils.updateObject({commit: true}, options);

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
                    .on('optshare', function () {
                        this.behaviourEngine.updateComponent(component, component.toJSON(), true);
                    }.bind(this))
                    .on('remove', component_onremove.bind(this));

                component.forEachEndpoint(bindEndpoint.bind(this));
                this.initialMessage.hide();

                if (options.commit) {
                    this.layout.content.append(component);
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
                    workspace_creator: currentState.workspace_creator,
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

                this.componentManager.forEachComponent(function (component) {

                    if (component.type === 'operator' && !component.enabled) {
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

    function bindEndpoint(endpoint) {

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
    }

    function createAndSetUpBehaviourEngine() {

        this.behaviourEngine = new ns.WiringEditor.BehaviourEngine();
        this.behaviourEngine
            .on('activate', behaviour_onactivate.bind(this))
            .on('change', behaviour_onchange.bind(this))
            .on('enable', behaviourengine_onenable.bind(this));

        this.layout.addPanel(this.behaviourEngine);

        return this;
    }

    function createAndSetUpComponentManager() {

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
    }

    function createAndSetUpConnectionEngine() {

        this.connectionEngine = new ns.WiringEditor.ConnectionEngine(this.layout.content, findWiringEngine.bind(this));
        this.connectionEngine
            .on('dragstart', connection_ondragstart.bind(this))
            .on('dragend', connection_ondragend.bind(this))
            .on('establish', connection_onestablish.bind(this))
            .on('duplicate', connection_onduplicate.bind(this));

        return this;
    }

    function findWiringEngine() {
        return this.workspace.wiring;
    }

    function createAndSetUpLayout() {

        this.layout = new se.OffCanvasLayout();
        this.layout.sidebar.addClass("wiring-sidebar");
        this.layout.content.addClass("wiring-diagram");
        this.layout.footer.addClass("wiring-footer");

        setUpNavbarView.call(this);

        this.initialMessage = createInitialMessage();
        this.layout.content.append(this.initialMessage);

        this.layout
            .on('slideOut', function () {
                this.btnFindComponents.active = false;
                this.btnListBehaviours.active = false;
            }.bind(this))
            .on('slideIn', function (offcanvas, panel) {
                this.btnFindComponents.active = panel.hasClass("panel-components");
                this.btnListBehaviours.active = panel.hasClass("panel-behaviours");
            }.bind(this));

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
            .append(wiringLogger)
            .append(wiringLegend);

        this.layout.content.get().addEventListener('click', layout_onclick.bind(this));
        this.append(this.layout);

        return this;
    }

    function createInitialMessage() {
        var alert = new se.Alert({
            title: gettext("Hello, welcome to the Mashup Wiring's view!"),
            message: gettext("In this edition area, you can drag & drop web applications (widgets/operators) from the sidebar and then, connect them each other."),
            state: 'info',
            alignment: 'static-top'
        });

        alert.heading.addClass('text-center');
        alert.addNote(gettext("Only if a web application provides input or output endpoints, it will be connectable with others."));

        return alert;
    }

    function setUpNavbarView() {

        this.btnFindComponents = new se.ToggleButton({
            title: gettext("Find components"),
            extraClass: "btn-find-components",
            iconClass: "icon-archive",
            stackedIconClass: "icon-plus-sign"
        });
        this.btnFindComponents.on('click', function (button) {
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
    }

    function disableComponent(component) {
        var item = this.componentManager.getComponent(component.type, component.id);

        if (item != null) {
            item.disable();
        }

        return this;
    }

    function tearDownView() {

        this.workspace.wiring.load(this.toJSON()).save();
        readyView.call(this);

        return this;
    }

    function readyView() {

        this.layout.slideOut();

        this.behaviourEngine.empty().disable();

        this.componentManager.empty().setUp();

        this.sortableComponent = null;
        this.autoOperatorId = 1;

        return this;
    }

    function setUpView() {

        this.workspace = Wirecloud.activeWorkspace;
        this.errorMessages = [];

        readyView.call(this);
        loadWiringStatus.call(this);

        /*this.errorMessages.forEach(function (error) {
            console.error(error);
        });*/

        return this;
    }

    function loadWiringStatus() {
        var wiringEngine = this.workspace.wiring,
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
    }

    function loadConnections(connections, vInfo) {
        var list1 = [], list2 = [];

        connections.forEach(function (c, i) {
            var source, target, errorCount = 0;

            try {
                source = findEndpoint.call(this, 'source', c.source.toJSON());
            } catch (e) {
                this.errorMessages.push(e);
                errorCount++;
            }

            try {
                target = findEndpoint.call(this, 'target', c.target.toJSON());
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
                    source = findEndpointById.call(this, 'source', v.sourcename);
                    target = findEndpointById.call(this, 'target', v.targetname);

                    list2.push({
                        source: source,
                        target: target,
                        meta: this.workspace.wiring.createConnection(false, source._endpoint, target._endpoint),
                        options: {
                            sourceHandle: v.sourcehandle,
                            targetHandle: v.targethandle
                        }
                    });
                }
            } catch (e) {
                this.errorMessages.push(e);
            }
        }, this);

        list1.concat(list2).forEach(function (c) {
            var connection = this.connectionEngine.connect(c.meta, c.source, c.target, c.options);
        }, this);

        return this;
    }

    function loadOperators(operators, operatorsInUse, vInfo) {
        var component, id, instance;

        Object.keys(operators).forEach(function (uri) {
            this.componentManager.addMeta(operators[uri]);
        }, this);

        Object.keys(operatorsInUse).forEach(function (id) {

            if (!operatorsInUse[id].missing) {
                this.componentManager.addWiringComponent(operatorsInUse[id]);
            }

            this.createComponent(operatorsInUse[id], vInfo.components.operator[id]);

            if (id >= this.autoOperatorId) {
                this.autoOperatorId = id + 1;
            }
        }, this);

        // TODO: for id vInfo.components.operator && operatorInfo.name != ""

        return this;
    }

    function loadWidgets(wiringWidgets, visualWidgets) {
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
            message = utils.gettext("The widget (%(id)s) of '%(uri)s' does not exist.");
            widget = new Wirecloud.wiring.MissingWidget(id, this.workspace.wiring, visualWidgets[id], message);
            this.createComponent(widget, visualWidgets[id]);
        }

        return this;
    }

    function findEndpoint(type, bInfo) {
        var component, endpoint;

        component = this.behaviourEngine.components[bInfo.type][bInfo.id];

        if (!component) {
            component = this.componentManager.getComponent(bInfo.type, bInfo.id);

            if (!component) {
                throw new Error("A missing component could not recover.");
            }

            component = this.createComponent(component._component);
        }

        // TODO: create missing endpoint
        endpoint = component.getEndpoint(type, bInfo.endpoint, true);

        return endpoint;
    }

    function findEndpointById(type, id) {
        var view, kwargs = id.split("/");

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
    }

    function behaviourengine_onenable() {

        this.connectionEngine.forEachConnection(function (connection) {
            connection.background = false;
            this.behaviourEngine.updateConnection(connection, connection.toJSON());
        }.bind(this));

        this.behaviourEngine.forEachComponent(function (component) {
            component.background = false;
            this.behaviourEngine.updateComponent(component, component.toJSON());
        }.bind(this));
    }

    function behaviour_onactivate(behaviourEngine, behaviour, viewpoint) {
        var component, connection, i, id, type;
        var currentStatus = behaviour.getCurrentStatus();

        //LayoutManagerFactory.getInstance().header.refresh();

        switch (viewpoint) {
        case ns.WiringEditor.BehaviourEngine.GLOBAL:

            this.connectionEngine.forEachConnection(function (connection) {
                connection.show().background = !behaviour.hasConnection(connection);
            });

            this.behaviourEngine.forEachComponent(function (component) {
                component.background = !behaviour.hasComponent(component);
            });

            break;
        }

        behaviour_onchange.call(this, behaviourEngine, currentStatus, true);
    }

    function connection_onduplicate(connectionEngine, connection) {
        if (connection.background) {
            this.behaviourEngine.updateConnection(connection, connection.toJSON(), true);
        }
    }

    function connection_onestablish(connectionEngine, connection) {
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
    }

    function component_onremove(component) {
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
    }

    function connection_ondragstart(connectionEngine, connection, initialEndpoint) {
        var component, id, type;

        this.collapsedComponents = [];

        this.behaviourEngine.forEachComponent(function (component) {

            if (component.collapsed) {
                component.collapsed = false;
                this.collapsedComponents.push(component);
            }
        }.bind(this));
    }

    function connection_ondragend(connectionEngine, connection, initialEndpoint) {

        if (this.collapsedComponents != null) {

            this.collapsedComponents.forEach(function (component) {
                component.collapsed = true;
            });

            delete this.collapsedComponents;
        }

        this.suggestionManager.hideSuggestions(initialEndpoint);
    }

    function behaviour_onchange(behaviourEngine, currentStatus, enabled) {

        if (enabled) {
            currentStatus.title = "<strong>Behaviour:</strong> " + currentStatus.title;
        }

        this.legend.title.innerHTML = currentStatus.title;
        this.legend.connections.textContent = currentStatus.connections;
        this.legend.operators.textContent = currentStatus.components.operator;
        this.legend.widgets.textContent = currentStatus.components.widget;

        return this;
    }

    function layout_onclick() {
        var type, id;

        this.layout.slideOut();

        for (type in this.selectedComponents) {
            for (id in this.selectedComponents[type]) {
                this.selectedComponents[type][id].setUp();
                delete this.selectedComponents[type][id].initialPosition;
                delete this.selectedComponents[type][id];
            }
        }

        if (this.sortableComponent != null) {
            this.sortableComponent.setUp();
            this.sortableComponent = null;
        }

        this.connectionEngine.setUp();
        this.selectedCount = 0;
    }

    function showSelectedPanel(button, panelIndex) {

        if (button.active) {
            this.layout.slideIn(panelIndex);
        } else {
            this.layout.slideOut();
        }

        return this;
    }

    function component_onclick(component, event) {
        var type, id, selectedComponent;

        if (!component.active && component.id in this.selectedComponents[component.type]) {
            if (event.ctrlKey) {
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
    }

    function component_ondragstart(component, event) {
        var type, id, selectedComponent;

        if (this.sortableComponent != null) {
            this.sortableComponent.setUp();
            this.sortableComponent = null;
        }

        if (event.ctrlKey) {
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
    }

    function component_ondrag(component, x, y) {
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
    }

    function component_ondragend(component) {
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
    }

    function component_onsortstart(component) {

        if (this.sortableComponent != null && !this.sortableComponent.equals(component)) {
            this.sortableComponent.setUp();
        }

        this.sortableComponent = component;
        this.connectionEngine.enabled = false;
    }

    function component_onsortend(component) {
        this.connectionEngine.enabled = true;
    }

    /*
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
    */

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
