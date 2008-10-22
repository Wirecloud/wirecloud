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

if (!("elementFromPoint" in document)) {

	var elementPositions = function () {
		// *********************************
		// PRIVATE VARIABLES
		// *********************************
		this.elements = [];

		this.getElementByPoint = function(x, y) {
			for (var i = 0; i < this.elements.length; i++){
				var element = this.elements[i];
				var box = element.ownerDocument.getBoxObjectFor(element);
				if (box.x <= x && x <= (box.x+box.width) && box.y <= y && y <= (box.y+box.height)) {
					return element;
				}
			}
			return null;
		}

		this.addElement = function(element){
			this.elements.push(element);
		}

		this.removeElement = function(element){
			this.elements = this.elements.without(element);
		}
	};

	elementPositions = new elementPositions();

	document.elementFromPoint = function(x, y) {
		return elementPositions.getElementByPoint(x, y);
	}

	// Adding a new css rule for the tabs
	var css = document.styleSheets[1];
	css.insertRule('#tab_section .tab {-moz-binding: url("elementfrompoint.xbl#default")}', css.cssRules.length);
}
