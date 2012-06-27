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

/*jslint white: true, onevar: false, undef: true, nomen: false, eqeqeq: true, plusplus: false, bitwise: true, regexp: true, newcap: true, immed: true, strict: false, forin: true, sub: true*/
/*global $, CSSPrimitiveValue, Element, Event, Insertion, document, gettext, ngettext, interpolate, window */
/*global Constants, DropDownMenu, URIs, LayoutManagerFactory, LogManagerFactory, OpManagerFactory, Wirecloud, ShowcaseFactory*/
/*global isElement, IGadgetLogManager, IGadgetResizeHandle, GadgetVersion, DragboardPosition, Concept*/
/*global IGadgetDraggable, IGadgetIconDraggable, FreeLayout, FullDragboardLayout*/
/*global ColorDropDownMenu, BrowserUtilsFactory, setTimeout, clearTimeout*/

/**
 * Creates an instance of a Gadget.
 *
 * @author Álvaro Arranz
 *
 * @class Represents an instance of a Gadget.
 *
 * @param {Gadget}            gadget        Gadget of this iGadget
 * @param {Number}            iGadgetId     iGadget id in persistence. This
 *                                          parameter can be null for new
 *                                          iGadgets (not coming from
 *                                          persistence)
 * @param {String}            iGadgetName   current gadget
 * @param {DragboardLayout}   layout        associated layout
 * @param {DragboardPosition} position      initial position. This parameter can
 *                                          be null for new iGadgets (not coming
 *                                          from persistence)
 * @param {Number}            zPos          initial z coordinate position. This
 *                                          parameter can be null for new
 *                                          iGadgets (not coming from
 *                                          persistence)
 * @param {Number}            width         initial content width
 * @param {Number}            height        initial content height
 * @param {Boolean}           fulldragboard initial fulldragboard mode
 * @param {Boolean}           minimized     initial minimized status
 * @param {Boolean}           transparency  initial transparency status
 * @param {String}            menu_color    background color for the menu.
 *                                          (6 chars with a hexadecimal color)
 */
function IGadget(gadget, iGadgetId, iGadgetName, layout, position, iconPosition, zPos, width, height, fulldragboard, minimized, transparency, menu_color, refusedVersion, freeLayoutAfterLoading, readOnly) {
    this.logManager = new IGadgetLogManager(this);
    this.id = iGadgetId;
    this.code = null;
    this.name = iGadgetName;
    this.gadget = gadget;
    this.position = position;
    this.contentWidth = width;
    this.contentHeight = height;
    this.loaded = false;
    this.zPos = zPos;
    this.transparency = transparency;
    this.draggable = null;
    this.visible = false;
    this.minimized = minimized;
    this.highlightTimeout = null;
    if (this.id) {
        this.codeURL = this.gadget.getXHtml().getURICode() + "#id=" + this.id;
    }

    if (fulldragboard) {
        this.minimized = false;
        this.previousContentWidth = this.contentWidth;
        this.previousHeight = this.contentHeight + layout.getMenubarSize().inLU; // TODO
        this.previousLayout = layout;
        this.previousPosition = this.position.clone();
        this.height = 1;
        this.width = 1;
        this.position.x = 0;
        this.position.y = 0;

        layout = layout.dragboard.fulldragboardLayout;
    } else if (!minimized) {
        this.height = this.contentHeight;
    } else {
        this.height = layout.getMenubarSize().inLU;
    }

    this.refusedVersion = refusedVersion !== null ? new GadgetVersion(refusedVersion) : null;
    this.freeLayoutAfterLoading = freeLayoutAfterLoading; //only used the first time the gadget is used to change its layout after loading to FreeLayout

    this.readOnly = readOnly;

    // Elements
    this.element = null;
    this.gadgetMenu = null;
    this.contentWrapper = null;
    this.content = null;
    this.closeButton = null;
    this.settingsButton = null;
    this.minimizeButton = null;
    this.errorButton = null;
    this.igadgetNameHTMLElement = null;
    this.igadgetInputHTMLElement = null;
    this.statusBar = null;
    this.extractButton = null;

    // Icon element for the iconified mode
    this.iconElement = null;
    this.iconImg = null;
    this.igadgetIconNameHTMLElement =  null;
    this.iconPosition = iconPosition;
    this.iconDraggable =  null;

    // Menu attributes
    this.extractOptionId = null;

    this.lowerOpId = null;
    this.raiseOpId = null;
    this.lowerToBottomOpId = null;
    this.raiseToTopOpId = null;

    // iGadget menu
    this.menu = null;

    // Add the iGadget to the layout
    this.build();
    layout.addIGadget(this, true);

    StyledElements.ObjectWithEvents.call(this, ['load', 'unload']);
    this.menu_color = menu_color ? menu_color : "FFFFFF";
    //this.menu_color = IGadgetColorManager.autogenColor(menu_color, this.code);
}
IGadget.prototype = new StyledElements.ObjectWithEvents();

/**
 * Returns the associated Gadget.
 *
 * @returns {Gadget} the associated Gadget.
 */
IGadget.prototype.getGadget = function () {
    return this.gadget;
};

IGadget.prototype.invalidIconPosition = function () {
    return this.iconPosition.x === -1 && this.iconPosition.y === -1;
};

/**
 * Sets the position of a gadget instance. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 *
 * @param {DragboardPosition} position the new position for the iGadget.
 */
IGadget.prototype.setPosition = function (position) {
    // Set a initial icon position (first time) or it still follows the gadget (both positions are a reference to the same object)
    if (!this.iconPosition) {
        this.setIconPosition(new DragboardPosition(-1, -1));
    }
    if (this.onFreeLayout() && this.invalidIconPosition()) {
        this.setIconPosition(position);
    }

    this.position = position;

    if (this.element !== null) { // if visible
        this.element.style.left = this.layout.getColumnOffset(position.x) + "px";
        this.element.style.top = this.layout.getRowOffset(position.y) + "px";

        // Notify Context Manager about the new position
        var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
        contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.XPOSITION, this.position.x);
        contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.YPOSITION, this.position.y);
    }
};

/**
 * Sets the position of the associated icon for this iGadget. The position must
 * be specified relative to the top-left square of the icon and using pixels
 * units.
 *
 * @param {DragboardPosition} position the new position for the iGadget icon
 */
IGadget.prototype.setIconPosition = function (position) {
    this.iconPosition = position.clone();
    if (this.iconElement) {
        this.iconElement.style.left = this.layout.dragboard.freeLayout.getColumnOffset(this.iconPosition.x) + "px";
        this.iconElement.style.top = this.layout.dragboard.freeLayout.getRowOffset(this.iconPosition.y) + "px";
    }
};

/**
 * Sets the z coordinate position of this iGadget.
 *
 * @param {Number} zPos the new Z coordinate position for the iGadget.
 */
