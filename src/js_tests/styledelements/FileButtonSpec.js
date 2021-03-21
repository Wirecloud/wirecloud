/*
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

    describe("Styled FileButtons", function () {

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

        describe("new FileButton([options])", () => {

            it("can be created without passing any option", () => {
                const element = new StyledElements.FileButton();
                expect(element.wrapperElement.textContent).toBe("");
                expect(element.state).toBe("");
                expect(element.depth).toBe(null);
                expect(element.wrapperElement.className).toBe("se-btn");
            });

            it("can be created only with a text label", () => {
                const element = new StyledElements.FileButton({text: "hello world!!"});
                expect(element.wrapperElement.textContent).toBe("hello world!!");
            });

            it("should support the id option", () => {
                const element = new StyledElements.FileButton({id: "my-button"});
                expect(element.wrapperElement.getAttribute('id')).toBe("my-button");
            });

            it("should handle initial depth", () => {
                const element = new StyledElements.FileButton({text: "hello world!!", depth: 2});
                expect(element.depth).toBe(2);
                expect(element.hasClassName('z-depth-2')).toBeTruthy();
            });

            it("should inherit from Button", () => {
                const element = new StyledElements.FileButton({text: "hello world!!", depth: 2});
                expect(element).toEqual(jasmine.any(StyledElements.Button));
            });

        });

        it("should ignore click events targeting the file input element", () => {

            const element = new StyledElements.FileButton();
            const listener = jasmine.createSpy("listener");
            element.addEventListener('click', listener);

            element.inputElement.dispatchEvent(new MouseEvent("click", {bubbles: true}));

            expect(listener).not.toHaveBeenCalled();

        });

        it("should redirect click events to the file input element (if the button is enabled)", () => {

            const element = new StyledElements.FileButton();
            const listener = jasmine.createSpy("listener");
            element.addEventListener('click', listener);
            spyOn(element.inputElement, "click");

            element.wrapperElement.dispatchEvent(new MouseEvent("click"));

            expect(element.inputElement.click).toHaveBeenCalledWith();

        });

        it("should redirect click events to the file input element (if the button is disabled)", () => {

            const element = new StyledElements.FileButton();
            const listener = jasmine.createSpy("listener");
            element.addEventListener('click', listener);
            element.enabled = false;
            spyOn(element.inputElement, "click");

            element.wrapperElement.dispatchEvent(new MouseEvent("click"));

            expect(element.inputElement.click).not.toHaveBeenCalled();

        });

        describe("provides a fileselect event", () => {

            let element;

            beforeEach(() => {
                // Provide a default instance of FileButton for testing
                const realcreateelement = document.createElement;
                spyOn(document, "createElement").and.callFake(function () {return realcreateelement.call(this, "div")});
                element = new StyledElements.FileButton({iconClass: 'a'});
            });

            it("supports single file events", () => {
                const listener = jasmine.createSpy("listener");
                element.addEventListener("fileselect", listener);
                element.inputElement.files = ["a"];

                element.inputElement.dispatchEvent(new Event('change'));

                expect(listener).toHaveBeenCalled();
            });

            it("supports multiple file events", () => {
                const listener = jasmine.createSpy("listener");
                element.addEventListener("fileselect", listener);
                element.inputElement.files = ["a", "b"];

                element.inputElement.dispatchEvent(new Event('change'));

                expect(listener).toHaveBeenCalled();
            });

            it("ignore cleaning events", () => {
                const listener = jasmine.createSpy("listener");
                element.addEventListener("fileselect", listener);
                // Here the correct value to use would be an empty FileList,
                // but it's easier to use null
                element.inputElement.files = null;

                element.inputElement.dispatchEvent(new Event('change'));

                expect(listener).not.toHaveBeenCalled();
            });

        });

        it("destroy()", () => {
            const element = new StyledElements.FileButton({id: "my-button"});

            element.destroy();
        });

    });

})();
