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
 * Creates an instance of a Gadget.
 *
 * @author Álvaro Arranz
 *
 * @class Represents an instance of a Gadget.
 *
 * @param {Gadget}            gadget      Gadget of this iGadget
 * @param {Number}            iGadgetId   iGadget id in persistence. This
 *                                        parameter can be null for new iGadgets
 *                                        (not coming from persistence)
 * @param {String}            iGadgetName current gadget
 * @param {DragboardLayout}   layout      associated layout
 * @param {DragboardPosition} position    initial position. This parameter can
 *                                        be null for new iGadgets (not coming
 *                                        from persistence)
 * @param {Number}            zPos        initial z coordinate position. This
 *                                        parameter can be null for new iGadgets
 *                                        (not coming from persistence)
 * @param {Number}            width       initial content width
 * @param {Number}            height      initial content height
 * @param {Boolean}           minimized   initial minimized status
 */
function IGadget(gadget, iGadgetId, iGadgetName, layout, position, zPos, width, height, minimized, transparency) {
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

	if (!minimized)
		this.height = this.contentHeight + layout.getExtraSize().inLU;
	else
		this.height = layout.getMenubarSize().inLU;

	this.configurationVisible = false;
	this.minimized = minimized;

	// Elements
	this.element = null;
	this.gadgetMenu = null;
	this.contentWrapper = null;
	this.content = null;
	this.configurationElement = null;
	this.settingsButtonElement = null;
	this.minimizeButtonElement = null;
	this.errorButtonElement = null;
	this.igadgetNameHTMLElement = null;
	this.igadgetInputHTMLElement = null;
	this.statusBar = null;
	this.extractButton = null;

	// Menu attributes
	this.extractOptionId = null;
	this.extractOptionOrder = 0;
	
	this.lowerOpId = null;
	this.raiseOpId = null;
	this.lowerToBottomOpId = null;
	this.raiseToTopOpId = null;

	// iGadget drop box menu
	this.menu = null;

	this.errorCount = 0;

	// Add the iGadget to the layout
	layout.addIGadget(this, true);
}

/**
 * Returns the associated Gadget.
 *
 * @returns {Gadget} the associated Gadget.
 */
IGadget.prototype.getGadget = function() {
	return this.gadget;
}

/**
 * Sets the position of a gadget instance. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 *
 * @param {DragboardPosition} position the new position for the iGadget.
 */
IGadget.prototype.setPosition = function(position) {
	this.position = position;

	if (this.element != null) { // if visible
		this.element.style.left = this.layout.getColumnOffset(position.x) + "px";
		this.element.style.top = this.layout.getRowOffset(position.y) + "px";

		// Notify Context Manager of igadget's position
		var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.XPOSITION, this.position.x);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.YPOSITION, this.position.y);
	}
}

/**
 * Sets the z coordinate position of this iGadget.
 *
 * @param {Number} zPos the new Z coordinate position for the iGadget.
 */
IGadget.prototype.setZPosition = function(zPos) {
	this.zPos = zPos;

	if (this.element)
		this.element.style.zIndex = zPos;
}

/**
 * Gets the position of a gadget instance. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 *
 * @returns {DragboardPosition} the current position of the iGadget.
 */
IGadget.prototype.getPosition = function() {
	return this.position;
}

/**
 * Gets the z coordinate of this iGadget.
 *
 * @returns {Number} the Z coordinate of the iGadget.
 */
IGadget.prototype.getZPosition = function(zPos) {
	return this.zPos;
}

/**
 * Returns the content width in Layout Units.
 *
 * @returns {Number} the content width in cells.
 */
IGadget.prototype.getContentWidth = function() {
	return this.contentWidth;
}

/**
 * Returns the content height in Layout Units.
 *
 * @returns {Number} the content height in cells.
 */
IGadget.prototype.getContentHeight = function() {
	return this.contentHeight;
}

/**
 * Returns the Tab where this iGadget is displayed.
 *
 * @returns {Tab} associated tab
 */
IGadget.prototype.getTab = function() {
	return this.layout.dragboard.tab;
}

/**
 * Returns the current width of the gadget in LU. This is not the same to the
 * iGadget's content with as it depends in the current status of the iGadget
 * (minimized, with the configuration dialog, etc...)
 *
 * @returns {Number} the current width of the gadget in LU
 *
 * @see DragboardLayout
 */
IGadget.prototype.getWidth = function() {
	// For now, the igadget width is always the width of the igadget content
	return this.contentWidth;
}

/**
 * Returns the current height of the gadget in LU. This is not the same to the
 * iGadget's content height as it depends in the current status of the iGadget
 * (minimized, with the configuration dialog, etc...)
 *
 * @returns {Number} the current height of the gadget in LU
 *
 * @see DragboardLayout
 */
IGadget.prototype.getHeight = function() {
	return this.height;
}

/**
 * Returns the identifier of this iGadget. This identifier is unique for the
 * current EzWeb Platform. This identifier can be null if this iGadget is not
 * currently presisted.
 *
 * @returns {Number} the identifier for this iGadget.
 */
IGadget.prototype.getId = function() {
	return this.id;
}

IGadget.prototype.getElement = function() {
	return this.element;
}

/**
 * Returns true if the iGadget is currently visible in a dragboard.
 *
 * @returns {Boolean} true if the iGadget is currently visible; false otherwise.
 */
IGadget.prototype.isVisible = function() {
	return this.element != null;
}

/**
 * Returns true if the iGadget is currently on the free layout of the dragboard.
 *
 * @returns {Boolean} true if the iGadget is currently on the free layout of the
 *                    associated dragboard; false otherwise.
 */
