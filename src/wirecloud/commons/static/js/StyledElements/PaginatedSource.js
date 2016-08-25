/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function () {

    "use strict";

    var PaginatedSource, onSuccessCallback, onErrorCallback;

    onSuccessCallback = function onSuccessCallback(elements, options) {
        var priv = privates.get(this);

        if (typeof priv.options.processFunc === 'function') {
            priv.options.processFunc(elements, options);
        }
        priv.currentPage = parseInt(options.current_page, 10);
        priv.currentElements = elements;

        if (priv.totalCount !== options.total_count) {
            priv.totalCount = options.total_count;
            calculatePages.call(this);
            this.events.paginationChanged.dispatch(this);
        }
        this.events.requestEnd.dispatch(this);
    };

    onErrorCallback = function onErrorCallback(error) {
        var priv = privates.get(this);
        priv.currentElements = [];
        if (error == null) {
            error = {
                'message': 'unknown cause'
            };
        }

        this.events.requestEnd.dispatch(this, error);
    };

    /*
     *
     * Events supported by this component:
     *      - optionsChanged:
     *      - paginationChanged:
     *      - requestStart:
     *      - requestEnd:
     */

    /**
     * Create a new instance of class PaginatedSource.
     *
     * @constructor
     * @extends {StyledElements.ObjectWithEvents}
     * @name StyledElements.PaginatedSource
     * @since 0.5
     * @param {Object} options
     *      The options to be used
     */
    PaginatedSource = function PaginatedSource(options) {
        var defaultOptions = {
            'pageSize': 25,
            'requestFunc': null,
            'processFunc': null
        };

        StyledElements.ObjectWithEvents.call(this, ['optionsChanged', 'paginationChanged', 'requestStart', 'requestEnd']);

        // Initialize private variables
        var priv = {};
        privates.set(this, priv);

        Object.defineProperties(this, {
            /** @lends StyledElements.PaginatedSource.prototype */

            /**
             * The current page.
             *
             * @name StyledElements.PaginatedSource#currentPage
             */
            currentPage: {
                get: function () {
                    return priv.currentPage;
                }
            },

            /**
             * PaginatedSource options.
             *
             * @name StyledElements.PaginatedSource#options
             */
            options: {
                get: function () {
                    return priv.options;
                }
            },

            /**
             * Current number of pages.
             *
             * @name StyledElements.PaginatedSource#totalPages
             */
            totalPages: {
                get: function () {
                    return priv.totalPages;
                }
            },

            /**
             * The elements being currently displayed
             *
             * @name StyledElements.PaginatedSource#currentElements
             */
            currentElements: {
                get: function () {
                    return priv.currentElements;
                }
            }
        });
        priv.options = StyledElements.Utils.merge(defaultOptions, options);
        priv.currentPage = 1;
        priv.currentElements = [];
        priv.totalPages = 1;
    };

    PaginatedSource.prototype = new StyledElements.ObjectWithEvents();

    /**
     * Gets the elements of the current page
     * @since 0.6
     * @kind function
     * @name StyledElements.PaginatedSource#getCurrentPage
     * @returns {Array.<Object>} currentElements
     *      The current elements.
     */
    PaginatedSource.prototype.getCurrentPage = function getCurrentPage() {
        return this.currentElements;
    };

    /**
     * Update the options of the PaginatedSource
     * @since 0.6
     * @kind function
     * @name StyledElements.PaginatedSource#changeOptions
     * @param {Object} newOptions
     *      The new options to be used.
     */
    PaginatedSource.prototype.changeOptions = function changeOptions(options) {
        var new_page_size, old_offset, key, changed = false;
        var priv = privates.get(this);

        if (typeof options !== 'object') {
            return;
        }

        for (key in options) {
            if (key === 'pageSize') {
                new_page_size = parseInt(options.pageSize, 10);
                if (!isNaN(new_page_size) && new_page_size !== priv.options.pageSize) {
                    changed = true;
                    old_offset = (priv.currentPage - 1) * priv.options.pageSize;
                    priv.currentPage = Math.floor(old_offset / new_page_size) + 1;
                    priv.options.pageSize = new_page_size;
                    calculatePages.call(this);
                }
            } else {
                changed = true;
                priv.options[key] = options[key];
                priv.currentPage = 1;
            }
        }

        if (changed) {
            this.events.optionsChanged.dispatch(this, priv.options);
            this.refresh();
        }
    };

    /**
     * Change to the first page
     * @since 0.6
     * @kind function
     * @name StyledElements.PaginatedSource#goToFirst
     */
    PaginatedSource.prototype.goToFirst = function goToFirst() {
        this.changePage(0);
    };

    /**
     * Change to the previous page
     * @since 0.6
     * @kind function
     * @name StyledElements.PaginatedSource#goToPrevious
     */
    PaginatedSource.prototype.goToPrevious = function goToPrevious() {
        var priv = privates.get(this);
        this.changePage(priv.currentPage - 1);
    };

    /**
     * Change to the next page
     * @since 0.6
     * @kind function
     * @name StyledElements.PaginatedSource#goToNext
     */
    PaginatedSource.prototype.goToNext = function goToNext() {
        var priv = privates.get(this);
        this.changePage(priv.currentPage + 1);
    };

    /**
     * Change to the last page
     * @since 0.6
     * @kind function
     * @name StyledElements.PaginatedSource#goToLast
     */
    PaginatedSource.prototype.goToLast = function goToLast() {
        var priv = privates.get(this);
        this.changePage(priv.totalPages);
    };

    var calculatePages = function calculatePages() {
        var priv = privates.get(this);
        if (priv.options.pageSize === 0) {
            priv.totalPages = 1;
        } else {
            priv.totalPages = Math.ceil(priv.totalCount / priv.options.pageSize);
            if (priv.totalPages <= 0) {
                priv.totalPages = 1;
            }
        }
    };

    /**
     * Refresh the current view
     * @since 0.6
     * @kind function
     * @name StyledElements.PaginatedSource#refresh
     */
    PaginatedSource.prototype.refresh = function refresh() {
        var priv = privates.get(this);
        this.events.requestStart.dispatch(this);
        priv.options.requestFunc(priv.currentPage, priv.options, onSuccessCallback.bind(this), onErrorCallback.bind(this));
    };

    /**
     * Changes to the chosen page
     * @since 0.6
     * @kind function
     * @name StyledElements.PaginatedSource#changePage
     * @param {Integer} index
     *      The number of the target page.
     */
    PaginatedSource.prototype.changePage = function changePage(idx) {
        var priv = privates.get(this);
        if (idx < 1) {
            idx = 1;
        } else if (idx > priv.totalPages) {
            idx = priv.totalPages;
        }

        this.events.requestStart.dispatch(this);
        priv.options.requestFunc(idx, priv.options, onSuccessCallback.bind(this), onErrorCallback.bind(this));
    };

    var privates = new WeakMap();

    StyledElements.PaginatedSource = PaginatedSource;
})();
