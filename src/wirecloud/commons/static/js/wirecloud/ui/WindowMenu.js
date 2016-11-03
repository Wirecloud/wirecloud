/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var builder = new StyledElements.GUIBuilder();

    var WindowMenu = function WindowMenu(title, extra_class, events) {

        var ui_fragment, i, element;

        privates.set(this, {
            parent: null,
            child: null,
            insert: insert.bind(this)
        });

        StyledElements.ObjectWithEvents.call(this, events || []);
        this._closeListener = this._closeListener.bind(this);

        ui_fragment = builder.parse(Wirecloud.currentTheme.templates['wirecloud/modals/base'], {
            'title': function (options) {
                this.titleElement = document.createElement('h3');
                return this.titleElement;
            }.bind(this),
            'body': function (options) {
                this.windowContent = document.createElement('div');
                if (options && typeof options.class === 'string') {
                    this.windowContent.className = options.class;
                }
                return this.windowContent;
            }.bind(this),
            'closebutton': function (options) {
                var button = new StyledElements.Button({plain: true, class: 'fa fa-remove', title: utils.gettext("Close")});
                button.addEventListener('click', this._closeListener);
                return button;
            }.bind(this),
            'footer': function (options) {
                this.windowBottom = document.createElement('div');
                if (options && typeof options.class === 'string') {
                    this.windowBottom.className = options.class;
                }
                return this.windowBottom;
            }.bind(this)
        });

        for (i = 0; i < ui_fragment.elements.length; i += 1) {
            element = ui_fragment.elements[i];
            if (element instanceof Element) {
                this.htmlElement = element;
                break;
            }
        }
        this.htmlElement.classList.add('window_menu');
        if (extra_class != null) {
            this.htmlElement.classList.add(extra_class);
        }
        this.windowHeader = this.htmlElement.querySelector('.window_top');

        // Initial title
        this.setTitle(title);

        // Make draggable
        makeDraggable.call(this, this.titleElement);
    };
    WindowMenu.prototype = new StyledElements.ObjectWithEvents();

    /**
     * set position.
     */
    WindowMenu.prototype.setPosition = function setPosition(coordinates) {
        this.htmlElement.style.left = coordinates.posX + 'px';
        this.htmlElement.style.top = coordinates.posY + 'px';
    };

    /**
     * get style position.
     */
    WindowMenu.prototype.getStylePosition = function getStylePosition() {
        return {
            posX: parseInt(this.htmlElement.style.left, 10),
            posY: parseInt(this.htmlElement.style.top, 10)
        };
    };

    WindowMenu.prototype.setTitle = function setTitle(title) {
        this.titleElement.textContent = title;
    };

    /**
     * @private
     *
     * Click Listener for the close button.
     */
    WindowMenu.prototype._closeListener = function _closeListener(e) {
        this.hide();
    };

    /**
     * @private
     *
     * Calculates a usable absolute position for the window
     */
    WindowMenu.prototype.calculatePosition = function calculatePosition() {

        if (this.htmlElement.parentNode == null) {
            return;
        }

        var priv = privates.get(this);
        var coordenates = [];
        var windowHeight = window.innerHeight;
        var windowWidth = window.innerWidth;

        this.htmlElement.style.maxHeight = '';
        this.htmlElement.style.maxWidth = '';
        this.windowContent.style.maxHeight = '';
        var menuWidth = this.htmlElement.offsetWidth;

        if (menuWidth > windowWidth) {
            menuWidth = windowWidth;
            this.htmlElement.style.maxWidth = menuWidth + 'px';
        }
        var menuHeight = this.htmlElement.offsetHeight;

        coordenates[1] = (windowHeight - menuHeight) / 2;
        coordenates[0] = (windowWidth - menuWidth) / 2;

        if (windowHeight < menuHeight) {
            this.htmlElement.style.maxHeight = windowHeight + 'px';
            this.htmlElement.style.top = '0px';
            this.windowContent.style.maxHeight = (windowHeight - this.windowHeader.offsetHeight - this.windowBottom.offsetHeight) + 'px';
        } else {
            this.htmlElement.style.top = coordenates[1] + "px";
        }
        this.htmlElement.style.left = coordenates[0] + "px";

        if (priv.child != null) {
            priv.child.calculatePosition();
        }
    };

    /**
     * Makes this WindowMenu visible.
     *
     * @param parentWindow
     */
    WindowMenu.prototype.show = function show(parentWindow) {
        if (parentWindow != null) {
            addChildWindow(parentWindow, this);
            Wirecloud.UserInterfaceManager._registerPopup(this);
        } else {
            Wirecloud.UserInterfaceManager._registerRootWindowMenu(this);
        }

        var priv = privates.get(this);
        priv.insert();
        utils.onFullscreenChange(document.body, priv.insert);

        this.htmlElement.style.display = "block";
        this.setFocus();
    };

    /**
     * Makes this WindowMenu hidden.
     */
    WindowMenu.prototype.hide = function hide() {

        var priv = privates.get(this);

        if (this.htmlElement.parentElement == null) {
            // This windowmenu is currently hidden => Nothing to do
            return;
        }

        this.htmlElement.parentNode.removeChild(this.htmlElement);
        if (this.msgElement != null) {
            this.msgElement.textContent = '';
        }

        // Remove fullscreen listener
        utils.removeFullscreenChangeCallback(document.body, priv.insert);
        if (this.child != null) {
            this.child.hide();
        }

        if (priv.parent != null) {
            removeChildWindow(priv.parent, this);
            Wirecloud.UserInterfaceManager._unregisterPopup(this);
        } else {
            Wirecloud.UserInterfaceManager._unregisterRootWindowMenu(this);
        }
    };

    var addChildWindow = function addChildWindow(parent, child) {

        var priv_parent = privates.get(parent);
        var priv_child = privates.get(child);

        if (priv_parent.child != null) {
            throw new TypeError('Parent modal already has a child modal');
        } else if (priv_child.parent != null) {
            throw new TypeError('Modal already has a parent modal');
        }

        // Check child is not an ancestor
        if (parent === child) {
            throw new TypeError('Modals cannot descend themselves');
        }

        var currentmodal = priv_parent.parent;
        while (currentmodal != null) {
            if (currentmodal === child) {
                throw new TypeError('Modals cannot descend themselves');
            }
            currentmodal = privates.get(currentmodal).parent;
        }

        // Add relationships
        priv_parent.child = child;
        priv_child.parent = parent;
    };

    var removeChildWindow = function removeChildWindow(parent, child) {
        var priv_parent = privates.get(parent);
        if (priv_parent.child === child) {
            var priv_child = privates.get(child);

            // Remove relationships
            priv_parent.child = null;
            priv_child.parent = null;
        }
    };

    WindowMenu.prototype.setFocus = function setFocus() {
    };

    WindowMenu.prototype.destroy = function destroy() {
        this.hide();

        this._closeListener = null;
    };

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var privates = new WeakMap();

    var makeDraggable = function makeDraggable(handler) {
        this.draggable = new Wirecloud.ui.Draggable(handler, {window_menu: this},
            function onStart(draggable, context) {
                context.y = context.window_menu.htmlElement.style.top === "" ? 0 : parseInt(context.window_menu.htmlElement.style.top, 10);
                context.x = context.window_menu.htmlElement.style.left === "" ? 0 : parseInt(context.window_menu.htmlElement.style.left, 10);
            },
            function onDrag(e, draggable, context, xDelta, yDelta) {
                context.window_menu.setPosition({posX: context.x + xDelta, posY: context.y + yDelta});
            },
            function onFinish(draggable, context) {
                var position = context.window_menu.getStylePosition();
                if (position.posX < 0) {
                    position.posX = 8;
                }
                if (position.posY < 0) {
                    position.posY = 8;
                }
                context.window_menu.setPosition(position);
            },
            function () { return true; }
        );
    };

    var insert = function insert() {
        var baseelement = utils.getFullscreenElement() || document.body;
        baseelement.appendChild(this.htmlElement);

        this.calculatePosition();
    };

    Wirecloud.ui.WindowMenu = WindowMenu;

})(Wirecloud.Utils);
