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

var DOM_Wrapper = function (root_element, element_ids) {
  this.root_element = root_element;
  this.dom_element_ids = element_ids;
  
  this.dom_elements = null;
  this.element_codes = null;
}

DOM_Wrapper.prototype.init = function () {
  this.dom_elements = new Hash();
  this.element_codes = new Hash();
  
  var element_codes = this.dom_element_ids.keys();
  
  for (var i=0; i<element_codes.length; i++) {
    var element_code = element_codes[i];
    var element_selector = this.dom_element_ids[element_code];
  
    var elements = this.root_element.getElementsBySelector(element_selector);
	  
    if (! elements || elements.length != 1) {
      alert("Error in catalogue rendering!")
	  return;
    }
	  
    var element = elements[0];
	  
    this.dom_elements[element_code] = element;
    this.element_codes[element] = element_code;
  }
}

DOM_Wrapper.prototype.get_element_by_code = function (element_code) {
  return this.dom_elements[element_code];
}

DOM_Wrapper.prototype.get_code_by_element = function (element) {
  return this.element_codes[element];
}
