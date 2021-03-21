/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals MouseEvent, StyledElements */


(function () {

    "use strict";

    describe("Tab", function () {
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

        describe("new Tab(id, notebook, [options]) [Not to be used directly]", function () {

            it("should require id and notebook parameters", function () {
                expect(function () {
                    new StyledElements.Tab("1");
                }).toThrow(jasmine.any(TypeError));
            });

            it("should check that the notebook parameter is a Notebook instance", function () {
                expect(function () {
                    new StyledElements.Tab("1", 5);
                }).toThrow(jasmine.any(TypeError));
            });

            it("should create a Tab instance when not passing any option", function () {
                const notebook = new StyledElements.Notebook();
                const tab = new StyledElements.Tab("1", notebook);
                expect(tab.getTabElement().querySelectorAll('.se-btn').length).toBe(1);
            });

            it("should support the closable option", function () {
                const notebook = new StyledElements.Notebook();
                const tab = new StyledElements.Tab("1", notebook, {closable: false});
                expect(tab.getTabElement().querySelectorAll('.se-btn').length).toBe(0);
            });

            it("should support the label option", function () {
                const notebook = new StyledElements.Notebook();
                const tab = new StyledElements.Tab("1", notebook, {label: "My Tab"});
                expect(tab.tabElement.textContent).toBe("My Tab");
            });

            it("should support the name option [deprecated]", function () {
                const notebook = new StyledElements.Notebook();
                const tab = new StyledElements.Tab("1", notebook, {name: "My Tab"});
                expect(tab.tabElement.textContent).toBe("My Tab");
            });

        });

        describe("close()", function () {

            it("should remove the tab from the notebook", function () {
                const notebook = new StyledElements.Notebook();
                const tab = notebook.createTab();
                expect(tab.close()).toBe(tab);
                expect(notebook.tabs).toEqual([]);
            });

        });

        describe("setLabel([newLabel])", function () {

            it("should discard previous label", function () {
                const notebook = new StyledElements.Notebook();
                const tab = notebook.createTab({label: "Tab label"});
                const newlabel = "New tab label";
                expect(tab.setLabel(newlabel)).toBe(tab);
                expect(tab.label).toBe(newlabel);
                expect(tab.tabElement.textContent).toBe(newlabel);
            });

        });

        describe("setTitle([title])", function () {

            it("should support replacing current tooltip", function () {
                const notebook = new StyledElements.Notebook();
                const tab = new StyledElements.Tab("1", notebook, {title: "My tooltip"});
                expect(tab.setTitle("My new tooltip")).toBe(tab);
            });

            it("should support cleanig current tooltip", function () {
                const notebook = new StyledElements.Notebook();
                const tab = new StyledElements.Tab("1", notebook, {title: "My tooltip"});
                expect(tab.setTitle()).toBe(tab);
            });

        });

        it("should display the tab when the user clicks in the tab element", function () {
            const notebook = new StyledElements.Notebook();
            notebook.appendTo(dom);
            const tab = notebook.createTab();
            spyOn(notebook, 'goToTab');
            tab.getTabElement().dispatchEvent(new MouseEvent("click"));
            expect(notebook.goToTab).toHaveBeenCalledWith(tab.tabId);
        });

        it("should close the tab when the user clicks on the close button", function () {
            const notebook = new StyledElements.Notebook();
            notebook.appendTo(dom);
            const tab = notebook.createTab({closable: true});
            tab.getTabElement().querySelector('.se-btn').dispatchEvent(new MouseEvent("click"));
            expect(notebook.tabs).toEqual([]);
        });

        describe("rename([newName]) [deprecated]", function () {

            it("should discard previous label", function () {
                const notebook = new StyledElements.Notebook();
                const tab = notebook.createTab({label: "Tab name"});
                const newlabel = "New tab name";
                expect(tab.rename(newlabel)).toBe(tab);
                expect(tab.label).toBe(newlabel);
            });

        });

    });

})();
