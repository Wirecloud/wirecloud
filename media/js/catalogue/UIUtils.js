/* 
 * MORFEO Project 
 * http://morfeo-project.org 
 * 
 * Component: EzWeb
 * 
 * (C) Copyright 2004 Telef�nica Investigaci�n y Desarrollo 
 *     S.A.Unipersonal (Telef�nica I+D) 
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



function UIUtils()
{
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
UIUtils.imageConnectableBottom = '';
UIUtils.imageConnectableContent = '';
UIUtils.infoResourcesWidth = 400;
UIUtils.isInfoResourcesOpen = false;
UIUtils.page = 1;
UIUtils.off = 10;
UIUtils.orderby = '-creation_date';
UIUtils.num_items = 0;
UIUtils.search = 'false';
UIUtils.searchValue = '';
UIUtils.searchCriteria = '';
UIUtils.counter=0;
UIUtils.globalTags='all';

UIUtils.addResource = function(url, paramName, paramValue) {
	UIUtils.repaintCatalogue=true;
	var newResourceOnSuccess = function (response) {
		UIUtils.orderby = '-creation_date';
		UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(), 1, UIUtils.getNum_items());
	}
	
	var newResourceOnError = function (transport, e) {
		var msg;
		if (e) {
			msg = interpolate(gettext("JavaScript exception on file %(errorFile)s (line: %(errorLine)s): %(errorDesc)s"),
			                  {errorFile: e.fileName, errorLine: e.lineNumber, errorDesc: e},
					  true);
		} else if (transport.responseXML) {
                        msg = transport.responseXML.documentElement.textContent;
		} else {
                        msg = "HTTP Error " + transport.status + " - " + transport.statusText;
		}

		msg = interpolate(gettext("The resource could not be added to the catalogue: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	var persistenceEngine = PersistenceEngineFactory.getInstance();

	var params = new Hash();
	params[paramName] = paramValue;

	persistenceEngine.send_post(url, params, this, newResourceOnSuccess, newResourceOnError);
}

UIUtils.getSelectedResource = function() {
	return UIUtils.selectedResource;
}

UIUtils.selectResource = function(resourceId_) {
	var bottom = $(resourceId_ + '_bottom');
	var content = $(resourceId_ + '_content');
	if (!UIUtils.tagmode)
	{
	    UIUtils.imageBottom = bottom.style.backgroundImage;
	    UIUtils.imageContent = content.style.backgroundImage;
	}
	bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom-select.png)';
	content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill-select.png)';
    
}

UIUtils.deselectResource = function(resourceId_) {
	var bottom = $(resourceId_ + '_bottom');
	var content = $(resourceId_ + '_content');
	if (!UIUtils.tagmode)
	{
	    bottom.style.backgroundImage = UIUtils.imageBottom;
	    content.style.backgroundImage = UIUtils.imageContent;
	} else {
	    bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom.gif)';
	    content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill.gif)';
	}
}

UIUtils.selectConnectableResources = function(resourceId_) {
	UIUtils.deselectConnectableResources();
	UIUtils.selectResource(resourceId_);
	UIUtils.lightUpConnectableResources(UIUtils.selectedResource);
}

/* This method selects all the resources related by wiring in the catalogue*/
UIUtils.lightUpConnectableResources = function(resourceId_) {

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
}

UIUtils.deselectConnectableResources = function() {
	var resources = CatalogueFactory.getInstance().getResources().values();
	for (var i=0; i<resources.length; i++){
		var bottom = $('resource_'+i + '_bottom');
		bottom.style.backgroundImage = UIUtils.imageConnectableBottom;
		var content = $('resource_'+i + '_content');
		content.style.backgroundImage = UIUtils.imageConnectableContent;
	}
}
	
UIUtils.showResourceInfo = function(resourceId_) {
	UIUtils.selectedResource = resourceId_;
	CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).showInfo();
}

UIUtils.updateGadgetXHTML = function() {
    var resource = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource);

    var dict = {vendor: resource.getVendor(), name: resource.getName(), version: resource.getVersion()};

    var resourceURI = URIs.GET_GADGET.evaluate(dict) + "/xhtml";

    var onError = function(transport) {
		var	msg = interpolate(gettext("Error updating the XHTML: %(errorMsg)s."), {errorMsg: transport.status}, true);
		LogManagerFactory.getInstance().log(msg);
	// Process
    }
			
    var onSuccess = function(transport) {
	
    }
    
    PersistenceEngineFactory.getInstance().send_update(resourceURI, "", this, onSuccess, onError);

}

