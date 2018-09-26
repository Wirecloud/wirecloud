/*
 *     Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (ns, se) {

    "use strict";

    describe("WiringEditor", () => {

        const callEventListener = function callEventListener(instance, event) {
            var largs = Array.prototype.slice.call(arguments, 2);
            largs.unshift(instance);
            instance.addEventListener.calls.allArgs().some(function (args) {
                if (args[0] === event) {
                    args[1].apply(instance, largs);
                    return true;
                }
            });
        };

        const createWorkspaceMock = function createWorkspaceMock() {
            let workspace = {};
            Object.defineProperties(workspace, {
                id: {value: "1"},
                owner: {value: "owner"},
                name: {value: "dashboard"},
                widgets: {value: []},
                wiring: {
                    value: {
                        load: jasmine.createSpy("load"),
                        save: jasmine.createSpy("save"),
                        connections: [],
                        operators: [],
                        visualdescription: {
                            behaviours: [],
                            connections: [],
                            components: {
                                operator: {},
                                widget: {}
                            }
                        }
                    }
                },
                _addOperator: {
                    value: function (options) {
                        if (options == null) {
                            options = {};
                        }
                        let operator = {
                            id: "" + (this.wiring.operators.length + 1),
                            volatile: options.volatile,
                            meta: {
                                type: "operator"
                            },
                            getEndpoint: jasmine.createSpy("getEndpoint")
                        };
                        this.wiring.operators.push(operator);
                        if (options.visual) {
                            this.wiring.visualdescription.components.operator[operator.id] = {
                                name: "Wirecloud/TestOperator/1.0"
                            };
                        }
                        return this;
                    }
                },
                _addWidget: {
                    value: function (options) {
                        if (options == null) {
                            options = {};
                        }
                        let widget = {
                            id: "" + (this.widgets.length + 1),
                            volatile: options.volatile,
                            meta: {
                                type: "widget"
                            },
                            getEndpoint: jasmine.createSpy("getEndpoint")
                        };
                        this.widgets.push(widget);
                        if (options.visual) {
                            this.wiring.visualdescription.components.widget[widget.id] = {
                                collapsed: false,
                                endpoints: {source: [], target: []},
                                name: "Wirecloud/Test/1.0",
                                position: {x: 678, y: 71}
                            };
                        }
                        return this;
                    }
                },
                _addConnection: {
                    value: function (options) {
                        if (options == null) {
                            options = {};
                        }

                        if (!('source' in options)) {
                            options.source = {
                                type: "widget",
                                id: "1",
                                endpoint: "output1"
                            };
                        }
                        if (!('target' in options)) {
                            options.target = {
                                type: "operator",
                                id: "1",
                                endpoint: "input1"
                            };
                        }
                        let sourceid = [options.source.type, options.source.id, options.source.endpoint].join("/");
                        let targetid = [options.target.type, options.target.id, options.target.endpoint].join("/");

                        let connection = {
                            volatile: !!options.volatile,
                            source: {
                                id: sourceid,
                                name: options.source.endpoint,
                                component: {
                                    id: options.source.id,
                                    meta: {
                                        type: options.source.type
                                    }
                                }
                            },
                            target: {
                                id: targetid,
                                name: options.target.endpoint,
                                component: {
                                    id: options.target.id,
                                    meta: {
                                        type: options.target.type
                                    }
                                }
                            }
                        };
                        this.wiring.connections.push(connection);
                        if (options.visual) {
                            this.wiring.visualdescription.connections.push({
                                sourcehandle: "auto",
                                sourcename: sourceid,
                                targethandle: "auto",
                                targetname: targetid
                            });
                        }
                    }
                }
            });
            workspace.wiring.load.and.returnValue(workspace.wiring);
            return workspace;
        };

        beforeAll(() => {
            // Simulate Wirecloud.init has been called
            Wirecloud.constants.WORKSPACE_CONTEXT = {
                "title": {
                    "description": "Current title of the workspace",
                    "label": "Title"
                },
                "name": {
                    "description": "Current name of the workspace",
                    "label": "Name"
                },
                "owner": {
                    "description": "Workspace's owner username",
                    "label": "Owner"
                },
                "description": {
                    "description": "Workspace's short description",
                    "label": "Description"
                },
                "longdescription": {
                    "description": "Workspace's long description",
                    "label": "Long Description"
                }
            };

            ns.WiringEditor.BehaviourEngine = jasmine.createSpy("BehaviourEngine").and.callFake(function () {
                this.addEventListener = jasmine.createSpy('addEventListener').and.returnValue(this);
                this.stopOrdering = jasmine.createSpy('stopOrdering').and.returnValue(this);
                this.loadBehaviours = jasmine.createSpy('loadBehaviours').and.returnValue(this);
                this.hasComponents = jasmine.createSpy('hasComponents');
                this.updateConnection = jasmine.createSpy('updateConnection');
                this.removeComponent = jasmine.createSpy('removeComponent');
                this.updateComponent = jasmine.createSpy('updateComponent').and.callFake(function (component) {
                    this.components[component.type][component.id] = component;
                    return this;
                });
                this.removeComponentList = jasmine.createSpy('removeComponentList').and.returnValue(this);
                this.forEachComponent = jasmine.createSpy('forEachComponent').and.returnValue(this);
                this.filterByConnection = jasmine.createSpy('filterByConnection');
                this.filterByComponent = jasmine.createSpy('filterByComponent');
                this.clear = jasmine.createSpy('clear').and.returnValue(this);
                this.disable = jasmine.createSpy('disable').and.returnValue(this);
                this.toJSON = jasmine.createSpy('toJSON').and.returnValue({"BehaviourEngine": "toJSON"});
                this.wrapperElement = document.createElement('div');
                this.components = {
                    operator: {},
                    widget: {}
                };
            });
            se.Utils.inherit(ns.WiringEditor.BehaviourEngine, se.StyledElement);
            ns.WiringEditor.BehaviourEngine.GLOBAL = 0;

            ns.WiringEditor.ComponentDraggable = jasmine.createSpy("ComponentDraggable").and.callFake(function (wiringComponent) {
                this._component = wiringComponent;
                this.id = wiringComponent.id;
                this.type = wiringComponent.meta.type;
                this.active = false;

                this.addEventListener = jasmine.createSpy('addEventListener').and.returnValue(this);
                this.forEachEndpoint = jasmine.createSpy('forEachEndpoint').and.returnValue(this);
                this.setUp = jasmine.createSpy('setUp').and.returnValue(this);
                this.toJSON = jasmine.createSpy('toJSON').and.returnValue({});
                this.position = jasmine.createSpy('position');
                this.getEndpoint = jasmine.createSpy('getEndpoint');
                this.wrapperElement = document.createElement('div');
            });
            se.Utils.inherit(ns.WiringEditor.ComponentDraggable, se.StyledElement);

            ns.WiringEditor.ComponentShowcase = jasmine.createSpy("ComponentShowcase").and.callFake(function () {
                this.addComponent = jasmine.createSpy('addComponent');
                this.removeComponent = jasmine.createSpy('removeComponent');
                this.addEventListener = jasmine.createSpy('addEventListener');
                this.clear = jasmine.createSpy('clear');
                this.findComponent = jasmine.createSpy('findComponent').and.callFake((type, id) => {
                    return {
                        _component: {
                            id: id,
                            meta: {
                                type: type
                            },
                            addEventListener: jasmine.createSpy("addEventListener")
                        }
                    };
                });
                this.wrapperElement = document.createElement('div');
                this.searchComponents = {
                    refresh: jasmine.createSpy("refresh")
                };
            });
            se.Utils.inherit(ns.WiringEditor.ComponentShowcase, se.StyledElement);

            ns.WiringEditor.ConnectionEngine = jasmine.createSpy("ConnectionEngine").and.callFake(function () {
                this.setUp = jasmine.createSpy('setUp').and.returnValue(this);
                this.connect = jasmine.createSpy('connect').and.returnValue(this);
                this.appendEndpoint = jasmine.createSpy('appendEndpoint');
                this.removeEndpoint = jasmine.createSpy('removeEndpoint');
                this.forEachConnection = jasmine.createSpy('forEachConnection').and.returnValue(this);
                this.addEventListener = jasmine.createSpy('addEventListener').and.returnValue(this);
            });
        });

        describe("WiringEditor(id[, options])", () => {

            it("should work without providing options", () => {
                let editor = new ns.WiringEditor(1);

                Wirecloud.dispatchEvent('loaded');

                expect(editor.behaviourEngine).toEqual(jasmine.any(ns.WiringEditor.BehaviourEngine));
            });

        });

        describe("getToolbarButtons()", () => {

            it("should return two buttons, one for finding new components and another for managing behaviours", () => {
                let editor = new ns.WiringEditor(1);

                expect(editor.getToolbarButtons()).toEqual([jasmine.any(se.ToggleButton), jasmine.any(se.ToggleButton)]);
            });

            it("btnFindComponents should slideIn the component panel", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');

                spyOn(editor.layout, "slideIn");
                spyOn(editor.layout, "slideOut");
                editor.btnFindComponents.click();

                expect(editor.componentManager.searchComponents.refresh).toHaveBeenCalledWith();
                expect(editor.layout.slideIn).toHaveBeenCalledWith(1);
            });

            it("btnFindComponents should slideOut the component panel when active", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');
                spyOn(editor.layout, "slideIn");
                spyOn(editor.layout, "slideOut");
                // toggle the btnFindComponents button
                editor.btnFindComponents.active = true;

                editor.btnFindComponents.click();

                expect(editor.componentManager.searchComponents.refresh).not.toHaveBeenCalled();
                expect(editor.layout.slideOut).toHaveBeenCalledWith();
            });

            it("btnListBehaviours should slideIn the behaviours panel", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');

                spyOn(editor.layout, "slideIn");
                spyOn(editor.layout, "slideOut");
                editor.btnListBehaviours.click();

                expect(editor.layout.slideIn).toHaveBeenCalledWith(0);
            });

            it("dblclick should slideOut the component panel", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');
                spyOn(editor.layout, "slideOut");

                editor.layout.content.get().dispatchEvent(new MouseEvent("dblclick"));

                expect(editor.layout.slideOut).toHaveBeenCalledWith();
            });

        });

        describe("getTitle()", () => {

            beforeAll(() => {
                Wirecloud.UserInterfaceManager.views = {
                    workspace: {
                        getTitle: jasmine.createSpy('getTitle').and.returnValue('My Workspace')
                    }
                };
            });

            afterAll(() => {
                Wirecloud.UserInterfaceManager.views = null;
            });

            it("should return an string", () => {
                let editor = new ns.WiringEditor(1);

                expect(typeof editor.getTitle()).toBe("string");
                expect(Wirecloud.UserInterfaceManager.views.workspace.getTitle).toHaveBeenCalledWith();
            });

        });

        describe("goUp()", () => {

            it("should go to the workspace view", () => {
                let editor = new ns.WiringEditor(1);
                spyOn(Wirecloud.UserInterfaceManager, "changeCurrentView");

                editor.goUp();
                expect(Wirecloud.UserInterfaceManager.changeCurrentView).toHaveBeenCalledWith("workspace");
            });

        });

        describe("load(workspace)", () => {

            it("should support loading an empty wiring", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = createWorkspaceMock();

                editor.load(workspace);

                expect(editor.componentManager.addComponent.calls.count()).toBe(0);
                expect(editor.connectionEngine.connect.calls.count()).toBe(0);
                expect(editor.behaviourEngine.loadBehaviours.calls.count()).toBe(1);
                expect(editor.behaviourEngine.loadBehaviours).toHaveBeenCalledWith([]);
            });

            it("should support loading a basic wiring (without visualdescription)", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = createWorkspaceMock();
                workspace._addWidget()._addOperator();
                workspace._addConnection();
                editor.load(workspace);

                // No visualdescription for components, but they are loaded as
                // there is a connection
                expect(editor.behaviourEngine.components).toEqual({
                    widget: {"1": jasmine.any(Wirecloud.ui.WiringEditor.ComponentDraggable)},
                    operator: {"1": jasmine.any(Wirecloud.ui.WiringEditor.ComponentDraggable)}
                });

                expect(editor.componentManager.addComponent.calls.count()).toBe(2);
                expect(editor.connectionEngine.connect.calls.count()).toBe(1);
                expect(editor.behaviourEngine.loadBehaviours.calls.count()).toBe(1);
                expect(editor.behaviourEngine.loadBehaviours).toHaveBeenCalledWith([]);
            });

            it("should support loading a basic wiring (with broken visualdescription)", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = createWorkspaceMock();
                workspace._addWidget({visual: true})._addOperator({visual: true});
                workspace._addConnection({visual: true});

                // Add broken connection description
                workspace.wiring.visualdescription.connections.push({
                    sourcehandle: "auto",
                    sourcename: "widget/1/routeDescriptionOutput",
                    targethandle: "auto",
                    targetname: "operator/3/routeInput"
                });

                editor.load(workspace);

                // No visualdescription for components, but they are loaded as
                // there is a valid afecting them
                expect(editor.behaviourEngine.components).toEqual({
                    widget: {"1": jasmine.any(Wirecloud.ui.WiringEditor.ComponentDraggable)},
                    operator: {"1": jasmine.any(Wirecloud.ui.WiringEditor.ComponentDraggable)}
                });

                expect(editor.componentManager.addComponent.calls.count()).toBe(2);
                expect(editor.connectionEngine.connect.calls.count()).toBe(1);
                expect(editor.behaviourEngine.loadBehaviours.calls.count()).toBe(1);
                expect(editor.behaviourEngine.loadBehaviours).toHaveBeenCalledWith([]);
            });

            it("should support loading a wiring configuration with missing components (without visualdescription)", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = createWorkspaceMock();
                workspace._addOperator()._addWidget();
                workspace._addConnection();
                editor.behaviourEngine.components = {
                    widget: {1: {missing: true, getEndpoint: jasmine.createSpy('getEndpoint')}},
                    operator: {1: {getEndpoint: jasmine.createSpy('getEndpoint')}}
                };

                editor.load(workspace);

                expect(editor.componentManager.addComponent.calls.count()).toBe(2);
                expect(editor.connectionEngine.connect.calls.count()).toBe(1);
                expect(editor.behaviourEngine.loadBehaviours.calls.count()).toBe(1);
                expect(editor.behaviourEngine.loadBehaviours).toHaveBeenCalledWith([]);
            });

            it("should support loading a wiring configuration with volatile connections and components", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = createWorkspaceMock();
                workspace._addWidget({visual: true})._addOperator({visual: true});
                workspace._addConnection({visual: true});
                workspace._addWidget({volatile: true})._addOperator({volatile: true});
                workspace._addConnection({
                    volatile: true
                });
                editor.load(workspace);

                // No visualdescription for components, but they are loaded as
                // there is a connection
                expect(editor.behaviourEngine.components).toEqual({
                    widget: {"1": jasmine.any(Wirecloud.ui.WiringEditor.ComponentDraggable)},
                    operator: {"1": jasmine.any(Wirecloud.ui.WiringEditor.ComponentDraggable)}
                });

                expect(editor.componentManager.addComponent.calls.count()).toBe(4);
                expect(editor.connectionEngine.connect.calls.count()).toBe(1);
                expect(editor.behaviourEngine.loadBehaviours.calls.count()).toBe(1);
                expect(editor.behaviourEngine.loadBehaviours).toHaveBeenCalledWith([]);
            });

            it("should handle component updates", () => {
                let editor = new ns.WiringEditor(1);
                let workspace = createWorkspaceMock();
                workspace._addWidget({visual: true});
                Wirecloud.dispatchEvent('loaded');
                editor.load(workspace);

                let component = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];

                callEventListener(component, "change", {title: "new title"});

                expect(editor.behaviourEngine.updateComponent).toHaveBeenCalledWith(component);
            });

            it("should handle optshare events on components", () => {
                let editor = new ns.WiringEditor(1);
                let workspace = createWorkspaceMock();
                workspace._addWidget({visual: true});
                Wirecloud.dispatchEvent('loaded');
                editor.load(workspace);

                let component = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];

                callEventListener(component, "optshare");

                expect(editor.behaviourEngine.updateComponent).toHaveBeenCalledWith(component, true);
            });

            it("should handle optremove events on components", () => {
                let editor = new ns.WiringEditor(1);
                let workspace = createWorkspaceMock();
                workspace._addWidget({visual: true});
                Wirecloud.dispatchEvent('loaded');
                editor.load(workspace);

                let component = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];

                callEventListener(component, "optremove");

                expect(editor.behaviourEngine.removeComponent).toHaveBeenCalledWith(component);
            });

            it("should handle optremovecascade events on components", () => {
                let editor = new ns.WiringEditor(1);
                let workspace = createWorkspaceMock();
                workspace._addWidget({visual: true});
                Wirecloud.dispatchEvent('loaded');
                editor.load(workspace);

                let component = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];

                callEventListener(component, "optremovecascade");

                expect(editor.behaviourEngine.removeComponent).toHaveBeenCalledWith(component, true);
            });

            describe("should handle order events on components", () => {

                var editor, component1, component2;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    workspace._addWidget({visual: true})._addWidget({visual: true})._addOperator();
                    Wirecloud.dispatchEvent('loaded');
                    editor.load(workspace);

                    component1 = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];
                    component2 = editor.behaviourEngine.updateComponent.calls.argsFor(1)[0];

                    spyOn(editor.suggestionManager, "disable");
                    spyOn(editor.suggestionManager, "enable");
                });

                it("should allow to order endpoints on a non-selected component", () => {
                    callEventListener(component1, "orderstart");

                    expect(editor.orderableComponent).toBe(component1);
                    expect(editor.connectionEngine.enabled).toBe(false);
                    expect(editor.suggestionManager.disable).toHaveBeenCalledWith();
                    expect(editor.suggestionManager.enable).not.toHaveBeenCalled();

                    callEventListener(component1, "orderend");

                    expect(editor.orderableComponent).toBe(null);
                    expect(editor.connectionEngine.enabled).toBe(true);
                    expect(editor.suggestionManager.enable).toHaveBeenCalledWith();
                });

                it("should disable ordering mode on any previous enabled component", () => {
                    callEventListener(component1, "orderstart");
                    component1.equals = jasmine.createSpy('equals').and.returnValue(false);

                    callEventListener(component2, "orderstart");

                    expect(component1.setUp).toHaveBeenCalledWith();

                    expect(editor.orderableComponent).toBe(component2);
                    expect(editor.connectionEngine.enabled).toBe(false);
                    expect(editor.suggestionManager.disable).toHaveBeenCalledWith();
                });

                it("should disable endpoint ordering when clicking on the layout (outside any component)", () => {
                    callEventListener(component1, "orderstart");
                    component1.setUp.calls.reset();

                    editor._layout_onclick();

                    // setUp will raise a dragend event but we don't simulate it
                    expect(component1.setUp).toHaveBeenCalledWith();
                    expect(editor.orderableComponent).toBe(null);
                });

                it("should disable endpoint ordering when clicking on a connection (witout using the control or the meta keys)", () => {
                    callEventListener(component1, "orderstart");
                    component1.setUp.calls.reset();

                    callEventListener(editor.connectionEngine, "click", {});

                    // setUp will raise a dragend event but we don't simulate it
                    expect(component1.setUp).toHaveBeenCalledWith();
                    expect(editor.orderableComponent).toBe(null);
                });

            });

            describe("should handle endpoint events on components", () => {

                var editor, widget, operator;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    workspace._addWidget({visual: true})._addOperator({visual: true});
                    Wirecloud.dispatchEvent('loaded');
                    editor.load(workspace);

                    widget = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];
                    operator = editor.behaviourEngine.updateComponent.calls.argsFor(1)[0];
                });

                it("endpointadded", () => {
                    let endpoint = {
                        addEventListener: jasmine.createSpy("addEventListener")
                    };
                    endpoint.addEventListener.and.returnValue(endpoint);
                    spyOn(editor.suggestionManager, "appendEndpoint");

                    callEventListener(widget, "endpointadded", endpoint);
                    callEventListener(operator, "endpointadded", endpoint);

                    expect(endpoint.addEventListener).toHaveBeenCalled();
                    expect(editor.connectionEngine.appendEndpoint).toHaveBeenCalledWith(endpoint);
                    expect(editor.suggestionManager.appendEndpoint).toHaveBeenCalledWith(endpoint);
                });

                it("endpointremoved", () => {
                    let endpoint = {};
                    spyOn(editor.suggestionManager, "removeEndpoint");

                    callEventListener(widget, "endpointremoved", endpoint);
                    callEventListener(operator, "endpointremoved", endpoint);

                    expect(editor.connectionEngine.removeEndpoint).toHaveBeenCalledWith(endpoint);
                    expect(editor.suggestionManager.removeEndpoint).toHaveBeenCalledWith(endpoint);
                });

                it("should freeze endpoint recommendation while editing/creating connections", () => {
                    let endpoint = {
                        addEventListener: jasmine.createSpy("addEventListener")
                    };
                    endpoint.addEventListener.and.returnValue(endpoint);
                    spyOn(editor.suggestionManager, "appendEndpoint");
                    callEventListener(widget, "endpointadded", endpoint);
                    editor.connectionEngine.temporalConnection = {};
                    spyOn(editor.suggestionManager, "showSuggestions");
                    spyOn(editor.suggestionManager, "hideSuggestions");

                    callEventListener(endpoint, "mouseenter");
                    callEventListener(endpoint, "mouseleave");

                    expect(editor.suggestionManager.showSuggestions).not.toHaveBeenCalled();
                    expect(editor.suggestionManager.hideSuggestions).not.toHaveBeenCalled();
                });

                it("should show/hide endpoint suggestions on mouseenter/mouseleave", () => {
                    let endpoint = {
                        addEventListener: jasmine.createSpy("addEventListener")
                    };
                    endpoint.addEventListener.and.returnValue(endpoint);
                    spyOn(editor.suggestionManager, "appendEndpoint");
                    callEventListener(widget, "endpointadded", endpoint);
                    editor.connectionEngine.temporalConnection = null;
                    spyOn(editor.suggestionManager, "showSuggestions");
                    spyOn(editor.suggestionManager, "hideSuggestions");

                    callEventListener(endpoint, "mouseenter");
                    callEventListener(endpoint, "mouseleave");

                    expect(editor.suggestionManager.showSuggestions).toHaveBeenCalledWith(endpoint);
                    expect(editor.suggestionManager.hideSuggestions).toHaveBeenCalledWith(endpoint);
                });

            });

            describe("should handle remove events on components", () => {

                var editor, component1, component2;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    workspace._addWidget({visual: true})._addWidget({visual: true})._addOperator({visual: true});
                    Wirecloud.dispatchEvent('loaded');
                    editor.load(workspace);

                    component1 = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];
                    component2 = editor.behaviourEngine.updateComponent.calls.argsFor(1)[0];
                });

                it("should remove the component from current selection", () => {
                    // Prepare the selection
                    editor.selectedComponents.widget = {1: component1, 2: component2};
                    editor.selectedComponents.operator = {};

                    // Prepare mocks
                    editor.behaviourEngine.hasComponents.and.returnValue(true);
                    spyOn(editor.suggestionManager, "removeEndpoint");
                    component2.forEachEndpoint.calls.reset();
                    component2.forEachEndpoint.and.callFake((listener) => {
                        listener({});
                        listener({});
                    });

                    callEventListener(component2, "remove");

                    expect(editor.connectionEngine.removeEndpoint.calls.count()).toBe(2);
                    expect(editor.suggestionManager.removeEndpoint.calls.count()).toBe(2);
                    expect(component2.forEachEndpoint).toHaveBeenCalled();
                    expect(editor.selectedComponents.widget).toEqual({1: component1});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

                it("should show info message when removing the last component", () => {
                    // Prepare mocks
                    editor.behaviourEngine.hasComponents.and.returnValue(false);

                    spyOn(editor.initialMessage, "show");
                    callEventListener(component2, "remove");

                    expect(editor.initialMessage.show).toHaveBeenCalledWith();
                });

                it("should remove missing components from the component manager", () => {
                    // Prepare mocks
                    editor.behaviourEngine.hasComponents.and.returnValue(true);
                    component2.missing = true;

                    callEventListener(component2, "remove");

                    expect(editor.componentManager.removeComponent).toHaveBeenCalledWith(component2._component);
                });

            });

            describe("should handle behaviour engine events", () => {

                var editor;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    Wirecloud.dispatchEvent('loaded');
                    editor.load(workspace);
                });

                it("should refresh behaviour and connection engine on enable", () => {
                    editor.behaviourEngine.updateComponent = jasmine.createSpy("updateComponent");
                    editor.connectionEngine.forEachConnection.and.callFake((listener) => {
                        let connection = {};
                        listener(connection);
                        expect(connection.removeAllowed).toBe(true);
                        expect(connection.background).toBe(false);
                        expect(editor.behaviourEngine.updateConnection).toHaveBeenCalledWith(connection);
                    });

                    editor.behaviourEngine.forEachComponent.and.callFake((listener) => {
                        let component = {};
                        listener(component);
                        expect(component.removeCascadeAllowed).toBe(true);
                        expect(component.removeAllowed).toBe(true);
                        expect(component.background).toBe(false);
                        expect(editor.behaviourEngine.updateComponent).toHaveBeenCalledWith(component);
                    });

                    callEventListener(editor.behaviourEngine, "enable", true);
                });

                it("should refresh behaviour and connection engine on disable", () => {
                    editor.behaviourEngine.updateComponent = jasmine.createSpy("updateComponent");
                    editor.connectionEngine.forEachConnection.and.callFake((listener) => {
                        let connection = {};
                        listener(connection);
                        expect(connection.removeAllowed).toBe(true);
                        expect(connection.background).toBe(false);
                        expect(editor.behaviourEngine.updateConnection).toHaveBeenCalledWith(connection);
                    });

                    editor.behaviourEngine.forEachComponent.and.callFake((listener) => {
                        let component = {};
                        listener(component);
                        expect(component.removeCascadeAllowed).toBe(false);
                        expect(component.removeAllowed).toBe(true);
                        expect(component.background).toBe(false);
                        expect(editor.behaviourEngine.updateComponent).toHaveBeenCalledWith(component);
                    });

                    callEventListener(editor.behaviourEngine, "enable", false);
                });

                it("should refresh editor footer on updates (engine disabled)", () => {
                    let currentstatus = {
                        title: "",
                        connections: 5,
                        components: {
                            operator: 3,
                            widget: 1
                        }
                    };
                    callEventListener(editor.behaviourEngine, "change", currentstatus, false);
                });

                it("should refresh editor footer on updates (engine enabled)", () => {
                    let currentstatus = {
                        title: "My Behaviour",
                        connections: 5,
                        components: {
                            operator: 3,
                            widget: 1
                        }
                    };
                    callEventListener(editor.behaviourEngine, "change", currentstatus, true);
                });

                it("should refresh the view when changing the active behaviour", () => {
                    let currentstatus = {
                        title: "My Behaviour",
                        connections: 5,
                        components: {
                            operator: 3,
                            widget: 1
                        }
                    };
                    let behaviour = {
                        hasComponent: jasmine.createSpy("hasComponent"),
                        hasConnection: jasmine.createSpy("hasConnection"),
                        getCurrentStatus: jasmine.createSpy("getCurrentStatus").and.returnValue(currentstatus)
                    };
                    editor.connectionEngine.forEachConnection.and.callFake((listener) => {
                        let connection1 = {
                            show: jasmine.createSpy("show")
                        };
                        editor.behaviourEngine.filterByConnection.and.returnValue([1]);
                        behaviour.hasConnection.and.returnValue(true);
                        connection1.show.and.returnValue(connection1);

                        listener(connection1);

                        expect(connection1.removeAllowed).toBe(true);
                        expect(connection1.background).toBe(false);

                        let connection2 = {
                            show: jasmine.createSpy("show")
                        };
                        editor.behaviourEngine.filterByConnection.and.returnValue([1, 2]);
                        behaviour.hasConnection.and.returnValue(false);
                        connection2.show.and.returnValue(connection2);

                        listener(connection2);

                        expect(connection2.removeAllowed).toBe(false);
                        expect(connection2.background).toBe(true);
                    });

                    editor.behaviourEngine.forEachComponent.and.callFake((listener) => {
                        editor.behaviourEngine.filterByComponent.and.returnValue([1]);
                        behaviour.hasComponent.and.returnValue(true);
                        let component1 = {};
                        listener(component1);
                        expect(component1.removeCascadeAllowed).toBe(true);
                        expect(component1.removeAllowed).toBe(true);
                        expect(component1.background).toBe(false);

                        editor.behaviourEngine.filterByComponent.and.returnValue([1, 2]);
                        behaviour.hasComponent.and.returnValue(false);
                        let component2 = {};
                        listener(component2);
                        expect(component2.removeCascadeAllowed).toBe(true);
                        expect(component2.removeAllowed).toBe(false);
                        expect(component2.background).toBe(true);
                    });

                    callEventListener(editor.behaviourEngine, "activate", behaviour, 0);
                });

            });

            describe("should handle click events on components", () => {

                var editor, component1, component2, component3;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    workspace._addWidget({visual: true})._addWidget({visual: true})._addOperator({visual: true});
                    Wirecloud.dispatchEvent('loaded');
                    editor.load(workspace);

                    component1 = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];
                    component2 = editor.behaviourEngine.updateComponent.calls.argsFor(1)[0];
                    component3 = editor.behaviourEngine.updateComponent.calls.argsFor(2)[0];
                });

                it("should select components", () => {
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    expect(editor.selectedComponents.widget).toEqual({1: component1});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

                it("should deselect previous components", () => {
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    component2.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component2, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component2, "click", {ctrlKey: false, metaKey: false});
                    expect(editor.selectedComponents.widget).toEqual({2: component2});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

                it("should cancel any endpoint ordering operation", () => {
                    editor.orderableComponent = component2;

                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});

                    expect(editor.orderableComponent).toBe(null);
                    expect(component2.setUp).toHaveBeenCalledWith();
                    expect(editor.selectedComponents.widget).toEqual({1: component1});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

                it("should clear selection when clicking on the selected component", () => {
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    component1.active = false; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    expect(editor.selectedComponents.widget).toEqual({});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

                it("should append components to the selection when using the control key", () => {
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    component2.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component2, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component2, "click", {ctrlKey: true, metaKey: false});
                    expect(editor.selectedComponents.widget).toEqual({1: component1, 2: component2});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

                it("should append components to the selection when using the meta key", () => {
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    component2.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component2, "dragstart", {ctrlKey: false, metaKey: true});
                    callEventListener(component2, "click", {ctrlKey: false, metaKey: true});
                    expect(editor.selectedComponents.widget).toEqual({1: component1, 2: component2});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

                it("should remove components from the selection when using the control key and clicking on a selected component", () => {
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    component2.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component2, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component2, "click", {ctrlKey: true, metaKey: false});
                    component2.active = false; // Simulate ComponentDraggable behaviour
                    callEventListener(component2, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component2, "click", {ctrlKey: true, metaKey: false});
                    expect(editor.selectedComponents.widget).toEqual({1: component1});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

                it("should remove components from current selection when using the control key and clicking a selected compoent", () => {
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    component1.active = false; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: true, metaKey: false});
                    expect(editor.selectedComponents.widget).toEqual({});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

                it("should clear previous selection when clicking another components without using the control key nor the meta one", () => {
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    component2.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component2, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component2, "click", {ctrlKey: true, metaKey: false});
                    component3.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component3, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component3, "click", {ctrlKey: true, metaKey: false});
                    component3.active = false; // Simulate ComponentDraggable behaviour
                    callEventListener(component3, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component3, "click", {ctrlKey: false, metaKey: false});
                    expect(editor.selectedComponents.widget).toEqual({});
                    expect(editor.selectedComponents.operator).toEqual({1: component3});
                });

                it("should clear current selection when clicking on the layout (outside any component)", () => {
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    component2.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component2, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component2, "click", {ctrlKey: true, metaKey: false});
                    component3.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component3, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component3, "click", {ctrlKey: true, metaKey: false});

                    editor._layout_onclick();

                    expect(editor.selectedComponents.widget).toEqual({});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

                it("should clear current selection when clicking on a connection (without using the control or the meta keys)", () => {
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    component2.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component2, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component2, "click", {ctrlKey: true, metaKey: false});
                    component3.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component3, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component3, "click", {ctrlKey: true, metaKey: false});

                    callEventListener(editor.connectionEngine, "click", {});

                    expect(editor.selectedComponents.widget).toEqual({});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

            });

            describe("should handle drag events on connections", () => {

                var editor;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    workspace._addWidget({visual: true})._addWidget({visual: true})._addOperator({visual: true});
                    Wirecloud.dispatchEvent('loaded');
                    editor.load(workspace);
                });

                it("should temporally expand collapsed components", () => {
                    let component1 = {type: "widget", id: "1", collapsed: false, _component: "widget1"};
                    let component2 = {type: "operator", id: "2", collapsed: true, _component: "operator1"};
                    let initialEndpoint = {};
                    let realEndpoint = {};
                    spyOn(editor.suggestionManager, "hideSuggestions");
                    editor.behaviourEngine.forEachComponent.and.callFake((listener) => {
                        listener(component1);
                        listener(component2);
                    });

                    callEventListener(editor.connectionEngine, "dragstart", {}, initialEndpoint, realEndpoint);

                    expect(component1.collapsed).toBe(false);
                    expect(component2.collapsed).toBe(false);

                    callEventListener(editor.connectionEngine, "dragend", {}, initialEndpoint, realEndpoint);

                    expect(editor.suggestionManager.hideSuggestions).toHaveBeenCalledWith(initialEndpoint);
                    expect(component1.collapsed).toBe(false);
                    expect(component2.collapsed).toBe(true);
                });

                it("should work when editing a connection", () => {
                    let component1 = {type: "widget", id: "1", collapsed: false, _component: "widget1"};
                    let component2 = {type: "operator", id: "2", collapsed: false, _component: "operator1"};
                    let initialEndpoint = {};
                    let realEndpoint = {};
                    spyOn(editor.suggestionManager, "hideSuggestions");
                    spyOn(editor.suggestionManager, "showSuggestions");
                    editor.behaviourEngine.forEachComponent.and.callFake((listener) => {
                        listener(component1);
                        listener(component2);
                    });
                    // TODO currently, the connection engine stores a
                    // connection backup when editing a connectionEngine
                    editor.connectionEngine._connectionBackup = {};

                    callEventListener(editor.connectionEngine, "dragstart", {}, initialEndpoint, realEndpoint);

                    expect(editor.suggestionManager.hideSuggestions).toHaveBeenCalledWith(realEndpoint);
                    expect(editor.suggestionManager.showSuggestions).toHaveBeenCalledWith(initialEndpoint);

                    callEventListener(editor.connectionEngine, "dragend", {}, initialEndpoint, realEndpoint);

                    expect(editor.suggestionManager.hideSuggestions).toHaveBeenCalledWith(initialEndpoint);
                });

            });

            describe("should handle drag events on components", () => {

                var editor, component1, component2, component3;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    workspace._addWidget({visual: true})._addWidget({visual: true})._addOperator({visual: true});
                    Wirecloud.dispatchEvent('loaded');
                    editor.load(workspace);

                    component1 = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];
                    component2 = editor.behaviourEngine.updateComponent.calls.argsFor(1)[0];
                    component3 = editor.behaviourEngine.updateComponent.calls.argsFor(2)[0];
                });

                it("should drag single components", () => {
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "drag", 10, 10);

                    expect(editor.selectedComponents.widget).toEqual({});
                    expect(editor.selectedComponents.operator).toEqual({});

                    callEventListener(component1, "dragend", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});

                    expect(editor.selectedComponents.widget).toEqual({1: component1});
                    expect(editor.selectedComponents.operator).toEqual({});
                });

                it("should drag selection + adding new component to selection", () => {
                    spyOn(component1, "dispatchEvent");
                    spyOn(component2, "dispatchEvent");
                    spyOn(component3, "dispatchEvent");

                    component1.position.and.returnValue({x: 0, y: 0});
                    component1.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component1, "dragstart", {ctrlKey: false, metaKey: false});
                    callEventListener(component1, "click", {ctrlKey: false, metaKey: false});
                    component2.position.and.returnValue({x: 10, y: 0});
                    component2.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component2, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component2, "click", {ctrlKey: true, metaKey: false});
                    component3.position.and.returnValue({x: 15, y: 10});
                    component3.active = true; // Simulate ComponentDraggable behaviour
                    callEventListener(component3, "dragstart", {ctrlKey: true, metaKey: false});
                    callEventListener(component3, "drag", 10, 10);

                    expect(editor.selectedComponents.widget).toEqual({1: component1, 2: component2});
                    expect(editor.selectedComponents.operator).toEqual({1: component3});

                    callEventListener(component3, "dragend", {ctrlKey: false, metaKey: false});
                    callEventListener(component3, "click", {ctrlKey: false, metaKey: false});

                    expect(component1.dispatchEvent).toHaveBeenCalledWith('change', {position: jasmine.any(Object)});
                    expect(component2.dispatchEvent).toHaveBeenCalledWith('change', {position: jasmine.any(Object)});
                    expect(component3.dispatchEvent).not.toHaveBeenCalled();
                    expect(editor.selectedComponents.widget).toEqual({1: component1, 2: component2});
                    expect(editor.selectedComponents.operator).toEqual({1: component3});
                });

            });

            describe("should handle keydown events", () => {

                var editor, component1, component2, handler;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    workspace._addWidget({visual: true})._addWidget({visual: true})._addOperator();
                    Wirecloud.dispatchEvent('loaded');
                    editor.load(workspace);
                    handler = Wirecloud.UserInterfaceManager.rootKeydownHandler;

                    component1 = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];
                    component1.type = "widget";
                    component1.id = "1";
                    component1.active = false;
                    component1.isRemovable = () => {return false;}

                    component2 = editor.behaviourEngine.updateComponent.calls.argsFor(1)[0];
                    component2.type = "widget";
                    component2.id = "2";
                    component2.active = false;
                    component2.isRemovable = () => {return true;}
                });

                it("should do nothing for normal keys", () => {
                    handler('A', {});
                });

                it("should do nothing when using the backspace key and there is not selection", () => {
                    handler('Backspace', {});
                });

                it("should remove current selection when using the backspace key", () => {
                    editor.selectedComponents.widget = {1: component1, 2: component2};
                    handler('Backspace', {});
                    expect(editor.selectedComponents.widget).toEqual({});
                });

                it("should do nothing when using the backspace key and there is removable componets selected", () => {
                    editor.selectedComponents.widget = {1: component1};
                    handler('Backspace', {});
                });

            });

        });

        describe("buildStateData()", () => {

            it("should use current state as base", () => {
                spyOn(Wirecloud.HistoryManager, "getCurrentState").and.returnValue({
                    "workspace_owner": "workspace_owner",
                    "workspace_name": "workspace_name",
                    "view": "workspace"
                });
                let editor = new ns.WiringEditor(1);

                let state = editor.buildStateData();

                expect(state).toEqual({
                    "workspace_owner": "workspace_owner",
                    "workspace_name": "workspace_name",
                    "view": "wiring"
                });
                expect(Wirecloud.HistoryManager.getCurrentState).toHaveBeenCalledWith();
            });

        });

        describe("getBreadcrumb()", () => {

            beforeAll(() => {
                Wirecloud.UserInterfaceManager.views = {
                    workspace: {
                        getBreadcrumb: jasmine.createSpy('getTitle').and.returnValue([
                            {label: "workspace_owner"},
                            {label: "workspace_name"}
                        ])
                    }
                };
            });

            afterAll(() => {
                Wirecloud.UserInterfaceManager.views = null;
            });

            it("should use current state as base", () => {
                let editor = new ns.WiringEditor(1);

                let breadcrum = editor.getBreadcrumb();

                expect(breadcrum).toEqual(jasmine.any(Array));
            });

        });

        describe("toJSON()", () => {

            it("should support serializing an empty wiring", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = createWorkspaceMock();
                editor.load(workspace);

                expect(editor.toJSON()).toEqual({
                    version: '2.0',
                    connections: [],
                    operators: {},
                    // Behaviour Engine serialization is tested in the
                    // BehaviourEngine unit tests, this is the JSON structure
                    // returned by the mock
                    visualdescription: {"BehaviourEngine": "toJSON"}
                });
                expect(editor.behaviourEngine.toJSON).toHaveBeenCalledWith();
            });

            it("should support serializing a wiring configuration with connections and components", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = createWorkspaceMock();
                editor.load(workspace);
                editor.connectionEngine.forEachConnection.and.callFake((listener) => {
                    listener({_connection: "connection1"});
                    listener({_connection: "connection2"});
                });
                editor.behaviourEngine.forEachComponent.and.callFake((listener) => {
                    listener({type: "widget", id: "1", _component: "widget1"});
                    listener({type: "operator", id: "2", _component: "operator1"});
                });

                expect(editor.toJSON()).toEqual({
                    version: '2.0',
                    connections: ["connection1", "connection2"],
                    operators: {"2": "operator1"},
                    // Behaviour Engine serialization is tested in the
                    // BehaviourEngine unit tests, this is the JSON structure
                    // returned by the mock
                    visualdescription: {"BehaviourEngine": "toJSON"}
                });
                expect(editor.behaviourEngine.toJSON).toHaveBeenCalledWith();
            });

        });

        describe("unload()", () => {

            it("should support serializing an empty wiring", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');
                let workspace = createWorkspaceMock();
                editor.load(workspace);
                editor.behaviourEngine.clear.calls.reset();
                editor.behaviourEngine.disable.calls.reset();
                editor.componentManager.clear.calls.reset();
                spyOn(editor.suggestionManager, "enable");
                spyOn(editor, "toJSON").and.returnValue({"new": "wiring status"});

                editor.unload();

                expect(editor.behaviourEngine.clear).toHaveBeenCalledWith();
                expect(editor.behaviourEngine.disable).toHaveBeenCalledWith();
                expect(editor.componentManager.clear).toHaveBeenCalledWith();
                expect(editor.suggestionManager.enable).toHaveBeenCalledWith();
                expect(editor.orderableComponent).toBe(null);
                expect(workspace.wiring.load).toHaveBeenCalledWith({"new": "wiring status"});

                // TODO
                expect(Wirecloud.UserInterfaceManager.rootKeydownHandler).toBe(null);
            });

        });

    });

})(Wirecloud.ui, StyledElements);