IGadget.prototype.onFreeLayout = function() {
	return this.layout.dragboard.freeLayout == this.layout;
}

/**
 * Toggle the gadget transparency
 */
IGadget.prototype.toggleTransparency = function() {
	function onSuccess() {}
	function onError(transport, e) {
		var msg;

		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}
		msg = interpolate(gettext("Error renaming igadget from persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	this.element.toggleClassName("gadget_window_transparent");
	this.transparency = !this.transparency;
	
	//Persist the new state
	var o = new Object;
	o.transparency = this.transparency;
	o.id = this.id;
	var igadgetData = Object.toJSON(o);
	var params = {'igadget': igadgetData};
	var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
	                                            tabId: this.layout.dragboard.tabId,
	                                            iGadgetId: this.id});
	PersistenceEngineFactory.getInstance().send_update(igadgetUrl, params, this, onSuccess, onError);
}

/**
 * Updates the extract/snap from/to grid option on the iGadget's menu.
 *
 * @private
 */
IGadget.prototype._updateExtractOption = function() {
	if (this.onFreeLayout()) {
		this.menu.updateOption(this.extractOptionId,
		                       "/ezweb/images/igadget/snap.png",
		                       gettext("Snap to grid"),
		                       function() {
		                           this.toggleLayout();
		                           LayoutManagerFactory.getInstance().hideCover();
		                       }.bind(this));

		this.extractButton.removeClassName("extractButton");
		this.extractButton.addClassName("snapButton");
		this.extractButton.setAttribute("title", gettext("This iGadget outside the grid."));

		// TODO more generic code
		this.lowerOpId = this.menu.addOption("/ezweb/images/igadget/lower.png",
		                    gettext("Lower"),
		                    function() {
		                        this.layout.lower(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+1);
		this.raiseOpId = this.menu.addOption("/ezweb/images/igadget/raise.png",
		                    gettext("Raise"),
		                    function() {
		                        this.layout.raise(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+2);
		this.lowerToBottomOpId = this.menu.addOption("/ezweb/images/igadget/lowerToBottom.png",
		                    gettext("Lower To Bottom"),
		                    function() {
		                        this.layout.lowerToBottom(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+3);
		this.raiseToTopOpId = this.menu.addOption("/ezweb/images/igadget/raiseToTop.png",
		                    gettext("Raise To Top"),
		                    function() {
		                        this.layout.raiseToTop(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+4);
	} else {
		this.menu.updateOption(this.extractOptionId,
		                       "/ezweb/images/igadget/extract.png",
		                       gettext("Extract from grid"),
		                       function() {
		                           this.toggleLayout();
		                           LayoutManagerFactory.getInstance().hideCover();
		                       }.bind(this));

		this.extractButton.removeClassName("snapButton");
		this.extractButton.addClassName("extractButton");
		this.extractButton.setAttribute("title", gettext("This iGadget is aligned to the grid."));

		if (this.lowerOpId != null) {
			this.menu.removeOption(this.lowerOpId);
			this.menu.removeOption(this.raiseOpId);
			this.menu.removeOption(this.lowerToBottomOpId);
			this.menu.removeOption(this.raiseToTopOpId);
			this.lowerOpId = null;
			this.raiseOpId = null;
			this.lowerToBottomOpId = null;
			this.raiseToTopOpId = null;
		}
	}
}

/**
 * Paints this gadget instance into the assigned dragboard
 */
IGadget.prototype.paint = function() {
	if (this.element != null) // exit if the igadgets is already visible
		return; // TODO exception

	var contentHeight = this.layout.fromVCellsToPixels(this.contentHeight);

	this.element = document.createElement("div");
	this.element.addClassName("gadget_window");

	// Gadget Menu
	this.gadgetMenu = document.createElement("div");
	this.gadgetMenu.addClassName("gadget_menu");
	this.gadgetMenu.observe("contextmenu", function(e) {Event.stop(e);}, true);

	// Gadget title
	this.gadgetMenu.setAttribute("title", this.name);

	//#######################################
	// buttons. Inserted from right to left
	//#######################################
	var button;

	// close button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.addClassName("closebutton");

	if (this.gadget.isContratable()) {
		var remove_and_cancel = function () {
			OpManagerFactory.getInstance().removeInstance(this.id);
			OpManagerFactory.getInstance().cancelServices(this.id);
			LayoutManagerFactory.getInstance().hideCover();
		}.bind(this);
		
		var remove = function () {
			OpManagerFactory.getInstance().removeInstance(this.id);
			OpManagerFactory.getInstance().unsubscribeServices(this.id);
			LayoutManagerFactory.getInstance().hideCover();
		}.bind(this);
		
		button.observe("click", function() {
		                            LayoutManagerFactory.getInstance().showWindowMenu('cancelService', remove_and_cancel, remove);
		                        },
		               true);
	} else {
		button.observe("click", function() {
		                            OpManagerFactory.getInstance().removeInstance(this.id);
		                        }.bind(this),
		                        true);
	}

	button.setAttribute("title", gettext("Close"));
	button.setAttribute("alt", gettext("Close"));
	this.gadgetMenu.appendChild(button);

	// iGadget's menu
	var idMenu = 'igadget_menu_' + this.id;
	var menuHTML = '<div id="'+idMenu+'" class="drop_down_menu"></div>';
	new Insertion.After($('menu_layer'), menuHTML);
	this.menu = new DropDownMenu(idMenu);

	// Settings
	this.menu.addOption("/ezweb/images/igadget/settings.png",
	                    gettext("Preferences"),
	                    function() {
	                        this.toggleConfigurationVisible();
	                        LayoutManagerFactory.getInstance().hideCover();
	                    }.bind(this),
	                    0);

	this.menu.addOption("/ezweb/images/igadget/transparency.png",
	                    gettext("Transparency"),
	                    function() {
	                        this.toggleTransparency();
	                        LayoutManagerFactory.getInstance().hideCover();
	                    }.bind(this),
	                    1);

	// Extract/Snap from/to grid option (see _updateExtractOption)
	this.extractOptionOrder = 2;
	this.extractOptionId = this.menu.addOption("", "", function(){}, this.extractOptionOrder);

	// iGadget's menu button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.addClassName("settingsbutton");
	button.observe("click",
	               function(e) {
	                  LayoutManagerFactory.getInstance().showDropDownMenu('igadgetOps',
	                                                                      this.menu,
	                                                                      Event.pointerX(e),
	                                                                      Event.pointerY(e));
	               }.bind(this),
	               true);
	// and listen to mouse events
	/*this.gadgetMenu.observe("mousedown",
	                        function (e) {
	                            e = e || window.event; // needed for IE

	                            // Only attend to right button (or left button for left-handed persons) events
	                            if (!BrowserUtilsFactory.getInstance().isRightButton(e.button))
	                                return false;

	                            LayoutManagerFactory.getInstance().showDropDownMenu('igadgetOps',
	                                                                                this.menu,
	                                                                                Event.pointerX(e),
	                                                                                Event.pointerY(e));

	                            Event.stop(e);
	                            return false;
	                        }.bind(this),
	                        true);*/

	button.setAttribute("title", gettext("Menu"));
	button.setAttribute("alt", gettext("Menu"));
	this.gadgetMenu.appendChild(button);
	this.settingsButtonElement = button;

	// minimize button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.observe("click", function() {this.toggleMinimizeStatus()}.bind(this), true);
	if (this.minimized) {
		button.setAttribute("title", gettext("Maximize"));
		button.setAttribute("alt", gettext("Maximize"));
		button.addClassName("maximizebutton");
	} else {
		button.setAttribute("title", gettext("Minimize"));
		button.setAttribute("alt", gettext("Minimize"));
		button.addClassName("minimizebutton");
	}

	this.gadgetMenu.appendChild(button);
	this.minimizeButtonElement = button;

	// error button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("class", "button errorbutton disabled");
	button.setAttribute("className", "button errorbutton disabled"); //IE hack
	Event.observe (button, "click", function() {OpManagerFactory.getInstance().showLogs();}, true);
	this.gadgetMenu.appendChild(button);
	this.errorButtonElement = button;

	this.fillWithLabel();

	this.element.appendChild(this.gadgetMenu);

	// Content wrapper
	this.contentWrapper = document.createElement("div");
	this.contentWrapper.addClassName("gadget_wrapper");
	this.element.appendChild(this.contentWrapper);

	// Gadget configuration (Initially empty and hidden)
	this.configurationElement = document.createElement("div");
	this.configurationElement.addClassName("config_interface");
	this.contentWrapper.appendChild(this.configurationElement);

	// Gadget Content
	if (BrowserUtilsFactory.getInstance().getBrowser() == "IE6") {
		this.content = document.createElement("iframe"); 
		this.content.setAttribute("class", "gadget_object"); 
		this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml 
		this.content.setAttribute("src", this.gadget.getXHtml().getURICode() + "?id=" + this.id); 
		this.content.setAttribute("standby", "Loading...");
//		this.content.innerHTML = "Loading...."; // TODO add an animation ?

		this.content.setAttribute("width", "100%");
		this.content.setAttribute("height", contentHeight + "px");
	} else { //non IE6
		this.content = document.createElement("object"); 
		this.content.setAttribute("class", "gadget_object"); 
		this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml 
		this.content.setAttribute("data", this.gadget.getXHtml().getURICode() + "?id=" + this.id); 
		this.content.setAttribute("standby", "Loading...");
		this.content.innerHTML = "Loading...."; // TODO add an animation ?

		this.content.setStyle({"width": "100%", "height": contentHeight + "px"});
	}
	this.content.observe("load",
	                     function () {
	                         OpManagerFactory.getInstance().igadgetLoaded(this.id);
	                     }.bind(this),
	                     true);
	this.contentWrapper.appendChild(this.content);
	
	// Gadget status bar
	this.statusBar = document.createElement("div");
	this.statusBar.setAttribute("class", "statusBar");
	this.element.appendChild(this.statusBar);
	if (this.minimized) {
		this.statusBar.setStyle({"display": "none"});
	}

	// resize handles
	var resizeHandle;

	// Left one
	resizeHandle = document.createElement("div");
	resizeHandle.setAttribute("class", "leftResizeHandle");
	this.statusBar.appendChild(resizeHandle);
	this.leftResizeHandle = new IGadgetResizeHandle(resizeHandle, this, true);

	// Right one
	resizeHandle = document.createElement("div");
	resizeHandle.setAttribute("class", "rightResizeHandle");
	this.statusBar.appendChild(resizeHandle);
	this.rightResizeHandle = new IGadgetResizeHandle(resizeHandle, this, false);

	// extract/snap button
	this.extractButton = document.createElement("div");
	this.extractButton.observe("click",
	                           function() {
	                               this.toggleLayout();
	                           }.bind(this),
	                           false);
	this.statusBar.appendChild(this.extractButton);

	// Initialize lock status
	if (this.layout.dragboard.isLocked()) {
		this.element.addClassName("gadget_window_locked");
	}

	// Initialize transparency status
	if (this.transparency)
		this.element.addClassName("gadget_window_transparent");

	// TODO use setStyle from prototype
	// Position
	this.element.style.left = this.layout.getColumnOffset(this.position.x) + "px";
	this.element.style.top = this.layout.getRowOffset(this.position.y) + "px";
	this.element.style.zIndex = this.zPos;

	// Sizes
	var widthInPixels = this.layout.getWidthInPixels(this.contentWidth);
	this.element.style.width = widthInPixels + "px";
	if (this.minimized) {
		this.contentWrapper.style.borderTop = "0px";
		this.contentWrapper.style.visibility = "hidden";
	}

	// Insert it into the dragboard
	this.layout.dragboard.dragboardElement.appendChild(this.element);

	this._updateExtractOption();

	// Ensure a minimal size
	this.layout._ensureMinimalSize(this, false);

	// Mark as draggable
	this.draggable = new IGadgetDraggable(this);

	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();

	// Notify Context Manager of igadget's position
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.XPOSITION, this.position.x);
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.YPOSITION, this.position.y);

	// Notify Context Manager of igadget's size
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.contentHeight);
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTH, this.contentWidth);
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, contentHeight);
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTHINPIXELS, widthInPixels);

	// Notify Context Manager of the current lock status
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.LOCKSTATUS, this.layout.dragboard.isLocked());

	return this.element;
}

IGadget.prototype.fillWithLabel = function() {
	if(this.igadgetInputHTMLElement != null){
		//hide the input element
		this.igadgetInputHTMLElement.hide();
	}
	
	// get the name
	var nameToShow = this.name;
	if(nameToShow.length>30){
		nameToShow = nameToShow.substring(0, 30)+"...";
	}
	
	if(this.igadgetNameHTMLElement != null){
		// update and show the label
		this.igadgetNameHTMLElement.update(nameToShow);
		this.igadgetNameHTMLElement.show();
	}
	else{
		//create the label
		this.igadgetNameHTMLElement = document.createElement("span");
		this.igadgetNameHTMLElement.innerHTML = nameToShow;
		this.gadgetMenu.appendChild(this.igadgetNameHTMLElement);
		//var spanHTML = nameToShow;
		//new Insertion.Top(this.gadgetMenu, spanHTML);
		//this.igadgetNameHTMLElement = this.gadgetMenu.firstDescendant();
	
		this.igadgetNameHTMLElement.observe('click',
		                                    function(e) {
		                                        Event.stop(e);
		                                        this.fillWithInput();
		                                    }.bind(this)); //do not propagate to div.
	}
}


IGadget.prototype.fillWithInput = function () {
	this.igadgetNameHTMLElement.hide();
	if (this.igadgetInputHTMLElement){
		this.igadgetInputHTMLElement.show();
		this.igadgetInputHTMLElement.setAttribute("value", this.name);
		this.igadgetInputHTMLElement.setAttribute("size", this.name.length+5);
	} else {
		this.igadgetInputHTMLElement = document.createElement("input");
		this.igadgetInputHTMLElement.addClassName("igadget_name");
		this.igadgetInputHTMLElement.setAttribute("type", "text");
		this.igadgetInputHTMLElement.setAttribute("value", this.name);
		this.igadgetInputHTMLElement.setAttribute("size", this.name.length+5);
		this.igadgetInputHTMLElement.setAttribute("maxlength", 30);

		this.gadgetMenu.appendChild(this.igadgetInputHTMLElement);

		this.igadgetInputHTMLElement.observe('blur',
		                                    function(e) {
		                                        Event.stop(e);
		                                        this.fillWithLabel()
		                                    }.bind(this));

		this.igadgetInputHTMLElement.observe('keypress',
		                                    function(e) {
		                                        if(e.keyCode == Event.KEY_RETURN) {
		                                            Event.stop(e);
		                                            e.target.blur();
		                                        }
		                                    }.bind(this));

		this.igadgetInputHTMLElement.observe('change',
		                                    function(e) {
		                                        Event.stop(e);
		                                        this.setName(e.target.value);
		                                    }.bind(this));

		this.igadgetInputHTMLElement.observe('keyup',
		                                    function(e) {
		                                        Event.stop(e);
		                                        e.target.size = (e.target.value.length==0) ? 1 : e.target.value.length + 5;
		                                    }.bind(this));

		/*this.igadgetInputHTMLElement.observe('click',
		                                    function(e) {
		                                        Event.stop(e);
		                                    }); //do not propagate to div.*/
		this.igadgetInputHTMLElement.observe('mousedown',
		                                    function(e) {
		                                        e = e || window.event; // needed for IE
		                                        Event.stop(e);
		                                    });
	}
	this.igadgetInputHTMLElement.focus();
}

/**
 * Set the name of this iGadget. The name of the iGadget is shown at the
 * iGadget's menu bar. Also, this name will be used to refere to this gadget in
 * other parts of the EzWeb Platform, for example it is used in the wiring
 * interface.
 *
 * @param {String} igadgetName New name for this iGadget.
 */
IGadget.prototype.setName = function (igadgetName) {
	function onSuccess() {}
	function onError(transport, e) {
		var msg;

		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}
		msg = interpolate(gettext("Error renaming igadget from persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}

	if (igadgetName != null && igadgetName.length > 0) {
		this.name = igadgetName;
		this.gadgetMenu.setAttribute("title", igadgetName);
		this.igadgetNameHTMLElement.update(this.name);
		var o = new Object;
		o.name = igadgetName;
		o.id = this.id;
		var igadgetData = Object.toJSON(o);
		var params = {'igadget': igadgetData};
		var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
		                                            tabId: this.layout.dragboard.tabId,
		                                            iGadgetId: this.id});
		PersistenceEngineFactory.getInstance().send_update(igadgetUrl, params, this, onSuccess, onError);
	}
}

/**
 * This method must be called to avoid memory leaks caused by circular references.
 */
IGadget.prototype.destroy = function() {
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
		this.menu.remove();
		this.menu = null;
	}
	this.gadget = null;
	this.layout = null;
	this.position = null;
}

