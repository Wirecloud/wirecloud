/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020-2021 Future Internet Consulting and Development Solutions S.L.
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

    const builder = new StyledElements.GUIBuilder();

    const privates = new WeakMap();

    const addChildWindow = function addChildWindow(parent, child) {
        const priv_parent = privates.get(parent);
        const priv_child = privates.get(child);

        if (priv_parent.child != null) {
            throw new TypeError('Parent modal already has a child modal');
        }

        // Add relationships
        priv_parent.child = child;
        priv_child.parent = parent;
    };

    const removeChildWindow = function removeChildWindow(parent, child) {
        const priv_parent = privates.get(parent);
        const priv_child = privates.get(child);

        // Remove relationships
        priv_parent.child = null;
        priv_child.parent = null;
    };

    const makeDraggable = function makeDraggable(handler) {
        this.draggable = new Wirecloud.ui.Draggable(handler, {window_menu: this},
            function onStart(draggable, context) {
                context.y = context.window_menu.htmlElement.style.top === "" ? 0 : parseInt(context.window_menu.htmlElement.style.top, 10);
                context.x = context.window_menu.htmlElement.style.left === "" ? 0 : parseInt(context.window_menu.htmlElement.style.left, 10);
            },
            function onDrag(e, draggable, context, xDelta, yDelta) {
                context.window_menu.setPosition({posX: context.x + xDelta, posY: context.y + yDelta});
            },
            function onFinish(draggable, context) {
                const position = context.window_menu.getStylePosition();
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

    const insert = function insert() {
        const baseelement = utils.getFullscreenElement() || document.body;
        baseelement.appendChild(this.htmlElement);

        this.repaint();
    }

    ns.WindowMenu = class WindowMenu extends se.ObjectWithEvents {

        constructor(title, extra_class, events) {
            try {
                events = [...events];
            } catch (e) {
                events = [];
            }
            if (!events.includes("show")) {
                events.push("show");
            }
            if (!events.includes("hide")) {
                events.push("hide");
            }
            super(events);

            privates.set(this, {
                parent: null,
                child: null,
                insert: insert.bind(this)
            });

            this._closeListener = this._closeListener.bind(this);

            const ui_fragment = builder.parse(Wirecloud.currentTheme.templates['wirecloud/modals/base'], {
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
                    const button = new StyledElements.Button({
                        plain: true,
                        class: 'fa-remove',
                        iconClass: 'fas fa-times',
                        title: utils.gettext("Close")
                    });
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

            for (let i = 0; i < ui_fragment.elements.length; i += 1) {
                const element = ui_fragment.elements[i];
                if (element instanceof Element) {
                    this.htmlElement = element;
                    element.remove();
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
        }

        /**
         * set position.
         */
        setPosition(coordinates) {
            this.htmlElement.style.left = coordinates.posX + 'px';
            this.htmlElement.style.top = coordinates.posY + 'px';

            return this;
        }

        /**
         * get style position.
         */
        getStylePosition() {
            return {
                posX: parseInt(this.htmlElement.style.left, 10),
                posY: parseInt(this.htmlElement.style.top, 10)
            };
        }

        setTitle(title) {
            this.titleElement.textContent = title;
        }

        /**
         * Click Listener for the close button.
         *
         * @private
         */
        _closeListener(e) {
            this.hide();
        }

        /**
         * Calculates a usable absolute position for the window
         */
        repaint() {

            if (this.htmlElement.parentNode == null) {
                return this;
            }

            const priv = privates.get(this);
            const coordenates = [];
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;

            this.htmlElement.style.maxHeight = '';
            this.htmlElement.style.maxWidth = '';
            this.windowContent.style.maxHeight = '';
            let menuWidth = this.htmlElement.offsetWidth;

            if (menuWidth > windowWidth) {
                menuWidth = windowWidth;
                this.htmlElement.style.maxWidth = menuWidth + 'px';
            }
            const menuHeight = this.htmlElement.offsetHeight;

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
                priv.child.repaint();
            }

            return this;
        }

        /**
         * Makes this WindowMenu visible.
         *
         * @param parentWindow
         */
        show(parentWindow) {
            const priv = privates.get(this);

            if (this.htmlElement.parentElement != null) {
                parentWindow = parentWindow || null;
                if (priv.parent !== parentWindow) {
                    throw new TypeError("This window menu is already displayed and configured in a different way.");
                }
                return this;
            }

            if (parentWindow != null) {
                addChildWindow(parentWindow, this);
                Wirecloud.UserInterfaceManager._registerPopup(this);
            } else {
                Wirecloud.UserInterfaceManager._registerRootWindowMenu(this);
            }

            priv.insert();
            utils.onFullscreenChange(document.body, priv.insert);

            this.htmlElement.style.display = "block";
            this.setFocus();

            this.dispatchEvent("show");

            return this;
        }

        /**
         * Makes this WindowMenu hidden.
         */
        hide() {
            const priv = privates.get(this);

            if (this.htmlElement.parentElement == null) {
                // This windowmenu is currently hidden => Nothing to do
                return this;
            }

            this.htmlElement.parentNode.removeChild(this.htmlElement);
            if (this.msgElement != null) {
                this.msgElement.textContent = '';
            }

            // Remove fullscreen listener
            utils.removeFullscreenChangeCallback(document.body, priv.insert);
            if (priv.child != null) {
                priv.child.hide();
            }

            if (priv.parent != null) {
                removeChildWindow(priv.parent, this);
                Wirecloud.UserInterfaceManager._unregisterPopup(this);
            } else {
                Wirecloud.UserInterfaceManager._unregisterRootWindowMenu(this);
            }

            this.dispatchEvent("hide");

            return this;
        }

        setFocus() {
            return this;
        }

        destroy() {
            this.hide();

            this._closeListener = null;
        }

    }

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
