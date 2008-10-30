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

	this.shadowMatrix = null;    // Temporal matrix of igadgets used for D&D
	this.shadowPositions = null;
	this.columns = columns;
	this.cellHeight = cellHeight;
	DragboardLayout.call(this, dragboard, scrollbarSpace);

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

	this._notifyWindowResizeEvent = function () {
		this._recomputeSize();

		// Notify each igadget
		var iGadget;
		var igadgetKeys = this.iGadgets.keys();
		for (var i = 0; i < igadgetKeys.length; i++) {
			iGadget = this.iGadgets[igadgetKeys[i]];
			iGadget._notifyWindowResizeEvent();
		}
	}.bind(this);

	this._recomputeSize();
	Event.observe(window, 'resize', this._notifyWindowResizeEvent);

	this._clearMatrix();         // Matrix of igadgets
	this.dragboardCursor = null;
	this.gadgetToMove = null;
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

ColumnLayout.prototype.fromHCellsToPixels = function(cells) {
	return Math.floor((this.dragboardWidth * this.fromHCellsToPercentage(cells)) / 100);
}

ColumnLayout.prototype.fromHCellsToPercentage = function(cells) {
	return cells * (100 / this.columns);
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
		iGadget.dragboard._commitChanges(); // FIXME
}

ColumnLayout.prototype._insertAt = function(iGadget, x, y) {
	var newPosition = new DragboardPosition(x, y);

	// Move other instances
	var affectedIGadgets = new Hash();
	var affectedgadget, offset, affectedY;

	for (x = 0; x < iGadget.getWidth(); x++)
		for (y = 0; y < iGadget.getHeight(); y++) {
			affectedgadget = this.matrix[newPosition.x + x][newPosition.y + y];
			if ((affectedgadget != null) && (affectedIGadgets[affectedgadget.code] == undefined)) {
				// only move the gadget if we didn't move it before
				affectedIGadgets[affectedgadget.code] = null;
				offset = iGadget.getHeight() - y;
				y = newPosition.y + y;
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

ColumnLayout.prototype.initialize = function (iGadgets) {
	var iGadget, key, position, iGadgetsToReinsert = new Array();

	this._clearMatrix();
	this.iGadgets = iGadgets.clone();

	// Insert igadgets
	var igadgetKeys = iGadgets.keys();
	for (var i=0; i<igadgetKeys.length; i++) {
		key = igadgetKeys[i];

		iGadget = iGadgets[key];

		position = iGadget.getPosition();

		if (iGadget.getWidth() > this.getColumns())
			iGadget.contentWidth = this.getColumns();

		if (iGadget.getWidth() + position.x > this.getColumns()) {
			var guessedWidth = this.getColumns() - position.x;
			if (this._hasSpaceFor(this.matrix, position.x, position.y, guessedWidth, iGadget.getHeight())) {
				iGadget.setContentWidth(guessedWidth);
				this._reserveSpace(this.matrix, iGadget);
				iGadget.paint();
			} else {
				iGadgetsToReinsert.push(iGadget);
			}
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
}

/**
 * Calculate what cell is at a given position
 */
ColumnLayout.prototype.getCellAt = function (x, y) {
	var columnWidth = this.dragboardWidth / this.getColumns();

	return new DragboardPosition(Math.floor(x / columnWidth),
	                             Math.floor(y / this.getCellHeight()));
}


ColumnLayout.prototype.addIGadget = function(iGadget, affectsDragboard) {
	var position = iGadget.getPosition();
	if (position) {
		this._insertAt(iGadget, position.x, position.y);
	} else {
		// Search a position for the gadget
		position = this._searchFreeSpace(iGadget.getWidth(), iGadget.getHeight());
		iGadget.setPosition(position);

		// Pre-reserve the cells for the gadget instance
		this._reserveSpace(this.matrix, iGadget);
	}

	DragboardLayout.prototype.addIGadget.call(this, iGadget, affectsDragboard);
}

ColumnLayout.prototype.removeIGadget = function(iGadget, affectsDragboard) {
	this._removeFromMatrix(this.matrix, iGadget);
	DragboardLayout.prototype.removeIGadget.call(this, iGadget, affectsDragboard);
}

ColumnLayout.prototype.initializeMove = function(igadget) {
	this.igadgetToMove = igadget;

	// Make a copy of the positions of the gadgets
	this.shadowPositions = new Array();

	var keys = this.iGadgets.keys();
	for (var i = 0; i < keys.length; i++) {
		this.shadowPositions[keys[i]] = this.iGadgets[keys[i]].getPosition().clone();
	}

	// Shadow matrix = current matrix without the gadget to move
	var i;
	this.shadowMatrix = new Array();
	for (i = 0; i < this.columns; i++)
		this.shadowMatrix[i] = this.matrix[i].clone();
	this._removeFromMatrix(this.shadowMatrix, igadget);

	// Create dragboard cursor
	this.dragboardCursor = new DragboardCursor(igadget);
	this.dragboardCursor.paint(this.dragboard.dragboardElement);
	this._reserveSpace(this.matrix, this.dragboardCursor);
}

ColumnLayout.prototype._destroyCursor = function(clearSpace) {
	if (this.dragboardCursor != null) {
		if (clearSpace)
			this._removeFromMatrix(this.matrix, this.dragboardCursor); // FIXME
		this.dragboardCursor.destroy();
		this.dragboardCursor = null;
	}
}

ColumnLayout.prototype.moveTemporally = function(x, y) {
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
	this._destroyCursor(true);
	var position = this.igadgetToMove.getPosition();
	this._insertAt(this.igadgetToMove, position.x, position.y);
	this.shadowMatrix = null;
	this.igadgetToMove = null;
	this.dragboardCursor = null;
}

ColumnLayout.prototype._acceptMove = function() {
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

SmartColumnLayout.prototype._searchInsertPoint = function(_matrix, x, y, width, height) {
	// Search the topmost position for the gadget
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
			y = this._getPositionOn(_matrix, _matrix[x][y]).y;
			while ((y >= 0) && (this._hasSpaceFor(_matrix, x, y, width, 1))) {
				y--;
			}
			return y;
		} else {
			widthDiff = -widthDiff;
			// There is a gadget in this position, we can use their position as start point
			lastY = this._getPositionOn(_matrix, _matrix[x][y]).y;
			if (lastY == 0)
				lastY = 1;
				var startX = this._getPositionOn(_matrix, _matrix[x][y]).x + _matrix[x][y].getWidth();
			var offsetX;
			for (;y > lastY; y--) {
				for (offsetX = 0; offsetX < widthDiff; offsetX++) {
					if (_matrix[startX + offsetX][y] != _matrix[startX + offsetX][y - 1]) {
						// Edge detected
						return y;
					}
				}
			}

			// Not edge found, check if we can go to a higher position
			if (y == 1) {
				return 0;
			} else if ((y >= 1) && this._hasSpaceFor(_matrix, x, y - 1, width, 1)) {
				// If we can go to a higher position, we have to chek 
				y--;
			} else { // If not, this is the insert point
				return y;
			}
		}
	}

	var originalY = y;
	while ((y >= 0) && (this._hasSpaceFor(_matrix, x, y, width, 1))) {
		y--;
	}
	if (y != originalY) {
		y++;
	} else {
		// Search collisions with gadgets on other columns
		var curGadget;
		var offsetX;
		lastY = 0;
		for (offsetX = 1; offsetX < width; offsetX++) {
			curGadget = _matrix[x + offsetX][originalY];
			if (curGadget) {
				y = this._getPositionOn(_matrix, curGadget).y;
			} else {
				y = originalY - 1;
				while ((y >= 0) && _matrix[x + offsetX][y] == null)
					y--;
				y++;
			}
			if (y > lastY) lastY = y;
		}

		y = lastY;

		if (y != 0) {
			// Search the topmost position again
			y--;
			while ((y >= 0) && (this._hasSpaceFor(_matrix, x, y, width, 1)))
				y--;
			y++;
		}
	}
	return y;
}

SmartColumnLayout.prototype.initialize = function(iGadgets) {
	ColumnLayout.prototype.initialize.call(this, iGadgets);

	// remove holes moving igadgets to the topmost positions
	var iGadget;
	var keys = iGadgets.keys();
	for (var i = 0; i < keys.length; i++) {
		iGadget = iGadgets[keys[i]];
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
		iGadget.dragboard._commitChanges(); // FIXME
	}
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