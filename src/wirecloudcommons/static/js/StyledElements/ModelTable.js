/*global EzWebExt, PaginationInterface, StyledElements */

(function () {

    "use strict";

    var buildHeader = function buildHeader() {
        var i, column, cell;

        this.pHeaderCells = [];
        for (i = 0; i < this.columns.length; i += 1) {
            column = this.columns[i];

            cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.width = column.width;
            EzWebExt.setTextContent(cell, column.label);
            if (column.sortable !== false) {
                EzWebExt.addClassName(cell, 'sortable');
                cell.setAttribute('title', 'Ordenar por ' + column.label);
                cell.callback = EzWebExt.bind(this.pSortByColumnCallback, {widget: this, column: i});
                EzWebExt.addEventListener(cell, 'click', cell.callback, true);
            }
            this.header.appendChild(cell);
            this.pHeaderCells.push(cell);
        }
    };

    var ModelTable = function ModelTable(columns, options) {
        var i, column, sort_info, sort_id, defaultOptions;

        defaultOptions = {
            'initialSortColumn': -1
        };
        options = EzWebExt.merge(defaultOptions, options);

        StyledElements.StyledElement.call(this, ['click']);

        this.columns = columns;

        this.layout = new StyledElements.BorderLayout({'class': 'model_table'});
        this.wrapperElement = this.layout.wrapperElement;

        /*
         * Header
         */
        this.header = this.layout.getNorthContainer();
        this.header.addClassName('headrow');

        buildHeader.call(this);

        /*
         * Table body
         */
        this.pListeners = [];
        this.tableBody = this.layout.getCenterContainer();
        this.tableBody.addClassName('tbody');

        /*
         * Status bar
         */
        this.statusBar = this.layout.getSouthContainer();
        this.statusBar.addClassName('statusrow');

        this.sortColumn = null;
        if (options.pagination != null) {
            this.pagination = options.pagination;
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
            this.pagination = new StyledElements.StaticPaginatedSource({pageSize: 5, sort_info: sort_info});
        }
        this.paginationInterface = new PaginationInterface(this.pagination);

        this.pRefreshBody = EzWebExt.bind(this.reload, this);
        this.pagination.addEventListener('requestEnd', this.pRefreshBody);
        this.statusBar.appendChild(this.paginationInterface);

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
    };
    ModelTable.prototype = new StyledElements.StyledElement();

    ModelTable.prototype.repaint = function repaint() {
        this.layout.repaint();
        this.resizeColumns();
    };

    ModelTable.prototype.resizeColumns = function resizeColumns() {
        var i, j, autocells = [], extra_width, autowidth, columnCells;

        extra_width = this.header.wrapperElement.offsetWidth;
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
            this.pHeaderCells[autocells[i]].style.width = (autowidth - 16) + 'px';
            for (j = 0; j < columnCells.length; j += 1) {
                columnCells[j].style.width = (autowidth - 16) + 'px';
            }
        }
    };

    ModelTable.prototype.pSortByColumn = function pSortByColumn(column, descending) {
        var sort_id, order, oldSortHeaderCell, sortHeaderCell;

        if (this.sortColumn != null) {
            oldSortHeaderCell = this.pHeaderCells[this.sortColumn];
            EzWebExt.removeClassName(oldSortHeaderCell, 'ascending');
            EzWebExt.removeClassName(oldSortHeaderCell, 'descending');
        }
        this.sortInverseOrder = descending;
        this.sortColumn = column;

        if (this.sortColumn != null) {
            sortHeaderCell = this.pHeaderCells[this.sortColumn];
            if (this.sortInverseOrder) {
                EzWebExt.removeClassName(sortHeaderCell, 'ascending');
                EzWebExt.addClassName(sortHeaderCell, 'descending');
            } else {
                EzWebExt.removeClassName(sortHeaderCell, 'descending');
                EzWebExt.addClassName(sortHeaderCell, 'ascending');
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
        this.pagination.changeOptions({order: order});
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
        while (currentNode !== null && fieldPath.length > 0) {
            currentField = fieldPath.splice(0, 1)[0];
            currentNode = currentNode[currentField];
        }
        if (currentNode === null || fieldPath.length > 0) {
            return "";
        }

        return currentNode;
    };

    ModelTable.prototype.pFormatDate = function pFormatDate(item, field, today, dateparser) {
        var date, formatedDate, sameDay, shortVersion, fullVersion, element;

        date = this.pGetFieldValue(item, field);

        if (typeof dateparser === 'function') {
            formatedDate = dateparser(date);
        } else {
            formatedDate = new Date(date);
        }
        formatedDate.locale = 'es';

        sameDay = (formatedDate.getDate() === today.getDate()) &&
            (formatedDate.getMonth() === today.getMonth()) &&
            (formatedDate.getFullYear() === today.getFullYear());

        if (sameDay) {
            shortVersion = formatedDate.strftime('%R');
        } else {
            shortVersion = formatedDate.strftime('%x');
        }
        fullVersion = formatedDate.strftime('%c');

        element = document.createElement('span');
        EzWebExt.setTextContent(element, shortVersion);
        element.setAttribute('title', fullVersion);

        return element;
    };

    ModelTable.prototype.pRowCallback = function pRowCallback() {
        this.control.events.click.dispatch(this.item);
    };

    ModelTable.prototype.pClearTable = function pClearTable() {
        var i, entry;

        for (i = 0; i < this.pListeners.length; i += 1) {
            entry = this.pListeners[i];
            EzWebExt.removeEventListener(entry.element, 'click', entry.callback, false);
        }
        this.pListeners = [];
        this.columnsCells = [];
        for (i = 0; i < this.columns.length; i += 1) {
            this.columnsCells[i] = [];
        }
        this.tableBody.clear();
    };

    ModelTable.prototype.reload = function reload() {
        this.pPaintTable(this.pagination.getCurrentPage());
    };

    ModelTable.prototype.pPaintTable = function pPaintTable(items) {
        var i, j, item, row, cell, cellWrapper, callback, today, cellContent,
            column;

        this.pClearTable();

        for (i = 0; i < items.length; i += 1) {
            item = items[i];

            callback = EzWebExt.bind(this.pRowCallback, {control: this, item: item});

            row = document.createElement('div');
            row.className = 'row';
            if ((i % 2) === 1) {
                EzWebExt.appendClassName(row, 'odd');
            }

            for (j = 0; j < this.columns.length; j += 1) {
                column = this.columns[j];

                cell = document.createElement('div');
                cell.className = 'cell';
                this.columnsCells[j].push(cell);
                if (typeof column.width === 'string') {
                    cell.style.width = column.width;
                }

                cellWrapper = document.createElement('div');
                cellWrapper.className = 'cellWrapper';
                cell.appendChild(cellWrapper);
                if (typeof column['class'] === 'string') {
                    EzWebExt.addClassName(cellWrapper, column['class']);
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
                } else {
                    cellContent = this.pGetFieldValue(item, column.field);
                }

                if (!cellContent) {
                    cellContent = '';
                }

                if (typeof cellContent === 'string') {
                    EzWebExt.setTextContent(cellWrapper, cellContent);
                } else if (typeof cellContent === 'number' || typeof cellContent === 'boolean') {
                    EzWebExt.setTextContent(cellWrapper, "" + cellContent);
                } else if (cellContent instanceof StyledElements.StyledElement) {
                    cellContent.insertInto(cellWrapper);
                } else {
                    cellWrapper.appendChild(cellContent);
                }

                EzWebExt.addEventListener(cellWrapper, 'click', callback, false);
                this.pListeners.push({element: cellWrapper, callback: callback});

                row.appendChild(cell);
            }

            this.tableBody.appendChild(row);
        }

        this.resizeColumns();
    };

    ModelTable.prototype.destroy = function destroy() {
        var i, cell;

        for (i = 0; i < this.pHeaderCells.length; i += 1) {
            cell = this.pHeaderCells[i];
            if (cell.callback) {
                EzWebExt.removeEventListener(cell, 'click', cell.callback, true);
                cell.callback = null;
            }
        }
        this.pClearTable();

        this.layout.destroy();
        this.layout = null;

        this.paginationInterface.destroy();
        this.paginationInterface = null;

        this.pagination.destroy();
        this.pagination = null;

        this.pRefreshBody = null;
    };

    StyledElements.ModelTable = ModelTable;
})();