/**
 * Removes this igadget form the dragboard. Also this notify EzWeb Platform for
 * remove the igadget form persistence.
 */
IGadget.prototype.remove = function() {
	if (this.element != null) {
		function onSuccess() {}
		function onError(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}
			msg = interpolate(gettext("Error removing igadget from persistence: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}

		var dragboard = this.layout.dragboard;
		if (this.element.parentNode != null) {
			this.layout.removeIGadget(this, true);
		}

		this.element = null;
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		var uri = URIs.GET_IGADGET.evaluate({workspaceId: dragboard.workSpaceId,
		                                     tabId: dragboard.tabId,
		                                     iGadgetId: this.id});
		persistenceEngine.send_delete(uri, this, onSuccess, onError);
	}
}

/**
 * Change the values shown in the configuration form of this igadget to the default ones.
 */
IGadget.prototype._setDefaultPrefsInInterface = function() {
	var prefs = this.gadget.getTemplate().getUserPrefs();
	var curPref;

	for (var i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		curPref.setDefaultValueInInterface(this.prefElements[curPref.getVarName()]);
	}
}

/**
 * Set all preferences of this gadget instance to their default value
 */
IGadget.prototype.setDefaultPrefs = function() {
	var prefs = this.gadget.getTemplate().getUserPrefs();
	var varManager = this.layout.dragboard.getWorkspace().getVarManager();

	for (var i = 0; i < prefs.length; i++) {
		prefs[i].setToDefault(varManager, this.id);
	}

	if (this.configurationVisible)
		this._setDefaultPrefsInInterface();
}

/**
 * This function builds the igadget configuration form.
 */
IGadget.prototype._makeConfigureInterface = function() {

	var varManager = this.layout.dragboard.getWorkspace().getVarManager();
	var prefs = this.gadget.getTemplate().getUserPrefs();

	var interfaceDiv = document.createElement("div");

	if (prefs.length == 0) {
		interfaceDiv.innerHTML = gettext("This IGadget does not have user prefs");
		return interfaceDiv;
	}

	this.prefElements = new Array();

	var row, cell, label, table = document.createElement("table");
	tbody = document.createElement("tbody");
	table.appendChild(tbody);
	for (var i = 0; i < prefs.length; i++) {
		row = document.createElement("tr");

		// Settings label
		cell = document.createElement("td");
		cell.setAttribute("width", "40%"); // TODO
		label = prefs[i].getLabel();
		cell.appendChild(label);
		row.appendChild(cell);

		// Settings control
		cell = document.createElement("td");
		cell.setAttribute("width", "60%"); // TODO
		curPrefInterface = prefs[i].makeInterface(varManager, this.id);
		this.prefElements[curPrefInterface.name] = curPrefInterface;
		Element.extend(this.prefElements[curPrefInterface.name]);
		cell.appendChild(curPrefInterface);
		row.appendChild(cell);

		tbody.appendChild(row);
	}
	interfaceDiv.appendChild(table);

	var buttons = document.createElement("div");
	buttons.setAttribute("class", "buttons");
	buttons.setAttribute("className", "buttons"); //IE hack
	var button;

	// "Set Defaults" button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Set Defaults"));
	Event.observe (button, "click", this._setDefaultPrefsInInterface.bind(this), true);
	buttons.appendChild(button);

	// "Save" button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Save"));
	button.observe("click", function () {this.layout.dragboard.saveConfig(this.id)}.bind(this), true);
	buttons.appendChild(button);

	// "Cancel" button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Cancel"));
	button.observe("click", function () {this.setConfigurationVisible(false)}.bind(this), true);
	buttons.appendChild(button);
	interfaceDiv.appendChild(buttons);

	// clean floats
	var floatClearer = document.createElement("div");
	floatClearer.setAttribute("class", "floatclearer");
	floatClearer.setAttribute("className", "floatclearer"); //IE hack
	interfaceDiv.appendChild(floatClearer);

	return interfaceDiv;
}

/**
 * Sets the size of the igadget's content.
 *
 * @param {Number} newWidth
 * @param {Number} newHeight
 * @param {Boolean} [persist] default: true
 */
IGadget.prototype.setContentSize = function(newWidth, newHeight, persist) {
	persist = persist != undefined ? persist : true;

	if (!this.element) {
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
}

/**
 * This function is called when the browser window is resized.
 *
 * @private
 */
IGadget.prototype._notifyWindowResizeEvent = function() {
	if (!this.element || !this.loaded)
		return;

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

	if ((oldHeight != newHeight) || (oldWidth != newWidth))
		this.layout._notifyResizeEvent(this, oldWidth, oldHeight, newWidth, newHeight, false, false);
	/* TODO end of temporally workaround */
}

/**
 * This function is called when the dragboard is locked or unlocked.
 *
 * @private
 * @param {Boolean} newLockStatus
 */
IGadget.prototype._notifyLockEvent = function(newLockStatus) {
	if (!this.element)
		return;

	if (newLockStatus) {
		this.element.addClassName("gadget_window_locked");
	} else {
		this.element.removeClassName("gadget_window_locked");
	}

	var oldWidth = this.getWidth();
	var oldHeight = this.getHeight();

	this._recomputeHeight(false);

	// Notify Context Manager
	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.LOCKSTATUS, newLockStatus);

	// Notify resize event
	this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.getWidth(), this.getHeight(), false);
}

/**
 * This function is called when the content of the igadget has been loaded completly.
 *
 * @private
 */
IGadget.prototype._notifyLoaded = function() {
	if (!this.loaded) {
		this.loaded = true;

		if (this.errorCount > 0) {
			var msg = ngettext("%(errorCount)s error for the iGadget \"%(name)s\" was notified before it was loaded",
			                   "%(errorCount)s errors for the iGadget \"%(name)s\" were notified before it was loaded",
			                   this.errorCount);
			msg = interpolate(msg, {errorCount: this.errorCount, name: this.name}, true);
			LogManagerFactory.getInstance().log(msg);
			this.errorButtonElement.removeClassName("disabled");
			this._updateErrorInfo();
		}

		this.layout.dragboard.igadgetLoaded(this);

	}

	// Recompute position
	this.element.style.left = this.layout.getColumnOffset(this.position.x) + "px";
	this.element.style.top = this.layout.getRowOffset(this.position.y) + "px";

	// Recompute sizes
	this.setContentSize(this.contentWidth, this.contentHeight, false);

	// Notify to the context manager the igadget has been loaded
	this.layout.dragboard.getWorkspace().getContextManager().propagateInitialValues(this.id);
}

/**
 * @private
 */
IGadget.prototype._recomputeWidth = function() {
	var width = this.layout.getWidthInPixels(this.contentWidth);

	width-= this._computeExtraWidthPixels();
	this.element.style.width = width + "px";

	// Notify Context Manager
	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
	contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTHINPIXELS, width);
}

