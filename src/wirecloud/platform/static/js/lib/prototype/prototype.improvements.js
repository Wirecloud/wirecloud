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
 * Prototype Improvements v0.1
 *
 * Various additions to the prototype.js
 */

Prototype.BrowserFeatures.OnHashChangeEvent = 'onhashchange' in window;
if (window.navigator.vendor) {
    Prototype.Browser.Safari = window.navigator.vendor.indexOf('Apple') !== -1;
} else {
    Prototype.Browser.Safari = false;
}

Object.extend(Event, {
	KEY_SHIFT:    16,
	KEY_CONTROL:  17,
	KEY_CAPSLOCK: 20,
	KEY_SPACE: 32,
	keyPressed: function(event) {
		return Prototype.Browser.IE ? window.event.keyCode : event.which;
	}
});

if (Prototype.BrowserFeatures.ElementExtensions) {
	var isElement = function(el) {
		return el instanceof Element;
	}
} else {
	var isElement = function(el) {
		return el && ('nodeType' in el) && (el.nodeType === 1);
	}
}

//if (Prototype.Browser.IE || Element.prototype.getBoundingClientRect != undefined) {

if (document.documentElement.getBoundingClientRect != undefined) {
	Element.getRelativeBoundingClientRect = function(element1, element2) {
		var rect1 = element1.getBoundingClientRect();
		var rect2 = element2.getBoundingClientRect();
		return {
			top: rect1.top - rect2.top,
			left: rect1.left - rect2.left,
			right: rect1.right - rect2.left,
			bottom: rect1.bottom - rect2.top
		}
	}
} else if (document.getBoxObjectFor != undefined) {
	Element.getRelativeBoundingClientRect = function(element1, element2) {
		var box1 = document.getBoxObjectFor(element1);
		var box2 = document.getBoxObjectFor(element2);
		return {
			top: box1.screenY - box2.screenY,
			left: box1.screenX - box2.screenX,
			right: box1.screenX + box1.width - box2.screenX,
			bottom: box1.screenY + box1.height - box2.screenY
		}
	}
} else {
	// Unsupported browser
}

/*
 * ARRAY EXTENSIONS
 */

Array.prototype.getElementById = function (id) {
	for (var i = 0; i < this.length; i++) {
		if (this[i].getId() == id)
			return this[i];
	}
	return null;
};

Array.prototype.remove = function(element) {
	var index = this.indexOf(element);
	if (index != -1)
		this.splice(index, 1);
};

Array.prototype.removeById = function (id) {
	var element;
	var elementId;
	for (var i = 0; i < this.length; i++) {
		if (typeof this[i].getId == "function") {
			elementId = this[i].getId();
		} else {
			elementId = this[i].id;
		}

		if (elementId == id) {
			element = this[i];
			this.splice(i, 1);
			return element;
		}
	}
	return null;
};
