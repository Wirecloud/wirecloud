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

function UIUtils() {
	// *********************************
	//           STATIC CLASS
	// *********************************
}

UIUtils.tagmode = false;
UIUtils.repaintCatalogue=false;
UIUtils.sendingPendingTags = false;
UIUtils.selectedResource = null;
UIUtils.selectedVersion = null;
UIUtils.imageBottom = '';
UIUtils.imageContent = '';
UIUtils.infoResourcesWidth = 400;
UIUtils.isInfoResourcesOpen = false;
UIUtils.page = 1;
UIUtils.off = 10;
UIUtils.orderby = '-popularity';
UIUtils.num_items = 0;
UIUtils.search = false;
UIUtils.searchValue = [];
UIUtils.searchCriteria = '';
UIUtils.counter=0;
UIUtils.globalTags='all';


UIUtils.addResourceToApplication = function(resource_id, application_id) {
	var addingToAppSuccess = function (response) {
		UIUtils.repaintOrderedByCreationDate();
	}
	
	var addingToAppError = function (response) {
		alert ("Error en addingToApp");
	}
	
	//Send request the application manager
	var params = new Hash();
	var url = URIs.ADD_RESOURCE_TO_APP.evaluate({"application_id":application_id,"resource_id":resource_id});
	
	PersistenceEngineFactory.getInstance().send_post(url, params, this, addingToAppSuccess, addingToAppError);
}


UIUtils.addResource = function(url, paramName, paramValue) {
	UIUtils.repaintCatalogue=true;
	UIUtils.search = false;
	
	var newResourceOnSuccess = function (response) {
	    var response_json = response.responseText;
		var result = JSON.parse(response_json);
	 
		//showYesNoDialog handlers
		//"Yes" handler
	 	var continueAdding = function (result){
	 		//leave that gadget version and continue
	 		if (result['contratable']) {
				// Link gadget with application
				var gadget_id = result['gadgetId'];
				var available_apps = result['availableApps'];
				
				CatalogueFactory.getInstance().setAvailableApps(available_apps);
				
				LayoutManagerFactory.getInstance().showWindowMenu('addGadgetToAppMenu', UIUtils.addResourceToApplication, function () { LayoutManagerFactory.getInstance().hideCover() }, gadget_id);
		    } else {
		    	UIUtils.repaintOrderedByCreationDate();
		    }
	 	}
	 
	 	//"No" handler
		var rollback = function(result)	{

			var resourceURI = URIs.GET_POST_RESOURCES + "/" + result['vendor'] + "/" + result['gadgetName'] + "/" + result['version'];
	
			var onError = function(transport, e) {
				var logManager = LogManagerFactory.getInstance();
				var msg = logManager.formatError(gettext("Error deleting the Gadget: %(errorMsg)s."), transport, e);
				logManager.log(msg);
				LayoutManagerFactory.getInstance().hideCover();
				// Process
			}

			//Send request to delete de gadget
			PersistenceEngineFactory.getInstance().send_delete(resourceURI, this, function (){LayoutManagerFactory.getInstance().hideCover();}, onError);
			
		}
	    
	    var context = {result: result, continueAdding: continueAdding, rollback: rollback};
	    //check if the new gadget is the last version
	    if (result['last_version'] != result['version']) {
	    	//inform the user about the situation
	    	var msg = gettext("The resource you are adding to the catalogue is not the latest version. " +
	    			"The current version, %(curr_version)s, is lower than the latest version in the catalogue: %(last_version)s." +
	    			" Do you really want to continue to add version %(curr_version)s ");
	    	msg = interpolate(msg, {curr_version: result['version'], last_version: result['last_version'] }, true);
	    	LayoutManagerFactory.getInstance().showYesNoDialog(msg, function (){
	    																this.continueAdding(this.result)
	    															}.bind(context),
	    															function (){
	    																this.rollback(this.result)
	    															}.bind(context), Constants.Logging.WARN_MSG);
	    }
	    else{
	    	continueAdding(result);
	    }    
	 
	}
	
	var newResourceOnError = function (transport, e) {
		var response = transport.responseText;
		var response_message = JSON.parse(response)['message'];
	
		var logManager = LogManagerFactory.getInstance();
		var msg = gettext("The resource could not be added to the catalogue: %(errorMsg)s.");
/*
		if (response_message.indexOf("IntegrityError") > 0) {
			msg = interpolate(msg, {errorMsg: gettext("The gadget is already added to the catalogue")}, true);
		} else {
			msg = logManager.formatError(msg, transport, e)
		}
*/
		msg = interpolate(msg, {errorMsg: response_message}, true);
		LayoutManagerFactory.getInstance().hideCover(); //TODO: is it necessary?
		LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
		logManager.log(msg);
	}

	var persistenceEngine = PersistenceEngineFactory.getInstance();

	var params = new Hash();
	params[paramName] = paramValue;

	persistenceEngine.send_post(url, params, this, newResourceOnSuccess, newResourceOnError);
}

UIUtils.repaintOrderedByCreationDate = function () {
	UIUtils.orderby = '-creation_date';
	UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(), 1, UIUtils.getNum_items());
}

UIUtils.getSelectedResource = function() {
	return UIUtils.selectedResource;
}

