/* 
 * MORFEO Project 
 * http://morfeo-project.org 
 * 
 * Component: EzWeb
 * 
 * (C) Copyright 2004 Telefónica Investigación y Desarrollo 
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


var CatalogueFactory  = function () {

	// *********************************
	// SINGLETON INSTANCE
	// *********************************
	var instance = null;

	function Catalogue() {
		
		// *********************************
		//  PRIVATE VARIABLES AND FUNCTIONS
		// *********************************
		
		
		this.catalogueElement = $('mashup_catalogue');
		
		
		// ********************
		//  PRIVILEGED METHODS
		// ********************
		
		this.reloadCompleteCatalogue = function() {
			UIUtils.repaintCatalogue=true;
			UIUtils.sendPendingTags();
			if (UIUtils.isInfoResourcesOpen) {
				UIUtils.isInfoResourcesOpen = false;
				UIUtils.SlideInfoResourceOutOfView('info_resource');
			}
			UIUtils.search = false;
			this.repaintCatalogue(URIs.GET_POST_RESOURCES + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
		}
		
	 	this.emptyResourceList = function() {
			$("resources").innerHTML="";
			_this.clearSelectedResources();
			resources = $H();
		}

		this.getResources = function() {
			return resources;
		}
		
		this.getResource = function(id_) {
			return resources[id_];
		}

		this.addMashupResource = function(mashupId) {
			/***CALLBACK methods***/
			var cloneOk = function(transport){
				/*var response = transport.responseText;
				var wsInfo = eval ('(' + response + ')');
				//create the new workspace and go to it
				opManager = OpManagerFactory.getInstance();
				opManager.workSpaceInstances[wsInfo.workspace.id] = new WorkSpace(wsInfo.workspace);
		
				ShowcaseFactory.getInstance().reload(wsInfo.workspace.id);*/
				window.location.reload()
				
			}
			var cloneError = function(transport, e){
				//ERROR			
				
			}
			
			var cloneURL = URIs.GET_ADD_WORKSPACE.evaluate({'workspace_id': mashupId});
			PersistenceEngineFactory.getInstance().send_get(cloneURL, this, cloneOk, cloneError);
		}

		this.hide = function(){
			this.catalogueElement.setStyle({display: "none"});
			OpManagerFactory.getInstance().showWorkspaceMenu();
		}

		this.loadCatalogue = function() {

			// ******************
			//  CALLBACK METHODS 
			// ******************

			//Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.

			var onError = function(transport, e) {
				//ERROR
			}

			/* load the resources and paint the catalogue */
			var loadResources = function(transport) {
				var responseJSON = transport.responseText;
			    var jsonResourceList = eval ('(' + responseJSON + ')');
			    jsonResourceList = jsonResourceList.resourceList;
				
				var html = '<div class="container mashup_tab" id="mashup_container">';
				html+= '<div class="toolbar anchorTop"><a href="javascript:CatalogueFactory.getInstance().hide()" class="back_button"><span class="menu_text">Menu</span></a><h1>Catalogue</h1></div>';
				html+= '<div class="tab_content">';
				for (var i = 0; i<jsonResourceList.length; i++)
				{
					var resource = jsonResourceList[i];
					var visibleName = resource.name;
					if (resource.name.length > 13)
						var visibleName = visibleName.substring(0, 11)+"...";
					html+= '<div class="igadget_item">';
					html+= '<a href="javascript:CatalogueFactory.getInstance().addMashupResource('+resource.mashupId+');">';
					html+= '<img class="igadget_icon" src="'+resource.uriImage+'" />'
					html+= '</a>';
					html+= '<a href="javascript:OpManagerFactory.getInstance().addMashupResource('+resource.mashupId+');">'+visibleName+'</a>';
					html+= '</div>';
				}
				html+= '</div>';
				this.catalogueElement.update(html);
				this.catalogueElement.setStyle({display: "block"});
				$('workspace_menu').setStyle({display: "none"});;
			}
			
			var param = {orderby: "-creation_date", search_criteria: "mashup, mobileok", search_boolean:"AND"};
			var persistenceEngine = PersistenceEngineFactory.getInstance();
			var search_url = URIs.GET_RESOURCES_SIMPLE_SEARCH + "/tag/1/10";
			
			// Get Resources from PersistenceEngine. Asyncrhonous call!
			persistenceEngine.send_get(search_url, this, loadResources, onError, param);
		}
	
	}
	
	// ************************
	//  SINGLETON GET INSTANCE
	// ************************
	
	return new function() {
    	this.getInstance = function() {
    		if (instance == null) {
        		instance = new Catalogue();
         	}
         	return instance;
       	}
	}
	
}();
