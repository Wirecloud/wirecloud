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
	this.configurationVisible = false;


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

	this.refusedVersion = refusedVersion;
	this.freeLayoutAfterLoading = freeLayoutAfterLoading; //only used the first time the gadget is used to change its layout after loading to FreeLayout
	
	this.readOnly = readOnly;

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

	// Icon element for the iconified mode
	this.iconElement = null;
	this.iconImg = null;
	this.igadgetIconNameHTMLElement =  null;
	this.iconPosition = iconPosition;
	this.iconDraggable =  null;

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
	this.build();
	layout.addIGadget(this, true);

	this.menu_color = menu_color ? menu_color : "FFFFFF";
	//this.menu_color = IGadgetColorManager.autogenColor(menu_color, this.code);
}

/**
 * Returns the associated Gadget.
 *
 * @returns {Gadget} the associated Gadget.
 */
IGadget.prototype.getGadget = function() {
	return this.gadget;
}

IGadget.prototype.invalidIconPosition = function(){
	return (this.iconPosition.x == -1 && this.iconPosition.y == -1); 
}

/**
 * Sets the position of a gadget instance. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 *
 * @param {DragboardPosition} position the new position for the iGadget.
 */
IGadget.prototype.setPosition = function(position) {
	// Set a initial icon position (first time) or it still follows the gadget (both positions are a reference to the same object)
	if (!this.iconPosition){
		this.setIconPosition(new DragboardPosition(-1, -1));
	}
	if (this.onFreeLayout() && this.invalidIconPosition()) {
		this.setIconPosition(position);
	}

	this.position = position;

	if (this.element != null) { // if visible
		this.element.style.left = this.layout.getColumnOffset(position.x) + "px";
		this.element.style.top = this.layout.getRowOffset(position.y) + "px";

		// Notify Context Manager about the new position
		var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
		contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.XPOSITION, this.position.x);
		contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.YPOSITION, this.position.y);
	}
}

/**
 * Sets the position of the associated icon for this iGadget. The position must
 * be specified relative to the top-left square of the icon and using pixels
 * units.
 *
 * @param {DragboardPosition} position the new position for the iGadget icon
 */
IGadget.prototype.setIconPosition = function(position) {
	this.iconPosition = position.clone();
	if (this.iconElement) {
		this.iconElement.style.left = this.layout.dragboard.freeLayout.getColumnOffset(this.iconPosition.x) + "px";
		this.iconElement.style.top = this.layout.dragboard.freeLayout.getRowOffset(this.iconPosition.y) + "px";
	}
}

/**
 * Sets the z coordinate position of this iGadget.
 *
 * @param {Number} zPos the new Z coordinate position for the iGadget.
 */
