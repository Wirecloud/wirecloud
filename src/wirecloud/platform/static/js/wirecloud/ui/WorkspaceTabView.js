/*
 *     Copyright (c) 2016-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2020 Future Internet Consulting and Development Solutions S.L.
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

    ns.WorkspaceTabView = class WorkspaceTabView extends se.Tab {

        constructor(id, notebook, options) {
            var model = options.model,
                workspace = options.workspace;

            super(id, notebook, {
                closable: false,
                name: model.title
            });

            var priv = {
                widgets: [],
                on_changetab: on_changetab.bind(this),
                on_addwidget: on_addwidget.bind(this),
                on_removetab: on_removetab.bind(this),
                on_removewidget: on_removewidget.bind(this)
            };
            privates.set(this, priv);

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
                        return priv.widgets.slice(0);
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

            if (this.workspace.model.isAllowed("edit")) {
                this.prefbutton = new se.PopupButton({
                    title: utils.gettext("Preferences"),
                    class: 'icon-tab-menu',
                    iconClass: 'fa fa-caret-up',
                    plain: true,
                    menuOptions: {
                        position: ['top-left', 'top-right']
                    }
                });
                this.prefbutton.popup_menu.append(new ns.WorkspaceTabViewMenuItems(this));
                this.prefbutton.insertInto(this.tabElement);
                this.workspace.addEventListener('editmode', update_pref_button.bind(this));
                update_pref_button.call(this);
            }

            this.dragboard = new ns.WorkspaceTabViewDragboard(this);

            this.initialMessage = (new se.GUIBuilder()).parse(Wirecloud.currentTheme.templates['wirecloud/workspace/empty_tab_message'], {
                button: this.workspace.buildAddWidgetButton.bind(this.workspace),
                tutorials: Wirecloud.TutorialCatalogue.buildTutorialReferences(['basic-concepts'])
            }).children[1];
            this.appendChild(this.initialMessage);

            this.model.preferences.addEventListener('post-commit', on_change_preferences.bind(this));
            this.model.widgets.forEach(_create_widget, this);
            this.initialMessage.hidden = !this.workspace.model.isAllowed("edit") || this.widgets.length > 0;

            this.model.addEventListener('change', priv.on_changetab);
            this.model.addEventListener('addwidget', priv.on_addwidget);
            this.model.addEventListener('remove', priv.on_removetab);
            this.model.addEventListener('removewidget', priv.on_removewidget);
        }

        /**
         * @param {Wirecloud.WidgetMeta} resource
         * @param {Object} [options]
         *
         * @returns {Promise} A promise that returns a {Widget} instance if
         * resolved, or an Error if rejected.
         */
        createWidget(resource, options) {
            var layout, position;

            options = utils.merge({
                commit: true,
                height: resource.default_height,
                layout: this.model.preferences.get('initiallayout') === "Free" ? 1 : 0,
                width: resource.default_width,
                anchor: 'top-left',
                relx: true,
                rely: false,
                relwidth: true,
                relheight: false
            }, options);

            var layouts = [
                this.dragboard.baseLayout,
                this.dragboard.freeLayout,
                this.dragboard.leftLayout,
                this.dragboard.rightLayout
            ];
            layout = layouts[options.layout];

            if (options.left != null) {
                if (layout !== this.dragboard.freeLayout || options.relx) {
                    options.left = layout.adaptColumnOffset(options.left).inLU;
                } else {
                    options.left = layout.adaptColumnOffset(options.left).inPixels;
                }
            }
            if (options.top != null) {
                if (layout !== this.dragboard.freeLayout || options.rely) {
                    options.top = layout.adaptRowOffset(options.top).inLU;
                } else {
                    options.top = layout.adaptRowOffset(options.top).inPixels;
                }
            }
            if (layout !== this.dragboard.freeLayout || options.relheight) {
                options.height = clean_number(layout.adaptHeight(options.height).inLU, 1);
            } else {
                options.height = clean_number(layout.adaptHeight(options.height).inPixels, 1);
            }
            if (layout !== this.dragboard.freeLayout || options.relwidth) {
                options.width = clean_number(layout.adaptWidth(options.width).inLU, 1, layout.columns);
            } else {
                options.width = clean_number(layout.adaptWidth(options.width).inPixels, 1);
            }

            if (options.left == null || options.top == null) {
                if (options.refposition && "searchBestPosition" in layout) {
                    layout.searchBestPosition(options);
                } else if ("_searchFreeSpace" in layout) {
                    position = layout._searchFreeSpace(options.width, options.height);
                    options.left = position.x;
                    options.top = position.y;
                } else {
                    options.left = 0;
                    options.top = 0;
                }
            }

            if (!options.commit) {
                return this.findWidget(this.model.createWidget(resource, options).id);
            }

            return this.model.createWidget(resource, options).then(
                (model) => {
                    return Promise.resolve(this.findWidget(model.id));
                }
            );
        }

        /**
         * Highlights this tab
         */
        highlight() {
            this.tabElement.classList.add("highlight");
            return this;
        }

        /**
         * @param {String} id
         *
         * @returns {*}
         */
        findWidget(id) {
            return this.widgetsById[id];
        }

        repaint() {
            this.dragboard.paint();
            this.dragboard._notifyWindowResizeEvent();
            return this;
        }

        show() {
            se.Tab.prototype.show.call(this);

            if (this.workspace.editing) {
                this.dragboard.leftLayout.active = true;
                this.dragboard.rightLayout.active = true;
            }

            privates.get(this).widgets.forEach(function (widget) {
                widget.load();
            });

            return this.repaint();
        }

        showSettings() {
            (new Wirecloud.ui.PreferencesWindowMenu('tab', this.model.preferences)).show();
            return this;
        }

        unhighlight() {
            this.tabElement.classList.remove("highlight");
            return this;
        }

    }

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var _create_widget = function _create_widget(model) {
        var widget = new Wirecloud.ui.WidgetView(this, model);

        privates.get(this).widgets.push(widget);

        return widget;
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

    var on_addwidget = function on_addwidget(tab, model, view) {
        const priv = privates.get(this);

        if (view == null) {
            view = _create_widget.call(this, model);

            if (!this.hidden) {
                view.load();
            }
        } else {
            priv.widgets.push(view);
        }
        this.initialMessage.hidden = true;
    };

    var on_removetab = function on_removetab(model) {
        se.Tab.prototype.close.call(this);
    };

    var on_removewidget = function on_removewidget(widget) {
        const priv = privates.get(this);
        priv.widgets.splice(priv.widgets.indexOf(widget), 1);
        this.initialMessage.hidden = !this.workspace.model.isAllowed("edit") || priv.widgets.length > 0;
    };

    var update_pref_button = function update_pref_button() {
        this.prefbutton.enabled = this.workspace.editing;
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
