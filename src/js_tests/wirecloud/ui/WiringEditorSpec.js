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
                    value: function () {
                        let operator = {
                            id: "" + (this.wiring.operators.length + 1),
                            meta: {
                                type: "operator"
                            },
                            getEndpoint: jasmine.createSpy("getEndpoint")
                        };
                        this.wiring.operators.push(operator);
                        this.wiring.visualdescription.components.operator[operator.id] = {name: "Wirecloud/TestOperator/1.0"};
                        return this;
                    }
                },
                _addWidget: {
                    value: function (visual) {
                        let widget = {
                            id: "" + (this.widgets.length + 1),
                            meta: {
                                type: "widget"
                            },
                            getEndpoint: jasmine.createSpy("getEndpoint")
                        };
                        this.widgets.push(widget);
                        if (visual != null) {
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
                    value: function (A, B) {
                        let connection = {
                            volatile: false,
                            source: {
                                name: "output1",
                                component: {
                                    id: "1",
                                    meta: {
                                        type: "widget"
                                    }
                                }
                            },
                            target: {
                                name: "input1",
                                component: {
                                    id: "1",
                                    meta: {
                                        type: "operator"
                                    }
                                }
                            }
                        };
                        this.wiring.connections.push(connection);
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
                this.updateComponent = jasmine.createSpy('updateComponent').and.returnValue(this);
                this.removeComponentList = jasmine.createSpy('removeComponentList').and.returnValue(this);
                this.forEachComponent = jasmine.createSpy('forEachComponent').and.returnValue(this);
                this.clear = jasmine.createSpy('clear').and.returnValue(this);
                this.disable = jasmine.createSpy('disable').and.returnValue(this);
                this.toJSON = jasmine.createSpy('toJSON').and.returnValue({"BehaviourEngine": "toJSON"});
                this.wrapperElement = document.createElement('div');
            });
            se.Utils.inherit(ns.WiringEditor.BehaviourEngine, se.StyledElement);

            ns.WiringEditor.ComponentDraggable = jasmine.createSpy("ComponentDraggable").and.callFake(function () {
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
                this.addEventListener = jasmine.createSpy('addEventListener');
                this.clear = jasmine.createSpy('clear');
                this.findComponent = jasmine.createSpy('findComponent').and.callFake(() => {
                    return {
                        _component: {
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

            it("btnListBehaviours should slideIn the behaviours panel", () => {
                let editor = new ns.WiringEditor(1);
                Wirecloud.dispatchEvent('loaded');

                spyOn(editor.layout, "slideIn");
                spyOn(editor.layout, "slideOut");
                editor.btnListBehaviours.click();

                expect(editor.layout.slideIn).toHaveBeenCalledWith(0);
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
                workspace._addConnection("1", "1");
                // No visualdescription => no components on the behaviourEngine
                editor.behaviourEngine.components = {
                    widget: {},
                    operator: {}
                };

                editor.load(workspace);

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
                workspace._addConnection("1", "1");
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

            describe("should handle order events on components", () => {

                var editor, component1, component2, component3;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    workspace._addWidget(true)._addWidget(true)._addOperator();
                    Wirecloud.dispatchEvent('loaded');
                    editor.load(workspace);

                    component1 = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];
                    component1.type = "widget";
                    component1.id = "1";
                    component1.active = false;

                    component2 = editor.behaviourEngine.updateComponent.calls.argsFor(1)[0];
                    component2.type = "widget";
                    component2.id = "2";
                    component2.active = false;

                    component3 = editor.behaviourEngine.updateComponent.calls.argsFor(2)[0];
                    component3.type = "operator";
                    component3.id = "3";
                    component3.active = false;

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

            });

            describe("should handle click events on components", () => {

                var editor, component1, component2, component3;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    workspace._addWidget(true)._addWidget(true)._addOperator();
                    Wirecloud.dispatchEvent('loaded');
                    editor.load(workspace);

                    component1 = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];
                    component1.type = "widget";
                    component1.id = "1";
                    component1.active = false;

                    component2 = editor.behaviourEngine.updateComponent.calls.argsFor(1)[0];
                    component2.type = "widget";
                    component2.id = "2";
                    component2.active = false;

                    component3 = editor.behaviourEngine.updateComponent.calls.argsFor(2)[0];
                    component3.type = "operator";
                    component3.id = "3";
                    component3.active = false;
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
                    expect(editor.selectedComponents.operator).toEqual({3: component3});
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

            });

            describe("should handle drag events on components", () => {

                var editor, component1, component2, component3;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    workspace._addWidget(true)._addWidget(true)._addOperator();
                    Wirecloud.dispatchEvent('loaded');
                    editor.load(workspace);

                    component1 = editor.behaviourEngine.updateComponent.calls.argsFor(0)[0];
                    component1.type = "widget";
                    component1.id = "1";
                    component1.active = false;

                    component2 = editor.behaviourEngine.updateComponent.calls.argsFor(1)[0];
                    component2.type = "widget";
                    component2.id = "2";
                    component2.active = false;

                    component3 = editor.behaviourEngine.updateComponent.calls.argsFor(2)[0];
                    component3.type = "operator";
                    component3.id = "3";
                    component3.active = false;
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
                    expect(editor.selectedComponents.operator).toEqual({3: component3});

                    callEventListener(component3, "dragend", {ctrlKey: false, metaKey: false});
                    callEventListener(component3, "click", {ctrlKey: false, metaKey: false});

                    expect(component1.dispatchEvent).toHaveBeenCalledWith('change', {position: jasmine.any(Object)});
                    expect(component2.dispatchEvent).toHaveBeenCalledWith('change', {position: jasmine.any(Object)});
                    expect(component3.dispatchEvent).not.toHaveBeenCalled();
                    expect(editor.selectedComponents.widget).toEqual({1: component1, 2: component2});
                    expect(editor.selectedComponents.operator).toEqual({3: component3});
                });

            });

            describe("should handle keydown events", () => {

                var editor, component1, component2, handler;

                beforeEach(() => {
                    editor = new ns.WiringEditor(1);
                    let workspace = createWorkspaceMock();
                    workspace._addWidget(true)._addWidget(true)._addOperator();
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