IGadget.prototype.setZPosition = function(zPos) {
	this.zPos = zPos;

	zPos = zPos !== null ? zPos + 1: "";

	if (this.element)
		this.element.style.zIndex = zPos;
	if (this.iconElement)
		this.iconElement.style.zIndex = zPos;
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
 * Gets the position of a gadget instance minimized. The position is calculated relative
 * to the top-left square of the gadget instance box using cells units.
 *
 * @returns {DragboardPosition} the current position of the iGadget.
 */
IGadget.prototype.getIconPosition = function() {
	return this.iconPosition;
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
 * content with as it depends in the current status of the iGadget (minimized,
 * with the configuration dialog, etc...)
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
	return this.visible;
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
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error renaming igadget from persistence: %(errorMsg)s."), transport, e);
		logManager.log(msg);
	}

	this.element.toggleClassName("gadget_window_transparent");
	this.transparency = !this.transparency;

	//Persist the new state
	var o = new Object();
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
 * Updates the extract/snap from/to grid option.
 *
 * @private
 */
IGadget.prototype._updateExtractOption = function() {
	if (this.extractOptionId == null)
		return;

	if (this.onFreeLayout()) {
		this.menu.updateOption(this.extractOptionId,
		                       _currentTheme.getIconURL('igadget-snap'),
		                       gettext("Snap to grid"),
		                       function() {
		                           this.toggleLayout();
		                           LayoutManagerFactory.getInstance().hideCover();
		                       }.bind(this), "hide_on_lock hide_on_fulldragboard");

		this.extractButton.removeClassName("extractButton");
		this.extractButton.addClassName("snapButton");
		this.extractButton.setAttribute("title", gettext("This iGadget is outside the grid."));
	} else {
		this.menu.updateOption(this.extractOptionId,
		                       _currentTheme.getIconURL('igadget-extract'),
		                       gettext("Extract from grid"),
		                       function() {
		                           this.toggleLayout();
		                           LayoutManagerFactory.getInstance().hideCover();
		                       }.bind(this), "hide_on_lock hide_on_fulldragboard");

		this.extractButton.removeClassName("snapButton");
		this.extractButton.addClassName("extractButton");
		this.extractButton.setAttribute("title", gettext("This iGadget is aligned to the grid."));
	}
}

/**
 * Updates the fulldragboard option.
 *
 * @private
 */
IGadget.prototype._updateFulldragboardOption = function() {
	if (this.fulldragboardOpId == null)
		return;

	if (this.isInFullDragboardMode()) {
		this.menu.updateOption(this.fulldragboardOpId,
		                       _currentTheme.getIconURL('igadget-exit_fulldragboard'),
		                       gettext("Exit Full Dragboard"),
		                       function() {
		                           LayoutManagerFactory.getInstance().hideCover();
		                           this.setFullDragboardMode(!this.isInFullDragboardMode());
		                       }.bind(this),
		                       "hide_on_lock hide_on_minimize");
	} else {
		this.menu.updateOption(this.fulldragboardOpId,
		                       _currentTheme.getIconURL('igadget-fulldragboard'),
		                       gettext("Full Dragboard"),
		                       function() {
		                           LayoutManagerFactory.getInstance().hideCover();
		                           this.setFullDragboardMode(!this.isInFullDragboardMode());
		                       }.bind(this),
		                       "hide_on_lock hide_on_minimize");
	}
}

/**
 * Builds the structure of the gadget
 */
IGadget.prototype.build = function() {
	this.element = document.createElement("div");
	Element.extend(this.element);
	this.element.addClassName("gadget_window");

	// Gadget Menu
	this.gadgetMenu = document.createElement("div");
	Element.extend(this.gadgetMenu);
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
	Element.extend(button);
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
		
		button.observe("click",
		               function() {
		                   LayoutManagerFactory.getInstance().showWindowMenu('cancelService', remove_and_cancel, remove);
		               },
		               false);
	} else {
		button.observe("click",
		               function() {
		                   OpManagerFactory.getInstance().removeInstance(this.id);
		               }.bind(this),
		               false);
	}

	button.setAttribute("title", gettext("Close"));
	button.setAttribute("alt", gettext("Close"));
	this.gadgetMenu.appendChild(button);

	// Menu button
	button = document.createElement("input");
	Element.extend(button);
	button.setAttribute("type", "button");
	button.addClassName("settingsbutton");
	button.setAttribute("id", "settingsbutton");
	
	button.observe("click",
	               function(e) {
	                  LayoutManagerFactory.getInstance().showDropDownMenu('igadgetOps',
	                                                                      this.menu,
	                                                                      Event.pointerX(e),
	                                                                      Event.pointerY(e));
	               }.bind(this),
	               false);

	button.setAttribute("title", gettext("Menu"));
	button.setAttribute("alt", gettext("Menu"));
	this.gadgetMenu.appendChild(button);
	this.settingsButtonElement = button;

	// minimize button
	button = document.createElement("input");
	Element.extend(button);
	button.setAttribute("type", "button");
	button.observe("click", function() {this.toggleMinimizeStatus()}.bind(this), false);
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
	Element.extend(button);
	button.setAttribute("type", "button");
	button.addClassName("button errorbutton disabled");
	Event.observe (button, "click", function() {OpManagerFactory.getInstance().showLogs();}, false);
	this.gadgetMenu.appendChild(button);
	this.errorButtonElement = button;

	// New Version button
	if (!this.gadget.isUpToDate() && !this.isRefusedUpgrade()) {
		button = document.createElement("input");
		Element.extend(button);
		button.setAttribute("type", "button");
		var msg = gettext("There is a new version of this gadget available. Current version: %(currentVersion)s - Last version: %(lastVersion)s");
		msg = interpolate(msg, {currentVersion: this.gadget.getVersion(), lastVersion:this.gadget.getLastVersion()}, true);
		button.setAttribute("title", msg);
		button.setAttribute("id", "version_button_"+this.id);
		button.addClassName("button versionbutton");
		Event.observe (button, "click", function() {
											var msg = gettext('<p><b>Do you really want to update "%(igadgetName)s" to its latest version?</b><br />The gadget state and connections will be kept, if possible.<p>Note: It will reload your workspace</p>');
											msg = interpolate(msg, {igadgetName: this.name}, true);
											LayoutManagerFactory.getInstance().showYesNoDialog(msg, this.upgradeIGadget.bind(this), this.askForIconVersion.bind(this));
										}.bind(this), false);
		this.gadgetMenu.appendChild(button);
	}

	this.fillWithLabel();

	this.element.appendChild(this.gadgetMenu);

	// Content wrapper
	this.contentWrapper = document.createElement("div");
	Element.extend(this.contentWrapper);
	this.contentWrapper.addClassName("gadget_wrapper");
	this.element.appendChild(this.contentWrapper);

	// Gadget configuration (Initially empty and hidden)
	this.configurationElement = document.createElement("div");
	Element.extend(this.configurationElement);
	this.configurationElement.addClassName("config_interface");
	this.contentWrapper.appendChild(this.configurationElement);

	// Gadget Content
	var codeURL = this.gadget.getXHtml().getURICode() + "?id=" + this.id;
	if (BrowserUtilsFactory.getInstance().isIE()) {
		this.content = document.createElement("iframe");
		Element.extend(this.content);
		this.content.addClassName("gadget_object");
		this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml
		this.content.setAttribute("standby", "Loading...");
//		this.content.innerHTML = "Loading...."; // TODO add an animation ?
		this.content.setAttribute("src", codeURL);
		this.content.setAttribute("width", "100%");
		this.content.setAttribute("frameBorder", "0");

	} else { // non IE6
		this.content = document.createElement("object");
		Element.extend(this.content);
		this.content.addClassName("gadget_object");
		this.content.setAttribute("type", "text/html"); // TODO xhtml? => application/xhtml+xml
		this.content.setAttribute("standby", "Loading...");
		this.content.setAttribute("data", codeURL);
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
										this.layout.dragboard.raiseToTop(this)
									}.bind(this), false);

	// resize handles
	var resizeHandle;

	// Left one
	resizeHandle = document.createElement("div");
	Element.extend(resizeHandle);
	resizeHandle.addClassName("leftResizeHandle");
	this.statusBar.appendChild(resizeHandle);
	this.leftResizeHandle = new IGadgetResizeHandle(resizeHandle, this, true);

	// Right one
	resizeHandle = document.createElement("div");
	Element.extend(resizeHandle);
	resizeHandle.addClassName("rightResizeHandle");
	this.statusBar.appendChild(resizeHandle);
	this.rightResizeHandle = new IGadgetResizeHandle(resizeHandle, this, false);

	// extract/snap button
	this.extractButton = document.createElement("div");
	Element.extend(this.extractButton);
	this.extractButton.className = "button";
	this.extractButton.observe("click",
	                           function() {
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
	this.iconImg.setAttribute("src",this.gadget.getIcon());
	this.iconElement.appendChild(this.iconImg);

	// IE hack to allow drag & drop over images
	this.iconImg.ondrag = function() {
		return false;
	}

	this.igadgetIconNameHTMLElement = document.createElement("a");
	Element.extend(this.igadgetIconNameHTMLElement);
	this.igadgetIconNameHTMLElement.update(this.name);
	this.igadgetIconNameHTMLElement.addClassName("floating_gadget_title");
	this.iconElement.appendChild(this.igadgetIconNameHTMLElement);
	
	this.igadgetIconNameHTMLElement.observe("click", function() {
														this.toggleMinimizeStatus(false);
														this.layout.dragboard.raiseToTop(this);
													  }.bind(this), false);
}

/**
 * Paints this gadget instance into the assigned dragboard.
 *
 * @param {Boolean} onInit true if this gadget is being painted on Dragboard
 *        initation.
 */
IGadget.prototype.paint = function(onInit) {
	if (this.visible)
		return; // Do nothing if the iGadget is already painted

	this.visible = true;

	// Initialize preferences menu
	this._createIGadgetMenu();


	// Insert it into the dragboard (initially hidden)
	this.element.style.visibility = "hidden";
	this.layout.dragboard.dragboardElement.appendChild(this.element);

	var codeURL = this.gadget.getXHtml().getURICode() + "?id=" + this.id;
	if (BrowserUtilsFactory.getInstance().isIE()) {
		this.content.setAttribute("src", codeURL);
	} else { // non IE6
		this.content.setAttribute("data", codeURL);
	}

	// Position
	this.element.style.left = this.layout.getColumnOffset(this.position.x) + "px";
	this.element.style.top = this.layout.getRowOffset(this.position.y) + "px";
	this.setZPosition(this.zPos);

	// Select the correct representation for this iGadget (iconified, minimized or normal)
	var minimizedStatusBackup = this.minimized;
	this.minimized = false;
	this._recomputeSize(true);

	this.setMinimizeStatus(minimizedStatusBackup, false, false);

	// Initialize lock status
	var locked = this.layout.dragboard.isLocked();
	if (locked) {
		this._notifyLockEvent(true, false);
	}

	// Initialize transparency status
	if (this.transparency)
		this.element.addClassName("gadget_window_transparent");
	
	//Initialize read-only status
	if (this.readOnly)
		this.element.addClassName("gadget_window_readonly");
		
	// Time to SHOW the igadget (we need to take into account the gadget can be iconified)
	if (!this.onFreeLayout() || !minimizedStatusBackup)
		this.element.style.visibility = "visible";

	// Mark as draggable
	this.draggable = new IGadgetDraggable(this);
	
	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();

	// Notify Context Manager about the new position
	contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.XPOSITION, this.position.x);
	contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.YPOSITION, this.position.y);

	// Notify Context Manager about the new sizes
	contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.HEIGHT, this.contentHeight);
	contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.WIDTH, this.contentWidth);

	// Notify Context Manager about the new sizes
	contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.LOCKSTATUS, this.layout.dragboard.isLocked());

	this.setMenuColor(undefined, true);

	// Icon section
	this.layout.dragboard.dragboardElement.appendChild(this.iconElement);
	this.iconDraggable = new IGadgetIconDraggable(this);
	this.iconElement.style.left = this.layout.dragboard.freeLayout.getColumnOffset(this.iconPosition.x) + "px";
	this.iconElement.style.top = this.layout.dragboard.freeLayout.getRowOffset(this.iconPosition.y) + "px";

	Event.observe(this.iconImg, "click", function() {
												if (this.layout.dragboard.isLocked()) {
													this.setMinimizeStatus(false);
													this.layout.dragboard.raiseToTop(this);
												}
											 }.bind(this), true);
}

