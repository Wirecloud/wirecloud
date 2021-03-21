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

/* globals Wirecloud */


(function () {

    "use strict";

    describe("Wirecloud.Preferences", () => {

        beforeAll(() => {
            // TODO
            Wirecloud.PlatformPref = jasmine.createSpy("PlatformPref").and.callFake(function () {
                this.getEffectiveValue = jasmine.createSpy("getEffectiveValue");
                this.meta = {
                    options: {}
                };
            });
            Wirecloud.ui.InputInterfaceFactory = jasmine.createSpy("InputInterfaceFactory");
            Wirecloud.ui.InputInterfaceFactory.stringify = jasmine.createSpy("stringify");
        });

        afterAll(() => {
            delete Wirecloud.PlatformPref;
            delete Wirecloud.ui.InputInterfaceFactory;
        });

        describe("new Preferences(preferencesDef[, values])", () => {

            it("requires the preferencesDef parameter", () => {
                expect(() => {
                    new Wirecloud.Preferences();
                }).toThrowError(TypeError);
            });

            it("should work by providing only the preferencesDef parameter", () => {
                const preferencesDef = {
                    "preferences": {
                        "onepref": {
                            "name": "onepref",
                            "inheritByDefault": false
                        }
                    }
                };

                const preferences = new Wirecloud.Preferences(preferencesDef);

                expect(preferences.meta).toBe(preferencesDef);
                expect(preferences.preferences).toEqual({
                    "onepref": jasmine.any(Wirecloud.PlatformPref)
                });
            });

            it("should work also when providing initial values", () => {
                const preferencesDef = {
                    "preferences": {
                        "onepref": {
                            "name": "onepref",
                            "inheritByDefault": true
                        },
                        "anotherpref": {
                            "name": "anotherpref",
                            "inheritByDefault": false
                        }
                    }
                };
                const initial_values = {
                    "onepref": {
                        "inherit": false,
                        "value": 5
                    },
                    "extravalue": {
                        "inherit": true,
                        "value": 20
                    }
                };

                const preferences = new Wirecloud.Preferences(preferencesDef, initial_values);

                expect(preferences.meta).toBe(preferencesDef);
                expect(preferences.preferences).toEqual({
                    "onepref": jasmine.any(Wirecloud.PlatformPref),
                    "anotherpref": jasmine.any(Wirecloud.PlatformPref)
                });
            });

        });

        describe("get(name)", () => {

            let preferences;

            beforeEach(() => {
                const preferencesDef = {
                    "preferences": {
                        "onepref": {
                            "name": "onepref",
                            "inheritByDefault": true
                        },
                        "anotherpref": {
                            "name": "anotherpref",
                            "inheritByDefault": false
                        }
                    }
                };
                const initial_values = {
                    "onepref": {
                        "inherit": false,
                        "value": 5
                    }
                };

                preferences = new Wirecloud.Preferences(preferencesDef, initial_values);
            });

            it("should return the effective value", () => {
                preferences.preferences.onepref.getEffectiveValue.and.returnValue(5);
                expect(preferences.get("onepref")).toBe(5);
            });

            it("should return undefined if the preference does not exist", () => {
                expect(preferences.get("invalidname")).toBe(undefined);
            });

        });

        describe("set(changes)", () => {

            let preferences;

            beforeEach(() => {
                const preferencesDef = {
                    "preferences": {
                        "onepref": {
                            "name": "onepref",
                            "inheritByDefault": true
                        },
                        "anotherpref": {
                            "name": "anotherpref",
                            "inheritByDefault": false
                        },
                        "mypref": {
                            "name": "mypref",
                            "inheritByDefault": false
                        }
                    }
                };
                const initial_values = {
                    "onepref": {
                        "inherit": false,
                        "value": 5
                    },
                    "mypref": {
                        "inherit": true,
                        "value": "text"
                    }
                };

                preferences = new Wirecloud.Preferences(preferencesDef, initial_values);
                preferences._build_save_url = () => {return "https://example.com/path";};
            });

            it("should do nothing if there are no changes", (done) => {
                const listener1 = jasmine.createSpy("listener1");
                preferences.addEventListener("pre-commit", listener1);
                const listener2 = jasmine.createSpy("listener2");
                preferences.addEventListener("post-commit", listener2);
                preferences.preferences.onepref.value = 5;

                const t = preferences.set({
                    "onepref": {
                        "value": 5
                    }
                });

                t.then(
                    () => {
                        expect(listener1).not.toHaveBeenCalled();
                        expect(listener2).not.toHaveBeenCalled();
                    },
                    fail
                ).finally(done);
            });

            it("should update preferences on the server", (done) => {
                spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                    return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: 204});});
                });
                const listener1 = jasmine.createSpy("listener1");
                preferences.addEventListener("pre-commit", listener1);
                const listener2 = jasmine.createSpy("listener2");
                preferences.addEventListener("post-commit", listener2);
                preferences.preferences.onepref.value = 5;
                preferences.preferences.onepref.getEffectiveValue.and.returnValues(5, 20);
                Wirecloud.ui.InputInterfaceFactory.stringify.and.returnValue("20");
                preferences.preferences.anotherpref.inherit = false;
                preferences.preferences.mypref.inherit = true;
                preferences.preferences.mypref.value = "text";
                preferences.preferences.mypref.getEffectiveValue.and.returnValue("inheritedtext");

                const t = preferences.set({
                    "onepref": {
                        "value": 20
                    },
                    "anotherpref": {
                        "inherit": true
                    },
                    "mypref": {
                        "inherit": true,
                        "value": "text"
                    }
                });

                t.then(
                    () => {
                        expect(listener1).toHaveBeenCalledWith(preferences, {"onepref": {"value": "20"}, "anotherpref": {"inherit": true}});
                        expect(listener2).toHaveBeenCalledWith(preferences, {"onepref": 20});
                    },
                    fail
                ).finally(done);
            });

            describe("should handle errors from server", () => {
                const test = function test(statuscode) {
                    it("(" + statuscode + ")", (done) => {
                        spyOn(Wirecloud.io, "makeRequest").and.callFake(function (url, options) {
                            return new Wirecloud.Task("Sending request", (resolve) => {resolve({status: statuscode});});
                        });
                        const listener1 = jasmine.createSpy("listener1");
                        preferences.addEventListener("pre-commit", listener1);
                        const listener2 = jasmine.createSpy("listener2");
                        preferences.addEventListener("post-commit", listener2);
                        preferences.preferences.onepref.value = 5;
                        preferences.preferences.onepref.getEffectiveValue.and.returnValues(5, 20);
                        Wirecloud.ui.InputInterfaceFactory.stringify.and.returnValue("20");

                        const t = preferences.set({
                            "onepref": {
                                "value": 20
                            }
                        });

                        t.then(
                            fail,
                            () => {
                                expect(listener1).toHaveBeenCalled();
                                expect(listener2).not.toHaveBeenCalled();
                            }
                        ).finally(done);
                    });
                };

                // Error codes that are used by the API
                test(401);
                test(403);
                test(422);
                test(500);

                // Other error codes
                test(200);
                test(404);
                test(409);
            });

        });

        describe("_handleParentChanges(parentPreferences, modifiedValues)", () => {

            let preferences;

            beforeEach(() => {
                const preferencesDef = {
                    "preferences": {
                        "onepref": {
                            "name": "onepref",
                            "inheritByDefault": true
                        },
                        "anotherpref": {
                            "name": "anotherpref",
                            "inheritByDefault": false
                        },
                        "mypref": {
                            "name": "mypref",
                            "inheritByDefault": false
                        }
                    }
                };
                const initial_values = {
                    "onepref": {
                        "inherit": false,
                        "value": 5
                    },
                    "mypref": {
                        "inherit": true,
                        "value": "text"
                    }
                };

                preferences = new Wirecloud.Preferences(preferencesDef, initial_values);
                preferences._build_save_url = () => {return "https://example.com/path";};
            });

            it("does nothing if the updated preferences are unrelated", () => {
                const listener1 = jasmine.createSpy("listener1");
                preferences.addEventListener("pre-commit", listener1);
                const listener2 = jasmine.createSpy("listener2");
                preferences.addEventListener("post-commit", listener2);

                preferences._handleParentChanges("notused", {"onepref2": 25});

                expect(listener1).not.toHaveBeenCalled();
                expect(listener2).not.toHaveBeenCalled();
            });

            it("does nothing when changing related preferences but that are currently not inherited", () => {
                const listener1 = jasmine.createSpy("listener1");
                preferences.addEventListener("pre-commit", listener1);
                const listener2 = jasmine.createSpy("listener2");
                preferences.addEventListener("post-commit", listener2);

                preferences._handleParentChanges("notused", {"onepref": 25});

                expect(listener1).not.toHaveBeenCalled();
                expect(listener2).not.toHaveBeenCalled();
            });

            it("propagates changes into the inherited preferences", () => {
                const listener1 = jasmine.createSpy("listener1");
                preferences.addEventListener("pre-commit", listener1);
                const listener2 = jasmine.createSpy("listener2");
                preferences.addEventListener("post-commit", listener2);
                preferences.preferences.mypref.inherit = true;

                preferences._handleParentChanges("notused", {"onepref": 25, "mypref": "newtext"});

                expect(listener1).not.toHaveBeenCalled();
                expect(listener2).toHaveBeenCalledWith(preferences, {"mypref": "newtext"});
            });

        });

    });

})();

