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
 * @author aarranz
 */
function Dragboard(tab, workSpace, dragboardElement) {
	// *********************************
	// PRIVATE VARIABLES
	// *********************************
	this.loaded = false;
	this.currentCode = 1;
	this.dragboardElement;
	this.baseLayout = null;
	this.freeLayout = null;
	this.gadgetToMove = null;
	this.iGadgets = new Hash();
	this.iGadgetsByCode = new Hash();
	this.tab = tab;
	this.tabId = tab.tabInfo.id;
	this.workSpace = workSpace;
	this.workSpaceId = workSpace.workSpaceState.id;
	this.fixed = false;

	// ***********************
	// PRIVATE FUNCTIONS 
	// ***********************
	Dragboard.prototype.paint = function () {
		this.dragboardElement.innerHTML = "";

		this.baseLayout.initialize();
		this.freeLayout.initialize();
	}

	/**
	 * Update igadget status in persistence
	 */
	this._commitChanges = function(keys) {
		keys = keys || this.iGadgetsByCode.keys();

		var onSuccess = function(transport) { }

		var onError = function(transport, e) {
			var msg;
			if (transport.responseXML) {
				msg = transport.responseXML.documentElement.textContent;
			} else {
				msg = "HTTP Error " + transport.status + " - " + transport.statusText;
			}

			msg = interpolate(gettext("Error committing dragboard changes to persistence: %(errorMsg)s."), {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}

		// TODO only send real changes
		var iGadget, iGadgetInfo, uri, position;
		var data = new Hash();
		data['iGadgets'] = new Array();

		for (var i = 0; i < keys.length; i++) {
			iGadget = this.iGadgetsByCode[keys[i]];
			iGadgetInfo = new Hash();
			position = iGadget.getPosition();
			iGadgetInfo['id'] = iGadget.id;
			iGadgetInfo['top'] = position.y;
			iGadgetInfo['left'] = position.x;
			iGadgetInfo['zIndex'] = iGadget.zPos;
			iGadgetInfo['minimized'] = iGadget.isMinimized() ? "true" : "false";
			iGadgetInfo['width'] = iGadget.getContentWidth();
			iGadgetInfo['height'] = iGadget.getContentHeight();
			iGadgetInfo['tab'] = this.tabId;
			iGadgetInfo['transparency'] = iGadget.transparency;

			data['iGadgets'].push(iGadgetInfo);
		}

		data = {igadgets: data.toJSON()};
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		uri = URIs.GET_IGADGETS.evaluate({workspaceId: this.workSpaceId, tabId: this.tabId});
		persistenceEngine.send_update(uri, data, this, onSuccess, onError);
	}

	// ****************
	// PUBLIC METHODS 
	// ****************

	Dragboard.prototype.recomputeSize = function() {
	    var keys = this.iGadgets.keys();
	    //unloading igadgets
	    for (var i = 0; i < keys.length; i++)
		this.iGadgets[keys[i]].unload();
	}

	Dragboard.prototype.recomputeSize = function() {
		this.baseLayout._notifyWindowResizeEvent();
		this.freeLayout._notifyWindowResizeEvent();
	}

	Dragboard.prototype.hide = function () {
		LayoutManagerFactory.getInstance().hideView(this.dragboardElement);
	}

	/**
	 * This method must be called to avoid memory leaks caused by circular references.
	 */
	Dragboard.prototype.destroy = function () {
		this.baseLayout.destroy();
		this.freeLayout.destroy();
		this.baseLayout = null;
		this.freeLayout = null;

		var keys = this.iGadgets.keys();
		//disconect and delete the connectables and variables of all tab iGadgets
		for (var i = 0; i < keys.length; i++)
			this.workSpace.removeIGadgetData(keys[i]);

		this.iGadgets = null;
		this.iGadgetsByCode = null;

		Element.remove(this.dragboardElement);

		//TODO: have all references been removed?,delete the object
	}

	/**
	 * Returns true if the dragboard is locked.
	 */
	Dragboard.prototype.isLocked = function () {
		return this.fixed;
	}

	/**
	 * Locks and unlocks the dragboard according to the newLockStatus
	 * parameter.
	 *
	 * @param newLockStatus true to make dragboard  be locked or false for
	 *                      having an editable dragboard (where you can
	 *                      move, resize, etc the gadget instances).
	 */
	Dragboard.prototype.setLock = function (newLockStatus) {
		if (this.fixed == newLockStatus)
			return; // No change in status => nothing to do

		this.fixed = newLockStatus;
		if (this.fixed)
			this.dragboardElement.addClassName("fixed");
		else
			this.dragboardElement.removeClassName("fixed");

		var iGadget;

		// propagate the fixed status change event
		var igadgetKeys = this.iGadgets.keys();
		for (var i = 0; i < igadgetKeys.length; i++) {
			iGadget = this.iGadgets[igadgetKeys[i]];
			iGadget._notifyLockEvent(this.fixed);
		}

		// Save to persistence
		var onSuccess = function (transport) {}

		var onError = function (transport, e) {
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
			msg = interpolate(gettext("Error changing tab lock status: %(errorMsg)s."),
			                          {errorMsg: msg}, true);
			LogManagerFactory.getInstance().log(msg);
		}

		var tabUrl = URIs.TAB.evaluate({'workspace_id': this.workSpace.workSpaceState.id, 'tab_id': this.tabId});
		var data = new Hash();
		data.locked = newLockStatus ? "true" : "false";
		var params = {'tab': data.toJSON()};
		PersistenceEngineFactory.getInstance().send_update(tabUrl, params, this, onSuccess, onError);
	}

	/**
	 * Toggles the current lock status of the dragboard.
	 */
	Dragboard.prototype.toggleLock = function() {
		this.setFixed(!this.fixed);
	}

	Dragboard.prototype.parseTab = function(tabInfo) {
		var curIGadget, position, zPos, width, height, igadget, gadget, gadgetid, minimized, layout;

		var opManager = OpManagerFactory.getInstance();

		this.currentCode = 1;
		this.iGadgets = new Hash();
		this.iGadgetsByCode = new Hash();

		if (tabInfo.locked == "true") {
			this.fixed = true;
			this.dragboardElement.addClassName("fixed");
		}

		// For controlling when the igadgets are totally loaded!
		this.igadgets = tabInfo.igadgetList;
		this.igadgetsToLoad = tabInfo.igadgetList.length;
		for (var i = 0; i < this.igadgets.length; i++) {
			curIGadget = this.igadgets[i];

			// Parse gadget id
			gadgetid = curIGadget.gadget.split("/");
			gadgetid = gadgetid[2] + "_" + gadgetid[3] + "_" + gadgetid[4];
			// Get gadget model
			gadget = ShowcaseFactory.getInstance().getGadget(gadgetid);

			// Parse width, height and the position of the igadget
			width = parseInt(curIGadget.width);
			height = parseInt(curIGadget.height);
			position = new DragboardPosition(parseInt(curIGadget.left), parseInt(curIGadget.top));
			zPos = parseInt(curIGadget.zIndex);

			// Parse layout field
			if (curIGadget.layout == 0) {
				layout = this.baseLayout;
			} else {
				layout = this.freeLayout;
			}

			// Parse minimize status
			minimized = curIGadget.minimized == "true" ? true : false;
			
			// Parse transparency status
			transparency = curIGadget.transparency == "true" ? true : false;

			// Create instance model
			igadget = new IGadget(gadget, curIGadget.id, curIGadget.name, layout, position, zPos, width, height, minimized, transparency);
		}

		this.loaded = true;
	}

	/**
	 * Creates a new instance of the given gadget and inserts it into this
	 * dragboard.
	 *
	 * @param gadget the gadget to use for creating the instance
	 */
	Dragboard.prototype.addInstance = function (gadget) {
		if ((gadget == null) || !(gadget instanceof Gadget))
			return; // TODO exception

		if (this.isLocked()) {
			var msg = gettext("The destination tab (%(tabName)s) is locked. Try to unlock it or select an unlocked tab.");
			msg = interpolate(msg, {tabName: this.tab.tabInfo.name}, true);
			LayoutManagerFactory.getInstance().showMessageMenu(msg);
			return;
		}

		// This is the layout where the iGadget will be inserted
		var layout = this.baseLayout; // TODO For now insert it always in the baseLayout

		var template = gadget.getTemplate();
		//var width = layout.unitConvert(template.getWidth() + "cm", CSSPrimitiveValue.CSS_PX)[0];
		//width = layout.adaptWidth(width, width).inLU;
		var width = template.getWidth();
		var height = template.getHeight();

		// Check if the gadget doesn't fit in the dragboard
		if (layout instanceof ColumnLayout) {
			var maxColumns = layout.getColumns();
			if (width > maxColumns) {
				// TODO warning
				width = maxColumns;
			}
		}

		// Create the instance
		var igadgetName = gadget.getName() + ' (' + this.currentCode + ')';
		var iGadget = new IGadget(gadget, null, igadgetName, layout, null, null, width, height, false);

		iGadget.save();
	}

	Dragboard.prototype.removeInstance = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];

		igadget.remove();
		igadget.destroy();

		this._deregisterIGadget(igadget);
	}

	Dragboard.prototype.igadgetLoaded = function (iGadget) {
		if (!this.iGadgets[iGadget.id]) {
			// TODO log
			return;
		}

		this.igadgetsToLoad--;
	}


	Dragboard.prototype.getRemainingIGadgets = function () {
		return this.igadgetsToLoad;
	}


	Dragboard.prototype.saveConfig = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		try {
			igadget.saveConfig();

			igadget.setConfigurationVisible(false);
		} catch (e) {
		}
	}

	Dragboard.prototype.setDefaultPrefs = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		igadget.setDefaultPrefs();
	}

	Dragboard.prototype.notifyErrorOnIGadget = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		igadget.notifyError();
	}

	Dragboard.prototype.getIGadgets = function() {
		return this.iGadgets.values();
	}

	Dragboard.prototype.getIGadget = function (iGadgetId) {
		return this.iGadgets[iGadgetId];
	}

	Dragboard.prototype.getWorkspace = function () {
		return this.workSpace;
	}

	/**
	 * Registers an iGadget into this dragboard.
	 *
	 * @private
	 * @param iGadget the iGadget to register
	 */
	Dragboard.prototype._registerIGadget = function (iGadget) {
		if (iGadget.id)
			this.iGadgets[iGadget.id] = iGadget;

		iGadget.code = this.currentCode++

		this.iGadgetsByCode[iGadget.code] = iGadget;
	}

	/**
	 * Deregisters an iGadget from this dragboard.
	 *
	 * @private
	 * @param iGadget the iGadget to register
	 */
	Dragboard.prototype._deregisterIGadget = function (iGadget) {
		delete this.iGadgets[iGadget.id];
		delete this.iGadgetsByCode[iGadget.code];

		iGadget.code = null;
	}

	Dragboard.prototype.addIGadget = function (iGadget, igadgetInfo) {
		if (!this.iGadgetsByCode[iGadget.code])
			throw new Exception();

		this.iGadgets[iGadget.id] = iGadget;
		this.workSpace.addIGadget(this.tab, iGadget, igadgetInfo);
	}

	// *******************
	// INITIALIZING CODE
	// *******************
	this.dragboardElement = dragboardElement;

	/*
	 * nº columns                         = 20
	 * cell height                        = 12 pixels
	 * vertical Margin between IGadgets   = 2 pixels
	 * horizontal Margin between IGadgets = 4 pixels
	 * scroll bar reserved space          = 17 pixels
	 */
	this.baseLayout = new SmartColumnLayout(this, 20, 12, 2, 4, 17);

	this.freeLayout = new FreeLayout(this, 17);

	this.parseTab(tab.tabInfo);
}

