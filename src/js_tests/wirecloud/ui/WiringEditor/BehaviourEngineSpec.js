/*
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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

    describe("BehaviourEngine", () => {

        beforeAll(() => {
            spyOn(ns, "Behaviour").and.callFake(function (index) {
                this.index = index;
                this.addEventListener = jasmine.createSpy("addEventListener").and.returnValue(this);
                this.clear = jasmine.createSpy("clear").and.returnValue(this);
                this.equals = jasmine.createSpy("equals").and.callFake((other) => {return this === other;});
                this.hasComponent = jasmine.createSpy("hasComponent").and.returnValue(false);
                this.hasConnection = jasmine.createSpy("hasComponent").and.returnValue(false);
                this.removeConnection = jasmine.createSpy("removeConnection").and.returnValue(false);
                this.updateComponent = jasmine.createSpy("updateComponent").and.returnValue(this);
                this.removeComponent = jasmine.createSpy("removeComponent").and.returnValue(false);
                this.updateConnection = jasmine.createSpy("updateConnection").and.returnValue(this);
                this.btnPrefs = new se.Button();
                this.btnRemove = new se.Button();
                this.active = false;
                this.logManager = {
                    log: jasmine.createSpy("log")
                };
                this.wrapperElement = document.createElement('div');
            });
            se.Utils.inherit(ns.Behaviour, se.StyledElement);
        });

        describe("new BehaviourEngine()", () => {

            it("it is an styledelement", () => {
                let engine = new ns.BehaviourEngine();

                expect(engine.enabled).toBe(false);
                expect(engine).toEqual(jasmine.any(se.StyledElement));
            });

        });

        describe("activate()", () => {

            it("should do nothing if the engine is disabled", () => {
                let engine = new ns.BehaviourEngine();

                expect(engine.activate()).toBe(engine);
            });

        });

        describe("btnCreate", () => {

            it("should allow to create behaviours", () => {
                let engine = new ns.BehaviourEngine();
                engine.enable = true;
                let dialog;
                spyOn(Wirecloud.ui, "FormWindowMenu").and.callFake(function () {
                    dialog = this;
                    this.show = jasmine.createSpy("show").and.returnValue(this);
                });

                engine.btnCreate.click();

                dialog.executeOperation();
                expect(engine.behaviours.length).toBe(1);
                expect(engine.behaviour).toBe(engine.behaviours[0]);
            });

        });

        describe("btnEnable", () => {

            it("should allow to enable the behaviour engine", () => {
                let engine = new ns.BehaviourEngine();

                engine.btnEnable.click();

                expect(engine.enabled).toBe(true);
                expect(engine.behaviours.length).toBe(1);
                expect(engine.behaviour).toBe(engine.behaviours[0]);
            });

            it("should allow to disable the behaviour engine", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                var alert_handler;
                spyOn(Wirecloud.ui, "AlertWindowMenu").and.callFake(function () {
                    this.setHandler = jasmine.createSpy("setHandler").and.callFake((listener) => {
                        alert_handler = listener;
                        return this;
                    });
                    this.show = jasmine.createSpy("show").and.returnValue(this);
                });

                engine.btnEnable.click();

                expect(Wirecloud.ui.AlertWindowMenu).toHaveBeenCalled();
                alert_handler();

                expect(engine.enabled).toBe(false);
                expect(engine.behaviours.length).toBe(0);
            });

        });

        describe("btnOrder", () => {

            it("should allow to start and stop ordering without changing nothing", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let behaviour1 = engine.behaviours[0];
                let behaviour2 = engine.behaviours[1];

                // Start ordering
                engine.btnOrder.enable().click()
                // Stop ordering
                engine.btnOrder.click();

                expect(behaviour1.index).toBe(0);
                expect(behaviour1.btnPrefs.enabled).toBe(true);
                expect(behaviour1.btnRemove.enabled).toBe(true);
                expect(behaviour2.index).toBe(1);
                expect(behaviour2.btnPrefs.enabled).toBe(true);
                expect(behaviour2.btnRemove.enabled).toBe(true);
            });

            it("should allow to order behaviours", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}, {}, {}]);
                let behaviour1 = engine.behaviours[0];
                let behaviour2 = engine.behaviours[1];
                let behaviour3 = engine.behaviours[2];
                let behaviour4 = engine.behaviours[3];
                var dragstartlisteners = [];
                var draglisteners = [];
                var dragendlisteners = [];
                var contexts = [];
                spyOn(Wirecloud.ui, "Draggable").and.callFake(function (handler, context, dragstart, drag, dragend) {
                    contexts.push(context);
                    dragstartlisteners.push(dragstart);
                    draglisteners.push(drag);
                    dragendlisteners.push(dragend);

                    this.destroy = jasmine.createSpy("destroy");
                });
                spyOn(engine.body.get(), "getBoundingClientRect").and.returnValue({top: 0, height: 240});
                spyOn(behaviour1, "getBoundingClientRect").and.returnValue({height: 80});
                spyOn(behaviour2, "getBoundingClientRect").and.returnValue({height: 80});
                spyOn(behaviour4, "getBoundingClientRect").and.returnValue({height: 80});
                spyOn(behaviour4, "get").and.returnValue({
                    classList: {
                        contains: jasmine.createSpy("contains").and.returnValue(true),
                        add: jasmine.createSpy("add"),
                        remove: jasmine.createSpy("remove")
                    },
                    cloneNode: jasmine.createSpy("cloneNode").and.returnValue(document.createElement("div")),
                    offsetTop: 240
                });

                // Start ordering
                engine.btnOrder.enable().click()

                // start dragging behaviour1
                dragstartlisteners[0](behaviour1.draggable, contexts[0], {clientY: 10});
                expect(behaviour1.hasClassName("temporal")).toBe(true);

                // end dragging behaviour1
                dragendlisteners[0](behaviour1.draggable, contexts[0]);
                expect(behaviour1.hasClassName("temporal")).toBe(false);

                // start dragging behaviour4
                dragstartlisteners[3](behaviour4.draggable, contexts[3], {clientY: 320});

                // end dragging behaviour4
                dragendlisteners[3](behaviour1.draggable, contexts[3]);

                // start dragging behaviour2
                dragstartlisteners[1](behaviour2.draggable, contexts[1], {clientY: 120});
                expect(behaviour2.hasClassName("temporal")).toBe(true);

                // drag behaviour2 (no move)
                draglisteners[1]({}, behaviour2.draggable, contexts[1], 0, 0);

                // drag behaviour2 (move down rebasing limits)
                draglisteners[1]({}, behaviour2.draggable, contexts[1], 0, 240);

                // drag behaviour2 (move up)
                draglisteners[1]({}, behaviour2.draggable, contexts[1], 0, -80);

                // drag behaviour2 (no move due going outside the limits)
                draglisteners[1]({}, behaviour2.draggable, contexts[1], 0, -100);

                // end dragging behaviour2
                dragendlisteners[1](behaviour2.draggable, contexts[1]);
                expect(behaviour2.hasClassName("temporal")).toBe(false);

                // Stop ordering
                engine.btnOrder.enable().click()
                expect(engine.behaviours).toEqual([behaviour2, behaviour1, behaviour3, behaviour4]);
            });

        });

        describe("clear()", () => {

            it("should work with an empty status", () => {
                let engine = new ns.BehaviourEngine();

                expect(engine.clear()).toBe(engine);
            });

            it("should remove all the components and the connections (engine disabled)", () => {
                let engine = new ns.BehaviourEngine();
                let component1 = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                engine.updateComponent(component1);
                let component2 = createComponentMock({
                    id: "1",
                    type: "operator"
                });
                engine.updateComponent(component2);

                expect(engine.clear()).toBe(engine);

                expect(engine.hasComponent(component1)).toBe(false);
                expect(engine.hasComponent(component2)).toBe(false);
                expect(engine.hasComponents()).toBe(false);
            });

            it("should remove all the behaviours (engine enabled)", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let behaviour1 = engine.behaviours[0];
                let behaviour2 = engine.behaviours[1];
                spyOn(engine, "removeBehaviour");

                expect(engine.clear()).toBe(engine);

                expect(engine.removeBehaviour).toHaveBeenCalledWith(behaviour1);
                expect(engine.removeBehaviour).toHaveBeenCalledWith(behaviour2);
                expect(engine.behaviours).toEqual([]);
                expect(engine.behaviour).toEqual(null);
            });

        });

        describe("createBehaviour(details)", () => {

            it("should allow to create behaviours without info", () => {
                let engine = new ns.BehaviourEngine();
                engine.createBehaviour();
            });

            it("should handle change events on active behaviours", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let behaviour1 = engine.behaviours[0];
                behaviour1.getCurrentStatus = jasmine.createSpy("getCurrentStatus").and.returnValue("currentstatus");
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);

                callEventListener(behaviour1, "change");

                expect(listener).toHaveBeenCalledWith(engine, "currentstatus", true);
            });

            it("should handle change events on inactive behaviours", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let behaviour2 = engine.behaviours[1];
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);

                callEventListener(behaviour2, "change");

                expect(listener).not.toHaveBeenCalled();
            });

            it("should handle click events on behaviours", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let behaviour2 = engine.behaviours[1];
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("activate", listener);

                callEventListener(behaviour2, "click");

                expect(listener).toHaveBeenCalledWith(engine, behaviour2, ns.BehaviourEngine.GLOBAL);
            });

            it("should ignore click events on behaviours when ordering them", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let behaviour2 = engine.behaviours[1];
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("activate", listener);
                // Start ordering
                engine.btnOrder.enable().click()

                callEventListener(behaviour2, "click");

                expect(listener).not.toHaveBeenCalled();
            });

            it("should handle remove events on behaviours", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let behaviour2 = engine.behaviours[1];
                spyOn(engine, "removeBehaviour");

                callEventListener(behaviour2, "optremove");

                expect(engine.removeBehaviour).toHaveBeenCalledWith(behaviour2);
            });

        });

        describe("disabledAlert", () => {

            it("provides a link for starting the behaviour engine tutorial", () => {
                let engine = new ns.BehaviourEngine();
                // TODO
                Wirecloud.TutorialCatalogue = {
                    get: jasmine.createSpy('get').and.returnValue({
                        start: jasmine.createSpy('start')
                    })
                };

                engine.disabledAlert.body.wrapperElement.querySelector('blockquote a').click();

                expect(Wirecloud.TutorialCatalogue.get).toHaveBeenCalledWith('mashup-wiring-design')
            });

        });

        describe("emptyBehaviour(behaviour)", () => {

            it("does nothing if the engine is disabled", () => {
                let engine = new ns.BehaviourEngine();
                engine.emptyBehaviour({});
            });

            it("removes components from the behaviour", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let component1 = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                engine.updateComponent(component1);
                let component2 = createComponentMock({
                    id: "2",
                    type: "widget"
                });
                engine.updateComponent(component2);
                let behaviour1 = engine.behaviours[0];
                behaviour1.hasComponent.and.returnValues(true, false);
                spyOn(engine, "forEachComponent").and.callFake((listener) => {
                    listener(component1);
                    listener(component2);
                });

                engine.emptyBehaviour(engine.behaviour);
            });

        });

        describe("getConnectionIndex(connection)", () => {

            it("should return -1 if the connection is not present", () => {
                let engine = new ns.BehaviourEngine();
                let connection1 = createConnectionMock({
                    sourceId: "sourcename",
                    targetId: "targetname"
                });
                engine.updateConnection(connection1);
                let connection2 = createConnectionMock({
                    sourceId: "othersourcename",
                    targetId: "targetname"
                });

                expect(engine.getConnectionIndex(connection2)).toBe(-1);
            });

            it("should return connection index if the connection is present", () => {
                let engine = new ns.BehaviourEngine();
                let connection1 = createConnectionMock({
                    sourceId: "sourcename",
                    targetId: "targetname"
                });
                engine.updateConnection(connection1);
                let connection2 = createConnectionMock({
                    sourceId: "othersourcename",
                    targetId: "targetname"
                });
                engine.updateConnection(connection2);

                expect(engine.getConnectionIndex(connection2)).toBe(1);
            });

        });

        describe("hasComponent(component)", () => {

            it("should return false if the component is not available (engine disabled)", () => {
                let engine = new ns.BehaviourEngine();

                expect(engine.hasComponent({id: "1", type: "widget"})).toBe(false);
            });

            it("should return true if the component is available (engine disabled)", () => {
                let engine = new ns.BehaviourEngine();
                let component = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                engine.updateComponent(component);

                expect(engine.hasComponent({id: "1", type: "widget"})).toBe(true);
            });

            it("should return false if the component is not available (engine enabled)", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);

                expect(engine.hasComponent({id: "1", type: "operator"})).toBe(false);
            });

            it("should return true if the component is available (engine enabled)", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}, {}]);
                let component = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                engine.updateComponent(component);
                engine.behaviours[2].hasComponent.and.returnValue(true);

                expect(engine.hasComponent({id: "1", type: "widget"})).toBe(true);
            });

        });

        describe("hasComponents()", () => {

            it("should return false if there are no components", () => {
                let engine = new ns.BehaviourEngine();

                expect(engine.hasComponents()).toBe(false);
            });

        });

        describe("loadBehaviours(behaviours)", () => {

            it("should work when passing an empty list", () => {
                let engine = new ns.BehaviourEngine();
                const listener = jasmine.createSpy("listener");
                engine.addEventListener("activate", listener);

                expect(engine.loadBehaviours([])).toBe(engine);

                expect(engine.enabled).toBe(false);
                expect(listener).not.toHaveBeenCalled();
            });

            it("should work when passing a list of behaviours", () => {
                let engine = new ns.BehaviourEngine();
                const listener = jasmine.createSpy("listener");
                engine.addEventListener("activate", listener);

                expect(engine.loadBehaviours([{}])).toBe(engine);

                expect(engine.enabled).toBe(true);
                expect(listener).toHaveBeenCalled();
            });

        });

        describe("removeBehaviour(behaviour)", () => {

            it("should do nothing if the engine is disabled", () => {
                let engine = new ns.BehaviourEngine();
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("activate", listener);

                expect(engine.removeBehaviour({})).toBe(engine);

                expect(listener).not.toHaveBeenCalled();
            });

            it("should allow to remove the active behaviour when the engine is enabled", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let behaviour_to_remove = engine.behaviours[0];
                let other_behaviour = engine.behaviours[1];
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("activate", listener);

                expect(engine.removeBehaviour(behaviour_to_remove)).toBe(engine);

                expect(listener).toHaveBeenCalledWith(engine, other_behaviour, engine.viewpoint);
                expect(behaviour_to_remove.clear).toHaveBeenCalledWith();
                expect(engine.behaviours).toEqual([other_behaviour]);
                expect(other_behaviour.index).toBe(0);
            });

            it("should allow to remove inactive behaviours when the engine is enabled", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let other_behaviour = engine.behaviours[0];
                let behaviour_to_remove = engine.behaviours[1];
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("activate", listener);

                expect(engine.removeBehaviour(behaviour_to_remove)).toBe(engine);

                expect(behaviour_to_remove.clear).toHaveBeenCalledWith();
                expect(engine.behaviours).toEqual([other_behaviour]);
                expect(other_behaviour.index).toBe(0);
            });

            it("should cancel behaviour ordering", () => {
                // This works, but it is not possible through the user interface
                // (at least on WireCloud 1.2)
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let other_behaviour = engine.behaviours[0];
                let behaviour_to_remove = engine.behaviours[1];
                // Enable Behaviour ordering
                engine.btnOrder.click();

                expect(engine.removeBehaviour(behaviour_to_remove)).toBe(engine);

                expect(behaviour_to_remove.clear).toHaveBeenCalledWith();
                expect(engine.btnOrder.active).toBe(false);
                expect(engine.behaviours).toEqual([other_behaviour]);
                expect(other_behaviour.index).toBe(0);
            });

        });

        describe("removeComponent(component[, cascade=false])", () => {

            it("should remove components (engine disabled)", () => {
                let engine = new ns.BehaviourEngine();
                let connection = {};
                let component = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                component.forEachConnection.and.callFake((listener) => {listener(connection);});
                engine.updateComponent(component);
                spyOn(engine, "removeConnection");
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);

                expect(engine.removeComponent(component));

                expect(engine.removeConnection).toHaveBeenCalledWith(connection, false);
                expect(engine.hasComponent(component)).toBe(false);
                expect(listener).toHaveBeenCalledWith(engine, engine.getCurrentStatus(), false);
                expect(listener.calls.count()).toBe(1);
            });

            it("should remove components from the active behaviour (engine enabled)", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let component = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                engine.updateComponent(component);
                // Simulate the component is on both behaviours
                engine.behaviours[0].hasComponent.and.returnValue(true);
                engine.behaviours[1].hasComponent.and.returnValue(true);
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);

                expect(engine.removeComponent(component));

                // Now the component should have been removed
                expect(engine.behaviour.removeComponent).toHaveBeenCalledWith(component);
                expect(engine.behaviours[1].removeComponent).not.toHaveBeenCalled();
                // In this case, the change event is propagated by the affected behaviour
                expect(listener).not.toHaveBeenCalled();
            });

            it("should remove components from all the behaviour when using the cascade option (engine enabled)", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}, {}]);
                let component = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                engine.updateComponent(component);
                // Simulate the component is on the first and second behaviour
                engine.behaviours[0].hasComponent.and.returnValue(true);
                engine.behaviours[1].hasComponent.and.returnValue(true);
                engine.behaviours[2].hasComponent.and.returnValue(false);
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);
                var alert_handler;
                spyOn(Wirecloud.ui, "AlertWindowMenu").and.callFake(function () {
                    this.setHandler = jasmine.createSpy("setHandler").and.callFake((listener) => {
                        alert_handler = listener;
                        return this;
                    });
                    this.show = jasmine.createSpy("show").and.returnValue(this);
                });

                expect(engine.removeComponent(component, true));

                // Behaviour Engine displays an Alert modal, component is not
                // removed until user accepts it
                expect(engine.behaviours[0].removeComponent).not.toHaveBeenCalled();
                expect(engine.behaviours[1].removeComponent).not.toHaveBeenCalled();
                expect(engine.behaviours[2].removeComponent).not.toHaveBeenCalled();

                alert_handler();

                // Now the component should have been removed
                expect(engine.behaviours[0].removeComponent).toHaveBeenCalledWith(component);
                expect(engine.behaviours[1].removeComponent).toHaveBeenCalledWith(component);
                // removeComponent is also called on behaviours no containing the component
                expect(engine.behaviours[2].removeComponent).toHaveBeenCalledWith(component);
                // In this case, the change event is propagated by the affected behaviours
                expect(listener).not.toHaveBeenCalled();
            });

            it("should completely remove components if only in one behaviour (engine enabled)", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let component = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                engine.updateComponent(component);
                // Simulate the component is only on one behaviour
                engine.behaviour.hasComponent.and.returnValues(true, false);
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);
                var alert_handler;
                spyOn(Wirecloud.ui, "AlertWindowMenu").and.callFake(function () {
                    this.setHandler = jasmine.createSpy("setHandler").and.callFake((listener) => {
                        alert_handler = listener;
                        return this;
                    });
                    this.show = jasmine.createSpy("show").and.returnValue(this);
                });

                expect(engine.removeComponent(component));

                // Behaviour Engine displays an Alert modal, component is not
                // removed until user accepts it
                expect(engine.behaviour.removeComponent).not.toHaveBeenCalled();

                alert_handler();

                // Now the component should have been removed
                expect(engine.behaviour.removeComponent).toHaveBeenCalledWith(component);
                // In this case, the change event is propagated by the affected behaviour
                expect(listener).not.toHaveBeenCalled();
            });

        });

        describe("removeComponentList(components)", () => {

            it("should remove components (engine disabled)", () => {
                let engine = new ns.BehaviourEngine();
                let component = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                engine.updateComponent(component);
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);

                expect(engine.removeComponentList([component]));

                expect(engine.hasComponent(component)).toBe(false);
                expect(listener).toHaveBeenCalledWith(engine, engine.getCurrentStatus(), false);
                expect(listener.calls.count()).toBe(1);
            });

            it("should remove components from the active behaviour (engine enabled)", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let component = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                engine.updateComponent(component);
                // Simulate the component is on both behaviours
                engine.behaviours[0].hasComponent.and.returnValue(true);
                engine.behaviours[1].hasComponent.and.returnValue(true);
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);

                expect(engine.removeComponentList([component]));

                // Now the component should have been removed
                expect(engine.behaviour.removeComponent).toHaveBeenCalledWith(component);
                expect(engine.behaviours[1].removeComponent).not.toHaveBeenCalled();
                // In this case, the change event is propagated by the affected behaviour
                expect(listener).not.toHaveBeenCalled();
            });

            it("should completely remove components if only in one behaviour (engine enabled)", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let component = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                engine.updateComponent(component);
                // Simulate the component is only on one behaviour
                engine.behaviour.hasComponent.and.returnValues(true, false);
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);
                var alert_handler;
                spyOn(Wirecloud.ui, "AlertWindowMenu").and.callFake(function () {
                    this.setHandler = jasmine.createSpy("setHandler").and.callFake((listener) => {
                        alert_handler = listener;
                        return this;
                    });
                    this.show = jasmine.createSpy("show").and.returnValue(this);
                });

                expect(engine.removeComponentList([component]));

                // Behaviour Engine displays an Alert modal, component is not
                // removed until user accepts it
                expect(engine.behaviour.removeComponent).not.toHaveBeenCalled();

                alert_handler();

                // Now the component should have been removed
                expect(engine.behaviour.removeComponent).toHaveBeenCalledWith(component);
                // In this case, the change event is propagated by the affected behaviour
                expect(listener).not.toHaveBeenCalled();
            });

        });

        describe("removeConnection(connection)", () => {

            it("should remove connections (engine disabled)", () => {
                let engine = new ns.BehaviourEngine();
                let connection = createConnectionMock({
                    sourceId: "sourcename",
                    targetId: "targetname"
                });
                engine.updateConnection(connection);
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);

                expect(engine.removeConnection(connection)).toBe(engine);

                expect(engine.hasConnection(connection)).toBe(false);
                expect(listener).toHaveBeenCalledWith(engine, engine.getCurrentStatus(), false);
                expect(listener.calls.count()).toBe(1);
            });

            it("should remove connections (engine enabled)", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let component1 = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                let component2 = createComponentMock({
                    id: "1",
                    type: "operator"
                });
                engine.updateComponent(component1);
                engine.updateComponent(component2);
                let connection = createConnectionMock({
                    sourceComponent: component1,
                    sourceId: "sourcename",
                    targetComponent: component2,
                    targetId: "targetname"
                });
                engine.updateConnection(connection);
                // Simulate the connection is also on the second behaviour
                engine.behaviours[1].hasConnection.and.returnValue(true);
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);

                expect(engine.removeConnection(connection)).toBe(engine);

                expect(engine.behaviours[0].removeConnection).toHaveBeenCalledWith(connection);
                expect(connection.background).toBe(true);
                // In this case, the change event is propagated by the affected behaviour
                expect(listener).not.toHaveBeenCalled();
            });

            it("should completely remove connections if they are not in any other behaviour (engine enabled)", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let component1 = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                let component2 = createComponentMock({
                    id: "1",
                    type: "operator"
                });
                engine.updateComponent(component1);
                engine.updateComponent(component2);
                let connection = createConnectionMock({
                    sourceComponent: component1,
                    sourceId: "sourcename",
                    targetComponent: component2,
                    targetId: "targetname"
                });
                engine.updateConnection(connection);
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);

                expect(engine.removeConnection(connection)).toBe(engine);

                expect(engine.hasConnection(connection)).toBe(false);
                // In this case, the change event is propagated by the affected behaviour
                expect(listener).not.toHaveBeenCalled();
            });

            it("should remove connections from all the behaviours when using the cascade option (engine enabled)", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let component1 = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                let component2 = createComponentMock({
                    id: "1",
                    type: "operator"
                });
                engine.updateComponent(component1);
                engine.updateComponent(component2);
                let connection = createConnectionMock({
                    sourceComponent: component1,
                    sourceId: "sourcename",
                    targetComponent: component2,
                    targetId: "targetname"
                });
                engine.updateConnection(connection);
                let listener = jasmine.createSpy("listener");
                engine.addEventListener("change", listener);

                expect(engine.removeConnection(connection, true)).toBe(engine);

                expect(engine.behaviours[0].removeConnection).toHaveBeenCalledWith(connection);
                expect(engine.behaviours[1].removeConnection).toHaveBeenCalledWith(connection);
                // In this case, the change event is propagated by the affected behaviour
                expect(listener).not.toHaveBeenCalled();
            });

        });

        describe("stopOrdering()", () => {

            it("should allow to stop ordering", () => {
                let engine = new ns.BehaviourEngine();
                engine.loadBehaviours([{}, {}]);
                let behaviour1 = engine.behaviours[0];
                let behaviour2 = engine.behaviours[1];

                // Start ordering
                engine.btnOrder.enable().click()
                // Stop ordering
                expect(engine.stopOrdering()).toBe(engine);

                expect(behaviour1.index).toBe(0);
                expect(behaviour1.btnPrefs.enabled).toBe(true);
                expect(behaviour1.btnRemove.enabled).toBe(true);
                expect(behaviour2.index).toBe(1);
                expect(behaviour2.btnPrefs.enabled).toBe(true);
                expect(behaviour2.btnRemove.enabled).toBe(true);
            });

        });

        describe("toJSON()", () => {

            it("should work for empty configurations", () => {
                let engine = new ns.BehaviourEngine();

                expect(engine.toJSON()).toEqual({
                    behaviours: [],
                    components: {
                        widget: {},
                        operator: {}
                    },
                    connections: []
                });
            });
        });

        describe("updateComponent(component)", () => {

            it("should allow to add components", () => {
                let engine = new ns.BehaviourEngine();
                let component1 = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                let component2 = createComponentMock({
                    id: "1",
                    type: "operator"
                });

                expect(engine.updateComponent(component1)).toBe(engine);
                expect(engine.updateComponent(component2)).toBe(engine);
            });

            it("should allow to update components", () => {
                let engine = new ns.BehaviourEngine();
                let component1_1 = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                let component1_2 = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                let component2_1 = createComponentMock({
                    id: "1",
                    type: "operator"
                });
                let component2_2 = createComponentMock({
                    id: "1",
                    type: "operator"
                });
                expect(engine.updateComponent(component1_1)).toBe(engine);
                expect(engine.updateComponent(component2_1)).toBe(engine);

                expect(engine.updateComponent(component1_2)).toBe(engine);
                expect(engine.updateComponent(component2_2)).toBe(engine);
            });

            it("should allow to add components to the current behaviour", () => {
                let engine = new ns.BehaviourEngine();
                let component = createComponentMock({
                    id: "1",
                    type: "widget",
                    background: true
                });
                engine.loadBehaviours([{}, {}]);
                let behaviour1 = engine.behaviours[0];
                let behaviour2 = engine.behaviours[0];
                behaviour1.hasComponent.and.returnValue(true);
                behaviour2.hasComponent.and.returnValue(true);

                expect(engine.updateComponent(component, true)).toBe(engine);

                expect(component.removeAllowed).toBe(true);
                expect(component.background).toBe(false);
            });

        });

        describe("updateConnection(connection)", () => {

            it("should allow to add connections", () => {
                let engine = new ns.BehaviourEngine();
                let connection = createConnectionMock({
                    sourceId: "sourcename",
                    targetId: "targetname"
                });

                expect(engine.updateConnection(connection)).toBe(engine);
            });

            it("should allow to update connections", () => {
                let engine = new ns.BehaviourEngine();
                let connection1 = createConnectionMock({
                    sourceId: "sourcename",
                    targetId: "targetname"
                });
                let connection2 = createConnectionMock({
                    sourceId: "sourcename",
                    targetId: "targetname"
                });

                expect(engine.updateConnection(connection1)).toBe(engine);
                expect(engine.updateConnection(connection2)).toBe(engine);
            });

            it("should ignore background connections", () => {
                let engine = new ns.BehaviourEngine();
                let connection = createConnectionMock({
                    sourceId: "sourcename",
                    targetId: "targetname"
                });

                expect(engine.updateConnection(connection)).toBe(engine);
            });

            it("should allow to add components to the current behaviour", () => {
                let engine = new ns.BehaviourEngine();
                let component1 = createComponentMock({
                    id: "1",
                    type: "widget"
                });
                let component2 = createComponentMock({
                    id: "1",
                    type: "operator"
                });
                let connection = createConnectionMock({
                    sourceComponent: component1,
                    sourceId: "sourcename",
                    targetComponent: component2,
                    targetId: "targetname",
                    background: true
                });
                engine.loadBehaviours([{}, {}]);
                let behaviour1 = engine.behaviours[0];
                let behaviour2 = engine.behaviours[0];
                behaviour1.hasConnection.and.returnValue(true);
                behaviour2.hasConnection.and.returnValue(true);
                spyOn(engine, "updateComponent");

                expect(engine.updateConnection(connection, true)).toBe(engine);

                expect(engine.updateComponent).toHaveBeenCalledWith(component1, true);
                expect(engine.updateComponent).toHaveBeenCalledWith(component2, true);
                expect(connection.removeAllowed).toBe(true);
                expect(connection.background).toBe(false);
            });

        });

        const createComponentMock = (options) => {
            return {
                id: options.id,
                type: options.type,
                background: options == null ? true : options.background,
                forEachComponent: jasmine.createSpy("forEachComponent"),
                forEachConnection: jasmine.createSpy("forEachConnection"),
                remove: jasmine.createSpy("remove"),
                toJSON: jasmine.createSpy("toJSON").and.returnValue({
                    position: options.position || {x: 0, y: 0}
                })
            };
        };

        const createConnectionMock = (options) => {
            options.toJSON = jasmine.createSpy("toJSON").and.returnValue({
                sourcename: options.sourceId,
                targetname: options.targetId
            });
            options.remove = jasmine.createSpy("remove").and.returnValue(options);
            return options;
        };

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

    });

})(Wirecloud.ui.WiringEditor, StyledElements);
