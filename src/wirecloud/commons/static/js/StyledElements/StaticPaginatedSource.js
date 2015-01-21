/*
 *     Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*globals StyledElements, Wirecloud*/

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

    var elementPassFilter = function elementPassFilter(element, pattern) {
        return Object.getOwnPropertyNames(element).some(function (key, index, array) {
            var value = getFieldValue(element, key);
            switch (typeof value) {
            case "number":
                return pattern.test("" + value);
            case "string":
                return pattern.test(value);
            default:
                return false;
            }
        });
    };

    var filterElements = function filterElements(keywords) {
        var filteredElements, i, element;

        if (!keywords) {
            this.filteredElements = this.elements;
            return;
        }

        this._currentPattern = new RegExp(StyledElements.Utils.escapeRegExp(keywords), 'i');
        filteredElements = [];
        for (i = 0; i < this.elements.length; i += 1) {
            element = this.elements[i];
            if (elementPassFilter.call(this, element, this._currentPattern)) {
                filteredElements.push(element);
            }
        }
        this.filteredElements = filteredElements;
    };

    var sortElements = function sortElements(order) {
        var sort_id, inverse, column, sortFunc, parseDate;

        if (order == null) {
            this.sortedElements = this.filteredElements;
            return;
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
                sortFunc = function (value1, value2) {
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
                }.bind({field: column.field});
                break;
            case "number":
                sortFunc = function (value1, value2) {
                    value1 = getFieldValue(value1, this.field);
                    value1 = value1 !== null ? Number(value1) : 0;

                    value2 = getFieldValue(value2, this.field);
                    value2 = value2 !== null ? Number(value2) : 0;

                    return value1 - value2;
                }.bind({field: column.field});
                break;
            //case "text":
            default:
                sortFunc = function (value1, value2) {
                    value1 = getFieldValue(value1, this.field);
                    value1 = value1 !== null ? value1 : '';

                    value2 = getFieldValue(value2, this.field);
                    value2 = value2 !== null ? value2 : '';

                    return value1.localeCompare(value2);
                }.bind({field: column.field});
            }
        }

        if (inverse) {
            sortFunc = function (value1, value2) {
                return -this(value1, value2);
            }.bind(sortFunc);
        }
        this.sortedElements = this.filteredElements.sort(sortFunc);
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
        onSuccess(elements, {current_page: page, total_count: this.filteredElements.length});
    };

    var StaticPaginatedSource = function StaticPaginatedSource(options) {
        if (typeof options !== 'object') {
            options = {};
        }
        options.requestFunc = requestFunc.bind(this);

        StyledElements.PaginatedSource.call(this, options);

        this.sort_info = options.sort_info;
        if (typeof this.sort_info !== 'object') {
            this.sort_info = {};
        }

        if (Array.isArray(options.initialElements)) {
            this.changeElements(options.initialElements);
        } else {
            this.elements = [];
            this.filteredElements = [];
            this.sortedElements = [];
        }
    };
    StaticPaginatedSource.prototype = new StyledElements.PaginatedSource();

    StaticPaginatedSource.prototype.changeOptions = function changeOptions(newOptions) {
        var column, sort_id, inverse, force_sort = false;

        if ('keywords' in newOptions) {
            filterElements.call(this, newOptions.keywords);
            force_sort = true;
        }

        if ('order' in newOptions) {
            sortElements.call(this, newOptions.order);
        } else if (force_sort) {
            sortElements.call(this, this.pOptions.order);
        }
        StyledElements.PaginatedSource.prototype.changeOptions.call(this, newOptions);
    };

    StaticPaginatedSource.prototype.changeElements = function changeElements(newElements) {
        var sort_id, column;

        if (Array.isArray(newElements)) {
            this.elements = newElements;
        } else {
            this.elements = [];
        }
        filterElements.call(this, this.pOptions.keywords);
        sortElements.call(this, this.pOptions.order);

        this.refresh();
    };

    StaticPaginatedSource.prototype.addElement = function addElement(newElement) {
        this.elements.push(newElement);

        if (elementPassFilter.call(this, newElement, this._currentPattern)) {
            this.filteredElements.push(newElement);
            sortElements.call(this, this.pOptions.order);

            this.refresh();
        }
    };

    StyledElements.StaticPaginatedSource = StaticPaginatedSource;
})();
