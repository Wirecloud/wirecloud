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

    const component = {
        "creation_date": "2018-06-06T09:52:14Z",
        "description": "Browse the available entity types of a given Orio context broker server",
        "image": "https://dashboards.opplafy.eu/catalogue/media/CoNWeT/ngsi-type-browser/1.0.4/images/catalogue.png",
        "input_friendcodes": [],
        "name": "ngsi-type-browser",
        "others": ["1.0.3"],
        "output_friendcodes": [],
        "public": false,
        "smartphoneimage": "",
        "template_uri": "CoNWeT_ngsi-type-browser_1.0.4.wgt",
        "title": "NGSI Type browser",
        "type": "widget",
        "uri": "CoNWeT/ngsi-type-browser/1.0.4",
        "vendor": "CoNWeT",
        "vendor_name": "CoNWeT/ngsi-type-browser",
        "version": "1.0.4"
    };
    Object.freeze(component);

    describe("MACSearch(options)", () => {

        beforeAll(() => {
            Wirecloud.contextManager = {
                get: jasmine.createSpy('get').and.returnValue("es")
            };
        });

        beforeEach(() => {
            jasmine.clock().install();
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });

        afterAll(() => {
            if ("contextManager" in Wirecloud) {
                delete Wirecloud.contextManager;
            }
        });

        it("options is required", () => {
            expect(() => {
                new ns.MACSearch();
            }).toThrowError(TypeError);
        });

        it("resourceButtonListener or resource_painter is required", () => {
            expect(() => {
                new ns.MACSearch({});
            }).toThrowError(TypeError);
        });

        it("should work when only passing the resourceButtonListener option", () => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
            expect(element.input).toEqual(jasmine.any(se.TextField));
            expect(element.list).toEqual(jasmine.any(se.Container));
            expect(element.resource_painter).toBe(null);
        });

        it("should work when only passing the resource_painter option", () => {
            const rp = {paint: jasmine.createSpy()};
            const element = new ns.MACSearch({resource_painter: rp});
            expect(element.input).toEqual(jasmine.any(se.TextField));
            expect(element.list).toEqual(jasmine.any(se.Container));
            expect(element.resource_painter).toBe(rp);
        });

        it("supports custom templates", () => {
            // TODO current implementation requires that the root element be the one at index 1
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy(), template: "wirecloud/component_sidebar"});
            expect(element.input).toEqual(jasmine.any(se.TextField));
            expect(element.list).toEqual(jasmine.any(se.Container));
            expect(element.resource_painter).toBe(null);
        });

        it("should search on text input", (done) => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
            spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(
                Promise.resolve({total_count: 1, resources: [Object.assign({}, component)]})
            );

            element.input.value = "keywords";
            jasmine.clock().tick(901);
            jasmine.clock().uninstall();

            setTimeout(() => {
                expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalledWith({scope: '', search_criteria: 'keywords', lang: 'es'});
                expect(element.resource_painter).not.toBe(null);
                done();
            }, 0);
        });

        it("should support searching with custom resource_painter", (done) => {
            const rp = {paint: jasmine.createSpy()};
            const element = new ns.MACSearch({resource_painter: rp});
            const parsed_component = Object.assign({}, component);
            parsed_component.version = new Wirecloud.Version(component.version);
            parsed_component.others = component.others.map((version) => {return new Wirecloud.Version(version);});
            spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(
                Promise.resolve({total_count: 1, resources: [Object.assign({}, component)]})
            );

            element.input.value = "keywords";
            jasmine.clock().tick(901);
            jasmine.clock().uninstall();

            setTimeout(() => {
                expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalledWith({scope: '', search_criteria: 'keywords', lang: 'es'});
                expect(element.resource_painter).toBe(rp);
                expect(element.resource_painter.paint).toHaveBeenCalledWith(parsed_component);
                done();
            }, 0);
        });

        it("should support the resourceButtonTooltip option", (done) => {
            const tooltip = jasmine.createSpy();
            const element = new ns.MACSearch({resourceButtonTooltip: tooltip, resourceButtonListener: jasmine.createSpy()});
            expect(element.resourceButtonTooltip).toBe(tooltip);
            spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(
                Promise.resolve({total_count: 1, resources: [Object.assign({}, component)]})
            );

            element.input.value = "keywords";
            jasmine.clock().tick(901);
            jasmine.clock().uninstall();

            setTimeout(() => {
                expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalledWith({scope: '', search_criteria: 'keywords', lang: 'es'});
                expect(element.resource_painter).not.toBe(null);
                done();
            }, 0);
        });

        it("should handle corrected queries", (done) => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
            spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(
                Promise.resolve({corrected_query: "other", total_count: 1, resources: [Object.assign({}, component)]})
            );
            spyOn(element, "paintInfo");

            element.input.value = "keywords";
            jasmine.clock().tick(901);
            jasmine.clock().uninstall();

            setTimeout(() => {
                expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalledWith({scope: '', search_criteria: 'keywords', lang: 'es'});
                expect(element.resource_painter).not.toBe(null);
                expect(element.paintInfo).toHaveBeenCalled();
                done();
            }, 0);
        });

        it("empty search", (done) => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
            spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(
                Promise.resolve({total_count: 0, resources: []})
            );

            element.input.value = "keywords";
            jasmine.clock().tick(900);
            jasmine.clock().uninstall();

            setTimeout(() => {
                expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalledWith({scope: '', search_criteria: 'keywords', lang: 'es'});
                done();
            }, 0);
        });

        it("should ignore text input on a given time period", (done) => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy(), scope: "widget"});
            spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(
                Promise.resolve({total_count: 0, resources: []})
            );

            element.input.value = "keywords";
            jasmine.clock().tick(320);
            element.input.value = "other";
            jasmine.clock().tick(900);
            jasmine.clock().uninstall();

            setTimeout(() => {
                expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalledWith({scope: 'widget', search_criteria: 'other', lang: 'es'});
                expect(Wirecloud.LocalCatalogue.search.calls.count()).toBe(1);
                done();
            }, 0);
        });

        it("should handle connection errors", () => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
            spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(
                Promise.reject("Error")
            );
            spyOn(element, "paintError");

            element.input.value = "keywords";
            element.input.dispatchEvent("keydown", [], "Enter");

            expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalledWith({scope: '', search_criteria: 'keywords', lang: 'es'});
        });

        it("should handle keydown events", () => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
            spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(
                Promise.reject("Error")
            );

            element.input.dispatchEvent("keydown", [], "a");

            expect(Wirecloud.LocalCatalogue.search).not.toHaveBeenCalled();
        });

        const empty_result = (scope) => {
            return (done) => {
                const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy(), scope: scope});
                spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(
                    Promise.resolve({total_count: 0, resources: []})
                );
                spyOn(element, "paintError");

                element.input.dispatchEvent("keydown", [], "Enter");

                expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalledWith({scope: scope, search_criteria: '', lang: 'es'});
                jasmine.clock().uninstall();
                setTimeout(() => {
                    expect(element.paintError).toHaveBeenCalled();
                    done();
                }, 0);
            };
        };

        it("empty result without keywords (empty scope)", empty_result(""));
        it("empty result without keywords (scope: widget)", empty_result("widget"));

    });

    describe("clear()", () => {

        it("should clear the list container", () => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
            spyOn(element.list, "clear");

            expect(element.clear()).toBe(element);

            expect(element.list.clear).toHaveBeenCalledWith();
        });

    });

    describe("paintInfo(message[, context])", () => {

        let element;

        beforeEach(() => {
            element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
        });

        it("should support simple messages", () => {
            expect(element.paintInfo("info message")).toBe(element);
        });

        it("should support messages with context", () => {
            expect(element.paintInfo("info message", {})).toBe(element);
        });

    });

    describe("paintError(message)", () => {

        it("should support simple messages", () => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
            element.paintError("info message");
        });

    });

    describe("focus()", () => {

        it("should focus the input text box", () => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
            spyOn(element.input, "focus");

            expect(element.focus()).toBe(element);

            expect(element.input.focus).toHaveBeenCalledWith();
        });

    });

    describe("refresh()", () => {

        beforeEach(() => {
            Wirecloud.contextManager = {
                get: jasmine.createSpy('get').and.returnValue("es")
            };
            jasmine.clock().install();
        });

        afterEach(() => {
            if ("contextManager" in Wirecloud) {
                delete Wirecloud.contextManager;
            }
            jasmine.clock().uninstall();
        });

        it("should make an immediate request", () => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});

            spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(
                Promise.resolve({total_count: 0, resources: []})
            );

            expect(element.refresh()).toBe(element);

            expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalledWith({scope: '', search_criteria: '', lang: 'es'});
            expect(Wirecloud.LocalCatalogue.search.calls.count()).toBe(1);
        });

        it("should cancel previous pending searches", (done) => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});

            spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(
                Promise.resolve({total_count: 0, resources: []})
            );

            element.input.value = "keywords";

            setTimeout(() => {
                expect(Wirecloud.LocalCatalogue.search).not.toHaveBeenCalled();

                expect(element.refresh()).toBe(element);

                expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalled();
                expect(Wirecloud.LocalCatalogue.search.calls.count()).toBe(1);
                done();
            }, 300);
            jasmine.clock().tick(301);
        });

        it("should abort current requests", (done) => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
            const promise = new Wirecloud.Task("request", () => {});

            spyOn(promise, "abort");
            spyOn(Wirecloud.LocalCatalogue, "search").and.returnValue(promise);

            element.input.value = "keywords";

            setTimeout(() => {
                expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalled();

                expect(element.refresh()).toBe(element);

                expect(promise.abort).toHaveBeenCalled();
                expect(Wirecloud.LocalCatalogue.search).toHaveBeenCalled();
                done();
            }, 800);
            jasmine.clock().tick(801);
        });

    });

    describe("repaint()", () => {

        it("should repaint the list container", () => {
            const element = new ns.MACSearch({resourceButtonListener: jasmine.createSpy()});
            spyOn(element.list, "repaint");

            expect(element.repaint()).toBe(element);

            expect(element.list.repaint).toHaveBeenCalledWith();
        });

    });

})(Wirecloud.ui, StyledElements);
