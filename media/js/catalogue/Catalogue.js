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

var CatalogueFactory  = function () {

	Event.observe($('catalogue_link'), "click", function(){
				OpManagerFactory.getInstance().showMosaicCatalogue()}, false, "show_catalogue");

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var mosaic = null;
	var list = null;
	var active_catalogue = null;
	var active_catalogue_name = null;
	var DEFAULT_VIEW = "MOSAIC_VIEW";

	
	// ************************
	//  SINGLETON GET INSTANCE
	// ************************
				
	return new function() {
		this.getInstance = function(view_type) {
			if (!list && !mosaic){
			
				//Callbacks
				this.onLoadSuccess = function(transport){
					//update gadget info in the showcase
					var response = transport.responseText;
					var data = JSON.parse(response);
					ShowcaseFactory.getInstance().setGadgetsState(data["gadgets"]);
					OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.CATALOGUE);
				}
				this.onLoadError = function(transport){
					//the gadget version is not updated
					OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.CATALOGUE);
				}
				
				//check the version of the showcase gadgets
				var showcase_gadgets = ShowcaseFactory.getInstance().getGadgetsData();
				var params = {"gadgets":Object.toJSON(showcase_gadgets)};
				PersistenceEngineFactory.getInstance().send_post(URIs.POST_CHECK_VERSIONS, params, this, this.onLoadSuccess, this.onLoadError);
			
			}
			
			if (view_type == "LIST_VIEW"){
				if (!list)
					list = new CatalogueListView();
				active_catalogue = list;
				active_catalogue_name = "LIST_VIEW";
			}
			
			if (view_type =="MOSAIC_VIEW"){
				if(!mosaic)
					mosaic = new CatalogueMosaicView();
				active_catalogue = mosaic;
				active_catalogue_name = "MOSAIC_VIEW";
			}
			

			// DEFAULT_VIEW
			if (! active_catalogue) {
				if (DEFAULT_VIEW == "LIST_VIEW")	{			
					list = new CatalogueListView();
					active_catalogue = list;
					active_catalogue_name = "LIST_VIEW";
				}
	    	
		    	if (DEFAULT_VIEW == "MOSAIC_VIEW") {
					mosaic = new CatalogueMosaicView();
					active_catalogue = mosaic;
					active_catalogue_name = "MOSAIC_VIEW";
				}
			}
		
			return active_catalogue;
		}
		this.getViewName= function() {
			if (! active_catalogue)
				return DEFAULT_VIEW;
		
			return active_catalogue_name;
		}
	}
}();

