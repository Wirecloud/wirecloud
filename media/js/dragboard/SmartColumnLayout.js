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

/////////////////////////////////////
// ColumnLayout
/////////////////////////////////////

/**
 * Represents a dragboard layout to be used to place igadgets into the dragboard.
 *
 * @param dragboard        associated dragboard
 * @param columns          number of columns of the layout
 * @param cellHeight       the height of the layout's cells in pixels
 * @param verticalMargin   vertical margin between igadgets in pixels
 * @param horizontalMargin horizontal margin between igadgets in pixels
 * @param scrollbarSpace   space reserved for the right scroll bar in pixels
 */
function ColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace) {
	if (arguments.length == 0)
		return; // Allow empty constructor (allowing hierarchy)

	this.initialized = false;
	this.shadowMatrix = null;    // Temporal matrix of igadgets used for D&D
	this.shadowPositions = null;
	this.columns = columns;
	this.cellHeight = cellHeight;

	if ((verticalMargin % 2) == 0) {
		this.topMargin = verticalMargin / 2;
		this.bottomMargin = verticalMargin / 2;
	} else {
		this.topMargin = Math.floor(verticalMargin / 2);
		this.bottomMargin = Math.floor(verticalMargin / 2) + 1;
	}

	if ((horizontalMargin % 2) == 0) {
		this.leftMargin = horizontalMargin / 2;
		this.rightMargin = horizontalMargin / 2;
	} else {
		this.leftMargin = Math.floor(horizontalMargin / 2);
		this.rightMargin = Math.floor(horizontalMargin / 2) + 1;
	}

	this._clearMatrix();         // Matrix of igadgets
	this.dragboardCursor = null;
	this.gadgetToMove = null;

	DragboardLayout.call(this, dragboard, scrollbarSpace);
}

/*
 * ColumnLayout extends DragboardLayout
 */
ColumnLayout.prototype = new DragboardLayout();

/**
 * Returns the numbers of columns of this layout.
 */
ColumnLayout.prototype.getColumns = function() {
	return this.columns;
}

ColumnLayout.prototype.getCellHeight = function() {
	return this.cellHeight;
}

ColumnLayout.prototype.fromPixelsToVCells = function(pixels) {
	return (pixels / this.cellHeight);
}

ColumnLayout.prototype.fromVCellsToPixels = function(cells) {
	return (cells * this.cellHeight);
}

ColumnLayout.prototype.getWidthInPixels = function (cells) {
	return this.fromHCellsToPixels(cells) - this.leftMargin - this.rightMargin;
}

ColumnLayout.prototype.getHeightInPixels = function (cells) {
	return this.fromVCellsToPixels(cells) - this.topMargin - this.bottomMargin;
}

ColumnLayout.prototype.fromPixelsToHCells = function(pixels) {
	var cells = pixels / this.fromHCellsToPixels(1);
	var truncatedCells = Math.floor(cells);

	if (Math.ceil(this.fromHCellsToPixels(truncatedCells)) == pixels)
		return truncatedCells;
	else
		return cells;
}

ColumnLayout.prototype.fromHCellsToPixels = function(cells) {
	return (this.dragboardWidth * this.fromHCellsToPercentage(cells)) / 100;
}

ColumnLayout.prototype.fromHCellsToPercentage = function(cells) {
	return cells * (100 / this.columns);
}

ColumnLayout.prototype.adaptColumnOffset = function(pixels) {
	var halfColumnWidth = Math.floor(this.fromHCellsToPixels(1) / 2);
	var offsetInLU = Math.floor(this.fromPixelsToHCells(pixels - this.leftMargin + halfColumnWidth));
	var offsetInPixels = this.fromHCellsToPixels(offsetInLU) + this.leftMargin;
	return new MultiValuedSize(offsetInPixels, offsetInLU);
}

ColumnLayout.prototype.adaptRowOffset = function(pixels) {
	var halfRowHeight = Math.floor(this.fromVCellsToPixels(1) / 2);
	var offsetInLU = Math.floor(this.fromPixelsToVCells(pixels - this.topMargin + halfRowHeight));
	var offsetInPixels = this.fromVCellsToPixels(offsetInLU) + this.topMargin;
	return new MultiValuedSize(offsetInPixels, offsetInLU);
}

