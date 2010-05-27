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

  // *********************************
  // SINGLETON INSTANCE
  // *********************************
	
  var catalogue_dom = $('showcase');
  var show_catalogue_button = $('catalogue_link');
	
  var persistence_engine = PersistenceEngineFactory.getInstance();
	  
  // FACTORIES
  var list_view_factory = new ListViewFactory();
	  
  ////////////////////
  // DEFAULT VALUE
  ////////////////////
  var default_view_factory = list_view_factory;
	  
  // ACTIVE VALUES
  var active_instance = null;
  var last_used_factory = null;
	
  // ************************
  //  SINGLETON GET INSTANCE
  // ************************
				
  return new function() {
    this.getInstance = function() {
	  if (! active_instance) {
		active_instance = default_view_factory.create_catalogue(catalogue_dom, show_catalogue_button, persistence_engine);
		last_used_factory = default_view_factory;
		  
		OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.CATALOGUE);
	  }
		
	  return active_instance;
	}
	  
	this.getListView = function() {
	  if (! active_instance) {
		active_instance = list_view_factory.create_catalogue(catalogue_dom, show_catalogue_button, persistence_engine);
		last_used_factory = list_view_factory;
		  
		OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.CATALOGUE);
	  } else if (last_used_factory != list_view_factory) {
		active_instance.destroy()
		 
		active_instance = list_view_factory.create_catalogue(catalogue_dom, show_catalogue_button, persistence_engine);
		last_used_factory = list_view_factory;
	  }
		
	  return active_instance
	}	    		
  }
}();