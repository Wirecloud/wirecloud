var PaginationInterface = function(pagination, options) {
    var defaultOptions = {
        'layout': '%(firstBtn)s%(prevBtn)s Page: %(currentPage)s/%(totalPages)s %(nextBtn)s%(lastBtn)s',
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

    this._updateLayout(options.layout);

    EzWebExt.setTextContent(this.currentPageLabel, this.currentPage + 1);
    EzWebExt.setTextContent(this.totalPagesLabel, this.totalPages);

    this._updateButtons();

    this.pagination.addEventListener('requestEnd', EzWebExt.bind(this.pPaginationChanged, this));
}
PaginationInterface.prototype = new StyledElements.StyledElement();


PaginationInterface.prototype._updateLayout = function(pattern) {

    var elements = {
        'firstBtn': this.firstBtn,
        'prevBtn': this.prevBtn,
        'nextBtn': this.nextBtn,
        'lastBtn': this.lastBtn,
        'currentPage': this.currentPageLabel,
        'totalPages': this.totalPagesLabel
    }
    var wrapper = this.wrapperContainer;
    while (pattern) {
        var result = pattern.match(/^%\((\w+)\)s/,1);
        if (result) {
            if (elements[result[1]] != undefined) {
                wrapper.appendChild(elements[result[1]]);
            } else {
                wrapper.appendChild(document.createTextNode(result[0]));
            }
            pattern = pattern.substr(result[0].length);
        }
        var text = EzWebExt.split(pattern, /%\(\w+\)s/, 1);
        if (text && text.length > 0 && text[0] != '') {
            wrapper.appendChild(document.createTextNode(text[0]));
            pattern = pattern.substr(text[0].length);
        }
    }
}


PaginationInterface.prototype.changeLayout = function(newLayout) {
    this._updateLayout(newLayout);
}

PaginationInterface.prototype._updateButtons = function() {
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
}

PaginationInterface.prototype._pageChange = function() {
    EzWebExt.setTextContent(this.currentPageLabel, this.currentPage + 1);
    this._updateButtons();
};

PaginationInterface.prototype.pPaginationChanged = function pPaginationChanged(pagination) {

    if (this.autoHide && this.pagination.totalPages === 1) {
        this.wrapperElement.style.display = 'none';
    } else {
        this.wrapperElement.style.display = '';
    }

    EzWebExt.setTextContent(this.totalPagesLabel, this.pagination.totalPages);
    EzWebExt.setTextContent(this.currentPageLabel, this.pagination.currentPage);
    this._updateButtons();
};
