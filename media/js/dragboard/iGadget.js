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
 * This class represents a instance of a Gadget.
 * @author aarranz
 */
function IGadget(gadget, iGadgetId, iGadgetCode, iGadgetName, layout, position, width, height, minimized, dragboard) {
	this.id = iGadgetId;
	this.code = iGadgetCode;
	this.name = iGadgetName;
	this.gadget = gadget;
	this.layout = layout;
	this.position = position;
	this.contentWidth = width;
	this.contentHeight = height;
	this.loaded = false;

	this.dragboard = dragboard;

	if (!minimized)
		this.height = this.contentHeight + layout.getExtraCells();
	else
		this.height = layout.getMenubarSizeInCells();

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
	this.statusBar = null;

	this.errorCount = 0;
}

/**
 * Returns the associated Gadget.
 */
IGadget.prototype.getGadget = function() {
	return this.gadget;
}

/**
 * Sets the position of a gadget instance. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 */
IGadget.prototype.setPosition = function(position) {
	this.position = position;

	if (this.element != null) { // if visible
		this.element.style.left = this.layout.getColumnOffset(position.x) + "px";
		this.element.style.top = this.layout.getRowOffset(position.y) + "px";

		// Notify Context Manager of igadget's position
		this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.XPOSITION, this.position.x);
		this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.YPOSITION, this.position.y);
	}
}

/**
 * Gets the position of a gadget instance. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 */
IGadget.prototype.getPosition = function() {
	return this.position;
}

/**
 * Return the content width in cells.
 */
IGadget.prototype.getContentWidth = function() {
	return this.contentWidth;
}

/**
 * Return the content height in cells.
 */
IGadget.prototype.getContentHeight = function() {
	return this.contentHeight;
}

/**
 * Return the Tab of the IGadget
 */
IGadget.prototype.getTab = function() {
	return this.dragboard.tab;
}

/**
 * Return the actual width of the gadget in cells. This depends in the status of
 * the gadget (minimized, with the configuration dialog, etc...)
 */
IGadget.prototype.getWidth = function() {
	// For now, the igadget width is always the width of the igadget content
	return this.contentWidth;
}

/**
 * Return the actual height of the gadget in cells. This depends in the status
 * of the gadget (minimized, with the configuration dialog, etc...)
 */
IGadget.prototype.getHeight = function() {
	return this.height;
}

IGadget.prototype.getId = function() {
	return this.id;
}

IGadget.prototype.getElement = function() {
	return this.element;
}

/**
 * Returns true if the igadget is actually visible in a dragboard.
 */
IGadget.prototype.isVisible = function() {
	return this.element != null;
}

/**
 * Paints the gadget instance
 * @param where HTML Element where the igadget will be painted
 */
