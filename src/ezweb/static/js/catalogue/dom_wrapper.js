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

/*jslint white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global $, alert, Hash*/
"use strict";

var DOM_Wrapper = function (root_element, element_ids) {
    this.root_element = root_element;
    this.header_element = $('catalogue_header');

    this.dom_element_ids = element_ids;

    this.dom_codes = null;
};

DOM_Wrapper.prototype.search_by_selector = function (element_selector) {
    var elements = this.root_element.getElementsBySelector(element_selector);

    if (elements && elements.length === 1) {
        return elements[0];
    }

    // Missing selector in this.root_element
    // Looking for it in this.header
    elements = this.header_element.getElementsBySelector(element_selector);

    if (elements && elements.length === 1) {
        return elements[0];
    } else {
        alert("Error in catalogue rendering!");
        return null;
    }
};

DOM_Wrapper.prototype.init = function () {
    var element_codes, element_code, element_selector, element, i;

    this.dom_codes = new Hash();
    element_codes = this.dom_element_ids.keys();

    for (i = 0; i < element_codes.length; i += 1) {
        element_code = element_codes[i];
        element_selector = this.dom_element_ids[element_code];

        element = this.search_by_selector(element_selector);
              
        this.dom_codes[element_code] = element;
    }
};

DOM_Wrapper.prototype.get_element_by_code = function (element_code) {
    return this.dom_codes[element_code];
};

DOM_Wrapper.prototype.get_code_by_element = function (element) {
    var codes, code, i, html_element;

    codes = this.dom_codes.keys();

    for (i = 0; i < codes.length; i += 1) {
        code = codes[i];
        html_element = this.dom_codes[code];

        if (html_element === element) {
            return code;
        }
    }

    alert('Missing element!');

    return null;
};

DOM_Wrapper.prototype.get_element_by_selector = function (selector) {
    var elements = this.root_element.getElementsBySelector(selector);
  
    if (!elements || elements.length !== 1) {
        alert("Error in catalogue rendering!");
        return;
    }
	  
    return elements[0];
};