/**
 * @private
 */
IGadget.prototype._recomputeWrapper = function() {
	if (!this.minimized)
		wrapperHeight = this.content.offsetHeight + this.configurationElement.offsetHeight;
	else
		wrapperHeight = 0;

	this.contentWrapper.setStyle({height: wrapperHeight + "px"});
}

/**
 * @private
 */
IGadget.prototype._computeExtraWidthPixels = function () {
	var windowStyle = window.getComputedStyle(this.element, null);

	var pixels = windowStyle.getPropertyCSSValue("border-left-width").
	             getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += windowStyle.getPropertyCSSValue("border-right-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	return pixels;
}

/**
 * @private
 */
IGadget.prototype._computeExtraHeightPixels = function () {
	var windowStyle = window.getComputedStyle(this.element, null);

	var pixels = windowStyle.getPropertyCSSValue("border-bottom-width").
	             getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += windowStyle.getPropertyCSSValue("border-top-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	var menubarStyle = window.getComputedStyle(this.gadgetMenu, null);
	pixels += menubarStyle.getPropertyCSSValue("border-bottom-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += menubarStyle.getPropertyCSSValue("border-top-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	var statusbarStyle = window.getComputedStyle(this.statusBar, null);
	pixels += statusbarStyle.getPropertyCSSValue("border-bottom-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += statusbarStyle.getPropertyCSSValue("border-top-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	return pixels;
}

/**
 * @private
 */
IGadget.prototype._recomputeHeight = function(basedOnContent) {
	var contentHeight;

	var contextManager = this.layout.dragboard.getWorkspace().getContextManager()

	if (basedOnContent) {
		// Based on content height

		if (!this.minimized) {
			contentHeight = this.layout.fromVCellsToPixels(this.contentHeight);
			var fullSize = contentHeight;
			fullSize += this.gadgetMenu.offsetHeight +
			            this.statusBar.offsetHeight +
			            this.configurationElement.offsetHeight;
			fullSize += this._computeExtraHeightPixels();
			
			processedSize = this.layout.adaptHeight(contentHeight, fullSize);
			contentHeight = processedSize.inPixels;
			this.height = processedSize.inLU;
			this.content.setStyle({height: contentHeight + "px"});

			// Notify Context Manager about the new igadget's size
			contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, contentHeight);

			this._recomputeWrapper();
		} else {
			this._recomputeWrapper();
			contentHeight = this.element.offsetHeight;
			this.content.setStyle({height: "0px"});
			this.height = Math.ceil(this.layout.fromPixelsToVCells(contentHeight));
		}

		// Notify Context Manager about the new igadget's size
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.height);
	} else {
		// Based on full gadget height
		contentHeight = this.layout.getHeightInPixels(this.height);
		contentHeight -= this.configurationElement.offsetHeight + this.gadgetMenu.offsetHeight + this.statusBar.offsetHeight;
		contentHeight -= this._computeExtraHeightPixels();
		this.content.setStyle({height: contentHeight + "px"});
		this.contentHeight = Math.floor(this.layout.fromPixelsToVCells(contentHeight));

		// Notify Context Manager about the new igadget's size
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, contentHeight);

		this._recomputeWrapper();
	}

}

/**
 * @private
 */
IGadget.prototype._recomputeSize = function(basedOnContent) {
	this._recomputeWidth();
	this._recomputeHeight(basedOnContent);
}

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
IGadget.prototype.setSize = function(newWidth, newHeight, resizeLeftSide, persist) {
	// defaults values for the resizeLeftSide and persist parameters
	resizeLeftSide = resizeLeftSide != undefined ? resizeLeftSide : false;
	persist = persist != undefined ? persist : true;

	if (!this.element) {
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
		// Notify Context Manager new igadget's sizes
		var contextManager = this.layout.dragboard.getWorkspace().getContextManager()
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.contentHeight);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTH, this.contentWidth);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, this.content.offsetHeight);
		contextManager.notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTHINPIXELS, this.content.offsetWidth);
	}

	// Notify resize event
	this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.contentWidth, this.height, resizeLeftSide, persist);
}

