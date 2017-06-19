/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
    ns.WidgetView = function WidgetView(tab, model, options) {
        se.StyledElement.call(this, [
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
                    update_className.call(this);
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
                get: function () {
                    return this.model.title;
                }
            }
        });

        this.wrapperElement = (new se.GUIBuilder()).parse(options.template, {
            'closebutton': function (options, tcomponents, view) {
                var button = new se.Button({
                    plain: true,
                    class: 'wc-remove fa fa-remove',
                    title: utils.gettext("Remove")
                });

                button.setDisabled(!view.model.isAllowed('close'));
                button.addEventListener('click', function () {
                    view.remove();
                });
                return button;
            },
            'errorbutton': function (options, tcomponents, view) {
                var button = new StyledElements.Button({
                    plain: true,
                    class: 'errorbutton fa fa-warning'
                });

                button.addEventListener('click', function (button) {
                    var dialog = new Wirecloud.ui.LogWindowMenu(view.model.logManager);
                    dialog.show();
                });
                button.disable();
                view.errorbutton = button;
                return button;
            },
            'menubutton': function (options, tcomponents, view) {
                var button = new StyledElements.PopupButton({
                    class: 'wc-menu-button fa fa-cogs',
                    plain: true,
                    title: utils.gettext("Menu")
                });

                button.popup_menu.append(new ns.WidgetViewMenuItems(view));
                return button;
            },
            'minimizebutton': function (options, tcomponents, view) {
                var button = new StyledElements.Button({
                    class: 'fa fa-minus',
                    plain: true,
                    title: utils.gettext("Minimize")
                });

                button.setDisabled(!view.model.isAllowed('minimize'));
                button.addEventListener('click', function (button) {
                    view.toggleMinimizeStatus(true);
                });
                view.minimizebutton = button;
                return button;
            },
            'title': function (options, tcomponents, view) {
                var element = new StyledElements.EditableElement({initialContent: view.model.title});

                element.addEventListener('change', function (element, new_title) {
                    view.rename(new_title);
                });
                view.titleelement = element;
                return element;
            },
            'bottomresizehandle': function (options, tcomponents, view) {
                var handle = new Wirecloud.ui.WidgetViewResizeHandle(view, {resizeLeftSide: true, fixWidth: true});

                handle.addClassName("wc-bottom-resize-handle");
                handle.setDisabled(!view.model.isAllowed('resize'));
                view.bottomresizehandle = handle;
                return handle;
            },
            'leftresizehandle': function (options, tcomponents, view) {
                var handle = new Wirecloud.ui.WidgetViewResizeHandle(view, {resizeLeftSide: true});

                handle.addClassName("wc-bottom-left-resize-handle");
                handle.setDisabled(!view.model.isAllowed('resize'));
                view.leftresizehandle = handle;
                return handle;
            },
            'rightresizehandle': function (options, tcomponents, view) {
                var handle = new Wirecloud.ui.WidgetViewResizeHandle(view, {resizeLeftSide: false});

                handle.addClassName("wc-bottom-right-resize-handle");
                handle.setDisabled(!view.model.isAllowed('resize'));
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

        model.addEventListener('change', function (widget, changes) {
            if (changes.indexOf('title') !== -1) {
                this.titleelement.setTextContent(widget.title);
            }

            if (changes.indexOf('meta') !== -1) {
                update_className.call(this);
            }
        }.bind(this));

        model.addEventListener('unload', function (widget) {
            this.unhighlight();
        }.bind(this));

        this.heading = this.wrapperElement.getElementsByClassName('wc-widget-heading')[0];

        // TODO: review
        var layout = model.layout === 0 ? tab.dragboard.baseLayout : tab.dragboard.freeLayout;
        layout.addWidget(this, true);

        this.setMinimizeStatus(model.minimized, false, true);

        // Mark as draggable
        this.draggable = new Wirecloud.ui.WidgetViewDraggable(this);

        update_className.call(this);
        this.model.logManager.addEventListener('newentry', on_add_log.bind(this));

        this.wrapperElement.addEventListener('transitionend', function (e) {
            if (this.layout.iwidgetToMove == null && ['width', 'height', 'top', 'left'].indexOf(e.propertyName) !== -1) {
                this.repaint();
                notify_shape.call(this);
            }
        }.bind(this), true);

        model.addEventListener('load', function (model) {

            this.wrapperElement.classList.add('in');

            model.wrapperElement.contentDocument.defaultView.addEventListener('keydown', function (event) {
                if (event.keyCode === 27) { // escape
                    Wirecloud.UserInterfaceManager.handleEscapeEvent();
                }
            }, true);

            model.wrapperElement.contentDocument.defaultView.addEventListener('click', function () {
                Wirecloud.UserInterfaceManager.handleEscapeEvent();
                this.unhighlight();
            }.bind(this), true);

            this.repaint();
        }.bind(this));

        model.addEventListener('remove', on_remove.bind(this));
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.WidgetView, se.StyledElement, {

        /**
         * Changes minimize status of this iwidget
         *
         * @param newStatus new minimize status of the iwidget
         */
        setMinimizeStatus: function setMinimizeStatus(newStatus, persistence, reserveSpace) {
            var oldHeight = this.shape.height;

            if (newStatus === this.minimized) {
                return this;
            }

            privates.get(this).minimized = newStatus;

            if (this.minimized) {
                this.minimizebutton.setTitle(utils.gettext("Maximize"));
                this.minimizebutton.replaceClassName("fa-minus", "fa-plus");
                this.wrapperElement.classList.add('wc-minimized-widget');
                this.wrapperElement.style.height = "";
                privates.get(this).minimized_shape = {
                    height: this.layout.adaptHeight(this.wrapperElement.offsetHeight + 'px').inLU,
                    width: privates.get(this).shape.width
                };
            } else {
                this.minimizebutton.setTitle(utils.gettext("Minimize"));
                this.minimizebutton.replaceClassName("fa-plus", "fa-minus");
                this.wrapperElement.classList.remove('wc-minimized-widget');
                this.wrapperElement.style.height = this.layout.getHeightInPixels(privates.get(this).shape.height) + 'px';
                privates.get(this).minimized_shape = null;
            }

            this.model.contextManager.modify({
                'height': this.shape.height,
                'heightInPixels': this.model.wrapperElement.offsetHeight
            });

            // Notify resize event
            reserveSpace = reserveSpace != null ? reserveSpace : true;
            if (reserveSpace) {
                var persist = persistence != null ? persistence : true;
                this.layout._notifyResizeEvent(this, this.shape.width, oldHeight, this.shape.width,  this.shape.height, false, persist, reserveSpace);
            }

            return this;
        },

        setPosition: function setPosition(position) {
            utils.update(privates.get(this).position, position);
            if (this.layout != null) {
                update_position.call(this);
                notify_position.call(this);
            }
        },

        setShape: function setShape(shape, resizeLeftSide, persist) {
            var oldWidth = this.shape.width;
            var oldHeight = this.shape.height;

            utils.update(privates.get(this).shape, shape);

            if (this.layout == null) {
                return;
            }

            update_shape.call(this);
            notify_shape.call(this);

            // Notify resize event
            this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.shape.width, this.shape.height, resizeLeftSide, persist);
        },

        load: function load() {

            if (!this.model.loaded) {
                this.wrapperElement.classList.add('in');
                this.model.load();
            }

            return this.repaint();
        },

        /**
         * Updates widget size and position css
         */
        repaint: function repaint() {

            update_position.call(this);
            update_shape.call(this);

            notify_position.call(this);
            notify_shape.call(this);

            return this;
        },

        reload: function reload() {
            this.model.reload();
            return this;
        },

        showLogs: function showLogs() {
            this.model.showLogs();
            return this;
        },

        showSettings: function showSettings() {
            this.model.showSettings();
            return this;
        },

        highlight: function highlight() {
            this.wrapperElement.classList.add('panel-success');
            this.wrapperElement.classList.remove('panel-default');
            if (!this.wrapperElement.classList.contains('wc-widget-highlight')) {
                this.wrapperElement.classList.add('wc-widget-highlight');
                this.dispatchEvent('highlight');
            } else {
                // Reset highlighting animation
                this.wrapperElement.classList.remove('wc-widget-highlight');
                setTimeout(function () {
                    this.wrapperElement.classList.add('wc-widget-highlight');
                }.bind(this));
            }
        },

        unhighlight: function unhighlight() {
            this.wrapperElement.classList.remove('panel-success');
            this.wrapperElement.classList.add('panel-default');
            if (this.wrapperElement.classList.contains('wc-widget-highlight')) {
                this.wrapperElement.classList.remove('wc-widget-highlight');
                this.dispatchEvent('unhighlight');
            }
        },

        moveToLayout: function moveToLayout(newLayout) {
            var affectedWidgetsRemoving, affectedWidgetsAdding,
                minimizeOnFinish, p, previousWidth, previousHeight,
                dragboardChange, oldLayout, oldPositionPixels;

            if (this.layout === newLayout) {
                return;
            }

            minimizeOnFinish = false;
            if (this.minimized) {
                minimizeOnFinish = true;
                this.toggleMinimizeStatus();
            }

            previousWidth = this.wrapperElement.offsetWidth;
            previousHeight = this.wrapperElement.offsetHeight;

            dragboardChange = this.layout.dragboard !== newLayout.dragboard || privates.get(this).tab !== newLayout.dragboard.tab;
            oldLayout = this.layout;

            affectedWidgetsRemoving = oldLayout.removeWidget(this, dragboardChange);

            if (oldLayout instanceof Wirecloud.ui.FullDragboardLayout) {
                this.setShape(this.previousShape);
            } else {
                this.setShape({
                    width: newLayout.adaptWidth(previousWidth + 'px').inLU,
                    height: newLayout.adaptHeight(previousHeight + 'px').inLU
                });
            }

            if (dragboardChange && !(newLayout instanceof Wirecloud.ui.FreeLayout)) {
                this.setPosition(newLayout._searchFreeSpace(this.shape.width, this.shape.height));
            } else if (oldLayout instanceof Wirecloud.ui.FullDragboardLayout) {
                this.setPosition(this.previousPosition);
            } else {
                oldPositionPixels = {
                    x: oldLayout.getColumnOffset(this.position.x) - oldLayout.dragboardLeftMargin,
                    y: oldLayout.getRowOffset(this.position.y) - oldLayout.dragboardTopMargin
                };
                this.setPosition({
                    x: newLayout.adaptColumnOffset(oldPositionPixels.x + 'px').inLU,
                    y: newLayout.adaptRowOffset(oldPositionPixels.y + 'px').inLU
                });
            }

            affectedWidgetsAdding = newLayout.addWidget(this, dragboardChange);
            privates.get(this).tab = newLayout.dragboard.tab;

            if (minimizeOnFinish) {
                this.toggleMinimizeStatus();
            }

            // if the widget hasn't been taken to another tab and
            // the movement affects the rest of widgets
            p = this.update();
            if (dragboardChange && (affectedWidgetsRemoving || affectedWidgetsAdding)) {
                if (affectedWidgetsRemoving) {
                    p.then(function () {
                        return oldLayout.dragboard.update();
                    });
                }
                if (affectedWidgetsAdding) {
                    p.then(function () {
                        return newLayout.dragboard.update();
                    });
                }
            }
        },

        toggleMinimizeStatus: function toggleMinimizeStatus(persistence) {
            this.setMinimizeStatus(!this.minimized, persistence);
        },

        setFullDragboardMode: function setFullDragboardMode(enable) {
            if ((this.layout === this.tab.dragboard.fulldragboardLayout) === enable) {
                return;
            }

            var dragboard = this.layout.dragboard;

            if (enable) {
                this.previousShape = this.shape;
                this.previousLayout = this.layout;
                this.previousPosition = this.position;

                this.moveToLayout(dragboard.fulldragboardLayout);
                dragboard.raiseToTop(this);
            } else {
                this.moveToLayout(this.previousLayout);
            }
        },

        toggleLayout: function toggleLayout() {
            if (this.layout === this.tab.dragboard.freeLayout) {
                this.moveToLayout(this.layout.dragboard.baseLayout);
            } else {
                this.moveToLayout(this.layout.dragboard.freeLayout);
            }
        },

        update: function update() {
            return this.model.changeTab(this.tab.model);
        },

        toJSON: function toJSON() {
            var data = {
                id: this.id,
                tab: this.tab.id,
                layout: this.layout === this.tab.dragboard.freeLayout ? 1 : 0
            };

            if (!this.tab.workspace.restricted) {
                data.minimized = this.minimized;
            }

            if (this.layout !== this.tab.dragboard.fulldragboardLayout) {
                data.top = this.position.y;
                data.left = this.position.x;
                data.zIndex = this.position.z;
                data.width = this.shape.width;
                data.height = privates.get(this).shape.height;
                data.fulldragboard = false;
            } else {
                data.fulldragboard = true;
            }

            return data;
        },

        persist: function persist() {
            if (!this.model.volatile) {
                this.model.setPosition(this.position);
                this.model.setShape(privates.get(this).shape);
            }

            return this;
        },

        remove: function remove() {
            this.model.remove();
            return this;
        },

        rename: function rename(title) {
            this.model.rename(title);
            return this;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var update_className = function update_className() {
        if (this.model.missing) {
            this.wrapperElement.classList.add('wc-missing-widget');
        } else {
            this.wrapperElement.classList.remove('wc-missing-widget');
        }

        if (this.layout != null && this.layout instanceof Wirecloud.ui.FreeLayout) {
            this.wrapperElement.classList.add('wc-floating-widget');
        } else {
            this.wrapperElement.classList.remove('wc-floating-widget');
        }
    };

    var update_position = function update_position() {
        this.wrapperElement.style.left = this.layout.getColumnOffset(this.position.x) + "px";
        this.wrapperElement.style.top = this.layout.getRowOffset(this.position.y) + "px";
        this.wrapperElement.style.zIndex = this.position.z + 1;
    };

    var update_shape = function update_shape() {
        this.wrapperElement.style.width = this.layout.getWidthInPixels(this.shape.width) + 'px';
        this.wrapperElement.style.height = this.minimized ? "" : this.layout.getHeightInPixels(this.shape.height) + 'px';
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
        this.errorbutton.setDisabled(errorCount === 0);

        label = utils.ngettext("%(errorCount)s error", "%(errorCount)s errors", errorCount);
        label = utils.interpolate(label, {errorCount: errorCount}, true);
        this.errorbutton.setTitle(label);
    };

    var on_remove = function on_remove() {
        this.dispatchEvent('remove');
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