/* This method selects all the resources related by wiring in the catalogue*/
UIUtils.lightUpConnectableResources = function(resourceId_) {
/*
	var resource = CatalogueFactory.getInstance().getResource(resourceId_);
	var slots = resource.getSlots();
	var events = resource.getEvents();
	var resources = CatalogueFactory.getInstance().getResources().values();
	var slots2;
	var events2;
	for (var i=0; i<resources.length; i++){
		slots2 = resources[i].getSlots();
		var lookup = {};
		for (var j=0; j<slots2.length; j++) {
			lookup[slots2[j]] = slots2[j];
		}
		for (var k =0; k<events.length; k++) {
			if (typeof lookup[events[k]] != 'undefined') {
				var bottom = $('resource_'+i + '_bottom');
				UIUtils.imageConnectableBottom = bottom.style.backgroundImage;
				bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom-select-slot.png)';
				var content = $('resource_'+i + '_content');
				UIUtils.imageConnectableContent = content.style.backgroundImage;
				content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill-select-slot.png)';
				break;
			}
		}
		events2 = resources[i].getEvents();
		var lookup = {};
		for (var j=0; j<events2.length; j++) {
			lookup[events2[j]] = events2[j];
		}
		for (var k =0; k<slots.length; k++) {
			if (typeof lookup[slots[k]] != 'undefined') {
				var bottom = $('resource_'+i + '_bottom');
				UIUtils.imageConnectableBottom = bottom.style.backgroundImage;
				bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom-select-event.png)';
				var content = $('resource_'+i + '_content');
				UIUtils.imageConnectableContent = content.style.backgroundImage;
				content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill-select-event.png)';
				break;
			}
		}
	}
*/
}

UIUtils.showResourceInfo = function(resourceId_) {
	UIUtils.selectedResource = resourceId_;
	$(UIUtils.selectedResource).addClassName('current');
	CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).showInfo();
}

UIUtils.updateGadgetXHTML = function() {
	var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);

	var dict = {vendor: resource.getVendor(), name: resource.getName(), version: resource.getVersion()};

	var resourceURI = URIs.GET_GADGET.evaluate(dict) + "/xhtml";

	var onError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error updating the XHTML: %(errorMsg)s."), transport, e);
		logManager.log(msg);
		LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
		// Process
	}

	var onSuccess = function(transport) {
		LayoutManagerFactory.getInstance().showMessageMenu(gettext('The gadget code has been successfully updated'));
	}

	PersistenceEngineFactory.getInstance().send_update(resourceURI, "", this, onSuccess, onError);
}

UIUtils.clearPreviousSearch = function() {
	UIUtils.search = false;
	UIUtils.searchValue = [];
	UIUtils.searchCriteria = '';
}

UIUtils.toggle_elements = function(elementIds_) {
	for (i=0;i<elementIds_.length ;i++ )
	{
		UIUtils.toggle(elementIds_[i]);
	}
}

UIUtils.toggle = function(elementId_) {
	var element = $(elementId_);
	if (element.style.display != 'none') {
		element.style.display = 'none';
	} else {
		element.style.display = 'block';
	}
}

UIUtils.show = function(elementId_) {
	var element = $(elementId_);
	element.style.display = 'inline';
}

UIUtils.hidde = function(elementId_) {
	var element = $(elementId_);
	element.style.display = 'none';
}

UIUtils.changeImage = function(elementId_, newImage_) {
	var element = $(elementId_);
	element.src = newImage_;
}