IGadget.prototype.setZPosition = function (zPos) {
    this.zPos = zPos;

    zPos = zPos !== null ? zPos + 1: "";

    if (this.element) {
        this.element.style.zIndex = zPos;
    }
    if (this.iconElement) {
        this.iconElement.style.zIndex = zPos;
    }
};

/**
 * Gets the position of a gadget instance. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 *
 * @returns {DragboardPosition} the current position of the iGadget.
 */
IGadget.prototype.getPosition = function () {
    return this.position;
};

/**
 * Gets the position of a gadget instance minimized. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 *
 * @returns {DragboardPosition} the current position of the iGadget.
 */
IGadget.prototype.getIconPosition = function () {
    return this.iconPosition;
};

/**
 * Gets the z coordinate of this iGadget.
 *
 * @returns {Number} the Z coordinate of the iGadget.
 */
IGadget.prototype.getZPosition = function (zPos) {
    return this.zPos;
};

/**
 * Returns the content width in Layout Units.
 *
 * @returns {Number} the content width in cells.
 */
IGadget.prototype.getContentWidth = function () {
    return this.contentWidth;
};

/**
 * Returns the content height in Layout Units.
 *
 * @returns {Number} the content height in cells.
 */
IGadget.prototype.getContentHeight = function () {
    return this.contentHeight;
};

/**
 * Returns the Tab where this iGadget is displayed.
 *
 * @returns {Tab} associated tab
 */
IGadget.prototype.getTab = function () {
    return this.layout.dragboard.tab;
};

/**
 * Returns the current width of the gadget in LU. This is not the same to the
 * content with as it depends in the current status of the iGadget (minimized,
 * with the configuration dialog, etc...)
 *
 * @returns {Number} the current width of the gadget in LU
 *
 * @see DragboardLayout
 */
IGadget.prototype.getWidth = function () {
    // For now, the igadget width is always the width of the igadget content
    return this.contentWidth;
};

/**
 * Returns the current height of the gadget in LU. This is not the same to the
 * iGadget's content height as it depends in the current status of the iGadget
 * (minimized, with the configuration dialog, etc...)
 *
 * @returns {Number} the current height of the gadget in LU
 *
 * @see DragboardLayout
 */
IGadget.prototype.getHeight = function () {
    return this.height;
};

/**
 * Returns the identifier of this iGadget. This identifier is unique for the
 * current Wirecloud Platform. This identifier can be null if this iGadget is not
 * currently presisted.
 *
 * @returns {Number} the identifier for this iGadget.
 */
IGadget.prototype.getId = function () {
    return this.id;
};

IGadget.prototype.getElement = function () {
    return this.element;
};

/**
 * Returns true if the iGadget is currently visible in a dragboard.
 *
 * @returns {Boolean} true if the iGadget is currently visible; false otherwise.
 */
IGadget.prototype.isVisible = function () {
    return this.visible;
};

/**
 * Returns true if the iGadget is currently on the free layout of the dragboard.
 *
 * @returns {Boolean} true if the iGadget is currently on the free layout of the
 *                    associated dragboard; false otherwise.
 */
IGadget.prototype.onFreeLayout = function () {
    return this.layout.dragboard.freeLayout === this.layout;
};

/**
 * Toggle the gadget transparency
 */
IGadget.prototype.toggleTransparency = function () {
    function onSuccess() {}
    function onError(transport, e) {
        var msg = gettext("Error saving the new transparency value into persistence: %(errorMsg)s.");
        msg = this.logManager.formatError(msg, transport, e);
        this.log(msg, Constants.Logging.ERROR_MSG);
    }

    this.element.toggleClassName("gadget_window_transparent");
    this.transparency = !this.transparency;

    //Persist the new state
    var igadgetData = Object.toJSON({
        transparency: this.transparency,
        id: this.id
    });
    var params = {'igadget': igadgetData};
    var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
                                                tabId: this.layout.dragboard.tabId,
                                                iGadgetId: this.id});
    Wirecloud.io.makeRequest(igadgetUrl, {
        method: 'PUT',
        parameters: params,
        onSuccess: onSuccess,
        onFailure: onError
    });
};

/**
 * Builds the structure of the gadget
 */
