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

/*global EzWebExt, gettext, StyledElements*/

var CatalogueSearchView = function (id, options) {
    options.id = 'search_interface';
    this.catalogue = options.catalogue;
    StyledElements.Alternative.call(this, id, options);

    var builder = new StyledElements.GUIBuilder();
    this.pagination = new StyledElements.Pagination({
        'pageSize': 30,
        'order_by': '-popularity',
        'keywords': '',
        'requestFunc': this._search.bind(this),
        'processFunc': function (elements) {
            this.resource_painter.paint(elements);
        }.bind(this)
    });
    this.pagination.addEventListener('requestStart', this.disable.bind(this));
    this.pagination.addEventListener('requestEnd', this.enable.bind(this));
    var contents = builder.parse($('wirecloud_catalogue_search_interface').getTextContent(), {
        'pagination': function () {
            return new PaginationInterface(this.pagination);
        }.bind(this),
        'reset_button': function () {
            var button = new StyledElements.StyledButton({text: gettext('View All')});
            button.addEventListener('click', function () {
                this.simple_search_input.value = '';
                this.pagination.changeOptions({'keywords': {}});
            }.bind(this));
            this.view_allbutton = button;
            return button;
        }.bind(this),
        'orderby': function () {
            var select = new StyledElements.StyledSelect({
                'initialValue': '-popularity',
                'initialEntries': [
                    {'label': gettext('Popularity'), 'value': '-popularity'},
                    {'label': gettext('Creation date'), 'value': '-creation_date'},
                    {'label': gettext('Short name'), 'value': 'short_name'},
                    {'label': gettext('Vendor'), 'value': 'vendor'},
                    {'label': gettext('Author'), 'value': 'author'}
                ]
            });
            select.addEventListener('change', function (select) {
                this.pagination.changeOptions({'order_by': select.getValue()});
            }.bind(this));
            this.orderby = select;
            return select;
        }.bind(this),
        'widgetsperpage': function () {
            var select = new StyledElements.StyledSelect({
                'initialValue': '30',
                'initialEntries': [
                    {'value': '10'},
                    {'value': '20'},
                    {'value': '30'},
                    {'value': '40'},
                    {'value': '100'}
                ]
            });
            select.addEventListener('change', function (select) {
                this.pagination.changeOptions({'pageSize': select.getValue()});
            }.bind(this));
            this.widgetsperpage = select;
            return select;
        }.bind(this)
    });
    this.appendChild(contents);
    this.timeout = null;
    this._keywordTimeoutHandler = this._keywordTimeoutHandler.bind(this);
    this.initialized = false;
    this._last_search = false;

    this.simple_search_input = this.wrapperElement.getElementsByClassName('simple_search_text')[0];
    this.resource_painter = new options.resource_painter(this.catalogue,
        $('catalogue_resource_template').getTextContent(),
        this.wrapperElement.getElementsByClassName('resource_list')[0]
    );

    EzWebExt.addEventListener(this.simple_search_input, 'keypress', this._onSearchInputKeyPress.bind(this));
    EzWebExt.addEventListener(this.simple_search_input, 'input', this._onSearchInput.bind(this));
    this.addEventListener('show', this.refresh_if_needed.bind(this));
};
CatalogueSearchView.prototype = new StyledElements.Alternative();

CatalogueSearchView.prototype.init = function init() {
    this.initialized = true;
};

CatalogueSearchView.prototype.refresh_if_needed = function refresh_if_needed() {
    if (this.initialized && (this._last_search === false || (this._last_search + (2 * 60 * 60 * 1000)) < Date.now())) {
        this.pagination.refresh(); // FIXME
    }
};

CatalogueSearchView.prototype._search = function (page, options, callback) {
    var options;

    options = {
        'order_by': options.order_by,
        'search_criteria': options.keywords,
        'search_boolean': 'AND',
        'scope': 'all',
        'starting_page': page,
        'resources_per_page': this.pagination.pOptions.pageSize
    };
    if (typeof this.catalogue.getCurrentSearchContext === 'function') {
        options = EzWebExt.merge(options, this.catalogue.getCurrentSearchContext());
    }

    this._last_search = Date.now();
    this.catalogue.search(callback, options);
};

CatalogueSearchView.prototype._keywordTimeoutHandler = function _keywordTimeoutHandler() {
    this.timeout = null;
    this.pagination.changeOptions({'keywords': this.simple_search_input.value});
};

CatalogueSearchView.prototype._onSearchInput = function (event) {

    // Cancel current timeout
    if (this.timeout !== null) {
        clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(this._keywordTimeoutHandler, 700);
};

CatalogueSearchView.prototype._onSearchInputKeyPress = function (event) {

    if (event.keyCode === 13) { // enter

        // Cancel current timeout
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
        }

        // Inmediate search
        this._keywordTimeoutHandler();
    }
};