/**
 * Returns true if this igadget is minimized.
 *
 * @returns {Boolean} true if the iGadget is minimized; false otherwise.
 */
IGadget.prototype.isMinimized = function() {
	return this.minimized;
}

/**
 * Changes minimize status of this igadget
 *
 * @param newStatus new minimize status of the igadget
 */
IGadget.prototype.setMinimizeStatus = function(newStatus) {
	if (this.minimized == newStatus)
		return; // Nothing to do

	// TODO add effects?

	// New Status
	this.minimized = newStatus;

	if (this.minimized) {
		this.contentWrapper.setStyle({"visibility": "hidden" , "border": "0px"});
		this.statusBar.setStyle({"display": "none"});
		this.configurationElement.setStyle({"display": "none"});
		this.minimizeButtonElement.setAttribute("title", gettext("Maximize"));
		this.minimizeButtonElement.setAttribute("alt", gettext("Maximize"));
		this.minimizeButtonElement.removeClassName("minimizebutton");
		this.minimizeButtonElement.addClassName("maximizebutton");
	} else {
		this.contentWrapper.setStyle({"visibility": "visible", "border": null});
		this.statusBar.setStyle({"display": null});
		if (this.configurationVisible == true)
			this.configurationElement.setStyle({"display": "block"});
		this.minimizeButtonElement.setAttribute("title", gettext("Minimize"));
		this.minimizeButtonElement.setAttribute("alt", gettext("Minimize"));
		this.minimizeButtonElement.removeClassName("maximizebutton");
		this.minimizeButtonElement.addClassName("minimizebutton");
	}

	var oldHeight = this.getHeight();
	this._recomputeHeight(true);

	// Notify resize event
	this.layout._notifyResizeEvent(this, this.contentWidth, oldHeight, this.contentWidth, this.getHeight(), false, true);
}

