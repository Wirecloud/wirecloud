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

/* globals CSSPrimitiveValue, moment, StyledElements */

(function (utils) {

    "use strict";

    var buildHeader = function buildHeader() {
        var i, column, cell, label, tooltip;

        this.pHeaderCells = [];
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
            }
            cell.textContent = label;
            if (column.sortable !== false) {
                cell.classList.add('sortable');
                tooltip = new this.Tooltip({
                    content: utils.interpolate(utils.gettext('Sort by %(column_name)s'), {column_name: label}),
                    placement: ['bottom', 'top', 'right', 'left']
                });
                tooltip.bind(cell);
                cell.callback = this.pSortByColumnCallback.bind({widget: this, column: i});
                cell.addEventListener('click', cell.callback, true);
            }
            this.header.appendChild(cell);
            this.pHeaderCells.push(cell);
        }
    };

    var applyWidth = function applyWidth(cell, width) {
        var cellStyle, paddingLeft, paddingRight;

        cellStyle = document.defaultView.getComputedStyle(cell, null);
        if (cellStyle.getPropertyCSSValue('display') == null) {
            cell.style.widht = '0';
            return;
        }
        paddingLeft = cellStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX);
        paddingRight = cellStyle.getPropertyCSSValue('padding-right').getFloatValue(CSSPrimitiveValue.CSS_PX);

        cell.style.width = (width - paddingLeft - paddingRight) + 'px';
    };

    var highlight_selection = function highlight_selection() {
        this.selection.forEach(function (id) {
            if (id in this._current_elements) {
                this._current_elements[id].row.classList.add('highlight');
            }
        }, this);
    };

    var paintTable = function paintTable(items) {
        var i, j, item, row, cell, callback, today, cellContent,
            column, state;

        clearTable.call(this);

        for (i = 0; i < items.length; i += 1) {
            item = items[i];

            callback = this.pRowCallback.bind({control: this, item: item});

            row = document.createElement('div');
            row.className = 'se-model-table-row';
            if ((i % 2) === 1) {
                row.classList.add('odd');
            }
            state = this._stateFunc(item);
            if (state != null) {
                row.classList.add('se-model-table-row-' + state);
            }

            for (j = 0; j < this.columns.length; j += 1) {
                column = this.columns[j];

                cell = document.createElement('div');
                cell.className = 'se-model-table-cell';
                this.columnsCells[j].push(cell);
                if (typeof column.width === 'string' && column.width !== "css") {
                    cell.style.width = column.width;
                }
                if (typeof column['class'] === 'string') {
                    cell.classList.add(column['class']);
                }

                if (column.contentBuilder) {
                    cellContent = column.contentBuilder(item);
                } else if (column.type === 'date') {
                    if (this.pGetFieldValue(item, column.field) === '') {
                        cellContent = '';
                    } else {
                        if (!today) {
                            today = new Date();
                        }
                        cellContent = this.pFormatDate(item, column.field, today, column.dateparser);
                    }
                } else if (column.type === 'number') {
                    cellContent = this.pGetFieldValue(item, column.field);

                    if (cellContent !== '' && column.unit) {
                        cellContent = cellContent + " " + column.unit;
                    }
                } else {
                    cellContent = this.pGetFieldValue(item, column.field);
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
                    this.pComponents.push(cellContent);
                } else {
                    cell.appendChild(cellContent);
                }

                cell.addEventListener('click', callback, false);
                this.pListeners.push({element: cell, callback: callback});

                row.appendChild(cell);
                if (typeof this._extract_id === 'function') {
                    this._current_elements[this._extract_id(item)] = {
                        row: row,
                        data: item
                    };
                }
            }

            this.tableBody.appendChild(row);
        }

        if (items.length === 0 && this.source.currentPage) {
            row = document.createElement('div');
            row.className = 'alert alert-info se-model-table-msg';
            row.textContent = this.emptyMessage;

            this.tableBody.appendChild(row);
        }

        highlight_selection.call(this);
        this.resizeColumns();
        this.resizeColumns();
    };

    var onRequestEnd = function onRequestEnd(source, error) {
        if (error == null) {
            this.reload();
        } else {
            clearTable.call(this);
            var message = document.createElement('div');
            message.className = "alert alert-danger";
            message.textContent = error;
            this.tableBody.appendChild(message);
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

        StyledElements.StyledElement.call(this, ['click']);

        this.columns = columns;
        this.emptyMessage = options.emptyMessage;

        /**
         * select attribute
         */
        var selection = [];
        Object.defineProperty(this, 'selection', {
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
                        if (id in this._current_elements) {
                            this._current_elements[id].row.classList.remove('highlight');
                        }
                    }, this);
                }
                selection = value;

                // Highlight the new selection
                highlight_selection.call(this);
            }
        });


        if (options['class'] != null) {
            className = utils.appendWord('se-model-table full', options['class']);
        } else {
            className = 'se-model-table full';
        }
        this.layout = new StyledElements.VerticalLayout({'class': className});
        this.wrapperElement = this.layout.wrapperElement;

        /*
         * Header
         */
        this.header = this.layout.north;
        this.header.addClassName('se-model-table-headrow');

        buildHeader.call(this);

        /*
         * Table body
         */
        this.pComponents = [];
        this.pListeners = [];
        this.tableBody = this.layout.center;
        this.tableBody.addClassName('se-model-table-body');

        /*
         * Status bar
         */
        this.statusBar = this.layout.south;
        this.statusBar.addClassName('se-model-table-statusrow');

        this.sortColumn = null;
        if (options.source != null) {
            this.source = options.source;
        } else if (options.pagination != null) {
            // Backwards compatilibity
            this.source = options.pagination;
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
            this.source = new StyledElements.StaticPaginatedSource({pageSize: options.pageSize, sort_info: sort_info});
        }
        Object.defineProperty(this, 'pagination', {get: function () { return this.source; }});

        this.source.addEventListener('requestEnd', onRequestEnd.bind(this));

        if (this.source.pOptions.pageSize !== 0) {
            this.paginationInterface = new StyledElements.PaginationInterface(this.source);
            this.statusBar.appendChild(this.paginationInterface);
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

        this.pSortByColumn(options.initialSortColumn, options.initialDescendingOrder);

        this._current_elements = {};
        if (typeof options.id === 'string') {
            this._extract_id = function (data) {
                return data[options.id];
            };
        } else if (typeof options.id === 'function') {
            this._extract_id = options.id;
        }

        if (typeof options.stateFunc === 'function') {
            this._stateFunc = options.stateFunc;
        } else {
            this._stateFunc = function () {};
        }
    };
    ModelTable.prototype = new StyledElements.StyledElement();

    ModelTable.prototype.Tooltip = StyledElements.Tooltip;

    ModelTable.prototype.repaint = function repaint() {
        this.layout.repaint();
        this.resizeColumns();
    };

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

    ModelTable.prototype.resizeColumns = function resizeColumns() {
        var i, j, autocells = [], extra_width, autowidth, columnCells;

        extra_width = this.tableBody.wrapperElement.clientWidth;
        for (i = 0; i < this.columns.length; i += 1) {
            if (typeof this.columns[i].width !== 'string') {
                autocells.push(i);
            } else {
                extra_width -= this.pHeaderCells[i].offsetWidth;
            }
        }

        autowidth = extra_width / autocells.length;

        for (i = 0; i < autocells.length; i += 1) {
            columnCells = this.columnsCells[autocells[i]];

            applyWidth(this.pHeaderCells[autocells[i]], autowidth);
            for (j = 0; j < columnCells.length; j += 1) {
                applyWidth(columnCells[j], autowidth);
            }
        }

        for (i = 0; i < this.pComponents.length; i += 1) {
            this.pComponents[i].repaint();
        }
    };

    ModelTable.prototype.pSortByColumn = function pSortByColumn(column, descending) {
        var sort_id, order, oldSortHeaderCell, sortHeaderCell;

        if (this.sortColumn != null) {
            oldSortHeaderCell = this.pHeaderCells[this.sortColumn];
            oldSortHeaderCell.classList.remove('ascending');
            oldSortHeaderCell.classList.remove('descending');
        }
        this.sortInverseOrder = descending;
        this.sortColumn = column;

        if (this.sortColumn != null) {
            sortHeaderCell = this.pHeaderCells[this.sortColumn];
            if (this.sortInverseOrder) {
                sortHeaderCell.classList.remove('ascending');
                sortHeaderCell.classList.add('descending');
            } else {
                sortHeaderCell.classList.remove('descending');
                sortHeaderCell.classList.add('ascending');
            }

            column = this.columns[this.sortColumn];
            if (column.sort_id != null) {
                sort_id = column.sort_id;
            } else {
                sort_id = column.field;
            }
            if (this.sortInverseOrder) {
                sort_id = '-' + sort_id;
            }
            order = [sort_id];
        } else {
            order = null;
        }
        this.source.changeOptions({order: order});
    };

    ModelTable.prototype.pSortByColumnCallback = function pSortByColumnCallback() {
        var descending = this.widget.sortColumn === this.column ?
            !this.widget.sortInverseOrder :
            false;

        this.widget.pSortByColumn(this.column, descending);
    };

    ModelTable.prototype.pGetFieldValue = function pGetFieldValue(item, field) {
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

    ModelTable.prototype.pFormatDate = function pFormatDate(item, field, today, dateparser) {
        var date, m, shortVersion, fullVersion, element, tooltip;

        date = this.pGetFieldValue(item, field);

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

    ModelTable.prototype.pRowCallback = function pRowCallback() {
        this.control.events.click.dispatch(this.item);
    };

    var clearTable = function clearTable() {
        var i, entry;

        for (i = 0; i < this.pListeners.length; i += 1) {
            entry = this.pListeners[i];
            entry.element.removeEventListener('click', entry.callback, false);
        }
        this.pComponents = [];
        this.pListeners = [];
        this.columnsCells = [];
        for (i = 0; i < this.columns.length; i += 1) {
            this.columnsCells[i] = [];
        }
        this.tableBody.clear();
        this._current_elements = {};
    };

    ModelTable.prototype.reload = function reload() {
        paintTable.call(this, this.source.getCurrentPage());
    };

    ModelTable.prototype.insertInto = function insertInto() {
        StyledElements.StyledElement.prototype.insertInto.apply(this, arguments);
        this.repaint();
    };

    ModelTable.prototype.destroy = function destroy() {
        var i, cell;

        for (i = 0; i < this.pHeaderCells.length; i += 1) {
            cell = this.pHeaderCells[i];
            if (cell.callback) {
                cell.removeEventListener('click', cell.callback, true);
                cell.callback = null;
            }
        }
        clearTable.call(this);

        this.layout.destroy();
        this.layout = null;

        if (this.paginationInterface) {
            this.paginationInterface.destroy();
            this.paginationInterface = null;
        }

        this.source.destroy();
        this.source = null;
    };

    StyledElements.ModelTable = ModelTable;

})(StyledElements.Utils);
