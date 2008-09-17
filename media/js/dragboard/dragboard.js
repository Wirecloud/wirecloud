/* 
 * MORFEO Project 
 * http://morfeo-project.org 
 * 
 * Component: EzWeb
 * 
 * (C) Copyright 2007-2008 Telefónica Investigación y Desarrollo 
 *     S.A.Unipersonal (Telefónica I+D) 
 * 
 * Info about members and contributors of the MORFEO project 
 * is available at: 
 * 
 *   http://morfeo-project.org/
 * 
 * This program is free software; you can redistribute it and/or modify 
 * it under the terms of the GNU General Public License as published by 
 * the Free Software Foundation; either version 2 of the License, or 
 * (at your option) any later version. 
 * 
 * This program is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
 * GNU General Public License for more details. 
 * 
 * You should have received a copy of the GNU General Public License 
 * along with this program; if not, write to the Free Software 
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
 * 
 * If you want to use this software an plan to distribute a 
 * proprietary application in any way, and you are not licensing and 
 * distributing your source code under GPL, you probably need to 
 * purchase a commercial license of the product.  More info about 
 * licensing options is available at: 
 * 
 *   http://morfeo-project.org/
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
	this.dragboardCursor = null;
	this.gadgetToMove = null;
	this.iGadgets = new Hash();
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

		this.baseLayout.initialize(this.iGadgets);
	}

	Dragboard.prototype._destroyCursor = function(clearSpace) {
		if (this.dragboardCursor != null) {
			if (clearSpace)
				this.dragboardCursor.layoutStyle._removeFromMatrix(this.dragboardCursor.layoutStyle.matrix, this.dragboardCursor); // FIXME
			this.dragboardCursor.destroy();
			this.dragboardCursor = null;
		}
	}

	this._commitChanges = function() {
		// Update igadgets positions in persistence
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

		// TODO only send changes
		var iGadgetInfo, uri, position;
		var data = new Hash();
		data['iGadgets'] = new Array();

		var keys = this.iGadgets.keys();
		for (var i = 0; i < keys.length; i++) {
			iGadget = this.iGadgets[keys[i]];
			iGadgetInfo = new Hash();
			position = iGadget.getPosition();
			iGadgetInfo['id'] = iGadget.id;
			iGadgetInfo['top'] = position.y;
			iGadgetInfo['left'] = position.x;
			iGadgetInfo['minimized'] = iGadget.isMinimized() ? "true" : "false";
			iGadgetInfo['width'] = iGadget.getContentWidth();
			iGadgetInfo['height'] = iGadget.getContentHeight();
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
	    this.baseLayout._notifyWindowResizeEvent(this.iGadgets);
	}

	Dragboard.prototype.hide = function () {
		LayoutManagerFactory.getInstance().hideView(this.dragboardElement);
	}

	Dragboard.prototype.destroy = function () {
		this.baseLayout.destroy();

		var keys = this.iGadgets.keys();
		//disconect and delete the connectables and variables of all tab iGadgets
		for (var i = 0; i < keys.length; i++) {
			this.workSpace.removeIGadgetData(keys[i]);
			delete this.iGadgets[keys[i]];
		}

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
		var curIGadget, position, width, height, igadget, gadget, gadgetid, minimized;

		var opManager = OpManagerFactory.getInstance();

		this.currentCode = 1;
		this.iGadgets = new Hash();

		if (tabInfo.locked == "true") {
			this.fixed = true;
			this.dragboardElement.addClassName("fixed");
		}

		// For controlling when the igadgets are totally loaded!
		this.igadgets = tabInfo.igadgetList;
		this.igadgetsToLoad = tabInfo.igadgetList.length;
		for (var i = 0; i < this.igadgets.length; i++) {
			curIGadget = this.igadgets[i];

			position = new DragboardPosition(parseInt(curIGadget.left), parseInt(curIGadget.top));
			width = parseInt(curIGadget.width);
			height = parseInt(curIGadget.height);

			// Parse gadget id
			gadgetid = curIGadget.gadget.split("/");
			gadgetid = gadgetid[2] + "_" + gadgetid[3] + "_" + gadgetid[4];
			// Get gadget model
			gadget = ShowcaseFactory.getInstance().getGadget(gadgetid);

			// Parse minimize status
			minimized = curIGadget.minimized == "true" ? true : false;

			// Create instance model
			igadget = new IGadget(gadget, curIGadget.id, curIGadget.code, curIGadget.name, this.baseLayout, position, width, height, minimized, this);
			this.iGadgets[curIGadget.id] = igadget;

			if (curIGadget.code >= this.currentCode)
				this.currentCode =  curIGadget.code + 1;

//				this._reserveSpace(this.matrix, igadget);
		}

		this.loaded = true;
	}

	Dragboard.prototype.addInstance = function (gadget) {
		if ((gadget == null) || !(gadget instanceof Gadget))
			return; // TODO exception

		if (this.isLocked()) {
			var msg = gettext("The destination tab (%(tabName)s) is locked. Try to unlock it or select an unlocked tab.");
			msg = interpolate(msg, {tabName: this.tab.tabInfo.name}, true);
			LayoutManagerFactory.getInstance().showMessageMenu(msg);
			return;
		}

		var template = gadget.getTemplate();
		var width = template.getWidth();
		var height = template.getHeight();

		// Check if the gadget doesn't fit in the dragboard
		var maxColumns = this.baseLayout.getColumns();
		if (width > maxColumns) {
			// TODO warning
			width = maxColumns;
		}

		// Create the instance
		var igadgetName = gadget.getName() + ' (' + this.currentCode + ')';
		var iGadget = new IGadget(gadget, null, this.currentCode, igadgetName, this.baseLayout, null, width, height, false, this);
		this.currentCode++;

		this.baseLayout.addIGadget(iGadget);

		iGadget.save();
	}

	Dragboard.prototype.removeInstance = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		this.iGadgets.remove(iGadgetId);

		this.baseLayout.removeIGadget(igadget);
		igadget.remove();
		igadget.destroy();
	}

	Dragboard.prototype.igadgetLoaded = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];

		if (!igadget) {
			// TODO log
			return;
		}

		igadget._notifyLoaded();
		this.igadgetsToLoad--;
	}


	Dragboard.prototype.getRemainingIGadgets = function () {
		return this.igadgetsToLoad;
	}


	Dragboard.prototype.saveConfig = function (iGadgetId) {
		var igadget = this.iGadgets[iGadgetId];
		try {
			igadget.saveConfig();

			igadget.setConfigurationVisible(igadget.getId(), false);
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

	Dragboard.prototype.showInstance = function (igadget) {
		igadget.paint(this.dragboardElement, this.baseLayout);
	}

	Dragboard.prototype.initializeMove = function (iGadgetId) {
		if (this.gadgetToMove != null) {
			LogManagerFactory.getInstance().log(gettext("There was a pending move that was cancelled because initializedMove function was called before it was finished."), Constants.WARN_MSG);
			this.cancelMove();
		}

		this.gadgetToMove = this.iGadgets[iGadgetId];

		if (this.dragboardCursor == null) {
			// Create dragboard cursor
			this.dragboardCursor = new DragboardCursor(this.gadgetToMove);
			this.gadgetToMove.layoutStyle.initializeMove(this.gadgetToMove, this.dragboardCursor);
		} /* else {
			TODO exception
		}*/

	}

	Dragboard.prototype.moveTemporally = function (x, y) {
		if (this.dragboardCursor == null) {
			LogManagerFactory.getInstance().log(gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally)."), Constants.WARN_MSG);
			return;
		}

		this.baseLayout.moveTemporally(this.dragboardCursor, x, y);
	}

	Dragboard.prototype.cancelMove = function() {
		if (this.gadgetToMove == null) {
			LogManagerFactory.getInstance().log(gettext("Dragboard: Trying to cancel an inexistant temporal move."), Constants.WARN_MSG);
			return;
		}

		this._destroyCursor(true);
		var position = this.gadgetToMove.getPosition();
		this.gadgetToMove.layoutStyle._insertAt(this.gadgetToMove, position.x, position.y);
		this.gadgetToMove = null;
		this.gadgetToMove.layoutStyle.shadowMatrix = null; // FIXME
	}

	Dragboard.prototype.acceptMove = function() {
		if (this.gadgetToMove == null)
			throw new Exception(gettext("Dragboard: function acceptMove called when there is not any igadget's move started."));

		var oldposition = this.gadgetToMove.getPosition();
		var newposition = this.dragboardCursor.getPosition();
		this._destroyCursor(false);

		this.baseLayout.acceptMove(this.gadgetToMove, newposition);
		this.gadgetToMove = null;
		this.shadowMatrix = null;

		// Update igadgets positions in persistence
		if (oldposition.y != newposition.y || oldposition.x != newposition.x)
			this._commitChanges();
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
	

	Dragboard.prototype.addIGadget = function (iGadget, igadgetInfo) {
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
	this.baseLayout = new SmartColumnLayout(this.dragboardElement, 20, 12, 2, 4, 17);

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
function DragboardCursor(iGadget, position) {
	var positiontmp = iGadget.getPosition();
	this.position = positiontmp.clone();

	this.layoutStyle = iGadget.layoutStyle;
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
	dragboardCursor.style.left = (this.layoutStyle.getColumnOffset(this.position.x) - 2) + "px"; // TODO -2 px for borders
	dragboardCursor.style.top = (this.layoutStyle.getRowOffset(this.position.y) - 2) + "px"; // TODO -2 px for borders

	// assign the created element
	dragboard.appendChild(dragboardCursor);
	this.element = dragboardCursor;
}

DragboardCursor.prototype.destroy = function() {
	if (this.element != null) {
		Droppables.remove(this.element);
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
		this.element.style.left = (this.layoutStyle.getColumnOffset(position.x) - 2) + "px"; // TODO -2 px for borders
		this.element.style.top = (this.layoutStyle.getRowOffset(position.y) - 2) + "px"; // TODO -2 px for borders
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
		draggableElement.style.zIndex = "";

		Event.observe (handler, "mousedown", startdrag);

		document.onmousedown = null; // reenable context menu
		document.oncontextmenu = null; // reenable text selection

		return false;
	}

	// fire each time it's dragged
	function drag(e) {
		e = e || window.event; // needed for IE

		xDelta = xStart - parseInt(e.screenX);
		yDelta = yStart - parseInt(e.screenY);
		xStart = parseInt(e.screenX);
		yStart = parseInt(e.screenY);
		y = y - yDelta;
		x = x - xDelta;
		draggableElement.style.top = y + 'px';
		draggableElement.style.left = x + 'px';

		onDrag(draggable, data, x + xOffset, y + yOffset);
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

		dragboardCover.style.zIndex = "201";
		dragboardCover.style.position = "absolute";
		dragboardCover.style.top = "0";
		dragboardCover.style.left = "0";
		dragboardCover.style.width = "100%";
		dragboardCover.style.height = dragboard.scrollHeight + "px";

		yScroll = parseInt(dragboard.scrollTop);

		dragboard.observe("scroll", scroll);

		dragboard.insertBefore(dragboardCover, dragboard.firstChild);

		draggableElement.style.zIndex = "200";

		return false;
	}

	// fire each time the dragboard is scrolled while dragging
	function scroll() {
		var dragboard = dragboardCover.parentNode;
		dragboardCover.style.height = dragboard.scrollHeight + "px";
		var scrollTop = parseInt(dragboard.scrollTop);
		var scrollDelta = yScroll - scrollTop;
		y -= scrollDelta;
		yScroll = scrollTop;

		draggableElement.style.top = y + 'px';
		draggableElement.style.left = x + 'px';

		onDrag(draggable, data, x + xOffset, y + yOffset);
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
	context.dragboard = iGadget.dragboard;
	context.iGadgetId = iGadget.id;
	Draggable.call(this, iGadget.element, iGadget.gadgetMenu, context,
	                     IGadgetDraggable.prototype.startFunc,
	                     IGadgetDraggable.prototype.updateFunc,
	                     IGadgetDraggable.prototype.finishFunc);
}

IGadgetDraggable.prototype.startFunc = function (draggable, context) {
	context.dragboard.initializeMove(context.iGadgetId);
	draggable.setXOffset(context.dragboard.baseLayout.fromHCellsToPixels(1) / 2);
	draggable.setYOffset(context.dragboard.baseLayout.getCellHeight());
}

IGadgetDraggable.prototype.updateFunc = function (draggable, context, x, y) {
	var position = context.dragboard.baseLayout.getCellAt(x, y);

	// If the mouse is inside of the dragboard and we have enought columns =>
	// check if we have to change the cursor position
	if (position != null)
		context.dragboard.moveTemporally(position.x, position.y);
}

IGadgetDraggable.prototype.finishFunc = function (draggable, context) {
	context.dragboard.acceptMove();
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
		resizableElement.style.zIndex = null;

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

		dragboardCover.style.zIndex = "201";
		dragboardCover.style.position = "absolute";
		dragboardCover.style.top = "0";
		dragboardCover.style.left = "0";
		dragboardCover.style.width = "100%";
		dragboardCover.style.height = dragboard.scrollHeight + "px";

		yScroll = parseInt(dragboard.scrollTop);

		dragboard.observe("scroll", scroll);

		dragboard.insertBefore(dragboardCover, dragboard.firstChild);

		resizableElement.style.zIndex = "200"; // TODO

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
	data.iGadget.igadgetNameHTMLElement.blur();
}

IGadgetResizeHandle.prototype.updateFunc = function (resizableElement, handleElement, data, x, y) {
	var iGadget = data.iGadget;
	var position = iGadget.layoutStyle.getCellAt(x, y);

	// Skip if the mouse is outside the dragboard
	if (position != null) {
		var currentPosition = iGadget.getPosition();
		var width;

		if (data.resizeLeftSide) {
			width = currentPosition.x + iGadget.getWidth() - position.x;
		} else {
			width = position.x - currentPosition.x + 1;
		}
		var height = position.y - currentPosition.y + 1;

		if (width < 1)  // Minimum width = 1 cells
			width = 1;

		if (height < 3) // Minimum height = 3 cells
			height = 3;

		if (width != iGadget.getWidth() || height != iGadget.getHeight())
			iGadget._setSize(width, height, data.resizeLeftSide, false);
	}
}

IGadgetResizeHandle.prototype.finishFunc = function (resizableElement, handleElement, data) {
	var iGadget = data.iGadget;
	iGadget._setSize(iGadget.getWidth(), iGadget.getHeight(), data.resizeLeftSide, true);
	handleElement.removeClassName("inUse");
}
