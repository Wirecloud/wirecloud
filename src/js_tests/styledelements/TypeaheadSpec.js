/*
 *     Copyright (c) 2019-2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements */


(function () {

    "use strict";

    describe("Styled Typeahead", () => {

        let dom = null;

        beforeEach(function () {
            dom = document.createElement('div');
            document.body.appendChild(dom);
        });

        afterEach(function () {
            if (dom != null) {
                dom.remove();
                dom = null;
            }
        });

        describe("new Typeahead(options)", () => {

            it("should throw a TypeError exception if lookup option is missing", () => {
                expect(() => {
                    new StyledElements.Typeahead();
                }).toThrowError(TypeError);
            });

            it("should throw a TypeError exception if lookup option is not a function", () => {
                expect(() => {
                    new StyledElements.Typeahead({
                        build: function () {},
                        lookup: 5
                    });
                }).toThrowError(TypeError);
            });

            it("should throw a TypeError exception if compare option is not a function", () => {
                expect(() => {
                    new StyledElements.Typeahead({
                        build: function () {},
                        lookup: function () {},
                        compare: 5
                    });
                }).toThrowError(TypeError);
            });

            it("should create typeahead instances when passing the required options", () => {
                const typeahead = new StyledElements.Typeahead({
                    build: function () {},
                    lookup: function () {}
                });
                expect(typeahead).not.toBe(null);

                expect(typeahead.cleanedQuery).toBe("");
            });

        });

        describe('bind(textField)', () => {

            it("should work with text fields", () => {
                const typeahead = new StyledElements.Typeahead({
                    build: function () {},
                    lookup: function () {}
                });
                const textfield = new StyledElements.TextField();
                typeahead.bind(textfield);
            });

            const testinvalidvalue = (value) => {
                it("should throw a type error exception for invalid values (" + value + ")", () => {
                    const typeahead = new StyledElements.Typeahead({
                        build: function () {},
                        lookup: function () {}
                    });
                    expect(() => {
                        typeahead.bind(value);
                    }).toThrowError(TypeError);
                });
            };

            testinvalidvalue(null);
            testinvalidvalue(true);
            testinvalidvalue({});
            testinvalidvalue(5);
        });

        describe("should manage user events", () => {

            let typeahead, textfield, build, lookup, mockedclock;

            beforeEach(() => {
                lookup = jasmine.createSpy("lookup");
                build = jasmine.createSpy("build");
                typeahead = new StyledElements.Typeahead({build: build, lookup: lookup});
                textfield = new StyledElements.TextField();
                typeahead.bind(textfield);
                jasmine.clock().install();
                mockedclock = true;
            });

            afterEach(() => {
                if (mockedclock === true) {
                    jasmine.clock().uninstall();
                }
            });

            it("should search on input change", () => {
                textfield.setValue("abc");

                jasmine.clock().tick(200);
                expect(lookup).toHaveBeenCalledWith("abc");
            });

            it("should wait user finishing making changes (using a timeout)", () => {
                textfield.setValue("abc");
                jasmine.clock().tick(100);
                textfield.setValue("cba");
                jasmine.clock().tick(200);

                expect(lookup).toHaveBeenCalledTimes(1);
                expect(lookup).toHaveBeenCalledWith("cba");
            });

            it("should support aborting current requests", () => {
                const request = Promise.resolve();
                request.abort = jasmine.createSpy("abort");
                lookup.and.returnValue(request);
                textfield.setValue("abc");
                jasmine.clock().tick(200);

                textfield.setValue("cba");
                jasmine.clock().tick(200);

                expect(lookup).toHaveBeenCalledTimes(2);
                expect(lookup).toHaveBeenCalledWith("abc");
                expect(lookup).toHaveBeenCalledWith("cba");
                expect(request.abort).toHaveBeenCalledTimes(1);
                expect(request.abort).toHaveBeenCalledWith();
            });

            it("should support aborting current requests (empty search)", () => {
                const request = Promise.resolve();
                request.abort = jasmine.createSpy("abort");
                lookup.and.returnValue(request);
                textfield.setValue("abc");
                jasmine.clock().tick(200);

                textfield.setValue("");
                jasmine.clock().tick(200);

                expect(lookup).toHaveBeenCalledTimes(1);
                expect(lookup).toHaveBeenCalledWith("abc");
                expect(request.abort).toHaveBeenCalledTimes(1);
                expect(request.abort).toHaveBeenCalledWith();
            });

            it("should provide a message for empty searches", (done) => {
                spyOn(typeahead.popupMenu, "show");
                lookup.and.returnValue(Promise.resolve([]));
                textfield.setValue("abc2");
                jasmine.clock().tick(200);

                jasmine.clock().uninstall();
                mockedclock = false;
                setTimeout(() => {
                    expect(lookup).toHaveBeenCalledTimes(1);
                    expect(lookup).toHaveBeenCalledWith("abc2");
                    expect(typeahead.popupMenu.show).toHaveBeenCalled();
                    done();
                });
            });

            it("should support customizing empty search message", (done) => {
                typeahead = new StyledElements.Typeahead({build: build, lookup: lookup, notFoundMessage: "not found"});
                let textfield = new StyledElements.TextField();
                typeahead.bind(textfield);

                spyOn(typeahead.popupMenu, "show");
                textfield.setValue("abc3");
                jasmine.clock().tick(200);

                jasmine.clock().uninstall();
                mockedclock = false;
                setTimeout(() => {
                    expect(lookup).toHaveBeenCalledTimes(1);
                    expect(lookup).toHaveBeenCalledWith("abc3");
                    expect(typeahead.popupMenu.show).toHaveBeenCalled();
                    expect(typeahead.popupMenu._items[0].title).toBe("not found");
                    done();
                });
            });

            it("should display popupMenu to allow user select between the available alternatives", (done) => {
                spyOn(typeahead.popupMenu, "show");
                lookup.and.returnValue(Promise.resolve([{}, {}, {}]));
                build.and.returnValues({title: "a"}, {title: "b", iconClass: "fas fa-plus"}, {title: "c", description: "A description"});
                textfield.setValue("abc5");
                jasmine.clock().tick(200);

                jasmine.clock().uninstall();
                mockedclock = false;
                setTimeout(() => {
                    expect(lookup).toHaveBeenCalledTimes(1);
                    expect(lookup).toHaveBeenCalledWith("abc5");
                    expect(typeahead.popupMenu.show).toHaveBeenCalledTimes(1);
                    expect(typeahead.popupMenu.show).toHaveBeenCalled();
                    expect(build).toHaveBeenCalledTimes(3);
                    done();
                });
            });

            it("should allow to select from the proposed completions", (done) => {
                const data = {};
                spyOn(typeahead.popupMenu, "show");
                lookup.and.returnValue([{}, data, {}]);
                build.and.returnValues({title: "a"}, {title: "b", value: "newvalue"}, {title: "c"});
                textfield.setValue("abc6");
                jasmine.clock().tick(200);

                jasmine.clock().uninstall();
                mockedclock = false;
                setTimeout(() => {
                    lookup.calls.reset();
                    jasmine.clock().install();
                    mockedclock = true;

                    typeahead.popupMenu._items[1].click();

                    expect(textfield.getValue()).toBe("newvalue");
                    // Changing text field value should not trigger a new search
                    jasmine.clock().tick(200);
                    expect(lookup).not.toHaveBeenCalled();
                    done();
                });
            });

            it("should support autocomplete = false when selecting from the proposed completions", (done) => {
                typeahead = new StyledElements.Typeahead({build: build, lookup: lookup, autocomplete: false});
                const textfield = new StyledElements.TextField();
                typeahead.bind(textfield);
                const data = {};
                spyOn(typeahead.popupMenu, "show");
                lookup.and.returnValue([{}, data, {}]);
                build.and.returnValues({title: "a"}, {title: "b", value: "newvalue"}, {title: "c"});
                textfield.setValue("abc");
                jasmine.clock().tick(200);
                lookup.calls.reset();

                jasmine.clock().uninstall();
                mockedclock = false;
                setTimeout(() => {
                    jasmine.clock().install();
                    mockedclock = true;

                    typeahead.popupMenu._items[1].click();

                    expect(textfield.getValue()).toBe("");
                    // Changing text field value should not trigger a new search
                    jasmine.clock().tick(200);
                    expect(lookup).not.toHaveBeenCalled();
                    done();
                });
            });

            it("should manage ArrowDown events", () => {
                spyOn(typeahead.popupMenu, "hasEnabledItem").and.returnValue(true);
                spyOn(typeahead.popupMenu, "moveCursorDown");
                textfield.dispatchEvent("keydown", {preventDefault: jasmine.createSpy("preventDefault")}, 'ArrowDown');

                expect(typeahead.popupMenu.moveCursorDown).toHaveBeenCalledTimes(1);
                expect(typeahead.popupMenu.moveCursorDown).toHaveBeenCalledWith();
            });

            it("should manage ArrowUp events", () => {
                spyOn(typeahead.popupMenu, "hasEnabledItem").and.returnValue(true);
                spyOn(typeahead.popupMenu, "moveCursorUp");
                textfield.dispatchEvent("keydown", {preventDefault: jasmine.createSpy("preventDefault")}, 'ArrowUp');

                expect(typeahead.popupMenu.moveCursorUp).toHaveBeenCalledTimes(1);
                expect(typeahead.popupMenu.moveCursorUp).toHaveBeenCalledWith();
            });

            it("should manage Enter events", () => {
                const data = {};
                const item = new StyledElements.MenuItem("test", null, data);
                spyOn(item, "click").and.callThrough();
                typeahead.popupMenu.append(item);
                typeahead.popupMenu.show(textfield.getBoundingClientRect());

                textfield.dispatchEvent("keydown", {preventDefault: jasmine.createSpy("preventDefault")}, 'Enter');

                expect(item.click).toHaveBeenCalledTimes(1);
                expect(item.click).toHaveBeenCalledWith();
            });

            it("should manage Tab events", () => {
                const data = {};
                const item = new StyledElements.MenuItem("test", null, data);
                spyOn(item, "click").and.callThrough();
                typeahead.popupMenu.append(item);
                typeahead.popupMenu.show(textfield.getBoundingClientRect());

                textfield.dispatchEvent("keydown", {preventDefault: jasmine.createSpy("preventDefault")}, 'Tab');

                expect(item.click).toHaveBeenCalledTimes(1);
                expect(item.click).toHaveBeenCalledWith();
            });

            it("should ignore keydown events if there is no an active menu item", () => {
                spyOn(typeahead.popupMenu, "hasEnabledItem").and.returnValue(false);
                textfield.dispatchEvent("keydown", {preventDefault: jasmine.createSpy("preventDefault")}, 'Enter');
            });

            it("should ignore not managed keydown events", () => {
                spyOn(typeahead.popupMenu, "hasEnabledItem").and.returnValue(true);
                textfield.dispatchEvent("keydown", {preventDefault: jasmine.createSpy("preventDefault")}, 'A');
            });

            it("should abort searches on blur", () => {
                const request = Promise.resolve([]);
                request.abort = jasmine.createSpy("abort");
                lookup.and.returnValue(request);
                textfield.setValue("abc");

                textfield.dispatchEvent("blur");
                jasmine.clock().tick(200);

                expect(lookup).not.toHaveBeenCalled();
                expect(request.abort).not.toHaveBeenCalled();
            });

            it("should abort current requests on blur", () => {
                const request = Promise.resolve([]);
                request.abort = jasmine.createSpy("abort");
                lookup.and.returnValue(request);
                textfield.setValue("abc8");
                // Wait until Typeahead starts the search request
                jasmine.clock().tick(200);
                expect(lookup).toHaveBeenCalledWith("abc8");

                textfield.dispatchEvent("blur");
                jasmine.clock().tick(200);

                expect(lookup).toHaveBeenCalledTimes(1);
                expect(request.abort).toHaveBeenCalledTimes(1);
                expect(request.abort).toHaveBeenCalledWith();
            });

            it("should manage submit events", () => {
                const data = {};
                const item = new StyledElements.MenuItem("test", null, data);
                spyOn(item, "click").and.callThrough();
                typeahead.popupMenu.append(item);
                typeahead.popupMenu.show(textfield.getBoundingClientRect());

                textfield.dispatchEvent("submit");

                expect(item.click).toHaveBeenCalledTimes(1);
                expect(item.click).toHaveBeenCalledWith();
            });

            it("should ignore submit events if there is no an active menu item", () => {
                spyOn(typeahead.popupMenu, "hasEnabledItem").and.returnValue(false);
                textfield.dispatchEvent("submit");
            });

            it("should support filtering entries", (done) => {
                const compare = jasmine.createSpy("compare").and.returnValues(1, 0, -1);
                typeahead = new StyledElements.Typeahead({build: build, lookup: lookup, compare: compare});
                const textfield = new StyledElements.TextField();
                typeahead.bind(textfield);

                spyOn(typeahead.popupMenu, "show");
                lookup.and.returnValue(Promise.resolve([{}, {}, {}]));
                build.and.returnValues({title: "a"}, {title: "b", iconClass: "fas fa-plus"}, {title: "c", description: "A description"});
                textfield.setValue("abc");
                jasmine.clock().tick(200);

                jasmine.clock().uninstall();
                mockedclock = false;
                setTimeout(() => {
                    expect(lookup).toHaveBeenCalledTimes(1);
                    expect(lookup).toHaveBeenCalledWith("abc");
                    expect(typeahead.popupMenu.show).toHaveBeenCalledTimes(1);
                    expect(typeahead.popupMenu.show).toHaveBeenCalled();
                    expect(compare).toHaveBeenCalledTimes(3);
                    expect(build).toHaveBeenCalledTimes(1);
                    done();
                });
            });

        });

    });

})();