/////////////////////////////////////
// DragboardPosition
/////////////////////////////////////
function DragboardPosition(x, y) {
	this.x = x;
	this.y = y;
}

DragboardPosition.prototype.clone = function() {
	return new DragboardPosition(this.x, this.y);
}

/////////////////////////////////////
// DragboardCursor
/////////////////////////////////////

/**
 * @class This class represents a dragboard cursor. It is usually used in drag
 *        & drop operations and always represents the place where an iGadget is
 *        going to be placed.
 *
 * @author Álvaro Arranz
 *
 * @param iGadget iGadget that is going to be represented by the new dragboard
 *                cursor
 */
function DragboardCursor(iGadget) {
	var positiontmp = iGadget.getPosition();
	this.position = positiontmp.clone();

	this.layout = iGadget.layout;
	this.width = iGadget.getWidth();
	this.height = iGadget.getHeight();
	this.heightInPixels = iGadget.element.offsetHeight;
	this.widthInPixels = iGadget.element.offsetWidth;
}

DragboardCursor.prototype.getWidth = function() {
	return this.width;
}

DragboardCursor.prototype.getHeight = function() {
	return this.height;
}

DragboardCursor.prototype.paint = function(dragboard) {
	var dragboardCursor = document.createElement("div");
	dragboardCursor.setAttribute("id", "dragboardcursor");

	// Set width and height
	dragboardCursor.style.height = this.heightInPixels + "px";
	dragboardCursor.style.width = this.widthInPixels + "px";

	// Set position
	dragboardCursor.style.left = (this.layout.getColumnOffset(this.position.x) - 2) + "px"; // TODO -2 px for borders
	dragboardCursor.style.top = (this.layout.getRowOffset(this.position.y) - 2) + "px"; // TODO -2 px for borders

	// assign the created element
	dragboard.appendChild(dragboardCursor);
	this.element = dragboardCursor;
}

