/*
 *     Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var MACSearch = function MACSearch(options) {

        options = utils.merge({
            'extra_template_context': null,
            'scope': '',
            'template': 'wirecloud/macsearch/base',
            resource_painter: null
        }, options);

        StyledElements.StyledElement.call(this, ['search']);

        this.info_template = builder.DEFAULT_OPENING + '<div class="alert alert-info"><t:message/></div>' + builder.DEFAULT_CLOSING;
        this.error_template = builder.DEFAULT_OPENING + '<div class="alert alert-error"><t:message/></div>' + builder.DEFAULT_CLOSING;


        var priv = {
            request: null,
            list: new StyledElements.Container({class: 'wc-macsearch-list wc-resource-results loading'})
        };
        privates.set(this, priv);
        this.resource_painter = options.resource_painter;

        var input;

        var template = Wirecloud.currentTheme.templates[options.template];
        this.wrapperElement = builder.parse(template, utils.merge({
            searchinput: function () {
                input = new StyledElements.TextField({class: "se-field-search", 'placeholder': utils.gettext('Keywords...')});
                input.addEventListener('keydown', _onSearchInputKeyPress.bind(this));
                input.addEventListener('change', _onSearchInput.bind(this));
                return input;
            }.bind(this),
            list: priv.list
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
    };
    utils.inherit(MACSearch, StyledElements.StyledElement);

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

    MACSearch.prototype.clear = function clear() {
        privates.get(this).list.clear();
    };

    MACSearch.prototype.repaint = function repaint() {
        privates.get(this).list.repaint();
    };

    MACSearch.prototype.refresh = function refresh() {
        _keywordTimeoutHandler.call(this, this.input);
    };

    MACSearch.prototype.focus = function focus() {
        this.inputField.focus();
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var _search = function _search(keywords) {
        var priv = privates.get(this);

        if (priv.request != null) {
            // Abort current request due user input
            priv.request.abort("User input", true);
        }
        priv.list.disable();
        this.dispatchEvent('search');
        priv.request = Wirecloud.LocalCatalogue.search({
            scope: this.search_scope,
            search_criteria: keywords
        }).then((search_info) => {
            on_search_success.call(this, keywords, search_info.resources, search_info);
        }, (error) => {
            var msg = utils.gettext("Connection error: No resource retrieved");

            _load_resource_painter.call(this);
            priv.list.clear().appendChild(this.paintError(msg));
            return Promise.resolve();
        }).then(() => {
            priv.request = null;
            priv.list.enable();
        });
    };

    var _load_resource_painter = function _load_resource_painter() {
        if (this.resource_painter == null) {
            this.resource_painter = new Wirecloud.ui.ResourcePainter(null, Wirecloud.currentTheme.templates['wirecloud/macsearch/component'], null, {
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
        privates.get(this).search_timeout = null;
        _search.call(this, input.value);
    };

    var _onSearchInput = function _onSearchInput(input) {

        var priv = privates.get(this);

        // Cancel current timeout
        if (priv.search_timeout !== null) {
            clearTimeout(priv.search_timeout);
        }

        priv.search_timeout = setTimeout(_keywordTimeoutHandler.bind(this, input), 700);
    };

    var _onSearchInputKeyPress = function _onSearchInputKeyPress(input, modifiers, key) {
        if (key === "Enter") {

            var priv = privates.get(this);

            // Cancel current timeout
            if (priv.search_timeout !== null) {
                clearTimeout(priv.search_timeout);
            }

            // Inmediate search
            _keywordTimeoutHandler.call(this, input);
        }
    };

    var on_search_success = function on_search_success(keywords, components, search_info) {
        var msg, priv = privates.get(this);

        _load_resource_painter.call(this);
        priv.list.clear();
        if (search_info.total_count !== 0) {
            if ('corrected_query' in search_info) {
                msg = utils.gettext("<p>Showing results for <b><t:corrected_query/></b></p>");
                priv.list.appendChild(this.paintInfo(msg, {
                    corrected_query: search_info.corrected_query
                }));
            }

            components.forEach(function (component) {
                try {
                    component.version = new Wirecloud.Version(component.version);
                    component.others = component.others.map(function (version) {return new Wirecloud.Version(version);});
                    priv.list.appendChild(this.resource_painter.paint(component));
                } catch (e) {
                    //
                }
            }, this);
        } else {
            if (keywords !== "") {
                msg = utils.gettext("<p>We couldn't find anything for your search - <b>%(keywords)s.</b></p><p>Suggestions:</p><ul><li>Make sure all words are spelled correctly.</li><li>Try different keywords.</li><li>Try more general keywords.</li></ul>");
                msg = utils.interpolate(msg, {keywords: utils.escapeHTML(keywords.trim())}, true);
            } else if (this.search_scope !== '') {
                msg = utils.gettext("<p>Currently, you do not have access to any %(scope)s component. You can get components using the Marketplace view or by uploading components manually using the Upload button on the My Resources view.</p>");
                msg = utils.interpolate(msg, {scope: this.search_scope}, true);
            } else {
                msg = utils.gettext("<p>Currently, you do not have access to any component. You can get components using the Marketplace view or by uploading components manually using the Upload button on the My Resources view.</p>");
            }
            priv.list.appendChild(this.paintError(new StyledElements.Fragment(msg)));
        }
    };

    Wirecloud.ui.MACSearch = MACSearch;

})(Wirecloud.Utils);
