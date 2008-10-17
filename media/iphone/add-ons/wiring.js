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
 
// Special function to retrieve the related gadgets (used in the iphone prototype)
	Wiring.prototype.getRelatedIgadgets = function(iGadgetId){
		var events = this.iGadgets[iGadgetId].events;
		var related = new Array();
		var outputs = null;
		var o = null;
		var id = null;
		var channelOutputs = null;
		
		for (i=0;i<events.length;i++){
			var outputs = events[i].outputs; //gadget outputs
			for (j=0;j<outputs.length;j++){
				o = outputs[j];
				if (o.connectableType=="inout"){ //it is a channel
					channelOutputs = o.outputs;
					for (k=0;k<channelOutputs.length;k++){ //channel outputs -> slots
						id = channelOutputs[k].variable.iGadget;
						if (!related.elementExists(id)){ //the iGadgetId is not in the related list already
							related.push(id); //add to the related igadgets list the iGadgetId associated with the channel outputs
						}
					}
				}
			}
		}
		return related;
	}