IGadget.prototype.build = function () {
    this.element = document.createElement("div");
    Element.extend(this.element);
    this.element.addClassName("gadget_window");

    // Gadget Menu
    this.gadgetMenu = document.createElement("div");
    Element.extend(this.gadgetMenu);
    this.gadgetMenu.addClassName("gadget_menu");
    this.gadgetMenu.observe("contextmenu",
        function (e) {
            Event.stop(e);
        },
        true);

    // Gadget title
    this.gadgetMenu.setAttribute("title", this.name);

    //#######################################
    // buttons. Inserted from right to left
    //#######################################

    // close button
    this.closeButton = new StyledElements.StyledButton({
        'plain': true,
        'class': 'closebutton',
        'title': gettext('Close')
    });
    this.closeButton.addEventListener("click",
        function () {
            OpManagerFactory.getInstance().removeInstance(this.id);
        }.bind(this));
    this.closeButton.insertInto(this.gadgetMenu);

    // Menu button
    this.settingsButton = new StyledElements.StyledButton({
        'plain': true,
        'class': 'settingsbutton',
        'title': gettext('Menu')
    });
    this.settingsButton.addEventListener("click",
        function (button) {
            this.menu.show(button.getBoundingClientRect());
        }.bind(this));
    this.settingsButton.insertInto(this.gadgetMenu);

    // minimize button
    this.minimizeButton = new StyledElements.StyledButton({
        'plain': true
    });
    this.minimizeButton.addEventListener("click",
        function (button) {
            this.toggleMinimizeStatus(true);
        }.bind(this));
    this.minimizeButton.insertInto(this.gadgetMenu);

    // error button
    this.errorButton = new StyledElements.StyledButton({
        'plain': true,
        'class': 'errorbutton'
    });
    this.errorButton.addEventListener("click",
        function (button) {
            OpManagerFactory.getInstance().showLogs(this.logManager); // TODO
        }.bind(this));
    this.errorButton.insertInto(this.gadgetMenu);

    // New Version button
    this.upgradeButton = document.createElement("input");
    Element.extend(this.upgradeButton);
    this.upgradeButton.setAttribute("type", "button");
    this.upgradeButton.addClassName("button versionbutton disabled");
    Event.observe(this.upgradeButton, "click",
        function () {
            var msg = gettext('<p><b>Do you really want to update "%(igadgetName)s" to its latest version?</b><br />The gadget state and connections will be kept, if possible.<p>Note: It will reload your workspace</p>');
            msg = interpolate(msg, {igadgetName: this.name}, true);
            LayoutManagerFactory.getInstance().showYesNoDialog(msg, this.upgradeIGadget.bind(this), this.askForIconVersion.bind(this));
        }.bind(this),
        false);
    this.gadgetMenu.appendChild(this.upgradeButton);

    this.fillWithLabel();

    this.element.appendChild(this.gadgetMenu);

    // Content wrapper
    this.contentWrapper = document.createElement("div");
    Element.extend(this.contentWrapper);
    this.contentWrapper.addClassName("gadget_wrapper");
    this.element.appendChild(this.contentWrapper);

    // Gadget Content
    if (BrowserUtilsFactory.getInstance().isIE()) {
        this.content = document.createElement("iframe");
        Element.extend(this.content);
        this.content.addClassName("gadget_object");
        this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml
        this.content.setAttribute("standby", "Loading...");
//      this.content.innerHTML = "Loading...."; // TODO add an animation ?
        this.content.setAttribute("src", this.codeURL);
        this.content.setAttribute("width", "100%");
        this.content.setAttribute("frameBorder", "0");

    } else { // non IE6
        this.content = document.createElement("object");
        Element.extend(this.content);
        this.content.addClassName("gadget_object");
        this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml
        this.content.setAttribute("standby", "Loading...");
        if (Prototype.Browser.Opera || Prototype.Browser.Safari) {
            this.content.setAttribute("data", this.codeURL);
        }
        //this.content.innerHTML = "Loading...."; // TODO add an animation ?
    }
    Element.extend(this.content);
    this.content.observe("load",
        function () {
            this.layout.dragboard.workSpace.igadgetLoaded(this.id);
        }.bind(this),
        true);
    this.contentWrapper.appendChild(this.content);

    // Gadget status bar
    this.statusBar = document.createElement("div");
    Element.extend(this.statusBar);
    this.statusBar.addClassName("statusBar");
    this.element.appendChild(this.statusBar);
    this.statusBar.observe("click", function () {
                                        this.layout.dragboard.raiseToTop(this);
                                    }.bind(this), false);

    // resize handles
    var resizeHandle;

    // Left one
    resizeHandle = document.createElement("div");
    Element.extend(resizeHandle);
    resizeHandle.addClassName("leftResizeHandle");
    this.leftResizeHandleElement = resizeHandle;
    this.leftResizeHandle = new IGadgetResizeHandle(resizeHandle, this, true);

    // Right one
    resizeHandle = document.createElement("div");
    Element.extend(resizeHandle);
    resizeHandle.addClassName("rightResizeHandle");
    this.statusBar.appendChild(resizeHandle);
    this.rightResizeHandleElement = resizeHandle;
    this.rightResizeHandle = new IGadgetResizeHandle(resizeHandle, this, false);

    // extract/snap button
    this.extractButton = document.createElement("div");
    Element.extend(this.extractButton);
    this.extractButton.className = "button";
    this.extractButton.observe("click",
        function () {
            this.toggleLayout();
        }.bind(this),
        false);
    this.statusBar.appendChild(this.extractButton);

    // wikilink
    this.wikilink = document.createElement('a');
    Element.extend(this.wikilink);
    this.wikilink.addClassName('dragboardwiki button');
    this.wikilink.href = this.gadget.getUriWiki();
    this.wikilink.setAttribute('target', '_blank');
    this.wikilink.setAttribute('title', gettext('Access to Information'));
    this.statusBar.appendChild(this.wikilink);

    // Icon Element
    this.iconElement = document.createElement("div");
    Element.extend(this.iconElement);
    this.iconElement.addClassName("floating_gadget_icon");

    this.iconImg = document.createElement("img");
    Element.extend(this.iconImg);
    this.iconImg.addClassName("floating_gadget_img");
    this.iconImg.setAttribute("src", this.gadget.getIcon());
    this.iconElement.appendChild(this.iconImg);

    // IE hack to allow drag & drop over images
    this.iconImg.ondrag = function () {
        return false;
    };

    this.igadgetIconNameHTMLElement = document.createElement("a");
    Element.extend(this.igadgetIconNameHTMLElement);
    this.igadgetIconNameHTMLElement.update(this.name);
    this.igadgetIconNameHTMLElement.addClassName("floating_gadget_title");
    this.iconElement.appendChild(this.igadgetIconNameHTMLElement);

    this.igadgetIconNameHTMLElement.observe("click",
        function () {
            this.toggleMinimizeStatus(false);
            this.layout.dragboard.raiseToTop(this);
        }.bind(this),
        false);
};

IGadget.prototype.isAllowed = function (action) {
    switch (action) {
    case "close":
        return !this.readOnly && this.layout.dragboard.getWorkspace().isAllowed('add_remove_igadgets');
    case "move":
    case "resize":
        var dragboard = this.layout.dragboard;
        return !dragboard.tab.readOnly && dragboard.getWorkspace().isAllowed('edit_layout');
    case "minimize":
        return this.layout.dragboard.getWorkspace().isAllowed('edit_layout');
    default:
        return false;
    }
};

IGadget.prototype._updateButtons = function () {
    this.closeButton.setDisabled(!this.isAllowed('close'));
    this.minimizeButton.setDisabled(!this.isAllowed('minimize'));

    if (isElement(this.leftResizeHandleElement.parentNode)) {
        this.leftResizeHandleElement.remove();
    }
    if (isElement(this.rightResizeHandleElement.parentNode)) {
        this.rightResizeHandleElement.remove();
    }


    if (this.isAllowed('resize')) {
        this.statusBar.appendChild(this.leftResizeHandleElement);
        this.statusBar.appendChild(this.rightResizeHandleElement);
    }
};

/**
 * Paints this gadget instance into the assigned dragboard.
 *
 * @param {Boolean} onInit true if this gadget is being painted on Dragboard
 *        initation.
 */