IGadget.prototype.paint = function() {
	if (this.element != null) // exit if the igadgets is already visible
		return; // TODO exception

	var contentHeight = this.layout.fromVCellsToPixels(this.contentHeight);

	this.element = document.createElement("div");

	// Sync lock status
	if (this.dragboard.isLocked()) {
		this.element.class = "gadget_window_locked";
		this.element.className = "gadget_window_locked"; //IE hack
	} else {
		this.element.class = "gadget_window";
		this.element.className = "gadget_window"; //IE hack
	}

	// Gadget Menu
	this.gadgetMenu = document.createElement("div");
	this.gadgetMenu.setAttribute("class", "gadget_menu");
	this.gadgetMenu.setAttribute("className", "gadget_menu"); //IE hack

	// Gadget title
	this.gadgetMenu.setAttribute("title", this.name);

	// buttons. Inserted from right to left
	var button;

	// close button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("class", "closebutton");
	button.setAttribute("className", "closebutton"); //IE hack
	Event.observe (button, "click", function() {OpManagerFactory.getInstance().removeInstance(this.id);}.bind(this), true);
	button.setAttribute("title", gettext("Close"));
	button.setAttribute("alt", gettext("Close"));
	this.gadgetMenu.appendChild(button);

	// settings button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("class", "settingsbutton");
	button.setAttribute("className", "settingsbutton"); //IE hack
	Event.observe (button, "click", function() {this.toggleConfigurationVisible(this.id);}.bind(this), true);
	button.setAttribute("title", gettext("Preferences"));
	button.setAttribute("alt", gettext("Preferences"));
	this.gadgetMenu.appendChild(button);
	this.settingsButtonElement = button;

	// minimize button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	Event.observe (button, "click", function() {this.toggleMinimizeStatus()}.bind(this), true);
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
	this.contentWrapper.setAttribute("class", "gadget_wrapper");
	this.contentWrapper.setAttribute("className", "gadget_wrapper"); //IE hack
	this.element.appendChild(this.contentWrapper);

	// Gadget configuration (Initially empty and hidden)
	this.configurationElement = document.createElement("form");
	this.configurationElement.setAttribute("class", "config_interface");
	this.configurationElement.setAttribute("className", "config_interface"); //IE hack
	Event.observe(this.configurationElement, "submit", function(){return false;}) //W3C and IE compliant
	this.contentWrapper.appendChild(this.configurationElement);

	// Gadget Content
	if (BrowserUtilsFactory.getInstance().getBrowser() == "IE6") {
		this.content = document.createElement("iframe"); 
		this.content.setAttribute("class", "gadget_object"); 
		this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml 
		this.content.setAttribute("src", this.gadget.getXHtml().getURICode() + "?id=" + this.id); 
		this.content.setAttribute("standby", "Loading...");
		this.content.setAttribute("onload", "OpManagerFactory.getInstance().igadgetLoaded("+this.id+")");
//		this.content.innerHTML = "Loading...."; // TODO add an animation ?

		this.content.setAttribute("width", "100%");
		this.content.setAttribute("height", contentHeight + "px");
	} else { //non IE6
		this.content = document.createElement("object"); 
		this.content.setAttribute("class", "gadget_object"); 
		this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml 
		this.content.setAttribute("data", this.gadget.getXHtml().getURICode() + "?id=" + this.id); 
		this.content.setAttribute("standby", "Loading...");
		this.content.setAttribute("onload", "OpManagerFactory.getInstance().igadgetLoaded("+this.id+")");  
		this.content.innerHTML = "Loading...."; // TODO add an animation ?
	
		this.content.setStyle({"width": "100%", "height": contentHeight + "px"});
	}
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
	new IGadgetResizeHandle(resizeHandle, this, true);

	// Right one
	resizeHandle = document.createElement("div");
	resizeHandle.setAttribute("class", "rightResizeHandle");
	this.statusBar.appendChild(resizeHandle);
	new IGadgetResizeHandle(resizeHandle, this, false);

	// TODO use setStyle from prototype
	// Position
	this.element.style.left = this.layout.getColumnOffset(this.position.x) + "px";
	this.element.style.top = this.layout.getRowOffset(this.position.y) + "px";

	// Sizes
	var widthInPixels = this.layout.getWidthInPixels(this.contentWidth);
	this.element.style.width = widthInPixels + "px";
	if (this.minimized) {
		this.contentWrapper.style.borderTop = "0px";
		this.contentWrapper.style.visibility = "hidden";
	}

	// Insert it into the dragboard
	this.layout.dragboard.dragboardElement.appendChild(this.element);

	// Recompute sizes
	//this._recomputeSize(true);

	// Mark as draggable
	new IGadgetDraggable(this);

	// Notify Context Manager of igadget's position
	this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.XPOSITION, this.position.x);
	this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.YPOSITION, this.position.y);

	// Notify Context Manager of igadget's size
	this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.contentHeight);
	this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTH, this.contentWidth);
	this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, contentHeight);
	this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTHINPIXELS, widthInPixels);

	// Notify Context Manager of the current lock status
	this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.LOCKSTATUS, this.dragboard.isLocked());

	return this.element;
}

IGadget.prototype.fillWithLabel = function() {
	if(this.igadgetNameHTMLElement != null){
		this.igadgetNameHTMLElement.remove();
	}
	var nameToShow = this.name;
	if(nameToShow.length>30){
		nameToShow = nameToShow.substring(0, 30)+"...";	
	}
	
	this.igadgetNameHTMLElement = document.createElement("span");
	this.igadgetNameHTMLElement.innerHTML = nameToShow;
	this.gadgetMenu.appendChild(this.igadgetNameHTMLElement);
	//var spanHTML = nameToShow;
	//new Insertion.Top(this.gadgetMenu, spanHTML);
	//this.igadgetNameHTMLElement = this.gadgetMenu.firstDescendant();
	
	Event.observe(this.igadgetNameHTMLElement, 'click', function(e){Event.stop(e);this.fillWithInput();}.bind(this)); //do not propagate to div.	
}