ColumnLayout.prototype.adaptHeight = function(contentHeight, fullSize) {
	fullSize += this.topMargin + this.bottomMargin;
	var paddedFullSizeInCells = Math.ceil(this.fromPixelsToVCells(fullSize));
	var paddedFullSize = this.fromVCellsToPixels(paddedFullSizeInCells);

	return new MultiValuedSize(contentHeight + (paddedFullSize - fullSize), paddedFullSizeInCells);
}

ColumnLayout.prototype.adaptWidth = function(contentWidth, fullSize) {
	fullSize += this.leftMargin + this.rightMargin;
	var paddedFullSizeInCells = Math.ceil(this.fromPixelsToHCells(fullSize));
	var paddedFullSize = this.fromHCellsToPixels(paddedFullSizeInCells);

	return new MultiValuedSize(contentWidth + (paddedFullSize - fullSize), paddedFullSizeInCells);
}

ColumnLayout.prototype.getColumnOffset = function(column) {
	var tmp = Math.floor((this.dragboardWidth * this.fromHCellsToPercentage(column)) / 100);
	tmp += this.leftMargin;
	return tmp;
}

ColumnLayout.prototype.getRowOffset = function(row) {
	return this.fromVCellsToPixels(row) + this.topMargin;
}


ColumnLayout.prototype._getPositionOn = function(_matrix, gadget) {
	if (_matrix == this.matrix)
		return gadget.getPosition();
	else
		return this.shadowPositions[gadget.code];
}

ColumnLayout.prototype._setPositionOn = function(_matrix, gadget, position) {
	if (_matrix == this.matrix)
		gadget.setPosition(position);
	else
		this.shadowPositions[gadget.code] = position;
}

ColumnLayout.prototype._clearMatrix = function() {
	this.matrix = new Array();

	for (var x = 0; x < this.getColumns(); x++)
		this.matrix[x] = new Array();
}

ColumnLayout.prototype._hasSpaceFor = function(_matrix, positionX, positionY, width, height) {
	var x, y;

	for (x = 0; x < width; x++)
		for (y = 0; y < height; y++)
			if (_matrix[positionX + x][positionY + y] != null)
				return false;

	return true;
}

ColumnLayout.prototype._reserveSpace = function(_matrix, iGadget) {
	var x, y;
	var position = this._getPositionOn(_matrix, iGadget);
	var width = iGadget.getWidth();
	var height = iGadget.getHeight();

	for (x = 0; x < width; x++)
		for (y = 0; y < height; y++)
			_matrix[position.x + x][position.y + y] = iGadget;
}

ColumnLayout.prototype._clearSpace = function(_matrix, iGadget) {
	var x, y;
	var position = this._getPositionOn(_matrix, iGadget);
	var width = iGadget.getWidth();
	var height = iGadget.getHeight();

	for (x = 0; x < width; x++)
		for (y = 0; y < height; y++)
			delete _matrix[position.x + x][position.y + y];
}

ColumnLayout.prototype._searchInsertPoint = function(_matrix, x, y, width, height) {
	return y;
}

ColumnLayout.prototype._moveSpaceDown = function(_matrix, iGadget, offsetY) {
	var affectedIGadgets = new Hash();
	var position = this._getPositionOn(_matrix, iGadget);
	var finalPosition = position.clone();
	finalPosition.y += offsetY;

	var edgeY = position.y + iGadget.getHeight();

	// Search affected gadgets
	// TODO move gadgets according to the biggest offset for optimizing
	var igadget, x, y;
	for (x = 0; x < iGadget.getWidth(); x++)
		for (y = 0; y < offsetY; y++) {
			igadget = _matrix[position.x + x][edgeY + y];
			if (igadget != null) {
				affectedIGadgets[igadget.code] = offsetY - y; // calculate the offset for this igadget
				break; // continue whit the next column
			}
		}

	// Move affected gadgets instances
	var keys = affectedIGadgets.keys();
	var igadget, i, key;
	for (i = 0; i < keys.length; i++) {
		key = keys[i];
		igadget = this.iGadgets[key];
		this._moveSpaceDown(_matrix, igadget, affectedIGadgets[key]);
	}

	// Move the gadget
	this._clearSpace(_matrix, iGadget);
	this._setPositionOn(_matrix, iGadget, finalPosition);
	this._reserveSpace(_matrix, iGadget);
}

