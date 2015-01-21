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

/*globals StyledElements*/

(function () {

    "use strict";

    var PaginatedSource, onSuccessCallback, onErrorCallback;

    onSuccessCallback = function onSuccessCallback(elements, options) {
        if (typeof this.pOptions.processFunc === 'function') {
            this.pOptions.processFunc(elements, options);
        }
        this.currentPage = parseInt(options.current_page, 10);
        this.currentElements = elements;

        if (this.pCachedTotalCount !== options.total_count) {
            this.pCachedTotalCount = options.total_count;
            this._calculatePages();
            this.events.paginationChanged.dispatch(this);
        }
        this.events.requestEnd.dispatch(this);
    };

    onErrorCallback = function onErrorCallback(error) {
        this.currentElements = [];
        if (error == null) {
            error = {
                'message': 'unknown cause'
            };
        }

        this.events.requestEnd.dispatch(this, error);
    };

    /**
     *
     * Events supported by this component:
     *      - optionsChanged:
     *      - paginationChanged:
     *      - requestStart:
     *      - requestEnd:
     */
    PaginatedSource = function PaginatedSource(options) {
        var defaultOptions = {
            'pageSize': 25,
            'requestFunc': null,
            'processFunc': null
        };

        StyledElements.ObjectWithEvents.call(this, ['optionsChanged', 'paginationChanged', 'requestStart', 'requestEnd']);

        this.pOptions = StyledElements.Utils.merge(defaultOptions, options);
        this.currentPage = 1;
        this.currentElements = [];
        this.totalPages = 1;
    };
    PaginatedSource.prototype = new StyledElements.ObjectWithEvents();

    PaginatedSource.prototype.getCurrentPage = function getCurrentPage() {
        return this.currentElements;
    };

    PaginatedSource.prototype.changeOptions = function changeOptions(options) {
        var new_page_size, old_offset, key, changed = false;

        if (typeof options !== 'object') {
            return;
        }

        for (key in options) {
            if (key === 'pageSize') {
                new_page_size = parseInt(options.pageSize, 10);
                if (!isNaN(new_page_size) && new_page_size !== this.pOptions.pageSize) {
                    changed = true;
                    old_offset = (this.currentPage - 1) * this.pOptions.pageSize;
                    this.currentPage = Math.floor(old_offset / new_page_size) + 1;
                    this.pOptions.pageSize = new_page_size;
                    this._calculatePages();
                }
            } else {
                changed = true;
                this.pOptions[key] = options[key];
                this.currentPage = 1;
            }
        }

        if (changed) {
            this.events.optionsChanged.dispatch(this, this.pOptions);
            this.refresh();
        }
    };

    PaginatedSource.prototype.goToFirst = function goToFirst() {
        this.changePage(0);
    };

    PaginatedSource.prototype.goToPrevious = function goToPrevious() {
        this.changePage(this.currentPage - 1);
    };

    PaginatedSource.prototype.goToNext = function goToNext() {
        this.changePage(this.currentPage + 1);
    };

    PaginatedSource.prototype.goToLast = function goToLast() {
        this.changePage(this.totalPages);
    };

    PaginatedSource.prototype._calculatePages = function _calculatePages() {
        this.totalPages = Math.ceil(this.pCachedTotalCount / this.pOptions.pageSize);
        if (this.totalPages <= 0) {
            this.totalPages = 1;
        }
    };

    PaginatedSource.prototype.refresh = function refresh() {
        this.events.requestStart.dispatch(this);
        this.pOptions.requestFunc(this.currentPage, this.pOptions, onSuccessCallback.bind(this), onErrorCallback.bind(this));
    };

    PaginatedSource.prototype.changePage = function changePage(idx) {
        if (idx < 1) {
            idx = 1;
        } else if (idx > this.totalPages) {
            idx = this.totalPages;
        }

        this.events.requestStart.dispatch(this);
        this.pOptions.requestFunc(idx, this.pOptions, onSuccessCallback.bind(this), onErrorCallback.bind(this));
    };

    StyledElements.PaginatedSource = PaginatedSource;
})();
