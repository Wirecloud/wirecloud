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

var lastOpenCategory = null;

//CategoryManager

var CategoryManager  = function (htmlElement) {
	
	// *********************************
	//  PRIVATE VARIABLES AND FUNCTIONS
	// *********************************
	this.categories;				//tree structure for categories
	this.categorySection = document.createElement('ul');
	
	this.solutionsMenu; 			//a prepared menu to be used by workspaces to access the catalogue list view
	
	//append the new category section to the catalogue html element
	var element_selector= '#' + htmlElement.id;
	$$(element_selector+' #tag_categories .widget_content')[0].appendChild(this.categorySection);
	
	//CONSTRUCTOR
	this.categories = new Hash(JSON.parse(tag_categories));
	
	//paint the workspace "find solutions" menu
	if (this.categories.keys().length > 0){
		var idSolutionsMenu = 'solutionsMenu_'+htmlElement.id;
		var solutionsMenuHTML = '<div id="'+idSolutionsMenu+'" class="drop_down_menu"></div></div>';
		new Insertion.After($('menu_layer'), solutionsMenuHTML);
		this.solutionsMenu = new DropDownMenu(idSolutionsMenu, null);
		
		//The first option is always "View all solutions"
		this.solutionsMenu.addOption(null,
									 gettext('View all solutions'),
									 function () {
									 		LayoutManagerFactory.getInstance().hideCover();
											OpManagerFactory.getInstance().showListCatalogue(); 
					 				 }.bind(this),
					 				 0);

		//fill category section
		this.createCategories();
	}
	
}

CategoryManager.prototype._createCatElement = function(catName, category, parent){

		var catObject = new TagCategory(catName, category, parent, this);
		catObject.addOptionToWSMenu();
		return catObject.getElement();
}

CategoryManager.prototype.createCategories = function(){

	var	catElement;

	var catKeys = this.categories.keys().sort();
	for (var i=0;i<catKeys.length;i++){
		catElement = this._createCatElement(catKeys[i], this.categories[catKeys[i]]);
		this.categorySection.appendChild(catElement);
	}
}

CategoryManager.prototype.closeCategories = function(){
	if(lastOpenCategory){
		lastOpenCategory.catNameElement.removeClassName('selected_cat');
		var openCategories = $$('.children_cats.open');
		for(var i=0; i<openCategories.length;i++){
			openCategories[i].removeClassName('open');
		}
		lastOpenCategory = null;
	}
}

CategoryManager.prototype.getSolutionsMenu = function(){
	return this.solutionsMenu;
}

//TagCategory

var TagCategory = function(name, categoryStructure, parent, categoryManager){
		
	// *********************************
	//  PRIVATE VARIABLES AND FUNCTIONS
	// *********************************
	this.name = name;
	this.tags = categoryStructure['tags'];
	this.children = new Hash(categoryStructure['children']);
	this.catNameElement;
	this.catChildrenElement;
	this.parent = parent;
	this.categoryManager = categoryManager;
	
}

//Tag categories have an option in the "find solution" workspace submenu in order to navigate to the
//correspondent category in the catalogue List view from the dragboard view.
TagCategory.prototype.addOptionToWSMenu = function(){

	this.categoryManager.solutionsMenu.addOption(null,
					this.name,
					function () {
						LayoutManagerFactory.getInstance().hideCover();
						CatalogueFactory.getInstance('LIST_VIEW').show();
						this.selectMyResources();
						
					}.bind(this),
					0);

}

//creates the HTML element that represents a category
TagCategory.prototype.getElement = function(){

		var	catElement;

		//category div
		catElement = document.createElement('li');
		catElement.id = this.name;
		catElement.className = 'category_element';
		
		//category name
		this.catNameElement = document.createElement('span');
		Element.extend(this.catNameElement);
		this.catNameElement.className = 'category_name';
		this.catNameElement.onclick = function(){this.selectMyResources()}.bind(this);
		this.catNameElement.innerHTML = this.name;
		
		catElement.appendChild(this.catNameElement);
		
		//category children
		this.catChildrenElement = document.createElement('ul');
		Element.extend(this.catChildrenElement);
		this.catChildrenElement.className = 'children_cats';
		var childCatElement;
		
		var childKeys = this.children.keys().sort();
		for (var i=0;i<childKeys.length;i++){
			childCatElement = this.categoryManager._createCatElement(childKeys[i], this.children[childKeys[i]], this);
			this.catChildrenElement.appendChild(childCatElement);
		}
		catElement.appendChild(this.catChildrenElement);
		return catElement;

}

//select the resources that are tagged with the tags of this TagCategory
TagCategory.prototype.selectMyResources = function(){

	//close open elements
	var element = lastOpenCategory;
	if(lastOpenCategory && lastOpenCategory != this)
		lastOpenCategory.catNameElement.removeClassName('selected_cat');

	while(element && element != this && element != this.parent){
		element.close();
		element = element.parent;
	}

	if(lastOpenCategory != this){
		//open the child elements
		this.open();
	
		//show related gadgets
		var tags = this.tags.join(' ');
		UIUtils.searchByTag(URIs.GET_RESOURCES_SIMPLE_SEARCH, tags, true);
	}
}

TagCategory.prototype.open = function(){
	//if I'm not visible I have to tell my parent to open itself.
	if (this.parent && !this.parent.catChildrenElement.hasClassName('open')){
		this.parent.open();
	}
	
	if(lastOpenCategory)
		lastOpenCategory.catNameElement.removeClassName('selected_cat');
	
	lastOpenCategory = this;
	this.catNameElement.addClassName('selected_cat');
	this.catChildrenElement.addClassName('open');
}

TagCategory.prototype.close = function(){
	this.catChildrenElement.removeClassName('open');
	lastOpenCategory = null;
}