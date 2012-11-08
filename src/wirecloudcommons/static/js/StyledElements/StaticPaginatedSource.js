/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

/*globals EzWebExt, StyledElements*/

(function () {

    "use strict";

    var getFieldValue = function getFieldValue(item, field) {
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

    var sortElements = function sortElements(order) {
        var sort_id, inverse, column, sortFunc, parseDate;

        if (order == null) {
            return this.elements;
        }

        sort_id = order[0];
        inverse = false;
        if (sort_id[0] === '-') {
            inverse = true;
            sort_id = sort_id.substr(1);
        }
        column = this.sort_info[sort_id];
        sortFunc = column.sortFunc;

        if (sortFunc == null) {
            switch (column.type) {
            case "date":
                if (typeof column.dateparser === 'function') {
                    parseDate = column.dateparser;
                } else {
                    parseDate = function (string) {
                        return new Date(string);
                    };
                }
                sortFunc = EzWebExt.bind(function (value1, value2) {
                    value1 = getFieldValue(value1, this.field);
                    try {
                        value1 = parseDate(value1);
                    } catch (e) {
                        value1 = new Date(0);
                    }

                    value2 = getFieldValue(value2, this.field);
                    try {
                        value2 = parseDate(value2);
                    } catch (e2) {
                        value2 = new Date(0);
                    }

                    return value1 - value2;
                }, {field: column.field});
                break;
            case "number":
                sortFunc = EzWebExt.bind(function (value1, value2) {
                    value1 = getFieldValue(value1, this.field);
                    value1 = value1 !== null ? Number(value1) : 0;

                    value2 = getFieldValue(value2, this.field);
                    value2 = value2 !== null ? Number(value2) : 0;

                    return value1 - value2;
                }, {field: column.field});
                break;
            //case "text":
            default:
                sortFunc = EzWebExt.bind(function (value1, value2) {
                    value1 = getFieldValue(value1, this.field);
                    value1 = value1 !== null ? value1 : '';

                    value2 = getFieldValue(value2, this.field);
                    value2 = value2 !== null ? value2 : '';

                    return value1.localeCompare(value2);
                }, {field: column.field});
            }
        }

        if (inverse) {
            sortFunc = EzWebExt.bind(function (value1, value2) {
                return -this(value1, value2);
            }, sortFunc);
        }
        this.sortedElements = this.elements.sort(sortFunc);
    };

    var requestFunc = function requestFunc(index, options, onSuccess, onError) {
        var page = index;

        if (index > this.totalPages) {
            index = this.totalPages;
        }
        index -= 1;

        var start = index * options.pageSize;
        var end = start + options.pageSize;

        var elements = this.sortedElements.slice(start, end);
        onSuccess(elements, {current_page: page, total_count: this.pCachedTotalCount});
    };

    var StaticPaginatedSource = function StaticPaginatedSource(options) {
        if (typeof options !== 'object') {
            options = {};
        }
        options.requestFunc = requestFunc.bind(this);

        StyledElements.Pagination.call(this, options);

        this.sort_info = options.sort_info;
        if (typeof this.sort_info !== 'object') {
            this.sort_info = {};
        }

        if (Array.isArray(options.initialElements)) {
            this.changeElements(options.initialElements);
        } else {
            this.elements = [];
        }
    };
    StaticPaginatedSource.prototype = new StyledElements.Pagination();

    StaticPaginatedSource.prototype.changeOptions = function changeOptions(newOptions) {
        var column, sort_id, inverse;

        if ('order' in newOptions) {
            sortElements.call(this, newOptions.order);
        }
        StyledElements.Pagination.prototype.changeOptions.call(this, newOptions);
    };

    StaticPaginatedSource.prototype.changeElements = function changeElements(newElements) {
        var sort_id, column;

        this.elements = newElements;
        sortElements.call(this, this.pOptions.order);

        this.pCachedTotalCount = newElements.length;
        this._calculatePages();
        this.refresh();
    };

    StaticPaginatedSource.prototype.addElement = function addElement(newElement) {
        this.elements.push(newElement);
        sortElements.call(this, this.pOptions.order);

        this.pCachedTotalCount = this.elements.length;
        this._calculatePages();
        this.refresh();
    };

    StyledElements.StaticPaginatedSource = StaticPaginatedSource;
})();
