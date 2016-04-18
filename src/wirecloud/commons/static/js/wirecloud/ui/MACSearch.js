/*
 *     Copyright (c) 2014-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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
        if (this._request != null) {
            this._request.abort();
        }
        this._list.disable();
        this.trigger('search');
        this._request = Wirecloud.LocalCatalogue.search({
            scope: this.search_scope,
            search_criteria: keywords,
            onSuccess: function (widgets, search_info) {
                var i, msg;

                _load_resource_painter.call(this);
                this._list.clear();
                if (search_info.total_count !== 0) {
                    if ('corrected_query' in search_info) {
                        msg = gettext("<p>Showing results for <b><t:corrected_query/></b></p>");
                        this._list.appendChild(this.paintInfo(msg, {
                            corrected_query: search_info.corrected_query
                        }));
                    }

                    for (i = 0; i < widgets.length; i += 1) {
                        this._list.appendChild(this.resource_painter.paint(widgets[i]));
                    }
                } else {
                    if (keywords != "") {
                        msg = gettext("<p>We couldn't find anything for your search - <b>%(keywords)s.</b></p><p>Suggestions:</p><ul><li>Make sure all words are spelled correctly.</li><li>Try different keywords.</li><li>Try more general keywords.</li></ul>");
                        msg = interpolate(msg, {keywords: Wirecloud.Utils.escapeHTML(keywords.trim())}, true);
                    } else if (this.search_scope != '') {
                        msg = gettext("<p>Currently, you do not have access to any %(scope)s component. You can get components using the Marketplace view or by uploading components manually using the Upload button on the My Resources view.</p>");
                        msg = interpolate(msg, {scope: this.search_scope}, true);
                    } else {
                        msg = gettext("<p>Currently, you do not have access to any component. You can get components using the Marketplace view or by uploading components manually using the Upload button on the My Resources view.</p>");
                    }
                    this._list.appendChild(this.paintError(new StyledElements.Fragment(msg)));
                }
            }.bind(this),
            onFailure: function () {
                var msg = Wirecloud.Utils.gettext("Connection error: No resource retrieved");

                _load_resource_painter.call(this);
                this._list.clear();
                this._list.appendChild(this.paintError(msg));
            }.bind(this),
            onComplete: function () {
                this._request = null;
                this._list.enable();
            }.bind(this)
        });
    };

    var _load_resource_painter = function _load_resource_painter() {
        if (this.resource_painter == null) {
            this.resource_painter = new Wirecloud.ui.ResourcePainter(null, Wirecloud.currentTheme.templates.wallet_widget, null, {
                'mainbutton': function (options, context, resource) {
                    var tooltip = this.resourceButtonTooltip;
                    if (typeof tooltip === 'function') {
                        tooltip = tooltip(resource);
                    }
                    var button = new StyledElements.Button({
                        'class': 'mainbutton btn-primary',
                        'iconClass': this.resourceButtonIconClass,
                        'title': tooltip
                    });
                    button.addEventListener('click', this.resourceButtonListener.bind(null, resource));
                    return button;
                }.bind(this)
            });
        }
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
            'template': 'macsearch',
            resource_painter: null
        }, options);

        StyledElements.StyledElement.call(this, ['search']);

        this.info_template = builder.DEFAULT_OPENING + '<div class="alert alert-info"><t:message/></div>' + builder.DEFAULT_CLOSING;
        this.error_template = builder.DEFAULT_OPENING + '<div class="alert alert-error"><t:message/></div>' + builder.DEFAULT_CLOSING;
        this._list = new StyledElements.Container({'class': 'widget_wallet_list loading'});
        this.resource_painter = options.resource_painter;

        var input;

        var template = Wirecloud.currentTheme.templates[options.template];
        this.wrapperElement = builder.parse(template, Wirecloud.Utils.merge({
            searchinput: function () {
                input = new StyledElements.TextField({'placeholder': gettext('Keywords...')});
                input.inputElement.addEventListener('keypress', _onSearchInputKeyPress.bind(this, input));
                input.addEventListener('change', _onSearchInput.bind(this));
                return input;
            }.bind(this),
            list: this._list
        }, options.extra_template_context)).elements[1];
        if (this.wrapperElement instanceof StyledElements.StyledElement) {
            this.wrapperElement = this.wrapperElement.get();
        }

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

    MACSearch.prototype.paintInfo = function paintInfo(message, context) {
        if (context != null) {
            message = builder.parse(builder.DEFAULT_OPENING + message + builder.DEFAULT_CLOSING, context);
        }

        return builder.parse(this.info_template, {
            'message': message
        });
    };

    MACSearch.prototype.paintError = function paintError(message) {
        return builder.parse(this.error_template, {
            'message': message
        });
    };

    MACSearch.prototype.repaint = function repaint() {
        this._list.repaint();
    };

    MACSearch.prototype.refresh = function refresh() {
        _keywordTimeoutHandler.call(this, this.input);
    };

    MACSearch.prototype.focus = function focus() {
        this.inputField.focus();
    };

    Wirecloud.ui.MACSearch = MACSearch;

})();
