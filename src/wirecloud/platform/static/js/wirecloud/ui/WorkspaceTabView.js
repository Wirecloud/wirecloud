/*
 *     Copyright (c) 2016-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    ns.WorkspaceTabView = function WorkspaceTabView(id, notebook, options) {
        var model = options.model,
            workspace = options.workspace;

        se.Tab.call(this, id, notebook, {
            closable: false,
            name: model.title
        });

        privates.set(this, {
            widgets: [],
            on_changetab: on_changetab.bind(this),
            on_createwidget: on_createwidget.bind(this),
            on_removetab: on_removetab.bind(this),
            on_removewidget: on_removewidget.bind(this)
        });

        Object.defineProperties(this, {
            /**
             * @memberOf Wirecloud.ui.WorkspaceTabView#
             * @type {String}
             */
            id: {
                value: model.id
            },
            /**
             * @memberOf Wirecloud.ui.WorkspaceTabView#
             * @type {Wirecloud.LogManager}
             */
            logManager: {
                value: new Wirecloud.LogManager(Wirecloud.GlobalLogManager)
            },
            /**
             * @memberOf Wirecloud.ui.WorkspaceTabView#
             * @type {Wirecloud.WorkspaceTab}
             */
            model: {
                value: model
            },
            /**
             * @memberOf Wirecloud.ui.WorkspaceTabView#
             * @type {String}
             */
            name: {
                get: function () {
                    return this.model.name;
                }
            },
            /**
             * @memberOf Wirecloud.ui.WorkspaceTabView#
             * @type {String}
             */
            title: {
                get: function () {
                    return this.model.title;
                }
            },
            /**
             * @memberOf Wirecloud.ui.WorkspaceTabView#
             * @type {Array.<Wirecloud.ui.WidgetView>}
             */
            widgets: {
                get: function () {
                    return privates.get(this).widgets.slice(0);
                }
            },
            /**
             * @memberOf Wirecloud.ui.WorkspaceTabView#
             * @type {Object.<String, Wirecloud.ui.WidgetView>}
             */
            widgetsById: {
                get: function () {
                    return get_widgets_by_id.call(this);
                }
            },
            /**
             * @memberOf Wirecloud.ui.WorkspaceTabView#
             * @type {Wirecloud.ui.WorkspaceView}
             */
            workspace: {
                value: workspace
            }
        });

        this.tabElement.classList.add("wc-workspace-tab");
        this.tabElement.setAttribute('data-id', this.id);
        this.tabElement.setAttribute('data-name', this.name);

        this.wrapperElement.classList.add("wc-workspace-tab-content");
        this.wrapperElement.setAttribute('data-id', this.id);

        if (!this.workspace.model.restricted) {
            var button = new se.PopupButton({
                title: utils.gettext("Preferences"),
                class: 'icon-tab-menu',
                plain: true,
                menuOptions: {
                    position: ['top-left', 'top-right']
                }
            });
            button.popup_menu.append(new ns.WorkspaceTabViewMenuItems(this));
            button.insertInto(this.tabElement);
        }

        this.dragboard = new ns.WorkspaceTabViewDragboard(this);

        this.initialMessage = (new se.GUIBuilder()).parse(Wirecloud.currentTheme.templates['wirecloud/workspace/empty_tab_message'], {
            button: this.workspace.buildAddWidgetButton.bind(this.workspace),
            tutorials: Wirecloud.TutorialCatalogue.buildTutorialReferences(['basic-concepts'])
        }).children[1];
        this.appendChild(this.initialMessage);

        this.model.preferences.addEventListener('pre-commit', on_change_preferences.bind(this));
        this.model.widgets.forEach(_create_widget, this);

        this.model.addEventListener('change', privates.get(this).on_changetab);
        this.model.addEventListener('createwidget', privates.get(this).on_createwidget);
        this.model.addEventListener('remove', privates.get(this).on_removetab);
        this.model.addEventListener('removewidget', privates.get(this).on_removewidget);
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.WorkspaceTabView, se.Tab, /** @lends Wirecloud.WorkspaceTabView.prototype */{

        /**
         * @param {Wirecloud.WidgetMeta} resource
         * @param {Object} [options]
         *
         * @returns {Promise} A promise that returns a {Widget} instance if
         * resolved, or an Error if rejected.
         */
        createWidget: function createWidget(resource, options) {
            var layout, position;

            options = utils.merge({
                commit: true,
                height: resource.default_height,
                layout: this.model.preferences.get('initiallayout') === "Free" ? 1 : 0,
                width: resource.default_width
            }, options);

            layout = options.layout === 1 ? this.dragboard.freeLayout : this.dragboard.baseLayout;

            options.left = options.left != null ? layout.adaptColumnOffset(options.left).inLU : undefined;
            options.top = options.top != null ? layout.adaptRowOffset(options.top).inLU : undefined;
            options.height = clean_number(layout.adaptHeight(options.height).inLU, 0, layout.rows);
            options.width = clean_number(layout.adaptWidth(options.width).inLU, 0, layout.columns);

            if (options.left == null || options.top == null) {
                if ("_searchFreeSpace" in layout) {
                    position = layout._searchFreeSpace(options.width, options.height);
                    options.left = position.x;
                    options.top = position.y;
                } else {
                    options.left = "0";
                    options.top = "0";
                }
            }

            if (!options.commit) {
                return this.findWidget(this.model.createWidget(resource, options).id);
            }

            return new Promise(function (resolve, reject) {

                this.model.createWidget(resource, options).then(function (model) {
                    resolve(this.findWidget(model.id));
                }.bind(this), function (reason) {
                    reject(reason);
                });
            }.bind(this));
        },

        /**
         * @param {String} id
         *
         * @returns {*}
         */
        findWidget: function findWidget(id) {
            return this.widgetsById[id];
        },

        /**
         * @returns {Promise}
         */
        remove: function remove() {

            if (privates.get(this).widgets.length) {
                var dialog = new Wirecloud.ui.AlertWindowMenu();

                dialog.setMsg(utils.gettext("The tab's widgets will also be removed. Would you like to continue?"));
                dialog.setHandler(function () {
                    _remove.call(this);
                }.bind(this));
                dialog.show();
            } else {
                _remove.call(this);
            }

            return this;
        },

        /**
         * Renames this tab
         *
         * @param {String} name
         *
         * @returns {Promise}
         */
        rename: function rename(name) {
            return this.model.rename(name).catch((reason) => {
                this.logManager.log(reason);
                return Promise.reject(reason);
            });
        },

        repaint: function repaint() {
            this.dragboard.paint();
            this.dragboard._notifyWindowResizeEvent();
            return this;
        },

        /**
         * @returns {Promise}
         */
        setInitial: function setInitial() {
            return this.model.setInitial();
        },

        show: function show() {
            se.Tab.prototype.show.call(this);

            this.widgets.forEach(function (widget) {
                widget.load();
            });

            return this.repaint();
        },

        showSettings: function showSettings() {
            (new Wirecloud.ui.PreferencesWindowMenu('tab', this.model.preferences)).show();
            return this;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var _create_widget = function _create_widget(model) {
        var widget = new Wirecloud.ui.WidgetView(this, model);

        privates.get(this).widgets.push(widget);

        this.initialMessage.hidden = this.widgets.length > 0;

        return widget;
    };

    var _remove = function _remove() {
        this.model.remove();
    };

    var clean_number = function clean_number(value, min, max) {

        if (typeof value !== 'number' || value < min) {
            return min;
        }

        return value > max ? max : value;
    };

    var get_widgets_by_id = function get_widgets_by_id() {
        var widgets = {};

        privates.get(this).widgets.forEach(function (widget) {
            widgets[widget.id] = widget;
        });

        return widgets;
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_change_preferences = function on_change_preferences(preferences, modifiedValues) {
        if ('baselayout' in modifiedValues) {
            this.dragboard._updateBaseLayout();
        }
    };

    var on_changetab = function on_changetab(tab, changes) {
        if (changes.indexOf('title') !== -1) {
            se.Tab.prototype.rename.call(this, tab.title);
        }

        if (changes.indexOf('name') !== -1 && !this.hidden) {
            this.tabElement.setAttribute('data-name', this.name);
            var currentState = Wirecloud.HistoryManager.getCurrentState();
            var newState = utils.merge({}, currentState, {
                tab: tab.name
            });
            Wirecloud.HistoryManager.replaceState(newState);
        }
    };

    var on_createwidget = function on_createwidget(tab, model) {
        var widget = _create_widget.call(this, model);

        if (!this.hidden) {
            widget.load();
        }
    };

    var on_removetab = function on_removetab(model) {
        se.Tab.prototype.close.call(this);
    };

    var on_removewidget = function on_removewidget(widget) {
        privates.get(this).widgets.splice(privates.get(this).widgets.indexOf(widget), 1);
        this.initialMessage.hidden = this.widgets.length > 0;
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
