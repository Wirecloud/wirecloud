/*
 *     Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements, Wirecloud */


(function (utils) {

    "use strict";

    var builder = new StyledElements.GUIBuilder();

    var initEmptyCatalogueInfoBox = function initEmptyCatalogueInfoBox(title, message) {

        // Build the message box used when there are no resources in the catalogue
        var layer = builder.DEFAULT_OPENING + '<div class="catalogueEmptyBox"><div class="alert alert-info"><h4><t:title/></h4><p><t:message/></p></div></div>' + builder.DEFAULT_CLOSING;

        this.emptyBox = builder.parse(layer, {title: title, message: message}).elements[0];
    };

    var CatalogueSearchView = function CatalogueSearchView(id, options) {
        var context, extra_context, resource_template;

        options = utils.merge({
            // Default options
            emptyTitle: utils.gettext("Empty Marketplace!"),
            emptyMessage: utils.gettext("This marketplace is empty, that is, it does not provide any resource at this time.")
        }, options);

        options['class'] = 'search_interface loading';
        this.catalogue = options.catalogue;
        StyledElements.Alternative.call(this, id, options);

        if (options.gui_template == null) {
            options.gui_template = 'wirecloud/catalogue/search_interface';
        }
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
                    msg = utils.gettext("<p>Showing results for <b><t:corrected_query/></b></p>");

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
            if (this.scopeSelect) {
                this.scopeSelect.setValue(options.scope);
            }
            if (this.simple_search_input) {
                this.simple_search_input.setValue(options.keywords);
            }
            update_resetbutton.call(this, options);
        }.bind(this));
        this.source.addEventListener('requestStart', this.disable.bind(this));
        this.source.addEventListener('requestEnd', function (pagination, error) {
            var msg;

            if (error != null) {
                this.resource_painter.setError(utils.gettext('Connection error: No resource retrieved.'));
            }

            if (pagination.totalCount === 0 && pagination.options.keywords.trim() === "" && pagination.options.scope === 'all') {
                this.resource_list.appendChild(this.emptyBox);
            } else if (pagination.totalCount === 0) {
                msg = utils.gettext("<p>We couldn't find anything for your search - <b>%(keywords)s.</b></p><p>Suggestions:</p><ul><li>Make sure all words are spelled correctly.</li><li>Try different keywords.</li><li>Try more general keywords.</li></ul>");
                msg = interpolate(msg, {keywords: utils.escapeHTML(pagination.options.keywords.trim())}, true);
                this.resource_painter.setError(new StyledElements.Fragment(msg));
            }

            this.enable();
        }.bind(this));
        this.resource_list = new StyledElements.Container({'class': 'resource_list'});
        this.simple_search_input = new StyledElements.TextField({'class': 'simple_search_text', 'placeholder': utils.gettext('Keywords...')});
        this.simple_search_input.addEventListener('keydown', this._onSearchInputKeyPress.bind(this));
        this.simple_search_input.addEventListener('change', onSearchInput.bind(this));

        if ('extra_context' in options) {
            extra_context = options.extra_context;
        } else {
            extra_context = {};
        }
        context = utils.merge(extra_context, {
            'resourcelist': this.resource_list,
            'pagination': function () {
                return new StyledElements.PaginationInterface(this.source);
            }.bind(this),
            'reset_button': function () {
                var button = new StyledElements.Button({text: utils.gettext('Refresh')});
                button.addEventListener('click', function () {
                    this.source.changeOptions({'correct_query': true, 'keywords': '', scope: 'all'});
                }.bind(this));
                this.view_allbutton = button;
                return button;
            }.bind(this),
            'orderby': function () {
                var select = new StyledElements.Select({
                    'initialValue': '-creation_date',
                    'initialEntries': [
                        {'label': utils.gettext('Creation date'), 'value': '-creation_date'},
                        {'label': utils.gettext('Title'), 'value': 'name'},
                        {'label': utils.gettext('Vendor'), 'value': 'vendor'}
                    ]
                });
                select.addEventListener('change', function (select) {
                    this.source.changeOptions({'order_by': select.getValue()});
                }.bind(this));
                return select;
            }.bind(this),
            'scope': function () {
                var select = new StyledElements.Select({
                    'initialValue': 'all',
                    'initialEntries': [
                        {'label': utils.gettext('All'), 'value': 'all'},
                        {'label': utils.gettext('Widgets'), 'value': 'widget'},
                        {'label': utils.gettext('Mashups'), 'value': 'mashup'},
                        {'label': utils.gettext('Operators'), 'value': 'operator'}
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
            resource_template = 'wirecloud/catalogue/resource';
        }

        this.resource_painter = new options.resource_painter(this.catalogue,
            Wirecloud.currentTheme.templates[resource_template],
            this.resource_list,
            options.resource_extra_context
        );

        this.catalogue.catalogue.addEventListener('change', this.mark_outdated.bind(this));
        this.addEventListener('show', this.refresh_if_needed.bind(this));
        initEmptyCatalogueInfoBox.call(this, options.emptyTitle, options.emptyMessage);
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

    CatalogueSearchView.prototype.handleKeydownEvent = function handleKeydownEvent(key, modifiers) {
        if ((modifiers.ctrlKey || modifiers.metaKey) && key == 'f') {
            this.simple_search_input.focus();
            return true;
        }
    };

    CatalogueSearchView.prototype._search = function _search(page, options, onSuccess, onError) {
        options = {
            'order_by': options.order_by,
            'search_criteria': options.keywords,
            'scope': options.scope,
            'pagenum': page,
            'maxresults': options.pageSize
        };
        if (typeof this.catalogue.getCurrentSearchContext === 'function') {
            options = utils.merge(options, this.catalogue.getCurrentSearchContext());
        }

        this._last_search = Date.now();
        this.catalogue.search(options).then(search_info => {
            onSuccess(search_info.resources, search_info);
        }, onError);
    };

    CatalogueSearchView.prototype._keywordTimeoutHandler = function _keywordTimeoutHandler() {
        this.timeout = null;
        this.source.changeOptions({'correct_query': true, 'keywords': this.simple_search_input.getValue()});
    };

    var update_resetbutton = function update_resetbutton(options) {
        var filters_applied;

        filters_applied = options.keywords !== '' || options.scope !== 'all';

        if (filters_applied) {
            this.view_allbutton.setLabel(utils.gettext('Clear filters'));
        } else {
            this.view_allbutton.setLabel(utils.gettext('Refresh'));
        }
    };

    var onSearchInput = function onSearchInput(event) {

        // Cancel current timeout
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(this._keywordTimeoutHandler, 700);
    };

    CatalogueSearchView.prototype._onSearchInputKeyPress = function _onSearchInputKeyPress(input, modifiers, key) {

        if (key === "Enter") {

            // Cancel current timeout
            if (this.timeout !== null) {
                clearTimeout(this.timeout);
            }

            // Inmediate search
            this._keywordTimeoutHandler();
        }
    };

    window.CatalogueSearchView = CatalogueSearchView;

})(Wirecloud.Utils);
