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

/* globals StyledElements */


(function () {

    "use strict";

    describe("Styled Off-Canvas Layout", function () {
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

        describe("new OffCanvasLayout([options])", function () {

            it("should create an instance with no options", function () {
                const layout = new StyledElements.OffCanvasLayout();

                expect(layout.hasClassName("se-offcanvas")).toBeTruthy();
                expect(layout.hasClassName("left-sideway")).toBeTruthy();
                expect(layout.slipped).toBeFalsy();
                expect(layout.index).toEqual(-1);
            });

            it("should create an instance with options.sideway = 'right'", function () {
                const layout = new StyledElements.OffCanvasLayout({
                    sideway: 'right'
                });

                expect(layout.hasClassName("se-offcanvas")).toBeTruthy();
                expect(layout.hasClassName("right-sideway")).toBeTruthy();
                expect(layout.slipped).toBeFalsy();
                expect(layout.index).toEqual(-1);
            });

        });

        describe("appendChild(element)", function () {

            it("should insert an element into the sidebar", function () {
                const layout = new StyledElements.OffCanvasLayout();
                const container = new StyledElements.Container();

                layout.appendChild(container);

                expect(layout.sidebar.children.length).toEqual(1);
                expect(layout.sidebar.children[0]).toBe(container);
                expect(layout.index).toEqual(0);
            });

            it("should insert two elements into the sidebar", function () {
                const layout = new StyledElements.OffCanvasLayout();
                const container1 = new StyledElements.Container();
                const container2 = new StyledElements.Container();

                layout.appendChild(container1);
                layout.appendChild(container2);

                expect(layout.sidebar.children.length).toEqual(2);
                expect(layout.sidebar.children[0]).toBe(container1);
                expect(layout.sidebar.children[1]).toBe(container2);
                expect(layout.index).toEqual(0);
            });
        });

        describe("slideIn([index])", function () {

            it("should work properly with no elements attached", function () {
                const layout = new StyledElements.OffCanvasLayout();
                const listener = jasmine.createSpy('spy');
                let container;

                layout.addEventListener('slideIn', listener);
                layout.slideIn();

                expect(layout.slipped).toBeTruthy();
                expect(listener.calls.count()).toEqual(1);
                expect(listener).toHaveBeenCalledWith(layout, container);
            });

            it("should show the first element attached", function () {
                const layout = new StyledElements.OffCanvasLayout();
                const listener = jasmine.createSpy('spy');

                const container1 = new StyledElements.Container();
                const container2 = new StyledElements.Container();

                layout.appendChild(container1);
                layout.appendChild(container2);

                layout.addEventListener('slideIn', listener);
                layout.slideIn();

                expect(layout.slipped).toBeTruthy();
                expect(listener.calls.count()).toEqual(1);
                expect(listener).toHaveBeenCalledWith(layout, container1);
                expect(container1.hidden).toBeFalsy();
                expect(container2.hidden).toBeTruthy();
            });

            it("should show the element indicated by argument", function () {
                const layout = new StyledElements.OffCanvasLayout();
                const listener = jasmine.createSpy('spy');

                const container1 = new StyledElements.Container();
                const container2 = new StyledElements.Container();

                layout.appendChild(container1);
                layout.appendChild(container2);

                layout.addEventListener('slideIn', listener);
                layout.slideIn(1);

                expect(layout.slipped).toBeTruthy();
                expect(listener.calls.count()).toEqual(1);
                expect(listener).toHaveBeenCalledWith(layout, container2);
                expect(container1.hidden).toBeTruthy();
                expect(container2.hidden).toBeFalsy();
            });
        });

        describe("slideOut([index])", function () {

            it("should work properly with no elements attached", function () {
                const layout = new StyledElements.OffCanvasLayout();
                const listener = jasmine.createSpy('spy');

                layout.addEventListener('slideOut', listener);
                layout.slideOut();
                expect(layout.slipped).toBeFalsy();
                expect(listener.calls.count()).toEqual(1);
                expect(listener).toHaveBeenCalledWith(layout);
            });

            it("should show the element previously indicated", function () {
                const layout = new StyledElements.OffCanvasLayout();
                const listener = jasmine.createSpy('spy');

                const container1 = new StyledElements.Container();
                const container2 = new StyledElements.Container();

                layout.appendChild(container1);
                layout.appendChild(container2);

                layout.slideOut(1);
                layout.addEventListener('slideIn', listener);
                layout.slideIn();

                expect(layout.slipped).toBeTruthy();
                expect(listener.calls.count()).toEqual(1);
                expect(listener).toHaveBeenCalledWith(layout, container2);
                expect(container1.hidden).toBeTruthy();
                expect(container2.hidden).toBeFalsy();
            });
        });
    });

})();