IGadget.prototype.paint = function (onInit) {
    if (this.visible) {
        return; // Do nothing if the iGadget is already painted
    }

    this.visible = true;

    // Initialize gadget menu
    this.menu = new StyledElements.PopupMenu();
    this.menu.append(new IGadgetMenuItems(this));

    // Insert it into the dragboard (initially hidden)
    this.element.style.visibility = "hidden";
    this.layout.dragboard.dragboardElement.appendChild(this.element);

    if (this.content.tagName.toLowerCase() === 'object' && !Prototype.Browser.Safari) {
        this.content.setAttribute("data", this.codeURL);
    }

    // Position
    this.element.style.left = this.layout.getColumnOffset(this.position.x) + "px";
    this.element.style.top = this.layout.getRowOffset(this.position.y) + "px";
    this.setZPosition(this.zPos);

    // Select the correct representation for this iGadget (iconified, minimized or normal)
    var minimizedStatusBackup = this.minimized;
    this.minimized = false;
    this._recomputeSize(false);

    this.minimized = null;
    this.setMinimizeStatus(minimizedStatusBackup, false, false);

    // Initialize transparency status
    if (this.transparency) {
        this.element.addClassName("gadget_window_transparent");
    }

    //Initialize read-only status
    if (this.readOnly) {
        this.element.addClassName("gadget_window_readonly");
    }

    // Time to show the igadget (we need to take into account the gadget can be iconified)
    if (!this.onFreeLayout() || !minimizedStatusBackup) {
        this.element.style.visibility = "";
    }

    // Mark as draggable
    this.draggable = new IGadgetDraggable(this);

    var contextManager = this.layout.dragboard.getWorkspace().getContextManager();

    // Notify Context Manager about the new position
    contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.XPOSITION, this.position.x);
    contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.YPOSITION, this.position.y);

    // Notify Context Manager about the new sizes
    contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.HEIGHT, this.contentHeight);
    contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.WIDTH, this.contentWidth);

    this._updateButtons();
    this._updateVersionButton();

    // Icon
    this.layout.dragboard.dragboardElement.appendChild(this.iconElement);
    this.iconDraggable = new IGadgetIconDraggable(this);
    this.iconElement.style.left = this.layout.dragboard.freeLayout.getColumnOffset(this.iconPosition.x) + "px";
    this.iconElement.style.top = this.layout.dragboard.freeLayout.getRowOffset(this.iconPosition.y) + "px";

    Event.observe(this.iconImg,
        "click",
        function () {
            this.setMinimizeStatus(false);
            this.layout.dragboard.raiseToTop(this);
        }.bind(this),
        true);
};

IGadget.prototype.load = function () {
    this.getTab().paint();
};

IGadget.prototype.isPainted = function () {
    return this.menu !== null;
};

IGadget.prototype.fillWithLabel = function () {
    if (this.igadgetInputHTMLElement !== null) {
        //hide the input element
        this.igadgetInputHTMLElement.hide();
    }

    // get the name
    var nameToShow = this.name;
    if (nameToShow.length > 30) {
        nameToShow = nameToShow.substring(0, 30) + "...";
    }

    if (this.igadgetNameHTMLElement !== null) {
        // update and show the label
        this.igadgetNameHTMLElement.update(nameToShow);
        this.igadgetNameHTMLElement.show();
    } else {
        //create the label
        this.igadgetNameHTMLElement = document.createElement("span");
        Element.extend(this.igadgetNameHTMLElement);
        this.igadgetNameHTMLElement.innerHTML = nameToShow;
        this.gadgetMenu.appendChild(this.igadgetNameHTMLElement);

        this.igadgetNameHTMLElement.observe('mousedown', Event.stop);
        this.igadgetNameHTMLElement.observe('click',
                                            function (e) {
                                                Event.stop(e);
                                                this.layout.dragboard.raiseToTop(this);
                                                this.fillWithInput();
                                            }.bind(this)); //do not propagate to div.
    }
};

IGadget.prototype.fillWithInput = function () {
    this.igadgetNameHTMLElement.hide();
    if (this.igadgetInputHTMLElement) {
        this.igadgetInputHTMLElement.show();
        this.igadgetInputHTMLElement.setAttribute("value", this.name);
        this.igadgetInputHTMLElement.setAttribute("size", this.name.length + 5);
    } else {
        this.igadgetInputHTMLElement = document.createElement("input");
        Element.extend(this.igadgetInputHTMLElement);
        this.igadgetInputHTMLElement.addClassName("igadget_name");
        this.igadgetInputHTMLElement.setAttribute("type", "text");
        this.igadgetInputHTMLElement.setAttribute("value", this.name);
        this.igadgetInputHTMLElement.setAttribute("size", this.name.length + 5);
        this.igadgetInputHTMLElement.setAttribute("maxlength", 30);

        this.gadgetMenu.appendChild(this.igadgetInputHTMLElement);

        this.igadgetInputHTMLElement.observe('blur',
                                            function (e) {
                                                Event.stop(e);
                                                this.fillWithLabel();
                                            }.bind(this));

        this.igadgetInputHTMLElement.observe('keypress',
                                            function (e) {
                                                if (e.keyCode === Event.KEY_RETURN) {
                                                    Event.stop(e);
                                                    var target = BrowserUtilsFactory.getInstance().getTarget(e);
                                                    target.blur();
                                                }
                                            }.bind(this));

        this.igadgetInputHTMLElement.observe('change',
                                            function (e) {
                                                var target = BrowserUtilsFactory.getInstance().getTarget(e);
                                                this.setName(target.value);
                                            }.bind(this));

        this.igadgetInputHTMLElement.observe('keyup',
                                            function (e) {
                                                Event.stop(e);
                                                var target = BrowserUtilsFactory.getInstance().getTarget(e);
                                                target.size = (target.value.length === 0) ? 1 : target.value.length + 5;
                                            }.bind(this));
    }
    this.igadgetInputHTMLElement.focus();
};

/**
 * Sets the name of this iGadget. The name of the iGadget is shown at the
 * iGadget's menu bar. Also, this name will be used to refere to this gadget in
 * other parts of the Wirecloud Platform, for example it is used in the wiring
 * interface.
 *
 * @param {String} igadgetName New name for this iGadget.
 */
IGadget.prototype.setName = function (igadgetName) {
    var oldName = this.name;

    function onSuccess() {
        var msg = gettext("Name changed from \"%(oldName)s\" to \"%(newName)s\" succesfully");
        msg = interpolate(msg, {oldName: oldName, newName: igadgetName}, true);
        this.log(msg, Constants.Logging.INFO_MSG);
    }
    function onError(transport, e) {
        var msg = gettext("Error renaming igadget from persistence: %(errorMsg)s.");
        msg = this.logManager.formatError(msg, transport, e);
        this.log(msg);
    }

    if (igadgetName !== null && igadgetName.length > 0) {
        this.name = igadgetName;
        this.gadgetMenu.setAttribute("title", igadgetName);
        this.igadgetNameHTMLElement.update(this.name);
        this.igadgetIconNameHTMLElement.update(this.name);
        var igadgetData = Object.toJSON({
            name: igadgetName,
            id: this.id
        });
        var params = {'igadget': igadgetData};
        var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
                                                    tabId: this.layout.dragboard.tabId,
                                                    iGadgetId: this.id});
        Wirecloud.io.makeRequest(igadgetUrl, {
            method: 'PUT',
            parameters: params,
            onSuccess: onSuccess.bind(this),
            onFailure: onError.bind(this)
        });
    }
};

/*
 * Perform the properly actions to show to the user that the gadget has received and event
 */
IGadget.prototype.notifyEvent = function () {
    // if the igadget is out of the grid it has to be raised to the top
    if (this.layout instanceof FreeLayout) {
        this.layout.dragboard.raiseToTop(this);
        //Moreover, if the igadget is iconified it has to be opened
        if (this.isIconified()) {
            //maximize iconified gadget
            this.toggleMinimizeStatus();
        }
    }
};

