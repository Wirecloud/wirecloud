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

/*global gettext, StyledElements, Wirecloud */

(function () {

    "use strict";

    var WorkspaceView = function WorkspaceView(id, options) {
        options.id = 'workspace';
        StyledElements.Alternative.call(this, id, options);

        this.wsMenu = new StyledElements.PopupMenu();
        this.wsMenu.append(new Wirecloud.ui.WorkspaceListItems(function (context, workspace) {
            Wirecloud.changeActiveWorkspace(workspace);
        }));
        this.wsMenu.appendSeparator();
        this.wsMenu.append(new Wirecloud.ui.WorkspaceViewItems(this));

        this.widgetWallet = new Wirecloud.ui.MACWallet('widget');
        this.walletButton = new StyledElements.StyledButton({'iconClass': 'icon-plus'});
        this.walletButton.addEventListener('click', function () {
            this.mashupWallet.hide();
            this.widgetWallet.show();
        }.bind(this));

        this.mashupWallet = new Wirecloud.ui.MACWallet('mashup');
        this.mergeButton = new StyledElements.StyledButton({'iconClass': 'icon-random'});
        this.mergeButton.addEventListener('click', function () {
            this.widgetWallet.hide();
            this.mashupWallet.show();
        }.bind(this));

        this.wiringButton = new StyledElements.StyledButton({'iconClass': 'icon-puzzle-piece'});
        this.wiringButton.addEventListener('click', function () {
            LayoutManagerFactory.getInstance().changeCurrentView('wiring');
        });

        this.myresourcesButton = new StyledElements.StyledButton({'iconClass': 'icon-archive'});
        this.myresourcesButton.addEventListener('click', function () {
            LayoutManagerFactory.getInstance().changeCurrentView('myresources');
        });

        this.marketButton = new StyledElements.StyledButton({'iconClass': 'icon-shopping-cart'});
        this.marketButton.addEventListener('click', function () {
            LayoutManagerFactory.getInstance().changeCurrentView('marketplace');
        });

        // Init wiring error badge
        this.wiringErrorBadge = document.createElement('span');
        this.wiringErrorBadge.className = 'badge badge-important hidden';
        this.wiringButton.buttonElement.appendChild(this.wiringErrorBadge);
        Wirecloud.events.activeworkspacechanged.addEventListener(function (workspace) {
            this.widgetWallet.hide(true);
            this.mashupWallet.hide(true);

            this._updateWiringErrors = function () {
                this.wiringErrorBadge.innerHTML = workspace.wiring.logManager.errorCount;
                if (workspace.wiring.logManager.errorCount !== 0) {
                    this.wiringErrorBadge.classList.remove('hidden');
                } else {
                    this.wiringErrorBadge.classList.add('hidden');
                }
            }.bind(this);

            workspace.wiring.addEventListener('load', this._updateWiringErrors);
            workspace.wiring.addEventListener('unloaded', this._updateWiringErrors);
            workspace.wiring.logManager.addEventListener('newentry', this._updateWiringErrors);
            this._updateWiringErrors();
        }.bind(this));

    };
    WorkspaceView.prototype = new StyledElements.Alternative();

    WorkspaceView.prototype.view_name = 'workspace';

    WorkspaceView.prototype.buildStateData = function buildStateData() {
        var currentState = Wirecloud.HistoryManager.getCurrentState();
        return {
            workspace_creator: currentState.workspace_creator,
            workspace_name: currentState.workspace_name,
            view: 'workspace'
        };
    };

    WorkspaceView.prototype.getBreadcrum = function getBreadcrum() {
        var workspace_name, entries, current_state;

        current_state = Wirecloud.HistoryManager.getCurrentState();
        if ('workspace_creator' in current_state) {
            entries = [
                {
                    'label': current_state.workspace_creator
                }, {
                    'label': current_state.workspace_name,
                }
            ];
        } else {
            entries = [{
                'label': gettext('loading...')
            }];
        }

        return entries;
    };

    WorkspaceView.prototype.getToolbarMenu = function getToolbarMenu() {
        var context, current_state, menu;
        current_state = Wirecloud.HistoryManager.getCurrentState();
        if ('workspace_creator' in current_state) {
            context = Wirecloud.contextManager;
            if (context && context.get('username') !== 'anonymous') {
                return this.wsMenu;
            }
        }
        return null;
    };

    WorkspaceView.prototype.getToolbarButtons = function getToolbarButtons() {
        return [this.walletButton, this.mergeButton, this.wiringButton, this.myresourcesButton, this.marketButton];
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