UIUtils.simpleSearch = function(url, criteria) {
	UIUtils.repaintCatalogue = true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.searchValue = [];
	switch (criteria) {
	case 'simple_or':
		UIUtils.searchValue[0] = $('simple_search_text').value;
		break;
	case 'and':
		UIUtils.searchValue[0] = $('advanced_search_text_and').value;
		break;
	case 'or':
		UIUtils.searchValue[0] = $('advanced_search_text_or').value;
		break;
	case 'not':
		UIUtils.searchValue[0] = $('advanced_search_text_not').value;
		break;
	case 'tag':
		UIUtils.searchValue[0] = $('advanced_search_text_tag').value;
		break;
	case 'event':
		UIUtils.searchValue[0] = $('advanced_search_text_event').value;
		break;
	case 'slot':
		UIUtils.searchValue[0] = $('advanced_search_text_slot').value;
		break;
	}
	UIUtils.searchValue[0] = UIUtils.filterString(UIUtils.searchValue[0]);

	if (UIUtils.searchValue[0] == "") {
//		$('header_always_error').style.display="block";
//		UIUtils.getError($('header_always_error'),gettext("Indicate a criteria in search formulary"));
		$('header_always_error').style.display = 'none';
		UIUtils.page = 1;
		UIUtils.off = 10;
		UIUtils.search = false;
		UIUtils.searchCriteria = '';
		CatalogueFactory.getInstance().repaintCatalogue(URIs.GET_POST_RESOURCES+ "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
	} else {
		$('header_always_error').style.display = 'none';
		UIUtils.setPage(1);
		UIUtils.search = true;
		UIUtils.searchCriteria = criteria;
		CatalogueFactory.getInstance().repaintCatalogue(url + "/" + criteria + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
	}
}

UIUtils.viewAll = function (url, criteria) {
	$('header_always_error').style.display = 'none';
	UIUtils.page = 1;
	UIUtils.off = 10;
	UIUtils.search = false;
	UIUtils.searchCriteria = '';
	CatalogueFactory.getInstance().repaintCatalogue(URIs.GET_POST_RESOURCES+ "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
}

UIUtils.globalSearch = function(url) {
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.searchValue = [];
	UIUtils.searchValue[0] = UIUtils.filterString($('advanced_search_text_and').value);
	UIUtils.searchValue[1] = UIUtils.filterString($('advanced_search_text_or').value);
	UIUtils.searchValue[2] = UIUtils.filterString($('advanced_search_text_not').value);
	UIUtils.searchValue[3] = UIUtils.filterString($('advanced_search_text_tag').value);
	UIUtils.searchValue[4] = UIUtils.filterString($('advanced_search_text_event').value);
	UIUtils.searchValue[5] = UIUtils.filterString($('advanced_search_text_slot').value);

	if (UIUtils.searchValue[0] == "" && UIUtils.searchValue[1] == "" && UIUtils.searchValue[2] == "" && UIUtils.searchValue[3] == "" && UIUtils.searchValue[4] == "" && UIUtils.searchValue[5] == ""){
		$('header_always_error').style.display="block";
		UIUtils.getError($('header_always_error'),gettext("Indicate a criteria in search formulary"));
	} else {
		$('header_always_error').style.display = 'none';
		UIUtils.setPage(1);
		UIUtils.search = true;
		UIUtils.searchCriteria = 'global';
		CatalogueFactory.getInstance().repaintCatalogue(url + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
	}
}

UIUtils.clearSearchForm = function() {
	$('advanced_search_text_and').value = "";
	$('advanced_search_text_or').value = "";
	$('advanced_search_text_not').value = "";
	$('advanced_search_text_tag').value = "";
	$('advanced_search_text_event').value = "";
	$('advanced_search_text_slot').value = "";
}

UIUtils.searchByConnectivity = function(url, criteria, search_value) {
	var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
	var name = resource.getName();
	var version = resource.getVersion();
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.searchValue = [];
	$('header_always_error').style.display = 'none';
	UIUtils.setPage(1);
	UIUtils.search = true;
	UIUtils.searchValue[0] = search_value;
	UIUtils.searchCriteria = criteria;
	CatalogueFactory.getInstance().repaintCatalogue(url + "/" + criteria + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset(), name, version);
}

UIUtils.searchByGlobalConnectivity = function(url, search_events, search_slots) {
	var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
	var name = resource.getName();
	var version = resource.getVersion();
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.searchValue = [];
	$('header_always_error').style.display = 'none';
	UIUtils.setPage(1);
	UIUtils.search = true;
	UIUtils.searchValue[0] = search_events;
	UIUtils.searchValue[1] = search_slots;
	UIUtils.searchCriteria = 'connectEventSlot';
	CatalogueFactory.getInstance().repaintCatalogue(url + "/connectEventSlot/" + UIUtils.getPage() + "/" + UIUtils.getOffset(), name, version);
}

//this function is called on searching by category.
//keepCatSection parameter allows knowing whether the category section must be closed or not.
UIUtils.searchByTag = function(url, search_value, keepCatSection) {
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.searchValue = [];
	if (search_value == ""){
		$('header_always_error').style.display="block";
		UIUtils.getError($('header_always_error'),gettext("Indicate a criteria in search formulary"));
	}else{
		$('header_always_error').style.display = 'none';
		UIUtils.setPage(1);
		UIUtils.search = true;
		UIUtils.searchValue[0] = search_value;
		UIUtils.searchCriteria = 'tag';
		//if the search is done from the category section this section musn't be closed on repainting the catalogue
		//closeCatSection is the fourth parameter.
		CatalogueFactory.getInstance().repaintCatalogue(url + "/tag/" + UIUtils.getPage() + "/" + UIUtils.getOffset(), null, null, keepCatSection);
	}
}


UIUtils.cataloguePaginate = function(url, offset, pag, items) {
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	UIUtils.off=offset;
	UIUtils.num_items=items;
	var opManager = OpManagerFactory.getInstance();
	var pages = Math.ceil(UIUtils.getNum_items()/UIUtils.getOffset());

	if (!UIUtils.search)
		url = URIs.GET_POST_RESOURCES;
	else if (UIUtils.searchCriteria=="global")
		url = URIs.GET_RESOURCES_GLOBAL_SEARCH;
	else
		url = URIs.GET_RESOURCES_SIMPLE_SEARCH + "/" + UIUtils.searchCriteria;

	switch (pag) {
	case "first":
		pag = 1;
		break;

	case "prev":
		if (UIUtils.page == 1)
			pag = 1;
		else
			pag = UIUtils.page - 1;
		break;

	case "next":
		if(UIUtils.page == pages)
			pag = pages;
		else
			pag = parseInt(UIUtils.page) + 1;
		break;

	case "last":
		pag = pages;
		break;
	}
	UIUtils.page = pag;

	//we don't want to change the category section
	CatalogueFactory.getInstance().repaintCatalogue(url + "/" + pag + "/" + UIUtils.getOffset(),null, null, true);
}

UIUtils.setOrderby = function(orderby) {
    UIUtils.orderby = orderby.value;
}

UIUtils.getPage = function() {
    return UIUtils.page;
}

UIUtils.setPage = function(page) {
    UIUtils.page = page;
}

UIUtils.getOffset = function() {
    return UIUtils.off;
}

UIUtils.setOffset = function(offset) {
    UIUtils.off = offset;
}

UIUtils.getNum_items = function() {
    return UIUtils.num_items;
}


UIUtils.removeTag = function(id_) {
	var tagger = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getTagger();
	tagger.removeTag(id_);
}

UIUtils.removeGlobalTag = function(id_) {
	var tagger;
	selectedResources = CatalogueFactory.getInstance().getSelectedResources();
	for(var i=0; i<selectedResources.length;i++){
		tagger = CatalogueFactory.getInstance().getResource(selectedResources[i]).getTagger();
		tagger.removeTag(id_);
	}
	var parentHTML = $("my_global_tags");
	var tagHTML = $(id_);
	parentHTML.removeChild(tagHTML);
}

UIUtils.removeAllTags = function() {
	var tagger = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getTagger();
	tagger.removeAll();
	$("tag_alert").style.display='none';
	$("new_tag_text_input").value="";
	$("new_tag_text_input").size=5;
	$("new_tag_text_input").focus();
}

UIUtils.removeAllGlobalTags = function() {
	if(UIUtils.tagmode){
		selectedResources=CatalogueFactory.getInstance().getSelectedResources();
		for(var i=0; i<selectedResources.length;i++){
			tagger = CatalogueFactory.getInstance().getResource(selectedResources[i]).getTagger();
			tagger.removeAll();
		}
	}
	var parentHTML = $("my_global_tags");
	while(parentHTML.childNodes.length > 1)
	{
		parentHTML.removeChild(parentHTML.childNodes[0]);
	}
	$("global_tag_alert").style.display='none';
	$("new_global_tag_text_input").value="";
	$("new_global_tag_text_input").size=5;
	if($("new_global_tag_text").style.display != "none" && $("new_global_tag_text_input").style.display != "none" &&
		$('advanced_tag').style.display != "none"){
		$("new_global_tag_text_input").focus();
	}
	
}

UIUtils.removeTagUser = function(tag,id) {	
	
	var resource = CatalogueFactory.getInstance().getResource(id);
    var tags = resource.getTags();
	var tag_id = null;
	for (var j=0;j<tags.length ; j++)
	{
		if (tags[j].getValue()==tag) {
			tag_id = tags[j].getIdentifier();
			break;
		}
	}
    var tagger = resource.getTagger();
    var resourceURI = "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion() + "/" + tag_id;
	tagger.removeTagUser(URIs.DELETE_TAG, resourceURI,id);		
}

UIUtils.removeGlobalTagUser = function(tag) {	
	
	var resources = CatalogueFactory.getInstance().getSelectedResources();
	for (var i=0; i<resources.length; i++) {
		var resource = CatalogueFactory.getInstance().getResource(resources[i]);
		var tags = resource.getTags();
		for (var j=0;j<tags.length ; j++)
		{
			if (tag == tags[j].getValue())
			{
				var tag_id = tags[j].getIdentifier();
				var tagger = resource.getTagger();
				var resourceURI = "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion() + "/" + tag_id;
				tagger.removeTagUser(URIs.DELETE_TAG, resourceURI,resources[i]);
				//break;
			}
		}
	}
}

UIUtils.sendPendingTags = function() {
  UIUtils.sendingPendingTags = true;
  if (UIUtils.tagmode)
  {
    UIUtils.sendGlobalTags();
  } else {
	if (UIUtils.selectedResource!=null)
	{
		var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
		var tagger = resource.getTagger();

		if (tagger.getTags().size() != 0) {
			UIUtils.sendTags();
		}
	}
  }
  UIUtils.sendingPendingTags = false;
}

UIUtils.sendTags = function() {
	var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
	var tagger = resource.getTagger();
	var resourceURI = "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion();

	if ((tagger.getTags().size() == 0 || $('new_tag_text_input').value.length!= 0) && !UIUtils.sendingPendingTags)
	{
		UIUtils.addTag($('new_tag_text_input'));
	}
	
	tagger.sendTags(URIs.POST_RESOURCE_TAGS, resourceURI, resource);
}

UIUtils.sendGlobalTags = function() {
	//TBD
	var resources = CatalogueFactory.getInstance().getSelectedResources();
	var resource;
	var tagger;
	var resourceURI;
	for(var i=0; i<resources.length; i++){
		resource = CatalogueFactory.getInstance().getResource(resources[i]);
		tagger = resource.getTagger();
		resourceURI = "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion();
		
		if ((tagger.getTags().size() == 0 || $('new_global_tag_text_input').value.length!= 0) && !UIUtils.sendingPendingTags)
		{
			//TODO control de errores
			UIUtils.addGlobalTag($('new_global_tag_text_input'));
		}
		//TODO Aviso de si todo ha ido bien o no

		tagger.sendTags(URIs.POST_RESOURCE_TAGS, resourceURI, resource);
	}
	var parentHTML = $("my_global_tags");
	while(parentHTML.childNodes.length > 1)
	{
		parentHTML.removeChild(parentHTML.childNodes[0]);
	}
}

UIUtils.deleteGadget = function(id) {
	var resource = CatalogueFactory.getInstance().getResource(id);
	if (UIUtils.selectedVersion == null){
		// Removes all versions of the gadget
		var resourceURI = URIs.GET_POST_RESOURCES + "/" + resource.getVendor() + "/" + resource.getName();
	}else{
		// Removes only the specified version of the gadget
		var resourceURI = URIs.GET_POST_RESOURCES + "/" + resource.getVendor() + "/" + resource.getName() + "/" + UIUtils.selectedVersion;
	}
	//resourceURI = encodeURI(resourceURI); -> pjm: in theory, the resourceURI must be encoded, but works well without doing so
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	
	var onError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error deleting the Gadget: %(errorMsg)s."), transport, e);
		logManager.log(msg);
		LayoutManagerFactory.getInstance().hideCover();
		// Process
	}

	var loadCatalogue = function(transport) {
				LayoutManagerFactory.getInstance().hideCover();
				CatalogueFactory.getInstance().repaintCatalogue(URIs.GET_POST_RESOURCES + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
			}
	PersistenceEngineFactory.getInstance().send_delete(resourceURI, this, loadCatalogue, onError);
}

UIUtils.addTag = function(inputText_) {
	var tagger = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getTagger();
	tagger.addTag(inputText_.value);
	inputText_.value = '';
	inputText_.focus();
	inputText_.size = 5;
}

UIUtils.addGlobalTag = function(inputText_) {
	if(inputText_.value.length<3)	{
		$("global_tag_alert").style.display='inline';
		UIUtils.getError($("global_tag_alert"),gettext("Tags must have at least three characters."));
	}else{
		var id = 'new_global_tag_' + UIUtils.counter;
		UIUtils.counter++;
		var tagger;
		selectedResources=CatalogueFactory.getInstance().getSelectedResources();
		for(var i=0; i<selectedResources.length;i++){
			tagger = CatalogueFactory.getInstance().getResource(selectedResources[i]).getTagger();
			tagger.addGlobalTag(inputText_.value);
		}
		UIUtils.paintGlobalTag(id,inputText_.value);
		$("global_tag_alert").style.display='none';
		
		inputText_.value = '';
		inputText_.focus();
		inputText_.size = 5;
	}
}

UIUtils.paintGlobalTag = function(id_, tag_) {
	//$("my_global_tags").innerHTML = "";
	var newTag = UIUtils.createHTMLElement("div", $H({
		id: id_,
		class_name: 'new_global_tag'
	}));
	//$("my_global_tags").appendChild(newTag);
	newTag.appendChild(UIUtils.createHTMLElement("span", $H({
		innerHTML: tag_
	})));
	var image_div = UIUtils.createHTMLElement("div", $H());
	newTag.appendChild(image_div);
	var image_link = UIUtils.createHTMLElement("a", $H({
		title: gettext('Delete gadget')
	}));
	image_link.observe('click', function(event){
		UIUtils.removeGlobalTag(id_);
	});
	image_div.appendChild(image_link);
	var image = UIUtils.createHTMLElement("img", $H({
		src: _currentTheme.getIconURL('showcase-delete')
	}));
	image.observe('mouseover', function(event){
		this.src = _currentTheme.getIconURL('showcase-delete_highlighted');
	});
	image.observe('mouseout', function(event){
		this.src = _currentTheme.getIconURL('showcase-delete');
	});
	image_link.appendChild(image);
	$("my_global_tags").insertBefore(newTag, $("new_global_tag_text"));
}

UIUtils.setResourcesWidth = function() {
	//var tab = $('tab_info_resource');
	var catalogue = $('catalogue');
	var resources = $('resources');
	var center = $('center');
	var left_bar = $('left_bar');

	var computedStyle;
	computedStyle = document.defaultView.getComputedStyle(left_bar, null);
	var extraLeftBarPixels = computedStyle.getPropertyCSSValue('margin-right').getFloatValue(CSSPrimitiveValue.CSS_PX);
	extraLeftBarPixels += computedStyle.getPropertyCSSValue('margin-left').getFloatValue(CSSPrimitiveValue.CSS_PX);
	extraLeftBarPixels += computedStyle.getPropertyCSSValue('border-left-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
	extraLeftBarPixels += computedStyle.getPropertyCSSValue('border-right-width').getFloatValue(CSSPrimitiveValue.CSS_PX);

	computedStyle = document.defaultView.getComputedStyle(center, null);
	var centerBorder = computedStyle.getPropertyCSSValue('border-left-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
	centerBorder += computedStyle.getPropertyCSSValue('border-right-width').getFloatValue(CSSPrimitiveValue.CSS_PX);

	var catalogue_content = $('catalogue_content');
	computedStyle = document.defaultView.getComputedStyle(catalogue_content, null);
	var content_padding_left = computedStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX);

	catalogue_content.style.width = (catalogue.offsetWidth - left_bar.offsetWidth - extraLeftBarPixels - content_padding_left) + 'px';

	if (center) {
		center.style.width = catalogue_content.offsetWidth - content_padding_left - centerBorder - (UIUtils.isInfoResourcesOpen?(UIUtils.infoResourcesWidth + 20):0) + 'px';
//		center.style.width = catalogue.offsetWidth -left_bar.offsetWidth - extraLeftBarPixels - content_padding_left - 2*centerBorder - (UIUtils.isInfoResourcesOpen?(UIUtils.infoResourcesWidth + 20):0) + 'px';
		resources.style.width = center.style.width;
	}
}

UIUtils.setInfoResourceHeight = function(){
	//Get info_resource height
	var difference = $('resources_container').getHeight() - $('info_resource_content').getHeight();
	if (difference > 0)
		$('info_resource').style.height = $('info_resource_content').getHeight() + difference -1 + 'px'; 
	else
				$('info_resource').style.height = $('info_resource_content').getHeight() + 'px'; 


}

UIUtils.openInfoResource = function() {
	if (!UIUtils.isInfoResourcesOpen) {
		UIUtils.isInfoResourcesOpen = true;
		UIUtils.SlideInfoResourceIntoView('info_resource');
		UIUtils.setInfoResourceHeight();
	}
}

UIUtils.closeInfoResource = function() {
	if (UIUtils.isInfoResourcesOpen) {
		UIUtils.isInfoResourcesOpen = false;
		$(UIUtils.selectedResource).removeClassName('current');
		UIUtils.SlideInfoResourceOutOfView('info_resource');
	}
}

UIUtils.SlideInfoResourceIntoView = function(element) {
	$(element).style.overflow = 'hidden';
	$(element).firstChild.style.position = 'relative';
	UIUtils.setResourcesWidth();
	Element.show(element);
	UIUtils.resizeResourcesContainer();
	if (UIUtils.selectedResource != null)
		UIUtils.lightUpConnectableResources(UIUtils.selectedResource);
}

UIUtils.SlideInfoResourceOutOfView = function(element) {
	UIUtils.selectedResource= null;
	$(element).style.overflow = 'hidden';
	$(element).firstChild.style.position = 'relative';
	Element.hide(element);
	UIUtils.setResourcesWidth();
	UIUtils.resizeResourcesContainer();
}

UIUtils.SlideAdvanced = function(element,container) {
    var div = $(container);
    var nodeList = div.childNodes;
    var aux = '';
    var tab = '';
    UIUtils.sendPendingTags();
    if(Element.visible(element)==false){
        for(i=0;i<nodeList.length;i++){
            if(nodeList.item(i).nodeName=="DIV" && nodeList.item(i).id!=element && nodeList.item(i).id!='header_always'){
                if(Element.visible(nodeList.item(i))==true){
					Element.hide(nodeList.item(i));
					UIUtils.resizeResourcesContainer();

                    aux = nodeList.item(i).id.split("_");
                    switch (aux[1].toLowerCase()) {
		            	case "tag":
		            		tab = gettext("Advanced Tagging");
		            		break;
		            	case "search":
		            		tab = gettext("Advanced Search");
		            		break;
		            	case "develop":
		            		tab = gettext("Development Options");
		            		break;
		            	default:
		            		break;
		            }
                    $(nodeList.item(i).id+"_toggle").innerHTML = tab;
                    $(nodeList.item(i).id+"_toggle").removeClassName('advanced_selected');
                    if(nodeList.item(i).id=="advanced_tag"){UIUtils.deactivateTagMode();}
                }
            }
        }

		Element.show(element);
		UIUtils.resizeResourcesContainer();			


        aux = element.split("_");
        switch (aux[1].toLowerCase()) {
        	case "tag":
        		tab = gettext("Hide Tagging");
        		break;
        	case "search":
        		tab = gettext("Simple Search");
        		break;
			case "develop":
				tab = gettext("Hide Development Options");
				break;
        	default:
        		break;
        }
       	$(element+"_toggle").innerHTML = tab;
		$(element+"_toggle").addClassName('advanced_selected');
		if(element=="advanced_tag"){UIUtils.activateTagMode();}
   }
   else {
   		Element.hide(element);
   		UIUtils.resizeResourcesContainer();
   		
        aux = element.split("_");
        switch (aux[1].toLowerCase()) {
        	case "tag":
        		tab = gettext('Advanced Tagging');
        		break;
        	case "search":
        		tab = gettext('Advanced Search');
        		break;
        	case "develop":
        		tab = gettext('Development Options');
        		break;
        	default:
        		break;
        }
        $(element+"_toggle").innerHTML = tab;
        $(element+"_toggle").removeClassName('advanced_selected');
        if(element=="advanced_tag"){UIUtils.deactivateTagMode();}
   }
}

UIUtils.activateTagMode = function() {
	UIUtils.tagmode = true;
	UIUtils.removeAllGlobalTags();
	UIUtils.closeInfoResource();
	$("global_tagcloud").innerHTML = '';
	$("my_global_tags").childNodes[0].style.display="none";
    UIUtils.resizeResourcesContainer();
}

UIUtils.deactivateTagMode = function() {
	UIUtils.sendPendingTags();
	UIUtils.tagmode = false;
	var selectedResources=CatalogueFactory.getInstance().getSelectedResources();
	for (var i = 0; i < selectedResources.length; i++)
		UIUtils.deselectResource(selectedResources[i]);

	CatalogueFactory.getInstance().clearSelectedResources();
	UIUtils.resizeResourcesContainer();
}

UIUtils.rgbConvert = function(rgbColor){

	var str = '#' + parseInt(rgbColor.red.cssText, 10).toString(16).toLowerCase();
	str += parseInt(rgbColor.green.cssText, 10).toString(16).toLowerCase();
	str += parseInt(rgbColor.blue.cssText, 10).toString(16).toLowerCase();
	
	return str;
}

UIUtils.showResourceTagCloud = function(id_){
	if(UIUtils.selectedResource)
		$(UIUtils.selectedResource).removeClassName('current');
	UIUtils.showResourceInfo(id_);
	UIUtils.openInfoResource();
	var tagCloudHTML = $$('#info_resource .tagcloud .tags')[0];
	tagCloudHTML.parentNode.parentNode.scrollIntoView(true);
	
	var FADE_CLOUD_INI = "#349ee8";
	
	var windowStyle = document.defaultView.getComputedStyle(tagCloudHTML, null);

	var FADE_CLOUD_END = this.rgbConvert(windowStyle.getPropertyCSSValue("background-color").getRGBColorValue());
	
	
//	var FADE_CLOUD_END = this.rgbConvert(tagCloudHTML.getStyle('background-color'));
		
	var fadder = new BackgroundFadder(tagCloudHTML, FADE_CLOUD_INI, FADE_CLOUD_END, 0, 3000);
	fadder.fade();
	
}

UIUtils.clickOnResource = function(id_) {
	if(UIUtils.selectedResource)
		$(UIUtils.selectedResource).removeClassName('current');
		
	if (UIUtils.tagmode) {
		UIUtils.toggleSelectedResource(id_);
	} else {
		UIUtils.showResourceInfo(id_);
		UIUtils.openInfoResource();
	}
}

/**
 * @private
 */
UIUtils._updateMyGlobalTags = function() {
	if (CatalogueFactory.getInstance().getSelectedResources().length == 0) {
		$("my_global_tags").childNodes[0].style.display="none";
	} else {
		$("my_global_tags").childNodes[0].style.display="inline";
	}
}

/**
 * @private
 */
UIUtils._updateTagInfo = function(id) {
	UIUtils._updateMyGlobalTags();
	UIUtils.removeAllGlobalTags();
	CatalogueFactory.getInstance().updateGlobalTags();
}

/**
 * Selects a resource when on tagmode.
 *
 * @param id Id of the resource to select.
 */
UIUtils.selectResource = function(id) {
	$(id).addClassName('selected');
	CatalogueFactory.getInstance().addSelectedResource(id);

	UIUtils._updateTagInfo();
}

/**
 * Deselects a resource when on tagmode.
 *
 * @param id Id of the resource to deselect.
 */
UIUtils.deselectResource = function(id) {
	$(id).removeClassName('selected');
	CatalogueFactory.getInstance().removeSelectedResource(id);

	UIUtils._updateTagInfo();
}

/**
 * Selects or deselects a resource depending on its current select status when
 * on tagmode.
 *
 * @param id Id of the resource to select/deselect.
 */
UIUtils.toggleSelectedResource = function(id) {
	if (CatalogueFactory.getInstance().isSelectedResource(id))
		UIUtils.deselectResource(id);
	else
		UIUtils.selectResource(id);
}

//enlarge an input depending on the size of the text
UIUtils.enlargeInput = function(inputText_) {
	if (inputText_.value.length>5) inputText_.size = inputText_.value.length+1;
}

UIUtils.getError = function(element, error) {
	var jsCall = 'javascript:$(\"' + element.id + '\").style.display=\"none\"';
	element.innerHTML = "";
	element.appendChild(UIUtils.createHTMLElement("img", $H({
		class_name: 'warning',
		src: '/ezweb/images/ico_error_mini.gif'
	})));
	element.appendChild(UIUtils.createHTMLElement("span", $H({
		innerHTML: error
	})));
	var close = UIUtils.createHTMLElement("img", $H({
		class_name: 'close',
		src: _currentTheme.getIconURL('delete')
	}));
	close.observe('mouseover', function(event){
		this.src = _currentTheme.getIconURL('delete_highlighted');
	});
	close.observe('mouseout', function(event){
		this.src = _currentTheme.getIconURL('delete');
	});
	close.observe('click', function(event){
		$(element.id).style.display = "none";
	});
	element.appendChild(close);
	new Effect.Highlight(element,{duration:0.5, startcolor:'#FF0000', endcolor:'#FFFF00', restorecolor:'#FFFF00'});
}

UIUtils.splitString = function(element){
	var ret = [''];
	element = element.replace(/^\s+|\s+$/g, '');
	ret = element.split(/\s+/);
	return ret;
}

UIUtils.filterString = function(element){
	element = element.replace(/^\s+|\s+$/g, '');
	element = element.replace(/\s+/g, ' ');
	return element;	
} 

// Enables you to react to return being pressed in an input
UIUtils.onReturn = function(event_, handler_, inputText_) {
  if (!event_) event_ = window.event;
  if (event_ && event_.keyCode && event_.keyCode == 13) {
  		Event.stop(event_);
	  handler_(inputText_,arguments[3]);
  }
};

UIUtils.rating = function(num)
{
	var star = num.id.replace("_", ''); // Get the selected star

	for(var i=1; i<=5; i++){		
		if(i<=star){
			$("_"+i).className = "on";
		}else{
			$("_"+i).className = "";
		}
	}
}

UIUtils.off_rating = function(num)
{
	var vote = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getUserVote();

	for(var i=1; i<=5; i++){		
		if(i<=vote){
			$("_"+i).className = "on";	
		}else{
			$("_"+i).className = "";
		}
	}
}

UIUtils.sendVotes = function(num) {
	
	var onError = function(transport) {
		alert(gettext ("Error POST"));
				// Process
	}
			
	var loadVotes = function(transport) {
		var responseJSON = transport.responseText;
		var jsonVoteData = JSON.parse(responseJSON);
		resource.setVotes(jsonVoteData);
	}

	var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
	var resourceURI = "/" + resource.getVendor() + "/" + resource.getName() + "/" + resource.getVersion();
	var star = num.id.replace("_", '');
	var param = {vote: star};
	if (resource.getUserVote() == 0) {
		PersistenceEngineFactory.getInstance().send_post(URIs.POST_RESOURCE_VOTES + resourceURI, param, this, loadVotes, onError);
	} else {
		PersistenceEngineFactory.getInstance().send_update(URIs.POST_RESOURCE_VOTES + resourceURI, param, this, loadVotes, onError);
	}
}

UIUtils.createHTMLElement = function(type_, attributes_) {
	var newElement = document.createElement(type_);
	Element.extend(newElement);
	if (attributes_) {
		attributes_.each(function(attribute) {
			var key = attribute.key;
			switch (key){
			case "innerHTML":
				newElement.innerHTML = attribute.value;
				break;
			case "class_name":
				newElement.className = attribute.value;
				break;
			case "style":
				if(BrowserUtilsFactory.getInstance().isIE() && BrowserUtilsFactory.getInstance().getBrowser() != "IE8"){ //for IE6/IE7
					newElement.style.setAttribute('cssText', attribute.value);
				}else{
					newElement.setAttribute(key, attribute.value);
				}
				break;
			case "for_":
				key = "for";
			default:
				newElement.setAttribute(key, attribute.value);
			}
		});
	}
	return newElement;
}

UIUtils.setPreferredGadgetVersion = function(preferredVersion_){

	var onError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error updating the preferred version: %(errorMsg)s."), transport, e);
		LogManagerFactory.getInstance().log(msg);
	}

    var onSuccess = function(transport) {
    	UIUtils.repaintCatalogue=true;
		UIUtils.sendPendingTags();
		UIUtils.closeInfoResource();
		CatalogueFactory.getInstance().repaintCatalogue(URIs.GET_POST_RESOURCES + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
	}
    
	var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);
	var resourceURI = URIs.GET_POST_RESOURCES + "/" + resource.getVendor() + "/" + resource.getName() + "/" + preferredVersion_;
	var data = {preferred: true};
    PersistenceEngineFactory.getInstance().send_update(resourceURI, data, this, onSuccess, onError);
}

UIUtils.resizeResourcesContainer = function (){
	var height = document.getElementById('showcase_container').offsetHeight - document.getElementById('head').offsetHeight - document.getElementById('resources_header').offsetHeight - 18;
	document.getElementById('resources').style.height = height+'px';
	document.getElementById('resources_container').style.height = $('center').offsetHeight + 'px';
	UIUtils.setInfoResourceHeight();

// Upload Wgt files
UIUtils.uploadFile = function () {
	LayoutManagerFactory.getInstance()._startComplexTask(gettext("Uploading packaged gadget"), 1);

	var upload = document.getElementById("upload_form");
	var iframe = document.getElementById("upload");
	if (!iframe.onload)
		iframe.onload = function(){UIUtils.checkFile();};
	upload.submit();
}

// Check upload status wgt file
UIUtils.checkFile = function () {
	var i = document.getElementById("upload");

	if (i.contentDocument) {
		var d = i.contentDocument;
	} else if (i.contentWindow) {
		var d = i.contentWindow.document;
	} else {
		var d = window.frames["upload"].document;
	}

	var layoutManager = LayoutManagerFactory.getInstance();

	if (d.location.href.search("error") >= 0) {
		var logManager = LogManagerFactory.getInstance();
		var msg = gettext("The resource could not be added to the catalogue: %(errorMsg)s");
		msg = interpolate(msg, {errorMsg: d.body.textContent}, true);

		layoutManager._notifyPlatformReady();
		layoutManager.showMessageMenu(msg, Constants.Logging.ERROR_MSG);
		logManager.log(msg);
		return;
	} else {
		layoutManager.logSubTask(gettext('Gadget uploaded successfully'));
		layoutManager.logStep('');
		layoutManager._notifyPlatformReady();
	}

	this.viewAll();
}

}
