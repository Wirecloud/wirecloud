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

var _createCatElement = function(catName, category, parent){

		var catObject = new TagCategory(catName, category['tags'], new Hash(category['children']), parent);
		return catObject.getElement();
}

//CategoryManager

var CategoryManager  = function () {
	
	// *********************************
	//  PRIVATE VARIABLES AND FUNCTIONS
	// *********************************
	this.categories;				//tree structure for categories
	this.categorySection = document.createElement('ul');
	$$('#tag_categories .widget_content')[0].appendChild(this.categorySection);
	
	//CONSTRUCTOR
	this.categories = new Hash(eval('(' + tag_categories + ')'));

	//fill category section
	this.createCategories();
	
}

CategoryManager.prototype.createCategories = function(){

	var	catElement;

	var catKeys = this.categories.keys().sort();
	for (var i=0;i<catKeys.length;i++){
		catElement = _createCatElement(catKeys[i], this.categories[catKeys[i]]);
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

//TagCategory

var TagCategory = function(name, tags, children, parent){
		
	// *********************************
	//  PRIVATE VARIABLES AND FUNCTIONS
	// *********************************
	this.name = name;
	this.tags = tags;
	this.children = children;
	this.catNameElement;
	this.catChildrenElement;
	this.parent = parent;
	
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
		this.catNameElement.className = 'category_name';
		this.catNameElement.onclick = function(){this.selectMyResources()}.bind(this);
		this.catNameElement.innerHTML = this.name;
		
		catElement.appendChild(this.catNameElement);
		
		//category children
		this.catChildrenElement = document.createElement('ul');
		this.catChildrenElement.className = 'children_cats';
		var childCatElement;
		
		var childKeys = this.children.keys().sort();
		for (var i=0;i<childKeys.length;i++){
			childCatElement = _createCatElement(childKeys[i], this.children[childKeys[i]], this);
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
	lastOpenCategory = this;
	this.catNameElement.addClassName('selected_cat');
	this.catChildrenElement.addClassName('open');
}

TagCategory.prototype.close = function(){
	this.catChildrenElement.removeClassName('open');
	lastOpenCategory = null;
}