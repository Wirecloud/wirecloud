/* 
 * MORFEO Project 
 * http://morfeo-project.org 
 * 
 * Component: EzWeb
 * 
 * (C) Copyright 2008 Telefónica Investigación y Desarrollo 
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

/////////////////////////////////////
// DragboardLayout
/////////////////////////////////////

/**
 * Represents a dragboard layout to be used to place igadgets into the dragboard.
 * Despite javascript not having a way to mark classes abstract, this class is
 * abstract, so please do not try to create an instance of this clase.
 *
 * @param dragboardElement HTML element that will be used
 * @param scrollbarSpace space reserved for the right scroll bar in pixels
 */
function DragboardLayout(dragboardElement, scrollbarSpace) {
	if (arguments.length == 0)
		return; // Allow empty constructor (allowing hierarchy)

	this.dragboardElement = dragboardElement;
	this.scrollbarSpace = scrollbarSpace;
	this.iGadgets = new Array();
}

DragboardLayout.prototype.getMenubarSize = function() {
	return 18; // TODO calculate this
}

DragboardLayout.prototype.getMenubarSizeInCells = function() {
	return Math.ceil(this.fromPixelsToVCells(this.getMenubarSize()));
}

DragboardLayout.prototype.getStatusbarSize = function() {
	return 16; // TODO calculate this
}

DragboardLayout.prototype.getExtraCells = function() {
	var sizeInPixels = this.getMenubarSize() + this.getStatusbarSize();
	return Math.ceil(this.fromPixelsToVCells(sizeInPixels));
}

/**
 * This function is slow. Please, only call it when really necessary.
 */
DragboardLayout.prototype._recomputeSize = function() {
	this.dragboardWidth = parseInt(this.dragboardElement.offsetWidth);

	var tmp = this.dragboardWidth;
	tmp-= parseInt(this.dragboardElement.clientWidth);

	if (tmp > this.scrollbarSpace)
		this.dragboardWidth-= tmp;
	else
		this.dragboardWidth-= this.scrollbarSpace;
}

DragboardLayout.prototype.getWidth = function() {
	return this.dragboardWidth;
}

DragboardLayout.prototype.addIGadget = function(iGadget) {
	this.iGadgets[iGadget.code] = iGadget;
}

DragboardLayout.prototype.removeIGadget = function(iGadget) {
	delete this.iGadgets[iGadget.code];
}

DragboardLayout.prototype.destroy = function() {
	var keys = this.iGadgets.keys();
	for (var i = 0; i < keys.length; i++) {
		this.iGadgets[keys[i]].destroy();
	}
}

DragboardLayout.prototype.acceptMove = function(iGadget, newposition) {
	iGadget.setPosition(newposition);
}