ColumnLayout.prototype._moveSpaceUp = function(_matrix, iGadget) {
	var position = this._getPositionOn(_matrix, iGadget);
	var edgeY = position.y + iGadget.getHeight();

	var offsetY;
	for (offsetY = 1;
	     ((position.y - offsetY) >= 0) && this._hasSpaceFor(_matrix, position.x, position.y - offsetY, iGadget.getWidth(), 1);
	     offsetY++);
	--offsetY;

	if (offsetY > 0) {
		var affectedIGadgets = new Hash();
		var finalPosition = position.clone();
		finalPosition.y -= offsetY;

		// Search affected gadgets
		// TODO move the topmost gadget for optimizing
		var igadget, x, y, columnsize;
		for (x = 0; x < iGadget.getWidth(); x++) {
			columnsize = _matrix[position.x + x].length;
			for (y = edgeY; y < columnsize; y++) {
				igadget = _matrix[position.x + x][y];
				if (igadget != null) {
					affectedIGadgets[igadget.code] = igadget;
					break; // continue whit the next column
				}
			}
		}

		// Move the representation of the gadget
		this._clearSpace(_matrix, iGadget);
		this._setPositionOn(_matrix, iGadget, finalPosition);
		this._reserveSpace(_matrix, iGadget);

		// Move affected gadgets instances
		var keys = affectedIGadgets.keys();
		var i;
		for (i = 0; i < keys.length; i++)
			this._moveSpaceUp(_matrix, affectedIGadgets[keys[i]]);
	}
}

ColumnLayout.prototype._removeFromMatrix = function(_matrix, iGadget) {
	this._clearSpace(_matrix, iGadget);
}

ColumnLayout.prototype._reserveSpace2 = function(_matrix, iGadget, positionX, positionY, width, height) {
	var x, y;

	for (x = 0; x < width; x++)
		for (y = 0; y < height; y++)
			_matrix[positionX + x][positionY + y] = iGadget;
}

ColumnLayout.prototype._clearSpace2 = function(_matrix, positionX, positionY, width, height) {
	var x, y;

	for (x = 0; x < width; x++)
		for (y = 0; y < height; y++)
			delete _matrix[positionX + x][positionY + y];
}

