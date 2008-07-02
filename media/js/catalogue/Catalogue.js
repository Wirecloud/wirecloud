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
		
		var resources = $H();
		var selectedResources = [];
		var globalTags = [];
		var _this = this;
		var max_gadgets_per_page = 40;
		var min_offset = 10;
		
		this.catalogueElement = $('showcase_container');
		
		
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
			this.emptyResourceList();
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
		
		this.getVersionManager = function(id_) {
			return verManager;
		}

		this.addSelectedResource = function(id_) {
			if(!_this.isSelectedResource(id_)) {
				selectedResources.push(id_);
			}
		}

		this.isSelectedResource = function(id_) {
			for (var i=0; i<selectedResources.length; i++){
				if (selectedResources[i] == id_) {
					return true;
				}
			}
			return false;
		}

		this.removeSelectedResource = function(id_) {
			for (var i=0; i<selectedResources.length; i++){
				if (selectedResources[i] == id_) {
					selectedResources = selectedResources.without(selectedResources[i]);
				}
			}
		}

		this.clearSelectedResources = function() {
			selectedResources = [];
		}
	
		this.toggleSelectedResource = function(id_) {
			if(isSelectedResources(id_)) {
				removeSelectedResource(id_)
			}else{
				addSelectedResource(id_);
			}
		}

		this.getSelectedResources = function() {
			return selectedResources;
		}

		this.addResource = function(resourceJSON_, urlTemplate_) { 
			var resourceKey = "resource_" + resources.keys().length;
			resources[resourceKey] = new Resource(resourceKey, resourceJSON_, urlTemplate_);
		}

		this.addResourceToShowCase = function(resourceId_) {
			UIUtils.showResourceInfo(resourceId_);
			var currentResource = this.getResource(resourceId_);
			ShowcaseFactory.getInstance().addGadget(currentResource.getVendor(), currentResource.getName(),  currentResource.getVersion(), currentResource.getUriTemplate());
		}

		this.paginate = function(items) {
			_paginate_show($("paginate_show"), items);
			_paginate($("paginate"), items);
		}

		this.orderby = function(items){
			_orderby($("orderby"), items);
		}

		this.changeGlobalTagcloud = function(type){	
			$('view_global_tags_links').innerHTML = "";
			
			var all = UIUtils.createHTMLElement((type=="all")?"span":"a", $H({ innerHTML: gettext ('All common tags') }));
			if (type != "all") {
				all.observe("click", function(event){
					_this.changeGlobalTagcloud('all');
				});
			}
			var mytags = UIUtils.createHTMLElement((type=="mytags")?"span":"a", $H({ innerHTML: gettext ('My common tags') }));
			if (type != "mytags") {
				mytags.observe("click", function(event){
					_this.changeGlobalTagcloud('mytags');
				});
			}
			var others = UIUtils.createHTMLElement((type=="others")?"span":"a", $H({ innerHTML: gettext ('Others common tags') }));
			if (type != "others") {
				others.observe("click", function(event){
					_this.changeGlobalTagcloud('others');
				});
			}
			$('view_global_tags_links').appendChild(all);
			$('view_global_tags_links').appendChild(mytags);
			$('view_global_tags_links').appendChild(others);
			UIUtils.globalTags = type;
			this.updateGlobalTags();
		}
		
        this.updateGlobalTags = function(){
            if (UIUtils.tagmode) {
                if (selectedResources.length == 0) {
                    globalTags = [];
					_globalTagsToTagcloud($("global_tagcloud"));
					return;
				}
				if(selectedResources.length==1){
					if (UIUtils.globalTags == "all") {
						globalTags = globalTags=CatalogueFactory.getInstance().getResource(selectedResources[0]).getTags();
					} 
					else if (UIUtils.globalTags == "mytags") {
						var auxGlobalTags = [];
						var counter=0;
						globalTags = globalTags=CatalogueFactory.getInstance().getResource(selectedResources[0]).getTags();
						for(var k=0;k<globalTags.length; k++){
							if(globalTags[k].getAdded_by()=='Yes'){
								auxGlobalTags[counter]=globalTags[k];
								counter++;
							}
						}
						globalTags=auxGlobalTags;
					} else {
						var auxGlobalTags = [];
						var counter=0;
						globalTags = CatalogueFactory.getInstance().getResource(selectedResources[0]).getTags();
						for(var k=0;k<globalTags.length; k++){
							if(globalTags[k].getAdded_by()=='No'){
								auxGlobalTags[counter]=globalTags[k];
								counter++;
							}
						}
						globalTags=auxGlobalTags;
					}
                    _globalTagsToTagcloud($("global_tagcloud"));
                    return;
                }
                if (UIUtils.globalTags == "all") {
                    globalTags = _this.getResource(selectedResources[0]).getTags();
                    var auxTags = [];
                    var bool = [];
                    for (var i = 1; i < selectedResources.length; i++) {
                        auxTags = _this.getResource(selectedResources[i]).getTags();
                        for (var k = 0; k < globalTags.length; k++) {
                            bool[k] = false;
                            for (var j = 0; j < auxTags.length; j++) {
                                if (auxTags[j].getValue() == globalTags[k].getValue()) {
                                    bool[k] = true;
                                    break;
                                }
                            }
                        }
                        var auxGlobalTags = [];
                        var counter = 0;
                        for (var k = 0; k < globalTags.length; k++) {
                            if (bool[k]) {
                                auxGlobalTags[counter] = globalTags[k];
                                counter++;
                            }
                        }
                        globalTags = auxGlobalTags;
                    }
                }
                else 
                    if (UIUtils.globalTags == "mytags") {
                        globalTags = _this.getResource(selectedResources[0]).getTags();
                        var auxTags = [];
                        var bool = [];
                        for (var i = 1; i < selectedResources.length; i++) {
                            auxTags = _this.getResource(selectedResources[i]).getTags();
                            for (var k = 0; k < globalTags.length; k++) {
                                bool[k] = false;
                                for (var j = 0; j < auxTags.length; j++) {
                                    if (auxTags[j].getValue() == globalTags[k].getValue()) {
                                        bool[k] = true;
                                        break;
                                    }
                                }
                            }
                            var auxGlobalTags = [];
                            var counter = 0;
                            for (var k = 0; k < globalTags.length; k++) {
                                if (bool[k] && globalTags[k].getAdded_by() == 'Yes') {
                                    auxGlobalTags[counter] = globalTags[k];
                                    counter++;
                                }
                            }
                            globalTags = auxGlobalTags;
                        }
                    }
                    else {
                        globalTags = _this.getResource(selectedResources[0]).getTags();
                        var auxTags = [];
                        var bool = [];
                        for (var i = 1; i < selectedResources.length; i++) {
                            auxTags = _this.getResource(selectedResources[i]).getTags();
                            for (var k = 0; k < globalTags.length; k++) {
                                bool[k] = false;
                                for (var j = 0; j < auxTags.length; j++) {
                                    if (auxTags[j].getValue() == globalTags[k].getValue()) {
                                        bool[k] = true;
                                        break;
                                    }
                                }
                            }
                            var auxGlobalTags = [];
                            var counter = 0;
                            for (var k = 0; k < globalTags.length; k++) {
                                if (bool[k] && globalTags[k].getAdded_by() == 'No') {
                                    auxGlobalTags[counter] = globalTags[k];
                                    counter++;
                                }
                            }
                            globalTags = auxGlobalTags;
                        }
                    }
                _globalTagsToTagcloud($("global_tagcloud"));
            }
        }

		this.getGlobalTags = function() {
			return globalTags;
		}

		this.repaintCatalogue = function (url) {
	 	    this.emptyResourceList();
		    this.loadCatalogue(url);
		}

		this.show = function(){
			LayoutManagerFactory.getInstance().showCatalogue();
		}

		this.hide = function(){
			LayoutManagerFactory.getInstance().hideView(this.catalogueElement);
		}

		this.loadCatalogue = function(urlCatalogue_) {

			// ******************
			//  CALLBACK METHODS 
			// ******************

			//Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.

			var onError = function(transport, e) {
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

				msg = interpolate(gettext("Error retrieving catalogue data: %(errorMsg)s."), {errorMsg: msg}, true);
				LogManagerFactory.getInstance().log(msg);

			}

			var loadResources = function(transport) {
				var response = Try.these(
									function() { 	return new DOMParser().parseFromString(transport.responseText, 'text/xml'); },
									function() { 	var xmldom = new ActiveXObject('Microsoft.XMLDOM'); 
													xmldom.loadXML(transport.responseText); 
													return xmldom; }
								);

				var responseJSON = transport.responseText;
				var items = transport.getResponseHeader('items');
			    var jsonResourceList = eval ('(' + responseJSON + ')');
			    jsonResourceList = jsonResourceList.resourceList;

				for (var i = 0; i<jsonResourceList.length; i++)
				{
					this.addResource(jsonResourceList[i], null);
				}
				this.paginate(items);
				this.orderby(items);
				$('global_tagcloud').innerHTML = '';
				UIUtils.repaintCatalogue=false;

			}

			var param = {orderby: UIUtils.orderby, search_criteria: UIUtils.searchValue};

			var persistenceEngine = PersistenceEngineFactory.getInstance();

			$('header_always_status').innerHTML = "";
			$('header_always_status').appendChild(UIUtils.createHTMLElement("span", $H({
				innerHTML: urlCatalogue_
			})));

			var text = "";
			switch(UIUtils.searchCriteria){
				case "and":
					text = gettext('Search') + ': ';
					break;
				case "or":
				case "simple_or":
					text = gettext('Search') + ': ';
					break;
				case "not":
					text = gettext('Search') + ': ';
					break;
				case "tag":
					text = gettext('Search by Tag') + ': ';
					break;
				case "event":
					text = gettext('Search by Event') + ': ';
					break;
				case "slot":
					text = gettext('Search by Slot') + ': ';
					break;
				case "connectSlot":
					text = gettext('Search by Slot connectivity') + ': ';
					break;
				case "connectEvent":
					text = gettext('Search by Event connectivity') + ': ';
					break;
				case "global":
					text = gettext('Global Search') + ': ';
					break;
			}
			if (text != "") {
				$('header_always_status').innerHTML = "";
				$('header_always_status').appendChild(UIUtils.createHTMLElement("span", $H({
					innerHTML: text
				})));
			}
			var searching='';
			switch(UIUtils.searchCriteria){
				case "global":
					var auxiliar_and=[""];
					var auxiliar_and_bool = true;
					var auxiliar_or=[""];
					var auxiliar_or_bool = true;
					var auxiliar_not=[""];
					var auxiliar_not_bool = true;
					var auxiliar_tag=[""];
					var auxiliar_tag_bool = true;
					var auxiliar_event=[""];
					var auxiliar_event_bool = true;
					var auxiliar_slot=[""];
					var auxiliar_slot_bool = true;
					if (UIUtils.searchValue[0]=="") auxiliar_and_bool = false;
					if (UIUtils.searchValue[1]=="") auxiliar_or_bool = false;
					if (UIUtils.searchValue[2]=="") auxiliar_not_bool = false;
					if (UIUtils.searchValue[3]=="") auxiliar_tag_bool = false;
					if (UIUtils.searchValue[4]=="") auxiliar_event_bool = false;
					if (UIUtils.searchValue[5]=="") auxiliar_slot_bool = false;

					if (auxiliar_and_bool) {
						auxiliar_and=UIUtils.splitString(UIUtils.searchValue[0]);
						for (var j=0;j<auxiliar_and.length;j++){
							if(j==auxiliar_and.length-1){
								searching += auxiliar_and[j] + ((auxiliar_or_bool||auxiliar_not_bool||auxiliar_tag_bool||auxiliar_event_bool||auxiliar_slot_bool)?" AND ":".");
							}else if(j==auxiliar_and.length-2){
								searching += auxiliar_and[j] + ' ' + gettext('and') + ' ';
							}else{
								searching += auxiliar_and[j] + ' ' + gettext('and') + ' ';
							}
						}
					}
					if (auxiliar_or_bool) {
						auxiliar_or=UIUtils.splitString(UIUtils.searchValue[1]);
						for (var j=0;j<auxiliar_or.length;j++){
							if(j==auxiliar_or.length-1){
								searching += auxiliar_or[j] + ((auxiliar_not_bool||auxiliar_tag_bool||auxiliar_event_bool||auxiliar_slot_bool)?" AND ":".");
							}else if(j==auxiliar_or.length-2){
								searching += auxiliar_or[j] + ' ' + gettext('or') + ' ';
							}else{
								searching += auxiliar_or[j] + ' ' + gettext('or') + ' ';
							}
						}
					}
					if (auxiliar_not_bool) {
						auxiliar_not=UIUtils.splitString(UIUtils.searchValue[2]);
						for (var j=0;j<auxiliar_not.length;j++){
							if(j==0){
								if(auxiliar_not.length==1){
									searching += gettext('not') + ' ' + auxiliar_not[j] + ((auxiliar_tag_bool||auxiliar_event_bool||auxiliar_slot_bool)?" AND ":".");
								}else{
									searching += gettext('neither') + ' ' + auxiliar_not[j] + ' ' + gettext('nor') + ' ';
								}
							}else if(j==auxiliar_not.length-1){
								searching += auxiliar_not[j] + ((auxiliar_tag_bool||auxiliar_event_bool||auxiliar_slot_bool)?" AND ":".");
							}else{
								searching += auxiliar_not[j] + ' ' + gettext('nor') + ' ';
							}
						}
					}
					if (auxiliar_tag_bool) {
						auxiliar_tag=UIUtils.splitString(UIUtils.searchValue[3]);
						searching += gettext('Tags: ');
						for (var j=0;j<auxiliar_tag.length;j++){
							if(j==auxiliar_tag.length-1){
								searching += auxiliar_tag[j] + ((auxiliar_event_bool||auxiliar_slot_bool)?" AND ":".");
							}else if(j==auxiliar_tag.length-2){
								searching += auxiliar_tag[j] + ' ' + gettext('or') + ' ';
							}else{
								searching += auxiliar_tag[j] + ', ';
							}
						}
					}
					if (auxiliar_event_bool) {
						auxiliar_event=UIUtils.splitString(UIUtils.searchValue[4]);
						searching += gettext('Events: ');
						for (var j=0;j<auxiliar_event.length;j++){
							if(j==auxiliar_event.length-1){
								searching += auxiliar_event[j] + ((auxiliar_slot_bool)?" AND ":".");;
							}else if(j==auxiliar_or.length-2){
								searching += auxiliar_event[j] + ' ' + gettext('or') + ' ';
							}else{
								searching += auxiliar_event[j] + ', ';
							}
						}
					}
					if (auxiliar_slot_bool) {
						auxiliar_slot=UIUtils.splitString(UIUtils.searchValue[5]);
						searching += gettext('Slots: ');
						for (var j=0;j<auxiliar_slot.length;j++){
							if(j==auxiliar_slot.length-1){
								searching += auxiliar_slot[j] + ".";
							}else if(j==auxiliar_slot.length-2){
								searching += auxiliar_slot[j] + ' ' + gettext('or') + ' ';
							}else{
								searching += auxiliar_slot[j] + ', ';
							}
						}
					}
					break;
				case "and":
					var auxiliar_and=[""];
					auxiliar_and=UIUtils.splitString(UIUtils.searchValue[0]);
					for (var j=0;j<auxiliar_and.length;j++){
						if(j==auxiliar_and.length-1){
							searching += auxiliar_and[j] + ".";
						}else if(j==auxiliar_and.length-2){
							searching += auxiliar_and[j] + ' ' + gettext('and') + ' ';
						}else{
							searching += auxiliar_and[j] + ' ' + gettext('and') + ' ';
						}
					}
					break;
				case "or":
				case "simple_or":
					var auxiliar_or=[""];
					auxiliar_or=UIUtils.splitString(UIUtils.searchValue[0]);
					for (var j=0;j<auxiliar_or.length;j++){
						if(j==auxiliar_or.length-1){
							searching += auxiliar_or[j] + ".";
						}else if(j==auxiliar_or.length-2){
							searching += auxiliar_or[j] + ' ' + gettext('or') + ' ';
						}else{
							searching += auxiliar_or[j] + ' ' + gettext('or') + ' ';
						}
					}
					break;
				case "not":
					var auxiliar_not=[""];
					auxiliar_not=UIUtils.splitString(UIUtils.searchValue[0]);
					for (var j=0;j<auxiliar_not.length;j++){
						if(j==0){
							if(auxiliar_not.length==1){
								searching += gettext('not') + ' ' + auxiliar_not[j] + ".";
							}else{
								searching += gettext('neither') + ' ' + auxiliar_not[j] + ' ' + gettext('nor') + ' ';
							}
						}else if(j==auxiliar_not.length-1){
							searching += auxiliar_not[j] + ".";
						}else{
							searching += auxiliar_not[j] + ' ' + gettext('nor') + ' ';
						}
					}
					break;
				case "tag":
				case "event":
				case "slot":
				case "connectEvent":
				case "connectSlot":
					var auxiliar_or=UIUtils.splitString(UIUtils.searchValue[0]);
					for (var j=0;j<auxiliar_or.length;j++){
						if(j==auxiliar_or.length-1){
							searching += auxiliar_or[j];
						}else if(j==auxiliar_or.length-2){
							searching += auxiliar_or[j] + ' ' + gettext('or') + ' ';
						}else{
							searching += auxiliar_or[j] + ', ';
						}
					}
					break;
			}
			var auxiliar = urlCatalogue_.toString().split("/");
			for (var i=0;i<auxiliar.length;i++){
				if (auxiliar[i] == 'resource') {
					$('header_always_status').innerHTML = "";
					$('header_always_status').appendChild(UIUtils.createHTMLElement("span", $H({
						innerHTML: gettext('Complete Catalogue')
					})));
					break;
				} else if (auxiliar[i] == 'search' || auxiliar[i]=='globalsearch') {
					$('header_always_status').appendChild(UIUtils.createHTMLElement("span", $H({
						innerHTML: searching
					})));
					var reload_link = UIUtils.createHTMLElement("a", $H({
						innerHTML: gettext("Reload")
					}));
					reload_link.observe("click", function(event){
						CatalogueFactory.getInstance().emptyResourceList();
						CatalogueFactory.getInstance().loadCatalogue(urlCatalogue_);
					});
					$('header_always_status').appendChild(reload_link);
					break;
				}
			}


			var reload_catalogue_link = UIUtils.createHTMLElement("a", $H({
				id: 'reload_catalogue_link',
				innerHTML: gettext("Reload Catalogue")
			}));
			reload_catalogue_link.observe("click", function(event){
				CatalogueFactory.getInstance().reloadCompleteCatalogue();
				$('header_always_error').style.display = 'none';
			});
			$('header_always_status').appendChild(reload_catalogue_link);
			
			// Get Resources from PersistenceEngine. Asyncrhonous call!
			persistenceEngine.send_get(urlCatalogue_, this, loadResources, onError, param);
		}

	var _paginate_show = function(parent, items){
		parent.innerHTML = "";
		parent.appendChild(UIUtils.createHTMLElement("label", $H({
			for_: 'combo_results_per_page',
			innerHTML: gettext("Gadgets per page: ")
		})));
		var select = UIUtils.createHTMLElement("select", $H({
			id: 'combo_results_per_page',
			size: '1'
		}));
		select.observe("change", function(event){
			UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, $('combo_results_per_page').options[$('combo_results_per_page').selectedIndex].value.toString(), 'first', items);
		});
		parent.appendChild(select);
		if(items<=0) {
			select.setAttribute("disabled", "disabled");
		}
		else {
			var max;
			if(items>max_gadgets_per_page) {
				max = max_gadgets_per_page/min_offset;
			} else {
				max = Math.ceil(items/min_offset);
			}
			var some_selected = false;
			for (var i=1; i<=max; i++){
				var option = UIUtils.createHTMLElement("option", $H({
					value: "" + (i*min_offset),
					innerHTML: "" + (i*min_offset)
				}));
				if(UIUtils.getOffset() == i*min_offset){
					option.setAttribute("selected", "selected");
					some_selected=true;
				}
				if((i==max)&&(!some_selected)){
					option.setAttribute("selected", "selected");
					UIUtils.offset=max;
				}
				select.appendChild(option);
			}
		}
	}
	
	var _paginate = function(parent, items){
		parent.innerHTML = '';
		var end_page = Math.ceil(items/UIUtils.getOffset());
        if (end_page==0){end_page=1;}
		
		var first_span = UIUtils.createHTMLElement("span", $H({
		   	class_name: 'pagination_button'
		}));
		parent.appendChild(first_span);
		var previous_span = UIUtils.createHTMLElement("span", $H({
		   	class_name: 'pagination_button'
		}));
		parent.appendChild(previous_span);
		
        if(UIUtils.getPage()!=1)
        {
			var first_link = UIUtils.createHTMLElement("a", $H({
				title: gettext('Go to first page')
			}));
			first_link.observe("click", function(event){
				UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(),"first", items);
			});
			first_span.appendChild(first_link);
			var first_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-first.png'
			}));
			first_link.appendChild(first_img);
			var previous_link = UIUtils.createHTMLElement("a", $H({
				title: gettext('Go to previous page')
			}));
			previous_link.observe("click", function(event){
				UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(), "prev", items);
			});
			previous_span.appendChild(previous_link);
			var previous_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-previous.png'
			}));
			previous_link.appendChild(previous_img);
        } 
		else {
			var first_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-first-dim.png'
			}));
			first_span.appendChild(first_img);
			var previous_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-previous-dim.png'
			}));
			previous_span.appendChild(previous_img);
        }

		for (var i=1; i<=end_page; i++)
		{
            if(UIUtils.getPage()!=i)
            {
				var page_span = UIUtils.createHTMLElement("span", $H({
					class_name: 'pagination_button'
				}));
				parent.appendChild(page_span);
				var page_link = UIUtils.createHTMLElement('a', $H({
					title: gettext('Go to page ') + i,
					innerHTML: '' + i
				}));
				page_link.observe("click", function(event){
					UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(), this.innerHTML , items);
				});
				page_span.appendChild(page_link);
		    } 
			else {
				parent.appendChild(UIUtils.createHTMLElement("span", $H({
		   			class_name: 'pagination_button',
					innerHTML: '' + i
				})));
		    }
		}

		var next_span = UIUtils.createHTMLElement("span", $H({
			class_name: 'pagination_button'
		}));
		parent.appendChild(next_span);
		var last_span = UIUtils.createHTMLElement("span", $H({
		   	class_name: 'pagination_button'
		}));
		parent.appendChild(last_span);
		
		if(end_page == UIUtils.getPage())
        {
			var last_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-last-dim.png'
			}));
			last_span.appendChild(last_img);
			var next_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-next-dim.png'
			}));
			next_span.appendChild(next_img);
        }
		else {
			var last_link = UIUtils.createHTMLElement("a", $H({
				title: gettext('Go to last page')
			}));
			last_link.observe("click", function(event){
				UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(),"last", items);
			});
			last_span.appendChild(last_link);
			var last_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-last.png'
			}));
			last_link.appendChild(last_img);
			var next_link = UIUtils.createHTMLElement("a", $H({
				title: gettext('Go to next page')
			}));
			next_link.observe("click", function(event){
				UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, UIUtils.getOffset(), "next", items);
			});
			next_span.appendChild(next_link);
			var next_img = UIUtils.createHTMLElement("img", $H({
				src: '/ezweb/images/go-next.png'
			}));
			next_link.appendChild(next_img);
		}
	}

    var _orderby = function(parent, items) {
		parent.innerHTML = '';
		parent.appendChild(UIUtils.createHTMLElement("label", $H({
			for_: 'combo_order_by',
			innerHTML: gettext(" Order by") + ':'
		})));
		var select = UIUtils.createHTMLElement("select", $H({
			id: 'combo_order_by'
		}));
		select.observe("change", function(event){
			UIUtils.setOrderby(this);
			UIUtils.cataloguePaginate(URIs.GET_POST_RESOURCES, $('combo_results_per_page').options[$('combo_results_per_page').selectedIndex].value.toString(), 'first', items);
		});
		parent.appendChild(select);
		
		if (items==0) {
			select.setAttribute("disabled", "disabled");
		}
		else {
			var creation = UIUtils.createHTMLElement("option", $H({
				value: '-creation_date',
				innerHTML: gettext("Creation date")
			}));
			if (UIUtils.orderby == "-creation_date") creation.setAttribute("selected", "selected");
			select.appendChild(creation);
			var name = UIUtils.createHTMLElement("option", $H({
				value: 'short_name',
				innerHTML: gettext("Name")
			}));
			if (UIUtils.orderby == "short_name") name.setAttribute("selected", "selected");
			select.appendChild(name);
			var vendor = UIUtils.createHTMLElement("option", $H({
				value: 'vendor',
				innerHTML: gettext("Vendor")
			}));
			if (UIUtils.orderby == "vendor") vendor.setAttribute("selected", "selected");
			select.appendChild(vendor);
			var author = UIUtils.createHTMLElement("option", $H({
				value: 'author',
				innerHTML: gettext("Author")
			}));
			if (UIUtils.orderby == "author") author.setAttribute("selected", "selected");
			select.appendChild(author);
			var popularity = UIUtils.createHTMLElement("option", $H({
				value: '-popularity',
				innerHTML: gettext("Popularity")
			}));
			if (UIUtils.orderby == "-popularity") popularity.setAttribute("selected", "selected");
			select.appendChild(popularity);
		}
	}

    var _globalTagsToTagcloud = function(parent){
        parent.innerHTML = "";
        for (var i = 0; i < globalTags.length; i++) {
            var new_tag = UIUtils.createHTMLElement("span", $H({
                class_name: 'multiple_size_tag'
            }));
            new_tag.appendChild(globalTags[i].tagToTypedHTML({
                tags: 'multiple'
            }));
            if (UIUtils.globalTags == "mytags") {
                var image_container = UIUtils.createHTMLElement("span", $H({
                    title: gettext('Delete tag')
                }));
                image_container.observe("click", function(event){
                    UIUtils.removeGlobalTagUser(this.parentNode.firstChild.innerHTML);
                });
                var image = UIUtils.createHTMLElement("img", $H({
                    id: ('delete_icon_' + i),
                    src: '/ezweb/images/cancel_gray.png',
                    border: '0',
                    name: 'op1'
                }));
                image.observe("mouseover", function(event){
                    this.src = '/ezweb/images/delete.png';
                });
                image.observe("mouseout", function(event){
                    this.src = '/ezweb/images/cancel_gray.png';
                });
				image_container.appendChild(image);
                new_tag.appendChild(image_container);
            }
            var separator = UIUtils.createHTMLElement("span", $H({
                innerHTML: ((i < (globalTags.length - 1)) ? "," : "")
            }));
            new_tag.appendChild(separator);
            parent.appendChild(new_tag);
        }
    }

	OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.CATALOGUE);
	
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
