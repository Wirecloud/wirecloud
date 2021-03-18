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

    describe("WirecloudCatalogue", () => {

        describe("WirecloudCatalogue(options)", () => {

            it("options parameter is optional", () => {
                const catalogue = new ns.WirecloudCatalogue();
                expect(catalogue.url).toBe(ns.URLs.LOCAL_REPOSITORY);
            });

            it("all options are optional", () => {
                const catalogue = new ns.WirecloudCatalogue();
                expect(catalogue.url).toBe(ns.URLs.LOCAL_REPOSITORY);
            });

            it("url is taken as root", () => {
                const catalogue = new ns.WirecloudCatalogue({
                    url: "http://server.com"
                });
                expect(catalogue.url).toBe("http://server.com/");
            });

            it("url is taken as root", () => {
                const catalogue = new ns.WirecloudCatalogue({
                    url: "http://server.com/"
                });
                expect(catalogue.url).toBe("http://server.com/");
            });
        });

        describe("isAllow(action)", () => {

            let catalogue;

            beforeEach(() => {
                catalogue = new ns.WirecloudCatalogue({
                    permissions: {
                        'delete': true,
                        'other': false
                    }
                });
            });

            it("undefined permission", () => {
                expect(catalogue.isAllow("undefined")).toBe(false);
            });

            it("defined permission (true)", () => {
                expect(catalogue.isAllow("delete")).toBe(true);
            });

            it("defined permission (false)", () => {
                expect(catalogue.isAllow("other")).toBe(false);
            });

        });

        describe("getResourceDetails(vendor, name)", () => {

            it("should request resource details", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {fullfill({responseText: "{}"});}
                ));
                // TODO needed before adding ResourceDetails to the tested code
                ns.WirecloudCatalogue.ResourceDetails = function () {};

                const t = catalogue.getResourceDetails();

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then((details) => {
                    expect(details).toEqual(jasmine.any(ns.WirecloudCatalogue.ResourceDetails));
                    done();
                });
            });

        });

        describe("addComponent(options)", () => {

            let catalogue;

            beforeEach(() => {
                catalogue = new ns.WirecloudCatalogue();
            });

            it("options parameter is required", () => {
                expect(() => {
                    catalogue.addComponent();
                }).toThrowError(TypeError);
            });

            it("one file, market_endpoint or url option is required", () => {
                expect(() => {
                    catalogue.addComponent({});
                }).toThrowError(TypeError);
            });

            it("market_endpoint option can only be used on the local catalogue", () => {
                catalogue = new ns.WirecloudCatalogue({
                    name: "custom",
                    url: "https://hub.wirecloud.example.com"
                });
                expect(() => {
                    catalogue.addComponent({market_endpoint: {}});
                }).toThrowError(TypeError);
            });

            it("should allow uploading packaged components", (done) => {
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 201, responseText: "{}"});
                    }
                ));
                const file = new File(["foo"], "foo.txt", {
                    type: "text/plain",
                });

                const t = catalogue.addComponent({file: file});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({});
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should allow to import components from external marketplaces", (done) => {
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 201, responseText: "{}"});
                    }
                ));

                const t = catalogue.addComponent({market_endpoint: {}});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({});
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should allow to upload components using a url reference", (done) => {
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 201, responseText: "{}"});
                    }
                ));

                const t = catalogue.addComponent({url: "https://static.example.org/widget.wgt"});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({});
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should allow to upload components to external catalogues", (done) => {
                catalogue = new ns.WirecloudCatalogue({
                    name: "custom",
                    url: "https://hub.wirecloud.example.com"
                });
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 201, responseText: "{}"});
                    }
                ));
                const file = new File(["foo"], "foo.txt", {
                    type: "text/plain",
                });

                const t = catalogue.addComponent({file: file});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({});
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should support the install_embedded_resources option", (done) => {
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 201, responseText: "{}"});
                    }
                ));
                const file = new File(["foo"], "foo.txt", {
                    type: "text/plain",
                });

                const t = catalogue.addComponent({file: file, install_embedded_resources: false});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({});
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should support the force_create option", (done) => {
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 201, responseText: "{}"});
                    }
                ));
                const file = new File(["foo"], "foo.txt", {
                    type: "text/plain",
                });

                const t = catalogue.addComponent({file: file, force_create: true});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({});
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            describe("should manage expected error responses", () => {
                const test = function test(status_code) {
                    return (done) => {
                        const catalogue = new ns.WirecloudCatalogue();
                        spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                            'making request',
                            (fullfill) => {
                                fullfill({status: status_code, responseText: 'Not Found'});
                            }
                        ));

                        const t = catalogue.addComponent({market_endpoint: {}});

                        expect(t).toEqual(jasmine.any(ns.Task));
                        t.then(
                            (response) => {
                                fail('fullfill function called');
                            },
                            (error) => {
                                expect(error).not.toBe(null);
                                done();
                            }
                        );
                    }
                };

                it("400", test(400));
                it("401", test(401));
                it("403", test(403));
                it("409", test(409));
            });

            it("should manage unexpected error codes", (done) => {
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 404, responseText: "Not Found"});
                    }
                ));
                const file = new File(["foo"], "foo.txt", {
                    type: "text/plain",
                });

                const t = catalogue.addComponent({file: file});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        fail('fullfill function called');
                    },
                    (error) => {
                        expect(error).not.toBe(null);
                        done();
                    }
                );
            });

        });

        describe("deleteResource(resource, options)", () => {

            it("should remove current version by default", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: "{}"});
                    }
                ));

                const t = catalogue.deleteResource({
                    vendor: "Wirecloud",
                    name: "MyWidget",
                    version: {
                        text: "0.1"
                    }
                });

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({
                            affectedVersions: ["0.1"]
                        });
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should manage unexpected responses", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 422});
                    }
                ));

                const t = catalogue.deleteResource({
                    vendor: "Wirecloud",
                    name: "MyWidget",
                    version: "0.1"
                });

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    () => {
                        fail('fullfill function called');
                    },
                    (error) => {
                        expect(error).toEqual(jasmine.any(Error));
                        done();
                    }
                );
            });

            it("should manage unexpected responses (invalid payload)", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: "NoJSON"});
                    }
                ));

                const t = catalogue.deleteResource({
                    vendor: "Wirecloud",
                    name: "MyWidget",
                    version: "0.1"
                });

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    () => {
                        fail('fullfill function called');
                    },
                    (error) => {
                        expect(error).toEqual(jasmine.any(Error));
                        done();
                    }
                );
            });

            it("should support removing all versions of the component", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({
                            status: 200,
                            responseText: '{"affectedVersions": ["0.1", "0.2"]}'
                        });
                    }
                ));

                const t = catalogue.deleteResource({
                    vendor: "Wirecloud",
                    name: "MyWidget",
                    version: "0.1"
                }, {
                    allversions: true
                });

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({
                            affectedVersions: ["0.1", "0.2"]
                        });
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

        });

        describe("search(resource, options)", () => {

            it("should allow empty searches", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: '{"results": [], "pagenum": 1, "total": 0}'});
                    }
                ));

                const t = catalogue.search();

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({
                            resources: [],
                            current_page: 1,
                            total_count: 0
                        });
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should support lang option", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.callFake((url, options) => {
                    expect(options.parameters.lang).toBe("es");
                    done();
                    return new Wirecloud.Task("", () => {});
                });

                catalogue.search({lang: "es"});
            });

            it("should support searching by criteria", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: '{"results": [], "pagenum": 1, "total": 0}'});
                    }
                ));

                const t = catalogue.search({search_criteria: "keyword"});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({
                            resources: [],
                            current_page: 1,
                            total_count: 0
                        });
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should support searching by criteria (corrected_query)", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: '{"results": [], "pagenum": 1, "total": 0, "corrected_q": "keyword"}'});
                    }
                ));

                const t = catalogue.search({search_criteria: "keyworkd"});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({
                            resources: [],
                            current_page: 1,
                            total_count: 0,
                            corrected_query: "keyword"
                        });
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should support limiting search scope", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: '{"results": [], "pagenum": 1, "total": 0}'});
                    }
                ));

                const t = catalogue.search({scope: "widget"});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({
                            resources: [],
                            current_page: 1,
                            total_count: 0
                        });
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should validate search scope", () => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: '{"results": [], "pagenum": 1, "total": 0}'});
                    }
                ));

                expect(() => {
                    catalogue.search({scope: "potato"});
                }).toThrowError(TypeError);
            });

            it("should support limiting search results", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: '{"results": [], "pagenum": 1, "total": 0}'});
                    }
                ));

                const t = catalogue.search({maxresults: 50});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({
                            resources: [],
                            current_page: 1,
                            total_count: 0
                        });
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should validate search maxresults", () => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: '{"results": [], "pagenum": 1, "total": 0}'});
                    }
                ));

                expect(() => {
                    catalogue.search({maxresults: "potato"});
                }).toThrowError(TypeError);
            });

            it("should support providing a page offset", (done) => {
                // TODO improve server response
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: '{"results": [], "pagenum": 1, "total": 0}'});
                    }
                ));

                const t = catalogue.search({pagenum: 2});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({
                            resources: [],
                            current_page: 1,
                            total_count: 0
                        });
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should validate pagenum option", () => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: '{"results": [], "pagenum": 1, "total": 0}'});
                    }
                ));

                expect(() => {
                    catalogue.search({pagenum: "potato"});
                }).toThrowError(TypeError);
            });

            it("should support the order_by option", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: '{"results": [], "pagenum": 1, "total": 0}'});
                    }
                ));

                const t = catalogue.search({order_by: "creation_date"});

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        expect(response).toEqual({
                            resources: [],
                            current_page: 1,
                            total_count: 0
                        });
                        done();
                    },
                    () => {
                        fail('reject function called');
                    }
                );
            });

            it("should manage unexpected responses", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 404, responseText: 'Not Found'});
                    }
                ));

                const t = catalogue.search();

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        fail('fullfill function called');
                    },
                    (error) => {
                        expect(error).not.toBe(null);
                        done();
                    }
                );
            });

            describe("should manage expected error responses", () => {
                const test = function test(status_code) {
                    return (done) => {
                        const catalogue = new ns.WirecloudCatalogue();
                        spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                            'making request',
                            (fullfill) => {
                                fullfill({status: status_code, responseText: 'Not Found'});
                            }
                        ));
                        const t = catalogue.search();

                        expect(t).toEqual(jasmine.any(ns.Task));
                        t.then(
                            (response) => {
                                fail('fullfill function called');
                            },
                            (error) => {
                                expect(error).not.toBe(null);
                                done();
                            }
                        );
                    }
                };

                it("401", test(401));
                it("403", test(403));
            });

            it("should manage unexpected responses (invalid payload)", (done) => {
                const catalogue = new ns.WirecloudCatalogue();
                spyOn(ns.io, 'makeRequest').and.returnValue(new ns.Task(
                    'making request',
                    (fullfill) => {
                        fullfill({status: 200, responseText: 'Not Found'});
                    }
                ));

                const t = catalogue.search();

                expect(t).toEqual(jasmine.any(ns.Task));
                t.then(
                    (response) => {
                        fail('fullfill function called');
                    },
                    (error) => {
                        expect(error).not.toBe(null);
                        done();
                    }
                );
            });

        });

    });

})(Wirecloud, StyledElements);