ColumnLayout.prototype._notifyResizeEvent = function(iGadget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
	var x, y;
	var step2Width = oldWidth; // default value, used when the igdaget's width doesn't change
	var position = iGadget.getPosition();
	var step2X;
	step2X = position.x;

	// First Step
	if (newWidth > oldWidth) {
		// Calculate the width for the next step
		step2Width = oldWidth;

		var finalYPos = position.y + newHeight;

		if (resizeLeftSide) {
			// Move affected igadgets
			var widthDiff = newWidth - oldWidth;
			for (x = position.x - widthDiff; x < position.x; ++x) {
				for (y = 0; y < newHeight; ++y) {
					var iGadgetToMove = this.matrix[x][position.y + y];
					if (iGadgetToMove != null) {
						this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
						break; // Continue with the next column
					}
				}
			}

			// Move the gadget
			position.x -= widthDiff;
			if (persist)
				iGadget.setPosition(position);

			// Reserve the new space
			this._reserveSpace2(this.matrix, iGadget,
			                                 position.x, position.y,
			                                 widthDiff, newHeight);
		} else {
			// Move affected igadgets
			for (x = position.x + oldWidth; x < position.x + newWidth; ++x) {
			  for (y = 0; y < newHeight; ++y) {
			    var iGadgetToMove = this.matrix[x][position.y + y];
			    if (iGadgetToMove != null) {
			      this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
			      break; // Continue with the next column
			    }
			  }
			}

			// Reserve this space
			this._reserveSpace2(this.matrix, iGadget,
			                                 position.x + oldWidth, position.y,
			                                 newWidth - oldWidth, newHeight);
		}

	} else if (newWidth < oldWidth) {
		// Calculate the width for the next step
		step2Width = newWidth;

		var widthDiff = oldWidth - newWidth;
		if (resizeLeftSide) {

			// Clear space
			this._clearSpace2(this.matrix, position.x, position.y, widthDiff, oldHeight);

			// Move the gadget
			position.x += widthDiff;
			if (persist)
				iGadget.setPosition(position);

			step2X = position.x;
		} else {
			// Clear space
			this._clearSpace2(this.matrix, position.x + newWidth, position.y, widthDiff, oldHeight);
		}
	}


	// Second Step
	if (newHeight > oldHeight) {
		var limitY = position.y + newHeight;
		var limitX = step2X + step2Width;
		for (y = position.y + oldHeight; y < limitY; y++)
			for (x = step2X; x < limitX; x++)
				if (this.matrix[x][y] != null)
					this._moveSpaceDown(this.matrix, this.matrix[x][y], limitY - y);

		// Reserve Space
		this._reserveSpace2(this.matrix, iGadget, step2X, position.y + oldHeight, step2Width, newHeight - oldHeight);
	} else if (newHeight < oldHeight) {
		// Clear freed space
		this._clearSpace2(this.matrix, step2X, position.y + newHeight, step2Width, oldHeight - newHeight);
	}

	this._notifyWindowResizeEvent(); // TODO
	if (persist)
		this.dragboard._commitChanges(); // FIXME
}

ColumnLayout.prototype._insertAt = function(iGadget, x, y) {
	var newPosition = new DragboardPosition(x, y);

	// Move other instances
	var affectedgadget, offset, affectedY;
	var lastX = newPosition.x + iGadget.getWidth();
	var lastY = newPosition.y + iGadget.getHeight();

	for (x = newPosition.x; x < lastX; x++)
		for (y = newPosition.y; y < lastY; y++) {
			affectedgadget = this.matrix[x][y];
			if (affectedgadget != null) {
				// only move the gadget if we didn't move it before
				offset = iGadget.getHeight() - (y - newPosition.y);
				affectedY = affectedgadget.getPosition().y;
				if (affectedY < y)
					offset += y - affectedY;
				this._moveSpaceDown(this.matrix, affectedgadget,  offset);
				// move only the topmost gadget in the column
				break;
			}
		}

	// Change Gadget instance position (insert it)
	iGadget.setPosition(newPosition);

	this._reserveSpace(this.matrix, iGadget);
}

ColumnLayout.prototype._searchFreeSpace = function(width, height) {
	var positionX = 0, positionY = 0;
	var columns = this.getColumns() - width + 1;

	for (positionY = 0; true ; positionY++)
		for (positionX = 0; positionX < columns; positionX++)
			if (this._hasSpaceFor(this.matrix, positionX, positionY, width, height)) {
				return new DragboardPosition(positionX, positionY);
			}
}

ColumnLayout.prototype.initialize = function () {
	var iGadget, key, position, iGadgetsToReinsert = new Array();

	this._clearMatrix();

	// Insert igadgets
	var igadgetKeys = this.iGadgets.keys();
	for (var i = 0; i < igadgetKeys.length; i++) {
		key = igadgetKeys[i];

		iGadget = this.iGadgets[key];

		position = iGadget.getPosition();

		this._ensureMinimalSize(iGadget);

		if (iGadget.getWidth() > this.getColumns())
			iGadget.contentWidth = this.getColumns();

		if (iGadget.getWidth() + position.x > this.getColumns()) {
			iGadgetsToReinsert.push(iGadget);
		} else if (this._hasSpaceFor(this.matrix, position.x, position.y, iGadget.getWidth(), iGadget.getHeight())) {
			this._reserveSpace(this.matrix, iGadget);
			iGadget.paint();
		} else {
			iGadgetsToReinsert.push(iGadget);
		}
	}

	// Reinsert the igadgets that didn't fit in their positions
	for (i = 0; i < iGadgetsToReinsert.length; i++) {
		position = this._searchFreeSpace(iGadgetsToReinsert[i].getWidth(),
		                                 iGadgetsToReinsert[i].getHeight());
		iGadgetsToReinsert[i].setPosition(position);
		iGadgetsToReinsert[i].paint();
		this._reserveSpace(this.matrix, iGadgetsToReinsert[i]);
	}

	this.initialized = true;
}

