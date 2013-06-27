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
(function () {

    "use strict";

    var CatalogueSearchView = function CatalogueSearchView(id, options) {
        options['class'] = 'search_interface';
        this.catalogue = options.catalogue;
        StyledElements.Alternative.call(this, id, options);

        var builder = new StyledElements.GUIBuilder();
        this.pagination = new StyledElements.Pagination({
            'pageSize': 30,
            'order_by': '-popularity',
            'keywords': '',
            'scope': 'all',
            'requestFunc': this._search.bind(this),
            'processFunc': function (elements) {
                var i, resource;

                this.resource_list.clear();

                for (i = 0; i < elements.resources.length; i += 1) {
                    resource = elements.resources[i];
                    this.resource_list.appendChild(this.resource_painter.paint(resource));
                }
            }.bind(this)
        });
        this.pagination.addEventListener('requestStart', this.disable.bind(this));
        this.pagination.addEventListener('requestEnd', function (pagination, error) {
            if (error != null) {
                this.resource_painter.setError(gettext('Connection error: No resources retrieved.'));
            }

            if (pagination.pCachedTotalCount === 0 && pagination.pOptions.keywords.strip() === "" && pagination.pOptions.scope === 'all') {
                this.resource_list.appendChild(this.emptyBox);
            }

            this.enable();
        }.bind(this));
        this.resource_list = new StyledElements.Container({'class': 'resource_list'});
        this.simple_search_input = new StyledElements.StyledTextField();
        this.simple_search_input.inputElement.className = 'simple_search_text';
        this.simple_search_input.inputElement.addEventListener('keypress', this._onSearchInputKeyPress.bind(this));
        this.simple_search_input.addEventListener('change', this._onSearchInput.bind(this));
        var contents = builder.parse(Wirecloud.currentTheme.templates['wirecloud_catalogue_search_interface'], {
            'resourcelist': this.resource_list,
            'pagination': function () {
                return new StyledElements.PaginationInterface(this.pagination);
            }.bind(this),
            'reset_button': function () {
                var button = new StyledElements.StyledButton({text: gettext('View All')});
                button.addEventListener('click', function () {
                    this.simple_search_input.setValue('');
                    this.pagination.changeOptions({'keywords': ''});
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
                return select;
            }.bind(this),
            'scope': function () {
                var select = new StyledElements.StyledSelect({
                    'initialValue': 'all',
                    'initialEntries': [
                        {'label': gettext('All'), 'value': 'all'},
                        {'label': gettext('Widgets'), 'value': 'widget'},
                        {'label': gettext('Mashups'), 'value': 'mashup'},
                        {'label': gettext('Operators'), 'value': 'operator'}
                    ]
                });
                select.addEventListener('change', function (select) {
                    this.pagination.changeOptions({'scope': select.getValue()});
                }.bind(this));
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
            }.bind(this),
            'searchinput': this.simple_search_input
        });
        this.appendChild(contents);
        this.timeout = null;
        this._keywordTimeoutHandler = this._keywordTimeoutHandler.bind(this);
        this.initialized = false;
        this._last_search = false;

        this.resource_painter = new options.resource_painter(this.catalogue,
            Wirecloud.currentTheme.templates['catalogue_resource_template'],
            this.resource_list
        );

        this.addEventListener('show', this.refresh_if_needed.bind(this));
        this.initEmptyInfoBox();
    };
    CatalogueSearchView.prototype = new StyledElements.Alternative();

    CatalogueSearchView.prototype.init = function init() {
        this.initialized = true;
    };

    CatalogueSearchView.prototype.initEmptyInfoBox = function () {
        // Tutorial layer for empty catalogues
        this.emptyBox = document.createElement('div');
        this.emptyBox.className = 'catalogueEmptyBox';

        var wrapper = document.createElement('div');
        wrapper.className = 'alert alert-info';

        // Title
        var pTitle = document.createElement('h4');
        pTitle.textContent = gettext("Empty Marketplace!");
        wrapper.appendChild(pTitle);

        // Message
        var message = document.createElement('p');
        message.innerHTML = gettext("This is an empty Marketplace. You can upload widgets or operators using the button to the right of the name of the marketplace");
        wrapper.appendChild(message);

        this.emptyBox.appendChild(wrapper);
    };

    CatalogueSearchView.prototype.mark_outdated = function mark_outdated() {
        this._last_search = false;
    };

    CatalogueSearchView.prototype.refresh_if_needed = function refresh_if_needed() {
        if (this.initialized && (this._last_search === false || (this._last_search + (2 * 60 * 60 * 1000)) < Date.now())) {
            this.pagination.refresh(); // TODO
        }
    };

    CatalogueSearchView.prototype._search = function _search(page, options, onSuccess, onError) {
        options = {
            'order_by': options.order_by,
            'search_criteria': options.keywords,
            'search_boolean': 'AND',
            'scope': options.scope,
            'starting_page': page,
            'resources_per_page': options.pageSize
        };
        if (typeof this.catalogue.getCurrentSearchContext === 'function') {
            options = EzWebExt.merge(options, this.catalogue.getCurrentSearchContext());
        }

        this._last_search = Date.now();
        this.catalogue.search(onSuccess, onError, options);
    };

    CatalogueSearchView.prototype._keywordTimeoutHandler = function _keywordTimeoutHandler() {
        this.timeout = null;
        this.pagination.changeOptions({'keywords': this.simple_search_input.getValue()});
    };

    CatalogueSearchView.prototype._onSearchInput = function _onSearchInput(event) {

        // Cancel current timeout
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(this._keywordTimeoutHandler, 700);
    };

    CatalogueSearchView.prototype._onSearchInputKeyPress = function _onSearchInputKeyPress(event) {

        if (event.keyCode === 13) { // enter

            // Cancel current timeout
            if (this.timeout !== null) {
                clearTimeout(this.timeout);
            }

            // Inmediate search
            this._keywordTimeoutHandler();
        }
    };

    window.CatalogueSearchView = CatalogueSearchView;
})();
