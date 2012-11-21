/*
*     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */

/**
 * Base class for managing window menus whose HTML code is in templates/index.html.
 */

function WindowMenu(title, extra_class) {
    // Allow hierarchy
    if (arguments.length == 0)
        return;

    this.childWindow = null;
    this.htmlElement = document.createElement('div');  // create the root HTML element
    Element.extend(this.htmlElement);
    this.htmlElement.className = "window_menu";
    if (extra_class != null) {
        this.htmlElement.addClassName(extra_class);
    }

    // Window Top
    var windowTop = document.createElement('div');
    windowTop.className = "window_top";
    this.htmlElement.appendChild(windowTop);

    this._closeListener = this._closeListener.bind(this);
    this.closeButton = new StyledElements.StyledButton({
        'class': "closebutton",
        'plain': true
    });
    this.closeButton.insertInto(windowTop);
    this.closeButton.addEventListener("click", this._closeListener);

    this.titleElement = document.createElement('div');
    Element.extend(this.titleElement);
    this.titleElement.className = "window_title";
    windowTop.appendChild(this.titleElement);

    var clearer = document.createElement('div');
    Element.extend(clearer);
    clearer.addClassName("floatclearer");
    windowTop.appendChild(clearer);

    // Window Content
    this.windowContent = document.createElement('div');
    Element.extend(this.windowContent);
    this.windowContent.className = "window_content";
    this.htmlElement.appendChild(this.windowContent);

    this.iconElement = document.createElement('div');
    Element.extend(this.iconElement);
    this.iconElement.className = "window-icon icon-size";
    this.windowContent.appendChild(this.iconElement);

    this.msgElement = document.createElement('div');
    Element.extend(this.msgElement);
    this.msgElement.className = "msg";
    this.windowContent.appendChild(this.msgElement);

    // Window Bottom
    this.windowBottom = document.createElement('div');
    Element.extend(this.windowBottom);
    this.windowBottom.className = "window_bottom";
    this.htmlElement.appendChild(this.windowBottom);

    // Initial title
    this.setTitle(title);
}


WindowMenu.prototype.setTitle = function setTitle(title) {
    this.titleElement.setTextContent(title);
};

/**
 * @private
 *
 * Click Listener for the close button.
 */
WindowMenu.prototype._closeListener = function(e) {
    this.hide();
}

/**
 * Updates the message displayed by this <code>WindowMenu</code>
 */
WindowMenu.prototype.setMsg = function (msg) {
    this.msgElement.setTextContent(msg);

    if (isElement(this.htmlElement.parentNode)) {
        this.calculatePosition();
    }
}

/**
 * @private
 *
 * Calculates a usable absolute position for the window
 */
WindowMenu.prototype.calculatePosition = function() {
    var coordenates = [];

    var windowHeight = BrowserUtilsFactory.getInstance().getHeight();
    var windowWidth = BrowserUtilsFactory.getInstance().getWidth();

    this.htmlElement.setStyle({'max-height' : 'none'});
    var menuHeight = this.htmlElement.getHeight();
    var menuWidth = this.htmlElement.getWidth();

    if (menuWidth > windowWidth/2) {
        menuWidth = windowWidth/2; //IE6 hack
        this.htmlElement.setStyle({'width': menuWidth+'px'});
    }

    coordenates[1] = windowHeight/2 - menuHeight/2;
    coordenates[0] = windowWidth/2 - menuWidth/2;

    if (windowHeight < menuHeight) {
        var windowStyle = document.defaultView.getComputedStyle(this.htmlElement, null);

        var padding;
        padding = windowStyle.getPropertyCSSValue("padding-top").
                  getFloatValue(CSSPrimitiveValue.CSS_PX);
        padding+= windowStyle.getPropertyCSSValue("padding-bottom").
                  getFloatValue(CSSPrimitiveValue.CSS_PX);

        this.htmlElement.setStyle({'max-height': windowHeight - padding + 'px',
                                   'top': '0px'});
    } else {
        this.htmlElement.style.top = coordenates[1]+"px";
    }
    this.htmlElement.style.left = coordenates[0]+"px";

    if (this.childWindow != null) {
        this.childWindow.calculatePosition();
    }
}

/**
 *
 */
WindowMenu.prototype.setHandler = function (handler) {
    this.operationHandler = handler;
}