/**
 * Calculate what cell is at a given position in pixels
 */
ColumnLayout.prototype.getCellAt = function (x, y) {
	var columnWidth = this.dragboardWidth / this.getColumns();

	return new DragboardPosition(Math.floor(x / columnWidth),
	                             Math.floor(y / this.getCellHeight()));
}

/**
 * Inserts the given iGadget into this layout.
 *
 * @param iGadget the iGadget to insert in this layout
 * @param affectsDragboard if true, the dragbaord associated to this layout will be notified
 */
ColumnLayout.prototype.addIGadget = function(iGadget, affectsDragboard) {
	DragboardLayout.prototype.addIGadget.call(this, iGadget, affectsDragboard);

	iGadget.setZPosition(0);

	if (!this.initialized)
		return;

	var position = iGadget.getPosition();
	if (position) {
		if (iGadget.getWidth() > this.getColumns())
			iGadget.contentWidth = this.getColumns();

		var diff = iGadget.getWidth() + position.x - this.getColumns();
		if (diff > 0)
			position.x -= diff

		// Insert it
		this._insertAt(iGadget, position.x, position.y);
	} else {
		// Search a position for the gadget
		position = this._searchFreeSpace(iGadget.getWidth(), iGadget.getHeight());
		iGadget.setPosition(position);

		// Pre-reserve the cells for the gadget instance
		this._reserveSpace(this.matrix, iGadget);
	}

	this._adaptIGadget(iGadget);
}

ColumnLayout.prototype.removeIGadget = function(iGadget, affectsDragboard) {
	this._removeFromMatrix(this.matrix, iGadget);
	DragboardLayout.prototype.removeIGadget.call(this, iGadget, affectsDragboard);
}

ColumnLayout.prototype.initializeMove = function(igadget, draggable) {
	draggable = draggable || null; // default value of draggable argument

	// Check for pendings moves
	if (this.igadgetToMove != null) {
		var msg = gettext("There was a pending move that was cancelled because initializedMove function was called before it was finished.")
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		this.cancelMove();
	}

	this.igadgetToMove = igadget;

	// Make a copy of the positions of the gadgets
	this.shadowPositions = new Array();

	var keys = this.iGadgets.keys();
	for (var i = 0; i < keys.length; i++) {
		this.shadowPositions[keys[i]] = this.iGadgets[keys[i]].getPosition().clone();
	}

	// Shadow matrix = current matrix without the gadget to move
	// Initialize shadow matrix and searchInsertPointCache
	var i, lastGadget, lastY = 0;
	this.shadowMatrix = new Array();
	this.searchInsertPointCache = new Array();
	for (i = 0; i < this.columns; i++) {
		this.searchInsertPointCache[i] = new Array();
		this.shadowMatrix[i] = this.matrix[i].clone();
	}
	this._removeFromMatrix(this.shadowMatrix, igadget);

	// search bottommost row
	for (i = 0; i < this.columns; i++) {
		lastGadget = this.matrix[i].compact().last();

		if (!lastGadget)
			continue;

		tmp = lastGadget.getPosition().y + lastGadget.getHeight();
		if (tmp > lastY)
			lastY = tmp;
	}
	this.searchInsertPointYLimit = lastY + 1;

	// Create dragboard cursor
	this.dragboardCursor = new DragboardCursor(igadget);
	this.dragboardCursor.paint(this.dragboard.dragboardElement);
	this._reserveSpace(this.matrix, this.dragboardCursor);

	if (draggable) {
		draggable.setXOffset(this.fromHCellsToPixels(1) / 2);
		draggable.setYOffset(this.getCellHeight());
	}
}