IGadget.prototype.fillWithInput = function () {
	this.igadgetNameHTMLElement.remove();
	this.igadgetNameHTMLElement = document.createElement("input");
	this.igadgetNameHTMLElement.setAttribute("class", "igadget_name");
	this.igadgetNameHTMLElement.setAttribute("className", "igadget_name");
	this.igadgetNameHTMLElement.setAttribute("type", "text");
	this.igadgetNameHTMLElement.setAttribute("value", this.name);
	this.igadgetNameHTMLElement.setAttribute("size", this.name.length+5);
	this.igadgetNameHTMLElement.setAttribute("maxlength", 30);
	
	this.gadgetMenu.appendChild(this.igadgetNameHTMLElement);
	
	//var inputHTML = "<input class='igadget_name' type='text' value='"+this.name+"' size='"+this.name.length+"' maxlength='30' />";
	//new Insertion.Bottom(this.gadgetMenu, inputHTML);
	//this.igadgetNameHTMLElement =  this.gadgetMenu.firstDescendant();
	
	this.igadgetNameHTMLElement.focus();	
	Event.observe(this.igadgetNameHTMLElement, 'blur', function(e){Event.stop(e);
				this.fillWithLabel()}.bind(this));
	Event.observe(this.igadgetNameHTMLElement, 'keypress', function(e){if(e.keyCode == Event.KEY_RETURN){Event.stop(e);
				e.target.blur();}}.bind(this));					
	Event.observe(this.igadgetNameHTMLElement, 'change', function(e){Event.stop(e);
				this.updateName(e.target.value);}.bind(this));
	Event.observe(this.igadgetNameHTMLElement, 'keyup', function(e){Event.stop(e);
				e.target.size = (e.target.value.length==0)?1:e.target.value.length+5;}.bind(this));
	Event.observe(this.igadgetNameHTMLElement, 'click', function(e){Event.stop(e);}); //do not propagate to div.
}

IGadget.prototype.updateName = function (igadgetName){
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
		var o = new Object;
		o.name = igadgetName;
		o.id = this.id;
		var igadgetData = Object.toJSON(o);
		var params = {'igadget': igadgetData};
		var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.dragboard.workSpaceId, tabId: this.dragboard.tabId, iGadgetId: this.id});
		PersistenceEngineFactory.getInstance().send_update(igadgetUrl, params, this, onSuccess, onError);
	}
}

/**
 * This method must be called to avoid memory leaks caused by circular references.
 */
IGadget.prototype.destroy = function() {
	this.gadget = null;
	this.layout = null;
	this.position = null;
	this.dragboard = null;
}

/**
 * Removes this igadget form the dragboard. Also this notify EzWeb Platform for remove the igadget form persistence.
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

		if (this.element.parentNode != null) {
			this.layout.removeIGadget(this, true);
		}

		this.element = null;
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		var uri = URIs.GET_IGADGET.evaluate({workspaceId: this.dragboard.workSpaceId, tabId: this.dragboard.tabId, iGadgetId: this.id});
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
	var varManager = this.dragboard.workSpace.getVarManager();

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

	var varManager = this.dragboard.workSpace.getVarManager();
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
	Event.observe (button, "click", function () {this.dragboard.saveConfig(this.id)}.bind(this), true);
	buttons.appendChild(button);

	// "Cancel" button
	button = document.createElement("input");
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Cancel"));
	Event.observe (button, "click", function () {this.setConfigurationVisible(false)}.bind(this), true);
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
 * TODO
 * Sets the size of the igadget's content.
 */
IGadget.prototype.setContentSize = function(newWidth, newHeight, persist) {
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
 */
IGadget.prototype._notifyWindowResizeEvent = function() {
	if (!this.element)
		return;

	// Recompute position
	this.element.style.left = this.layout.getColumnOffset(this.position.x) + "px";
	this.element.style.top = this.layout.getRowOffset(this.position.y) + "px";

	// Recompute width
	this._recomputeWidth();
}

/**
 * This function is called when the dragboard is locked or unlocked.
 */
IGadget.prototype._notifyLockEvent = function(newLockStatus) {
	if (!this.element)
		return;

	if (newLockStatus) {
		this.element.class = "gadget_window_locked";
		this.element.className = "gadget_window_locked"; //IE hack
	} else {
		this.element.class = "gadget_window";
		this.element.className = "gadget_window"; //IE hack
	}

	var oldWidth = this.getWidth();
	var oldHeight = this.getHeight();

	this._recomputeHeight(false);

	// Notify Context Manager
	this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.LOCKSTATUS, newLockStatus);

	// Notify resize event
	this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.getWidth(), this.getHeight(), false);
}