IGadget.prototype.isIconified = function () {
    return (this.layout instanceof FreeLayout && this.minimized);
};

/**
 * @private
 */
IGadget.prototype._updateVersionButton = function () {
    if (this.gadget.isUpToDate() || this.isRefusedUpgrade()) {
        this.upgradeButton.addClassName('disabled');
    } else {
        var msg = gettext("There is a new version of this gadget available. Current version: %(currentVersion)s - Last version: %(lastVersion)s");
        msg = interpolate(msg, {
                currentVersion: this.gadget.getVersion().text,
                lastVersion: this.gadget.getLastVersion().text
            }, true);

        this.upgradeButton.setAttribute("title", msg);
        this.upgradeButton.removeClassName('disabled');
    }
};

IGadget.prototype.askForIconVersion = function () {
    var msg = gettext('Do you want to remove the notice of the new version available?');
    msg = interpolate(msg, {igadgetName: this.name}, true);
    LayoutManagerFactory.getInstance().showYesNoDialog(msg,
        function () {
            this.setRefusedVersion(this.gadget.getLastVersion());
        }.bind(this));
};

IGadget.prototype.setRefusedVersion = function (v) {
    function onSuccess() {}
    function onError(transport, e) {
        var msg = gettext("Error setting the refused version of the igadget to persistence: %(errorMsg)s.");
        msg = this.logManager.formatError(msg, transport, e);
        this.log(msg);
    }

    this.refusedVersion = v;
    $("version_button_" + this.id).hide();

    var igadgetData = Object.toJSON({
        refused_version: this.refusedVersion.text,
        id: this.id
    });
    var params = {'igadget': igadgetData};
    var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
                                                    tabId: this.layout.dragboard.tabId,
                                                    iGadgetId: this.id});
    Wirecloud.io.makeRequest(igadgetUrl, {
        method: 'PUT',
        parameters: params,
        onFailure: onError.bind(this)
    });
};

/**
 * Checks if the refused version is lower than the last one
 *
 * @returns {Boolean}
 */
IGadget.prototype.isRefusedUpgrade = function () {
    return this.refusedVersion && this.refusedVersion.compareTo(this.gadget.getLastVersion()) === 0;
};

/**
 * Update the gadget to its newest version
 */
IGadget.prototype.upgradeIGadget = function () {
    function onUpgradeOk(transport) {
        ShowcaseFactory.getInstance().reload(this.layout.dragboard.workSpaceId);
    }

    function onUpgradeError(transport, e) {
        var msg = gettext('<p>Sorry but the "%(igadgetName)s" gadget <b>cannot be automatically updated</b> because its version is not compatible ' +
                'with the last version.<br/>If you want to update the gadget you must replace <b>by hand</b> the existing one with the gadget ' +
                'available in the catalogue.</p><b>Do you want to remove the notice of the new version available?</b>');
        msg = interpolate(msg, {igadgetName: this.name}, true);
        LayoutManagerFactory.getInstance().showYesNoDialog(msg,
            function () {
                this.setRefusedVersion(this.gadget.getLastVersion());
            }.bind(this));
    }

    var data = {
        id: this.id,
        newVersion: this.gadget.getLastVersion().text,
        source: this.gadget.getLastVersion().source
    };
    var igadgetUrl = URIs.PUT_IGADGET_VERSION.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
                                                tabId: this.layout.dragboard.tabId,
                                                iGadgetId: this.id});

    Wirecloud.io.makeRequest(igadgetUrl, {
        method: 'PUT',
        onSuccess: onUpgradeOk.bind(this),
        onFailure: onUpgradeError.bind(this),
        onException: onUpgradeError.bind(this),
        postBody: Object.toJSON(data),
        contentType: 'application/json; UTF-8'
    });
};

/**
 * This method must be called to avoid memory leaks caused by circular references.
 */
IGadget.prototype.destroy = function () {
    if (this.draggable !== null) {
        this.draggable.destroy();
        this.draggable = null;
    }

    if (this.leftResizeHandle !== null) {
        this.leftResizeHandle.destroy();
        this.leftResizeHandle = null;
    }

    if (this.rightResizeHandle !== null) {
        this.rightResizeHandle.destroy();
        this.rightResizeHandle = null;
    }

    if (this.menu) {
        this.menu.destroy();
        this.menu = null;
    }
    this.gadget = null;
    this.layout = null;
    this.position = null;
    this.logManager.close();
    this.logManager = null;
};

/**
 * Removes this igadget form the dragboard.
 *
 * @param {Boolean} orderFromServer true if his gadget is being removed by Wirecloud
 *   server request.
 */
IGadget.prototype.remove = function (orderFromServer) {
    orderFromServer = orderFromServer !== null ? orderFromServer : false;

    if (this.layout === null) {
        return;
    }

    this.log(gettext('iGadget deleted'), Constants.Logging.INFO_MSG);

    var dragboard = this.layout.dragboard;
    if (isElement(this.element.parentNode)) {
        this.layout.removeIGadget(this, true);
    }

    this.element = null;

    if (!orderFromServer) {
        var onSuccess = function () {};
        var onError = function (transport, e) {
            var msg, logManager;

            logManager = LogManagerFactory.getInstance();
            msg = logManager.formatError(gettext("Error removing igadget from persistence: %(errorMsg)s."), transport, e);
            logManager.log(msg);
        };

        var uri = URIs.GET_IGADGET.evaluate({workspaceId: dragboard.workSpaceId,
                                             tabId: dragboard.tabId,
                                             iGadgetId: this.id});
        Wirecloud.io.makeRequest(uri, {
            method: 'DELETE',
            onFailure: onError.bind(this)
        });
    }
};

/**
 * Sets the content size.
 *
 * @param {Number} newWidth
 * @param {Number} newHeight
 * @param {Boolean} [persist] default: true
 */
IGadget.prototype.setContentSize = function (newWidth, newHeight, persist) {
    persist = persist != null ? persist : true;

    if (!this.isPainted()) {
        this.contentWidth = newWidth;
        this.contentHeight = newHeight;
        return;
    }

    var oldHeight = this.getHeight();
    var oldWidth = this.getWidth();

    this.contentWidth = newWidth;
    this.contentHeight = newHeight;

    this._recomputeSize(true);

    // Notify resize event
    this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.getWidth(), this.getHeight(), false, persist);
};

/**
 * This function is called when the browser window is resized.
 *
 * @private
 */
