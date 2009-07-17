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

function run_initial_script (workspace) {

	if (! (post_load_script && post_load_script != '')) {
		// There is not post_load_script! Finishing!
		return;
	}
	
	var initial_script = post_load_script.evalJSON();

	for (var i=0; i<initial_script.length; i++) {
		var command_object = initial_script[i];
		
		if (command_object['command'] == 'instantiate_resource') {
			var vendor_name = command_object['vendor_name'];
			var name = command_object['name'];
			var version = command_object['version'];
			var template = command_object['template'];
			
			if (vendor_name && name && version && template) {
				ShowcaseFactory.getInstance().addGadget(vendor_name, name, version, template);
			}
		}
	}
}

