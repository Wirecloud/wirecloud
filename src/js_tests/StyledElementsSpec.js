(function () {

    "use strict";

    describe("Styled Elements framework", function () {

        var dom = null;

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

        it("should allow to add elements to containers using the appendTo method", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            element.appendTo(container);
            expect(container.children).toEqual([element]);

        });

        it("should allow to add elements to containers using the appendTo method (duplicated)", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            element.appendTo(container);
            element.appendTo(container);
            // Container should contain only a copy of element
            expect(container.children).toEqual([element]);

        });

        it("should allow to add elements to containers using the appendChild method", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            expect(container.appendChild(element).children).toEqual([element]);

        });

        it("should allow to add string nodes to containers using the appendChild method", function () {

            var container = new StyledElements.Container();
            expect(container.appendChild("hello ").appendChild("world!!").children).toEqual([]);
            expect(container.wrapperElement.textContent, "hello world!!")

        });

        it("should allow to add elements to containers using the appendChild method (duplicated)", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            container.appendChild(element);
            expect(container.appendChild(element).children).toEqual([element]);

        });

        it("should allow to add elements to containers using the prependChild method", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            expect(container.prependChild(element).children).toEqual([element]);

        });

        it("should allow to add string nodes to containers using the prependChild method", function () {

            var container = new StyledElements.Container();
            expect(container.prependChild("world!!").prependChild("hello ").children).toEqual([]);
            expect(container.wrapperElement.textContent, "hello world!!")

        });

        it("should allow to add elements to containers using the prependChild method (duplicated)", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            container.appendChild(element);
            expect(container.prependChild(element).children).toEqual([element]);

        });

        it("should allow to remove elements from the DOM", function () {

            var element = new StyledElements.Button();
            element.appendTo(dom);
            expect(element.wrapperElement.parentElement).not.toBe(null);
            element.remove();
            expect(element.wrapperElement.parentElement).toBe(null);

        });

        it("should allow to remove elements from containers", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            container.appendChild(element);
            expect(element.parentElement).not.toBe(null);
            element.remove();
            expect(element.parentElement).toBe(null);

        });


    });

})();