/**
 * This method must be called to avoid memory leaks caused by circular
 * references.
 */
DragboardCursor.prototype.destroy = function() {
	if (this.element != null) {
		this.element.parentNode.removeChild(this.element);
		this.element = null;
	}
}

DragboardCursor.prototype.getWidth = function() {
	return this.width;
}

DragboardCursor.prototype.getPosition = IGadget.prototype.getPosition;

DragboardCursor.prototype.setPosition = function (position) {
	this.position = position;

	if (this.element != null) { // if visible
		this.element.style.left = (this.layout.getColumnOffset(position.x) - 2) + "px"; // TODO -2 px for borders
		this.element.style.top = (this.layout.getRowOffset(position.y) - 2) + "px"; // TODO -2 px for borders
	}
}

/////////////////////////////////////
// Drag and drop support
/////////////////////////////////////
EzWebEffectBase = new Object();
EzWebEffectBase.findDragboardElement = function(element) {
	var tmp = element.parentNode;
	while (tmp) {
		var position = document.defaultView.getComputedStyle(tmp, null).getPropertyValue("position");
		switch (position) {
		case "relative":
		case "absolute":
		case "fixed":
			return tmp;
		}

		tmp = tmp.parentNode;
	}
	return null; // Not found
}

function Draggable(draggableElement, handler, data, onStart, onDrag, onFinish) {
	var xDelta = 0, yDelta = 0;
	var xStart = 0, yStart = 0;
	var yScroll = 0;
	var xOffset = 0, yOffset = 0;
	var x, y;
	var dragboardCover;
	var draggable = this;

	// remove the events
	function enddrag(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		Event.stopObserving (document, "mouseup", enddrag);
		Event.stopObserving (document, "mousemove", drag);

		dragboardCover.parentNode.stopObserving("scroll", scroll);
		dragboardCover.parentNode.removeChild(dragboardCover);
		dragboardCover = null;

		onFinish(draggable, data);

		Event.observe (handler, "mousedown", startdrag);

		document.onmousedown = null; // reenable context menu
		document.oncontextmenu = null; // reenable text selection

		return false;
	}

	// fire each time it's dragged
	function drag(e) {
		e = e || window.event; // needed for IE

		var screenX = parseInt(e.screenX);
		var screenY = parseInt(e.screenY);
		xDelta = xStart - screenX;
		yDelta = yStart - screenY;
		xStart = screenX;
		yStart = screenY;
		y = y - yDelta;
		x = x - xDelta;
		draggableElement.style.top = y + 'px';
		draggableElement.style.left = x + 'px';

		onDrag(e, draggable, data, x + xOffset, y + yOffset);
	}

	// initiate the drag
	function startdrag(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		document.oncontextmenu = function() { return false; }; // disable context menu
		document.onmousedown = function() { return false; }; // disable text selection
		Event.stopObserving (handler, "mousedown", startdrag);

		xStart = parseInt(e.screenX);
		yStart = parseInt(e.screenY);
		y = draggableElement.offsetTop;
		x = draggableElement.offsetLeft;
		draggableElement.style.top = y + 'px';
		draggableElement.style.left = x + 'px';
		Event.observe (document, "mouseup", enddrag);
		Event.observe (document, "mousemove", drag);

		onStart(draggable, data);

		var dragboard = EzWebEffectBase.findDragboardElement(draggableElement);
		dragboardCover = document.createElement("div");
		dragboardCover.setAttribute("class", "cover");
		dragboardCover.observe("mouseup" , enddrag, true);
		dragboardCover.observe("mousemove", drag, true);

		dragboardCover.style.zIndex = "1000000";
		dragboardCover.style.position = "absolute";
		dragboardCover.style.top = "0";
		dragboardCover.style.left = "0";
		dragboardCover.style.width = "100%";
		dragboardCover.style.height = dragboard.scrollHeight + "px";

		yScroll = parseInt(dragboard.scrollTop);

		dragboard.observe("scroll", scroll);

		dragboard.insertBefore(dragboardCover, dragboard.firstChild);

		return false;
	}

	// fire each time the dragboard is scrolled while dragging
	function scroll(e) {
		e = e || window.event; // needed for IE

		var dragboard = dragboardCover.parentNode;
		dragboardCover.style.height = dragboard.scrollHeight + "px";
		var scrollTop = parseInt(dragboard.scrollTop);
		var scrollDelta = yScroll - scrollTop;
		y -= scrollDelta;
		yScroll = scrollTop;

		draggableElement.style.top = y + 'px';
		draggableElement.style.left = x + 'px';

		onDrag(e, draggable, data, x + xOffset, y + yOffset);
	}

	// cancels the call to startdrag function
	function cancelbubbling(e) {
		e = e || window.event; // needed for IE
		Event.stop(e);
	}

	// add mousedown event listener
	Event.observe (handler, "mousedown", startdrag);
	var children = handler.childElements();
	for (var i = 0; i < children.length; i++)
		Event.observe (children[i], "mousedown", cancelbubbling);

	/**********
	 * Public methods
	 **********/

	this.setXOffset = function(offset) {
		xOffset = offset;
	}

	this.setYOffset = function(offset) {
		yOffset = offset;
	}
}