IGadget.prototype._notifyWindowResizeEvent = function () {
    if (!this.isPainted()) {
        return;
    }

    /* TODO this is a temporally workaround needed when using display:none to hide tabs */
    var oldHeight = this.getHeight();
    var oldWidth = this.getWidth();
    /* TODO end of temporally workaround */

    // Recompute position
    this.element.style.left = this.layout.getColumnOffset(this.position.x) + "px";
    this.element.style.top = this.layout.getRowOffset(this.position.y) + "px";

    // Recompute size
    this._recomputeSize(true);

    /* TODO this is a temporally workaround needed when using display:none to hide tabs */
    // Notify new sizes if needed
    var newHeight = this.getHeight();
    var newWidth = this.getWidth();

    if ((oldHeight !== newHeight) || (oldWidth !== newWidth)) {
        this.layout._notifyResizeEvent(this, oldWidth, oldHeight, newWidth, newHeight, false, false);
    }
    /* TODO end of temporally workaround */
};

/**
 * This function is called when the content of the igadget has been loaded completly.
 *
 * @private
 */
IGadget.prototype._notifyLoaded = function () {
    var msg, unloadElement, errorCount;

    msg = gettext('iGadget loaded');
    this.log(msg, Constants.Logging.INFO_MSG);

    if (this.loaded) {
        return;
    }

    this.loaded = true;

    errorCount = this.logManager.getErrorCount();
    if (errorCount > 0) {
        msg = ngettext("%(errorCount)s error for the iGadget \"%(name)s\" was notified before it was loaded",
                           "%(errorCount)s errors for the iGadget \"%(name)s\" were notified before it was loaded",
                           errorCount);
        msg = interpolate(msg, {errorCount: errorCount, name: this.name}, true);
        this.log(msg, Constants.Logging.WARN_MSG);
    }

    if (BrowserUtilsFactory.getInstance().isIE()) {
        unloadElement = this.content;
    } else {
        unloadElement = this.content.contentDocument.defaultView;
    }

    Event.observe(unloadElement,
        'unload',
        function () {
            OpManagerFactory.getInstance().igadgetUnloaded(this.id);
        }.bind(this),
        true);

    // Check if the gadget has its correct layout
    if (this.freeLayoutAfterLoading) {
        //Change the layout to extract the igadget from the grid
        this.toggleLayout();
    }

    this.events['load'].dispatch(this);
};

/**
 * This function is called when the content of the igadget is going to be unloaded.
 *
 * @private
 */
IGadget.prototype._notifyUnloaded = function () {
    var msg = gettext('iGadget unloaded');
    this.log(msg, Constants.Logging.INFO_MSG);
    this.logManager.newCycle();

    if (!this.loaded) {
        return;
    }

    this.errorButton.addClassName("disabled");
    this.errorButton.setTitle('');
    this.loaded = false;
    this.events['unload'].dispatch(this);
};

/**
 * @private
 */
IGadget.prototype._recomputeWidth = function () {
    var width = this.layout.getWidthInPixels(this.contentWidth);

    width -= this._computeExtraWidthPixels();

    if (width < 0) {
        width = 0;
    }

    this.element.style.width = width + "px";

    // Notify Context Manager
    var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
    contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.WIDTHINPIXELS, width);
};

/**
 * @private
 */
IGadget.prototype._recomputeWrapper = function (contentHeight) {
    var wrapperHeight;

    if (!this.minimized) {
        if (contentHeight) {
            wrapperHeight = contentHeight;
        } else {
            wrapperHeight = parseInt(this.content.offsetHeight, 10);
        }
    } else {
        wrapperHeight = 0;
    }

    this.contentWrapper.setStyle({height: wrapperHeight + "px"});
};

/**
 * @private
 */
IGadget.prototype._computeExtraWidthPixels = function () {
    var windowStyle, pixels;

    windowStyle = document.defaultView.getComputedStyle(this.element, null);

    pixels = windowStyle.getPropertyCSSValue("border-left-width").getFloatValue(CSSPrimitiveValue.CSS_PX);
    pixels += windowStyle.getPropertyCSSValue("border-right-width").getFloatValue(CSSPrimitiveValue.CSS_PX);

    return pixels;
};

/**
 * @private
 */
IGadget.prototype._computeExtraHeightPixels = function () {
    var windowStyle, menubarStyle, statusbarStyle, pixels;

    windowStyle = document.defaultView.getComputedStyle(this.element, null);

    pixels = windowStyle.getPropertyCSSValue("border-bottom-width").getFloatValue(CSSPrimitiveValue.CSS_PX);
    pixels += windowStyle.getPropertyCSSValue("border-top-width").getFloatValue(CSSPrimitiveValue.CSS_PX);

    menubarStyle = document.defaultView.getComputedStyle(this.gadgetMenu, null);
    pixels += menubarStyle.getPropertyCSSValue("border-bottom-width").getFloatValue(CSSPrimitiveValue.CSS_PX);
    pixels += menubarStyle.getPropertyCSSValue("border-top-width").getFloatValue(CSSPrimitiveValue.CSS_PX);

    statusbarStyle = document.defaultView.getComputedStyle(this.statusBar, null);
    pixels += statusbarStyle.getPropertyCSSValue("border-bottom-width").getFloatValue(CSSPrimitiveValue.CSS_PX);
    pixels += statusbarStyle.getPropertyCSSValue("border-top-width").getFloatValue(CSSPrimitiveValue.CSS_PX);

    return pixels;
};

/**
 * @private
 */
IGadget.prototype._recomputeHeight = function (basedOnContent) {
    var contentHeight, contextManager, oldHeight;

    contextManager = this.layout.dragboard.getWorkspace().getContextManager();

    oldHeight = this.height;

    if (!this.minimized) {
        if (basedOnContent) {
            // Based on content height

            contentHeight = this.layout.fromVCellsToPixels(this.contentHeight);
            var fullSize = contentHeight;
            fullSize += this.gadgetMenu.offsetHeight +
                        this.statusBar.offsetHeight;
            fullSize += this._computeExtraHeightPixels();

            var processedSize = this.layout.adaptHeight(contentHeight, fullSize);
            contentHeight = processedSize.inPixels;
            this.height = processedSize.inLU;
            this.content.setStyle({height: contentHeight + "px"});
        } else {
            // Based on full gadget height
            contentHeight = this.layout.getHeightInPixels(this.height);
            contentHeight -= this.gadgetMenu.offsetHeight + this.statusBar.offsetHeight;
            contentHeight -= this._computeExtraHeightPixels();

            if (contentHeight < 0) {
                contentHeight = 0;
            }

            this.content.setStyle({height: contentHeight + "px"});
            this.contentHeight = Math.floor(this.layout.fromPixelsToVCells(contentHeight));
        }

        this._recomputeWrapper(contentHeight);

        // Notify Context Manager about the new size
        contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.HEIGHTINPIXELS, contentHeight);

    } else { // minimized
        this._recomputeWrapper();
        contentHeight = this.element.offsetHeight;
        this.content.setStyle({height: "0px"});
        this.height = Math.ceil(this.layout.fromPixelsToVCells(contentHeight));
    }

    if (oldHeight !== this.height) {
        // Notify Context Manager about new size
        contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.HEIGHT, this.height);
    }
};

/**
 * @private
 */