/**
 * This function is called when the content of the igadget has been loaded completly
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

		this.dragboard.igadgetLoaded(this);
	}

	this.setContentSize(this.contentWidth, this.contentHeight);

	// Notify to the context manager the igadget has been loaded
	this.dragboard.getWorkspace().getContextManager().propagateInitialValues(this.id);
}

IGadget.prototype._recomputeWidth = function() {
	var width = this.layout.getWidthInPixels(this.contentWidth);

	width-= this._computeExtraWidthPixels();
	this.element.style.width = width + "px";

	// Notify Context Manager
	this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTHINPIXELS, width);
}

IGadget.prototype._recomputeWrapper = function() {
	var wrapperHeight;
	if (!this.minimized)
		wrapperHeight = this.content.offsetHeight + this.configurationElement.offsetHeight;
	else
		wrapperHeight = 0;

	this.contentWrapper.setStyle({height: wrapperHeight + "px"});
}

IGadget.prototype._computeExtraWidthPixels = function () {
	var windowStyle = window.getComputedStyle(this.element, null);

	var pixels = windowStyle.getPropertyCSSValue("border-left-width").
	             getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += windowStyle.getPropertyCSSValue("border-right-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	return pixels;
}

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

IGadget.prototype._recomputeHeight = function(basedOnContent) {
	var contentHeight;

	if (basedOnContent) {
		// Based on content height

		if (!this.minimized) {
			contentHeight = this.layout.fromVCellsToPixels(this.contentHeight);
			var fullSize = contentHeight;
			fullSize += this.gadgetMenu.offsetHeight +
			            this.statusBar.offsetHeight +
			            this.configurationElement.offsetHeight;
			fullSize += this._computeExtraHeightPixels();
			
			fullSize += this.layout.topMargin + this.layout.bottomMargin;
			var paddedFullSizeInCells = Math.ceil(this.layout.fromPixelsToVCells(fullSize));
			var paddedFullSize = this.layout.fromVCellsToPixels(paddedFullSizeInCells);

			contentHeight += paddedFullSize - fullSize;
			this.height = paddedFullSizeInCells;
			this.content.setStyle({height: contentHeight + "px"});

			// Notify Context Manager about the new igadget's size
			this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, contentHeight);
		} else {
			this._recomputeWrapper();
			contentHeight = this.element.offsetHeight;
			this.content.setStyle({height: "0px"});
			this.height = Math.ceil(this.layout.fromPixelsToVCells(contentHeight));
		}

		// Notify Context Manager about the new igadget's size
		this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.height);
	} else {
		// Based on full gadget height
		contentHeight = this.layout.getHeightInPixels(this.height);
		contentHeight -= this.configurationElement.offsetHeight + this.gadgetMenu.offsetHeight + this.statusBar.offsetHeight;
		contentHeight -= this._computeExtraHeightPixels();
		this.content.setStyle({height: contentHeight + "px"});
		this.contentHeight = Math.floor(this.layout.fromPixelsToVCells(contentHeight));

		// Notify Context Manager about the new igadget's size
		this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, contentHeight);
	}

	this._recomputeWrapper();
}

IGadget.prototype._recomputeSize = function(basedOnContent) {
	this._recomputeWidth();
	this._recomputeHeight(basedOnContent);
}

/**
 * Sets the absolute size of the igadget. See setContentSize for resizing the area for the igadget content.
 *
 * @param newWidth the new width of this igadget in cells. This will be the
 *                 final width for this gadget.
 * @param newHeight the new height of this igadget in cells. This will be the
 *                  final height for this gadget (that is, counting the
 *                  igadget's title bar, the configuration form, etc)
 * @param resizeLeftSide true if the gadget will be resized using the topRight
 *                       as base point.
 * @param persist true if is needed to send the new widths/positions of the
 *                igadgets (the resize operation can move other igadgets) to
 *                persistence.
 */