/////////////////////////////////////
// IGadget drag & drop support
/////////////////////////////////////
function IGadgetDraggable (iGadget) {
	var context = new Object();
	context.iGadget = iGadget;
	Draggable.call(this, iGadget.element, iGadget.gadgetMenu, context,
	                     IGadgetDraggable.prototype.startFunc,
	                     IGadgetDraggable.prototype.updateFunc,
	                     IGadgetDraggable.prototype.finishFunc);
}

IGadgetDraggable.prototype.startFunc = function (draggable, context) {
	context.layout = context.iGadget.layout;
	context.dragboard = context.layout.dragboard;
	context.currentTab = context.dragboard.tabId;
	context.layout.initializeMove(context.iGadget, draggable);
	context.oldZIndex = context.iGadget.getZPosition();
	context.iGadget.setZPosition("999999");
}

IGadgetDraggable.prototype.updateFunc = function (event, draggable, context, x, y) {
	var element = null;

	// Check if the mouse is over a tab
	if (y < 0)
		element = document.elementFromPoint(event.clientX, event.clientY);

	var id = null;
	if (element != null && element instanceof Element) {
		id = element.getAttribute("id");
		if (id == null && element.parentNode instanceof Element) {
			element = element.parentNode;
			id = element.getAttribute("id");
		}

		if (id != null) {
			var result = id.match(/tab_(\d+)_(\d+)/);
			if (result != null && result[2] != context.currentTab) {
				if (context.selectedTab == result[2])
					return;

				if (context.selectedTabElement != null)
					context.selectedTabElement.removeClassName("selected");

				context.selectedTab = result[2];
				context.selectedTabElement = element;
				context.selectedTabElement.addClassName("selected");
				context.layout.disableCursor();
				return;
			}
		}
	}

	// The mouse is not over a tab
	// The cursor must allways be inside the dragboard
	var position = context.layout.getCellAt(x, y);
	if (position.y < 0)
		position.y = 0;
	if (position.x < 0)
		position.x = 0;
	if (context.selectedTabElement != null)
		context.selectedTabElement.removeClassName("selected");
	context.selectedTab = null;
	context.selectedTabElement = null;
	context.layout.moveTemporally(position.x, position.y);
	return;
}

