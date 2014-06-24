/*
 *     Copyright 2012-2014 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, StyledElements, Wirecloud, WorkspaceItems*/

(function () {

    "use strict";

    var builder = new StyledElements.GUIBuilder();

    var _search = function _search(keywords) {
        Wirecloud.LocalCatalogue.search({
            scope: 'widget',
            search_criteria: keywords,
            onSuccess: function (widgets) {
                var i;

                if (this.resource_painter == null) {
                    this.resource_painter = new Wirecloud.ui.ResourcePainter(null, Wirecloud.currentTheme.templates['wallet_widget'], null, {
                        'mainbutton': function (options, context, resource) {
                            var button = new StyledElements.StyledButton({
                                'class': 'instantiate_button',
                                'iconClass': 'icon-plus',
                                'title': 'Add to workspace'
                            });
                            button.addEventListener('click', function () {
                                var local_widget = Wirecloud.LocalCatalogue.getResource(resource.vendor, resource.name, resource.version);
                                Wirecloud.activeWorkspace.addInstance(local_widget);
                            });
                            button.addClassName('mainbutton btn-primary');
                            return button;
                        }
                    });
                }

                this._list.innerHTML = '';
                for (i = 0; i < widgets.length; i += 1) {
                    this.resource_painter.paint(widgets[i]).insertInto(this._list);
                }
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

    var WorkspaceView = function WorkspaceView(id, options) {
        options.id = 'workspace';
        StyledElements.Alternative.call(this, id, options);

        this.wsMenu = new StyledElements.PopupMenu();
        this.wsMenu.append(new Wirecloud.ui.WorkspaceListItems(function (context, workspace) {
            Wirecloud.changeActiveWorkspace(workspace);
        }));
        this.wsMenu.appendSeparator();
        this.wsMenu.append(new WorkspaceItems(this));

        this.walletButton = new StyledElements.StyledButton({'class': 'icon-plus', plain: true});
        this.walletButton.addEventListener('click', function () {
            this.toggleWidgetWallet();
        }.bind(this));
    };
    WorkspaceView.prototype = new StyledElements.Alternative();

    WorkspaceView.prototype.view_name = 'workspace';

    WorkspaceView.prototype.buildStateData = function buildStateData() {
        return Wirecloud.Utils.merge(Wirecloud.HistoryManager.getCurrentState(), {
            view: 'workspace'
        });
    };

    WorkspaceView.prototype.getBreadcrum = function getBreadcrum() {
        var workspace_name, entries, current_state, menu, context;

        current_state = Wirecloud.HistoryManager.getCurrentState();
        if ('workspace_creator' in current_state) {
            context = Wirecloud.contextManager;
            if (context && context.get('username') !== 'anonymous') {
                menu = this.wsMenu;
            }
            entries = [
                {
                    'label': current_state.workspace_creator
                }, {
                    'label': current_state.workspace_name,
                    'menu': menu
                }
            ];
        } else {
            entries = [{
                'label': gettext('loading...')
            }];
        }

        return entries;
    };

    WorkspaceView.prototype.getToolbarButtons = function getToolbarButtons() {
        return [this.walletButton];
    };

    WorkspaceView.prototype.openWidgetWallet = function openWidgetWallet() {
        this._list = document.createElement('div');
        this._list.className = 'widget_wallet_list';

        var input;

        this.wallet = builder.parse(Wirecloud.currentTheme.templates['wallet'], {
            addmore: function () {
                var div = document.createElement('div');
                div.className = 'widget_wallet_addmore';
                var button = new StyledElements.StyledButton({text: gettext('Get more widgets'), "class": "btn-success"});
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
        LayoutManagerFactory.getInstance().viewsByName['workspace'].appendChild(this.wallet);

        _search.call(this, '');
        setTimeout(function () {
            input.focus();
            this.wallet.classList.add('in');
        }.bind(this), 0);
    };

    WorkspaceView.prototype.hideWidgetWallet = function hideWidgetWallet() {
        if (this.wallet != null) {
            this.wallet.addEventListener('transitionend', function () {
                this.wallet.parentNode.removeChild(this.wallet);
                this.wallet = null;
            }.bind(this));
            this.wallet.classList.remove('in');
        }
    };

    WorkspaceView.prototype.toggleWidgetWallet = function toggleWidgetWallet() {
        if (this.wallet != null) {
            this.hideWidgetWallet();
        } else {
            this.openWidgetWallet();
        }
    };

    WorkspaceView.prototype.destroy = function destroy() {

        if (this.wsMenu) {
            this.wsMenu.destroy();
            this.wsMenu = null;
        }

        StyledElements.Alternative.destroy();
    };

    Wirecloud.ui.WorkspaceView = WorkspaceView;

})();
