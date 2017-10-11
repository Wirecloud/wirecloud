/*
 *     Copyright 2012-2017 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (ns, se, utils) {

    "use strict";

    var WorkspaceView = function WorkspaceView(id, options) {
        StyledElements.Alternative.call(this, id, options);
        this.wrapperElement.classList.add("wc-workspace");

        this.wsMenu = new StyledElements.PopupMenu();
        this.wsMenu.append(new Wirecloud.ui.WorkspaceListItems(function (context, workspace) {
            Wirecloud.UserInterfaceManager.monitorTask(Wirecloud.changeActiveWorkspace(workspace));
        }));
        this.wsMenu.appendSeparator();
        this.wsMenu.append(new Wirecloud.ui.WorkspaceViewMenuItems(this));

        this.walletButton = this.buildAddWidgetButton();

        this.wiringButton = new StyledElements.Button({
            class: "wc-show-wiring-button",
            iconClass: 'fa fa-puzzle-piece',
            title: utils.gettext('Wiring')
        });
        this.wiringButton.addEventListener('click', function () {
            Wirecloud.UserInterfaceManager.changeCurrentView('wiring');
        });

        this.myresourcesButton = new StyledElements.Button({
            iconClass: 'fa fa-archive',
            class: "wc-show-myresources-button",
            title: utils.gettext('My Resources')
        });
        this.myresourcesButton.addEventListener('click', function () {
            Wirecloud.UserInterfaceManager.changeCurrentView('myresources');
        });

        this.marketButton = new StyledElements.Button({
            iconClass: 'fa fa-shopping-cart',
            class: "wc-show-marketplace-button",
            title: utils.gettext('Get more components')
        });
        this.marketButton.addEventListener('click', function () {
            Wirecloud.UserInterfaceManager.changeCurrentView('marketplace');
        });

        this.layout = new StyledElements.OffCanvasLayout();
        this.appendChild(this.layout);

        Object.defineProperties(this, {
            activeTab: {
                get: function () {
                    return this.notebook.getVisibleTab();
                }
            },
            tabs: {
                get: function () {
                    return this.notebook.tabs;
                }
            },
            name: {
                get: function () {
                    return this.model.name;
                }
            },
            title: {
                get: function () {
                    return this.model.title;
                }
            },
            widgets: {
                get: function () {
                    return get_widgets.call(this);
                }
            }
        });

        this.on_workspace_change_bound = on_workspace_change.bind(this);
        this.on_workspace_remove_bound = on_workspace_remove.bind(this);
        this.on_workspace_unload_bound = on_workspace_unload.bind(this);

        Wirecloud.addEventListener('loaded', function () {
            this.showcase =  new Wirecloud.ui.ComponentSidebar();
            this.layout.appendChild(this.showcase);

            this.showcase.addEventListener('create', function (showcase, group, button) {
                button.disable();

                if (group.meta.type === 'widget') {
                    this.activeTab.createWidget(group.meta).then(function () {
                        button.enable();
                    });
                } else {
                    Wirecloud.UserInterfaceManager.monitorTask(
                        Wirecloud.mergeWorkspace(
                            this.model,
                            {
                                mashup: group.meta.uri
                            }
                        ).then((workspace) => {
                            return Wirecloud.changeActiveWorkspace(workspace);
                        }, (error) => {
                            button.enable();
                            var dialog;
                            if (error.details != null && 'missingDependencies' in error.details) {
                                // Show missing dependencies
                                dialog = new Wirecloud.ui.MissingDependenciesWindowMenu(null, error.details);
                            } else {
                                dialog = new Wirecloud.ui.MessageWindowMenu(error, Wirecloud.constants.LOGGING.ERROR_MSG);
                            }
                            dialog.show();
                        })
                    );
                }
            }.bind(this));
        }.bind(this));
    };
    utils.inherit(WorkspaceView, StyledElements.Alternative);

    WorkspaceView.prototype.view_name = 'workspace';

    WorkspaceView.prototype.findTab = function findTab(id) {
        var i;

        for (i = 0; i < this.notebook.tabs.length; i++) {
            if (this.notebook.tabs[i].id === id) {
                return this.notebook.tabs[i];
            }
        }

        return null;
    };

    WorkspaceView.prototype.findWidget = function findWidget(id) {
        var i, widget;

        for (i = 0; i < this.notebook.tabs.length; i++) {
            widget = this.notebook.tabs[i].findWidget(id);
            if (widget != null) {
                return widget;
            }
        }

        return null;
    };

    WorkspaceView.prototype.showSettings = function showSettings() {
        (new Wirecloud.ui.PreferencesWindowMenu('workspace', this.model.preferences)).show();
        return this;
    };

    WorkspaceView.prototype.loadWorkspace = function loadWorkspace(workspace, options) {
        var loadingTab;

        options = utils.merge({
            initialtab: null
        }, options);

        this.walletButton.active = false;

        this.notebook = new StyledElements.Notebook({
            'class': 'se-notebook-bottom'
        });
        this.notebook.appendTo(this.layout.content);

        loadingTab = this.notebook.createTab();
        loadingTab.disable();
        loadingTab.addClassName('loading');

        this.model = workspace;
        this.model.view = this;
        this.model.addEventListener('unload', this.on_workspace_unload_bound);
        this.model.addEventListener('change', this.on_workspace_change_bound);
        this.model.addEventListener('remove', this.on_workspace_remove_bound);

        this.model.operators.forEach(function (operator) {
            this.layout.content.appendChild(operator.wrapperElement);
        }, this);

        var initialTab = null;
        var requestedTab = null;

        this.model.tabs.forEach(function (model) {
            var tab = this.notebook.createTab({
                tab_constructor: Wirecloud.ui.WorkspaceTabView,
                model: model,
                workspace: this
            });

            if (options.initialtab === model.name) {
                requestedTab = tab;
            }

            if (model.initial) {
                initialTab = tab;
            }
        }, this);

        if (requestedTab != null) {
            this.notebook.goToTab(requestedTab);
        } else {
            this.notebook.goToTab(initialTab);
        }

        this.notebook.removeTab(loadingTab);

        if (this.model.isAllowed('edit')) {
            var button = new StyledElements.Button({
                title: utils.gettext("New tab"),
                iconClass: "fa fa-plus",
                class: "wc-create-workspace-tab"
            });
            this.notebook.addButton(button);
            button.addEventListener('click', on_click_createtab.bind(this));
        }

        if (Wirecloud.Utils.isFullscreenSupported()) {
            this.fullscreenButton = new StyledElements.Button({
                iconClass: 'fa fa-expand',
                title: utils.gettext('Full screen')
            });
            this.notebook.addButton(this.fullscreenButton);
            Wirecloud.Utils.onFullscreenChange(this.notebook, function () {
                this.fullscreenButton.removeIconClassName(['fa-expand', 'fa-compress']);
                if (this.notebook.fullscreen) {
                    this.fullscreenButton.addIconClassName('fa-compress');
                    this.fullscreenButton.setTitle(utils.gettext('Exit full screen'));
                    this.notebook.addClassName('fullscreen');
                } else {
                    this.fullscreenButton.addIconClassName('fa-expand');
                    this.fullscreenButton.setTitle(utils.gettext('Full screen'));
                    this.notebook.removeClassName('fullscreen');
                }
            }.bind(this));
            this.fullscreenButton.addEventListener('click', function () {
                if (this.notebook.fullscreen) {
                    this.notebook.exitFullscreen();
                } else {
                    this.notebook.requestFullscreen();
                }
            }.bind(this));
        }

        if (Wirecloud.contextManager.get('mode') === 'embedded') {
            this.seeOnWirecloudButton = new StyledElements.Button({
                'class': 'powered-by-wirecloud'
            });
            this.notebook.addButton(this.seeOnWirecloudButton);
            this.seeOnWirecloudButton.addEventListener('click', function () {
                var url = Wirecloud.URLs.WORKSPACE_VIEW.evaluate({owner: encodeURIComponent(this.model.owner), name: encodeURIComponent(this.model.name)});
                window.open(url, '_blank');
            }.bind(this));
        } else {
            this.poweredByWirecloudButton = new StyledElements.Button({
                'class': 'powered-by-wirecloud'
            });
            this.notebook.addButton(this.poweredByWirecloudButton);
            this.poweredByWirecloudButton.addEventListener('click', function () {window.open('http://conwet.fi.upm.es/wirecloud/', '_blank');});
        }

        this.model.addEventListener('createoperator', function (workspace_model, operator) {
            this.layout.content.appendChild(operator.wrapperElement);
        }.bind(this));
        this.model.addEventListener('removeoperator', function (workspace_model, operator) {
            this.layout.content.removeChild(operator.wrapperElement);
        }.bind(this));
    };

    WorkspaceView.prototype.buildAddWidgetButton = function buildAddWidgetButton() {
        var button = new se.ToggleButton({
            title: utils.gettext("Add components"),
            class: "btn-primary wc-show-component-sidebar-button",
            iconClass: "fa fa-archive",
            stackedIconClass: "fa fa-plus-circle"
        });
        button.addEventListener('click', function (button) {
            if (button.active) {
                this.showcase.searchComponents.refresh();
                this.layout.slideIn();
            } else {
                this.layout.slideOut();
            }
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

    WorkspaceView.prototype.canGoUp = function canGoUp() {
        return Wirecloud.activeWorkspace != null && (Wirecloud.activeWorkspace.owner !== "wirecloud" || Wirecloud.activeWorkspace.name !== "home");
    };

    WorkspaceView.prototype.goUp = function goUp() {
        Wirecloud.changeActiveWorkspace({owner: 'wirecloud', name: 'home'});
    };

    WorkspaceView.prototype.getBreadcrumb = function getBreadcrumb() {
        var entries, current_state;

        current_state = Wirecloud.HistoryManager.getCurrentState();

        if (Wirecloud.activeWorkspace != null) {
            entries = [
                {
                    'label': Wirecloud.activeWorkspace.owner
                }, {
                    'label': Wirecloud.activeWorkspace.title,
                }
            ];
        } else if ('workspace_owner' in current_state) {
            entries = [
                {
                    'label': current_state.workspace_owner
                }, {
                    'label': current_state.workspace_title,
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
        if (Wirecloud.activeWorkspace != null) {
            return Wirecloud.activeWorkspace.owner + '/' + Wirecloud.activeWorkspace.name;
        } else if ('workspace_owner' in current_state) {
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
            this.clear();
            this.appendChild(alert_msg);
            Wirecloud.dispatchEvent('viewcontextchanged');
        } else if (Wirecloud.activeWorkspace == null || (nextWorkspace.id !== Wirecloud.activeWorkspace.id)) {
            Wirecloud.changeActiveWorkspace(nextWorkspace, {initialtab: newState.tab, history: 'ignore'});
        } else if (newState.tab != null) {
            target_tab = get_tab_by_id.call(this, newState.tab_id);
            this.notebook.goToTab(target_tab);
            document.title = newState.workspace_owner + '/' + newState.workspace_name;
        } else {
            document.title = newState.workspace_owner + '/' + newState.workspace_name;
        }
    };

    WorkspaceView.prototype.rename = function rename(name) {
        return this.model.rename(name);
    };

    WorkspaceView.prototype.remove = function remove() {
        return new Promise(function (resolve, reject) {
            var dialog = new Wirecloud.ui.AlertWindowMenu();

            dialog.setMsg(utils.interpolate(utils.gettext('Do you really want to remove the "%(name)s" workspace?'), {
                name: this.title
            }));
            dialog.setHandler(function () {
                this.model.remove().then(function () {
                    resolve();
                }, function (reason) {
                    reject(reason);
                });
            }.bind(this));
            dialog.show();
        }.bind(this));
    };

    WorkspaceView.prototype.publish = function publish(data) {
        return this.model.publish(data);
    };

    WorkspaceView.prototype.drawAttention = function drawAttention(id) {
        var widget = this.findWidget(id);

        if (widget !== null) {
            this.highlightTab(widget.tab);
            widget.tab.dragboard.raiseToTop(widget);
            widget.highlight();
        }
    };

    WorkspaceView.prototype.highlightTab = function highlightTab(tab) {

        if (typeof tab === 'string') {
            tab = this.findTab(tab);
        }

        tab.tabElement.classList.add("highlight");
    };

    WorkspaceView.prototype.unhighlightTab = function unhighlightTab(tab) {

        if (typeof tab === 'string') {
            tab = this.findTab(tab);
        }

        tab.tabElement.classList.remove("highlight");
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var get_widgets = function get_widgets() {
        return Array.prototype.concat.apply([], this.notebook.tabs.map(function (tab) {
            return tab.widgets;
        }));
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_workspace_change = function on_workspace_change(workspace) {
        var state;

        state = {
            workspace_owner: this.model.owner,
            workspace_name: this.model.name,
            workspace_title: this.model.title,
            view: "workspace",
            tab: Wirecloud.HistoryManager.getCurrentState().tab
        };
        Wirecloud.HistoryManager.replaceState(state);

        Wirecloud.UserInterfaceManager.header.refresh();
    };

    var on_workspace_remove = function on_workspace_remove(workspace) {
        // Go to the wirecloud/home dashboard
        Wirecloud.changeActiveWorkspace({owner: 'wirecloud', name: 'home'});
    };

    var on_workspace_unload = function on_workspace_unload(workspace) {
        if (this.model === workspace) {
            this.layout.content.clear();
        }
        workspace.removeEventListener('remove', this.on_workspace_remove_bound);
        workspace.removeEventListener('change', this.on_workspace_change_bound);
    };

    var on_click_createtab = function on_click_createtab(button) {
        button.disable();
        this.model.createTab().then(function (tab) {
            this.notebook.createTab({
                tab_constructor: Wirecloud.ui.WorkspaceTabView,
                model: tab,
                workspace: this
            });
            button.enable();
        }.bind(this), function () {
            button.enable();
        });
    };

    var get_tab_by_id = function get_tab_by_id(id) {
        for (var i = 0; i < this.notebook.tabs.length; i++) {
            if (this.tabs[i].id === id) {
                return this.tabs[i];
            }
        }
        return null;
    };

    Wirecloud.ui.WorkspaceView = WorkspaceView;

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
