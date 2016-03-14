(function () {

    "use strict";

    describe("Styled ModelTable", function () {

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

        it("Test 0 number gets added", function () {
            var columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number"},
            ];
            //Default options
            var options = {};
            //Create the table
            var table = new StyledElements.ModelTable(columns, options);

            //Create and push the data
            var data = [
                {test: 0}
            ];
            var keys = Object.keys(data[0]);
            table.source.changeElements(data);

            expect(table.columnsCells[0][0].innerHTML).toBe("0");
        });
    });
})();