IGadget.prototype._setSize = function(newWidth, newHeight, resizeLeftSide, persist) {
	var oldWidth = this.getWidth();
	var oldHeight = this.getHeight();

	// Assign new values
	this.contentWidth = newWidth;
	this.height = newHeight;

	// Recompute sizes
	this._recomputeSize(false);

	if (persist) {
		// Notify Context Manager new igadget's sizes
		this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHT, this.contentHeight);
		this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTH, this.contentWidth);
		this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.HEIGHTINPIXELS, this.content.offsetHeight);
		this.dragboard.getWorkspace().getContextManager().notifyModifiedGadgetConcept(this.id, Concept.prototype.WIDTHINPIXELS, this.content.offsetWwidth);
	}

	// Notify resize event
	this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.contentWidth, this.height, resizeLeftSide, persist);
}

/**
 * Returns true if this igadget is minimized.
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
		this.statusBar.setStyle({"display": "block"});
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

IGadget.prototype._updateErrorInfo = function () {
	label = ngettext("%(errorCount)s error", "%(errorCount)s errors", this.errorCount);
	label = interpolate(label, {errorCount: this.errorCount}, true);
	this.errorButtonElement.setAttribute("title", label);
}

/**
 * Increment the error counter of this igadget
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
 * Returns true if the configuration form of this igadget is visible
 */
IGadget.prototype.isConfigurationVisible = function() {
	return this.configurationVisible;
}

/**
 * Changes the visibility status of the configuration form of this igadget
 *
 * @param newValue new visibility status of the configuration form of this igadget
 */
IGadget.prototype.setConfigurationVisible = function(newValue) {
	if (this.configurationVisible == newValue)
		return;

	if (newValue == true) {
		this.configurationVisible = true;
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
		this.configurationVisible = false;
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

	var varManager = this.dragboard.workSpace.getVarManager();
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

	var oldValue, newValue;
	for (i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		prefName = curPref.getVarName();
		prefElement = this.prefElements[prefName];
		var oldValue = curPref.getCurrentValue(varManager, this.id);
		var newValue = curPref.getValueFromInterface(prefElement);

		if (newValue != oldValue)
			curPref.setValue(varManager, this.id, newValue);
	}

	// Commit
	varManager.decNestingLevel();

	this.setConfigurationVisible(false);
}

/**
 * Saves the igadget into persistence. Used only for the first time, that is, for creating igadgets.
 */
IGadget.prototype.save = function() {
	function onSuccess(transport) {
		var igadgetInfo = eval ('(' + transport.responseText + ')');
		this.id = igadgetInfo['id'];
		this.dragboard.addIGadget(this, igadgetInfo);
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
	data['width'] = this.contentWidth;
	data['height'] = this.contentHeight;
	data['code'] = this.code;
	data['name'] = this.name;

	var uri = URIs.POST_IGADGET.evaluate({tabId: this.dragboard.tabId, workspaceId: this.dragboard.workSpaceId});

	data['uri'] = uri;
	data['gadget'] = URIs.GET_GADGET.evaluate({vendor: this.gadget.getVendor(),
	                                           name: this.gadget.getName(),
	                                           version: this.gadget.getVersion()});
	data = {igadget: data.toJSON()};
	persistenceEngine.send_post(uri , data, this, onSuccess, onError);
}

/**
 * This function migrates this igadget form a layout to another
 */
IGadget.prototype.moveToLayout = function(layout) {
	if (this.layout == layout)
		return;

	var dragboardChange = this.dragboard != layout.dragboard;
	var oldLayout = this.layout;
	oldLayout.removeIGadget(this, dragboardChange);

	this.layout = layout;
	this.dragboard = layout.dragboard;
	this.position = null;

	this.layout.addIGadget(this, dragboardChange);

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
	iGadgetInfo['tab'] = this.dragboard.tabId;
	iGadgetInfo['code'] = this.code;

	data['iGadgets'].push(iGadgetInfo);

	data = {igadgets: data.toJSON()};
	var persistenceEngine = PersistenceEngineFactory.getInstance();
	uri = URIs.GET_IGADGETS.evaluate({workspaceId: oldLayout.dragboard.workSpaceId, tabId: oldLayout.dragboard.tabId});
	persistenceEngine.send_update(uri, data, this, onSuccess, onError);
}
