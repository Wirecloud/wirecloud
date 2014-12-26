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

        this.wallet = new Wirecloud.ui.MACWallet();
        this.walletButton = new StyledElements.StyledButton({
            'iconClass': 'icon-plus',
            'title': gettext('Add widget')
        });
        this.walletButton.addEventListener('click', function () {
            this.wallet.show();
        }.bind(this));

        this.wiringButton = new StyledElements.StyledButton({
            'iconClass': 'icon-puzzle-piece',
            'title': gettext('Wiring')
        });
        this.wiringButton.addEventListener('click', function () {
            LayoutManagerFactory.getInstance().changeCurrentView('wiring');
        });

        this.myresourcesButton = new StyledElements.StyledButton({
            'iconClass': 'icon-archive',
            'title': gettext('My Resources')
        });
        this.myresourcesButton.addEventListener('click', function () {
            LayoutManagerFactory.getInstance().changeCurrentView('myresources');
        });

        this.marketButton = new StyledElements.StyledButton({
            'iconClass': 'icon-shopping-cart',
            'title': gettext('Marketplace')
        });
        this.marketButton.addEventListener('click', function () {
            LayoutManagerFactory.getInstance().changeCurrentView('marketplace');
        });

        // Init wiring error badge
        this.wiringErrorBadge = document.createElement('span');
        this.wiringErrorBadge.className = 'badge badge-important hidden';
        this.wiringButton.wrapperElement.appendChild(this.wiringErrorBadge);
        Wirecloud.events.activeworkspacechanged.addEventListener(function (workspace) {
            this.wallet.hide(true);

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

    WorkspaceView.prototype.getTitle = function getTitle() {
        var current_state = Wirecloud.HistoryManager.getCurrentState();
        if ('workspace_creator' in current_state) {
            return current_state.workspace_creator + '/' + current_state.workspace_name;
        } else {
            return gettext('loading...');
        }
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
        if (Wirecloud.contextManager && Wirecloud.contextManager.get('username') !== 'anonymous') {
            this.walletButton.setDisabled(Wirecloud.activeWorkspace == null || !Wirecloud.activeWorkspace.isAllowed('edit'));
            this.wiringButton.setDisabled(Wirecloud.activeWorkspace == null || !Wirecloud.activeWorkspace.isAllowed('edit'));
            return [this.walletButton, this.wiringButton, this.myresourcesButton, this.marketButton];
        } else {
            return [];
        }
    };

    WorkspaceView.prototype.onHistoryChange = function onHistoryChange(newState) {
        var target_tab, current_tab, nextWorkspace, alert_msg;

        nextWorkspace = Wirecloud.workspacesByUserAndName[newState.workspace_creator][newState.workspace_name];
        if (nextWorkspace == null) {
            if (Wirecloud.activeWorkspace != null) {
                Wirecloud.activeWorkspace.unload();
                Wirecloud.activeWorkspace = null;
            }
            alert_msg = document.createElement('div');
            alert_msg.className = 'alert alert-info';
            alert_msg.textContent = gettext('The requested workspace is no longer available (it was deleted).');;
            LayoutManagerFactory.getInstance().viewsByName['workspace'].clear();
            LayoutManagerFactory.getInstance().viewsByName['workspace'].appendChild(alert_msg);
            LayoutManagerFactory.getInstance().header.refresh();
        } else if (Wirecloud.activeWorkspace == null || (nextWorkspace.id !== Wirecloud.activeWorkspace.id)) {
            Wirecloud.changeActiveWorkspace(nextWorkspace, newState.tab, {replaceNavigationState: 'leave'});
        } else if (newState.tab != null) {
            target_tab = Wirecloud.activeWorkspace.tabsByName[newState.tab];
            Wirecloud.activeWorkspace.notebook.goToTab(target_tab);
            document.title = newState.workspace_creator + '/' + newState.workspace_name;
        } else {
            document.title = newState.workspace_creator + '/' + newState.workspace_name;
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