IGadget.prototype._recomputeSize = function (basedOnContent) {
    this._recomputeWidth();
    this._recomputeHeight(basedOnContent);
};

/**
 * Sets the absolute size of the igadget. See setContentSize for resizing the area for the igadget content.
 *
 * @param {Number} newWidth the new width of this igadget in cells. This will be
 *                          the final width for this gadget.
 * @param {Number} newHeight the new height of this igadget in cells. This will
 *                           be the final height for this gadget (that is,
 *                           counting the igadget's title bar, the configuration
 *                           form, etc)
 * @param {Boolean} [resizeLeftSide] true if the gadget will be resized using
 *                                   the topRight corner as base point.
 *                                   default: false.
 * @param {Boolean} [persist] true if is needed to notify the new
 *                            widths/positions of the iGadget (then the
 *                            associated layout can move other igadgets) to
 *                            persistence. default: true.
 */
IGadget.prototype.setSize = function (newWidth, newHeight, resizeLeftSide, persist) {
    // defaults values for the resizeLeftSide and persist parameters
    resizeLeftSide = resizeLeftSide !== undefined ? resizeLeftSide : false;
    persist = persist !== undefined ? persist : true;

    if (!this.isPainted()) {
        this.contentWidth = newWidth;
        this.height = newHeight;
        return;
    }

    var oldWidth = this.getWidth();
    var oldHeight = this.getHeight();

    // Assign new values
    this.contentWidth = newWidth;
    this.height = newHeight;

    // Recompute sizes
    this._recomputeSize(false);

    if (persist) {
        // Notify Context Manager new sizes
        var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
        contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.HEIGHT, this.contentHeight);
        contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.WIDTH, this.contentWidth);
        contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.HEIGHTINPIXELS, this.content.offsetHeight);
        contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.WIDTHINPIXELS, this.content.offsetWidth);
    }

    // Notify resize event
    this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.contentWidth, this.height, resizeLeftSide, persist);
};

/**
 * Returns true if this igadget is minimized.
 *
 * @returns {Boolean} true if the iGadget is minimized; false otherwise.
 */
IGadget.prototype.isMinimized = function () {
    return this.minimized;
};

/**
 * Changes minimize status of this igadget
 *
 * @param newStatus new minimize status of the igadget
 */
IGadget.prototype.setMinimizeStatus = function (newStatus, persistence, reserveSpace) {
    if (this.minimized === newStatus) {
        return; // Nothing to do
    }

    // TODO add effects?

    // New Status
    this.minimized = newStatus;

    if (this.minimized) {
        if (this.onFreeLayout()) {
            // Floating gadget
            this.element.setStyle({"visibility": "hidden"});
            this.iconElement.setStyle({"display": "block"});
        } else {
            // Linked to the grid
            this.contentWrapper.setStyle({"visibility": "hidden", "border": "0px"});
            this.statusBar.setStyle({"display": "none"});
            this.minimizeButton.setTitle(gettext("Maximize"));
            this.minimizeButton.removeClassName("minimizebutton");
            this.minimizeButton.addClassName("maximizebutton");
        }
    } else {
        this.minimizeButton.setTitle(gettext("Minimize"));
        this.minimizeButton.removeClassName("maximizebutton");
        this.minimizeButton.addClassName("minimizebutton");
        this.contentWrapper.setStyle({"visibility": "", "border": ""});

        if (this.onFreeLayout()) {
            // Floating gadget
            this.element.setStyle({"visibility": ""});
            this.iconElement.setStyle({"display": "none"});
        } else {
            //Linked to the grid
            this.statusBar.setStyle({"display": ""});
        }
    }

    var oldHeight = this.getHeight();
    this._recomputeHeight(true);

    // Notify resize event
    reserveSpace = (typeof reserveSpace !== 'undefined' && reserveSpace !== null) ? reserveSpace : true;
    if (reserveSpace) {
        var persist = persistence !== null ? persistence : true;
        this.layout._notifyResizeEvent(this, this.contentWidth, oldHeight, this.contentWidth, this.getHeight(), false, persist, reserveSpace);
    }
};

IGadget.prototype.isInFullDragboardMode = function () {
    return this.layout instanceof FullDragboardLayout;
};

IGadget.prototype.setFullDragboardMode = function (enable) {
    if (this.isInFullDragboardMode() === enable) {
        return;
    }

    var dragboard = this.layout.dragboard;

    if (enable) {
        this.previousContentWidth = this.contentWidth;
        this.previousHeight = this.height;
        this.previousLayout = this.layout;
        this.previousPosition = this.position.clone();

        this.moveToLayout(dragboard.fulldragboardLayout);
        dragboard.raiseToTop(this);
    } else {
        this.moveToLayout(this.previousLayout);
    }
};

/**
 * Toggles the minimize status of this gadget
 */
IGadget.prototype.toggleMinimizeStatus = function (persistence) {
    this.setMinimizeStatus(!this.minimized, persistence);
};

/**
 * @private
 */
IGadget.prototype._updateErrorInfo = function () {
    var label, errorCount = this.logManager.getErrorCount();
    this.errorButton.setDisabled(errorCount == 0);

    label = ngettext("%(errorCount)s error", "%(errorCount)s errors", errorCount);
    label = interpolate(label, {errorCount: errorCount}, true);
    this.errorButton.setTitle(label);
};

/**
 * Logs a success
 */
IGadget.prototype.log = function (msg, level) {
    level = level != null ? level : Constants.Logging.ERROR_MSG;

    this.logManager.log(msg, level);
    if (this.isVisible()) {
        this._updateErrorInfo();
    }
};

IGadget.prototype.highlight = function () {
    if (this.isVisible()) {
        this.element.addClassName('highlighted');

        if (this.highlightTimeout !== null) {
            clearTimeout(this.highlightTimeout);
        }

        this.highlightTimeout = setTimeout(function () {
                this.element.removeClassName('highlighted');
                this.highlightTimeout = null;
            }.bind(this),
            15000);
    }
};

/**
 * Increments the error count for this igadget
 */
IGadget.prototype.toggleLayout = function () {
    if (this.onFreeLayout()) {
        this.moveToLayout(this.layout.dragboard.baseLayout);
    } else {
        this.moveToLayout(this.layout.dragboard.freeLayout);
    }
};

/**
 * Check if the igadget belongs to a shared workspace
 */
IGadget.prototype.is_shared_workspace = function () {
    return this.layout.dragboard.getWorkspace().isShared();
};

/**
 * Saves the igadget into persistence. Used only for the first time, that is,
 * for creating igadgets.
 */
