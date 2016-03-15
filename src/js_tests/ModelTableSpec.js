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

        it("ModelTable should be created", function () {
            var columns = [
                {field: "test", "label": "TestName", type: "string"}
            ];
            //Default options
            var options = {};
            //Create the table
            var table = new StyledElements.ModelTable(columns, options);

            expect(table).not.toBe(null);
        });

        it("data should be added to the model tables", function () {
            var columns = [
                {field: "test", "label": "TestName", sortable: false, type: "string"},
                {field: "test2", "label": "TestName", sortable: false, type: "string"}
            ];
            //Default options
            var options = {};
            //Create the table
            var table = new StyledElements.ModelTable(columns, options);

            //Create and push the data
            var data = [
                {test: "Hello", test2: "world"},
                {test: "Bye", test2: "5"}
            ];
            var keys = Object.keys(data[0]);
            table.source.changeElements(data);

            var cols = table.columnsCells;

            //Check data was added
            for (var i = 0; i< cols.length; i++) {
                for (var j = 0; j < cols[i].length; j++) {
                    expect(table.columnsCells[i][j].innerHTML).toBe(data[j][keys[i]]);                    
                }
            }
        });

        it("Test 0 number gets added", function () {
            var columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number"}
            ];
            //Default options
            var options = {};
            //Create the table
            var table = new StyledElements.ModelTable(columns, options);

            //Create and push the data
            var data = [
                {test: 0}
            ];
            table.source.changeElements(data);

            expect(table.columnsCells[0][0].innerHTML).toBe("0");
        });

        it("Data should be able to be sorted", function () {
            var columns = [
                {field: "test", "label": "TestName", sortable: true, type: "number"},
                {field: "test2", "label": "TestName", sortable: true, type: "number"}
            ];
            //Default options
            var options = {
                initialSortColumn: 0
            };
            //Create the table
            var table = new StyledElements.ModelTable(columns, options);

            //Create and push the data
            var data = [
                {test: 2, test2: 1},
                {test: 1, test2: 2}
            ];
            table.source.changeElements(data);

            //Check if data was sorted by default
            expect(table.columnsCells[0][0].innerHTML).toBe("1");
            expect(table.columnsCells[1][0].innerHTML).toBe("2");
            expect(table.columnsCells[0][1].innerHTML).toBe("2");
            expect(table.columnsCells[1][1].innerHTML).toBe("1");

            //Change the sort order
            table.pSortByColumn(0, true);

            expect(table.columnsCells[0][0].innerHTML).toBe("2");
            expect(table.columnsCells[1][0].innerHTML).toBe("1");
            expect(table.columnsCells[0][1].innerHTML).toBe("1");
            expect(table.columnsCells[1][1].innerHTML).toBe("2");

        });

        it("Test selecting", function () {
            var columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number"}
            ];
            //Default options
            var options = {};
            //Create the table
            var table = new StyledElements.ModelTable(columns, options);

            //Create and push the data
            var data = [
                {test: "hello world"},
                {test: "bye world"},

            ];
            table.source.changeElements(data);

            //Select first row
            table.select(0);

            expect(table.selection.length).toBe(1);
            expect(table.selection[0]).toBe(0);

            //Select second row
            table.select(1);

            expect(table.selection.length).toBe(1);
            expect(table.selection[0]).toBe(1);

            //Select both rows
            table.select([0,1]);

            expect(table.selection.length).toBe(2);
            expect(table.selection[0]).toBe(0);
            expect(table.selection[1]).toBe(1);

            //Deselect all
            table.select(null);
            expect(table.selection.length).toBe(0);

        });

        it("Model table should be able to get resetted", function () {
            var columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number"}
            ];
            //Default options
            var options = {};
            //Create the table
            var table = new StyledElements.ModelTable(columns, options);

            //Create and push the data
            var data = [
                {test: "hello world"}
            ];
            table.source.changeElements(data);

            expect(table.columnsCells[0][0].innerHTML).toBe("hello world");

            //Wipe the data
            table.pClearTable();

            expect(table.columnsCells[0].length).toBe(0);
        });

        it("Destroy model table", function () {
                        var columns = [
                {field: "test", "label": "TestName", sortable: false, type: "number"}
            ];
            //Default options
            var options = {};
            //Create the table
            var table = new StyledElements.ModelTable(columns, options);

            //Create and push the data
            var data = [
                {test: "hello world"}
            ];
            table.source.changeElements(data);

            expect(table.columnsCells[0][0].innerHTML).toBe("hello world");

            //Wipe the data
            table.destroy();

            expect(table.columnsCells[0].length).toBe(0);
            expect(table.layout).toBe(null);
            expect(table.source).toBe(null);
        });
    });
})();