/**
 * Toggles the minimize status of this gadget
 */
IGadget.prototype.toggleMinimizeStatus = function () {
	this.setMinimizeStatus(!this.minimized);
}

/**
 * @private
 */
IGadget.prototype._updateErrorInfo = function () {
	label = ngettext("%(errorCount)s error", "%(errorCount)s errors", this.errorCount);
	label = interpolate(label, {errorCount: this.errorCount}, true);
	this.errorButtonElement.setAttribute("title", label);
}

/**
 * Increments the error count for this igadget
 */
IGadget.prototype.notifyError = function() {
	this.errorCount++
	
	if (this.isVisible()) {
		if (this.errorCount == 1) { // First time
			this.errorButtonElement.removeClassName("disabled");
		}
		this._updateErrorInfo();
	}
}

/**
 * Increments the error count for this igadget
 */
IGadget.prototype.toggleLayout = function() {
	if (this.onFreeLayout())
		this.moveToLayout(this.layout.dragboard.baseLayout);
	else
		this.moveToLayout(this.layout.dragboard.freeLayout);
}

/**
 * Returns true if the configuration form of this igadget is visible
 *
 * @returns true if the configuration form of this igadget is visible; false
 *          otherwise
 */
IGadget.prototype.isConfigurationVisible = function() {
	return this.configurationVisible;
}

