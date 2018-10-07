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


(function (ns, se, utils) {

    "use strict";

    describe("Behaviour", () => {

        beforeAll(() => {
            ns.BehaviourPrefs = jasmine.createSpy("BehaviourPrefs");
            se.Utils.inherit(ns.BehaviourPrefs, se.DynamicMenuItems);
        });

        describe("new Behaviour(index[, options])", () => {

            it("index is required", () => {
                expect(() => {
                    new ns.Behaviour();
                }).toThrowError(TypeError);
            });

            it("it is an styledelement panel", () => {
                let behaviour = new ns.Behaviour(1);

                expect(behaviour.index).toBe(1);
                expect(behaviour.title).toEqual(jasmine.any(String));
                expect(behaviour.title.trim()).not.toBe("");
                expect(behaviour).toEqual(jasmine.any(se.Panel));
            });

            it("index attribute can be modified", () => {
                let behaviour = new ns.Behaviour(1);

                behaviour.index = 2;
                expect(behaviour.index).toBe(2);
            });

            it("provides default values for the title and the description attributes", () => {
                let behaviour = new ns.Behaviour(2, {
                    title: "    ",
                    description: ""
                });

                expect(behaviour.index).toBe(2);
                expect(behaviour.title).toEqual(jasmine.any(String));
                expect(behaviour.title.trim()).not.toBe("");
                expect(behaviour.description).toEqual(jasmine.any(String));
                expect(behaviour.description.trim()).not.toBe("");
            });

        });

        describe("btnRemove", () => {

            it("should send an optremove event if the user like to remove the behaviour", () => {
                let behaviour = new ns.Behaviour(1);
                let listener = jasmine.createSpy("listener");
                var alert_handler;
                behaviour.addEventListener("optremove", listener);
                spyOn(Wirecloud.ui, "AlertWindowMenu").and.callFake(function () {
                    this.setHandler = jasmine.createSpy("setHandler").and.callFake((listener) => {
                        alert_handler = listener;
                        return this;
                    });
                    this.show = jasmine.createSpy("show").and.returnValue(this);
                });

                behaviour.btnRemove.click();
                alert_handler();

                expect(listener).toHaveBeenCalledWith(behaviour);
                expect(listener.calls.count()).toBe(1);
            });

        });

        describe("click events", () => {

            it("should be ignored if the behaviour is active", () => {
                let behaviour = new ns.Behaviour(1);
                behaviour.active = true;
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("click", listener);
                let event = {
                    stopPropagation: jasmine.createSpy("stopPropagation")
                };

                // TODO
                behaviour._onclick(event);

                expect(listener).not.toHaveBeenCalled();
            });

            it("should be propagated if the behaviour is inactive", () => {
                let behaviour = new ns.Behaviour(1);
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("click", listener);
                let event = {
                    stopPropagation: jasmine.createSpy("stopPropagation")
                };

                // TODO
                behaviour._onclick(event);

                expect(listener).toHaveBeenCalledWith(behaviour, event);
            });

        });

        describe("clear()", () => {

            it("should work with an empty status", () => {
                let behaviour = new ns.Behaviour(1);
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("change", listener);

                expect(behaviour.clear()).toBe(behaviour);

                expect(listener).toHaveBeenCalledWith(behaviour);
                expect(listener.calls.count()).toBe(1);
            });

            it("should remove all the components", () => {
                let behaviour = new ns.Behaviour(1);
                let component1 = {
                    id: "1",
                    type: "widget"
                };
                behaviour.updateComponent(component1);
                let component2 = {
                    id: "1",
                    type: "operator"
                };
                behaviour.updateComponent(component2);
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("change", listener);

                expect(behaviour.clear()).toBe(behaviour);

                expect(behaviour.hasComponent(component1)).toBe(false);
                expect(behaviour.hasComponent(component2)).toBe(false);
                expect(listener).toHaveBeenCalledWith(behaviour);
                expect(listener.calls.count()).toBe(1);
            });

        });

        describe("equals(other)", () => {

            it("should return true if other is the same instance", () => {
                let behaviour = new ns.Behaviour(1);

                expect(behaviour.equals(behaviour)).toBe(true);
            });

            it("should return false if other is a different instance", () => {
                let behaviour = new ns.Behaviour(1);
                let other = new ns.Behaviour(2);

                expect(behaviour.equals(other)).toBe(false);
            });

        });

        describe("getConnectionIndex(connection)", () => {

            it("should return -1 if the connection is not present", () => {
                let behaviour = new ns.Behaviour(1);
                let connection1 = {
                    sourceId: "sourcename",
                    targetId: "targetname"
                };
                behaviour.updateConnection(connection1);
                let connection2 = {
                    sourceId: "othersourcename",
                    targetId: "targetname"
                };

                expect(behaviour.getConnectionIndex(connection2)).toBe(-1);
            });

            it("should return connection index if the connection is present", () => {
                let behaviour = new ns.Behaviour(1);
                let connection1 = {
                    sourceId: "sourcename",
                    targetId: "targetname"
                };
                behaviour.updateConnection(connection1);
                let connection2 = {
                    sourceId: "othersourcename",
                    targetId: "targetname"
                };
                behaviour.updateConnection(connection2);

                expect(behaviour.getConnectionIndex(connection2)).toBe(1);
            });

        });

        describe("getCurrentStatus()", () => {

            it("should return correct values for an empty behaviour", () => {
                let behaviour = new ns.Behaviour(1);

                expect(behaviour.getCurrentStatus()).toEqual({
                    title: jasmine.any(String),
                    connections: 0,
                    components: {
                        widget: 0,
                        operator: 0
                    }
                });
            });

            it("should return correct values for behaviours with connections and components", () => {
                let behaviour = new ns.Behaviour(1);
                behaviour.updateConnection({
                    sourceId: "sourcename",
                    targetId: "targetname"
                });
                behaviour.updateConnection({
                    sourceId: "othersourcename",
                    targetId: "targetname"
                });
                behaviour.updateComponent({
                    id: "1",
                    type: "widget"
                });
                behaviour.updateComponent({
                    id: "1",
                    type: "operator"
                });
                behaviour.updateComponent({
                    id: "2",
                    type: "operator"
                });

                expect(behaviour.getCurrentStatus()).toEqual({
                    title: jasmine.any(String),
                    connections: 2,
                    components: {
                        widget: 1,
                        operator: 2
                    }
                });
            });

        });

        describe("hasComponent(component)", () => {

            it("should return false if the component is not present", () => {
                let behaviour = new ns.Behaviour(1);
                let component = {
                    id: "1",
                    type: "widget"
                };

                expect(behaviour.hasComponent(component)).toBe(false);
            });

            it("should return false if the component is not present", () => {
                let behaviour = new ns.Behaviour(1);
                let component = {
                    id: "1",
                    type: "widget"
                };
                behaviour.updateComponent(component);

                expect(behaviour.hasComponent(component)).toBe(true);
            });

        });

        describe("hasConnection(connection)", () => {

            it("should return false if the connection is not present", () => {
                let behaviour = new ns.Behaviour(1);
                let connection = {
                    sourceId: "sourcename",
                    targetId: "targetname"
                };

                expect(behaviour.hasConnection(connection)).toBe(false);
            });

            it("should return false if the connection is not present", () => {
                let behaviour = new ns.Behaviour(1);
                let connection = {
                    sourceId: "sourcename",
                    targetId: "targetname"
                };
                behaviour.updateConnection(connection);

                expect(behaviour.hasConnection(connection)).toBe(true);
            });

        });

        describe("removeComponent(component)", () => {

            it("should remove components", () => {
                let behaviour = new ns.Behaviour(1);
                let component = {
                    id: "1",
                    type: "widget"
                };
                behaviour.updateComponent(component);
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("change", listener);

                expect(behaviour.removeComponent(component)).toBe(behaviour);

                expect(behaviour.hasComponent(component)).toBe(false);
                expect(listener).toHaveBeenCalledWith(behaviour);
                expect(listener.calls.count()).toBe(1);
            });

            it("should do nothing if the component is not in the behaviour", () => {
                let behaviour = new ns.Behaviour(1);
                let component = {
                    id: "1",
                    type: "widget"
                };
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("change", listener);

                expect(behaviour.removeComponent(component)).toBe(behaviour);

                expect(behaviour.hasComponent(component)).toBe(false);
                expect(listener).not.toHaveBeenCalled();
            });

        });

        describe("removeConnection(connection)", () => {

            it("should remove connections", () => {
                let behaviour = new ns.Behaviour(1);
                let connection = {
                    sourceId: "sourcename",
                    targetId: "targetname"
                };
                behaviour.updateConnection(connection);
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("change", listener);

                expect(behaviour.removeConnection(connection)).toBe(behaviour);

                expect(behaviour.hasConnection(connection)).toBe(false);
                expect(listener).toHaveBeenCalledWith(behaviour);
                expect(listener.calls.count()).toBe(1);
            });

            it("should do nothing if the connection is not in the behaviour", () => {
                let behaviour = new ns.Behaviour(1);
                let connection = {
                    sourceId: "sourcename",
                    targetId: "targetname"
                };
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("change", listener);

                expect(behaviour.removeConnection(connection)).toBe(behaviour);

                expect(behaviour.hasConnection(connection)).toBe(false);
                expect(listener).not.toHaveBeenCalled();
            });

        });

        describe("showLogs()", () => {

            it("should present to the user a modal dialog with the logs of the behaviour", () => {
                let behaviour = new ns.Behaviour(1);
                var dialog;
                // TODO change to spyOn on LogWindowMenu inclusion to the tested classes
                Wirecloud.ui.LogWindowMenu = jasmine.createSpy("LogWindowMenu").and.callFake(function () {
                    dialog = this;
                    this.show = jasmine.createSpy("show").and.returnValue(this);
                });

                expect(behaviour.showLogs()).toBe(behaviour);
                expect(dialog.show).toHaveBeenCalledWith();
            });

        });

        describe("showSettings()", () => {

            it("should send an optremove event if the user like to remove the behaviour", () => {
                let behaviour = new ns.Behaviour(1);
                let new_title = "New Title";
                let new_description = "New description";
                let listener = jasmine.createSpy("listener");
                var dialog;
                behaviour.addEventListener("change", listener);
                // TODO change to spyOn on FormWindowMenu inclusion to the tested classes
                Wirecloud.ui.FormWindowMenu = jasmine.createSpy("FormWindowMenu").and.callFake(function () {
                    dialog = this;
                    this.setValue = jasmine.createSpy("setValue").and.returnValue(this);
                    this.show = jasmine.createSpy("show").and.returnValue(this);
                });

                expect(behaviour.showSettings()).toBe(behaviour);
                dialog.executeOperation({
                    title: new_title,
                    description: new_description
                });

                expect(listener).toHaveBeenCalledWith(behaviour);
                expect(listener.calls.count()).toBe(1);
                expect(behaviour.title).toBe(new_title);
                expect(behaviour.description).toBe(new_description);
            });

            it("should provide default values for empty titles and descriptions", () => {
                let behaviour = new ns.Behaviour(1);
                let new_title = "   ";
                let new_description = "  \n  ";
                let listener = jasmine.createSpy("listener");
                var dialog;
                behaviour.addEventListener("change", listener);
                // TODO change to spyOn on FormWindowMenu inclusion to the tested classes
                Wirecloud.ui.FormWindowMenu = jasmine.createSpy("FormWindowMenu").and.callFake(function () {
                    dialog = this;
                    this.setValue = jasmine.createSpy("setValue").and.returnValue(this);
                    this.show = jasmine.createSpy("show").and.returnValue(this);
                });

                expect(behaviour.showSettings()).toBe(behaviour);
                dialog.executeOperation({
                    title: new_title,
                    description: new_description
                });

                expect(listener).toHaveBeenCalledWith(behaviour);
                expect(listener.calls.count()).toBe(1);
                expect(behaviour.title).not.toBe(new_title);
                expect(behaviour.description).not.toBe(new_description);
            });

        });

        describe("toJSON()", () => {

            it("should return correct values for an empty behaviour", () => {
                let behaviour = new ns.Behaviour(1);

                expect(behaviour.toJSON()).toEqual({
                    title: behaviour.title,
                    description: behaviour.description,
                    active: false,
                    connections: [],
                    components: {
                        widget: {},
                        operator: {}
                    }
                });
            });

            it("should return correct values for behaviours with connections and components", () => {
                let behaviour = new ns.Behaviour(1);
                behaviour.active = true;
                behaviour.updateConnection({
                    sourceId: "sourcename",
                    targetId: "targetname"
                });
                behaviour.updateConnection({
                    sourceId: "othersourcename",
                    targetId: "targetname"
                });
                behaviour.updateComponent({
                    id: "1",
                    type: "widget"
                });
                behaviour.updateComponent({
                    id: "2",
                    type: "widget"
                });
                behaviour.updateComponent({
                    id: "1",
                    type: "operator",
                });

                expect(behaviour.toJSON()).toEqual({
                    title: behaviour.title,
                    description: behaviour.description,
                    active: true,
                    connections: [
                        {
                            sourcename: "sourcename",
                            targetname: "targetname"
                        },
                        {
                            sourcename: "othersourcename",
                            targetname: "targetname"
                        },
                    ],
                    components: {
                        widget: {
                            1: {},
                            2: {}
                        },
                        operator: {
                            1: {}
                        }
                    }
                });
            });

        });

        describe("updateComponent(component)", () => {

            it("should allow to add components", () => {
                let behaviour = new ns.Behaviour(1);
                let component1 = {
                    id: "1",
                    type: "widget"
                };
                let component2 = {
                    id: "1",
                    type: "operator"
                };
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("change", listener);

                expect(behaviour.updateComponent(component1)).toBe(behaviour);
                expect(behaviour.updateComponent(component2)).toBe(behaviour);
                expect(listener).toHaveBeenCalledWith(behaviour);
                expect(listener.calls.count()).toBe(2);
            });

            it("should allow to update components", () => {
                let behaviour = new ns.Behaviour(1);
                let component1_1 = {
                    id: "1",
                    type: "widget"
                };
                let component1_2 = {
                    id: "1",
                    type: "widget"
                };
                let component2_1 = {
                    id: "1",
                    type: "operator"
                };
                let component2_2 = {
                    id: "1",
                    type: "operator"
                };
                behaviour.updateComponent(component1_1);
                behaviour.updateComponent(component2_1);
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("change", listener);

                expect(behaviour.updateComponent(component1_2)).toBe(behaviour);
                expect(behaviour.updateComponent(component2_2)).toBe(behaviour);
                expect(listener).not.toHaveBeenCalled();
            });

        });

        describe("updateConnection(connection)", () => {

            it("should allow to add connections", () => {
                let behaviour = new ns.Behaviour(1);
                let connection = {
                    sourceId: "sourcename",
                    targetId: "targetname"
                };
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("change", listener);

                expect(behaviour.updateConnection(connection)).toBe(behaviour);
                expect(listener).toHaveBeenCalledWith(behaviour);
                expect(listener.calls.count()).toBe(1);
            });

            it("should allow to update connections", () => {
                let behaviour = new ns.Behaviour(1);
                let connection1_1 = {
                    sourceId: "sourcename",
                    targetId: "targetname"
                };
                let connection1_2 = {
                    sourceId: "sourcename",
                    targetId: "targetname"
                };
                behaviour.updateConnection(connection1_1);
                let listener = jasmine.createSpy("listener");
                behaviour.addEventListener("change", listener);

                expect(behaviour.updateConnection(connection1_2)).toBe(behaviour);
                expect(listener).not.toHaveBeenCalled();
            });

        });

    });

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
