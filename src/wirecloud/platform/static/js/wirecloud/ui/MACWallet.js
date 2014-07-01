/*
 *     Copyright 2014 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, interpolate, LayoutManagerFactory, OpManagerFactory, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var builder = new StyledElements.GUIBuilder();

    var _search = function _search(keywords) {
        this._list.classList.add('disabled');
        Wirecloud.LocalCatalogue.search({
            scope: this.search_scope,
            search_criteria: keywords,
            onSuccess: function (widgets, search_info) {
                var i, msg, buttontitle, listener;

                if (this.resource_painter == null) {
                    if (this.search_scope === 'widget') {
                        buttontitle = gettext('Add to workspace');
                        listener = function (resource) {
                            var local_widget = Wirecloud.LocalCatalogue.getResource(resource.vendor, resource.name, resource.version);
                            Wirecloud.activeWorkspace.addInstance(local_widget);
                        };
                    } else {
                        buttontitle = gettext('Merge');
                        listener = function (resource) {
                            OpManagerFactory.getInstance().mergeMashupResource(resource, {
                                onFailure: function (msg, details) {
                                    var dialog;
                                    if (details != null && 'missingDependencies' in details) {
                                        // Show missing dependencies
                                        dialog = new Wirecloud.ui.MissingDependenciesWindowMenu(null, details);
                                    } else {
                                        dialog = new Wirecloud.ui.MessageWindowMenu(msg, Wirecloud.constants.LOGGING.ERROR_MSG);
                                    }
                                    dialog.show();
                                }
                            });
                        };
                    }

                    this.resource_painter = new Wirecloud.ui.ResourcePainter(null, Wirecloud.currentTheme.templates.wallet_widget, null, {
                        'mainbutton': function (options, context, resource) {
                            var button = new StyledElements.StyledButton({
                                'class': 'mainbutton btn-primary',
                                'iconClass': 'icon-plus',
                                'title': buttontitle
                            });
                            button.addEventListener('click', listener.bind(null, resource));
                            return button;
                        }
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

    var MACWallet = function MACWallet(scope) {
        Object.defineProperty(this, 'search_scope', {value: scope});

    };

    MACWallet.prototype.show = function show() {

        if (this.wallet != null) {
            return;
        }
        this._list = document.createElement('div');
        this._list.className = 'widget_wallet_list';

        var input, addmoretext;

        if (this.search_scope === 'widget') {
            addmoretext = gettext('Get more widgets');
        } else {
            addmoretext = gettext('Get more mashups');
        }

        this.wallet = builder.parse(Wirecloud.currentTheme.templates.wallet, {
            closebutton: function () {
                var button = new StyledElements.StyledButton({"class": "icon-remove", plain: true});
                button.addEventListener('click', this.hide.bind(this));
                return button;
            }.bind(this),
            addmore: function () {
                var div = document.createElement('div');
                div.className = 'widget_wallet_addmore';
                var button = new StyledElements.StyledButton({text: addmoretext, "class": "btn-success"});
                button.addEventListener('click', function () {
                    LayoutManagerFactory.getInstance().changeCurrentView('marketplace');
                });
                button.insertInto(div);
                return div;
            },
            searchinput: function () {
                input = new StyledElements.StyledTextField({'placeholder': 'Keywords...'});
                input.inputElement.addEventListener('keypress', _onSearchInputKeyPress.bind(this, input));
                input.addEventListener('change', _onSearchInput.bind(this));
                return input;
            }.bind(this),
            list: this._list
        }).elements[1];
        Wirecloud.activeWorkspace.notebook.contentArea.appendChild(this.wallet);

        _search.call(this, '');
        setTimeout(function () {
            input.focus();
            this.wallet.classList.add('in');
        }.bind(this), 0);

    };

    MACWallet.prototype.hide = function hide() {
        if (this.wallet != null) {
            this.wallet.addEventListener('transitionend', function () {
                this.wallet.parentNode.removeChild(this.wallet);
                this.wallet = null;
            }.bind(this));
            this.wallet.classList.remove('in');
        }
    };

    Wirecloud.ui.MACWallet = MACWallet;

})();