/**
 * Changes the visibility status of the configuration form of this igadget
 *
 * @param newValue new visibility status of the configuration form of this
 *                 igadget
 */
IGadget.prototype.setConfigurationVisible = function(newValue) {
	if (this.configurationVisible == newValue)
		return; // Nothing to do

	// New Status
	this.configurationVisible = newValue;

	if (newValue == true) {
		this.configurationElement.appendChild(this._makeConfigureInterface());
		if (this.isMinimized())
			this.configurationElement.setStyle({"display": "none"});
		else
			this.configurationElement.setStyle({"display": "block"});
		this.settingsButtonElement.removeClassName("settingsbutton");
		this.settingsButtonElement.addClassName("settings2button");
	} else {
		this.configurationElement.innerHTML = "";
		this.configurationElement.hide();
		this.settingsButtonElement.removeClassName("settings2button");
		this.settingsButtonElement.addClassName("settingsbutton");
	}

	var oldHeight = this.getHeight();
	this._recomputeHeight(true);

	// Notify resize event
	this.layout._notifyResizeEvent(this, this.contentWidth, oldHeight, this.contentWidth, this.getHeight(), true);
}

/**
 * Toggles the visibility status of the configuration form of this igadget.
 */
IGadget.prototype.toggleConfigurationVisible = function () {
	this.setConfigurationVisible(!this.configurationVisible);
}

/**
 * Saves the values of the preferences from the config form of this igadget.
 */
IGadget.prototype.saveConfig = function() {
	if (this.configurationVisible == false)
		throw new Error(""); // TODO

	var varManager = this.layout.dragboard.getWorkspace().getVarManager();
	var i, curPref, prefElement, validData = true;
	var prefs = this.gadget.getTemplate().getUserPrefs();
	var prefName = null;
	
	for (i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		prefName = curPref.getVarName();
		prefElement = this.prefElements[prefName];
		if (!curPref.validate(curPref.getValueFromInterface(prefElement))) {
			validData = false;
			prefElement.addClassName("invalid");
		} else {
			prefElement.removeClassName("invalid");
		}
	}

	if (!validData)
		throw new Error("Invalid data found"); // Don't save if the data is invalid

	// Start propagation of the new values of the user pref variables
	varManager.incNestingLevel();

	// Annotate new value of the variable without invoking callback function!
	var oldValue, newValue;
	for (var i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		prefName = curPref.getVarName();
		prefElement = this.prefElements[prefName];
		var oldValue = curPref.getCurrentValue(varManager, this.id);
		var newValue = curPref.getValueFromInterface(prefElement);


		if (newValue != oldValue)
			curPref.annotate(varManager, this.id, newValue);
	}

        /* Commit new value of the variable
	   Doing this in 2 phases (first setting the value and then propagating changes)
           avoids reading old values!! */
	
	for (var i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		prefName = curPref.getVarName();
		prefElement = this.prefElements[prefName];
		var oldValue = curPref.getCurrentValue(varManager, this.id);
		var newValue = curPref.getValueFromInterface(prefElement);

		
		curPref.setValue(varManager, this.id, newValue);
	}

	// Commit
	varManager.decNestingLevel();

	this.setConfigurationVisible(false);
}

