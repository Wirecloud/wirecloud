/*
 *     Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


(function () {

    "use strict";

    const WIRING = {
        workspace: {
            isAllowed: jasmine.createSpy('isAllowed').and.returnValue(true),
            restricted: false,
            view: {}
        }
    };
    Object.freeze(WIRING);

    const LOCKED_WIRING = {
        workspace: {
            isAllowed: jasmine.createSpy('isAllowed').and.returnValue(false),
            restricted: true,
            view: {}
        }
    };
    Object.freeze(LOCKED_WIRING);

    const EMPTY_OPERATOR_META = {
        title: "My Operator",
        hasEndpoints: jasmine.createSpy("hasEndpoints").and.returnValue(false),
        hasPreferences: jasmine.createSpy("hasPreferences").and.returnValue(false),
        inputList: [],
        missing: false,
        requirements: [],
        outputList: [],
        preferenceList: [],
        propertyList: [],
        codeurl: "https://wirecloud.example.com/operators/MyOperator/index.html"
    };
    Object.freeze(EMPTY_OPERATOR_META);

    const PREF = new Wirecloud.UserPrefDef({name: "pref", type: "text", default: "other"});
    const PROP = new Wirecloud.PersistentVariableDef({name: "prop", type: "text"});
    const OPERATOR_META = {
        uri: "Vendor/Operator/1.0",
        title: "My Operator",
        inputList: [
            {name: "input", label: "input", friendcode: ""}
        ],
        missing: false,
        requirements: [],
        outputList: [
            {name: "output", label: "output", friendcode: ""}
        ],
        preferences: {
            "pref": PREF
        },
        preferenceList: [
            PREF
        ],
        properties: {
            "prop": PROP
        },
        propertyList: [
            PROP
        ],
        codeurl: "https://wirecloud.example.com/operators/MyOperator/index.html"
    };
    Object.freeze(OPERATOR_META);


    describe("Wirecloud.wiring.Operator", function () {

        beforeAll(() => {
            spyOn(console, "log");
            spyOn(console, "info");
        });

        // TODO
        beforeEach(() => {
            Wirecloud.PropertyCommiter = jasmine.createSpy("PropertyCommiter").and.returnValue({
                commit: jasmine.createSpy('commit')
            });
        });

        // TODO
        afterAll(() => {
            delete Wirecloud.PropertyCommiter;
        });

        describe("new Operator(wiring, meta, [data])", function () {

            it("throws a TypeError exception if wiring is not a Wiring instance", function () {
                expect(function () {
                    new Wirecloud.wiring.Operator();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception if data is not an object", () => {
                expect(() => {
                    new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META);
                }).toThrowError(TypeError);
            });

            it("allow to instantiate operators from partial persistence", () => {
                const operator = new Wirecloud.wiring.Operator(WIRING, OPERATOR_META, {
                    id: "2",
                    preferences: {},
                    propeties: {}
                });

                expect(operator.id).toBe("2");
                expect(operator.loaded).toBe(false);
                expect(operator.missing).toBe(false);
                expect(operator.volatile).toBe(false);
                expect(new URL(operator.codeurl)).toEqual(jasmine.any(URL));

                expect(Object.keys(operator.preferences)).toEqual(["pref"]);
                expect(operator.preferences.pref).toEqual(jasmine.any(Wirecloud.UserPref));
                expect(operator.preferences.pref.readonly).toBe(false);
                expect(operator.preferences.pref.hidden).toBe(false);
                expect(operator.preferences.pref.value).toEqual("other");
                expect(operator.preferenceList).toEqual([operator.preferences.pref]);
            });

            it("allow to instantiate operators from persistence", () => {
                const operator = new Wirecloud.wiring.Operator(WIRING, OPERATOR_META, {
                    id: "2",
                    title: "title",
                    preferences: {
                        "pref": {
                            readonly: false,
                            hidden: false,
                            value: "value"
                        }
                    },
                    properties: {
                        "prop": {
                            readonly: false,
                            value: "data"
                        }
                    }
                });

                expect(operator.id).toBe("2");
                expect(operator.loaded).toBe(false);
                expect(operator.missing).toBe(false);
                expect(operator.title).toBe("title");
                expect(operator.volatile).toBe(false);
                expect(new URL(operator.codeurl)).toEqual(jasmine.any(URL));

                // Wiring
                expect(Object.keys(operator.inputs).length).toBe(1);
                expect(operator.inputs.input).toEqual(jasmine.any(Wirecloud.wiring.OperatorTargetEndpoint));
                expect(Object.keys(operator.outputs).length).toBe(1);
                expect(operator.outputs.output).toEqual(jasmine.any(Wirecloud.wiring.OperatorSourceEndpoint));

                // Preferences
                expect(Object.keys(operator.preferences)).toEqual(["pref"]);
                expect(operator.preferences.pref).toEqual(jasmine.any(Wirecloud.UserPref));
                expect(operator.preferences.pref.value).toEqual("value");

                // Persistent Variables
                expect(Object.keys(operator.properties)).toEqual(["prop"]);
                expect(operator.properties.prop).toEqual(jasmine.any(Wirecloud.PersistentVariable));
                expect(operator.properties.prop.value).toEqual("data");
            });

        });

        describe("fullDisconnect()", () => {

            it("is a shortcut for calling fullDisconnect on every endpoint", () => {

                const operator = new Wirecloud.wiring.Operator(WIRING, OPERATOR_META, {
                    id: "2",
                    preferences: {},
                    propeties: {}
                });

                spyOn(operator.inputs.input, "fullDisconnect");
                spyOn(operator.outputs.output, "fullDisconnect");

                operator.fullDisconnect();

                expect(operator.inputs.input.fullDisconnect.calls.count()).toBe(1);
                expect(operator.inputs.input.fullDisconnect).toHaveBeenCalledWith();
                expect(operator.outputs.output.fullDisconnect.calls.count()).toBe(1);
                expect(operator.outputs.output.fullDisconnect).toHaveBeenCalledWith();
            });
        });

        describe("hasEndpoints()", () => {

            it("is a shortcut", () => {
                const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {id: "1"});
                expect(operator.hasEndpoints()).toBe(false);
                expect(operator.meta.hasEndpoints).toHaveBeenCalled();
            });

        });

        describe("hasPreferences()", () => {

            it("is a shortcut", () => {
                const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {id: "1"});
                expect(operator.hasPreferences()).toBe(false);
                expect(operator.meta.hasPreferences).toHaveBeenCalled();
            });

        });

        describe("is(component)", () => {

            it("return true for the same component", () => {
                const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {id: "1"});

                expect(operator.is(operator)).toBe(true);
            });

            it("return false for the different operators", () => {
                const operator1 = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {id: "1"});
                const operator2 = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {id: "2"});

                expect(operator1.is(operator2)).toBe(false);
            });

        });

        describe("isAllowed(name)", () => {

            describe("close", () => {

                it("normal operator on unlocked workspace", () => {
                    const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {
                        id: "1",
                        permissions: {
                            close: true
                        }
                    });
                    expect(operator.isAllowed("close")).toBe(true);
                });

                it("normal operator on locked workspace", () => {
                    const operator = new Wirecloud.wiring.Operator(LOCKED_WIRING, EMPTY_OPERATOR_META, {
                        id: "1",
                        permissions: {
                            close: true
                        }
                    });
                    expect(operator.isAllowed("close")).toBe(false);
                });

                it("normal operator on shared workspace", () => {
                    const operator = new Wirecloud.wiring.Operator(LOCKED_WIRING, EMPTY_OPERATOR_META, {
                        id: "1",
                        permissions: {
                            // This should contain a false value as this user is
                            // not able to edit shared dashboards
                            // Anyway, this should no affect the result
                            close: true
                        }
                    });
                    expect(operator.isAllowed("close")).toBe(false);
                });

                it("volatile operator on shared workspace", () => {
                    const operator = new Wirecloud.wiring.Operator(LOCKED_WIRING, EMPTY_OPERATOR_META, {
                        id: "1/1",
                        volatile: true
                    });
                    expect(operator.isAllowed("close")).toBe(true);
                });

            });

            describe("rename", () => {

                it("normal operator on unlocked workspace", () => {
                    const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {
                        id: "1",
                        permissions: {
                            rename: true
                        }
                    });
                    expect(operator.isAllowed("rename")).toBe(true);
                });

                it("normal operator on locked workspace", () => {
                    const operator = new Wirecloud.wiring.Operator(LOCKED_WIRING, EMPTY_OPERATOR_META, {
                        id: "1",
                        permissions: {
                            rename: true
                        }
                    });
                    expect(operator.isAllowed("rename")).toBe(false);
                });

                it("normal operator on shared workspace", () => {
                    const operator = new Wirecloud.wiring.Operator(LOCKED_WIRING, EMPTY_OPERATOR_META, {
                        id: "1",
                        permissions: {
                            // This should contain a false value as this user is
                            // not able to edit shared dashboards
                            // Anyway, this should no affect the result
                            close: true
                        }
                    });
                    expect(operator.isAllowed("rename")).toBe(false);
                });

                it("volatile operator on shared workspace", () => {
                    const operator = new Wirecloud.wiring.Operator(LOCKED_WIRING, EMPTY_OPERATOR_META, {
                        id: "1/1",
                        volatile: true
                    });
                    expect(operator.isAllowed("rename")).toBe(true);
                });

            });

            describe("invalid permission name", () => {

                it("normal operator", () => {
                    const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {id: "1"});
                    expect(() => {
                        operator.isAllowed("invalid");
                    }).toThrowError(TypeError);
                });

                it("normal operator on shared workspace", () => {
                    const operator = new Wirecloud.wiring.Operator(LOCKED_WIRING, EMPTY_OPERATOR_META, {id: "1"});
                    expect(() => {
                        operator.isAllowed("invalid");
                    }).toThrowError(TypeError);
                });

                it("volatile operator on shared workspace", () => {
                    const operator = new Wirecloud.wiring.Operator(LOCKED_WIRING, EMPTY_OPERATOR_META, {
                        id: "1/1",
                        volatile: true
                    });
                    expect(() => {
                        operator.isAllowed("invalid");
                    }).toThrowError(TypeError);
                });

            });

        });

        describe("remove()", () => {

            it("support renaming volatile operators", (done) => {
                const listener = jasmine.createSpy("listener");
                const operator = new Wirecloud.wiring.Operator(LOCKED_WIRING, EMPTY_OPERATOR_META, {
                    id: "1/1",
                    title: "old title",
                    volatile: true
                });

                operator.addEventListener("remove", listener);
                const p = operator.remove();
                p.then((value) => {
                    expect(value).toBe(value);
                    expect(listener).toHaveBeenCalled();
                    done();
                });
            });

            it("removes operator from persistence", (done) => {

                const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {
                    id: "1"
                });
                /* TODO
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    expect(options.method).toEqual("DELETE");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 204
                        });
                    });
                }); */

                const p = operator.remove();
                p.then((value) => {
                    expect(value).toBe(value);
                    // expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                    done();
                });

            });

        });


        describe("upgrade(meta)", () => {
            let failOnVariables = false;

            beforeEach(() => {
                failOnVariables = false;
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    url = url.toString();
                    if (url.endsWith("/1")) {
                        expect(options.method).toEqual("GET");
                        return new Wirecloud.Task("Sending request", function (resolve) {
                            if (typeof failOnVariables === "string") {
                                resolve({
                                    status: 200,
                                    responseText: 'invalid'
                                });
                            } else if (failOnVariables) {
                                resolve({
                                    status: 404
                                });
                            } else {
                                resolve({
                                    status: 200,
                                    responseText: '{"preferences": {"npref": {"readonly": false, "hidden": false, "value": "upgraded value"}}, "properties": {}}'
                                });
                            }
                        });
                    } else {
                        expect(options.method).toEqual("POST");
                        return new Wirecloud.Task("Sending request", function (resolve) {
                            resolve({
                                status: 204
                            });
                        });
                    }
                });

                Wirecloud.wiring.OperatorMeta = jasmine.createSpy("OperatorMeta").and.callFake(function (missing) {
                    this.uri = "Vendor/Operator/1.0";
                    this.version = {
                        compareTo: jasmine.createSpy('compareTo')
                    }
                    if (missing === true) {
                        this.preferenceList = [];
                        this.preferences = {};
                        this.missing = true;
                    } else {
                        const PREF = new Wirecloud.UserPrefDef({
                            name: "npref",
                            type: "text",
                            default: "other"
                        });
                        this.preferenceList = [PREF];
                        this.preferences = {"npref": PREF};
                        this.missing = false;
                    }
                    this.propertyList = [];
                    this.properties = {};

                    this.inputList = [];
                    this.outputList = [];
                });
            });

            it("throws an exception when passing an invalid meta", () => {

                const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {
                    id: "1"
                });
                expect(() => {
                    operator.upgrade(null);
                }).toThrowError(TypeError);

            });

            it("save operator meta changes into the server (upgrade)", (done) => {

                const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {
                    id: "1"
                });

                const new_meta = new Wirecloud.wiring.OperatorMeta();
                new_meta.version.compareTo.and.returnValue(1);
                const p = operator.upgrade(new_meta);
                p.then(
                    (value) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        expect(operator.meta).toBe(new_meta);
                        expect(operator.preferences.npref).toEqual(jasmine.any(Wirecloud.UserPref));
                        expect(operator.preferences.npref.value).toBe("upgraded value");
                        expect(operator.preferences.pref).toBe(undefined);
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );

            });

            it("save operator meta changes into the server (downgrade)", (done) => {

                const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {
                    id: "1"
                });

                const new_meta = new Wirecloud.wiring.OperatorMeta();
                new_meta.version.compareTo.and.returnValue(-1);
                const p = operator.upgrade(new_meta);
                p.then(
                    (value) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        expect(operator.meta).toBe(new_meta);
                        expect(operator.preferences.npref).toEqual(jasmine.any(Wirecloud.UserPref));
                        expect(operator.preferences.npref.value).toBe("upgraded value");
                        expect(operator.preferences.pref).toBe(undefined);
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );

            });

            it("save operator meta changes into the server (replace)", (done) => {

                const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {
                    id: "1"
                });

                const new_meta = new Wirecloud.wiring.OperatorMeta();
                new_meta.version.compareTo.and.returnValue(0);
                const p = operator.upgrade(new_meta);
                p.then(
                    (value) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        expect(operator.meta).toBe(new_meta);
                        expect(operator.preferences.npref).toEqual(jasmine.any(Wirecloud.UserPref));
                        expect(operator.preferences.npref.value).toBe("upgraded value");
                        expect(operator.preferences.pref).toBe(undefined);
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );

            });

            it("allows switching to missing state", (done) => {

                const operator = new Wirecloud.wiring.Operator(WIRING, OPERATOR_META, {
                    id: "1"
                });

                const MISSING_OPERATOR_META = new Wirecloud.wiring.OperatorMeta(true);
                const p = operator.upgrade(MISSING_OPERATOR_META);
                p.then(
                    (value) => {
                        expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                        expect(operator.meta).toBe(MISSING_OPERATOR_META);
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );

            });

            it("handle error saving meta change into the server", (done) => {

                const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {
                    id: "1"
                });
                Wirecloud.io.makeRequest.and.callFake(function (url, options) {
                    // TODO
                    // expect(options.method).toEqual("PATCH");
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 201
                        });
                    });
                });

                const p = operator.upgrade(new Wirecloud.wiring.OperatorMeta());
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

            it("handle error requesting new variable values", (done) => {

                const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {
                    id: "1"
                });

                failOnVariables = true;

                const new_meta = new Wirecloud.wiring.OperatorMeta();
                new_meta.version.compareTo.and.returnValue(0);
                const p = operator.upgrade(new_meta);
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });

            it("handle invalid response content while requesting new variable values", (done) => {

                const operator = new Wirecloud.wiring.Operator(WIRING, EMPTY_OPERATOR_META, {
                    id: "1"
                });

                failOnVariables = "invalid";

                const new_meta = new Wirecloud.wiring.OperatorMeta();
                new_meta.version.compareTo.and.returnValue(0);
                const p = operator.upgrade(new_meta);
                p.then(
                    (value) => {
                        fail("success callback called");
                    },
                    (error) => {
                        expect(Wirecloud.io.makeRequest).toHaveBeenCalled();
                        done();
                    }
                );

            });
        });
    });

})();
