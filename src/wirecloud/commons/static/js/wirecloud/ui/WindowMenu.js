/*global BrowserUtilsFactory, CSSPrimitiveValue, Draggable, Element, isElement, LayoutManagerFactory, Wirecloud*/

(function () {

    "use strict";

    var builder = new StyledElements.GUIBuilder();

    /**
     * Make Draggable.
     */
    var makeDraggable = function makeDraggable(handler) {
        this.draggable = new Draggable(handler, {window_menu: this},
            function onStart(draggable, context) {
                var position;
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

    var WindowMenu = function WindowMenu(title, extra_class) {

        var ui_fragment, i, element;

        // Allow hierarchy
        if (arguments.length === 0) {
            return;
        }

        this.childWindow = null;
        this._closeListener = this._closeListener.bind(this);

        ui_fragment = builder.parse(Wirecloud.currentTheme.templates['window_menu'], {
            'title': function (options) {
                this.titleElement = document.createElement('h3');
                return this.titleElement;
            }.bind(this),
            'body': function (options) {
                this.windowContent = document.createElement('div');
                if (options && typeof options['class'] === 'string') {
                    this.windowContent.className = options['class'];
                }
                return this.windowContent;
            }.bind(this),
            'footer': function (options) {
                this.windowBottom = document.createElement('div');
                if (options && typeof options['class'] === 'string') {
                    this.windowBottom.className = options['class'];
                }
                return this.windowBottom;
            }.bind(this)
        });

        for (i = 0; i < ui_fragment.elements.length; i += 1) {
            element = ui_fragment.elements[i];
            if (isElement(element)) {
                this.htmlElement = element;
                break;
            }
        }
        this.htmlElement.classList.add('window_menu');
        if (extra_class != null) {
            this.htmlElement.classList.add(extra_class);
        }

        // Initial title
        this.setTitle(title);

        // Make draggable
        makeDraggable.call(this, this.titleElement);
    };

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
        this.titleElement.setTextContent(title);
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
     * Updates the message displayed by this <code>WindowMenu</code>
     */
    WindowMenu.prototype.setMsg = function setMsg(msg) {
        this.msgElement.setTextContent(msg);

        if (isElement(this.htmlElement.parentNode)) {
            this.calculatePosition();
        }
    };

    /**
     * @private
     *
     * Calculates a usable absolute position for the window
     */
    WindowMenu.prototype.calculatePosition = function calculatePosition() {
        var coordenates = [];

        var windowHeight = BrowserUtilsFactory.getInstance().getHeight();
        var windowWidth = BrowserUtilsFactory.getInstance().getWidth();

        this.htmlElement.setStyle({'max-height' : ''});
        this.htmlElement.setStyle({'max-width' : ''});
        var menuWidth = this.htmlElement.getWidth();

        if (menuWidth > windowWidth) {
            menuWidth = windowWidth;
            this.htmlElement.setStyle({
                'max-width': menuWidth + 'px'
            });
        }
        var menuHeight = this.htmlElement.getHeight();

        coordenates[1] = (windowHeight - menuHeight) / 2;
        coordenates[0] = (windowWidth - menuWidth) / 2;

        if (windowHeight < menuHeight) {
            var windowStyle = document.defaultView.getComputedStyle(this.htmlElement, null);

            var padding;
            padding = windowStyle.getPropertyCSSValue("padding-top").getFloatValue(CSSPrimitiveValue.CSS_PX);
            padding += windowStyle.getPropertyCSSValue("padding-bottom").getFloatValue(CSSPrimitiveValue.CSS_PX);

            this.htmlElement.setStyle({
                'max-height': windowHeight - padding + 'px',
                'top': '0px'
            });
        } else {
            this.htmlElement.style.top = coordenates[1] + "px";
        }
        this.htmlElement.style.left = coordenates[0] + "px";

        if (this.childWindow != null) {
            this.childWindow.calculatePosition();
        }
    };

    /**
     * Makes this WindowMenu visible.
     *
     * @param parentWindow
     */
    WindowMenu.prototype.show = function show(parentWindow) {
        this._parentWindowMenu = parentWindow;

        if (this._parentWindowMenu != null) {
            this._parentWindowMenu._addChildWindow(this);
        } else {
            LayoutManagerFactory.getInstance()._showWindowMenu(this);
        }

        document.body.appendChild(this.htmlElement);
        this.calculatePosition();
        this.htmlElement.style.display = "block";
        this.setFocus();
    };

    /**
     * Makes this WindowMenu hidden.
     */
    WindowMenu.prototype.hide = function hide() {

        if (!isElement(this.htmlElement.parentNode)) {
            // This windowmenu is currently hidden => Nothing to do
            return;
        }

        this.htmlElement.parentNode.removeChild(this.htmlElement);
        if (this.msgElement != null) {
            this.msgElement.update();
        }
        if (this.childWindow != null) {
            this.childWindow.hide();
        }

        if (this._parentWindowMenu != null) {
            this._parentWindowMenu._removeChildWindow(this);
            this._parentWindowMenu = null;
        } else {
            LayoutManagerFactory.getInstance().hideCover();
        }
    };

    WindowMenu.prototype._addChildWindow = function _addChildWindow(windowMenu) {
        if (windowMenu !== this) {
            this.childWindow = windowMenu;
        } else {
            throw new TypeError('Window menus cannot be its own child');
        }
    };

    WindowMenu.prototype._removeChildWindow = function _removeChildWindow(windowMenu) {
        if (this.childWindow === windowMenu) {
            this.childWindow = null;
        }
    };

    WindowMenu.prototype.setFocus = function setFocus() {
    };

    WindowMenu.prototype.destroy = function destroy() {
        this.hide();

        this._closeListener = null;
    };

    Wirecloud.ui.WindowMenu = WindowMenu;

})();