/**
 * Makes this WindowMenu visible.
 *
 * @param parentWindow
 */
WindowMenu.prototype.show = function (parentWindow) {
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
}

/**
 * Makes this WindowMenu hidden.
 */
WindowMenu.prototype.hide = function () {
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
}

WindowMenu.prototype._addChildWindow = function (windowMenu) {
    if (windowMenu !== this) {
        this.childWindow = windowMenu;
    } else {
        throw TypeError('Window menus cannot be its own child');
    }
};

WindowMenu.prototype._removeChildWindow = function (windowMenu) {
    if (this.childWindow === windowMenu) {
        this.childWindow = null;
    }
};

WindowMenu.prototype.setFocus = function () {
}

/**
 * Specific class representing alert dialogs
 */
function AlertWindowMenu () {
    WindowMenu.call(this, gettext('Warning'));

    // Warning icon
    this.iconElement.className += ' icon-warning';

    // Accept button
    this.acceptButton = document.createElement('button');

    Element.extend(this.acceptButton);
    this.acceptButton.appendChild(document.createTextNode(gettext('Yes')));
    this._acceptListener = this._acceptListener.bind(this);
    this.acceptButton.observe("click", this._acceptListener);
    this.windowBottom.appendChild(this.acceptButton);

    // Cancel button
    this.cancelButton = document.createElement('button');
    Element.extend(this.cancelButton);
    this.cancelButton.appendChild(document.createTextNode(gettext('No')));
    this.cancelButton.observe("click", this._closeListener);
    this.windowBottom.appendChild(this.cancelButton);

    this.acceptHandler = null;
    this.cancelHandler = null;
}
AlertWindowMenu.prototype = new WindowMenu();

AlertWindowMenu.prototype._acceptListener = function(e) {
    this.acceptHandler();
    this.hide();
}

AlertWindowMenu.prototype._closeListener = function(e) {
    WindowMenu.prototype._closeListener.call(this, e);
    if (this.cancelHandler) this.cancelHandler();
}

AlertWindowMenu.prototype.setHandler = function(acceptHandler, cancelHandler) {
    this.acceptHandler = acceptHandler;
    this.cancelHandler = cancelHandler;
}

AlertWindowMenu.prototype.setFocus = function() {
    this.acceptButton.focus();
}

/**
 * Specific class for platform preferences windows.
 *
 * @param manager
 *
 * @author jmostazo-upm
 */
function PreferencesWindowMenu(scope, manager) {
    WindowMenu.call(this, '');

    this.manager = manager;
    var table = manager.getPreferencesDef().getInterface();
    this.windowContent.insertBefore(table, this.msgElement);

    // Accept button
    this.acceptButton = document.createElement('button');

    Element.extend(this.acceptButton);
    this.acceptButton.appendChild(document.createTextNode(gettext('Save')));
    this._executeOperation = this._executeOperation.bind(this);
    this.acceptButton.observe("click", this._executeOperation);
    this.windowBottom.appendChild(this.acceptButton);

    // Cancel button
    this.cancelButton = document.createElement('button');

    Element.extend(this.cancelButton);
    this.cancelButton.appendChild(document.createTextNode(gettext('Cancel')));
    this.cancelButton.observe("click", this._closeListener);
    this.windowBottom.appendChild(this.cancelButton);
}
PreferencesWindowMenu.prototype = new WindowMenu();

PreferencesWindowMenu.prototype.setCancelable = function(cancelable) {
    this.closeButton.setDisabled(!cancelable);
    if (cancelable === true) {
        this.cancelButton.style.display = '';
    } else {
        this.cancelButton.style.display = 'none';
    }
};

PreferencesWindowMenu.prototype._executeOperation = function() {
    // Validate input fields
    var validationManager = new ValidationErrorManager();
    for (var fieldId in this.fields)
        validationManager.validate(this.fields[fieldId].inputInterface);

    // Build Error Message
    var errorMsg = validationManager.toHTML();

    // Show error message if needed
    if (errorMsg != "") {
        this.setMsg(errorMsg);
    } else {
        this.manager.save();
        this.hide();
    }
}

PreferencesWindowMenu.prototype.show = function (parentWindow) {
    this.setTitle(this.manager.buildTitle());
    this.manager.resetInterface('platform');
    WindowMenu.prototype.show.call(this, parentWindow);
}
