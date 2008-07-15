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