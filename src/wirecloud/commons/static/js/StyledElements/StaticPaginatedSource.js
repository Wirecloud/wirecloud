/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020-2021 Future Internet Consulting and Development Solutions S.L.
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


(function (se, utils) {

    "use strict";

    const privates = new WeakMap();

    const getFieldValue = function getFieldValue(item, field) {
        let fieldPath, currentNode, currentField;

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

    const elementPassFilter = function elementPassFilter(element, pattern) {
        return Object.getOwnPropertyNames(element).some(function (key, index, array) {
            const value = getFieldValue(element, key);
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

    const createFilterPattern = function createFilterPattern(keywords) {
        return new RegExp(utils.escapeRegExp(keywords), 'i');
    };

    const filterElements = function filterElements(keywords) {
        const priv = privates.get(this);

        if (!keywords) {
            priv.filteredElements = priv.elements.slice(0);
            return;
        }

        const pattern = createFilterPattern(keywords);
        const filteredElements = [];
        for (let i = 0; i < priv.elements.length; i += 1) {
            const element = priv.elements[i];
            if (elementPassFilter.call(this, element, pattern)) {
                filteredElements.push(element);
            }
        }
        priv.filteredElements = filteredElements;
    };

    const sortElements = function sortElements(order) {
        let sort_id, inverse, sortFunc, parseDate;
        const priv = privates.get(this);

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
        const column = priv.sort_info[sort_id] || {};
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

    const requestFunc = function requestFunc(page, options, onSuccess, onError) {
        const priv = privates.get(this);

        if (page > priv.totalPages) {
            page = priv.totalPages;
        } else if (page < 0) {
            page = 0;
        }

        filterElements.call(this, this.options.keywords);
        sortElements.call(this, this.options.order);

        let elements;
        if (options.pageSize > 0) {
            const start = (page - 1) * options.pageSize;
            const end = start + options.pageSize;
            elements = priv.sortedElements.slice(start, end);
        } else {
            elements = priv.sortedElements;
        }

        onSuccess(elements, {current_page: page, total_count: priv.sortedElements.length});
    };

    const onLengthGet = function onLengthGet() {
        return privates.get(this).elements.length;
    };

    // Search the position of the element
    const searchElement = function searchElement(list, el, getId) {
        if (!getId) {
            return -2;
        }
        let pos = -1;
        const searchId = getId(el);
        list.every((elem, i) => {
            if (getId(elem) === searchId) {
                pos = i;
                return false;
            } else {
                return true;
            }
        });

        return pos;
    };

    se.StaticPaginatedSource = class StaticPaginatedSource extends se.PaginatedSource {

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
        constructor(options) {
            if (typeof options !== 'object') {
                options = {};
            }
            options.requestFunc = requestFunc;
            super(options);

            // Initialize private variables
            const priv = {};
            privates.set(this, priv);

            priv.sort_info = options.sort_info;
            if (typeof priv.sort_info !== 'object') {
                priv.sort_info = {};
            }
            if (typeof options.idAttr === "string") {
                priv.extractIdFunc = (data) => data[options.idAttr];
            } else if (Array.isArray(options.idAttr)) {
                priv.extractIdFunc = (data) => getFieldValue(data, options.idAttr);
            } else if (typeof options.idAttr === "function") {
                priv.extractIdFunc = options.idAttr;
            }

            // Properties
            Object.defineProperties(this, {
                length: {
                    get: onLengthGet
                }
            });

            // Initialize source status
            this.changeElements(options.initialElements);
        }

        /**
         * Updates the options used by this StaticPaginatedSource
         *
         * @since 0.5
         *
         * @param {Object} newOptions
         *      The new options to be used.
         */
        changeOptions(newOptions) {
            let force_sort = false;

            if ('keywords' in newOptions) {
                filterElements.call(this, newOptions.keywords);
                force_sort = true;
            }

            if ('order' in newOptions) {
                sortElements.call(this, newOptions.order);
            } else if (force_sort) {
                sortElements.call(this, this.options.order);
            }
            return super.changeOptions(newOptions);
        }

        /**
         * Updates the elements of the StaticPaginatedSource
         *
         * @since 0.8
         *
         * @returns {Array}
         *      Elements currently managed by this StaticPaginatedSource
         */
        getElements() {
            return privates.get(this).elements.slice(0);
        }

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
        changeElements(newElements) {
            const priv = privates.get(this);
            if (Array.isArray(newElements)) {
                if (this.options.idAttr) {
                    const bol = newElements.every((elem, i) => {
                        if (priv.extractIdFunc(elem) == null) {
                            throw new Error("All elements must have a valid ID");
                        }
                        return searchElement(newElements.slice(0, i), elem, priv.extractIdFunc) <= -1;
                    });
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
        }

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
        addElement(newElement) {
            const priv = privates.get(this);

            if (this.options.idAttr && priv.extractIdFunc(newElement) == null) {
                throw new Error("The element must have a valid ID");
            }

            // If the element already exists, remove it and add it again (updates it and sets it last)
            let pos = searchElement(priv.elements, newElement, priv.extractIdFunc);
            if (pos >= 0) {
                priv.elements.splice(pos, 1);
            }

            // Add the element to the source
            priv.elements.push(newElement);
            // Remove it from the filtered elements
            pos = searchElement(priv.filteredElements, newElement, priv.extractIdFunc);
            if (pos >= 0) {
                priv.filteredElements.splice(pos, 1);
            }

            // Filter the new element if there are any filters set.
            if (this.options.keywords) {
                const pattern = createFilterPattern(this.options.keywords);
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
        }

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
        removeElement(element) {
            const priv = privates.get(this);
            if (!this.options.idAttr) {
                throw new Error("options.idAttr is not set");
            } else {
                if (priv.extractIdFunc(element) == null) {
                    throw new Error("The element must have a valid ID");
                }
            }

            // Look for the target element
            const pos = searchElement(priv.elements, element, priv.extractIdFunc);
            if (pos >= 0) {
                priv.elements.splice(pos, 1);
                filterElements.call(this, this.options.keywords);
                sortElements.call(this, this.options.order);
                return this;
            } else {
                throw new Error("Element does not exist");
            }
        }

    }

})(StyledElements, StyledElements.Utils);
