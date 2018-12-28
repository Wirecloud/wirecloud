/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements */


(function (utils) {

    "use strict";

    describe("Notebook", function () {
        var dom = null;

        beforeEach(function () {
            dom = document.createElement('div');
            document.body.appendChild(dom);
            dom.innerHTML = "<style>.se-notebook-tab-area {overflow: hidden;padding:0px 12px;white-space: nowrap;width: 50px;} li {display:inline-block;text-align:center;width: 50px;margin:0px 1px;}</style>";
        });

        afterEach(function () {
            if (dom != null) {
                dom.remove();
                dom = null;
            }
        });

        it("should support adding new tabs through a user interface button", function () {
            var element, tab, btnCreate;

            element = new StyledElements.Notebook();
            element.addEventListener('newTab', function (notebook) {tab = notebook.createTab();});
            btnCreate = element.new_tab_button_tabs;

            btnCreate.click();

            expect(element.visibleTab).toBe(tab);
            expect(element.tabs).toEqual([tab]);
            expect(element.tabArea.wrapperElement.children[0]).toBe(tab.getTabElement());
            expect(element.tabArea.wrapperElement.children[1]).toBe(btnCreate.wrapperElement);
        });

        it("should provide fullscreen status through the fullscreen property", function () {
            var element = new StyledElements.Notebook();
            expect(element.fullscreen).toBe(false);
        });

        it("should support the full option", function () {
            var element = new StyledElements.Notebook({full: false});
            expect(element.hasClassName('full')).toBe(false);
        });

        it("should support the id option", function () {
            var element = new StyledElements.Notebook({id: 'myid'});
            expect(element.wrapperElement.id).toBe('myid');
        });

        describe("createTab([options])", function () {

            var element;

            beforeEach(function () {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
            });

            it("should support create new tabs without passing options", function () {
                var tab1, tab2;

                expect(element.visibleTab).toBe(null);
                tab1 = element.createTab();
                expect(element.visibleTab).toBe(tab1);
                tab2 = element.createTab();

                expect(element.visibleTab).toBe(tab1);
                expect(element.tabs).toEqual([tab1, tab2]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
                expect(element.tabArea.wrapperElement.children[1]).toBe(tab2.getTabElement());
            });

            it("should support create new tabs passing normal tab options", function () {
                var tab1;

                expect(element.visibleTab).toBe(null);
                tab1 = element.createTab({label: "Tab label"});
                expect(tab1.label).toBe("Tab label");

                expect(element.visibleTab).toBe(tab1);
                expect(element.tabs).toEqual([tab1]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
            });

            it("should support create new tabs using the initiallyVisible option", function () {
                var tab1, tab2;

                expect(element.visibleTab).toBe(null);
                tab1 = element.createTab({initiallyVisible: true});
                expect(element.visibleTab).toBe(tab1);
                tab2 = element.createTab({initiallyVisible: true});
                expect(element.visibleTab).toBe(tab2);

                expect(element.tabs).toEqual([tab1, tab2]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
                expect(element.tabArea.wrapperElement.children[1]).toBe(tab2.getTabElement());
            });

        });

        describe("goToTab(tab)", function () {
            var element, tab1, tab2, tab3;

            beforeEach(function () {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                tab1 = element.createTab();
                tab2 = element.createTab();
                tab3 = element.createTab();
            });

            it("throws an exception if tab is null", function () {
                expect(function () {element.goToTab(null);}).toThrow(jasmine.any(TypeError));
            });

            it("throws an exception if tab is not a valid tab id", function () {
                expect(function () {element.goToTab("mytab4");}).toThrow(jasmine.any(TypeError));
            });

            it("should raise an exception if the passed tab is not owned by the notebook", function () {
                var other_notebook = new StyledElements.Notebook();
                var other_tab = other_notebook.createTab();
                expect(function () {element.goToTab(other_tab);}).toThrow(jasmine.any(TypeError));
            });

            it("does nothing if the passed tab is the visible tab", function () {
                element.goToTab(tab1);
                expect(element.tabArea.wrapperElement.children[2]).toBe(tab3.getTabElement());
            });

            it("should allow to move to a middle tab", function () {
                element.goToTab(tab2);
                expect(element.visibleTab).toBe(tab2);
            });

            it("should allow to move to the last tab", function () {
                element.goToTab(tab3);
                expect(element.visibleTab).toBe(tab3);
            });

        });

        describe("removeTab(tab)", function () {
            var element, tab1, tab2, tab3;

            beforeEach(function () {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                tab1 = element.createTab();
                tab2 = element.createTab();
                tab3 = element.createTab();
            });

            it("does nothing if tab is null", function () {
                expect(element.removeTab(null)).toBe(element);

                expect(element.tabs).toEqual([tab1, tab2, tab3]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
                expect(element.tabArea.wrapperElement.children[1]).toBe(tab2.getTabElement());
                expect(element.tabArea.wrapperElement.children[2]).toBe(tab3.getTabElement());
            });

            it("does nothing if tab is not found", function () {
                expect(element.removeTab("mytab4")).toBe(element);

                expect(element.tabs).toEqual([tab1, tab2, tab3]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
                expect(element.tabArea.wrapperElement.children[1]).toBe(tab2.getTabElement());
                expect(element.tabArea.wrapperElement.children[2]).toBe(tab3.getTabElement());
            });

            it("should allow removing tabs by id", function () {
                expect(element.removeTab(tab2.getId())).toBe(element);

                expect(element.tabs).toEqual([tab1, tab3]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
                expect(element.tabArea.wrapperElement.children[1]).toBe(tab3.getTabElement());
            });

            it("should allow removing tabs using Tab instances", function () {
                expect(element.removeTab(tab2)).toBe(element);

                expect(element.tabs).toEqual([tab1, tab3]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
                expect(element.tabArea.wrapperElement.children[1]).toBe(tab3.getTabElement());
            });

            it("should raise an exception if the passed tab is not owned by the notebook", function () {
                var other_notebook = new StyledElements.Notebook();
                var other_tab = other_notebook.createTab();
                expect(function () {element.removeTab(other_tab);}).toThrow(jasmine.any(TypeError));
                expect(element.tabs).toEqual([tab1, tab2, tab3]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
                expect(element.tabArea.wrapperElement.children[1]).toBe(tab2.getTabElement());
                expect(element.tabArea.wrapperElement.children[2]).toBe(tab3.getTabElement());
            });

            it("should allow removing the active tab", function () {
                expect(element.visibleTab).toBe(tab1);

                expect(element.removeTab(tab1)).toBe(element);

                expect(element.visibleTab).toBe(tab2);
                expect(element.tabs).toEqual([tab2, tab3]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab2.getTabElement());
                expect(element.tabArea.wrapperElement.children[1]).toBe(tab3.getTabElement());
            });

            it("should allow removing the active tab when the active tab is the right most tab", function () {
                element.goToTab(tab3);
                expect(element.visibleTab).toBe(tab3);

                expect(element.removeTab(tab3)).toBe(element);

                expect(element.visibleTab).toBe(tab2);
                expect(element.tabs).toEqual([tab1, tab2]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
                expect(element.tabArea.wrapperElement.children[1]).toBe(tab2.getTabElement());
            });

            it("should allow removing the latest tab", function () {
                expect(element.removeTab(tab1)).toBe(element);
                expect(element.removeTab(tab2)).toBe(element);
                expect(element.removeTab(tab3)).toBe(element);

                expect(element.visibleTab).toEqual(null);
                expect(element.tabs).toEqual([]);
                expect(element.tabArea.wrapperElement.children.length).toBe(0);
            });

        });

        describe("addButton(button, position)", function () {
            var element;

            beforeEach(function () {
                element = new StyledElements.Notebook();
            });

            it("throws an exception if button is not a button", function () {
                expect(function () {element.addButton(null);}).toThrow(jasmine.any(TypeError));
            });

            it("place buttons on the right by default", function () {
                var button = new StyledElements.Button();
                element.addButton(button);
                expect(element.tabWrapper.east.children).toEqual([element.moveRightButton, button]);
            });

            it("place buttons on the right by default", function () {
                var button = new StyledElements.Button();
                element.addButton(button, 'right');
                expect(element.tabWrapper.east.children).toEqual([element.moveRightButton, button]);
            });

            it("should allow to add buttons on the left side", function () {
                var button = new StyledElements.Button();
                element.addButton(button, 'left');
                expect(element.tabWrapper.west.children).toEqual([button, element.moveLeftButton]);
            });
        });

        describe("repaint(temporal)", function () {
            var element, tab1, tab2, tab3;

            beforeEach(function () {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                tab1 = element.createTab();
                spyOn(tab1, 'repaint');
                tab2 = element.createTab();
                spyOn(tab2, 'repaint');
                tab3 = element.createTab();
                spyOn(tab3, 'repaint');
            });

            it("should no crash if there are no tabs", function () {
                // Create an empty notebook for this tests
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                expect(element.repaint(true)).toBe(element);
            });

            it("should call to the repaint method of the visible tab when doing a temporal repaint", function () {
                expect(element.repaint(true)).toBe(element);
                expect(tab1.repaint).toHaveBeenCalledWith(true);
                expect(tab2.repaint).not.toHaveBeenCalled();
                expect(tab3.repaint).not.toHaveBeenCalled();
            });

            it("should call to the repaint method of the available tabs when doing a normal repaint", function () {
                expect(element.repaint()).toBe(element);
                expect(tab1.repaint).toHaveBeenCalledWith(false);
                expect(tab2.repaint).toHaveBeenCalledWith(false);
                expect(tab3.repaint).toHaveBeenCalledWith(false);
            });
        });

        describe("clear()", function () {
            var element;

            beforeEach(function () {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                element.createTab();
                element.createTab();
            });

            it("should remove all the tabs", function () {
                expect(element.clear()).toBe(element);
                expect(element.tabs).toEqual([]);
            });

        });

        describe("focus(tab)", () => {

            var element;

            beforeEach(() => {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
            });

            it("throws an exception if tab is null", function () {
                expect(() => {element.focus(null);}).toThrow(jasmine.any(TypeError));
            });

            it("throws an exception if tab is not a valid tab id", function () {
                expect(() => {element.focus(404);}).toThrow(jasmine.any(TypeError));
            });

            it("should raise an exception if the passed tab is not owned by the notebook", function () {
                var other_notebook = new StyledElements.Notebook();
                var other_tab = other_notebook.createTab();
                expect(function () {element.focus(other_tab);}).toThrow(jasmine.any(TypeError));
            });

            it("should scroll to the left if the tab is located on the left side", (done) => {
                element.appendTo(dom);
                var tab = element.createTab({name: "Tab 1"});
                element.createTab({name: "mytab"});

                // scroll to mytab
                dom.querySelector('.se-notebook-tab-area').scrollLeft = 42;

                var p = element.focus(tab);

                p.then(() => {
                    // this number depends on CSS
                    expect(dom.querySelector('.se-notebook-tab-area').scrollLeft).toBe(9);
                    done();
                });
            });

            it("should scroll to the right if the tab is located on the right side", (done) => {
                element.appendTo(dom);
                element.createTab({name: "Tab 1"});
                var tab = element.createTab({name: "mytab"});

                var p = element.focus(tab.tabId);

                p.then(() => {
                    // this number depends on CSS
                    expect(dom.querySelector('.se-notebook-tab-area').scrollLeft).toBe(42);
                    done();
                });
            });
        });

        describe("requestFullscreen()", function () {
            var element;

            beforeEach(function () {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
            });

            it("should make the notebook fullscreen", function () {
                Element.prototype.requestFullscreen = jasmine.createSpy('requestFullscreen');
                expect(element.requestFullscreen()).toBe(element);
                expect(Element.prototype.requestFullscreen).toHaveBeenCalledWith();
                delete Element.prototype.requestFullscreen;
            });

        });

        describe("exitFullscreen()", function () {
            var element, backward;

            beforeAll(() => {
                // Check if current browser implements exitFullscreen method
                backward = !('exitFullscreen' in document);
            });

            beforeEach(function () {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                if (backward) {
                    document.exitFullscreen = jasmine.createSpy("exitFullscreen");
                } else {
                    spyOn(document, "exitFullscreen");
                }
            });

            afterAll(() => {
                if (backward) {
                    delete document.exitFullscreen;
                }
            });

            it("should do nothing if the browser is in fullscreen mode but the notebook is not in fullscreen mode", function () {
                spyOn(utils, "getFullscreenElement").and.returnValue(document.createElement('div'));
                expect(element.fullscreen).toBe(false);

                expect(element.exitFullscreen()).toBe(element);

                expect(document.exitFullscreen).not.toHaveBeenCalled();
                delete document.fullscreenElement;
                delete document.exitFullscreen;
            });

            it("should exit from fullscreen if the notebook is in fullscreen mode", function () {
                spyOn(utils, "getFullscreenElement").and.returnValue(element.wrapperElement);
                expect(element.fullscreen).toBe(true);

                expect(element.exitFullscreen()).toBe(element);

                expect(document.exitFullscreen).toHaveBeenCalled();
                delete document.fullscreenElement;
                delete document.exitFullscreen;
            });

        });

        describe("getTabByLabel(label)", function () {
            var element, tab1, tab2;

            beforeEach(function () {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                tab1 = element.createTab({name: "Tab 1"});
                tab2 = element.createTab({name: "mytab"});
                element.createTab({name: "mytab"});
            });

            it("returns null if the tab doesn't exist", function () {
                expect(element.getTabByLabel("inexistent")).toBe(null);
            });

            it("returns the tab identified by the given label", function () {
                expect(element.getTabByLabel("Tab 1")).toBe(tab1);
            });

            it("returns the first tab if there are more tabs with the same label", function () {
                expect(element.getTabByLabel("mytab")).toBe(tab2);
            });

        });

        describe("shiftLeftTabs()", function () {

            it("should no crash if there are no tabs", () => {
                var element = new StyledElements.Notebook();
                element.appendTo(dom);
                let p = element.shiftLeftTabs();
                expect(p).toEqual(jasmine.any(Promise));
            });

            it("should no crash if there are only one tab", () => {
                var element = new StyledElements.Notebook();
                element.appendTo(dom).createTab();
                let p = element.shiftLeftTabs();
                expect(p).toEqual(jasmine.any(Promise));
            });

            it("should move tabs to the left", (done) => {
                var element = new StyledElements.Notebook();
                element.appendTo(dom);
                element.createTab({name: "Tab 1"});
                element.createTab({name: "mytab"});

                // scroll to mytab
                dom.querySelector('.se-notebook-tab-area').scrollLeft = 42;

                var p = element.shiftLeftTabs();

                p.then(() => {
                    // this number depends on CSS
                    expect(dom.querySelector('.se-notebook-tab-area').scrollLeft).toBe(9);
                    done();
                });
            });
        });

        describe("shiftRightTabs()", function () {
            it("should no crash if there are no tabs", () => {
                var element = new StyledElements.Notebook();
                element.appendTo(dom);
                let p = element.shiftRightTabs();
                expect(p).toEqual(jasmine.any(Promise));
            });

            it("should no crash if there are only one tab", () => {
                var element = new StyledElements.Notebook();
                element.appendTo(dom).createTab();
                let p = element.shiftRightTabs();
                expect(p).toEqual(jasmine.any(Promise));
            });

            it("should move tabs to the right", (done) => {
                var element = new StyledElements.Notebook();
                element.appendTo(dom);
                element.createTab({name: "Tab 1"});
                element.createTab({name: "mytab"});

                var p = element.shiftRightTabs();

                p.then(() => {
                    // this number depends on CSS
                    expect(dom.querySelector('.se-notebook-tab-area').scrollLeft).toBe(42);
                    done();
                });
            });
        });

    });

})(StyledElements.Utils);