ColumnLayout.prototype._destroyCursor = function(clearSpace) {
	if (this.dragboardCursor != null) {
		if (clearSpace)
			this._removeFromMatrix(this.matrix, this.dragboardCursor); // FIXME
		this.dragboardCursor.destroy();
		this.dragboardCursor = null;
	}
}

ColumnLayout.prototype.disableCursor = function() {
	this._destroyCursor(true);
}

ColumnLayout.prototype.moveTemporally = function(x, y) {
	if (this.igadgetToMove == null) {
		var msg = gettext("Dragboard: You must call initializeMove function before calling to this function (moveTemporally).");
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		return;
	}

	var maxX = this.getColumns() - this.igadgetToMove.getWidth();
	if (x > maxX) x = maxX;

	// Check if we have to change the position of the cursor
	y = this._searchInsertPoint(this.shadowMatrix, x, y, this.igadgetToMove.getWidth(), this.igadgetToMove.getHeight());

	if (this.dragboardCursor != null) {
		var cursorpos = this.dragboardCursor.getPosition();

		if ((cursorpos.y != y) || (cursorpos.x != x)) {
			// Change cursor position
			this._removeFromMatrix(this.matrix, this.dragboardCursor);
			this._insertAt(this.dragboardCursor, x, y);
		}
	} else {
		this.dragboardCursor = new DragboardCursor(this.igadgetToMove);
		this.dragboardCursor.paint(this.dragboard.dragboardElement);
		this._insertAt(this.dragboardCursor, x, y);
	}
}

ColumnLayout.prototype.cancelMove = function() {
	if (this.igadgetToMove == null) {
		var msg = gettext("Trying to cancel an inexistant temporal move.");
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		return;
	}

	this._destroyCursor(true);
	var position = this.igadgetToMove.getPosition();
	this._insertAt(this.igadgetToMove, position.x, position.y);
	this.shadowMatrix = null;
	this.igadgetToMove = null;
	this.dragboardCursor = null;
}

ColumnLayout.prototype.acceptMove = function() {
	if (this.igadgetToMove == null) {
		var msg = gettext("Function acceptMove called when there is not an started igadget move.");
		LogManagerFactory.getInstance().log(msg, Constants.WARN_MSG);
		return;
	}

	var oldposition = this.igadgetToMove.getPosition();
	var newposition = this.dragboardCursor.getPosition();
	this._destroyCursor(false);

	// Needed to force repaint of the igadget at the correct position
	this.igadgetToMove.setPosition(newposition);

	// Needed to overwriting the cursor cells
	this._reserveSpace(this.matrix, this.igadgetToMove);

	// Update igadgets positions in persistence
	if (oldposition.y != newposition.y || oldposition.x != newposition.x) {
		this.dragboard._commitChanges();
	}

	this.shadowMatrix = null;
	this.igadgetToMove = null;
	this.dragboardCursor = null;
}

/////////////////////////////////////
// SmartColumnLayout
/////////////////////////////////////

function SmartColumnLayout(dragboard, columns, cellHeight, verticalMargin, horizontalMargin, scrollbarSpace) {
	ColumnLayout.call(this,
	                  dragboard,
	                  columns,
	                  cellHeight,
	                  verticalMargin,
	                  horizontalMargin,
	                  scrollbarSpace);
}

SmartColumnLayout.prototype = new ColumnLayout();

