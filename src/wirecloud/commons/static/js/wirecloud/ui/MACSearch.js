/*
 *     Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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


(function (se, ns, utils) {

    "use strict";

    const builder = new StyledElements.GUIBuilder();

    ns.MACSearch = class MACSearch extends se.StyledElement {

        constructor(options) {

            if (options == null || typeof options !== "object" || (typeof options.resourceButtonListener !== "function" && options.resource_painter == null)) {
                throw new TypeError();
            }

            options = utils.merge({
                extra_template_context: null,
                scope: '',
                template: 'wirecloud/macsearch/base',
                resource_painter: null
            }, options);

            super(['search']);

            this.info_template = builder.DEFAULT_OPENING + '<div class="alert alert-info"><t:message/></div>' + builder.DEFAULT_CLOSING;
            this.error_template = builder.DEFAULT_OPENING + '<div class="alert alert-error"><t:message/></div>' + builder.DEFAULT_CLOSING;


            var priv = {
                request: null,
                search_timeout: null
            };
            privates.set(this, priv);
            this.resource_painter = options.resource_painter;

            var input;
            var list = new StyledElements.Container({class: 'wc-macsearch-list wc-resource-results loading'});

            var template = Wirecloud.currentTheme.templates[options.template];
            this.wrapperElement = builder.parse(template, utils.merge({
                searchinput: () => {
                    input = new StyledElements.TextField({class: "se-field-search", 'placeholder': utils.gettext('Keywords...')});
                    input.addEventListener('keydown', _onSearchInputKeyPress.bind(this));
                    input.addEventListener('change', _onSearchInput.bind(this));
                    return input;
                },
                list: list
            }, options.extra_template_context)).elements[1];
            if (this.wrapperElement instanceof StyledElements.StyledElement) {
                this.wrapperElement = this.wrapperElement.get();
            }

            Object.defineProperties(this, {
                'input': {value: input},
                'list': {value: list},
                'search_scope': {value: options.scope, writable: true},
                'resourceButtonIconClass': {value: options.resourceButtonIconClass},
                'resourceButtonListener': {value: options.resourceButtonListener},
                'resourceButtonTooltip': {value: options.resourceButtonTooltip}
            });
        }

        paintInfo(message, context) {
            if (context != null) {
                message = builder.parse(builder.DEFAULT_OPENING + message + builder.DEFAULT_CLOSING, context);
            }

            this.list.appendChild(builder.parse(this.info_template, {
                'message': message
            }));

            return this;
        }

        paintError(message) {
            this.list.appendChild(builder.parse(this.error_template, {
                'message': message
            }));

            return this;
        }

        clear() {
            this.list.clear();

            return this;
        }

        repaint() {
            this.list.repaint();

            return this;
        }

        refresh() {
            var priv = privates.get(this);

            if (priv.search_timeout != null) {
                clearTimeout(priv.search_timeout);
                priv.search_timeout = null;
            }
            _keywordTimeoutHandler.call(this, this.input);

            return this;
        }

        focus() {
            this.input.focus();

            return this;
        }

    }

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
        this.list.disable();
        this.dispatchEvent('search');
        priv.request = Wirecloud.LocalCatalogue.search({
            scope: this.search_scope,
            search_criteria: keywords,
            lang: Wirecloud.contextManager.get('language')
        }).then((search_info) => {
            on_search_success.call(this, keywords, search_info.resources, search_info);
        }, (error) => {
            var msg = utils.gettext("Connection error: No resource retrieved");

            _load_resource_painter.call(this);
            this.clear().paintError(msg);
            return Promise.resolve();
        }).then(() => {
            priv.request = null;
            this.list.enable();
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
        if (priv.search_timeout != null) {
            clearTimeout(priv.search_timeout);
        }

        priv.search_timeout = setTimeout(_keywordTimeoutHandler.bind(this, input), 700);
    };

    var _onSearchInputKeyPress = function _onSearchInputKeyPress(input, modifiers, key) {
        if (key === "Enter") {

            var priv = privates.get(this);

            // Cancel current timeout
            if (priv.search_timeout != null) {
                clearTimeout(priv.search_timeout);
            }

            // Inmediate search
            _keywordTimeoutHandler.call(this, input);
        }
    };

    var on_search_success = function on_search_success(keywords, components, search_info) {
        var msg;

        this.list.clear();
        if (search_info.total_count !== 0) {
            _load_resource_painter.call(this);
            if ('corrected_query' in search_info) {
                msg = utils.gettext("<p>Showing results for <b><t:corrected_query/></b></p>");
                this.paintInfo(msg, {
                    corrected_query: search_info.corrected_query
                });
            }

            components.forEach(function (component) {
                try {
                    component.version = new Wirecloud.Version(component.version);
                    component.others = component.others.map((version) => {return new Wirecloud.Version(version);});
                    this.list.appendChild(this.resource_painter.paint(component));
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
            this.paintError(new StyledElements.Fragment(msg));
        }
    };

})(StyledElements, Wirecloud.ui, Wirecloud.Utils);