IGadgetDraggable.prototype.finishFunc = function (draggable, context) {
	context.iGadget.setZPosition(context.oldZIndex);

	if (context.selectedTab != null) {
		context.layout.cancelMove();
		var dragboard = context.dragboard.workSpace.getTab(context.selectedTab).getDragboard();

		var destLayout;
		if (context.iGadget.onFreeLayout())
			destLayout = dragboard.freeLayout;
		else
			destLayout = dragboard.baseLayout;

		context.iGadget.moveToLayout(destLayout);

		var tabElement = context.selectedTabElement;
		setTimeout(function() {
			tabElement.removeClassName("selected");
		}, 500);

		context.selectedTab = null;
		context.selectedTabElement = null;
	} else {
		context.layout.acceptMove();
	}

	context.dragboard = null;
}

/////////////////////////////////////
// resize support
/////////////////////////////////////

function ResizeHandle(resizableElement, handleElement, data, onStart, onResize, onFinish) {
	var xDelta = 0, yDelta = 0;
	var xStart = 0, yStart = 0;
	var dragboardCover;
	var x, y;

	// remove the events
	function endresize(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		Event.stopObserving(document, "mouseup", endresize);
		Event.stopObserving(document, "mousemove", resize);

		dragboardCover.parentNode.stopObserving("scroll", scroll);
		dragboardCover.parentNode.removeChild(dragboardCover);
		dragboardCover = null;

		handleElement.stopObserving("mouseup", endresize, true);
		handleElement.stopObserving("mousemove", resize, true);

		onFinish(resizableElement, handleElement, data);

		// Restore start event listener
		handleElement.observe("mousedown", startresize);

		document.onmousedown = null; // reenable context menu
		document.oncontextmenu = null; // reenable text selection

		return false;
	}

	// fire each time the mouse is moved while resizing
	function resize(e) {
		e = e || window.event; // needed for IE

		xDelta = xStart - parseInt(e.screenX);
		yDelta = yStart - parseInt(e.screenY);
		xStart = parseInt(e.screenX);
		yStart = parseInt(e.screenY);
		y = y - yDelta;
		x = x - xDelta;

		onResize(resizableElement, handleElement, data, x, y);
	}

	// fire each time the dragboard is scrolled while dragging
	function scroll() {
		var dragboard = dragboardCover.parentNode;
		dragboardCover.style.height = dragboard.scrollHeight + "px";
		var scrollTop = parseInt(dragboard.scrollTop);
		var scrollDelta = yScroll - scrollTop;
		y -= scrollDelta;
		yScroll = scrollTop;

		onResize(resizableElement, handleElement, data, x, y);
	}

	// initiate the resizing
	function startresize(e) {
		e = e || window.event; // needed for IE

		// Only attend to left button (or right button for left-handed persons) events
		if (!BrowserUtilsFactory.getInstance().isLeftButton(e.button))
			return false;

		document.oncontextmenu = function() { return false; }; // disable context menu
		document.onmousedown = function() { return false; }; // disable text selection
		handleElement.stopObserving("mousedown", startresize);

		xStart = parseInt(e.screenX);
		yStart = parseInt(e.screenY);
		x = resizableElement.offsetLeft + handleElement.offsetLeft + (handleElement.offsetWidth / 2);
		y = resizableElement.offsetTop + handleElement.offsetTop + (handleElement.offsetHeight / 2);
		Event.observe (document, "mouseup", endresize);
		Event.observe (document, "mousemove", resize);

		var dragboard = EzWebEffectBase.findDragboardElement(resizableElement);
		dragboardCover = document.createElement("div");
		dragboardCover.setAttribute("class", "cover");
		dragboardCover.observe("mouseup" , endresize, true);
		dragboardCover.observe("mousemove", resize, true);

		dragboardCover.style.zIndex = "1000000";
		dragboardCover.style.position = "absolute";
		dragboardCover.style.top = "0";
		dragboardCover.style.left = "0";
		dragboardCover.style.width = "100%";
		dragboardCover.style.height = dragboard.scrollHeight + "px";

		yScroll = parseInt(dragboard.scrollTop);

		dragboard.observe("scroll", scroll);

		dragboard.insertBefore(dragboardCover, dragboard.firstChild);

		handleElement.observe("mouseup", endresize, true);
		handleElement.observe("mousemove", resize, true);

		onStart(resizableElement, handleElement, data);

		return false;
	}

	// Add event listener
	Event.observe (handleElement, "mousedown", startresize);
}

