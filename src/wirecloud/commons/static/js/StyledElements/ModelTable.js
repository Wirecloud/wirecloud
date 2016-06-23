/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals moment, StyledElements, Symbol */

(function (utils) {

    "use strict";

    var buildHeader = function buildHeader() {
        var i, column, cell, label, tooltip;

        this[_attrs.headerCells] = [];
        for (i = 0; i < this.columns.length; i += 1) {
            column = this.columns[i];

            label = column.label != null ? column.label : column.field;

            cell = document.createElement('div');
            cell.className = 'se-model-table-cell';
            if (typeof column['class'] === 'string') {
                cell.classList.add(column['class']);
            }
            if (column.width != null && column.width !== "css") {
                cell.style.width = column.width;
                cell.style.flexGrow = 0;
            }
            cell.textContent = label;
            if (column.sortable !== false) {
                cell.classList.add('sortable');
                tooltip = new this.Tooltip({
                    content: utils.interpolate(utils.gettext('Sort by %(column_name)s'), {column_name: label}),
                    placement: ['bottom', 'top', 'right', 'left']
                });
                tooltip.bind(cell);
                cell.callback = sortByColumnCallback.bind({widget: this, column: i});
                cell.addEventListener('click', cell.callback, true);
            }
            this[_attrs.header].appendChild(cell);
            this[_attrs.headerCells].push(cell);
        }
    };

    var highlight_selection = function highlight_selection() {
        this.selection.forEach(function (id) {
            if (id in this[_attrs.current_elements]) {
                this[_attrs.current_elements][id].row.classList.add('highlight');
            }
        }, this);
    };

    var paintTable = function paintTable(items) {
        var i, j, item, row, cell, callback, today, cellContent,
            column, state;

        clearTable.call(this);

        for (i = 0; i < items.length; i += 1) {
            item = items[i];

            callback = rowCallback.bind({control: this, item: item});

            row = document.createElement('div');
            row.className = 'se-model-table-row';
            if ((i % 2) === 1) {
                row.classList.add('odd');
            }
            state = this[_attrs.stateFunc](item);
            if (state != null) {
                row.classList.add('se-model-table-row-' + state);
            }

            for (j = 0; j < this.columns.length; j += 1) {
                column = this.columns[j];

                cell = document.createElement('div');
                cell.className = 'se-model-table-cell';
                this[_attrs.columnsCells][j].push(cell);
                if (typeof column.width === 'string' && column.width !== "css") {

                    cell.style.width = column.width;
                    cell.style.flexGrow = 0;
                }
                if (typeof column['class'] === 'string') {
                    cell.classList.add(column['class']);
                }

                if (column.contentBuilder) {
                    cellContent = column.contentBuilder(item);
                } else if (column.type === 'date') {
                    if (getFieldValue(item, column.field) === '') {
                        cellContent = '';
                    } else {
                        if (!today) {
                            today = new Date();
                        }
                        cellContent = formatDate.call(this, item, column.field, today, column.dateparser);
                    }
                } else if (column.type === 'number') {
                    cellContent = getFieldValue(item, column.field);

                    if (cellContent !== '' && column.unit) {
                        cellContent = cellContent + " " + column.unit;
                    }
                } else {
                    cellContent = getFieldValue(item, column.field);
                }

                if (cellContent == null) {
                    cellContent = '';
                }

                if (typeof cellContent === 'string') {
                    cell.textContent = cellContent;
                } else if (typeof cellContent === 'number' || typeof cellContent === 'boolean') {
                    cell.textContent = "" + cellContent;
                } else if (cellContent instanceof StyledElements.StyledElement) {
                    cellContent.insertInto(cell);
                    this[_attrs.components].push(cellContent);
                } else {
                    cell.appendChild(cellContent);
                }

                cell.addEventListener('click', callback, false);
                this[_attrs.listeners].push({element: cell, callback: callback});

                row.appendChild(cell);
                if (typeof this[_attrs.extractIdFunc] === 'function') {
                    this[_attrs.current_elements][this[_attrs.extractIdFunc](item)] = {
                        row: row,
                        data: item
                    };
                }
            }

            this[_attrs.tableBody].appendChild(row);
        }

        if (items.length === 0 && this.source.currentPage) {
            row = document.createElement('div');
            row.className = 'alert alert-info se-model-table-msg';
            row.textContent = this.emptyMessage;

            this[_attrs.tableBody].appendChild(row);
        }

        highlight_selection.call(this);
    };

    var onRequestEnd = function onRequestEnd(source, error) {
        if (error == null) {
            this.reload();
        } else {
            clearTable.call(this);
            var message = document.createElement('div');
            message.className = "alert alert-danger";
            message.textContent = error;
            this[_attrs.tableBody].appendChild(message);
        }
    };

    /**
     * Each column must provide the following options:
     * * `field` (String): name of the attribute
     * * `type` (String): date, number, string, boolean
     *
     * And can provide these other optional options:
     * * `label` (String, default: null): . If not provided, the value of the `field` option will be used as label for this columns
     * * `sortable`: `false` by default.
     */
    var ModelTable = function ModelTable(columns, options) {
        var className, i, column, sort_info, sort_id, defaultOptions;

        defaultOptions = {
            'initialSortColumn': -1,
            'pageSize': 5,
            'emptyMessage': utils.gettext('No data available')
        };
        options = utils.merge(defaultOptions, options);

        if (options['class'] != null) {
            className = utils.appendWord('se-model-table full', options['class']);
        } else {
            className = 'se-model-table full';
        }

        StyledElements.StyledElement.call(this, ['click']);

        var selection = [];
        var source;
        if (options.source != null) {
            source = options.source;
        } else if (options.pagination != null) {
            // Backwards compatilibity
            source = options.pagination;
        } else {
            sort_info = {};
            for (i = 0; i < columns.length; i += 1) {
                column = columns[i];

                if (sort_id in column) {
                    sort_id = column.sort_id;
                } else {
                    sort_id = column.field;
                }
                sort_info[sort_id] = column;
            }
            source = new StyledElements.StaticPaginatedSource({pageSize: options.pageSize, sort_info: sort_info});
        }

        this[_attrs.layout] = new StyledElements.VerticalLayout({'class': className});

        Object.defineProperties(this, {
            columns: {
                writable: true,
                value: columns
            },
            emptyMessage: {
                writable: true,
                value: options.emptyMessage
            },
            selection: {
                get: function () {
                    return selection;
                },
                set: function (value) {
                    if (!Array.isArray(value)) {
                        throw new TypeError();
                    }

                    // Unhighlihgt previous selection
                    if (selection != null) {
                        selection.forEach(function (id) {
                            if (id in this[_attrs.current_elements]) {
                                this[_attrs.current_elements][id].row.classList.remove('highlight');
                            }
                        }, this);
                    }
                    selection = value;

                    // Highlight the new selection
                    highlight_selection.call(this);
                }
            },
            source: {
                writable: true,
                value: source
            },
            statusBar: {
                get: function () {
                    return this[_attrs.statusBar];
                }
            },
            columnsCells: {
                get: function () {
                    return this[_attrs.columnsCells];
                }
            }

        });

        this.wrapperElement = this[_attrs.layout].wrapperElement;

        /*
         * Header
         */
        this[_attrs.header] = this[_attrs.layout].north;
        this[_attrs.header].addClassName('se-model-table-headrow');

        buildHeader.call(this);

        /*
         * Table body
         */
        this[_attrs.components] = [];
        this[_attrs.listeners] = [];
        this[_attrs.tableBody] = this[_attrs.layout].center;
        this[_attrs.tableBody].addClassName('se-model-table-body');

        /*
         * Status bar
         */
        this[_attrs.statusBar] = this[_attrs.layout].south;
        this[_attrs.statusBar].addClassName('se-model-table-statusrow');

        this[_attrs.sortColumn] = null;

        Object.defineProperty(this, 'pagination', {get: function () { return this.source; }});

        this.source.addEventListener('requestEnd', onRequestEnd.bind(this));

        if (this.source.pOptions.pageSize !== 0) {
            this[_attrs.paginationInterface] = new StyledElements.PaginationInterface(this.source);
            this[_attrs.statusBar].appendChild(this[_attrs.paginationInterface]);
        }

        if (options.initialSortColumn === -1) {
            for (i = 0; i < this.columns.length; i += 1) {
                if (this.columns[i].sortable !== false) {
                    options.initialSortColumn = i;
                    break;
                }
            }
            if (options.initialSortColumn === -1) {
                options.initialSortColumn = null;
            }
        } else if (typeof options.initialSortColumn === 'string') {
            for (i = 0; i < this.columns.length; i += 1) {
                if (this.columns[i].field === options.initialSortColumn) {
                    options.initialSortColumn = i;
                    break;
                }
            }
            if (typeof options.initialSortColumn === 'string') {
                options.initialSortColumn = null;
            }
        }

        this.sortByColumn(options.initialSortColumn, options.initialDescendingOrder);

        this[_attrs.current_elements] = {};
        if (typeof options.id === 'string') {
            this[_attrs.extractIdFunc] = function (data) {
                return data[options.id];
            };
        } else if (typeof options.id === 'function') {
            this[_attrs.extractIdFunc] = options.id;
        }

        if (typeof options.stateFunc === 'function') {
            this[_attrs.stateFunc] = options.stateFunc;
        } else {
            this[_attrs.stateFunc] = function () {};
        }
    };
    ModelTable.prototype = new StyledElements.StyledElement();

    ModelTable.prototype.Tooltip = StyledElements.Tooltip;

    /**
     * Changes current selection
     * @since 0.6.3
     *
     * @param {String|String[]} [id]
     */
    ModelTable.prototype.select = function select(id) {
        if (id != null) {
            // Update current selection
            this.selection = Array.isArray(id) ? id : [id];
        } else {
            this.selection = [];
        }

        return this;
    };

    ModelTable.prototype.sortByColumn = function sortByColumn(column, descending) {
        var sort_id, order, oldSortHeaderCell, sortHeaderCell;

        if (this[_attrs.sortColumn] != null) {
            oldSortHeaderCell = this[_attrs.headerCells][this[_attrs.sortColumn]];
            oldSortHeaderCell.classList.remove('ascending');
            oldSortHeaderCell.classList.remove('descending');
        }
        this[_attrs.sortInverseOrder] = descending;
        this[_attrs.sortColumn] = column;

        if (this[_attrs.sortColumn] != null) {
            sortHeaderCell = this[_attrs.headerCells][this[_attrs.sortColumn]];
            if (this[_attrs.sortInverseOrder]) {
                sortHeaderCell.classList.remove('ascending');
                sortHeaderCell.classList.add('descending');
            } else {
                sortHeaderCell.classList.remove('descending');
                sortHeaderCell.classList.add('ascending');
            }

            column = this.columns[this[_attrs.sortColumn]];
            if (column.sort_id != null) {
                sort_id = column.sort_id;
            } else {
                sort_id = column.field;
            }
            if (this[_attrs.sortInverseOrder]) {
                sort_id = '-' + sort_id;
            }
            order = [sort_id];
        } else {
            order = null;
        }
        this.source.changeOptions({order: order});
    };

    var sortByColumnCallback = function sortByColumnCallback() {
        var descending = this.widget.sortColumn === this.column ?
            !this.widget.sortInverseOrder :
            false;

        this.widget.sortByColumn(this.column, descending);
    };

    var getFieldValue = function getFieldValue(item, field) {
        var fieldPath, currentNode, currentField;

        if (typeof field === "string") {
            fieldPath = [field];
        } else {
            fieldPath = field.slice();
        }

        currentNode = item;
        while (currentNode != null && fieldPath.length > 0) {
            currentField = fieldPath.splice(0, 1)[0];
            currentNode = currentNode[currentField];
        }
        if (currentNode == null || fieldPath.length > 0) {
            return "";
        }

        return currentNode;
    };

    var formatDate = function formatDate(item, field, today, dateparser) {
        var date, m, shortVersion, fullVersion, element, tooltip;

        date = getFieldValue(item, field);

        // Convert the input to a Date object
        if (typeof dateparser === 'function') {
            date = dateparser(date);
        } else if (!(date instanceof Date)) {
            date = new Date(date);
        }

        m = moment(date);
        shortVersion = m.fromNow(); // Relative date
        fullVersion = m.format('LLLL'); // Complete date

        element = document.createElement('span');
        element.textContent = shortVersion;
        tooltip = new this.Tooltip({
            content: fullVersion,
            placement: ['bottom', 'top', 'right', 'left']
        });
        tooltip.bind(element);

        // Update the realite date
        var timer = setInterval(function () {
            // Clear timer if deleted.
            if (!element.ownerDocument.body.contains(element)) {
                clearInterval(timer);
            }

            var newTime = m.fromNow();
            if (element.textContent !== newTime) {
                element.textContent = newTime;
            }
        }, 1000);

        return element;
    };

    var rowCallback = function rowCallback() {
        this.control.events.click.dispatch(this.item);
    };

    var clearTable = function clearTable() {
        var i, entry;

        for (i = 0; i < this[_attrs.listeners].length; i += 1) {
            entry = this[_attrs.listeners][i];
            entry.element.removeEventListener('click', entry.callback, false);
        }
        this[_attrs.components] = [];
        this[_attrs.listeners] = [];
        this[_attrs.columnsCells] = [];
        for (i = 0; i < this.columns.length; i += 1) {
            this[_attrs.columnsCells][i] = [];
        }
        this[_attrs.tableBody].clear();
        this[_attrs.current_elements] = {};
    };

    ModelTable.prototype.reload = function reload() {
        paintTable.call(this, this.source.getCurrentPage());
    };

    ModelTable.prototype.insertInto = function insertInto() {
        StyledElements.StyledElement.prototype.insertInto.apply(this, arguments);
    };

    ModelTable.prototype.destroy = function destroy() {
        var i, cell;

        for (i = 0; i < this[_attrs.headerCells].length; i += 1) {
            cell = this[_attrs.headerCells][i];
            if (cell.callback) {
                cell.removeEventListener('click', cell.callback, true);
                cell.callback = null;
            }
        }
        clearTable.call(this);

        this[_attrs.layout].destroy();
        this[_attrs.layout] = null;

        if (this[_attrs.paginationInterface]) {
            this[_attrs.paginationInterface].destroy();
            this[_attrs.paginationInterface] = null;
        }

        this.source.destroy();
        this.source = null;
    };

    var _attrs = {
        headerCells: Symbol("headerCells"),
        listeners: Symbol("listeners"),
        components: Symbol("components"),
        layout: Symbol("layout"),
        header: Symbol("header"),
        tableBody: Symbol("tableBody"),
        statusBar: Symbol("statusBar"),
        sortColumn: Symbol("sortColumn"),
        sortInverseOrder: Symbol("sortInverseOrder"),
        current_elements: Symbol("currentElements"),
        paginationInterface: Symbol("paginationInterface"),
        stateFunc: Symbol("stateFunc"),
        extractIdFunc: Symbol("extractIdFunc"),
        columnsCells: Symbol("columnsCells")
    };

    StyledElements.ModelTable = ModelTable;

})(StyledElements.Utils);
