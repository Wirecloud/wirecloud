/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var initEmptyCatalogueInfoBox = function initEmptyCatalogueInfoBox() {
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

    var CatalogueSearchView = function CatalogueSearchView(id, options) {
        var builder, context, extra_context, resource_template;

        options['class'] = 'search_interface loading';
        this.catalogue = options.catalogue;
        StyledElements.Alternative.call(this, id, options);

        if (options.gui_template == null) {
            options.gui_template = 'wirecloud_catalogue_search_interface';
        }

        builder = new StyledElements.GUIBuilder();
        this.source = new StyledElements.PaginatedSource({
            'pageSize': 30,
            'order_by': '-creation_date',
            'keywords': '',
            'scope': 'all',
            'requestFunc': this._search.bind(this),
            'processFunc': function (elements, search_info) {
                var i, msg;

                this.resource_list.clear();

                if ('corrected_query' in search_info) {
                    msg = gettext("<p>Showing results for <b><t:corrected_query/></b></p>");

                    this.resource_list.appendChild(this.resource_painter.paintInfo(msg, {
                        corrected_query: search_info.corrected_query
                    }));
                }

                for (i = 0; i < elements.length; i += 1) {
                    this.resource_list.appendChild(this.resource_painter.paint(elements[i]));
                }
            }.bind(this)
        });
        this.source.addEventListener('optionsChanged', function (source, options) {
            this.scopeSelect.setValue(options.scope);
            this.simple_search_input.setValue(options.keywords);
            update_resetbutton.call(this, options);
        }.bind(this));
        this.source.addEventListener('requestStart', this.disable.bind(this));
        this.source.addEventListener('requestEnd', function (pagination, error) {
            var msg;

            if (error != null) {
                this.resource_painter.setError(gettext('Connection error: No resources retrieved.'));
            }

            if (pagination.pCachedTotalCount === 0 && pagination.pOptions.keywords.trim() === "" && pagination.pOptions.scope === 'all') {
                this.resource_list.appendChild(this.emptyBox);
            } else if (pagination.pCachedTotalCount === 0) {
                msg = gettext("<p>We couldn't find anything for your search - <b>%(keywords)s.</b></p>" +
                    "<p>Suggestions:</p>" +
                    "<ul>" +
                    "<li>Make sure all words are spelled correctly.</li>" +
                    "<li>Try different keywords.</li>" +
                    "<li>Try more general keywords.</li>" +
                    "</ul>");
                msg = interpolate(msg, {keywords: Wirecloud.Utils.escapeHTML(pagination.pOptions.keywords.trim())}, true);
                this.resource_painter.setError(new StyledElements.Fragment(msg));
            }

            this.enable();
        }.bind(this));
        this.resource_list = new StyledElements.Container({'class': 'resource_list'});
        this.simple_search_input = new StyledElements.StyledTextField({'class': 'simple_search_text', 'placeholder': 'Keywords...'});
        this.simple_search_input.inputElement.addEventListener('keypress', this._onSearchInputKeyPress.bind(this));
        this.simple_search_input.addEventListener('change', onSearchInput.bind(this));

        if ('extra_context' in options) {
            extra_context = options.extra_context;
        } else {
            extra_context = {};
        }
        context = Wirecloud.Utils.merge(extra_context, {
            'resourcelist': this.resource_list,
            'pagination': function () {
                return new StyledElements.PaginationInterface(this.source);
            }.bind(this),
            'reset_button': function () {
                var button = new StyledElements.StyledButton({text: gettext('Refresh')});
                button.addEventListener('click', function () {
                    this.source.changeOptions({'correct_query': true, 'keywords': '', scope: 'all'});
                }.bind(this));
                this.view_allbutton = button;
                return button;
            }.bind(this),
            'orderby': function () {
                var select = new StyledElements.StyledSelect({
                    'initialValue': '-creation_date',
                    'initialEntries': [
                        {'label': gettext('Creation date'), 'value': '-creation_date'},
                        {'label': gettext('Title'), 'value': 'name'},
                        {'label': gettext('Vendor'), 'value': 'vendor'}
                    ]
                });
                select.addEventListener('change', function (select) {
                    this.source.changeOptions({'order_by': select.getValue()});
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
                    this.source.changeOptions({'scope': select.getValue()});
                }.bind(this));
                this.scopeSelect = select;
                return select;
            }.bind(this),
            'searchinput': this.simple_search_input
        });

        var contents = builder.parse(Wirecloud.currentTheme.templates[options.gui_template], context);
        this.appendChild(contents);
        this.timeout = null;
        this._keywordTimeoutHandler = this._keywordTimeoutHandler.bind(this);
        this.initialized = false;
        this._last_search = false;

        if ('resource_template' in options) {
            resource_template = options.resource_template;
        } else {
            resource_template = 'catalogue_resource_template';
        }

        this.resource_painter = new options.resource_painter(this.catalogue,
            Wirecloud.currentTheme.templates[resource_template],
            this.resource_list,
            options.resource_extra_context
        );

        this.addEventListener('show', this.refresh_if_needed.bind(this));
        initEmptyCatalogueInfoBox.call(this);
    };
    CatalogueSearchView.prototype = new StyledElements.Alternative();

    CatalogueSearchView.prototype.init = function init() {
        this.initialized = true;
    };

    CatalogueSearchView.prototype.view_name = 'search';

    CatalogueSearchView.prototype.mark_outdated = function mark_outdated() {
        this._last_search = false;
    };

    CatalogueSearchView.prototype.refresh_if_needed = function refresh_if_needed() {
        if (this.initialized && (this._last_search === false || (this._last_search + (2 * 60 * 60 * 1000)) < Date.now())) {
            this.source.refresh(); // TODO
        }
    };

    CatalogueSearchView.prototype._search = function _search(page, options, onSuccess, onError) {
        options = {
            'order_by': options.order_by,
            'search_criteria': options.keywords,
            'scope': options.scope,
            'pagenum': page,
            'maxresults': options.pageSize,
            'onSuccess': onSuccess,
            'onFailure': onError
        };
        if (typeof this.catalogue.getCurrentSearchContext === 'function') {
            options = Wirecloud.Utils.merge(options, this.catalogue.getCurrentSearchContext());
        }

        this._last_search = Date.now();
        this.catalogue.search(options);
    };

    CatalogueSearchView.prototype._keywordTimeoutHandler = function _keywordTimeoutHandler() {
        this.timeout = null;
        this.source.changeOptions({'correct_query': true, 'keywords': this.simple_search_input.getValue()});
    };

    var update_resetbutton = function update_resetbutton(options) {
        var filters_applied;

        filters_applied = options.keywords !== '' || options.scope !== 'all';

        if (filters_applied) {
            this.view_allbutton.setLabel(gettext('Clear filters'));
        } else {
            this.view_allbutton.setLabel(gettext('Refresh'));
        }
    };

    var onSearchInput = function onSearchInput(event) {

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
