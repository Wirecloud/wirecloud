/*
 *     Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2019-2020 Future Internet Consulting and Development Solutions S.L.
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


(function (se, utils) {

    "use strict";

    // Internal variables
    var coverLayerElement = null;
    var currentWindowMenu = null;
    const currentPopups = [];
    var currentTooltip = null;
    var alternatives = null;

    // Public interface
    var UserInterfaceManager = {
        rootKeydownHandler: null,
        workspaceviews: {}
    };
    Object.defineProperties(UserInterfaceManager, {
        currentTooltip: {get: () => {return currentTooltip;}},
        currentWindowMenu: {get: () => {return currentWindowMenu;}}
    });

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
        document.addEventListener('keydown', on_keydown, false);

        // TODO refactor
        if (document.querySelector('.plain_content') != null) {
            if ('WirecloudHeader' in Wirecloud.ui) {
                this.header = new Wirecloud.ui.WirecloudHeader(this);
            }
            return;
        }
        alternatives = new StyledElements.Alternatives({class: 'wc-body'});
        alternatives.appendTo(document.querySelector("#wc-body"));

        /* TODO| FIXME */
        if ('WirecloudHeader' in Wirecloud.ui) {
            this.header = new Wirecloud.ui.WirecloudHeader(this);
            alternatives.addEventListener('preTransition', function (alternatives, old_alternative, new_alternative) {
                this.header._notifyViewChange();
            }.bind(this));
            alternatives.addEventListener('postTransition', function (alternatives, old_alternative, new_alternative) {
                this.header._notifyViewChange(new_alternative);
            }.bind(this));
        }

        this.views = {
            'initial': alternatives.createAlternative(),
            'workspace': alternatives.createAlternative({'alternative_constructor': Wirecloud.ui.WorkspaceView}),
            'wiring': alternatives.createAlternative({'alternative_constructor': Wirecloud.ui.WiringEditor}),
            'marketplace': alternatives.createAlternative({'alternative_constructor': Wirecloud.ui.MarketplaceView})
        };

        Wirecloud.addEventListener('contextloaded', () => {
            this.views.myresources = alternatives.createAlternative({alternative_constructor: Wirecloud.ui.MyResourcesView});
        });

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

            if (state.tab == null) {
                state.tab = this.notebook.visibleTab.model.name;
            }
            if (state.tab_id == null) {
                state.tab_id = this.notebook.visibleTab.model.id;
            }
            if (state.workspace_title !== this.model.title) {
                state.workspace_title = this.model.title;
            }
            Wirecloud.HistoryManager.replaceState(state);
            Wirecloud.UserInterfaceManager.header.refresh();

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
        utils.onFullscreenChange(document.body, on_fullscreen_change);
        window.addEventListener("resize", resizeUI, true);
        document.addEventListener("click", on_click.bind(this), true);
    };

    UserInterfaceManager.terminate = function terminate() {
        if (coverLayerElement == null) {
            return;
        }

        // Remove some event listeners
        utils.removeFullscreenChangeCallback(document.body, on_fullscreen_change);
        window.removeEventListener("resize", resizeUI, true);
        document.removeEventListener("click", on_click.bind(this), true);

        // Clear manager status
        if (currentWindowMenu != null) {
            currentWindowMenu.hide();
            hideCover();
            currentWindowMenu = null;
        }

        currentPopups.forEach((popup) => {
            popup.hide();
        });
        currentPopups.length = 0;

        if (currentTooltip != null) {
            currentTooltip.hide();
            currentTooltip = null;
        }

        coverLayerElement.remove();
        coverLayerElement = null;

        alternatives.remove();
        alternatives = null;

        this.header = null;

        return this;
    };

    UserInterfaceManager.changeCurrentView = function changeCurrentView(newView, options) {

        newView = this.views[newView];
        if (newView == null) {
            throw new TypeError('invalid newView value');
        }

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
        if (main_alts.indexOf(alternatives.visibleAlt) !== -1 && main_alts.indexOf(newView) !== -1) {
            options.effect = StyledElements.Alternatives.HORIZONTAL_SLIDE;
        } else {
            options.effect = StyledElements.Alternatives.CROSS_DISSOLVE;
        }
        this.rootKeydownHandler = null;
        return alternatives.showAlternative(newView, options);
    };

    UserInterfaceManager.handleEscapeEvent = function handleEscapeEvent() {
        if (currentTooltip != null) {
            currentTooltip.hide();
            currentTooltip = null;
        } else if (currentPopups.length > 0) {
            // Popup hide method will call _unregisterPopup
            currentPopups[currentPopups.length - 1].hide();
        }
    };

    /**
     * @private
     *
     * Only meant to be used by {Wirecloud.ui.WindowMenu}
     */
    UserInterfaceManager._unregisterRootWindowMenu = function _unregisterRootWindowMenu(window_menu) {
        if (currentWindowMenu === window_menu) {
            this._unregisterPopup(window_menu);
            currentWindowMenu = null;
            hideCover();
        }

        return this;
    };

    /**
     * @private
     *
     * Only meant to be used by {Wirecloud.ui.WindowMenu}
     */
    UserInterfaceManager._registerRootWindowMenu = function _registerRootWindowMenu(window_menu) {
        if (!(window_menu instanceof Wirecloud.ui.WindowMenu)) {
            throw new TypeError('window_menu must be a WindowMenu instance');
        }

        if (currentWindowMenu != null) {
            currentWindowMenu.hide();
            hideCover();
        }

        currentWindowMenu = window_menu;
        showCover();
        return this._registerPopup(window_menu);
    };

    UserInterfaceManager._unregisterTooltip = function _unregisterTooltip(tooltip) {
        if (currentTooltip === tooltip) {
            currentTooltip = null;
        }

        return this;
    };

    UserInterfaceManager._unregisterPopup = function _unregisterPopup(popup) {
        var index = currentPopups.indexOf(popup);
        if (index !== -1) {
            currentPopups.splice(index, 1);
        }

        return this;
    };

    UserInterfaceManager._registerTooltip = function _registerTooltip(tooltip) {
        if (tooltip == null || !('hide' in tooltip)) {
            throw new TypeError('invalid tooltip parameter');
        }

        if (currentTooltip != null) {
            currentTooltip.hide();
        }
        currentTooltip = tooltip;

        return this;
    };

    UserInterfaceManager._registerPopup = function _registerPopup(popup) {
        if (popup == null || !('hide' in popup)) {
            throw new TypeError('invalid popup parameter');
        }

        this._unregisterPopup(popup);
        currentPopups.push(popup);
        return this;
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
        this.changeCurrentView(state.view, true).then((info) => {
            let nextView = info.in;
            if ('onHistoryChange' in nextView) {
                nextView.onHistoryChange(state);
            }
        });
    };

    const on_keydown = function (event) {
        var modifiers, key, consumed;

        modifiers = {
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey
        };
        key = utils.normalizeKey(event);

        // if there are not modals, check if the current view can consume this keydown event
        if (currentWindowMenu == null) {
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
        alternatives.repaint();
        // Recalculate menu positions
        currentPopups.forEach((popup) => {
            popup.repaint();
        });

        if (currentTooltip != null) {
            currentTooltip.repaint();
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

})(StyledElements, Wirecloud.Utils);