/////////////////////////////////////
// IGadget resize support
/////////////////////////////////////
function IGadgetResizeHandle(handleElement, iGadget, resizeLeftSide) {
	ResizeHandle.call(this, iGadget.element, handleElement,
	                        {iGadget: iGadget, resizeLeftSide: resizeLeftSide},
	                        IGadgetResizeHandle.prototype.startFunc,
	                        IGadgetResizeHandle.prototype.updateFunc,
	                        IGadgetResizeHandle.prototype.finishFunc);
}

IGadgetResizeHandle.prototype.startFunc = function (resizableElement, handleElement, data) {
	handleElement.addClassName("inUse");
	// TODO merge with igadget minimum sizes
	data.minWidth = Math.ceil(data.iGadget.layout.fromPixelsToHCells(80));
	data.minHeight = Math.ceil(data.iGadget.layout.fromPixelsToVCells(50));
	data.iGadget.igadgetNameHTMLElement.blur();
	data.oldZIndex = data.iGadget.getZPosition();
	data.iGadget.setZPosition("999999");
}

IGadgetResizeHandle.prototype.updateFunc = function (resizableElement, handleElement, data, x, y) {
	var iGadget = data.iGadget;

	// Skip if the mouse is outside the dragboard
	if (iGadget.layout.isInside(x, y)) {
		var position = iGadget.layout.getCellAt(x, y);
		var currentPosition = iGadget.getPosition();
		var width;

		if (data.resizeLeftSide) {
			width = currentPosition.x + iGadget.getWidth() - position.x;
		} else {
			width = position.x - currentPosition.x + 1;
		}
		var height = position.y - currentPosition.y + 1;

		// Minimum width
		if (width < data.minWidth)
			width = data.minWidth;

		// Minimum height
		if (height < data.minHeight)
			height = data.minHeight;

		if (width != iGadget.getWidth() || height != iGadget.getHeight())
			iGadget.setSize(width, height, data.resizeLeftSide, false);
	}
}

IGadgetResizeHandle.prototype.finishFunc = function (resizableElement, handleElement, data) {
	var iGadget = data.iGadget;
	data.iGadget.setZPosition(data.oldZIndex);
	iGadget.setSize(iGadget.getWidth(), iGadget.getHeight(), data.resizeLeftSide, true);
	handleElement.removeClassName("inUse");
}
