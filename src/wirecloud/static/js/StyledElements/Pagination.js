/**
 *
 * Events supported by this component:
 *      - optionsChanged: 
 *      - paginationChanged:
 *      - requestStart:
 *      - requestEnd:
 */

(function () {

    "use strict";

    var Pagination, onSuccessCallback, onErrorCallback;

    onSuccessCallback = function onSuccessCallback(elements, options) {
        this.pOptions.processFunc(elements);
        this.currentPage = parseInt(options.current_page, 10);

        if (this.pCachedTotalCount !== options.total_count) {
            this.pCachedTotalCount = options.total_count;
            this._calculatePages();
            this.events.paginationChanged.dispatch(this);
        }
        this.events.requestEnd.dispatch(this);
    };

    onErrorCallback = function onErrorCallback() {
        this.events.requestEnd.dispatch(this);
    };

    Pagination = function Pagination(options) {
        var defaultOptions = {
            'pageSize': 25,
            'requestFunc': null,
            'processFunc': null
        };

        StyledElements.ObjectWithEvents.call(this, ['optionsChanged', 'paginationChanged', 'requestStart', 'requestEnd']);

        this.pOptions = EzWebExt.merge(defaultOptions, options);
        this.currentData = null;
        this.currentPage = 1;
        this.totalPages = 1;
    };
    Pagination.prototype = new StyledElements.ObjectWithEvents();

    Pagination.prototype.changeOptions = function changeOptions(options) {
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
            this.events.optionsChanged.dispatch(this);
            this.refresh();
        }
    };

    Pagination.prototype.goToFirst = function goToFirst() {
        this.changePage(0);
    };

    Pagination.prototype.goToPrevious = function goToPrevious() {
        this.changePage(this.currentPage - 1);
    };

    Pagination.prototype.goToNext = function goToNext() {
        this.changePage(this.currentPage + 1);
    };

    Pagination.prototype.goToLast = function goToLast() {
        this.changePage(this.pCachedTotalPages);
    };

    Pagination.prototype._calculatePages = function() {
        this.totalPages = Math.ceil(this.pCachedTotalCount / this.pOptions.pageSize);
        if (this.totalPages <= 0) {
            this.totalPages = 1;
        }
    };

    Pagination.prototype.refresh = function refresh() {
        this.events.requestStart.dispatch(this);
        this.pOptions.requestFunc(this.currentPage, this.pOptions, onSuccessCallback.bind(this));
    };

    Pagination.prototype.changePage = function changePage(idx) {
        if (idx < 1) {
            idx = 1;
        } else if (idx > this.totalPages) {
            idx = this.totalPages;
        }

        this.events.requestStart.dispatch(this);
        this.pOptions.requestFunc(idx, this.pOptions, onSuccessCallback.bind(this));
    };

    StyledElements.Pagination = Pagination;
})();
