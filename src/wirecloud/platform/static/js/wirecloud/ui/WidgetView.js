/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (ns, se, utils) {

    "use strict";

    ns.WidgetView = class WidgetView extends se.StyledElement {

        /**
         * @name Wirecloud.UI.WidgetView
         *
         * @extends {StyledElements.StyledElement}
         * @constructor
         *
         * @param {Wirecloud.UI.WorkspaceTabView} tab
         * @param {Wirecloud.Widget} model
         * @param {Object} [options]
         */
        constructor(tab, model, options) {
            super([
                'highlight',
                'remove',
                'unhighlight'
            ]);

            options = utils.merge({
                template: Wirecloud.currentTheme.templates['wirecloud/workspace/widget']
            }, options);

            privates.set(this, {
                layout: null,
                minimized: false,
                minimized_shape: null,
                position: model.position,
                shape: model.shape,
                tab: tab
            });

            Object.defineProperties(this, {
                id: {
                    value: model.id
                },
                layout: {
                    get: function () {
                        return privates.get(this).layout;
                    },
                    set: function (new_layout) {
                        privates.get(this).layout = new_layout;
                        update.call(this);
                    }
                },
                minimized: {
                    get: function () {
                        return privates.get(this).minimized;
                    }
                },
                model: {
                    value: model
                },
                position: {
                    get: function () {
                        return utils.clone(privates.get(this).position);
                    }
                },
                shape: {
                    get: function () {
                        return utils.clone(privates.get(this)[this.minimized ? 'minimized_shape' : 'shape']);
                    }
                },
                tab: {
                    get: function () {
                        return privates.get(this).tab;
                    }
                },
                title: {
                    get: () => {
                        return this.model.title;
                    }
                },
                titlevisible: {
                    get: () => {
                        return this.model.titlevisible;
                    }
                }
            });

            this.wrapperElement = (new se.GUIBuilder()).parse(options.template, {
                'closebutton': function (options, tcomponents, view) {
                    var button = new se.Button({
                        plain: true,
                        class: 'wc-remove',
                        iconClass: 'fas fa-times',
                        title: utils.gettext("Remove")
                    });

                    view.closebutton = button;
                    button.addEventListener('click', function () {
                        view.remove();
                    });
                    return button;
                },
                'errorbutton': function (options, tcomponents, view) {
                    var button = new StyledElements.Button({
                        plain: true,
                        class: 'errorbutton',
                        iconClass: 'fas fa-exclamation-triangle'
                    });

                    button.hide().addEventListener('click', function (button) {
                        var dialog = new Wirecloud.ui.LogWindowMenu(view.model.logManager);
                        dialog.show();
                    });
                    view.errorbutton = button;
                    return button;
                },
                'grip': (options, tcomponents, view) => {
                    view.grip = new StyledElements.Button({
                        plain: true,
                        class: 'wc-grip-button',
                        iconClass: 'fa-fw fas fa-grip-vertical'
                    });
                    view.grip.addEventListener('click', (button) => {
                        button.disable().addClassName('busy');
                        view.togglePermission('move', true).finally(() => {
                            button.enable().removeClassName('busy');
                        });
                    });
                    return view.grip;
                },
                'menubutton': function (options, tcomponents, view) {
                    var button = new StyledElements.PopupButton({
                        class: 'wc-menu-button',
                        iconClass: 'fas fa-cogs',
                        plain: true,
                        title: utils.gettext("Menu")
                    });

                    view.menubutton = button;
                    button.popup_menu.append(new ns.WidgetViewMenuItems(view));
                    return button;
                },
                'minimizebutton': function (options, tcomponents, view) {
                    var button = new StyledElements.Button({
                        iconClass: 'fas fa-minus',
                        plain: true,
                        title: utils.gettext("Minimize")
                    });

                    button.enable = view.model.isAllowed('minimize');
                    button.addEventListener('click', function (button) {
                        view.toggleMinimizeStatus(true);
                    });
                    view.minimizebutton = button;
                    return button;
                },
                'title': function (options, tcomponents, view) {
                    var element = new StyledElements.EditableElement({initialContent: view.model.title});

                    element.addEventListener('change', function (element, new_title) {
                        view.model.rename(new_title);
                    });
                    view.titleelement = element;
                    return element;
                },
                'titlevisibilitybutton': (options, tcomponents, view) => {
                    var button = new StyledElements.Button({
                        plain: true,
                        class: 'wc-titlevisibility-button',
                        iconClass: 'fa-fw fas fa-eye-slash'
                    });

                    button.addEventListener('click', (button) => {
                        view.toggleTitleVisibility(true);
                    });
                    view.titlevisibilitybutton = button;
                    return button;
                },
                'bottomresizehandle': function (options, tcomponents, view) {
                    var handle = new Wirecloud.ui.WidgetViewResizeHandle(view, {resizeLeftSide: true, fixWidth: true});

                    handle.addClassName("wc-bottom-resize-handle");
                    view.bottomresizehandle = handle;
                    return handle;
                },
                'leftresizehandle': function (options, tcomponents, view) {
                    var handle = new Wirecloud.ui.WidgetViewResizeHandle(view, {resizeLeftSide: true});

                    handle.addClassName("wc-bottom-left-resize-handle");
                    view.leftresizehandle = handle;
                    return handle;
                },
                'rightresizehandle': function (options, tcomponents, view) {
                    var handle = new Wirecloud.ui.WidgetViewResizeHandle(view, {resizeLeftSide: false});

                    handle.addClassName("wc-bottom-right-resize-handle");
                    view.rightresizehandle = handle;
                    return handle;
                },
                'iframe': function (options, tcomponents, view) {
                    return view.model.wrapperElement;
                }
            }, this).children[1];

            if ('bottomresizehandle' in this) {
                this.bottomresizehandle.setResizableElement(this.wrapperElement);
            }
            if ('leftresizehandle' in this) {
                this.leftresizehandle.setResizableElement(this.wrapperElement);
            }
            if ('rightresizehandle' in this) {
                this.rightresizehandle.setResizableElement(this.wrapperElement);
            }

            this.wrapperElement.classList.add("wc-widget");
            this.wrapperElement.setAttribute('data-id', model.id);

            model.addEventListener('change', (widget, changes) => {
                if (changes.indexOf('title') !== -1) {
                    this.titleelement.setTextContent(widget.title);
                }

                if (changes.indexOf('meta') !== -1 || changes.indexOf('permissions') !== -1 || changes.indexOf('titlevisible') !== -1) {
                    update.call(this);
                }
            });

            model.addEventListener('unload', (widget) => {
                this.unhighlight();
            });

            this.heading = this.wrapperElement.getElementsByClassName('wc-widget-heading')[0];
            this.draggable = new Wirecloud.ui.WidgetViewDraggable(this);


            // TODO: review
            var layout;
            if (model.fulldragboard) {
                layout = tab.dragboard.fulldragboardLayout;
                this.previousLayout = tab.dragboard.layouts[model.layout];
                this.previousPosition = model.position;
                this.previousShape = model.shape;
            } else {
                layout = tab.dragboard.layouts[model.layout];
            }
            layout.addWidget(this, true);

            // Init minimized and title visibility options
            this.setMinimizeStatus(model.minimized, false, true);

            this.model.logManager.addEventListener('newentry', on_add_log.bind(this));

            this.wrapperElement.addEventListener('transitionend', function (e) {
                if (this.layout.iwidgetToMove == null && ['width', 'height', 'top', 'left'].indexOf(e.propertyName) !== -1) {
                    this.repaint();
                    notify_shape.call(this);
                }
            }.bind(this), true);

            model.addEventListener('load', (model) => {

                this.wrapperElement.classList.add('in');

                model.wrapperElement.contentDocument.defaultView.addEventListener('keydown', (event) => {
                    if (event.keyCode === 27) { // escape
                        Wirecloud.UserInterfaceManager.handleEscapeEvent();
                    }
                }, true);

                model.wrapperElement.contentDocument.defaultView.addEventListener('click', () => {
                    Wirecloud.UserInterfaceManager.handleEscapeEvent();
                    this.unhighlight();
                }, true);

                this.repaint();
            });

            this.tab.workspace.addEventListener('editmode', update.bind(this));
            model.addEventListener('remove', on_remove.bind(this));
            update.call(this);
        }

        /**
         * Changes minimize status of this iwidget
         *
         * @param newStatus new minimize status of the iwidget
         */
        setMinimizeStatus(newStatus, persistence, reserveSpace) {
            const priv = privates.get(this);

            // Sanitize newStatus value
            newStatus = !!newStatus;

            if (newStatus === this.minimized) {
                return this;
            }

            let oldHeight = this.shape.height;
            priv.minimized = newStatus;

            if (this.minimized) {
                this.minimizebutton.setTitle(utils.gettext("Maximize"));
                this.minimizebutton.replaceIconClassName("fa-minus", "fa-plus");
                this.wrapperElement.classList.add('wc-minimized-widget');
                this.wrapperElement.style.height = "";
                priv.minimized_shape = {
                    relheight: true,
                    height: this.layout.adaptHeight(this.wrapperElement.offsetHeight + 'px').inLU,
                    relwidth: priv.shape.relwidth,
                    width: priv.shape.width
                };
                this.model.setTitleVisibility(true, false);
            } else {
                this.minimizebutton.setTitle(utils.gettext("Minimize"));
                this.minimizebutton.replaceIconClassName("fa-plus", "fa-minus");
                this.wrapperElement.classList.remove('wc-minimized-widget');
                this.wrapperElement.style.height = this.layout.getHeightInPixels(priv.shape.height) + 'px';
                priv.minimized_shape = null;
            }

            this.model.contextManager.modify({
                'height': this.shape.height,
                'heightInPixels': this.model.wrapperElement.offsetHeight
            });

            // Notify resize event
            reserveSpace = reserveSpace != null ? reserveSpace : true;
            if (reserveSpace) {
                var persist = persistence != null ? persistence : true;
                this.layout._notifyResizeEvent(this, this.shape.width, oldHeight, this.shape.width,  this.shape.height, false, false, persist, reserveSpace);
            }

            update.call(this);
            return this;
        }

        /**
         * Toggles title visibility
         *
         * @param {Boolean} persistence save change on server
         */
        toggleTitleVisibility(persistence) {
            this.titlevisibilitybutton.disable().addClassName('busy');
            let t = this.model.setTitleVisibility(!this.titlevisible, persistence);
            t.finally(() => {this.titlevisibilitybutton.enable().removeClassName('busy');});
            return t;
        }

        /**
         * Toggles a widget permission
         *
         * @param {String} permission permission to toggle
         * @param {Boolean} persistence save change on server
         *
         * @return {Wirecloud.Task} task instance controlling the progress
         */
        togglePermission(permission, persistence) {
            let changes = {
                [permission]: !this.model.permissions.viewer[permission]
            };
            return this.model.setPermissions(changes, persistence);
        }

        setPosition(position) {
            utils.update(privates.get(this).position, position);
            if (this.layout != null) {
                update_position.call(this);
                notify_position.call(this);
            }
            return this;
        }

        setShape(shape, resizeLeftSide, resizeTopSide, persist) {
            var oldWidth = this.shape.width;
            var oldHeight = this.shape.height;

            utils.update(privates.get(this).shape, shape);

            if (this.layout == null) {
                return;
            }

            update_shape.call(this);
            notify_shape.call(this);

            // Notify resize event
            this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.shape.width, this.shape.height, resizeLeftSide, resizeTopSide, persist);
        }

        load() {

            if (!this.model.loaded) {
                this.wrapperElement.classList.add('in');
                this.model.load();
            }

            return this.repaint();
        }

        /**
         * Updates widget size and position css
         */
        repaint() {

            update_position.call(this);
            update_shape.call(this);

            notify_position.call(this);
            notify_shape.call(this);

            return this;
        }

        reload() {
            this.model.reload();
            return this;
        }

        showLogs() {
            this.model.showLogs();
            return this;
        }

        showSettings() {
            this.model.showSettings();
            return this;
        }

        highlight() {
            this.wrapperElement.classList.add('panel-success');
            this.wrapperElement.classList.remove('panel-default');
            if (!this.wrapperElement.classList.contains('wc-widget-highlight')) {
                this.wrapperElement.classList.add('wc-widget-highlight');
                this.dispatchEvent('highlight');
            } else {
                // Reset highlighting animation
                this.wrapperElement.classList.remove('wc-widget-highlight');
                setTimeout(() => {
                    this.wrapperElement.classList.add('wc-widget-highlight');
                });
            }

            return this;
        }

        unhighlight() {
            this.wrapperElement.classList.remove('panel-success');
            this.wrapperElement.classList.add('panel-default');
            if (this.wrapperElement.classList.contains('wc-widget-highlight')) {
                this.wrapperElement.classList.remove('wc-widget-highlight');
                this.dispatchEvent('unhighlight');
            }

            return this;
        }

        moveToLayout(newLayout) {
            var affectedWidgetsRemoving, affectedWidgetsAdding,
                minimizeOnFinish, previousWidth, previousHeight,
                dragboardChange, oldLayout, oldPositionPixels;

            if (this.layout === newLayout) {
                return Promise.resolve();
            }

            const priv = privates.get(this);
            minimizeOnFinish = false;
            if (this.minimized) {
                minimizeOnFinish = true;
                this.toggleMinimizeStatus();
            }

            previousWidth = this.wrapperElement.offsetWidth;
            previousHeight = this.wrapperElement.offsetHeight;

            const tabChange = priv.tab !== newLayout.dragboard.tab;
            dragboardChange = this.layout.dragboard !== newLayout.dragboard || tabChange;
            oldLayout = this.layout;

            affectedWidgetsRemoving = oldLayout.removeWidget(this, dragboardChange);

            if (oldLayout instanceof Wirecloud.ui.FullDragboardLayout) {
                this.setShape(this.previousShape);
            } else if (newLayout instanceof Wirecloud.ui.FreeLayout) {
                this.setShape({
                    relwidth: true,
                    width: newLayout.adaptWidth(previousWidth + 'px').inLU,
                    relheight: false,
                    height: newLayout.adaptHeight(previousHeight + 'px').inPixels
                });
            } else {
                this.setShape({
                    relwidth: true,
                    width: newLayout.adaptWidth(previousWidth + 'px').inLU,
                    relheight: true,
                    height: newLayout.adaptHeight(previousHeight + 'px').inLU
                });
            }

            if (dragboardChange && !(newLayout instanceof Wirecloud.ui.FreeLayout)) {
                let newposition = newLayout._searchFreeSpace(this.shape.width, this.shape.height);
                newposition.relx = true;
                newposition.rely = true;
                newposition.anchor = "top-left";
                this.setPosition(newposition);
            } else if (oldLayout instanceof Wirecloud.ui.FullDragboardLayout) {
                this.setPosition(this.previousPosition);
            } else {
                oldPositionPixels = {
                    x: oldLayout.getColumnOffset(this.position),
                    y: oldLayout.getRowOffset(this.position)
                };
                if (newLayout instanceof Wirecloud.ui.FreeLayout) {
                    this.setPosition({
                        x: newLayout.adaptColumnOffset(oldPositionPixels.x + 'px').inLU,
                        y: newLayout.adaptRowOffset(oldPositionPixels.y + 'px').inPixels,
                        relx: true,
                        rely: false,
                        anchor: "top-left"
                    });
                } else {
                    this.setPosition({
                        x: newLayout.adaptColumnOffset(oldPositionPixels.x + 'px').inLU,
                        y: newLayout.adaptRowOffset(oldPositionPixels.y + 'px').inLU,
                        relx: true,
                        rely: true,
                        anchor: "top-left"
                    });
                }
            }

            affectedWidgetsAdding = newLayout.addWidget(this, dragboardChange);
            priv.tab = newLayout.dragboard.tab;

            if (minimizeOnFinish) {
                this.toggleMinimizeStatus();
            }

            // Persist changes
            this.model.changeTab(newLayout.dragboard.tab.model).then(() => {
                affectedWidgetsAdding.add(this.id);
                if (dragboardChange) {
                    oldLayout.dragboard.update([...affectedWidgetsRemoving]);
                    newLayout.dragboard.update([...affectedWidgetsAdding]);
                } else {
                    newLayout.dragboard.update([...utils.setupdate(affectedWidgetsAdding, affectedWidgetsRemoving)]);
                }
            });
        }

        toggleMinimizeStatus(persistence) {
            this.setMinimizeStatus(!this.minimized, persistence);
        }

        setFullDragboardMode(enable) {
            if ((this.layout === this.tab.dragboard.fulldragboardLayout) === enable) {
                return this;
            }

            const dragboard = this.layout.dragboard;

            if (enable) {
                this.previousShape = this.shape;
                this.previousLayout = this.layout;
                this.previousPosition = this.position;

                this.moveToLayout(dragboard.fulldragboardLayout);
                dragboard.lowerToBottom(this);
            } else {
                this.moveToLayout(this.previousLayout);
            }
            this.model.fulldragboard = enable;

            update.call(this);
            return this;
        }

        toJSON() {
            let fulldragboard = this.layout === this.tab.dragboard.fulldragboardLayout;
            let shape = fulldragboard ? this.previousShape : this.shape;
            let position = fulldragboard ? this.previousPosition : this.position;
            return {
                id: this.id,
                tab: this.tab.id,
                layout: this.tab.dragboard.layouts.indexOf(fulldragboard ? this.previousLayout : this.layout),
                // position
                anchor: position.anchor,
                relx: position.relx,
                rely: position.rely,
                top: position.y,
                left: position.x,
                zIndex: position.z,
                // shape
                minimized: this.minimized,
                relwidth: shape.relwidth,
                width: shape.width,
                relheight: shape.relheight,
                height: privates.get(this).shape.height,
                fulldragboard: fulldragboard,
                titlevisible: this.titlevisible
            };
        }

        persist() {
            if (!this.model.volatile) {
                this.model.setPosition(this.position);
                this.model.setShape(privates.get(this).shape);
            }

            return this;
        }

        remove() {
            this.model.remove();
            return this;
        }

    }

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var update_buttons = function update_buttons() {
        let editing = this.tab.workspace.editing;
        let role = editing ? "editor" : "viewer";
        if (this.grip) {
            let editable = editing && !this.model.volatile && this.layout instanceof Wirecloud.ui.FreeLayout && (this.draggable == null || this.draggable.canDrag(null, {widget: this}, 'editor'));
            let moveable = this.draggable != null && this.draggable.canDrag(null, {widget: this}, 'viewer');
            this.grip.enabled = editable;
            this.grip.hidden = !editable && !(moveable && this.layout instanceof Wirecloud.ui.FreeLayout);
            this.grip.icon.classList.toggle("fa-anchor", !moveable);
            this.grip.icon.classList.toggle("fa-grip-vertical", moveable);
            this.grip.setTitle(moveable ? utils.gettext("Disallow to move this widget") : utils.gettext("Allow to move this widget"));
        }

        if (this.titlevisibilitybutton) {
            this.titlevisibilitybutton.hidden = !editing;
            this.titlevisibilitybutton.enabled = (!this.model.volatile && !this.minimized && editing);
            this.titlevisibilitybutton.setTitle(this.model.titlevisible ? utils.gettext("Hide title") : utils.gettext("Show title"));
            if (this.model.titlevisible) {
                this.titlevisibilitybutton.replaceIconClassName("fa-eye-slash", "fa-eye");
            } else {
                this.titlevisibilitybutton.replaceIconClassName("fa-eye", "fa-eye-slash");
            }
        }
        this.closebutton.hidden = !(this.model.volatile || editing) || !this.model.isAllowed('close', role);
        this.menubutton.hidden = !editing;

        this.bottomresizehandle.enabled = (this.model.volatile || editing) && this.model.isAllowed('resize', role);
        this.leftresizehandle.enabled = (this.model.volatile || editing) && this.model.isAllowed('resize', role);
        this.rightresizehandle.enabled = (this.model.volatile || editing) && this.model.isAllowed('resize', role);
    };

    var update_className = function update_className() {
        this.wrapperElement.classList.toggle('wc-missing-widget', this.model.missing);
        this.wrapperElement.classList.toggle('wc-floating-widget', this.layout != null && this.layout instanceof Wirecloud.ui.FreeLayout);
        this.wrapperElement.classList.toggle('wc-moveable-widget', this.draggable != null && this.draggable.canDrag(null, {widget: this}));
        this.wrapperElement.classList.toggle('wc-titled-widget', this.model.titlevisible);
    };

    var update = function update() {
        update_className.call(this);
        update_buttons.call(this);
    };

    var update_position = function update_position() {
        this.layout.updatePosition(this, this.wrapperElement);
        this.wrapperElement.style.zIndex = this.position.z + 1;
    };

    var update_shape = function update_shape() {
        this.layout.updateShape(this, this.wrapperElement);
    };

    var notify_position = function notify_position() {
        this.model.contextManager.modify({
            'xPosition': this.position.x,
            'yPosition': this.position.y,
            'zPosition': this.position.z
        });
    };

    var notify_shape = function notify_shape() {
        this.model.contextManager.modify({
            'height': this.shape.height,
            'width': this.shape.width,
            'heightInPixels': this.model.wrapperElement.offsetHeight,
            'widthInPixels': this.model.wrapperElement.offsetWidth
        });
    };

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    var on_add_log = function on_add_log() {
        var label, errorCount = this.model.logManager.errorCount;
        this.errorbutton.hidden = errorCount === 0;

        label = utils.ngettext("%(errorCount)s error", "%(errorCount)s errors", errorCount);
        label = utils.interpolate(label, {errorCount: errorCount}, true);
        this.errorbutton.setTitle(label);
    };

    var on_remove = function on_remove() {
        this.dispatchEvent('remove');
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