IGadget.prototype.save = function (options) {
    function onSuccess(transport) {
        var igadgetInfo = JSON.parse(transport.responseText);
        this.id = igadgetInfo['id'];
        this.codeURL = this.gadget.getXHtml().getURICode() + "#id=" + this.id;
        this.layout.dragboard.addIGadget(this, igadgetInfo, options);
    }

    function onError(transport, e) {
        var logManager, msg;

        logManager = LogManagerFactory.getInstance();
        msg = logManager.formatError(gettext("Error adding igadget to persistence: %(errorMsg)s."), transport, e);
        logManager.log(msg);

        // Remove this iGadget from the layout
        this.layout.removeIGadget(this, true);
        this.destroy();
    }

    var uri = URIs.POST_IGADGET.evaluate({tabId: this.layout.dragboard.tabId,
                                          workspaceId: this.layout.dragboard.workSpaceId});
    var gadget_uri = URIs.GET_GADGET.evaluate({vendor: this.gadget.getVendor(),
                                               name: this.gadget.getName(),
                                               version: this.gadget.getVersion().text});

    var data = Object.toJSON({
        'uri': uri,
        'gadget': gadget_uri,
        'left': this.position.x,
        'top': this.position.y,
        'icon_left': this.iconPosition.x,
        'icon_top': this.iconPosition.y,
        'zIndex': this.zPos,
        'width': this.contentWidth,
        'height': this.contentHeight,
        'name': this.name,
        'layout': this.onFreeLayout() ? 1 : 0
    });
    data = {igadget: data};
    Wirecloud.io.makeRequest(uri, {
        method: 'POST',
        parameters: data,
        onSuccess: onSuccess.bind(this),
        onFailure: onError.bind(this),
        onException: onError.bind(this)
    });
};

/**
 * This function migrates this igadget form a layout to another
 *
 * @param {DragboardLayout} newLayout the layout where the iGadget will be moved
 *                          to.
 */
IGadget.prototype.moveToLayout = function (newLayout) {
    if (this.layout === newLayout) {
        return;
    }

    var affectedGadgetsRemoving = false;
    var affectedGadgetsAdding = false;      //is there any other gadget's postion affected

    var minimizeOnFinish = false;
    if (this.minimized) {
        minimizeOnFinish = true;
        this.toggleMinimizeStatus();
    }

    // ##### TODO Review this
    var contentWidth = this.element.offsetWidth;
    var fullWidth = contentWidth;
    contentWidth -= this._computeExtraWidthPixels();

    var contentHeight = this.content.offsetHeight;
    var fullHeight = contentHeight;
    fullHeight += this.gadgetMenu.offsetHeight +
                  this.statusBar.offsetHeight;
    fullHeight += this._computeExtraHeightPixels();
    // ##### END TODO

    var dragboardChange = this.layout.dragboard !== newLayout.dragboard;
    var oldLayout = this.layout;

    // Force an unload event
    if (dragboardChange) {
        OpManagerFactory.getInstance().igadgetUnloaded(this.id);
    }

    affectedGadgetsRemoving = oldLayout.removeIGadget(this, dragboardChange);


    if (dragboardChange && !(newLayout instanceof FreeLayout)) {
        this.position = null;
    } else if (oldLayout instanceof FullDragboardLayout) {
        this.position = this.previousPosition;
    } else {
        this.position.x = oldLayout.getColumnOffset(this.position.x);
        this.position.x = newLayout.adaptColumnOffset(this.position.x).inLU;

        this.position.y = oldLayout.getRowOffset(this.position.y);
        this.position.y = newLayout.adaptRowOffset(this.position.y).inLU;
    }

    // ##### TODO Review this
    if (oldLayout instanceof FullDragboardLayout) {
        this.contentWidth = this.previousContentWidth;
        this.height = this.previousHeight;
    } else {
        //console.debug("prev width: " + this.contentWidth);
        var newWidth = newLayout.adaptWidth(contentWidth, fullWidth, oldLayout);
        this.contentWidth = newWidth.inLU;
        //console.debug("new width: " + this.contentWidth);

        //console.debug("prev height: " + this.height);
        var newHeight = newLayout.adaptHeight(contentHeight, fullHeight, oldLayout);
        this.height = newHeight.inLU;
        //console.debug("new height: " + this.height);
    }
    // ##### END TODO

    affectedGadgetsAdding = newLayout.addIGadget(this, dragboardChange);

    if (minimizeOnFinish) {
        this.toggleMinimizeStatus();
    }

    if (!this.loaded && BrowserUtilsFactory.getInstance().isIE()) {
        // IE hack to reload the iframe
        this.content.src = this.content.src;
    }

    if (!dragboardChange) {
        // This is needed to check if the scrollbar status has changed (visible/hidden)
        newLayout.dragboard._notifyWindowResizeEvent();
    }


    //if the gadget hasn't been taken to another tab and
    //the movement affects the rest of gadgets
    if (!dragboardChange && (affectedGadgetsRemoving || affectedGadgetsAdding)) {
        //commit all the dragboard changes
        this.layout.dragboard._commitChanges();
    } else {
        //commit only the info about this igadget. If it has changed dragboards, it won't
        //affect the positions of the gadgets of the new tab because it's placed at the
        //end of the dragboard. It won't either affect the old dragboard's gadgets because
        //they will reallocate themselves and this will be notified in the next action.

        // TODO create a changes manager
        // Persistence
        var onSuccess = function (transport) {
        };

        var onError = function (transport, e) {
            var logManager, msg;

            logManager = LogManagerFactory.getInstance();
            msg = logManager.formatError(gettext("Error saving changes to persistence: %(errorMsg)s."), transport, e);
            logManager.log(msg);
        };

        var data = {};
        data['iGadgets'] = [];

        var iGadgetInfo = {};
        iGadgetInfo['id'] = this.id;
        if (!(newLayout instanceof FullDragboardLayout)) {
            iGadgetInfo['top'] = this.position.y;
            iGadgetInfo['left'] = this.position.x;
            iGadgetInfo['width'] = this.contentWidth;
            iGadgetInfo['height'] = this.contentHeight;
            iGadgetInfo['layout'] = this.onFreeLayout() ? 1 : 0;
            iGadgetInfo['fulldragboard'] = false;
        } else {
            iGadgetInfo['fulldragboard'] = true;
        }

        iGadgetInfo['icon_top'] = this.iconPosition.y;
        iGadgetInfo['icon_left'] = this.iconPosition.x;
        iGadgetInfo['zIndex'] = this.zPos;
        iGadgetInfo['tab'] = this.layout.dragboard.tabId;

        data['iGadgets'].push(iGadgetInfo);

        data = {
            'igadgets': Object.toJSON(data)
        };
        var uri = URIs.GET_IGADGETS.evaluate({
            workspaceId: oldLayout.dragboard.workSpaceId,
            tabId: oldLayout.dragboard.tabId
        });
        Wirecloud.io.makeRequest(uri, {
            method: 'PUT',
            parameters: data,
            onSuccess: onSuccess.bind(this),
            onFailure: onError.bind(this)
        });
    }
};
