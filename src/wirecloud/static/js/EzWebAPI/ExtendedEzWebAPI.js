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


function _ExtendedEzWebAPI() {
	this.platform = window.parent;

	// Add a new parameterized gadget from Internet
	// Help:
	//     - igadget_name_: String. New name for the iGadget
	//     - variable_values_: Object. New values for the user preferences.
	//         Example:
	//             variable_values = {"var1":"value1", "var2": "value2"};
	//		- url: gadget template url. If the gadget has been previously used it isn't mandatory. 
	_ExtendedEzWebAPI.prototype.addParameterizedGadget = function (vendor, name, version, igadget_name, variable_values, url) {
		this.platform.ShowcaseFactory.getInstance().addParameterizedGadget(vendor, name, version, igadget_name, variable_values, url);
	}


}

var ExtendedEzWebAPI = new _ExtendedEzWebAPI();


