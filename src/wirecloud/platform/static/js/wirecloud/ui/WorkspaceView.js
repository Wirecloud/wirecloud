/*
 *     Copyright 2012-2016 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global LayoutManagerFactory, StyledElements, Wirecloud */

(function (utils) {

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

        this.wallet = new Wirecloud.ui.MACWallet();
        this.walletButton = this.buildAddWidgetButton();

        this.wiringButton = new StyledElements.Button({
            'class': "btn-display-wiring-view",
            'iconClass': 'icon-puzzle-piece',
            'title': utils.gettext('Wiring')
        });
        this.wiringButton.addEventListener('click', function () {
            LayoutManagerFactory.getInstance().changeCurrentView('wiring');
        });

        this.myresourcesButton = new StyledElements.Button({
            'iconClass': 'icon-archive',
            'title': utils.gettext('My Resources')
        });
        this.myresourcesButton.addEventListener('click', function () {
            LayoutManagerFactory.getInstance().changeCurrentView('myresources');
        });

        this.marketButton = new StyledElements.Button({
            'iconClass': 'icon-shopping-cart',
            'title': utils.gettext('Get more components')
        });
        this.marketButton.addEventListener('click', function () {
            LayoutManagerFactory.getInstance().changeCurrentView('marketplace');
        });

        // Init wiring error badge
        Wirecloud.addEventListener('activeworkspacechanged', function (Wirecloud, workspace) {
            this.wallet.hide(true);

            this._updateWiringErrors = function () {
                var errorCount = workspace.wiring.logManager.errorCount;
                this.wiringButton.setBadge(errorCount ? errorCount : null, 'danger');
            }.bind(this);

            workspace.wiring.addEventListener('load', this._updateWiringErrors);
            workspace.wiring.addEventListener('unloaded', this._updateWiringErrors);
            workspace.wiring.logManager.addEventListener('newentry', this._updateWiringErrors);
            this._updateWiringErrors();
        }.bind(this));

    };
    WorkspaceView.prototype = new StyledElements.Alternative();

    WorkspaceView.prototype.view_name = 'workspace';

    WorkspaceView.prototype.buildAddWidgetButton = function buildAddWidgetButton() {
        var button = new StyledElements.Button({
            'class': 'btn-primary',
            'iconClass': 'icon-plus',
            'title': utils.gettext('Add widget')
        });
        button.addEventListener('click', function () {
            this.wallet.show();
        }.bind(this));

        return button;
    };

    WorkspaceView.prototype.buildStateData = function buildStateData() {
        var currentState = Wirecloud.HistoryManager.getCurrentState();
        return {
            workspace_owner: currentState.workspace_owner,
            workspace_name: currentState.workspace_name,
            view: 'workspace'
        };
    };

    WorkspaceView.prototype.getBreadcrum = function getBreadcrum() {
        var entries, current_state;

        current_state = Wirecloud.HistoryManager.getCurrentState();
        if ('workspace_owner' in current_state) {
            entries = [
                {
                    'label': current_state.workspace_owner
                }, {
                    'label': current_state.workspace_name,
                }
            ];
        } else {
            entries = [{
                'label': utils.gettext('loading...')
            }];
        }

        return entries;
    };

    WorkspaceView.prototype.getTitle = function getTitle() {
        var current_state = Wirecloud.HistoryManager.getCurrentState();
        if ('workspace_owner' in current_state) {
            return current_state.workspace_owner + '/' + current_state.workspace_name;
        } else {
            return utils.gettext('loading...');
        }
    };

    WorkspaceView.prototype.getToolbarMenu = function getToolbarMenu() {
        var context, current_state;
        current_state = Wirecloud.HistoryManager.getCurrentState();
        if ('workspace_owner' in current_state) {
            context = Wirecloud.contextManager;
            if (context && context.get('username') !== 'anonymous') {
                return this.wsMenu;
            }
        }
        return null;
    };

    WorkspaceView.prototype.getToolbarButtons = function getToolbarButtons() {
        if (Wirecloud.contextManager && Wirecloud.contextManager.get('username') !== 'anonymous') {
            this.walletButton.setDisabled(Wirecloud.activeWorkspace == null || !Wirecloud.activeWorkspace.isAllowed('edit'));
            this.wiringButton.setDisabled(Wirecloud.activeWorkspace == null || !Wirecloud.activeWorkspace.isAllowed('edit'));
            return [this.walletButton, this.wiringButton, this.myresourcesButton, this.marketButton];
        } else {
            return [];
        }
    };

    WorkspaceView.prototype.onHistoryChange = function onHistoryChange(newState) {
        var target_tab, nextWorkspace, alert_msg;

        nextWorkspace = Wirecloud.workspacesByUserAndName[newState.workspace_owner][newState.workspace_name];
        if (nextWorkspace == null) {
            if (Wirecloud.activeWorkspace != null) {
                Wirecloud.activeWorkspace.unload();
                Wirecloud.activeWorkspace = null;
            }
            alert_msg = document.createElement('div');
            alert_msg.className = 'alert alert-info';
            alert_msg.textContent = utils.gettext('The requested workspace is no longer available (it was deleted).');
            LayoutManagerFactory.getInstance().viewsByName.workspace.clear();
            LayoutManagerFactory.getInstance().viewsByName.workspace.appendChild(alert_msg);
            Wirecloud.trigger('viewcontextchanged');
        } else if (Wirecloud.activeWorkspace == null || (nextWorkspace.id !== Wirecloud.activeWorkspace.id)) {
            Wirecloud.changeActiveWorkspace(nextWorkspace, newState.tab, {replaceNavigationState: 'leave'});
        } else if (newState.tab != null) {
            target_tab = Wirecloud.activeWorkspace.tabsByName[newState.tab];
            Wirecloud.activeWorkspace.notebook.goToTab(target_tab);
            document.title = newState.workspace_owner + '/' + newState.workspace_name;
        } else {
            document.title = newState.workspace_owner + '/' + newState.workspace_name;
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

})(Wirecloud.Utils);
