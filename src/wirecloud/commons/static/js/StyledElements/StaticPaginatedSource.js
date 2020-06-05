/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements */


(function (utils) {

    "use strict";

    var getFieldValue = function getFieldValue(item, field) {
        var fieldPath, currentNode, currentField;

        if (typeof field === "string") {
            fieldPath = [field];
        } else {
            fieldPath = field.slice(0);
        }

        currentNode = item;
        while (currentNode != null && fieldPath.length > 0) {
            currentField = fieldPath.splice(0, 1)[0];
            currentNode = currentNode[currentField];
        }
        if (fieldPath.length > 0) {
            return undefined;
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

    var createFilterPattern = function createFilterPattern(keywords) {
        return new RegExp(utils.escapeRegExp(keywords), 'i');
    };

    var filterElements = function filterElements(keywords) {
        var filteredElements, i, element;
        var priv = privates.get(this);

        if (!keywords) {
            priv.filteredElements = priv.elements.slice(0);
            return;
        }

        var pattern = createFilterPattern(keywords);
        filteredElements = [];
        for (i = 0; i < priv.elements.length; i += 1) {
            element = priv.elements[i];
            if (elementPassFilter.call(this, element, pattern)) {
                filteredElements.push(element);
            }
        }
        priv.filteredElements = filteredElements;
    };

    var sortElements = function sortElements(order) {
        var sort_id, inverse, column, sortFunc, parseDate;
        var priv = privates.get(this);

        if (order == null) {
            priv.sortedElements = priv.filteredElements;
            return;
        }

        sort_id = order[0];
        inverse = false;
        if (sort_id[0] === '-') {
            inverse = true;
            sort_id = sort_id.substr(1);
        }
        column = priv.sort_info[sort_id] || {};
        if (!('field' in column)) {
            column.field = sort_id;
        }
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
                        if (isNaN(value1.getTime())) {
                            throw new Error();
                        }
                    } catch (e) {
                        value1 = new Date(0);
                    }

                    value2 = getFieldValue(value2, this.field);
                    try {
                        value2 = parseDate(value2);
                        if (isNaN(value2.getTime())) {
                            throw new Error();
                        }
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
            default:
            case "text":
                sortFunc = function (value1, value2) {
                    value1 = getFieldValue(value1, this.field);
                    value1 = value1 != null ? value1.toString() : '';

                    value2 = getFieldValue(value2, this.field);
                    value2 = value2 != null ? value2.toString() : '';

                    return value1.localeCompare(value2);
                }.bind({field: column.field});
            }
        }

        if (inverse) {
            sortFunc = function (value1, value2) {
                return -this(value1, value2);
            }.bind(sortFunc);
        }
        priv.sortedElements = priv.filteredElements.slice(0).sort(sortFunc);
    };

    var requestFunc = function requestFunc(index, options, onSuccess, onError) {
        var elements, page = index;
        var priv = privates.get(this);

        if (index > priv.totalPages) {
            index = priv.totalPages;
        }
        index -= 1;

        filterElements.call(this, this.options.keywords);
        sortElements.call(this, this.options.order);

        if (options.pageSize > 0) {
            var start = index * options.pageSize;
            var end = start + options.pageSize;
            elements = priv.sortedElements.slice(start, end);
        } else {
            elements = priv.sortedElements;
        }

        onSuccess(elements, {current_page: page, total_count: priv.sortedElements.length});
    };

    var onLengthGet = function onLengthGet() {
        return privates.get(this).elements.length;
    };

    /**
     * Creates a new instance of class StaticPaginatedSource.
     *
     * @since 0.5
     * @constructor
     * @extends {StyledElements.PaginatedSource}
     * @name StyledElements.StaticPaginatedSource
     * @param {Object} options
     *      The options to be used
     */
    var StaticPaginatedSource = function StaticPaginatedSource(options) {
        if (typeof options !== 'object') {
            options = {};
        }
        options.requestFunc = requestFunc.bind(this);

        StyledElements.PaginatedSource.call(this, options);

        // Initialize private variables
        var priv = {};
        privates.set(this, priv);

        priv.sort_info = options.sort_info;
        if (typeof priv.sort_info !== 'object') {
            priv.sort_info = {};
        }

        // Properties
        Object.defineProperties(this, {
            length: {
                get: onLengthGet
            }
        });

        // Initialize source status
        this.changeElements(options.initialElements);
    };
    utils.inherit(StaticPaginatedSource, StyledElements.PaginatedSource);

    /**
     * Updates the options used by this StaticPaginatedSource
     *
     * @since 0.5
     *
     * @param {Object} newOptions
     *      The new options to be used.
     */
    StaticPaginatedSource.prototype.changeOptions = function changeOptions(newOptions) {
        var force_sort = false;

        if ('keywords' in newOptions) {
            filterElements.call(this, newOptions.keywords);
            force_sort = true;
        }

        if ('order' in newOptions) {
            sortElements.call(this, newOptions.order);
        } else if (force_sort) {
            sortElements.call(this, this.options.order);
        }
        return StyledElements.PaginatedSource.prototype.changeOptions.call(this, newOptions);
    };

    /**
     * Updates the elements of the StaticPaginatedSource
     *
     * @since 0.8
     *
     * @returns {Array}
     *      Elements currently managed by this StaticPaginatedSource
     */
    StaticPaginatedSource.prototype.getElements = function getElements() {
        return privates.get(this).elements.slice(0);
    };

    // Search the position of the element
    var searchElement = function searchElement(list, el, idAttr) {
        if (!idAttr) {
            return -2;
        }
        var pos = -1;
        list.every(function (elem, i) {
            if (getFieldValue(elem, idAttr) === getFieldValue(el, idAttr)) {
                pos = i;
                return false;
            } else {
                return true;
            }
        });

        return pos;
    };

    /**
     * Updates the elements of the StaticPaginatedSource
     *
     * @since 0.5
     *
     * @param {Array.<Object>} newElements
     *      The new elements to be used.
     * @returns {StaticPaginatedSource}
     *      The instance on which the member is called.
     */
    StaticPaginatedSource.prototype.changeElements = function changeElements(newElements) {
        var priv = privates.get(this);
        if (Array.isArray(newElements)) {
            if (this.options.idAttr) {
                var bol = newElements.every(function (elem, i) {
                    if (getFieldValue(elem, this.options.idAttr) == null) {
                        throw new Error("All elements must have a valid ID");
                    }
                    return searchElement(newElements.slice(0, i), elem, this.options.idAttr) <= -1;
                }.bind(this));
                if (!bol) {
                    throw new Error("All elements must have an unique ID");
                }
            }
            priv.elements = newElements;

        } else {
            priv.elements = [];
        }

        filterElements.call(this, this.options.keywords);
        sortElements.call(this, this.options.order);

        this.refresh();

        return this;
    };

    /**
     * Adds or updates an element to the StaticPaginatedSource
     *
     * @since 0.5
     *
     * @param {Object} newElement
     *      The element to be added / updated.
     *
     * @returns {StaticPaginatedSource}
     *      The instance on which the member is called.
     */
    StaticPaginatedSource.prototype.addElement = function addElement(newElement) {
        var priv = privates.get(this);

        if (this.options.idAttr && getFieldValue(newElement, this.options.idAttr) == null) {
            throw new Error("The element must have a valid ID");
        }

        // If the element already exists, remove it and add it again (updates it and sets it last)
        var pos = searchElement(priv.elements, newElement, this.options.idAttr);
        if (pos >= 0) {
            priv.elements.splice(pos, 1);
        }

        // Add the element to the source
        priv.elements.push(newElement);
        // Remove it from the filtered elements
        pos = searchElement(priv.filteredElements, newElement, this.options.idAttr);
        if (pos >= 0) {
            priv.filteredElements.splice(pos, 1);
        }

        // Filter the new element if there are any filters set.
        if (this.options.keywords) {
            var pattern = createFilterPattern(this.options.keywords);
            if (elementPassFilter.call(this, newElement, pattern)) {
                priv.filteredElements.push(newElement);
            }
        } else {
            // IF there are no filters adds it.
            priv.filteredElements.push(newElement);
        }

        sortElements.call(this, this.options.order);
        this.refresh();

        return this;
    };

    /**
     * Remove an element from the StaticPaginatedSource.
     * @since 1.0.0a1
     *
     * @kind function
     * @name StyledElements.StaticPaginatedSource#removeElement
     *
     * @param {Object} element
     *      The element to be removed. Can contain only its ID
     *
     * @returns {StaticPaginatedSource}
     *      The instance on which the member is called.
     */
    StaticPaginatedSource.prototype.removeElement = function removeElement(element) {
        var priv = privates.get(this);
        if (!this.options.idAttr) {
            throw new Error("options.idAttr is not set");
        } else {
            if (getFieldValue(element, this.options.idAttr) == null) {
                throw new Error("The element must have a valid ID");
            }
        }

        // Look for the target element
        var pos = searchElement(priv.elements, element, this.options.idAttr);
        if (pos >= 0) {
            priv.elements.splice(pos, 1);
            filterElements.call(this, this.options.keywords);
            sortElements.call(this, this.options.order);
            return this;
        } else {
            throw new Error("Element does not exist");
        }
    };

    var privates = new WeakMap();

    StyledElements.StaticPaginatedSource = StaticPaginatedSource;

})(StyledElements.Utils);
