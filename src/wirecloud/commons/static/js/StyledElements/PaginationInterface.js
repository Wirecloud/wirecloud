/*global EzWebExt, StyledElements*/

(function () {

    "use strict";

    var builder, onPaginationChanged, onPageChange, updateButtons, updateLayout, PaginationInterface;

    builder = new StyledElements.GUIBuilder();

    onPaginationChanged = function onPaginationChanged(pagination) {

        if (this.autoHide && this.pagination.totalPages === 1) {
            this.wrapperElement.style.display = 'none';
        } else {
            this.wrapperElement.style.display = '';
        }

        this.totalPagesLabel.textContent = this.pagination.totalPages;
        this.currentPageLabel.textContent = this.pagination.currentPage;
        updateButtons.call(this);
    };

    onPageChange = function onPageChange() {
        this.currentPageLabel.textContent = this.currentPage + 1;
        updateButtons.call(this);
    };

    updateButtons = function updateButton() {
        if (this.pagination.currentPage <= 1) {
            this.prevBtn.disable();
            this.firstBtn.disable();
        } else {
            this.prevBtn.enable();
            this.firstBtn.enable();
        }

        if (this.pagination.currentPage >= this.pagination.totalPages) {
            this.nextBtn.disable();
            this.lastBtn.disable();
        } else {
            this.nextBtn.enable();
            this.lastBtn.enable();
        }
    };

    updateLayout = function updateLayout(pattern) {

        var elements = {
            'firstBtn': this.firstBtn,
            'prevBtn': this.prevBtn,
            'nextBtn': this.nextBtn,
            'lastBtn': this.lastBtn,
            'currentPage': this.currentPageLabel,
            'totalPages': this.totalPagesLabel
        };
        var contents = builder.parse(pattern, elements);
        contents.insertInto(this.wrapperContainer);
    };

    PaginationInterface = function PaginationInterface(pagination, options) {
        var defaultOptions = {
            'layout': '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><t:firstBtn/><t:prevBtn/><div class="box">Page: <t:currentPage/>/<t:totalPages/></div><t:nextBtn/><t:lastBtn/></s:styledgui>',
            'autoHide': false
        };
        options = EzWebExt.merge(defaultOptions, options);
        this.autoHide = options.autoHide;

        StyledElements.StyledElement.call(this, []);

        this.pagination = pagination;

        this.wrapperContainer = new StyledElements.Container();
        this.wrapperContainer.addClassName('pagination');
        this.wrapperElement = this.wrapperContainer.wrapperElement;

        this.firstBtn = new StyledElements.StyledButton({'plain': true, 'class': 'icon-first-page'});
        this.firstBtn.addEventListener('click', pagination.goToFirst.bind(pagination));

        this.prevBtn = new StyledElements.StyledButton({'plain': true, 'class': 'icon-prev-page'});
        this.prevBtn.addEventListener('click', pagination.goToPrevious.bind(pagination));

        this.nextBtn = new StyledElements.StyledButton({'plain': true, 'class': 'icon-next-page'});
        this.nextBtn.addEventListener('click', pagination.goToNext.bind(pagination));

        this.lastBtn = new StyledElements.StyledButton({'plain': true, 'class': 'icon-last-page'});
        this.lastBtn.addEventListener('click', pagination.goToLast.bind(pagination));

        this.currentPageLabel = document.createElement('span');
        EzWebExt.addClassName(this.currentPageLabel, 'current-page');

        this.totalPagesLabel = document.createElement('span');
        EzWebExt.addClassName(this.totalPagesLabel, 'total-pages');

        updateLayout.call(this, options.layout);

        this.currentPageLabel.textContent = this.currentPage + 1;
        this.totalPagesLabel.textContent = this.totalPages;

        updateButtons.call(this);

        this.pagination.addEventListener('requestEnd', EzWebExt.bind(onPaginationChanged, this));
    };
    PaginationInterface.prototype = new StyledElements.StyledElement();

    PaginationInterface.prototype.changeLayout = function changeLayout(newLayout) {
        updateLayout.call(this, newLayout);
    };

    StyledElements.PaginationInterface = PaginationInterface;

})();
