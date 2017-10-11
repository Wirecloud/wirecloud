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

    var UserInterfaceManager = {
        rootKeydownHandler: null,
        currentWindowMenu: null,
        currentPopups: [],
        workspaceviews: {}
    };

    var coverLayerElement = null;
    var currentTooltip = null;

    /**
     * @private
     */
    var fadeInCover = function fadeInCover() {
        coverLayerElement.classList.add('in');
    };

    var showCover = function showCover() {
        coverLayerElement.style.display = "block";
        setTimeout(fadeInCover, 0);
    };

    var hideCover = function hideCover() {
        coverLayerElement.classList.remove('in');
        coverLayerElement.style.display = "none";
    };

    UserInterfaceManager.init = function init() {
        if (coverLayerElement != null) {
            return;
        }

        // disabling background layer
        coverLayerElement = document.createElement('div');
        coverLayerElement.id = 'menu_layer';
        coverLayerElement.className = 'disabled_background fade';
        coverLayerElement.style.display = 'none';
        document.body.insertBefore(coverLayerElement, document.body.firstChild);

        // General keydown handler
        document.addEventListener('keydown', function (event) {
            var modifiers, key, consumed;

            modifiers = {
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey
            };
            key = utils.normalizeKey(event);

            // if there are not modals, check if the current view can consume this keydown event
            if (UserInterfaceManager.currentWindowMenu == null) {
                consumed = utils.callCallback(UserInterfaceManager.rootKeydownHandler, key, modifiers);
            } else if (key === "Backspace") {
                // Ignore backspace keydown events if we are in a modals
                consumed = true;
            }

            // Handle default shortcuts
            if (!consumed && key === "Escape") {
                UserInterfaceManager.handleEscapeEvent();
            }

            if (consumed) {
                event.preventDefault();
            }
        }, false);

        // TODO refactor
        if (document.querySelector('.plain_content') != null) {
            if ('WirecloudHeader' in Wirecloud.ui) {
                this.header = new Wirecloud.ui.WirecloudHeader(this);
            }
            return;
        }
        this.alternatives = new StyledElements.Alternatives({class: 'wc-body'});
        this.alternatives.appendTo(document.querySelector("#wc-body"));

        /* TODO| FIXME */
        if ('WirecloudHeader' in Wirecloud.ui) {
            this.header = new Wirecloud.ui.WirecloudHeader(this);
            this.alternatives.addEventListener('preTransition', function (alternatives, old_alternative, new_alternative) {
                this.header._notifyViewChange();
            }.bind(this));
            this.alternatives.addEventListener('postTransition', function (alternatives, old_alternative, new_alternative) {
                this.header._notifyViewChange(new_alternative);
            }.bind(this));
        }

        this.views = {
            'initial': this.alternatives.createAlternative(),
            'workspace': this.alternatives.createAlternative({'alternative_constructor': Wirecloud.ui.WorkspaceView}),
            'wiring': this.alternatives.createAlternative({'alternative_constructor': Wirecloud.ui.WiringEditor}),
            'marketplace': this.alternatives.createAlternative({'alternative_constructor': Wirecloud.ui.MarketplaceView})
        };

        Wirecloud.addEventListener('contextloaded', function () {
            this.views.myresources = this.alternatives.createAlternative({alternative_constructor: Wirecloud.ui.MyResourcesView});
        }.bind(this));

        // Handle Workspace changes
        Wirecloud.addEventListener('activeworkspacechanged', function (Wirecloud, workspace) {
            this.layout.slideOut();

            // Check if the workspace needs to ask some values before loading this workspace
            if (workspace.emptyparams.length > 0) {
                var preferences, preferenceValues, dialog;

                preferenceValues = {};
                workspace.emptyparams.forEach((emptyparam) => {
                    if (workspace.preferences[emptyparam] != null) {
                        preferenceValues[emptyparam] = workspace.preferences[emptyparam];
                    }
                });

                preferences = Wirecloud.PreferenceManager.buildPreferences('workspace', preferenceValues, workspace, workspace.extraprefs, workspace.emptyparams);
                preferences.addEventListener('post-commit', function () {
                    setTimeout(function () {
                        Wirecloud.UserInterfaceManager.monitorTask(
                            Wirecloud.changeActiveWorkspace(workspace)
                        );
                    }, 0);
                }.bind(this));

                dialog = new Wirecloud.ui.PreferencesWindowMenu('workspace', preferences);
                dialog.show();
                return;
            }

            // init new active workspace
            var state = Wirecloud.HistoryManager.getCurrentState();
            try {
                this.loadWorkspace(workspace, {initialtab: state.tab});
            } catch (error) {
                // Error during initialization
                // TODO: Init failsafe mode
                return;
            }

            if (state.tab == null || state.tab_id == null || state.workspace_title == null) {
                if (state.tab == null) {
                    state.tab = this.notebook.visibleTab.model.name;
                }
                if (state.tab_id == null) {
                    state.tab_id = this.notebook.visibleTab.model.id;
                }
                if (state.workspace_title == null) {
                    state.workspace_title = this.model.title;
                }
                Wirecloud.HistoryManager.replaceState(state);
            }

            // Handle tab changes
            this.notebook.addEventListener("changed", function (notebook, oldTab, newTab) {
                var currentState = Wirecloud.HistoryManager.getCurrentState();
                var newState = utils.merge({}, currentState, {
                    tab: newTab.model.name,
                    tab_id: newTab.model.id
                });

                if (currentState.tab !== newState.tab) {
                    Wirecloud.HistoryManager.pushState(newState);
                }
            });

            // Init wiring error badge
            this._updateWiringErrors = function (entry) {
                var errorCount = workspace.wiring.errorCount;
                this.wiringButton.setBadge(errorCount ? errorCount : null, 'danger');
            }.bind(this);

            workspace.wiring.logManager.addEventListener('newentry', this._updateWiringErrors);
            this._updateWiringErrors();

            Wirecloud.GlobalLogManager.log(utils.gettext('Workspace loaded'), Wirecloud.constants.LOGGING.INFO_MSG);
        }.bind(this.views.workspace));

        // Add some event listeners
        utils.onFullscreenChange(document.body, on_fullscreen_change.bind(this));
        window.addEventListener("resize", resizeUI.bind(this), true);
        document.addEventListener("click", on_click.bind(this), true);
    };

    UserInterfaceManager.changeCurrentView = function changeCurrentView(newView, options) {

        if (options === true) {
            options = {};
        } else if (options == null) {
            options = {
                onComplete: function (alternatives, old_alternative, new_alternative) {
                    Wirecloud.HistoryManager.pushState(new_alternative.buildStateData());
                }
            };
        }

        var main_alts = [this.views.wiring, this.views.workspace];
        newView = this.views[newView];
        if (main_alts.indexOf(this.alternatives.visibleAlt) !== -1 && main_alts.indexOf(newView) !== -1) {
            options.effect = StyledElements.Alternatives.HORIZONTAL_SLIDE;
        } else {
            options.effect = StyledElements.Alternatives.CROSS_DISSOLVE;
        }
        this.rootKeydownHandler = null;
        this.alternatives.showAlternative(newView, options);
    };

    UserInterfaceManager.handleEscapeEvent = function handleEscapeEvent() {
        if (this.currentPopups.length > 0) {
            this.currentPopups[this.currentPopups.length - 1].hide();
        }
    };

    /**
     * @private
     * Only to be used by WindowMenu.
     */
    UserInterfaceManager._unregisterRootWindowMenu = function _unregisterRootWindowMenu(window_menu) {
        this._unregisterPopup(window_menu);
        this.currentWindowMenu = null;
        hideCover();
    };

    /**
     * @private
     * Only to be used by WindowMenu.
     */
    UserInterfaceManager._registerRootWindowMenu = function _registerRootWindowMenu(window_menu) {

        if (!(window_menu instanceof Wirecloud.ui.WindowMenu)) {
            throw new TypeError('window_menu must be a WindowMenu instance');
        }

        if (this.currentWindowMenu != null) {
            this.currentWindowMenu.hide();
            hideCover();
        }

        this.currentWindowMenu = window_menu;
        this._registerPopup(window_menu);
        showCover();
    };

    UserInterfaceManager._unregisterTooltip = function _unregisterTooltip(tooltip) {
        if (currentTooltip === tooltip) {
            currentTooltip = null;
        }
    };

    UserInterfaceManager._unregisterPopup = function _unregisterPopup(popup) {
        var index = this.currentPopups.indexOf(popup);
        if (index !== -1) {
            this.currentPopups.splice(index, 1);
        }
    };

    UserInterfaceManager._registerTooltip = function _registerTooltip(tooltip) {
        if (tooltip != null && !('hide' in tooltip)) {
            throw new TypeError('invalid tooltip parameter');
        }

        if (currentTooltip != null) {
            currentTooltip.hide();
        }
        currentTooltip = tooltip;
    };

    UserInterfaceManager._registerPopup = function _registerPopup(popup) {
        if (popup != null && !('hide' in popup)) {
            throw new TypeError('invalid popup parameter');
        }

        this._unregisterPopup(popup);
        this.currentPopups.push(popup);
    };

    UserInterfaceManager.monitorTask = function monitorTask(task) {
        var element = document.getElementById("loading-window");
        element.classList.add("in");
        element.classList.add("fade");

        if (task instanceof Wirecloud.TaskContinuation) {
            task = task.toTask();
        }
        task.addEventListener('progress', updateTaskProgress);
        task.addEventListener('fail', notifyPlatformReady);
        task.addEventListener('finish', notifyPlatformReady);
        updateTaskProgress(task, 0);
        return this;
    };

    UserInterfaceManager.onHistoryChange = function onHistoryChange(state) {
        this.changeCurrentView(state.view, {
            onComplete: function (alternatives, oldView, nextView) {
                if ('onHistoryChange' in nextView) {
                    nextView.onHistoryChange(state);
                }
            }
        });
    };

    var updateTaskProgress = function updateTaskProgress(task, progress) {
        var msg;

        msg = utils.gettext("%(task)s %(percentage)s%");
        msg = utils.interpolate(msg, {task: task.title, percentage: Math.round(progress)}, true);
        document.getElementById("loading-task-title").textContent = msg;

        var list = document.createElement('ul');
        task.subtasks.forEach(function (subtask) {
            if (subtask.type === "then") {
                if (subtask.subtasks.length === 0) {
                    return;
                }
                subtask = subtask.subtasks[0];
            }

            if (subtask.title !== "") {
                var msg = utils.interpolate(utils.gettext("%(subTask)s: %(percentage)s%"), {
                    subTask: subtask.title,
                    percentage: Math.round(subtask.progress)
                }, true);
                var li = document.createElement('li');
                li.textContent = msg;
                list.appendChild(li);
            }
        });

        document.getElementById("loading-subtask-title").innerHTML = '';
        document.getElementById("loading-subtask-title").appendChild(list);
    };

    var resizeUI = function resizeUI() {
        this.alternatives.repaint();
        // Recalculate menu positions
        if (this.currentWindowMenu) {
            this.currentWindowMenu.calculatePosition();
        }
    };

    var notifyPlatformReady = function notifyPlatformReady() {
        var loadingElement = document.getElementById("loading-window");
        if (loadingElement.classList.contains("in")) {
            loadingElement.classList.remove("in");
        } else {
            loadingElement.classList.remove("fade");
        }
    };

    var on_click = function on_click(event) {
        var loadingElement = document.getElementById("loading-window");
        if (!(loadingElement.classList.contains("in"))) {
            loadingElement.classList.remove("fade");
        }
    };

    var on_fullscreen_change = function on_fullscreen_change(event) {
        var baseelement = utils.getFullscreenElement() || document.body;
        baseelement.insertBefore(coverLayerElement, baseelement.firstChild);
    };

    Wirecloud.UserInterfaceManager = UserInterfaceManager;

})(Wirecloud.Utils);