IGadget.prototype._createIGadgetMenu = function() {
	var idMenu = 'igadget_menu_' + this.id;

	var menuHTML = $(idMenu);
	if (menuHTML)
		menuHTML.remove();
	this.lowerOpId = null;

	menuHTML = '<div id="'+idMenu+'" class="drop_down_menu"></div>';
	new Insertion.After($('menu_layer'), menuHTML);
	this.menu = new DropDownMenu(idMenu);

	var idColorMenu = 'igadget_color_menu_' + this.id;
	this.colorMenu = IGadgetColorManager.genDropDownMenu(idColorMenu, this.menu, this);

	// Settings
	this.menu.addOption(_currentTheme.getIconURL('igadget-settings'),
	                    gettext("Preferences"),
	                    function() {
	                        this.toggleConfigurationVisible();
	                        LayoutManagerFactory.getInstance().hideCover();
	                    }.bind(this),
	                    0);

	if (!this.is_shared_workspace()) {
		this.menuColorEntryId = this.menu.addOption(_currentTheme.getIconURL('igadget-menu_colors'),
		                                       gettext("Menu Bar Color..."),
		                                       function(e) {
		                                           var menuEntry = $(this.menuColorEntryId);
		                                           if (menuEntry.getBoundingClientRect != undefined) {
		                                               var y = menuEntry.getBoundingClientRect().top;
		                                           } else {
		                                               var y = document.getBoxObjectFor(menuEntry).screenY -
		                                                       document.getBoxObjectFor(document.documentElement).screenY;
		                                           }
		                                           LayoutManagerFactory.getInstance().showDropDownMenu('igadgetOps',
		                                               this.colorMenu,
		                                               Event.pointerX(e),
		                                               y + (menuEntry.offsetHeight/2));
		                                       }.bind(this),
		                                       1);

		this.transparencyEntryId = this.menu.addOption(_currentTheme.getIconURL('igadget-transparency'),
		                                               gettext("Transparency"),
		                                               function() {
		                                                   this.toggleTransparency();
		                                                   LayoutManagerFactory.getInstance().hideCover();
		                                               }.bind(this),
		                                               2);

		// Extract/Snap from/to grid option (see _updateExtractOption)
		this.extractOptionOrder = 2;
		this.extractOptionId = this.menu.addOption("", "", function(){}, this.extractOptionOrder, "hide_on_lock");

		// Initialize snap/extract options
		this._updateExtractOption();

		this.lowerOpId = this.menu.addOption(_currentTheme.getIconURL('igadget-lower'),
		                    gettext("Lower"),
		                    function() {
		                        this.layout.dragboard.lower(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+1, "hide_on_lock");
		this.raiseOpId = this.menu.addOption(_currentTheme.getIconURL('igadget-raise'),
		                    gettext("Raise"),
		                    function() {
		                        this.layout.dragboard.raise(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+2, "hide_on_lock");
		this.lowerToBottomOpId = this.menu.addOption(_currentTheme.getIconURL('igadget-lower_to_bottom'),
		                    gettext("Lower To Bottom"),
		                    function() {
		                        this.layout.dragboard.lowerToBottom(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+3, "hide_on_lock");

		this.raiseToTopOpId = this.menu.addOption(_currentTheme.getIconURL('igadget-raise_to_top'),
		                    gettext("Raise To Top"),
		                    function() {
		                        this.layout.dragboard.raiseToTop(this);
		                        LayoutManagerFactory.getInstance().hideCover();
		                    }.bind(this),
		                    this.extractOptionOrder+4, "hide_on_lock");

		this.fulldragboardOpOrder =  this.extractOptionOrder + 5;
		this.fulldragboardOpId = this.menu.addOption("", "", function(){}, this.fulldragboardOpOrder, "hide_on_lock");
		this._updateFulldragboardOption();
		if (this.isInFullDragboardMode()) {
			this.menu.menu.addClassName("gadget_menu_fulldragboard");
		}
	}
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
		Element.extend(this.igadgetNameHTMLElement);
		this.igadgetNameHTMLElement.innerHTML = nameToShow;
		this.gadgetMenu.appendChild(this.igadgetNameHTMLElement);
	
		this.igadgetNameHTMLElement.observe('click',
		                                    function(e) {
		                                        Event.stop(e);
		                                        this.layout.dragboard.raiseToTop(this);
		                                        this.fillWithInput();
		                                    }.bind(this)); //do not propagate to div.
	}
}


IGadget.prototype.fillWithInput = function () {
	if (!this.layout.dragboard.isLocked()){
		this.igadgetNameHTMLElement.hide();
		if (this.igadgetInputHTMLElement) {
			this.igadgetInputHTMLElement.show();
			this.igadgetInputHTMLElement.setAttribute("value", this.name);
			this.igadgetInputHTMLElement.setAttribute("size", this.name.length+5);
		} else {
			this.igadgetInputHTMLElement = document.createElement("input");
			Element.extend(this.igadgetInputHTMLElement);
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
			                                            var target = BrowserUtilsFactory.getInstance().getTarget(e);
			                                            target.blur();
			                                        }
			                                    }.bind(this));
	
			this.igadgetInputHTMLElement.observe('change',
			                                    function(e) {		                                    
			                                        var target = BrowserUtilsFactory.getInstance().getTarget(e);
			                                        this.setName(target.value);
			                                    }.bind(this));
	
			this.igadgetInputHTMLElement.observe('keyup',
			                                    function(e) {
			                                        Event.stop(e);
			                                        var target = BrowserUtilsFactory.getInstance().getTarget(e);
			                                        target.size = (target.value.length==0) ? 1 : target.value.length + 5;
			                                    }.bind(this));
		}
		this.igadgetInputHTMLElement.focus();
	}
}

/**
 * Sets the name of this iGadget. The name of the iGadget is shown at the
 * iGadget's menu bar. Also, this name will be used to refere to this gadget in
 * other parts of the EzWeb Platform, for example it is used in the wiring
 * interface.
 *
 * @param {String} igadgetName New name for this iGadget.
 */
IGadget.prototype.setName = function (igadgetName) {
	function onSuccess() {}
	function onError(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error renaming igadget from persistence: %(errorMsg)s."), transport, e);
		logManager.log(msg);
	}

	if (igadgetName != null && igadgetName.length > 0) {
		this.name = igadgetName;
		this.gadgetMenu.setAttribute("title", igadgetName);
		this.igadgetNameHTMLElement.update(this.name);
		this.igadgetIconNameHTMLElement.update(this.name);
		var o = new Object();
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

/*
 * Perform the properly actions to show to the user that the gadget has received and event
 */
IGadget.prototype.notifyEvent = function(){
	
	//if the igadget is out of the grid it has to be raised to the top
	if (this.layout instanceof FreeLayout){
		this.layout.dragboard.raiseToTop(this);
		//Moreover, if the igadget is iconified it has to be opened
		if (this.isIconified()) {
			//maximize iconified gadget
			this.toggleMinimizeStatus();
		}
	}
}

IGadget.prototype.isIconified = function(){
	return (this.layout instanceof FreeLayout && this.minimized); 
}

IGadget.prototype.askForIconVersion = function() {
	var msg = gettext('Do you want to remove the notice of the new version available?');
	msg = interpolate(msg, {igadgetName: this.name}, true);
	LayoutManagerFactory.getInstance().showYesNoDialog(msg, function(){this.setRefusedVersion(this.gadget.getLastVersion());}.bind(this));
}

IGadget.prototype.setRefusedVersion = function (v) {
	function onSuccess() {}
	function onError(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error setting the refused version of the igadget to persistence: %(errorMsg)s."), transport, e);
		logManager.log(msg);
	}

	this.refusedVersion = v;
	$("version_button_"+this.id).hide();

	var o = new Object;
	o.refused_version = this.refusedVersion;
	o.id = this.id;
	var igadgetData = Object.toJSON(o);
	var params = {'igadget': igadgetData};
	var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
		                                            tabId: this.layout.dragboard.tabId,
		                                            iGadgetId: this.id});
	PersistenceEngineFactory.getInstance().send_update(igadgetUrl, params, this, onSuccess, onError);
}

/**
 * Checks if the refused version is lower than the last one
 *
 * @returns {Boolean}
 */
IGadget.prototype.isRefusedUpgrade = function() {
	return this.refusedVersion && this.refusedVersion == this.gadget.getLastVersion();
}

/**
 * Update the gadget to its newest version
 */
IGadget.prototype.upgradeIGadget = function() {
	function onUpgradeOk(transport) {
		ShowcaseFactory.getInstance().reload(this.layout.dragboard.workSpaceId);
	}

	function onUpgradeError(transport, e) {
		var msg = gettext('<p>Sorry but the "%(igadgetName)s" gadget <b>cannot be automatically updated</b> because its version is not compatible ' +
				'with the last version.<br/>If you want to update the gadget you must replace <b>by hand</b> the existing one with the gadget ' +
				'available in the catalogue.</p><b>Do you want to remove the notice of the new version available?</b>');
		msg = interpolate(msg, {igadgetName: this.name}, true);
		LayoutManagerFactory.getInstance().showYesNoDialog(msg, function(){this.setRefusedVersion(this.gadget.getLastVersion());}.bind(this));
	}

	var o = new Object;
	o.id = this.id;
	o.newResourceURL = this.gadget.getLastVersionURL();
	var igadgetData = Object.toJSON(o);
	var params = {'igadget': igadgetData};
	var igadgetUrl = URIs.PUT_IGADGET_VERSION.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
	                                            tabId: this.layout.dragboard.tabId,
	                                            iGadgetId: this.id});

	PersistenceEngineFactory.getInstance().send_update(igadgetUrl, params, this, onUpgradeOk, onUpgradeError);
}


