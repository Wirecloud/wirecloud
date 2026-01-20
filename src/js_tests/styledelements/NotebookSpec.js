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

        it("should support adding new tabs through a user interface button", function () {
            const tabs = [];

            const element = new StyledElements.Notebook();
            element.appendTo(dom);
            element.addEventListener('newTab', (notebook) => {tabs.push(notebook.createTab({label: "DynamicTab"}));});
            element.tabArea.style({width: "25px"});

            // Use the button inside the tab area
            element.new_tab_button_tabs.click();

            expect(element.visibleTab).toBe(tabs[0]);
            expect(element.tabs).toEqual(tabs);
            expect(element.tabArea.wrapperElement.children[0]).toBe(tabs[0].getTabElement());
            expect(element.tabArea.wrapperElement.children[1]).toBe(element.new_tab_button_tabs.wrapperElement);
            expect(element.new_tab_button_tabs.enabled).toBe(false);
            expect(element.new_tab_button_left.enabled).toBe(true);

            // Should be possible to register more than one listener
            element.addEventListener('newTab', () => {});

            // Allocate space for a second tab
            element.tabArea.style({width: "140px"});

            // Use the button at the left of the tab area
            element.new_tab_button_left.click();
            expect(element.tabs).toEqual(tabs);
            expect(element.tabArea.wrapperElement.children[0]).toBe(tabs[0].getTabElement());
            expect(element.tabArea.wrapperElement.children[1]).toBe(tabs[1].getTabElement());
            expect(element.tabArea.wrapperElement.children[2]).toBe(element.new_tab_button_tabs.wrapperElement);
            expect(element.new_tab_button_tabs.enabled).toBe(true);
            expect(element.new_tab_button_left.enabled).toBe(false);

            // Add a new tab so the space is not enough
            element.createTab({name: "another tab"});
            expect(element.new_tab_button_tabs.enabled).toBe(false);
            expect(element.new_tab_button_left.enabled).toBe(true);
        });

        it("should provide fullscreen status through the fullscreen property", function () {
            const element = new StyledElements.Notebook();
            expect(element.fullscreen).toBe(false);
        });

        it("should support the full option", function () {
            const element = new StyledElements.Notebook({full: false});
            expect(element.hasClassName('full')).toBe(false);
        });

        it("should support the id option", function () {
            const element = new StyledElements.Notebook({id: 'myid'});
            expect(element.wrapperElement.id).toBe('myid');
        });

        describe("destroy()", () => {

            it("works on empty notebooks", () => {
                const element = new StyledElements.Notebook();
                spyOn(element, "remove");

                expect(element.destroy()).toBe(undefined);

                expect(element.remove).toHaveBeenCalledWith();
            });

            it("works on non-empty notebooks", () => {
                const element = new StyledElements.Notebook();
                element.createTab();
                element.createTab();
                spyOn(element, "remove");

                expect(element.destroy()).toBe(undefined);

                expect(element.remove).toHaveBeenCalledWith();
            });

        });

        describe("createTab([options])", function () {

            let element;

            beforeEach(function () {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
            });

            it("should support create new tabs without passing options", function () {
                expect(element.visibleTab).toBe(null);
                const tab1 = element.createTab();
                expect(element.visibleTab).toBe(tab1);
                const tab2 = element.createTab();

                expect(element.visibleTab).toBe(tab1);
                expect(element.tabs).toEqual([tab1, tab2]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
                expect(element.tabArea.wrapperElement.children[1]).toBe(tab2.getTabElement());
            });

            it("should support create new tabs passing normal tab options", function () {
                expect(element.visibleTab).toBe(null);
                const tab1 = element.createTab({label: "Tab label"});
                expect(tab1.label).toBe("Tab label");

                expect(element.visibleTab).toBe(tab1);
                expect(element.tabs).toEqual([tab1]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
            });

            it("should support create new tabs using the initiallyVisible option", function () {
                expect(element.visibleTab).toBe(null);
                const tab1 = element.createTab({initiallyVisible: true});
                expect(element.visibleTab).toBe(tab1);
                const tab2 = element.createTab({initiallyVisible: true});
                expect(element.visibleTab).toBe(tab2);

                expect(element.tabs).toEqual([tab1, tab2]);
                expect(element.tabArea.wrapperElement.children[0]).toBe(tab1.getTabElement());
                expect(element.tabArea.wrapperElement.children[1]).toBe(tab2.getTabElement());
            });

            it("should allow to create new tabs using custom classes", () => {
                const MyTab = class MyTab extends StyledElements.Tab {};

                const tab = element.createTab({tab_constructor: MyTab});

                expect(element.tabs).toEqual([tab]);
                expect(tab).toEqual(jasmine.any(MyTab));
            });

            it("throws a TypeError when trying to use an invalid custom class", () => {
                const MyTab = function MyTab() {};

                expect(() => {
                    element.createTab({tab_constructor: MyTab});
                }).toThrowError(TypeError);
            });

        });

        describe("enable events", () => {

            let element;

            beforeEach(() => {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                element.createTab();
                element.createTab();
            });

            it("should add a disable layer when disabled", () => {
                element.enabled = false;

                expect(element.disabledLayer).not.toEqual(null);
            });

            it("should remove the disable layer when reenabling", () => {
                element.enabled = false;
                element.enabled = true;

                expect(element.disabledLayer).toEqual(null);
            });

        });

        // Deprecated
        describe("getTab(id)", () => {

            let element, tab;

            beforeEach(() => {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                element.createTab();
                tab = element.createTab();
            });

            it("should return tab", () => {
                expect(element.getTab(tab.tabId)).toBe(tab);
            });

            it("should return undefined if there is no tab with the passed id", () => {
                expect(element.getTab("10004")).toBe(undefined);
            });

        });

        // Deprecated
        describe("getTabByIndex(index)", () => {

            let element, tab;

            beforeEach(() => {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                element.createTab();
                tab = element.createTab();
            });

            it("should return tab", () => {
                expect(element.getTabByIndex(1)).toBe(tab);
            });

            it("should return undefined if there is no tab with the given index", () => {
                expect(element.getTabByIndex("10004")).toBe(undefined);
            });

        });

        describe("getTabIndex(id)", () => {

            let element, tab;

            beforeEach(() => {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                element.createTab();
                tab = element.createTab();
                element.createTab();
            });

            it("should return tab index", () => {
                expect(element.getTabIndex(tab.tabId)).toBe(1);
            });

            it("should return null if there is no tab with the passed id", () => {
                expect(element.getTabIndex("10004")).toBe(null);
            });

        });

        describe("goToTab(tab)", function () {
            let element, tab1, tab2, tab3, changelistener, changedlistener;

            beforeEach(() => {
                element = new StyledElements.Notebook();
                element.appendTo(dom);
                tab1 = element.createTab();
                tab2 = element.createTab();
                tab3 = element.createTab();
                changelistener = jasmine.createSpy("changelistener");
                changedlistener = jasmine.createSpy("changedlistener");
                element.addEventListener("change", changelistener);
                element.addEventListener("changed", changedlistener);
                spyOn(element, "focus");
            });

            it("throws an exception if tab is null", function () {
                expect(function () {element.goToTab(null);}).toThrow(jasmine.any(TypeError));
                expect(changelistener).not.toHaveBeenCalled();
                expect(changedlistener).not.toHaveBeenCalled();
            });

            it("throws an exception if tab is not a valid tab id", function () {
                expect(function () {element.goToTab("mytab4");}).toThrow(jasmine.any(TypeError));
                expect(changelistener).not.toHaveBeenCalled();
                expect(changedlistener).not.toHaveBeenCalled();
            });

            it("should raise an exception if the passed tab is not owned by the notebook", function () {
                const other_notebook = new StyledElements.Notebook();
                const other_tab = other_notebook.createTab();
                expect(function () {element.goToTab(other_tab);}).toThrow(jasmine.any(TypeError));
                expect(changelistener).not.toHaveBeenCalled();
                expect(changedlistener).not.toHaveBeenCalled();
            });

            it("does focus the tab if the passed tab is the visible tab (focusOnSetVisible: true)", function () {
                element.goToTab(tab1);

                expect(element.tabArea.wrapperElement.children[2]).toBe(tab3.getTabElement());
                expect(changelistener).not.toHaveBeenCalled();
                expect(changedlistener).not.toHaveBeenCalled();
                expect(element.focus).toHaveBeenCalledWith(tab1.tabId);
            });

            it("should allow to move to a middle tab", function () {
                element.goToTab(tab2);
                expect(element.visibleTab).toBe(tab2);
                expect(changelistener).toHaveBeenCalledWith(element, tab1, tab2, undefined);
                expect(changedlistener).toHaveBeenCalledWith(element, tab1, tab2, undefined);
                expect(element.focus).toHaveBeenCalledWith(tab2.tabId);
            });

            it("should allow to move to the last tab", function () {
                element.goToTab(tab3);
                expect(element.visibleTab).toBe(tab3);
                expect(changelistener).toHaveBeenCalledWith(element, tab1, tab3, undefined);
                expect(changedlistener).toHaveBeenCalledWith(element, tab1, tab3, undefined);
                expect(element.focus).toHaveBeenCalledWith(tab3.tabId);
            });

            it("should support the context option", () => {
                element.goToTab(tab2, {context: "mycontext"});

                expect(element.visibleTab).toBe(tab2);
                expect(changelistener).toHaveBeenCalledWith(element, tab1, tab2, "mycontext");
                expect(changedlistener).toHaveBeenCalledWith(element, tab1, tab2, "mycontext");
                expect(element.focus).toHaveBeenCalledWith(tab2.tabId);
            });

            it("does nothing if the passed tab is the visible tab (focusOnSetVisible: false)", () => {
                element = new StyledElements.Notebook({focusOnSetVisible: false});
                element.appendTo(dom);
                tab1 = element.createTab();
                element.addEventListener("change", changelistener);
                element.addEventListener("changed", changedlistener);
                spyOn(element, "focus");

                element.goToTab(tab1);

                expect(changelistener).not.toHaveBeenCalled();
                expect(changedlistener).not.toHaveBeenCalled();
                expect(element.focus).not.toHaveBeenCalled();
            });

            it("should no focus tabs when focusOnSetVisible is false", () => {
                element = new StyledElements.Notebook({focusOnSetVisible: false});
                element.appendTo(dom);
                tab1 = element.createTab();
                tab2 = element.createTab();
                element.addEventListener("change", changelistener);
                element.addEventListener("changed", changedlistener);
                spyOn(element, "focus");

                element.goToTab(tab2);

                expect(element.visibleTab).toBe(tab2);
                expect(changelistener).toHaveBeenCalledWith(element, tab1, tab2, undefined);
                expect(changedlistener).toHaveBeenCalledWith(element, tab1, tab2, undefined);
                expect(element.focus).not.toHaveBeenCalled();
            });

        });

        describe("removeTab(tab)", function () {
            let element, tab1, tab2, tab3;

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
                expect(element.removeTab(tab2.tabId)).toBe(element);

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
                const other_notebook = new StyledElements.Notebook();
                const other_tab = other_notebook.createTab();
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

        describe("addToEastSection(elem, position)", function () {
            let element;

            beforeEach(function () {
                element = new StyledElements.Notebook();
            });

            it("throws an exception if button is not a button", function () {
                expect(function () {element.addToEastSection(null);}).toThrow(jasmine.any(TypeError));
            });

            it("place buttons on the right by default", function () {
                const button = new StyledElements.Button();
                element.addToEastSection(button);
                expect(element.tabWrapper.east.children).toEqual([element.moveRightButton, button]);
            });

            it("place buttons on the right by default", function () {
                const button = new StyledElements.Button();
                element.addToEastSection(button, 'right');
                expect(element.tabWrapper.east.children).toEqual([element.moveRightButton, button]);
            });

            it("should allow to add buttons on the left side", function () {
                const button = new StyledElements.Button();
                element.addToEastSection(button, 'left');
                expect(element.tabWrapper.west.children).toEqual([button, element.moveLeftButton]);
            });
        });

        describe("repaint(temporal)", function () {
            let element, tab1, tab2, tab3;

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
            let element;

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

            let element;

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
                const other_notebook = new StyledElements.Notebook();
                const other_tab = other_notebook.createTab();
                expect(function () {element.focus(other_tab);}).toThrow(jasmine.any(TypeError));
            });

            it("should scroll to the left if the tab is located on the left side", (done) => {
                element.appendTo(dom);
                const tab = element.createTab({name: "Tab 1"});
                element.createTab({name: "mytab"});

                // scroll to mytab
                dom.querySelector('.se-notebook-tab-area').scrollLeft = 53;

                const p = element.focus(tab);

                p.then(() => {
                    // this number depends on CSS
                    expect(dom.querySelector('.se-notebook-tab-area').scrollLeft).toBe(1);
                    done();
                });
            });

            it("should scroll to the right if the tab is located on the right side", (done) => {
                element.appendTo(dom);
                element.createTab({name: "Tab 1"});
                const tab = element.createTab({name: "mytab"});

                const p = element.focus(tab.tabId);

                p.then(() => {
                    // this number depends on CSS
                    expect(dom.querySelector('.se-notebook-tab-area').scrollLeft).toBe(53);
                    done();
                });
            });

            xit("should do nothing if the tab to focus is removed before processing the focus command", (done) => {
                element.appendTo(dom);
                const tab1 = element.createTab({name: "Tab 1"});
                const tab2 = element.createTab({name: "mytab"});
                element.focus(tab2);
                element.focus(tab1);
                element.removeTab(tab1);

                element.transitionsQueue.addEventListener("stop", () => {
                    // this number depends on CSS
                    expect(dom.querySelector('.se-notebook-tab-area').scrollLeft).toBe(1);
                    done();
                });
            });
        });

        describe("requestFullscreen()", function () {
            let element;

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
            let element, backward;

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
            let element, tab1, tab2;

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
                const element = new StyledElements.Notebook();
                element.appendTo(dom);
                const p = element.shiftLeftTabs();
                expect(p).toEqual(jasmine.any(Promise));
            });

            it("should no crash if there are only one tab", () => {
                const element = new StyledElements.Notebook();
                element.appendTo(dom).createTab();
                const p = element.shiftLeftTabs();
                expect(p).toEqual(jasmine.any(Promise));
            });

            it("should move tabs to the left", (done) => {
                const element = new StyledElements.Notebook();
                element.appendTo(dom);
                element.createTab({name: "Tab 1"});
                element.createTab({name: "mytab"});

                // scroll to mytab
                dom.querySelector('.se-notebook-tab-area').scrollLeft = 53;

                const p = element.shiftLeftTabs();

                p.then(() => {
                    // this number depends on CSS
                    expect(dom.querySelector('.se-notebook-tab-area').scrollLeft).toBe(1);
                    done();
                });
            });
        });

        describe("shiftRightTabs()", function () {
            it("should no crash if there are no tabs", () => {
                const element = new StyledElements.Notebook();
                element.appendTo(dom);
                const p = element.shiftRightTabs();
                expect(p).toEqual(jasmine.any(Promise));
            });

            it("should no crash if there are only one tab", () => {
                const element = new StyledElements.Notebook();
                element.appendTo(dom).createTab();
                const p = element.shiftRightTabs();
                expect(p).toEqual(jasmine.any(Promise));
            });

            it("should move tabs to the right", (done) => {
                const element = new StyledElements.Notebook();
                element.appendTo(dom);
                element.createTab({name: "Tab 1"});
                element.createTab({name: "mytab"});

                const p = element.shiftRightTabs();

                p.then(() => {
                    // this number depends on CSS
                    expect(dom.querySelector('.se-notebook-tab-area').scrollLeft).toBe(53);
                    done();
                });
            });
        });

    });

})(StyledElements.Utils);
