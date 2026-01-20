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

    const privates = new WeakMap();

    const _create_widget = function _create_widget(model) {
        const widget = new Wirecloud.ui.WidgetView(this, model);

        privates.get(this).widgets.push(widget);

        return widget;
    };

    const clean_number = function clean_number(value, min, max) {

        if (typeof value !== 'number' || value < min) {
            return min;
        }

        return value > max ? max : value;
    };

    const get_widgets_by_id = function get_widgets_by_id() {
        const widgets = {};

        privates.get(this).widgets.forEach(function (widget) {
            widgets[widget.id] = widget;
        });

        return widgets;
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    const on_change_preferences = function on_change_preferences(preferences, modifiedValues) {
        if ('screenSizes' in modifiedValues) {
            this.dragboard._updateScreenSizes();
        }

        if ('baselayout' in modifiedValues) {
            this.dragboard._updateBaseLayout();
        }
    };

    const on_changetab = function on_changetab(tab, changes) {
        if (changes.indexOf('title') !== -1) {
            se.Tab.prototype.rename.call(this, tab.title);
        }

        if (changes.indexOf('name') !== -1 && !this.hidden) {
            this.tabElement.setAttribute('data-name', this.name);
            const currentState = Wirecloud.HistoryManager.getCurrentState();
            const newState = utils.merge({}, currentState, {
                tab: tab.name
            });
            Wirecloud.HistoryManager.replaceState(newState);
        }
    };

    const on_addwidget = function on_addwidget(tab, model, view) {
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

    const on_removetab = function on_removetab(model) {
        se.Tab.prototype.close.call(this);
    };

    const on_removewidget = function on_removewidget(widget) {
        const priv = privates.get(this);
        priv.widgets.splice(priv.widgets.indexOf(widget), 1);
        this.initialMessage.hidden = !this.workspace.model.isAllowed("edit") || priv.widgets.length > 0;
    };

    const update_pref_button = function update_pref_button() {
        this.prefbutton.enabled = this.workspace.editing;
    };

    const get_editing_interval_name = function get_editing_interval_name(width) {
        const screenSizes = this.model.preferences.get('screenSizes');
        let editingIntervalName = null;
        for (let i = 0; i < screenSizes.length; i++) {
            if (screenSizes[i].moreOrEqual <= width && (screenSizes[i].lessOrEqual === -1 || screenSizes[i].lessOrEqual >= width)) {
                editingIntervalName = screenSizes[i].name;
                break;
            }
        }

        return editingIntervalName;
    }

    const on_windowresize = function on_windowresize() {
        if (this.dragboard.customWidth === -1) {
            this.dragboard.updateWidgetScreenSize(window.innerWidth);

            if (this.workspace.activeTab === this) {
                this.editingIntervalName = get_editing_interval_name.call(this, window.innerWidth);
                this.workspace.updateEditingInterval(this.getEditingIntervalElement());
            }
        }
    };

    ns.WorkspaceTabView = class WorkspaceTabView extends se.Tab {

        constructor(id, notebook, options) {
            const model = options.model,
                workspace = options.workspace;

            super(id, notebook, {
                closable: false,
                name: model.title
            });

            const priv = {
                widgets: [],
                on_changetab: on_changetab.bind(this),
                on_addwidget: on_addwidget.bind(this),
                on_removetab: on_removetab.bind(this),
                on_removewidget: on_removewidget.bind(this),
                on_windowresize: on_windowresize.bind(this)
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
            this.updateEditingIntervalName();

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
            window.addEventListener('resize', priv.on_windowresize.bind(this));
        }

        /**
         * @param {Wirecloud.WidgetMeta} resource
         * @param {Object} [options]
         *
         * @returns {Promise} A promise that returns a {Widget} instance if
         * resolved, or an Error if rejected.
         */
        createWidget(resource, options) {
            const layoutConfigs = utils.clone(this.model.preferences.get('screenSizes'), true);

            options = utils.merge({
                commit: true,
                layout: this.model.preferences.get('initiallayout') === "Free" ? 1 : 0
            }, options);

            layoutConfigs.forEach((layoutConfig) => {
                Wirecloud.Utils.merge(layoutConfig, {
                    width: ('width' in options) ? options.width : resource.default_width,
                    anchor: ('anchor' in options) ? options.anchor : 'top-left',
                    relx: ('relx' in options) ? options.relx : true,
                    rely: ('rely' in options) ? options.rely : false,
                    relwidth: ('relwidth' in options) ? options.relwidth : true,
                    relheight: ('relheight' in options) ? options.relheight : false,
                    titlevisible: ('titlevisible' in options) ? options.titlevisible : true,
                    height: ('height' in options) ? options.height : resource.default_height
                });

                let avgScreenSize = layoutConfig.lessOrEqual + (layoutConfig.moreOrEqual - layoutConfig.lessOrEqual) / 2;
                if (layoutConfig.lessOrEqual === -1) {
                    avgScreenSize = layoutConfig.moreOrEqual;
                }

                if (layoutConfig.length === 0) {
                    avgScreenSize = window.innerWidth;
                }

                if (window.innerWidth >= layoutConfig.moreOrEqual && (layoutConfig.lessOrEqual === -1 || window.innerWidth <= layoutConfig.lessOrEqual)) {
                    avgScreenSize = window.innerWidth;
                }

                const layouts = [
                    this.dragboard.baseLayout,
                    this.dragboard.freeLayout,
                    this.dragboard.leftLayout,
                    this.dragboard.rightLayout
                ];
                const layout = layouts[options.layout];

                if (layoutConfig.left != null) {
                    if (layout !== this.dragboard.freeLayout || layoutConfig.relx) {
                        layoutConfig.left = layout.adaptColumnOffset(layoutConfig.left, avgScreenSize).inLU;
                    } else {
                        layoutConfig.left = layout.adaptColumnOffset(layoutConfig.left, avgScreenSize).inPixels;
                    }
                }
                if (layoutConfig.top != null) {
                    if (layout !== this.dragboard.freeLayout || layoutConfig.rely) {
                        layoutConfig.top = layout.adaptRowOffset(layoutConfig.top).inLU;
                    } else {
                        layoutConfig.top = layout.adaptRowOffset(layoutConfig.top).inPixels;
                    }
                }
                if (layout !== this.dragboard.freeLayout || layoutConfig.relheight) {
                    layoutConfig.height = clean_number(layout.adaptHeight(layoutConfig.height).inLU, 1);
                } else {
                    layoutConfig.height = clean_number(layout.adaptHeight(layoutConfig.height).inPixels, 1);
                }
                if (layout !== this.dragboard.freeLayout || layoutConfig.relwidth) {
                    layoutConfig.width = clean_number(layout.adaptWidth(layoutConfig.width, avgScreenSize).inLU, 1, layout.columns);
                } else {
                    layoutConfig.width = clean_number(layout.adaptWidth(layoutConfig.width, avgScreenSize).inPixels, 1);
                }

                if (layoutConfig.left == null || layoutConfig.top == null) {
                    if (options.refposition && "searchBestPosition" in layout) {
                        layout.searchBestPosition(options, layoutConfig, avgScreenSize);
                    } else if ("_searchFreeSpace2" in layout) {
                        const matrix = Wirecloud.Utils.getLayoutMatrix(layout, layout.dragboard.widgets, avgScreenSize);
                        const position = layout._searchFreeSpace2(layoutConfig.width, layoutConfig.height, matrix);
                        layoutConfig.left = position.x;
                        layoutConfig.top = position.y;
                    } else {
                        layoutConfig.left = 0;
                        layoutConfig.top = 0;
                    }
                }
            });

            options.layoutConfigurations = layoutConfigs;

            if (!options.commit) {
                return this.findWidget(this.model.createWidget(resource, options).id);
            }

            return this.model.createWidget(resource, options).then(
                (model) => {
                    return Promise.resolve(this.findWidget(model.id));
                }
            );
        }

        getEditingIntervalElement() {
            let text = "";
            if (this.dragboard.customWidth !== -1) {
                text = utils.interpolate(utils.gettext("(Overriden) Editing for screen size %(name)s"), {name: this.editingIntervalName});
            } else {
                text = utils.interpolate(utils.gettext("Editing for screen size %(name)s"), {name: this.editingIntervalName});
            }

            const div = document.createElement('div');
            const span = document.createElement('span');
            span.textContent = text;
            div.appendChild(span);

            if (this.dragboard.customWidth !== -1) {
                const a = document.createElement('a');
                a.className = 'far fa-times-circle wc-editing-interval-close';
                a.href = '#';
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.quitEditingInterval();
                });
                div.appendChild(a);
            }

            return div;
        }

        setEditingInterval(moreOrEqual, lessOrEqual, name) {
            let avgScreenSize = Math.floor((moreOrEqual + lessOrEqual) / 2);
            if (lessOrEqual === -1) {
                avgScreenSize = moreOrEqual;
            }
            this.dragboard.setCustomDragboardWidth(avgScreenSize);
            this.editingIntervalName = name;
            this.workspace.updateEditingInterval(this.getEditingIntervalElement());
        }

        quitEditingInterval() {
            this.dragboard.restoreDragboardWidth();
            this.editingIntervalName = get_editing_interval_name.call(this, window.innerWidth);
            this.workspace.updateEditingInterval(this.getEditingIntervalElement());
        }

        updateEditingIntervalName() {
            this.editingIntervalName = get_editing_interval_name.call(this, (this.dragboard.customWidth === -1) ? window.innerWidth : this.dragboard.customWidth);
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
            super.show(this);

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

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