/**
 * Sets the background color of the menu bar.
 *
 * @param {String|Color} newColor
 */
IGadget.prototype.setMenuColor = function (newColor, temporal) {
	temporal = temporal != undefined ? temporal : false;

	if (newColor == undefined) {
		newColor = this.menu_color;
		temporal = true;
	}

	this.gadgetMenu.style.backgroundColor = IGadgetColorManager.color2css(newColor);

	if (temporal)
		return;

	function onSuccess() {}
	function onError(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error updating igadget's menu color into persistence: %(errorMsg)s."), transport, e);
		logManager.log(msg);
	}

	this.menu_color = newColor;
	var persistenceEngine = PersistenceEngineFactory.getInstance();
	var data = new Hash();
	data['id'] = this.id;
	data['menu_color'] = IGadgetColorManager.color2hex(this.menu_color);
	var params = {'igadget': data.toJSON()};
	var igadgetUrl = URIs.GET_IGADGET.evaluate({workspaceId: this.layout.dragboard.workSpaceId,
	                                            tabId: this.layout.dragboard.tabId,
	                                            iGadgetId: this.id});
	persistenceEngine.send_update(igadgetUrl, params, this, onSuccess, onError);
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
	if (this.element != null && !this.layout.dragboard.isLocked()) {
		function onSuccess() {}
		function onError(transport, e) {
			var logManager = LogManagerFactory.getInstance();
			var msg = logManager.formatError(gettext("Error removing igadget from persistence: %(errorMsg)s."), transport, e);
			logManager.log(msg);
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
		interfaceDiv.innerHTML = gettext("This IGadget does not have any user prefs");
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
	Element.extend(buttons);
	buttons.addClassName("buttons");
	var button;

	// "Set Defaults" button
	button = document.createElement("input");
	Element.extend(button);
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Set Defaults"));
	Event.observe (button, "click", this._setDefaultPrefsInInterface.bind(this), true);
	buttons.appendChild(button);

	// "Save" button
	button = document.createElement("input");
	Element.extend(button);
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Save"));
	button.observe("click", function () {this.layout.dragboard.saveConfig(this.id)}.bind(this), true);
	buttons.appendChild(button);

	// "Cancel" button
	button = document.createElement("input");
	Element.extend(button);
	button.setAttribute("type", "button");
	button.setAttribute("value", gettext("Cancel"));
	button.observe("click", function () {this.setConfigurationVisible(false)}.bind(this), true);
	buttons.appendChild(button);
	interfaceDiv.appendChild(buttons);

	// clean floats
	var floatClearer = document.createElement("div");
	Element.extend(floatClearer);
	floatClearer.addClassName("floatclearer");
	interfaceDiv.appendChild(floatClearer);

	return interfaceDiv;
}

/**
 * Sets the content size.
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
	if (!this.element)
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
IGadget.prototype._notifyLockEvent = function(newLockStatus, reserveSpace) {
	if (!this.element)
		return;

	var oldWidth = this.getWidth();
	var oldHeight = this.getHeight();

	if (newLockStatus) {
		this.element.addClassName("gadget_window_locked");
		this.menu.menu.addClassName("gadget_menu_locked");
	} else {
		this.element.removeClassName("gadget_window_locked");
		this.menu.menu.removeClassName("gadget_menu_locked");
	}

	this._recomputeHeight(false);

	// Notify Context Manager
	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
	contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.LOCKSTATUS, newLockStatus);

	// Notify resize event
	reserveSpace = reserveSpace != null ? reserveSpace : true;
	if (reserveSpace)
		this.layout._notifyResizeEvent(this, oldWidth, oldHeight, this.getWidth(), this.getHeight(), false);
}

/**
 * This function is called when the content of the igadget has been loaded completly.
 *
 * @private
 */
IGadget.prototype._notifyLoaded = function() {
	// ie6 bugs
	if (window.IE7) IE7.recalc();

	if (this.loaded)
		return;

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

	var unloadElement;
	if (BrowserUtilsFactory.getInstance().isIE()) {
		unloadElement = this.content;
	} else {
		unloadElement = this.content.contentDocument.defaultView;
	}

	Event.observe(unloadElement, 'unload',
	                     function () {
	                         OpManagerFactory.getInstance().igadgetUnloaded(this.id);
	                     }.bind(this),
	                     true);
	
	// Check if the gadget has its correct layout
	if (this.freeLayoutAfterLoading){
		//Change the layout to extract the igadget from the grid
		this.toggleLayout();
	}                 
}

/**
 * This function is called when the content of the igadget is going to be unloaded.
 *
 * @private
 */
IGadget.prototype._notifyUnloaded = function() {
	if (!this.loaded)
		return;

	this.loaded = false;
}

/**
 * @private
 */
IGadget.prototype._recomputeWidth = function() {
	var width = this.layout.getWidthInPixels(this.contentWidth);

	width-= this._computeExtraWidthPixels();

	if (width < 0)
		width = 0;

	this.element.style.width = width + "px";

	// Notify Context Manager
	var contextManager = this.layout.dragboard.getWorkspace().getContextManager();
	contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.WIDTHINPIXELS, width);
}

/**
 * @private
 */
IGadget.prototype._recomputeWrapper = function(contentHeight) {
	var wrapperHeight;

	if (!this.minimized) {
		contentHeight = contentHeight ? contentHeight : parseInt(this.content.offsetHeight);
		wrapperHeight = contentHeight + this.configurationElement.offsetHeight;
	} else {
		wrapperHeight = 0;
	}

	this.contentWrapper.setStyle({height: wrapperHeight + "px"});
}

/**
 * @private
 */
IGadget.prototype._computeExtraWidthPixels = function () {
	var windowStyle = document.defaultView.getComputedStyle(this.element, null);

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
	var windowStyle = document.defaultView.getComputedStyle(this.element, null);

	var pixels = windowStyle.getPropertyCSSValue("border-bottom-width").
	             getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += windowStyle.getPropertyCSSValue("border-top-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	var menubarStyle = document.defaultView.getComputedStyle(this.gadgetMenu, null);
	pixels += menubarStyle.getPropertyCSSValue("border-bottom-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);
	pixels += menubarStyle.getPropertyCSSValue("border-top-width").
	          getFloatValue(CSSPrimitiveValue.CSS_PX);

	var statusbarStyle = document.defaultView.getComputedStyle(this.statusBar, null);
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

	var oldHeight = this.height;

	if (!this.minimized) {
		if (basedOnContent) {
			// Based on content height

			contentHeight = this.layout.fromVCellsToPixels(this.contentHeight);
			var fullSize = contentHeight;
			fullSize += this.gadgetMenu.offsetHeight +
			            this.statusBar.offsetHeight +
			            this.configurationElement.offsetHeight;
			fullSize += this._computeExtraHeightPixels();

			var processedSize = this.layout.adaptHeight(contentHeight, fullSize);
			contentHeight = processedSize.inPixels;
			this.height = processedSize.inLU;
			this.content.setStyle({height: contentHeight + "px"});
		} else {
			// Based on full gadget height
			contentHeight = this.layout.getHeightInPixels(this.height);
			contentHeight -= this.configurationElement.offsetHeight + this.gadgetMenu.offsetHeight + this.statusBar.offsetHeight;
			contentHeight -= this._computeExtraHeightPixels();

			if (contentHeight < 0)
				contentHeight = 0;

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
		// Notify Context Manager new sizes
		var contextManager = this.layout.dragboard.getWorkspace().getContextManager()
		contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.HEIGHT, this.contentHeight);
		contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.WIDTH, this.contentWidth);
		contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.HEIGHTINPIXELS, this.content.offsetHeight);
		contextManager.notifyModifiedGadgetConcept(this, Concept.prototype.WIDTHINPIXELS, this.content.offsetWidth);
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
IGadget.prototype.setMinimizeStatus = function(newStatus, persistence, reserveSpace) {
	if (this.minimized == newStatus)
		return; // Nothing to do

	// TODO add effects?

	// New Status
	this.minimized = newStatus;

	if (this.minimized) {
		this.menu.menu.addClassName('gadget_menu_minimized');
		this.configurationElement.setStyle({"display": "none"});

		if (this.onFreeLayout()) {
			// Floating gadget
			this.element.setStyle({"visibility": "hidden"});
			this.iconElement.setStyle({"display": "block"});
		} else {
			// Linked to the grid
			this.contentWrapper.setStyle({"visibility": "hidden" , "border": "0px"});
			this.statusBar.setStyle({"display": "none"});
			this.minimizeButtonElement.setAttribute("title", gettext("Maximize"));
			this.minimizeButtonElement.setAttribute("alt", gettext("Maximize"));
			this.minimizeButtonElement.removeClassName("minimizebutton");
			this.minimizeButtonElement.addClassName("maximizebutton");
		}
	} else {
		this.menu.menu.removeClassName('gadget_menu_minimized');
		if (this.configurationVisible == true)
				this.configurationElement.setStyle({"display": "block"});
		this.minimizeButtonElement.setAttribute("title", gettext("Minimize"));
		this.minimizeButtonElement.setAttribute("alt", gettext("Minimize"));
		this.minimizeButtonElement.removeClassName("maximizebutton");
		this.minimizeButtonElement.addClassName("minimizebutton");
		this.contentWrapper.setStyle({"visibility": "visible", "border": ""});

		if (this.onFreeLayout()) {
			// Floating gadget
			this.element.setStyle({"visibility": "visible"});
			this.iconElement.setStyle({"display": "none"});
		} else {
			//Linked to the grid
			this.statusBar.setStyle({"display": ""});
		}
	}

	var oldHeight = this.getHeight();
	this._recomputeHeight(true);

	// Notify resize event
	reserveSpace = reserveSpace != null ? reserveSpace : true;
	if (reserveSpace) {
		var persist = persistence;
		if (persist == null)
			persist = true;
		this.layout._notifyResizeEvent(this, this.contentWidth, oldHeight, this.contentWidth, this.getHeight(), false, persist, reserveSpace);
	}
}

IGadget.prototype.isInFullDragboardMode = function() {
	return this.layout instanceof FullDragboardLayout;
}

IGadget.prototype.setFullDragboardMode = function(enable) {
	if (this.isInFullDragboardMode() == enable)
		return;

	var dragboard = this.layout.dragboard;

	if (enable) {
		this.previousContentWidth = this.contentWidth;
		this.previousHeight = this.height;
		this.previousLayout = this.layout;
		this.previousPosition = this.position.clone();

		this.moveToLayout(dragboard.fulldragboardLayout);
		dragboard.raiseToTop(this);
		this.menu.menu.addClassName("gadget_menu_fulldragboard");
	} else {
		this.moveToLayout(this.previousLayout);
		this.menu.menu.removeClassName("gadget_menu_fulldragboard");
	}

}

/**
 * Toggles the minimize status of this gadget
 */
IGadget.prototype.toggleMinimizeStatus = function (persistence) {
	this.setMinimizeStatus(!this.minimized, persistence);
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

	/*
	 * The new value is commited with 2 phases (first setting the value and then
	 * propagating changes). This avoids the case where igadgets read old values.
	 */

	// Phase 1
	// Annotate new value of the variable without invoking callback function!
	var oldValue, newValue;
	for (i = 0; i < prefs.length; i++) {
		curPref = prefs[i];
		prefName = curPref.getVarName();
		prefElement = this.prefElements[prefName];
		var oldValue = curPref.getCurrentValue(varManager, this.id);
		var newValue = curPref.getValueFromInterface(prefElement);

		if (newValue != oldValue)
			curPref.annotate(varManager, this.id, newValue);
	}

	// Phase 2
	// Commit new value of the variable
	for (i = 0; i < prefs.length; i++) {
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
 * Check if the igadget belongs to a shared workspace
 */
IGadget.prototype.is_shared_workspace = function() {
	return this.layout.dragboard.getWorkspace().isShared();
}

/**
 * Saves the igadget into persistence. Used only for the first time, that is,
 * for creating igadgets.
 */
IGadget.prototype.save = function() {
	function onSuccess(transport) {
		var igadgetInfo = JSON.parse(transport.responseText);
		this.id = igadgetInfo['id'];
		this.layout.dragboard.addIGadget(this, igadgetInfo);
		
	}

	function onError(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error adding igadget to persistence: %(errorMsg)s."), transport, e);
		logManager.log(msg);

		// Remove this iGadget from the layout
		this.layout.removeIGadget(this, true);
		this.destroy();
	}

	var persistenceEngine = PersistenceEngineFactory.getInstance();
	var data = new Hash();
	data['left'] = this.position.x;
	data['top'] = this.position.y;
	data['icon_left'] = this.iconPosition.x;
	data['icon_top'] = this.iconPosition.y;
	data['zIndex'] = this.zPos;
	data['width'] = this.contentWidth;
	data['height'] = this.contentHeight;
	data['name'] = this.name;
	data['menu_color'] = IGadgetColorManager.color2css(this.menu_color).substring(1, 7); // TODO
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

	var minimizeOnFinish = false;
	if (this.minimized) {
		minimizeOnFinish = true;
		this.toggleMinimizeStatus();
	}

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

	// Force an unload event
	if (dragboardChange)
		OpManagerFactory.getInstance().igadgetUnloaded(this.id);

	oldLayout.removeIGadget(this, dragboardChange);


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

	// ##### TODO Revise this
	if (oldLayout instanceof FullDragboardLayout) {
		this.contentWidth = this.previousContentWidth;
		this.height = this.previousHeight;
	} else {
		//console.debug("prev width: " + this.contentWidth);
		var newWidth = newLayout.adaptWidth(contentWidth, fullWidth)
		this.contentWidth = newWidth.inLU;
		//console.debug("new width: " + this.contentWidth);

		//console.debug("prev height: " + this.height);
		var newHeight = newLayout.adaptHeight(contentHeight, fullHeight)
		this.height = newHeight.inLU;
		//console.debug("new height: " + this.height);
	}
	// ##### END TODO

	newLayout.addIGadget(this, dragboardChange);
	this._updateExtractOption();
	if (oldLayout instanceof FullDragboardLayout || newLayout instanceof FullDragboardLayout)
		this._updateFulldragboardOption();

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

	// TODO create a changes manager
	// Persistence
	var onSuccess = function(transport) { }

	var onError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error saving changes to persistence: %(errorMsg)s."), transport, e);
		logManager.log(msg);
	}

	var data = new Hash();
	data['iGadgets'] = new Array();

	var iGadgetInfo = new Hash();
	iGadgetInfo['id'] = this.id;
	if (!(newLayout instanceof FullDragboardLayout)) {
		iGadgetInfo['top'] = this.position.y;
		iGadgetInfo['left'] = this.position.x;
		iGadgetInfo['width'] = this.contentWidth;
		iGadgetInfo['height'] = this.contentHeight;

		if (this.onFreeLayout())
			iGadgetInfo['layout'] = 1;
		else
			iGadgetInfo['layout'] = 0;

		iGadgetInfo['fulldragboard'] = false;
	} else {
		iGadgetInfo['fulldragboard'] = true;
	}

	iGadgetInfo['icon_top'] = this.iconPosition.y;
	iGadgetInfo['icon_left'] = this.iconPosition.x;
	iGadgetInfo['zIndex'] = this.zPos;
	iGadgetInfo['tab'] = this.layout.dragboard.tabId;

	data['iGadgets'].push(iGadgetInfo);

	data = {'igadgets': data.toJSON()};
	var persistenceEngine = PersistenceEngineFactory.getInstance();
	uri = URIs.GET_IGADGETS.evaluate({workspaceId: oldLayout.dragboard.workSpaceId, tabId: oldLayout.dragboard.tabId});
	persistenceEngine.send_update(uri, data, this, onSuccess, onError);
}

function IGadgetColorManager () {
	this.colors = ["FFFFFF", "EFEFEF", "DDDDDD", "97A0A8", "FF9999", "FF3333","FFD4AA", "FFD42A", "FFFFCC", "FFFF66", "CCFFCC", "A8D914", "D4E6FC", "CCCCFF", "349EE8", "FFCCFF", "FF99FF"];
}

IGadgetColorManager.prototype.autogenColor = function(color, seed) {
	if (color === undefined || color === null)
		return this.colors[seed % this.colors.length];
	else
		return color;
}

IGadgetColorManager.prototype.genDropDownMenu = function(idColorMenu, parentMenu, iGadget) {
	var updateColorFunc = function (newColor) {
		iGadget.setMenuColor(newColor, true);
	}

	var endFunc = function (newColor) {
		iGadget.setMenuColor(newColor, false);
	}

	var colorMenu = new ColorDropDownMenu(idColorMenu,
	                                      parentMenu,
	                                      endFunc,
	                                      {onMouseOver: updateColorFunc,
	                                       onMouseOut: updateColorFunc});

	for (var i = 0; i < this.colors.length; i++)
		colorMenu.appendColor(this.colors[i]);

	return colorMenu;
}

IGadgetColorManager.prototype.color2css = function(color) {
	if (typeof color === "string")
		return '#' + color;
	else
		return "rgb(" + color.red.cssText + ", " + color.green.cssText + ", " + color.blue.cssText + ")";
}

IGadgetColorManager.prototype.color2hex = function(color) {
	if (typeof color === "string") {
		return color;
	} else {
		function component2hex(component) {
			return "0123456789ABCDEF".charAt(Math.floor(component / 16)) +
			       "0123456789ABCDEF".charAt(component % 16);
		}
		return component2hex(color.red.cssText) +
		       component2hex(color.green.cssText) +
		       component2hex(color.blue.cssText);
	}
}

IGadgetColorManager = new IGadgetColorManager();
