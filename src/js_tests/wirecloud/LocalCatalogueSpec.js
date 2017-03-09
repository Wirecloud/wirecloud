/*
 *     Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

    describe("LocalCatalogue", () => {

        afterEach(() => {
            if (Wirecloud.contextManager != null) {
                delete Wirecloud.contextManager;
            }
        });

        describe("addComponent(options)", function () {

            beforeEach(function (done) {
                setup(done);
            });

            it("should ignore already installed components", (done) => {
                spyOn(Wirecloud.WirecloudCatalogue.prototype, 'addComponent').and.callFake(function () {
                    return new Wirecloud.Task("", (resolve) => {
                        resolve({
                            type: "widget",
                            vendor: "Wirecloud",
                            name: "Test",
                            version: "1.0"
                        });
                    });
                });

                Wirecloud.LocalCatalogue.addComponent().then(
                    () => {
                        expect(Wirecloud.LocalCatalogue.resources).toEqual({
                            "Wirecloud/OtherWidget/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/2.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/TestMashup/1.0": jasmine.any(Wirecloud.MashableApplicationComponent),
                            "Wirecloud/TestOperator/1.0": jasmine.any(Wirecloud.wiring.OperatorMeta)
                        });
                        expect(Wirecloud.LocalCatalogue.resourceVersions).toEqual({
                            "Wirecloud/OtherWidget": [jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/Test": [jasmine.any(Wirecloud.WidgetMeta), jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/TestOperator": [jasmine.any(Wirecloud.wiring.OperatorMeta)],
                            "Wirecloud/TestMashup": [jasmine.any(Wirecloud.MashableApplicationComponent)]
                        });
                        done();
                    },
                    (error) => {
                    }
                );
            });

            it("should works when installing embedded components", (done) => {
                spyOn(Wirecloud.WirecloudCatalogue.prototype, 'addComponent').and.callFake(function (options) {

                    expect(options.install_embedded_resources).toBe(true);

                    return new Wirecloud.Task("", (resolve) => {
                        resolve({
                            resource_details: {
                                type: "mashup",
                                vendor: "Wirecloud",
                                name: "TestMashup",
                                version: "2.0"
                            },
                            extra_resources: [
                                {
                                    type: "widget",
                                    vendor: "Wirecloud",
                                    name: "Test",
                                    version: "3.0"
                                }
                            ]
                        });
                    });
                });

                Wirecloud.LocalCatalogue.addComponent({
                    install_embedded_resources: true
                }).then(
                    () => {
                        expect(Wirecloud.LocalCatalogue.resources).toEqual({
                            "Wirecloud/OtherWidget/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/2.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/3.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/TestMashup/1.0": jasmine.any(Wirecloud.MashableApplicationComponent),
                            "Wirecloud/TestMashup/2.0": jasmine.any(Wirecloud.MashableApplicationComponent),
                            "Wirecloud/TestOperator/1.0": jasmine.any(Wirecloud.wiring.OperatorMeta)
                        });
                        expect(Wirecloud.LocalCatalogue.resourceVersions).toEqual({
                            "Wirecloud/OtherWidget": [jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/Test": [jasmine.any(Wirecloud.WidgetMeta), jasmine.any(Wirecloud.WidgetMeta), jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/TestMashup": [jasmine.any(Wirecloud.MashableApplicationComponent), jasmine.any(Wirecloud.MashableApplicationComponent)],
                            "Wirecloud/TestOperator": [jasmine.any(Wirecloud.wiring.OperatorMeta)]
                        });
                        done();
                    },
                    (error) => {
                    }
                );
            });

        });

        describe("deleteResource", () => {

            beforeEach(function (done) {
                setup(done);
            });

            it("delete widgets", (done) => {
                var component = Wirecloud.LocalCatalogue.resources["Wirecloud/Test/1.0"];

                spyOn(Wirecloud.WirecloudCatalogue.prototype, "deleteResource").and.callFake(function () {
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({affectedVersions: ["1.0"]});
                    });
                });

                var t = Wirecloud.LocalCatalogue.deleteResource(component);
                expect(t).toEqual(jasmine.any(Wirecloud.Task));
                t.then(
                    () => {
                        expect(Wirecloud.LocalCatalogue.resources).toEqual({
                            "Wirecloud/OtherWidget/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/2.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/TestMashup/1.0": jasmine.any(Wirecloud.MashableApplicationComponent),
                            "Wirecloud/TestOperator/1.0": jasmine.any(Wirecloud.wiring.OperatorMeta)
                        });
                        expect(Wirecloud.LocalCatalogue.resourceVersions).toEqual({
                            "Wirecloud/OtherWidget": [jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/Test": [jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/TestMashup": [jasmine.any(Wirecloud.MashableApplicationComponent)],
                            "Wirecloud/TestOperator": [jasmine.any(Wirecloud.wiring.OperatorMeta)]
                        });
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );
            });


        });

        describe("getResourceId", () => {

            beforeEach(function (done) {
                setup(done);
            });

            it("is a shortcut", () => {
                var id = "Wirecloud/Test/1.0";
                expect(Wirecloud.LocalCatalogue.getResourceId(id))
                    .toBe(Wirecloud.LocalCatalogue.resources[id]);
            });

        });

        describe("getResource", () => {

            beforeEach(function (done) {
                setup(done);
            });

            it("is a shortcut", () => {
                var id = "Wirecloud/Test/1.0";
                expect(Wirecloud.LocalCatalogue.getResource("Wirecloud", "Test", "1.0"))
                    .toBe(Wirecloud.LocalCatalogue.resources[id]);
            });

        });

        describe("hasAlternativeVersion(component)", () => {

            beforeEach(function (done) {
                setup(done);
            });

            it("returns false for unavaliable components", () => {
                var component = {
                    vendor: "MyVendor",
                    name: "MyName",
                    group_id: "MyVendor/MyName",
                    version: new Wirecloud.Version("1.0")
                };
                expect(Wirecloud.LocalCatalogue.hasAlternativeVersion(component))
                    .toBe(false);
            });

            it("returns false when searching an alternative version for the only available version", () => {
                var component = Wirecloud.LocalCatalogue.resources["Wirecloud/TestOperator/1.0"];
                expect(Wirecloud.LocalCatalogue.hasAlternativeVersion(component))
                    .toBe(false);
            });

            it("returns true if there is an available version of a missing component", () => {
                var component = {
                    vendor: "Wirecloud",
                    name: "TestOperator",
                    group_id: "Wirecloud/TestOperator",
                    version: new Wirecloud.Version("0.9"),
                    missing: true
                };
                expect(Wirecloud.LocalCatalogue.hasAlternativeVersion(component))
                    .toBe(true);
            });

            it("returns true if there are alternative versions for an existing component", () => {
                var component = {
                    vendor: "Wirecloud",
                    name: "Test",
                    group_id: "Wirecloud/Test",
                    version: new Wirecloud.Version("1.0")
                };
                expect(Wirecloud.LocalCatalogue.hasAlternativeVersion(component))
                    .toBe(true);
            });

        });

        describe("reload()", () => {

            it("load initial components for logged users", (done) => {
                var widgetdata = {
                    "type": "widget",
                    "vendor": "Wirecloud",
                    "name": "Test",
                    "version": "1.0"
                };

                mock_meta(Wirecloud, "WidgetMeta");
                Wirecloud.contextManager = {
                    "get": jasmine.createSpy("get").and.callFake((name) => {
                        switch (name) {
                        case "isanonymous":
                            return false;
                        };
                    })
                };
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    expect(url).toBe(Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION);
                    return new Wirecloud.Task("request", (resolve) => {
                        resolve({
                            responseText: JSON.stringify({
                                "Wirecloud/Test/1.0": widgetdata
                            })
                        });
                    });
                });

                var p = Wirecloud.LocalCatalogue.reload();
                p.then(
                    () => {
                        expect(Wirecloud.LocalCatalogue.resources).toEqual({
                            "Wirecloud/Test/1.0": jasmine.any(Wirecloud.WidgetMeta)
                        });
                        expect(Wirecloud.LocalCatalogue.resourceVersions).toEqual({
                            "Wirecloud/Test": [jasmine.any(Wirecloud.WidgetMeta)]
                        });
                        done();
                    },
                    (error) => {
                        fail("error listener called");
                    }
                );
            });

            it("ignores invalid components", (done) => {
                var operatordata = {
                    "type": "operator",
                    "vendor": "Wirecloud",
                    "name": "TestOperator",
                    "version": "1.0"
                };
                var invalidcomponent = {
                    "type": "invalid"
                };

                mock_meta(Wirecloud.wiring, "OperatorMeta");
                Wirecloud.contextManager = {
                    "get": jasmine.createSpy("get").and.callFake((name) => {
                        switch (name) {
                        case "isanonymous":
                            return false;
                        };
                    })
                };
                spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
                    expect(url).toBe(Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION);
                    return new Wirecloud.Task("request", (resolve) => {
                        resolve({
                            responseText: JSON.stringify({
                                "Wirecloud/Test/1.0": invalidcomponent,
                                "Wirecloud/TestOperator/1.0": operatordata
                            })
                        });
                    });
                });

                var p = Wirecloud.LocalCatalogue.reload();
                p.then(
                    () => {
                        expect(Wirecloud.LocalCatalogue.resources).toEqual({
                            "Wirecloud/TestOperator/1.0": jasmine.any(Wirecloud.wiring.OperatorMeta)
                        });
                        expect(Wirecloud.LocalCatalogue.resourceVersions).toEqual({
                            "Wirecloud/TestOperator": [jasmine.any(Wirecloud.wiring.OperatorMeta)]
                        });
                        done();
                    },
                    (error) => {
                        fail("error listener called");
                    }
                );
            });

            it("doesn't make requests for anonymous users", (done) => {
                spyOn(Wirecloud.io, 'makeRequest');
                Wirecloud.contextManager = {
                    "get": jasmine.createSpy("get").and.callFake((name) => {
                        switch (name) {
                        case "isanonymous":
                            return true;
                        };
                    })
                };

                var p = Wirecloud.LocalCatalogue.reload();
                p.then(
                    () => {
                        expect(Wirecloud.LocalCatalogue.resources).toEqual({});
                        expect(Wirecloud.LocalCatalogue.resourceVersions).toEqual({});
                        expect(Wirecloud.io.makeRequest).not.toHaveBeenCalled();
                        done();
                    },
                    (error) => {
                        fail("error listener called");
                    }
                );
            });

        });

        describe("resourceExists", () => {

            beforeEach(function (done) {
                setup(done);
            });

            it("return true for existing components", () => {
                expect(Wirecloud.LocalCatalogue.resourceExists({
                    vendor: "Wirecloud",
                    name: "Test",
                    version: "1.0"
                })).toBe(true);
            });

            it("return false for missing components", () => {
                expect(Wirecloud.LocalCatalogue.resourceExists({
                    vendor: "Wirecloud",
                    name: "MyWidget",
                    version: "1.0"
                })).toBe(false);
            });

        });

        describe("resourceExistsId", () => {

            beforeEach(function (done) {
                setup(done);
            });

            it("return true for existings components", () => {
                expect(Wirecloud.LocalCatalogue.resourceExistsId("Wirecloud/Test/1.0"))
                    .toBe(true);
            });

            it("return false for missing components", () => {
                expect(Wirecloud.LocalCatalogue.resourceExistsId("Wirecloud/MyWidget/1.0"))
                    .toBe(false);
            });

        });

        describe("uninstallResource(component[, options])", function () {

            beforeEach(function (done) {
                setup(done);
            });

            it("throws a TypeError exception if not passing the component parameter", () => {
                expect(() => {
                    Wirecloud.LocalCatalogue.uninstallResource();
                }).toThrowError(TypeError);
            });

            it("uninstall widgets", (done) => {
                var component = Wirecloud.LocalCatalogue.resources["Wirecloud/Test/1.0"];

                spyOn(Wirecloud.URLs.LOCAL_RESOURCE_ENTRY, "evaluate");
                Wirecloud.io.makeRequest.and.callFake(function () {
                    expect(Wirecloud.URLs.LOCAL_RESOURCE_ENTRY.evaluate).toHaveBeenCalledWith({
                        vendor: "Wirecloud",
                        name: "Test",
                        version: "1.0"
                    });
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 200,
                            responseText: '{}'
                        });
                    });
                });

                var t = Wirecloud.LocalCatalogue.uninstallResource(component);
                expect(t).toEqual(jasmine.any(Wirecloud.Task));
                t.then(
                    () => {
                        expect(Wirecloud.LocalCatalogue.resources).toEqual({
                            "Wirecloud/OtherWidget/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/2.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/TestMashup/1.0": jasmine.any(Wirecloud.MashableApplicationComponent),
                            "Wirecloud/TestOperator/1.0": jasmine.any(Wirecloud.wiring.OperatorMeta)
                        });
                        expect(Wirecloud.LocalCatalogue.resourceVersions).toEqual({
                            "Wirecloud/OtherWidget": [jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/Test": [jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/TestMashup": [jasmine.any(Wirecloud.MashableApplicationComponent)],
                            "Wirecloud/TestOperator": [jasmine.any(Wirecloud.wiring.OperatorMeta)]
                        });
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );
            });

            it("uninstall last widget version", (done) => {
                var component = Wirecloud.LocalCatalogue.resources["Wirecloud/OtherWidget/1.0"];

                spyOn(Wirecloud.URLs.LOCAL_RESOURCE_ENTRY, "evaluate");
                Wirecloud.io.makeRequest.and.callFake(function () {
                    expect(Wirecloud.URLs.LOCAL_RESOURCE_ENTRY.evaluate).toHaveBeenCalledWith({
                        vendor: "Wirecloud",
                        name: "OtherWidget",
                        version: "1.0"
                    });
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 200,
                            responseText: '{}'
                        });
                    });
                });

                var t = Wirecloud.LocalCatalogue.uninstallResource(component);
                expect(t).toEqual(jasmine.any(Wirecloud.Task));
                t.then(
                    () => {
                        expect(Wirecloud.LocalCatalogue.resources).toEqual({
                            "Wirecloud/Test/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/2.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/TestMashup/1.0": jasmine.any(Wirecloud.MashableApplicationComponent),
                            "Wirecloud/TestOperator/1.0": jasmine.any(Wirecloud.wiring.OperatorMeta)
                        });
                        expect(Wirecloud.LocalCatalogue.resourceVersions).toEqual({
                            "Wirecloud/Test": [jasmine.any(Wirecloud.WidgetMeta), jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/TestMashup": [jasmine.any(Wirecloud.MashableApplicationComponent)],
                            "Wirecloud/TestOperator": [jasmine.any(Wirecloud.wiring.OperatorMeta)]
                        });
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );
            });

            it("uninstall all widget versions", (done) => {
                var component = Wirecloud.LocalCatalogue.resources["Wirecloud/Test/1.0"];

                spyOn(Wirecloud.URLs.LOCAL_UNVERSIONED_RESOURCE_ENTRY, "evaluate");
                Wirecloud.io.makeRequest.and.callFake(function () {
                    expect(Wirecloud.URLs.LOCAL_UNVERSIONED_RESOURCE_ENTRY.evaluate).toHaveBeenCalledWith({
                        vendor: "Wirecloud",
                        name: "Test"
                    });
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 200,
                            responseText: '{"affectedVersions": ["1.0", "2.0"]}'
                        });
                    });
                });

                var t = Wirecloud.LocalCatalogue.uninstallResource(component, {allversions: true});
                expect(t).toEqual(jasmine.any(Wirecloud.Task));
                t.then(
                    () => {
                        expect(Wirecloud.LocalCatalogue.resources).toEqual({
                            "Wirecloud/OtherWidget/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/TestMashup/1.0": jasmine.any(Wirecloud.MashableApplicationComponent),
                            "Wirecloud/TestOperator/1.0": jasmine.any(Wirecloud.wiring.OperatorMeta)
                        });
                        expect(Wirecloud.LocalCatalogue.resourceVersions).toEqual({
                            "Wirecloud/OtherWidget": [jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/TestMashup": [jasmine.any(Wirecloud.MashableApplicationComponent)],
                            "Wirecloud/TestOperator": [jasmine.any(Wirecloud.wiring.OperatorMeta)]
                        });
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );
            });

            it("uninstall operators", (done) => {
                var component = Wirecloud.LocalCatalogue.resources["Wirecloud/TestOperator/1.0"];

                spyOn(Wirecloud.URLs.LOCAL_RESOURCE_ENTRY, "evaluate");
                Wirecloud.io.makeRequest.and.callFake(function () {
                    expect(Wirecloud.URLs.LOCAL_RESOURCE_ENTRY.evaluate).toHaveBeenCalledWith({
                        vendor: "Wirecloud",
                        name: "TestOperator",
                        version: "1.0"
                    });
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 200,
                            responseText: '{}'
                        });
                    });
                });

                var t = Wirecloud.LocalCatalogue.uninstallResource(component);
                expect(t).toEqual(jasmine.any(Wirecloud.Task));
                t.then(
                    () => {
                        expect(Wirecloud.LocalCatalogue.resources).toEqual({
                            "Wirecloud/OtherWidget/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/2.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/TestMashup/1.0": jasmine.any(Wirecloud.MashableApplicationComponent)
                        });
                        expect(Wirecloud.LocalCatalogue.resourceVersions).toEqual({
                            "Wirecloud/OtherWidget": [jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/Test": [jasmine.any(Wirecloud.WidgetMeta), jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/TestMashup": [jasmine.any(Wirecloud.MashableApplicationComponent)]
                        });
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );
            });

            it("uninstall mashups", (done) => {
                var component = Wirecloud.LocalCatalogue.resources["Wirecloud/TestMashup/1.0"];

                spyOn(Wirecloud.URLs.LOCAL_RESOURCE_ENTRY, "evaluate");
                Wirecloud.io.makeRequest.and.callFake(function () {
                    expect(Wirecloud.URLs.LOCAL_RESOURCE_ENTRY.evaluate).toHaveBeenCalledWith({
                        vendor: "Wirecloud",
                        name: "TestMashup",
                        version: "1.0"
                    });
                    return new Wirecloud.Task("Sending request", function (resolve) {
                        resolve({
                            status: 200,
                            responseText: '{}'
                        });
                    });
                });

                var t = Wirecloud.LocalCatalogue.uninstallResource(component);
                expect(t).toEqual(jasmine.any(Wirecloud.Task));
                t.then(
                    () => {
                        expect(Wirecloud.LocalCatalogue.resources).toEqual({
                            "Wirecloud/OtherWidget/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/1.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/Test/2.0": jasmine.any(Wirecloud.WidgetMeta),
                            "Wirecloud/TestOperator/1.0": jasmine.any(Wirecloud.wiring.OperatorMeta)
                        });
                        expect(Wirecloud.LocalCatalogue.resourceVersions).toEqual({
                            "Wirecloud/OtherWidget": [jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/Test": [jasmine.any(Wirecloud.WidgetMeta), jasmine.any(Wirecloud.WidgetMeta)],
                            "Wirecloud/TestOperator": [jasmine.any(Wirecloud.wiring.OperatorMeta)]
                        });
                        done();
                    },
                    (error) => {
                        fail("error callback called");
                    }
                );
            });

            describe("calls reject on unexepected responses", () => {

                var test = (status) => {
                    return (done) => {
                        var component = Wirecloud.LocalCatalogue.resources["Wirecloud/OtherWidget/1.0"];

                        spyOn(Wirecloud.URLs.LOCAL_RESOURCE_ENTRY, "evaluate");
                        Wirecloud.io.makeRequest.and.callFake(function () {
                            expect(Wirecloud.URLs.LOCAL_RESOURCE_ENTRY.evaluate).toHaveBeenCalledWith({
                                vendor: "Wirecloud",
                                name: "OtherWidget",
                                version: "1.0"
                            });
                            return new Wirecloud.Task("Sending request", function (resolve) {
                                resolve({
                                    status: status,
                                    responseText: "response from other server"
                                });
                            });
                        });

                        var t = Wirecloud.LocalCatalogue.uninstallResource(component);

                        expect(t).toEqual(jasmine.any(Wirecloud.Task));
                        t.catch((error) => {
                            done();
                        });
                    };
                };

                it("200 (invalid response body)", test(200));
                it("201", test(201));
                it("204", test(204));
                it("422", test(422));
            });
        });

    });

    var setup = function setup(done) {
        var operatordata = {
            "type": "operator",
            "vendor": "Wirecloud",
            "name": "TestOperator",
            "version": "1.0"
        };
        var widget1data = {
            "type": "widget",
            "vendor": "Wirecloud",
            "name": "Test",
            "version": "1.0"
        };
        var widget2data = {
            "type": "widget",
            "vendor": "Wirecloud",
            "name": "Test",
            "version": "2.0"
        };
        var widget3data = {
            "type": "widget",
            "vendor": "Wirecloud",
            "name": "OtherWidget",
            "version": "1.0"
        };
        var mashupdata = {
            "type": "mashup",
            "vendor": "Wirecloud",
            "name": "TestMashup",
            "version": "1.0"
        };

        mock_meta(Wirecloud, "MashableApplicationComponent");
        mock_meta(Wirecloud, "WidgetMeta");
        mock_meta(Wirecloud.wiring, "OperatorMeta");
        Wirecloud.contextManager = {
            "get": jasmine.createSpy("get").and.callFake((name) => {
                switch (name) {
                case "isanonymous":
                    return false;
                };
            })
        };
        spyOn(Wirecloud.io, "makeRequest").and.callFake((url, options) => {
            expect(url).toBe(Wirecloud.URLs.LOCAL_RESOURCE_COLLECTION);
            return new Wirecloud.Task("request", (resolve) => {
                resolve({
                    responseText: JSON.stringify({
                        "Wirecloud/OtherWidget/1.0": widget3data,
                        "Wirecloud/Test/1.0": widget1data,
                        "Wirecloud/Test/2.0": widget2data,
                        "Wirecloud/TestMashup/1.0": mashupdata,
                        "Wirecloud/TestOperator/1.0": operatordata
                    })
                });
            });
        });

        Wirecloud.workspaceInstances = {
            "1": {
                widgets: [],
                wiring: {
                    operators: []
                },
                resources: {
                    remove: jasmine.createSpy("remove")
                }
            }
        };
        Wirecloud.LocalCatalogue.reload().then(done);
    };

    var mock_meta = function mock_meta(object, name) {
        object[name] = jasmine.createSpy(name).and.callFake(function (data) {
            this.type = data.type;
            this.vendor = data.vendor;
            this.name = data.name;
            this.version = new Wirecloud.Version(data.version);
            this.group_id = data.vendor + '/' + data.name;
            this.is = function (other) {
                return this === other;
            };
            Object.freeze(this);
        });
    };

})();
