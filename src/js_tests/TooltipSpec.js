(function () {

    "use strict";

    describe("Styled Tooltips", function () {

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

        it("can be created without passing any option", function () {

            var tooltip = new StyledElements.Tooltip();
            expect(tooltip).not.toBe(null);

        });

        it("can be displayed and hidden just immediately", function () {

            var ref_element = new StyledElements.Button();
            var tooltip = new StyledElements.Tooltip();
            // PhantomJS doesn't emulate CSS animations
            // The expected behaviour when calling hide just after calling show
            // is to find a computed opacity of 0
            spyOn(window, 'getComputedStyle').and.returnValue({
                getPropertyValue: function () {return "0";}
            });
            expect(tooltip.show(ref_element).hide().element).toBe(null);

        });

        it("can be forced to be hidden", function () {

            // A second call to hide should cancel current animation and hide the tooltip
            var ref_element = new StyledElements.Button();
            var tooltip = new StyledElements.Tooltip();
            expect(tooltip.show(ref_element).hide().hide().element).toBe(null);
            expect(tooltip.visible).toBe(false);

        });

        it("should do nothing when the hide method is used and the tooltip is already hidden", function () {

            var tooltip = new StyledElements.Tooltip();
            expect(tooltip.hide().element).toBe(null);
            expect(tooltip.visible).toBe(false);

        });

    });

})();

