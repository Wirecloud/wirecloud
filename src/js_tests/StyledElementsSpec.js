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

        it("should allow to add elements to containers using the appendChild method", function () {

            var container = new StyledElements.Container();
            var element = new StyledElements.Button();
            container.appendChild(element);
            expect(container.children).toEqual([element]);

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