/**
 * Saves the igadget into persistence. Used only for the first time, that is,
 * for creating igadgets.
 */
IGadget.prototype.save = function() {
	function onSuccess(transport) {
		var igadgetInfo = eval ('(' + transport.responseText + ')');
		this.id = igadgetInfo['id'];
		this.layout.dragboard.addIGadget(this, igadgetInfo);
	}

	function onError(transport, e) {
		var msg;
		if (e) {
			msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
			                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
			                  true);
		} else if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error adding igadget to persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);

		// Remove this iGadget from the layout
		this.layout.removeIGadget(this, true);
		this.destroy();
	}

	var persistenceEngine = PersistenceEngineFactory.getInstance();
	var data = new Hash();
	data['left'] = this.position.x;
	data['top'] = this.position.y;
	data['zIndex'] = this.zPos;
	data['width'] = this.contentWidth;
	data['height'] = this.contentHeight;
	data['name'] = this.name;
	if (this.onFreeLayout())
		data['layout'] = 1;
	else
		data['layout'] = 0;

	var uri = URIs.POST_IGADGET.evaluate({tabId: this.layout.dragboard.tabId,
	                                      workspaceId: this.layout.dragboard.workSpaceId});

	data['uri'] = uri;
	data['gadget'] = URIs.GET_GADGET.evaluate({vendor: this.gadget.getVendor(),
	                                           name: this.gadget.getName(),
	                                           version: this.gadget.getVersion()});
	data = {igadget: data.toJSON()};
	persistenceEngine.send_post(uri , data, this, onSuccess, onError);
}

/**
 * This function migrates this igadget form a layout to another
 *
 * @param {DragboardLayout} newLayout the layout where the iGadget will be moved
 *                          to.
 */
IGadget.prototype.moveToLayout = function(newLayout) {
	if (this.layout == newLayout)
		return;

	// ##### TODO Revise this
	var contentWidth = this.element.offsetWidth;
	var fullWidth = contentWidth;
	contentWidth -= this._computeExtraWidthPixels();

	var contentHeight = this.content.offsetHeight;
	var fullHeight = contentHeight;
	fullHeight += this.gadgetMenu.offsetHeight +
	              this.statusBar.offsetHeight +
	              this.configurationElement.offsetHeight;
	fullHeight += this._computeExtraHeightPixels();
	// ##### END TODO

	var dragboardChange = this.layout.dragboard != newLayout.dragboard;
	var oldLayout = this.layout;
	oldLayout.removeIGadget(this, dragboardChange);

	if (dragboardChange && !(newLayout instanceof FreeLayout)) {
		this.position = null;
	} else {
		this.position.x = oldLayout.getColumnOffset(this.position.x);
		this.position.x = newLayout.adaptColumnOffset(this.position.x).inLU;

		this.position.y = oldLayout.getRowOffset(this.position.y);
		this.position.y = newLayout.adaptRowOffset(this.position.y).inLU;
	}

	// ##### TODO Revise this
	//console.debug("prev width: " + this.contentWidth);
	var newWidth = newLayout.adaptWidth(contentWidth, fullWidth)
	this.contentWidth = newWidth.inLU;
	//console.debug("new width: " + this.contentWidth);

	//console.debug("prev height: " + this.height);
	var newHeight = newLayout.adaptHeight(contentHeight, fullHeight)
	this.height = newHeight.inLU;
	//console.debug("new height: " + this.height);

	// ##### END TODO
	newLayout.addIGadget(this, dragboardChange);
	this._updateExtractOption();

	// Persistence
	var onSuccess = function(transport) { }

	var onError = function(transport, e) {
		var msg;
		if (transport.responseXML) {
			msg = transport.responseXML.documentElement.textContent;
		} else {
			msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("Error saving changes to persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}

	var data = new Hash();
	data['iGadgets'] = new Array();

	var iGadgetInfo = new Hash();
	iGadgetInfo['id'] = this.id;
	iGadgetInfo['top'] = this.position.y;
	iGadgetInfo['left'] = this.position.x;
	iGadgetInfo['zIndex'] = this.zPos;
	iGadgetInfo['width'] = this.contentWidth;
	iGadgetInfo['height'] = this.contentHeight;
	iGadgetInfo['tab'] = this.layout.dragboard.tabId;

	if (this.onFreeLayout())
		iGadgetInfo['layout'] = 1;
	else
		iGadgetInfo['layout'] = 0;

	data['iGadgets'].push(iGadgetInfo);

	data = {igadgets: data.toJSON()};
	var persistenceEngine = PersistenceEngineFactory.getInstance();
	uri = URIs.GET_IGADGETS.evaluate({workspaceId: oldLayout.dragboard.workSpaceId, tabId: oldLayout.dragboard.tabId});
	persistenceEngine.send_update(uri, data, this, onSuccess, onError);
}
