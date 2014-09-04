/*
 *     Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

(function () {

    "use strict";

    var builder = new StyledElements.GUIBuilder();

    var _search = function _search(keywords) {
        this._list.classList.add('disabled');
        Wirecloud.LocalCatalogue.search({
            scope: this.search_scope,
            search_criteria: keywords,
            onSuccess: function (widgets, search_info) {
                var i, msg;

                if (this.resource_painter == null) {
                    this.resource_painter = new Wirecloud.ui.ResourcePainter(null, Wirecloud.currentTheme.templates.wallet_widget, null, {
                        'mainbutton': function (options, context, resource) {
                            var tooltip = this.resourceButtonTooltip;
                            if (typeof tooltip === 'function') {
                                tooltip = tooltip(resource);
                            }
                            var button = new StyledElements.StyledButton({
                                'class': 'mainbutton btn-primary',
                                'iconClass': this.resourceButtonIconClass,
                                'title': tooltip
                            });
                            button.addEventListener('click', this.resourceButtonListener.bind(null, resource));
                            return button;
                        }.bind(this)
                    });
                }

                this._list.innerHTML = '';
                if (search_info.total_count !== 0) {
                    if ('corrected_query' in search_info) {
                        msg = gettext("<p>Showing results for <b><t:corrected_query/></b></p>");
                        this.resource_painter.paintInfo(msg, {
                            corrected_query: search_info.corrected_query
                        }).insertInto(this._list);
                    }

                    for (i = 0; i < widgets.length; i += 1) {
                        this.resource_painter.paint(widgets[i]).insertInto(this._list);
                    }
                } else {
                    msg = gettext("<p>We couldn't find anything for your search - <b>%(keywords)s.</b></p>" +
                        "<p>Suggestions:</p>" +
                        "<ul>" +
                        "<li>Make sure all words are spelled correctly.</li>" +
                        "<li>Try different keywords.</li>" +
                        "<li>Try more general keywords.</li>" +
                        "</ul>");
                    msg = interpolate(msg, {keywords: Wirecloud.Utils.escapeHTML(keywords.trim())}, true);
                    this.resource_painter.paintError(new StyledElements.Fragment(msg)).insertInto(this._list);
                }
            }.bind(this),
            onComplete: function () {
                this._list.classList.remove('disabled');
            }.bind(this)
        });
    };

    var _keywordTimeoutHandler = function _keywordTimeoutHandler(input) {
        this._search_timeout = null;
        _search.call(this, input.getValue());
    };

    var _onSearchInput = function _onSearchInput(input) {

        // Cancel current timeout
        if (this._search_timeout !== null) {
            clearTimeout(this._search_timeout);
        }

        this._search_timeout = setTimeout(_keywordTimeoutHandler.bind(this, input), 700);
    };

    var _onSearchInputKeyPress = function _onSearchInputKeyPress(input, event) {

        if (event.keyCode === 13) { // enter

            // Cancel current timeout
            if (this._search_timeout !== null) {
                clearTimeout(this._search_timeout);
            }

            // Inmediate search
            _keywordTimeoutHandler.call(this, input);
        }
    };

    var MACSearch = function MACSearch(options) {

        options = Wirecloud.Utils.merge({
            'extra_template_context': null,
            'scope': '',
            'template': 'macsearch'
        }, options);

        StyledElements.StyledElement.call(this, []);

        this._list = document.createElement('div');
        this._list.className = 'widget_wallet_list';

        var input;

        var template = Wirecloud.currentTheme.templates[options.template];
        this.wrapperElement = builder.parse(template, Wirecloud.Utils.merge({
            searchinput: function () {
                input = new StyledElements.StyledTextField({'placeholder': 'Keywords...'});
                input.inputElement.addEventListener('keypress', _onSearchInputKeyPress.bind(this, input));
                input.addEventListener('change', _onSearchInput.bind(this));
                return input;
            }.bind(this),
            list: this._list
        }, options.extra_template_context)).elements[1];

        Object.defineProperties(this, {
            'inputField': {value: input},
            'search_scope': {value: options.scope, writable: true},
            'resourceButtonIconClass': {value: options.resourceButtonIconClass},
            'resourceButtonListener': {value: options.resourceButtonListener},
            'resourceButtonTooltip': {value: options.resourceButtonTooltip}
        });

        this.input = input;
        _search.call(this, '');
    };
    MACSearch.prototype = new StyledElements.StyledElement();

    MACSearch.prototype.refresh = function refresh() {
        _keywordTimeoutHandler.call(this, this.input);
    };

    MACSearch.prototype.focus = function focus() {
        this.inputField.focus();
    };

    Wirecloud.ui.MACSearch = MACSearch;

})();
