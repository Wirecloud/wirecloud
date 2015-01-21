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

/*global StyledElements*/

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
        this.wrapperContainer.appendChild(contents);
    };

    PaginationInterface = function PaginationInterface(pagination, options) {
        var defaultOptions = {
            'layout': '<s:styledgui xmlns:s="http://wirecloud.conwet.fi.upm.es/StyledElements" xmlns:t="http://wirecloud.conwet.fi.upm.es/Template" xmlns="http://www.w3.org/1999/xhtml"><t:firstBtn/><t:prevBtn/><div class="box">Page: <t:currentPage/>/<t:totalPages/></div><t:nextBtn/><t:lastBtn/></s:styledgui>',
            'autoHide': false
        };
        options = StyledElements.Utils.merge(defaultOptions, options);
        this.autoHide = options.autoHide;

        StyledElements.StyledElement.call(this, []);

        this.pagination = pagination;

        this.wrapperContainer = new StyledElements.Container();
        this.wrapperContainer.addClassName('pagination');
        this.wrapperElement = this.wrapperContainer.wrapperElement;

        this.firstBtn = new StyledElements.StyledButton({'iconClass': 'icon-first-page'});
        this.firstBtn.addEventListener('click', pagination.goToFirst.bind(pagination));

        this.prevBtn = new StyledElements.StyledButton({'iconClass': 'icon-prev-page'});
        this.prevBtn.addEventListener('click', pagination.goToPrevious.bind(pagination));

        this.nextBtn = new StyledElements.StyledButton({'iconClass': 'icon-next-page'});
        this.nextBtn.addEventListener('click', pagination.goToNext.bind(pagination));

        this.lastBtn = new StyledElements.StyledButton({'iconClass': 'icon-last-page'});
        this.lastBtn.addEventListener('click', pagination.goToLast.bind(pagination));

        this.currentPageLabel = document.createElement('span');
        this.currentPageLabel.classList.add('current-page');

        this.totalPagesLabel = document.createElement('span');
        this.totalPagesLabel.classList.add('total-pages');

        updateLayout.call(this, options.layout);

        this.currentPageLabel.textContent = this.currentPage + 1;
        this.totalPagesLabel.textContent = this.totalPages;

        updateButtons.call(this);

        this.pagination.addEventListener('requestEnd', onPaginationChanged.bind(this));
    };
    PaginationInterface.prototype = new StyledElements.StyledElement();

    PaginationInterface.prototype.changeLayout = function changeLayout(newLayout) {
        updateLayout.call(this, newLayout);
    };

    StyledElements.PaginationInterface = PaginationInterface;

})();