UIUtils.toggle_elements = function(elementIds_) {
	for (i=0;i<elementIds_.length ;i++ )
	{
		UIUtils.toggle(elementIds_[i]);
	}
}
	
UIUtils.toggle = function(elementId_) {
	var element = $(elementId_);
	if (element.style.display != 'none')
	{
		element.style.display = 'none';
	}
	else
	{
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

UIUtils.searchByTag = function(url, tag) {
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	var opManager = OpManagerFactory.getInstance();

	tag=UIUtils.filterString(tag);
	if (tag == ""){
  		$('header_always_error').style.display="block";
		UIUtils.getError($('header_always_error'),gettext("Indicate a criteria in search formulary"));
	}
	else{
	  $('header_always_error').style.display = 'none';
	  UIUtils.setPage(1);
      UIUtils.search = 'tag';
      UIUtils.searchValue = tag;
      UIUtils.searchCriteria = 'tag' ;
	  CatalogueFactory.getInstance().repaintCatalogue(url + "/" + tag  + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
	}
}

UIUtils.searchByWiring = function(url, value, wiring) {
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	var opManager = OpManagerFactory.getInstance();

	value=UIUtils.filterString(value);

	if (value == ""){
		$('header_always_error').style.display="block";
		UIUtils.getError($('header_always_error'),gettext("Indicate a criteria in search formulary"));
	}else{
		$('header_always_error').style.display = 'none';
		UIUtils.setPage(1);
		UIUtils.search = 'wiring';
		UIUtils.searchValue = value;
		UIUtils.searchCriteria = wiring ;
		CatalogueFactory.getInstance().repaintCatalogue(url + "/" + wiring + "/" + value  + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());
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

	if (UIUtils.search == 'false'){
		url = URIs.GET_POST_RESOURCES;
	}
	if (UIUtils.search == 'generic'){
		url = URIs.GET_RESOURCES_SEARCH_GENERIC + "/" + UIUtils.searchValue;
	}
	if (UIUtils.search == 'wiring'){
		url = URIs.GET_RESOURCES_BY_WIRING + "/" + UIUtils.searchCriteria + "/" + UIUtils.searchValue;
	}
	if (UIUtils.search == 'tag'){
		url = URIs.GET_RESOURCES_BY_TAG + "/" + UIUtils.searchValue;
	}
	if (pag == "first"){
		pag = 1;
    }
	if (pag == "prev"){
		if(UIUtils.page == 1){
  			pag = 1;
  		}
   		else{
  			pag = UIUtils.page - 1;
  		}
  	}
	if (pag == "next"){
  		if(UIUtils.page == pages){
  			pag = pages;
  		}
    	else{
  	  		pag = parseInt(UIUtils.page) + 1;
  		}
  	}
    if (pag == "last"){
          pag = pages;
    }
	UIUtils.page = pag; 
  
	CatalogueFactory.getInstance().repaintCatalogue(url + "/" + pag + "/" + UIUtils.getOffset());
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

UIUtils.searchGeneric = function(url, param1, param2, param3) {
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	var opManager = OpManagerFactory.getInstance();
	var param1=UIUtils.filterString(param1);
	var param2=UIUtils.filterString(param2);
	var param3=UIUtils.filterString(param3);
	if (param1=="") param1="_";
	if (param2=="") param2="_";
	if (param3=="") param3="_";

	if (param1 == "_" && param2 == "_" && param3 == "_"){
		$('header_always_error').style.display="block";
		UIUtils.getError($('header_always_error'),gettext("Indicate a criteria in search formulary"));
	}
	else{
		$('header_always_error').style.display = 'none';

		UIUtils.setPage(1);
		UIUtils.searchValue = param1+"/"+param2+"/"+param3;
		UIUtils.searchCriteria = 'generic';
		UIUtils.search = 'generic';

		CatalogueFactory.getInstance().repaintCatalogue(url + "/" + param1 + "/" + param2 + "/" + param3 + "/" + UIUtils.getPage() + "/" + UIUtils.getOffset());

	}
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
	$("new_global_tag_text_input").focus();
	
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
	UIUtils.repaintCatalogue=true;
	UIUtils.sendPendingTags();
	UIUtils.closeInfoResource();
	
	var onError = function(transport) {
				LayoutManagerFactory.getInstance().hideCover();
				var msg = interpolate(gettext("Error deleting the Gadget: %(errorMsg)s."), {errorMsg: transport.status}, true);
				LogManagerFactory.getInstance().log(msg);
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
		src: '/ezweb/images/cancel_gray.png'
	}));
	image.observe('mouseover', function(event){
		this.src = '/ezweb/images/delete.png';
	});
	image.observe('mouseout', function(event){
		this.src = '/ezweb/images/cancel_gray.png';
	});
	image_link.appendChild(image);
	$("my_global_tags").insertBefore(newTag, $("new_global_tag_text"));
}

UIUtils.setResourcesWidth = function() {
	var tab = $('tab_info_resource');
	var head = $('head');
	var resources = $('resources');
	var center = $('center');
	center.style.width = head.offsetWidth + 'px';
	resources.style.width = (center.offsetWidth - (tab.offsetWidth + (UIUtils.isInfoResourcesOpen?UIUtils.infoResourcesWidth:0))) + 'px';
}

UIUtils.openInfoResource = function() {
	if (!UIUtils.isInfoResourcesOpen)
	{
		UIUtils.isInfoResourcesOpen = true;
		UIUtils.SlideInfoResourceIntoView('info_resource');
	}
}

UIUtils.closeInfoResource = function() {
	if (UIUtils.isInfoResourcesOpen)
	{
		UIUtils.deselectConnectableResources();
		UIUtils.isInfoResourcesOpen = false;
		UIUtils.SlideInfoResourceOutOfView('info_resource');
	}
}

UIUtils.SlideInfoResourceIntoView = function(element) {
  $(element).style.width = '0px';
  $(element).style.overflow = 'hidden';
  $(element).firstChild.style.position = 'relative';
  UIUtils.setResourcesWidth();
  Element.show(element);
  new Effect.Scale(element, 100,
    Object.extend(arguments[1] || {}, {
      scaleContent: false,
      scaleY: false,
      scaleMode: 'contents',
      scaleFrom: 0,
      afterUpdate: function(effect){},
	  afterFinish: function(effect)
        {UIUtils.show('tab_info_resource_close'); }
    })
  );
	if (UIUtils.selectedResource != null) {
		 UIUtils.lightUpConnectableResources(UIUtils.selectedResource);
	}
}

UIUtils.SlideInfoResourceOutOfView = function(element) {
  UIUtils.selectedResource= null;
  $(element).style.overflow = 'hidden';
  $(element).firstChild.style.position = 'relative';
  Element.show(element);
  new Effect.Scale(element, 0,
    Object.extend(arguments[1] || {}, {
      scaleContent: false,
      scaleY: false,
      afterUpdate: function(effect){},
      afterFinish: function(effect)
        { Element.hide(effect.element); UIUtils.setResourcesWidth(); UIUtils.hidde('tab_info_resource_close'); }
    })
  );
}

UIUtils.restoreSlide = function() {
	var div = $("head");
    var nodeList = div.childNodes;
    var aux = '';
    var tab = '';
    for(i=0;i<nodeList.length;i++){
    	if(nodeList.item(i).nodeName=="DIV" && nodeList.item(i).id!='header_always'){
	        if(Element.visible(nodeList.item(i))==true){
	        	nodeList.item(i).style.display = "none";
	           	//Effect.BlindUp(nodeList.item(i),{queue:{position:'end',scope:'menuScope',limit:2},});
	            aux = nodeList.item(i).id.split("_");
	            switch (aux[1].toLowerCase()) {
	            	case "tag":
	            		tab = gettext("Advanced Tagging");
	            		break;
	            	case "search":
	            		tab = gettext("Advanced Search");
	            		break;
	            	default:
	            		break;
	            }
	            $(nodeList.item(i).id+"_toggle").innerHTML = tab;
	            $(nodeList.item(i).id+"_toggle").style.background="lightBlue";
	            if(nodeList.item(i).id=="advanced_tag"){UIUtils.deactivateTagMode();}
	        }
	    }
    }
}

UIUtils.SlideAdvanced = function(element,container) {
    var div = $(container);
    var nodeList = div.childNodes;
    var queue = Effect.Queues.get('menuScope');
    var aux = '';
    var tab = '';
    UIUtils.sendPendingTags();
    if(queue.toArray().length<1){
        if(Element.visible(element)==false){
            for(i=0;i<nodeList.length;i++){
                if(nodeList.item(i).nodeName=="DIV" && nodeList.item(i).id!=element && nodeList.item(i).id!='header_always'){
                    if(Element.visible(nodeList.item(i))==true){
                        Effect.BlindUp(nodeList.item(i),{queue:{position:'end',scope:'menuScope',limit:2}});
                        aux = nodeList.item(i).id.split("_");
                        switch (aux[1].toLowerCase()) {
			            	case "tag":
			            		tab = gettext("Advanced Tagging");
			            		break;
			            	case "search":
			            		tab = gettext("Advanced Search");
			            		break;
			            	default:
			            		break;
			            }
                        $(nodeList.item(i).id+"_toggle").innerHTML = tab;
                        $(nodeList.item(i).id+"_toggle").style.background="transparent";
                        if(nodeList.item(i).id=="advanced_tag"){UIUtils.deactivateTagMode();}
                    }
                }
            }
            Effect.BlindDown(element,{queue:{position:'end',scope:'menuScope',limit:2}});
            aux = element.split("_");
            switch (aux[1].toLowerCase()) {
            	case "tag":
            		tab = gettext("Hide Tagging");
            		break;
            	case "search":
            		tab = gettext("Simple Search");
            		break;
            	default:
            		break;
            }
            $(element+"_toggle").innerHTML = tab;
			$(element+"_toggle").style.background="lightBlue";
			if(element=="advanced_tag"){UIUtils.activateTagMode();}
       }
       else {
       		Effect.BlindUp(element,{queue:{position:'end',scope:'menuScope',limit:2}});
            aux = element.split("_");
            switch (aux[1].toLowerCase()) {
            	case "tag":
            		tab = gettext('Advanced Tagging');
            		break;
            	case "search":
            		tab = gettext('Advanced Search');
            		break;
            	default:
            		break;
            }
            $(element+"_toggle").innerHTML = tab;
            $(element+"_toggle").style.background="transparent"; 
            if(element=="advanced_tag"){UIUtils.deactivateTagMode();}      
       }
   }
}

UIUtils.SlideAdvanced2 = function(element) {
	switch (element) {
		case "advanced_tag":
			element1=$(element).cleanWhitespace();
			element2=$("advanced_search").cleanWhitespace();
			event="Tag";
			break;
		case "advanced_search":
			element1=$(element).cleanWhitespace();
			element2=$("advanced_tag").cleanWhitespace();
			event="Search";
			break;
		default:
			break;
	}
	if (element1.style.display == 'none') {
		new Effect.BlindDown(element1,
			{
				duration:1,
				beforeStart: function() {
					if(element2.style.display != 'none')
					{
						new Effect.BlindUp(element2,
						{
							duration:1,
							beforeStart: function() {
								element1.style.zIndex=2;
								element2.style.zIndex=1;
							},
							afterFinish: function() {
								element2.style.display = 'none';
								$(element2.id+"_toggle").innerHTML = gettext("Advanced "+event);
								$(element2.id+"_toggle").style.background="lightBlue";
							}
						});
					}
					element1.style.zIndex=2;
					element2.style.zIndex=1;
					element1.style.display='true';
				},
				afterFinish: function() {
					$(element1.id+"_toggle").innerHTML = gettext("Simple "+event);
					$(element1.id+"_toggle").style.background="darkBlue";
				}
			});
	} else {
		new Effect.BlindUp(element1,
			{
				duration:1,
				afterFinish: function() {
					element1.style.display='none';
					$(element1.id+"_toggle").innerHTML = gettext("Advanced "+event);
					$(element1.id+"_toggle").style.background="lightBlue";
				}
			});
	}
}

UIUtils.SlideAdvancedSearchIntoView = function(element) {
  element = $(element).cleanWhitespace();
  // SlideDown need to have the content of the element wrapped in a container element with fixed height!
  var oldInnerBottom = element.down().getStyle('bottom');
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, 100, Object.extend({ 
    scaleContent: false, 
    scaleX: false, 
    scaleFrom: window.opera ? 0 : 1,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if(window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().setStyle({height: '0px'}).show(); 
    },
    afterUpdateInternal: function(effect) {
      	effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' }); 
    },
    afterFinishInternal: function(effect) {
      	effect.element.undoClipping().undoPositioned();
      	effect.element.down().undoPositioned().setStyle({bottom: oldInnerBottom}); 
	},
	afterFinish: function(effect) {
		UIUtils.hidde('simple_search');
	  	UIUtils.show('advanced_search_bottom');
	  	$('advanced_search_text_tag').focus();
	}
    }, arguments[1] || {})
  );
}

UIUtils.SlideAdvancedSearchOutOfView = function(element) {
  element = $(element).cleanWhitespace();
  var oldInnerBottom = element.down().getStyle('bottom');
  return new Effect.Scale(element, window.opera ? 0 : 1,
   Object.extend({ scaleContent: false, 
    scaleX: false, 
    scaleMode: 'box',
    scaleFrom: 100,
    restoreAfterFinish: true,
    beforeStartInternal: function(effect) {
      effect.element.makePositioned();
      effect.element.down().makePositioned();
      if(window.opera) effect.element.setStyle({top: ''});
      effect.element.makeClipping().show();
    },  
    afterUpdateInternal: function(effect) {
      effect.element.down().setStyle({bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px' });
    },
    afterFinishInternal: function(effect) {
      effect.element.hide().undoClipping().undoPositioned().setStyle({bottom: oldInnerBottom});
      effect.element.down().undoPositioned();
    },
	afterFinish: function(effect) {
	  	UIUtils.hidde('advanced_search_bottom');
	  	UIUtils.show('simple_search');
	  	$('simple_search_text').focus();
	}
   }, arguments[1] || {})
  );
}

UIUtils.activateTagMode = function() {
	UIUtils.tagmode = true;
	UIUtils.removeAllGlobalTags();
	UIUtils.closeInfoResource();
	$("global_tagcloud").innerHTML = '';
	$("my_global_tags").childNodes[0].style.display="none";
}

UIUtils.deactivateTagMode = function() {
	UIUtils.sendPendingTags();
	UIUtils.tagmode = false;
	selectedResources=CatalogueFactory.getInstance().getSelectedResources();
	for(var i=0; i<selectedResources.length;i++){
		UIUtils.deselectResource(selectedResources[i]);
	}
	CatalogueFactory.getInstance().clearSelectedResources();
}

UIUtils.clickOnResource = function(id_) {
	if(UIUtils.tagmode){
		UIUtils.toggleSelectedResource(id_);
	}else{
		UIUtils.showResourceInfo(id_);
		UIUtils.openInfoResource();
		UIUtils.selectConnectableResources(id_);
	}
}

UIUtils.toggleSelectedResource = function(id_) {
	UIUtils.removeAllGlobalTags();
	if(CatalogueFactory.getInstance().isSelectedResource(id_)){
		var bottom = $(id_ + '_bottom');
	    var content = $(id_ + '_content');
	    bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom.gif)';
	    content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill.gif)';
		CatalogueFactory.getInstance().removeSelectedResource(id_);
	} else{
		var bottom = $(id_ + '_bottom');
	    var content = $(id_ + '_content');
	    bottom.style.backgroundImage = 'url(/ezweb/images/resource-left-bottom-tagmode.png)';
	    content.style.backgroundImage = 'url(/ezweb/images/resource-left-fill-tagmode.png)';
		CatalogueFactory.getInstance().addSelectedResource(id_);
	}
	CatalogueFactory.getInstance().updateGlobalTags();
	
	if (CatalogueFactory.getInstance().getSelectedResources().length == 0){
		$("my_global_tags").childNodes[0].style.display="none";
	}else{
		$("my_global_tags").childNodes[0].style.display="inline";
	}
}

UIUtils.mouseOverResource = function(id_) {
	if(!((UIUtils.tagmode)&&(CatalogueFactory.getInstance().isSelectedResource(id_)))){
			UIUtils.selectResource(id_);
	}
	UIUtils.show(id_ + "_toolbar");
}

UIUtils.mouseOutResource = function(id_) {
	if(!((UIUtils.tagmode)&&(CatalogueFactory.getInstance().isSelectedResource(id_)))){
			UIUtils.deselectResource(id_);
	}
	UIUtils.hidde(id_ + "_toolbar");
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
		src: '/ezweb/images/cancel_gray.png'
	}));
	close.observe('mouseover', function(event){
		this.src='/ezweb/images/delete.png';
	});
	close.observe('mouseout', function(event){
		this.src='/ezweb/images/cancel_gray.png';
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
	  handler_(inputText_,arguments[3],arguments[4], arguments[5]);
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
		var jsonVoteData = eval ('(' + responseJSON + ')');
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

UIUtils.createHTMLElement = function(type_, attributes_){
	var newElement = document.createElement(type_);
	if (attributes_) {
		attributes_.each(function(attribute) {
			if (attribute.key != "innerHTML") {
				var key = attribute.key;
				if (key == "class_name") key = "class"; 
				else if (key == "for_") key = "for";
					
				newElement.setAttribute(key, attribute.value);
			}
			else 
				newElement.innerHTML = attribute.value;
		});
	}
	return newElement;
}

UIUtils.setPreferredGadgetVersion = function(preferredVersion_){

    var onError = function(transport) {
		var	msg = interpolate(gettext("Error updating the preferred version: %(errorMsg)s."), {errorMsg: transport.status}, true);
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