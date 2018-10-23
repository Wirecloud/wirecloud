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

    var SourceEndpoint = function (options) {
        Object.assign(this, options);
    };
    utils.inherit(SourceEndpoint, Wirecloud.wiring.SourceEndpoint);

    var TargetEndpoint = function (options) {
        Object.assign(this, options);
    };
    utils.inherit(TargetEndpoint, Wirecloud.wiring.TargetEndpoint);

    var Connection = function (options) {
        Object.assign(this, options);
    };

    describe("Endpoint", () => {

        beforeAll(() => {
            // TODO
            ns.Connection = Connection;
        });

        afterAll(() => {
            // TODO
            delete ns.Connection;
        });

        describe("new Endpoint(wiringEndpoint, component)", () => {

            it("wiringEndpoint is required", () => {
                expect(() => {
                    new ns.Endpoint();
                }).toThrowError(TypeError);
            });

            it("component is required", () => {
                expect(() => {
                    new ns.Endpoint(new SourceEndpoint({}));
                }).toThrowError(TypeError);
            });

            it("should allow to create output endpoints", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});

                expect(endpoint.type).toBe("source");
            });

            it("should allow to create input endpoints", () => {
                let endpoint = new ns.Endpoint(new TargetEndpoint({}), {});

                expect(endpoint.type).toBe("target");
            });

            it("should allow to assign the endpoint an index", () => {
                let endpoint = new ns.Endpoint(new TargetEndpoint({}), {});

                endpoint.index = 5;
                expect(endpoint.index).toBe(5);
            });

            it("should allow to assign the endpoint a title", () => {
                let endpoint = new ns.Endpoint(new TargetEndpoint({}), {});

                endpoint.title = "New Title";
                expect(endpoint.title).toBe("New Title");
            });

            it("should allow to retrieve anchor position (left anchor)", () => {
                let endpoint = new ns.Endpoint(
                    new TargetEndpoint({}),
                    {
                        parent: jasmine.createSpy("parent").and.returnValue({
                            scrollLeft: 13,
                            scrollTop: 20,
                            getBoundingClientRect: jasmine.createSpy().and.returnValue({
                                left: 5,
                                top: 12
                            })
                        })
                    }
                );
                spyOn(endpoint.anchorElement, "getBoundingClientRect").and.returnValue({
                    left: 120,
                    top: 15
                });

                expect(endpoint.anchorPosition).toEqual({
                    x: 127,
                    y: 22
                });
            });

            it("should allow to retrieve anchor position (right anchor)", () => {
                let endpoint = new ns.Endpoint(
                    new SourceEndpoint({}),
                    {
                        parent: jasmine.createSpy("parent").and.returnValue({
                            scrollLeft: 13,
                            scrollTop: 20,
                            getBoundingClientRect: jasmine.createSpy().and.returnValue({
                                left: 5,
                                top: 12
                            })
                        })
                    }
                );
                spyOn(endpoint.anchorElement, "getBoundingClientRect").and.returnValue({
                    left: 120,
                    top: 15,
                    width: 30
                });

                expect(endpoint.anchorPosition).toEqual({
                    x: 157,
                    y: 22
                });
            });

        });

        describe("activate()", () => {

            it("should activate the first time", () => {
                let endpoint = new ns.Endpoint(new TargetEndpoint({}), {});
                expect(endpoint.active).toBe(false);

                expect(endpoint.activate()).toBe(endpoint);

                expect(endpoint.active).toBe(true);
            });

            it("should do nothing if already active", () => {
                let endpoint = new ns.Endpoint(new TargetEndpoint({}), {});
                expect(endpoint.active).toBe(false);
                endpoint.activate();

                expect(endpoint.activate()).toBe(endpoint);

                expect(endpoint.active).toBe(true);
            });

        });

        describe("activateAll()", () => {

            it("activates all the associated connections", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let connection = new Connection({
                    activate: jasmine.createSpy("deactivate")
                });
                endpoint.appendConnection(connection);

                expect(endpoint.activateAll()).toBe(endpoint);

                expect(connection.activate).toHaveBeenCalledWith();
            });

        });

        describe("appendConnection(connection[, updateEndpoint])", () => {

            it("should not update endpoints by default", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("connectionadded", listener);
                let connection = {
                    refreshEndpoint: jasmine.createSpy('refreshEndpoint')
                };

                expect(endpoint.appendConnection(connection)).toBe(endpoint);

                expect(listener).toHaveBeenCalledWith(endpoint, connection);
                expect(connection.refreshEndpoint).not.toHaveBeenCalled();
            });

            it("should update endpoints when using updateEndpoint=true", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("connectionadded", listener);
                let connection = {
                    refreshEndpoint: jasmine.createSpy('refreshEndpoint')
                };

                expect(endpoint.appendConnection(connection, true)).toBe(endpoint);

                expect(listener).toHaveBeenCalledWith(endpoint, connection);
                expect(connection.refreshEndpoint).toHaveBeenCalledWith(endpoint);
            });

        });

        describe("deactivate()", () => {

            it("should do nothing if already deactivated", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                expect(endpoint.active).toBe(false);

                expect(endpoint.deactivate()).toBe(endpoint);

                expect(endpoint.active).toBe(false);
            });

            it("should deactivate the endpoint if currently activated and activation count equal to 1", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                expect(endpoint.active).toBe(false);
                endpoint.activate();

                expect(endpoint.deactivate()).toBe(endpoint);

                expect(endpoint.active).toBe(false);
            });

            it("should do nothing if the endpoint is currently activated and activation count greather than 1", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                expect(endpoint.active).toBe(false);
                endpoint.activate();
                endpoint.activate();

                expect(endpoint.deactivate()).toBe(endpoint);

                expect(endpoint.active).toBe(true);
            });

        });

        describe("deactivateAll()", () => {

            it("deactivates all the associated connections", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let connection = new Connection({
                    deactivate: jasmine.createSpy("deactivate")
                });
                endpoint.appendConnection(connection);

                expect(endpoint.deactivateAll()).toBe(endpoint);

                expect(connection.deactivate).toHaveBeenCalledWith();
            });

        });

        describe("equals(endpoint)", () => {

            it("should return false if endpoint parameter is not an endpoint instance", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});

                expect(endpoint.equals({type: "source", id: "id"})).toBe(false);
            });

            it("should return false if endpoint parameter is no equivalent", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({name: "sourceendpoint"}), {type: "widget", id: "1"});
                let other = new ns.Endpoint(new TargetEndpoint({name: "targetendpoinnt"}), {type: "operator", id: "1"});

                expect(endpoint.equals(other)).toBe(false);
            });

            it("should return true if endpoint parameter is the same instance", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({name: "sourceendpoint"}), {type: "widget", id: "1"});

                expect(endpoint.equals(endpoint)).toBe(true);
            });

            it("should return true if endpoint parameter is equivalent", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({name: "sourceendpoint"}), {type: "widget", id: "1"});
                let other = new ns.Endpoint(new SourceEndpoint({name: "sourceendpoinnt"}), {type: "widget", id: "1"});

                expect(endpoint.equals(other)).toBe(false);
            });

        });

        describe("getConnectionTo(endpoint)", () => {

            it("returns null if there is not such connection", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let otherendpoint = new ns.Endpoint(new TargetEndpoint({}), {});
                let connection = new Connection({
                    hasEndpoint: jasmine.createSpy("hasEndpoint").and.callFake(() => {return false;})
                });
                endpoint.appendConnection(connection);

                expect(endpoint.getConnectionTo(otherendpoint)).toBe(null);

                expect(connection.hasEndpoint).toHaveBeenCalledWith(otherendpoint);
            });

            it("returns a connection if there is a connection connected with the passed endpoint", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let otherendpoint = new ns.Endpoint(new TargetEndpoint({}), {});
                let connection = new Connection({
                    hasEndpoint: jasmine.createSpy("hasEndpoint").and.callFake(() => {return true;})
                });
                endpoint.appendConnection(connection);

                expect(endpoint.getConnectionTo(otherendpoint)).toBe(connection);

                expect(connection.hasEndpoint).toHaveBeenCalledWith(otherendpoint);
            });

        });

        describe("hasConnection(connection)", () => {

            it("should return false if the connection is not a connection", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});

                expect(endpoint.hasConnection("otherthing")).toBe(false);
            });

            it("should return false if the connection is connected to the enpdoint", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let connection = new Connection({
                    equals: () => {return false;}
                });

                expect(endpoint.hasConnection(connection)).toBe(false);
            });

            it("should return true if the connection is connected to the enpdoint", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let connection = new Connection({
                    equals: () => {return true;}
                });
                endpoint.appendConnection(connection);

                expect(endpoint.hasConnection(connection)).toBe(true);
            });

        });

        describe("hasConnections()", () => {

            it("should return false for endpoints without connections", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});

                expect(endpoint.hasConnections()).toBe(false);
            });

            it("should return true for endpoints with connections", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let connection = new Connection({});
                endpoint.appendConnection(connection);

                expect(endpoint.hasConnections()).toBe(true);
            });

        });

        describe("hasConnectionTo(endpoint)", () => {

            it("should return false if endpoint is not a connection", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let connection = new Connection({
                    hasEndpoint: () => {return false;}
                });
                endpoint.appendConnection(connection);

                expect(endpoint.hasConnectionTo("otherthing")).toBe(false);
            });

            it("should return false if endpoint is not connected", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let connection = new Connection({});

                expect(endpoint.hasConnectionTo(connection)).toBe(false);
            });

            it("should return true if the endpoint is connected", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let connection = new Connection({
                    hasEndpoint: () => {return true;}
                });
                endpoint.appendConnection(connection);

                expect(endpoint.hasConnectionTo(connection)).toBe(true);
            });

        });

        describe("mouse events", () => {

            it("mousedown with button 0 (disabled)", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                endpoint.enabled = false;
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("mousedown", listener);
                let event = new MouseEvent("mousedown", {button: 0});
                spyOn(event, "stopPropagation");
                spyOn(event, "preventDefault");

                endpoint.get().dispatchEvent(event);

                expect(event.stopPropagation).not.toHaveBeenCalled();
                expect(event.preventDefault).not.toHaveBeenCalled();
                expect(listener).not.toHaveBeenCalled();
            });

            it("mousedown with button 0 (enabled)", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                endpoint.enabled = true;
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("mousedown", listener);
                let event = new MouseEvent("mousedown", {button: 0});
                spyOn(event, "stopPropagation");
                spyOn(event, "preventDefault");

                endpoint.get().dispatchEvent(event);

                expect(event.stopPropagation).toHaveBeenCalledWith();
                expect(event.preventDefault).toHaveBeenCalledWith();
                expect(listener).toHaveBeenCalledWith(endpoint, event);
            });

            it("mousedown with button 1 (enabled)", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                endpoint.enabled = true;
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("mousedown", listener);
                let event = new MouseEvent("mousedown", {button: 1});
                spyOn(event, "stopPropagation");
                spyOn(event, "preventDefault");

                endpoint.get().dispatchEvent(event);

                expect(event.stopPropagation).not.toHaveBeenCalled();
                expect(event.preventDefault).not.toHaveBeenCalled();
                expect(listener).not.toHaveBeenCalled();
            });

            it("mouseenter (disabled)", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                endpoint.enabled = false;
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("mouseenter", listener);
                let event = new MouseEvent("mouseenter");
                spyOn(event, "stopPropagation");
                spyOn(event, "preventDefault");

                endpoint.get().dispatchEvent(event);

                expect(event.stopPropagation).not.toHaveBeenCalled();
                expect(event.preventDefault).not.toHaveBeenCalled();
                expect(listener).not.toHaveBeenCalled();
            });

            it("mouseenter (enabled)", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                endpoint.enabled = true;
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("mouseenter", listener);
                let event = new MouseEvent("mouseenter");
                spyOn(event, "stopPropagation");
                spyOn(event, "preventDefault");

                endpoint.get().dispatchEvent(event);

                expect(event.stopPropagation).toHaveBeenCalledWith();
                expect(event.preventDefault).not.toHaveBeenCalled();
                expect(listener).toHaveBeenCalledWith(endpoint, event);
            });

            it("mouseleave (disabled)", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                endpoint.enabled = false;
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("mouseleave", listener);
                let event = new MouseEvent("mouseleave");
                spyOn(event, "stopPropagation");
                spyOn(event, "preventDefault");

                endpoint.get().dispatchEvent(event);

                expect(event.stopPropagation).not.toHaveBeenCalled();
                expect(event.preventDefault).not.toHaveBeenCalled();
                expect(listener).not.toHaveBeenCalled();
            });

            it("mouseleave (enabled)", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                endpoint.enabled = true;
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("mouseleave", listener);
                let event = new MouseEvent("mouseleave");
                spyOn(event, "stopPropagation");
                spyOn(event, "preventDefault");

                endpoint.get().dispatchEvent(event);

                expect(event.stopPropagation).toHaveBeenCalledWith();
                expect(event.preventDefault).not.toHaveBeenCalled();
                expect(listener).toHaveBeenCalledWith(endpoint, event);
            });

            it("mouseup with button 0 (disabled)", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                endpoint.enabled = false;
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("mouseup", listener);
                let event = new MouseEvent("mouseup", {button: 0});
                spyOn(event, "stopPropagation");
                spyOn(event, "preventDefault");

                endpoint.get().dispatchEvent(event);

                expect(event.stopPropagation).not.toHaveBeenCalled();
                expect(event.preventDefault).not.toHaveBeenCalled();
                expect(listener).not.toHaveBeenCalled();
            });

            it("mouseup with button 0 (enabled)", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                endpoint.enabled = true;
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("mouseup", listener);
                let event = new MouseEvent("mouseup", {button: 0});
                spyOn(event, "stopPropagation");
                spyOn(event, "preventDefault");

                endpoint.get().dispatchEvent(event);

                expect(event.stopPropagation).toHaveBeenCalledWith();
                expect(event.preventDefault).toHaveBeenCalledWith();
                expect(listener).toHaveBeenCalledWith(endpoint, event);
            });

            it("mouseup with button 1 (enabled)", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                endpoint.enabled = true;
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("mouseup", listener);
                let event = new MouseEvent("mouseup", {button: 1});
                spyOn(event, "stopPropagation");
                spyOn(event, "preventDefault");

                endpoint.get().dispatchEvent(event);

                expect(event.stopPropagation).not.toHaveBeenCalled();
                expect(event.preventDefault).not.toHaveBeenCalled();
                expect(listener).not.toHaveBeenCalled();
            });

        });

        describe("refresh()", () => {

            it("refresh all the associated connections", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let connection = new Connection({
                    refresh: jasmine.createSpy("refresh")
                });
                endpoint.appendConnection(connection);

                expect(endpoint.refresh()).toBe(endpoint);

                expect(connection.refresh).toHaveBeenCalledWith();
            });

        });

        describe("removeConnection(connection)", () => {

            it("should do nothing if the connection is not present", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let connection1 = new Connection({});
                endpoint.appendConnection(connection1);
                let connection2 = new Connection({});
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("connectionremoved", listener);

                expect(endpoint.removeConnection(connection2)).toBe(endpoint);

                expect(listener).not.toHaveBeenCalled();
            });

            it("should remove the connection if present", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                let connection1 = new Connection({});
                endpoint.appendConnection(connection1);
                let listener = jasmine.createSpy("listener");
                endpoint.addEventListener("connectionremoved", listener);

                expect(endpoint.removeConnection(connection1)).toBe(endpoint);

                expect(listener).toHaveBeenCalledWith(endpoint, connection1);
            });

        });

        describe("toggleActive(active)", () => {

            it("should call activate() if active is true", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                spyOn(endpoint, "activate");
                spyOn(endpoint, "deactivate");

                endpoint.toggleActive(true);

                expect(endpoint.activate).toHaveBeenCalledWith();
                expect(endpoint.deactivate).not.toHaveBeenCalled();
            });

            it("should call deactivate() if active is false", () => {
                let endpoint = new ns.Endpoint(new SourceEndpoint({}), {});
                spyOn(endpoint, "activate");
                spyOn(endpoint, "deactivate");

                endpoint.toggleActive(false);

                expect(endpoint.activate).not.toHaveBeenCalled();
                expect(endpoint.deactivate).toHaveBeenCalledWith();
            });

        });

    });

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
