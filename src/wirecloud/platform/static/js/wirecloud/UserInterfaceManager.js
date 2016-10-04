/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


(function (utils) {

    "use strict";

    var UserInterfaceManager = {
        rootKeydownHandler: null,
        currentWindowMenu: null,
        currentPopups: []
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
        this.mainLayout = new StyledElements.VerticalLayout();
        this.mainLayout.north.appendChild(document.getElementById('wirecloud_header'));

        this.alternatives = new StyledElements.Alternatives({class: 'wc-body'});
        this.mainLayout.center.appendChild(this.alternatives);
        this.mainLayout.insertInto(document.body);

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

        var plain_content = document.querySelector('.plain_content');
        if (plain_content != null) {
            this.views.initial.appendChild(plain_content);
        }

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

    UserInterfaceManager.createTask = function createTask(task, subtasks) {
        var monitor = new Wirecloud.TaskMonitorModel(task, subtasks);
        var element = document.getElementById("loading-window");
        element.classList.add("in");
        element.classList.add("fade");

        monitor.addEventListener('progress', updateTaskProgress);
        monitor.addEventListener('fail', notifyPlatformReady);
        updateTaskProgress(monitor, 0);
        return monitor;
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

    var updateTaskProgress = function updateTaskProgress(monitor, progress) {
        var msg;

        msg = gettext("%(task)s %(percentage)s%");
        msg = interpolate(msg, {task: monitor.title, percentage: Math.round(progress)}, true);
        document.getElementById("loading-task-title").textContent = msg;

        if (monitor.subtasks.length === 0) {
            msg = '';
        } else if (monitor.subtasks[monitor.currentsubtask].title != "") {
            msg = gettext("%(subTask)s: %(percentage)s%");
            msg = interpolate(msg, {
                subTask: monitor.subtasks[monitor.currentsubtask].title,
                percentage: Math.round(monitor.subtasks[monitor.currentsubtask].progress)
            }, true);
        } else {
            msg = "%(percentage)s";
            msg = interpolate(msg, {
                percentage: Math.round(monitor.subtasks[monitor.currentsubtask].progress)
            }, true);
        }

        document.getElementById("loading-subtask-title").textContent = msg;

        if (progress === 100) {
            notifyPlatformReady();
        }
    };

    var resizeUI = function resizeUI() {
        this.mainLayout.repaint();

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