SmartColumnLayout.prototype._realSearchInsertPoint = function(_matrix, x, y, width, height) {
	var lastY;

	/* Check for special cases
	   y == 0                             => we are on the topmost position
	                                      so this is the insert point
	   _matrix[x][y - 1] != _matrix[x][y] => we are in a edge, so this is
	                                      the insert point.
	   _matrix[x][y] != null              => there is already a gadget in
	                                      this position, so we have to
	                                      search an insert point ignoring
	                                      it.
	*/
	if (y == 0) {
		return 0;
	} else if ((_matrix[x][y - 1] != null) && (_matrix[x][y - 1] != _matrix[x][y])) {
		return y;
	} else if (_matrix[x][y]) {
		var widthDiff = _matrix[x][y].getWidth() - width;
		widthDiff -= x - this._getPositionOn(_matrix, _matrix[x][y]).x;
		if (widthDiff > 0) {
			// The gadget at (x,y) has the same or a bigger width
			// than the gadget to move, so as the gadget to move
			// fits there, so at least we can insert here.
			y = this._getPositionOn(_matrix, _matrix[x][y]).y - 1;
			while ((y >= 0) && (this._hasSpaceFor(_matrix, x, y, width, 1))) {
				y--;
			}
			return ++y;
		} if (widthDiff != 0) {
			var offsetX;

			for (;y > 1; y--) {
				for (offsetX = 0; offsetX < width; offsetX++) {
					if (_matrix[x + offsetX][y] != _matrix[x + offsetX][y - 1]) {
						if (_matrix[x + offsetX][y - 1]) {
							// Edge detected
							return y;
						}
					}
				}
			}

			// edges not found
			return 0;
		} else {
			return this._getPositionOn(_matrix, _matrix[x][y]).y
		}
	}

	lastY = y;
	while ((y >= 0) && (this._hasSpaceFor(_matrix, x, y, width, 1))) {
		y--;
	}
	if (y != lastY) {
		y++;
	} else {
		var offsetX;

		for (;y > 1; y--) {
			for (offsetX = 0; offsetX < width; offsetX++) {
				if (_matrix[x + offsetX][y] != _matrix[x + offsetX][y - 1]) {
					if (_matrix[x + offsetX][y - 1]) {
						// Edge detected
						return y;
					}
				}
			}
		}

		return 0;
	}
	return y;
}

SmartColumnLayout.prototype._searchInsertPoint = function(_matrix, x, y, width, height) {
	// Search the topmost position for the gadget

	if (y > this.searchInsertPointYLimit)
		y = this.searchInsertPointYLimit;

	if (!this.searchInsertPointCache[x][y])
		this.searchInsertPointCache[x][y] = this._realSearchInsertPoint(_matrix, x, y, width, height);

	return this.searchInsertPointCache[x][y];
}

SmartColumnLayout.prototype.initialize = function() {
	ColumnLayout.prototype.initialize.call(this);

	// remove holes moving igadgets to the topmost positions
	var iGadget;
	var keys = this.iGadgets.keys();
	for (var i = 0; i < keys.length; i++) {
		iGadget = this.iGadgets[keys[i]];
		this._moveSpaceUp(this.matrix, iGadget);
	}
}

SmartColumnLayout.prototype._notifyResizeEvent = function(iGadget, oldWidth, oldHeight, newWidth, newHeight, resizeLeftSide, persist) {
	var x, y;
	var step2Width = oldWidth; // default value, used when the igdaget's width doesn't change
	var position = iGadget.getPosition();
	var step2X;
	step2X = position.x;

	// First Step
	if (newWidth > oldWidth) {
		// Calculate the width for the next step
		step2Width = oldWidth;

		var finalYPos = position.y + newHeight;

		if (resizeLeftSide) {
			// Move affected igadgets
			var widthDiff = newWidth - oldWidth;
			for (x = position.x - widthDiff; x < position.x; ++x) {
				for (y = 0; y < newHeight; ++y) {
					var iGadgetToMove = this.matrix[x][position.y + y];
					if (iGadgetToMove != null) {
						this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
						break; // Continue with the next column
					}
				}
			}

			// Move the gadget
			position.x -= widthDiff;
			if (persist)
				iGadget.setPosition(position);

			// Reserve the new space
			this._reserveSpace2(this.matrix, iGadget,
			                                 position.x, position.y,
			                                 widthDiff, newHeight);
		} else {
			// Move affected igadgets
			for (x = position.x + oldWidth; x < position.x + newWidth; ++x) {
				for (y = 0; y < newHeight; ++y) {
					var iGadgetToMove = this.matrix[x][position.y + y];
					if (iGadgetToMove != null) {
						this._moveSpaceDown(this.matrix, iGadgetToMove, finalYPos - iGadgetToMove.position.y);
						break; // Continue with the next column
					}
				}
			}

			// Reserve this space
			this._reserveSpace2(this.matrix, iGadget,
			                                 position.x + oldWidth, position.y,
			                                 newWidth - oldWidth, newHeight);
		}

	} else if (newWidth < oldWidth) {
		// Calculate the width for the next step
		step2Width = newWidth;

		var widthDiff = oldWidth - newWidth;
		if (resizeLeftSide) {

			// Clear space
			this._clearSpace2(this.matrix, position.x, position.y, widthDiff, oldHeight);

			// Move affected igadgets
			y = position.y + oldHeight;
			var limitX = position.x + widthDiff;
			for (x = position.x; x < limitX; ++x)
				if (this.matrix[x][y] != null)
					this._moveSpaceUp(this.matrix, this.matrix[x][y]);

			// Move the gadget
			position.x += widthDiff;
			if (persist)
				iGadget.setPosition(position);

			step2X = position.x;
		} else {
			// Clear space
			this._clearSpace2(this.matrix, position.x + newWidth, position.y, widthDiff, oldHeight);

			// Move affected igadgets
			y = position.y + oldHeight;
			var limitX = position.x + oldWidth;
			for (x = position.x + newWidth; x < limitX; ++x)
				if (this.matrix[x][y] != null)
					this._moveSpaceUp(this.matrix, this.matrix[x][y]);
		}
	}

	// Second Step
	if (newHeight > oldHeight) {
		var limitY = position.y + newHeight;
		var limitX = step2X + step2Width;
		for (y = position.y + oldHeight; y < limitY; y++)
			for (x = step2X; x < limitX; x++)
				if (this.matrix[x][y] != null)
					this._moveSpaceDown(this.matrix, this.matrix[x][y], limitY - y);

		// Reserve Space
		this._reserveSpace2(this.matrix, iGadget, step2X, position.y + oldHeight, step2Width, newHeight - oldHeight);
	} else if (newHeight < oldHeight) {
		// Clear freed space
		this._clearSpace2(this.matrix, step2X, position.y + newHeight, step2Width, oldHeight - newHeight);

		y = position.y + oldHeight;
		var limitX = step2X + step2Width;
		for (x = step2X; x < limitX; x++)
			if (this.matrix[x][y] != null)
				this._moveSpaceUp(this.matrix, this.matrix[x][y]);
	}

	this._notifyWindowResizeEvent(); // TODO
	if (persist) {
		this._moveSpaceUp(this.matrix, iGadget);
		// Save new positions into persistence
		this.dragboard._commitChanges(); // FIXME
	}
}

SmartColumnLayout.prototype._insertAt = function(iGadget, x, y) {
	ColumnLayout.prototype._insertAt.call(this, iGadget, x, y);

	this._moveSpaceUp(this.matrix, iGadget);
}

SmartColumnLayout.prototype._removeFromMatrix = function(_matrix, iGadget) {
	this._clearSpace(_matrix, iGadget);

	var affectedIGadgets = new Hash();
	var affectedgadget, x, y, columnsize;
	var position = this._getPositionOn(_matrix, iGadget);
	var edgeY = position.y + iGadget.getHeight();

	// check if we have to update the representations of the gadget instances
	for (x = 0; x < iGadget.getWidth(); x++) {
		columnsize = _matrix[position.x + x].length;
		for (y = edgeY; y < columnsize; y++) {
			affectedgadget = _matrix[position.x + x][y];
			if ((affectedgadget != null) && (affectedIGadgets[affectedgadget.code] == undefined)) {
				affectedIGadgets[affectedgadget.code] = 1;
				this._moveSpaceUp(_matrix, affectedgadget);
				break;
			}
		}
	}
}