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

  //////////////////////////////////////////////
  //                RESOURCE                  //
  //////////////////////////////////////////////

function Resource(id, resourceJSON_, urlTemplate_) {

	// *******************
	//  PRIVATE VARIABLES
	// *******************

	this._state = null;
	this._id = id;
	this._tagger = new Tagger();
	this._versionSelected = null;

	if (urlTemplate_ != null) {
		this._createResource(urlTemplate_);
	} else {
		this._state = new ResourceState(resourceJSON_);
		this.paint();
	}
}

// ******************
//  PUBLIC FUNCTIONS
// ******************
Resource.prototype.getVendor = function() { return this._state.getVendor();}
Resource.prototype.getName = function() { return this._state.getName();}
Resource.prototype.getDisplayName = function() { return this._state.getDisplayName();}
Resource.prototype.getVersion = function() { return this._state.getVersion();}
Resource.prototype.getId = function() { return this._state.getId();}
Resource.prototype.getAllVersions = function() { return this._state.getAllVersions();}
Resource.prototype.getDescription = function() { return this._state.getDescription();}
Resource.prototype.getUriImage = function() { return this._state.getUriImage();}
Resource.prototype.getUriTemplate = function() { return this._state.getUriTemplate();}
Resource.prototype.getUriWiki = function() { return this._state.getUriWiki();}
Resource.prototype.getMashupId = function() { return this._state.getMashupId();}
Resource.prototype.getAddedBy = function() { return this._state.getAddedBy();}
Resource.prototype.getTags = function() { return this._state.getTags();}
Resource.prototype.setTags = function(tags_) { this._state.setTags(tags_);}
Resource.prototype.addTag = function(tag) { this._state.addTag(tag); }
Resource.prototype.getSlots = function() { return this._state.getSlots();}
Resource.prototype.setSlots = function(slots_) { this._state.setSlots(slots_);}
Resource.prototype.getEvents = function() { return this._state.getEvents();}
Resource.prototype.setEvents = function(events_) { this._state.setEvents(events_);}
Resource.prototype.getTagger = function() { return this._tagger;}
Resource.prototype.getContract = function() { return this._state.getContract();}
Resource.prototype.setVotes = function(voteData_) {
	this._state.setVotes(voteData_);
	this._rateResource();
}
Resource.prototype.getVotes = function() {return this._state.getVotes();}
Resource.prototype.getUserVote = function() {return this._state.getUserVote();}
Resource.prototype.getPopularity = function() {return this._state.getPopularity();}
Resource.prototype.getSelectedVersion = function() {return this._versionSelected;}
Resource.prototype.setSelectedVersion = function(version) {this._versionSelected = version;}

/**
 * @private
 * Set the "resource_image_not_avaiable" image to this resource
 */
Resource.prototype._setDefaultImage = function(e) {
	this.image.stopObserving("error", this._setDefaultImage);
	this.image.stopObserving("abort", this._setDefaultImage);

	this.image.src = _currentTheme.getIconURL('showcase-resource_image_not_available');
}

Resource.prototype.paint = function() {
	var resource = UIUtils.createHTMLElement("div", $H({
		id: this._id,
		class_name: 'resource'
	}));
	$("resources").appendChild(resource);

	// TOP
	resource.appendChild(UIUtils.createHTMLElement("div", $H({
		class_name: 'top'
	})));

	// TOOLBAR
	var toolbar = UIUtils.createHTMLElement("div", $H({
		class_name: 'toolbar'
	}));
	resource.appendChild(toolbar);
	
	displayName = this._state.getDisplayName()
	toolbar.appendChild(UIUtils.createHTMLElement("div", $H({
		class_name: 'title',
		title: displayName,
		innerHTML: (displayName.length > 18)?displayName.substring(0, 18)+"&#8230;": displayName
	})));
	
	var content_toolbar = document.createElement("div");
	toolbar.appendChild(content_toolbar);
	
	
	// Depending on capabilities, the add button can be different!
	// Depending on resource type (Gadget, mashup), the add button can be different!

	var button_message = gettext('Add');

	if (this._state.getMashupId() == null) {
		//Gadget

		var button_class = '';

		if (this.isContratable() && (! this.hasContract())) {
			button_message = gettext('Purchase');
			button_class = 'contratable';
		}

		var button = UIUtils.createHTMLElement("button", $H({
			innerHTML: button_message,
			class_name: button_class
		}));

		button.observe("click", function(event) {
			CatalogueFactory.getInstance().addResourceToShowCase(this._id);
		}.bind(this), false, "instance_gadget");
	} else {
		//Mashup

		//var button_message = gettext('Add Mashup');
		var button_class = 'add_mashup'

		if (this.isContratable() && (! this.hasContract())) {
			button_message = gettext('Purchase');
			button_class = 'contratable';
		}

		var button = UIUtils.createHTMLElement("button", $H({
			innerHTML: button_message,
			class_name: button_class
		}));

		button.observe("click", function(event) {
			LayoutManagerFactory.getInstance().showWindowMenu("addMashup",
				function(){CatalogueFactory.getInstance().addMashupResource(this._id);}.bind(this),
				function(){CatalogueFactory.getInstance().mergeMashupResource(this._id);}.bind(this));
		}.bind(this), false, "instance_mashup");
	}
	content_toolbar.appendChild(button);
	
	// Delete icon
/*	if (this._state.getAddedBy() == 'Yes') {
		var deleteResource = UIUtils.createHTMLElement("a", $H({
			title: gettext('Delete'),
			class_name: 'delete button'
		}));
		deleteResource.observe("click", function(event) {
			UIUtils.selectedResource = this._id;
			UIUtils.selectedVersion = null;
			LayoutManagerFactory.getInstance().showWindowMenu('deleteAllResourceVersions');
		}.bind(this));
		content_toolbar.appendChild(deleteResource);
	}
*/
	// CONTENT
	var content = UIUtils.createHTMLElement("div", $H({
		class_name: 'content'
	}));
	resource.appendChild(content);

	var image_div = UIUtils.createHTMLElement("div", $H({
		class_name: 'image'
	}));
	content.appendChild(image_div);
	var image_link = UIUtils.createHTMLElement("a", $H({
		title: gettext('Show resource details')
	}));
	image_link.observe("click", function(event) {
		UIUtils.sendPendingTags();
		UIUtils.clickOnResource(this._id);
	}.bind(this));
	image_div.appendChild(image_link);
	this.image = UIUtils.createHTMLElement("img", $H({
		src: this._state.getUriImage()
	}));

	this._setDefaultImage = this._setDefaultImage.bind(this);
	this.image.observe("error", this._setDefaultImage);
	this.image.observe("abort", this._setDefaultImage);
	image_link.appendChild(this.image);

	// Wiki icon
/*	var wiki = UIUtils.createHTMLElement("a", $H({
		title: gettext ('Show More'),
		target: '_blank',
		class_name: 'wiki button',
		href: this._state.getUriWiki()
	}));
	image_div.appendChild(wiki);
*/
	// Tags
	var tags = UIUtils.createHTMLElement("div", $H({
		class_name: 'tags'
	}));
	content.appendChild(tags);
	var important_tags = UIUtils.createHTMLElement("div", $H({
		id: this._id + '_important_tags',
		class_name: 'important_tags'
	}));
	tags.appendChild(important_tags);
	var numTags =this._tagsToMoreImportantTags(important_tags, 3);
		
	if(numTags>0){
		//go to tagcloud button
		var button = UIUtils.createHTMLElement("a", $H({
			class_name: 'go_to_tagCloud',
			innerHTML: gettext('More')
		}));
		button.observe("click", function(event){
			UIUtils.sendPendingTags();
			UIUtils.showResourceTagCloud(this._id);
		}.bind(this));
		tags.appendChild(button);
	}

	// BOTTOM
	var bottom = UIUtils.createHTMLElement("div", $H({
		class_name: 'bottom'
	}));
	resource.appendChild(bottom);
}

Resource.prototype.isContratable = function () {
	var capabilities = this._state.getCapabilities();

	for (var i = 0; i < capabilities.length; i++) {
		var capability = capabilities[i];
		if (capability.name.toLowerCase() == 'contratable')
			return capability.value.toLowerCase() == "true";
		else
			return false
	}
}

Resource.prototype.hasContract = function () {
	return this._state.getContract();
}

Resource.prototype.showInfo = function() {
	$("info_resource_content").innerHTML = '';
	if (this._state.getMashupId()==null) {
		//Gadget
		$("info_resource_content").appendChild(UIUtils.createHTMLElement("div", $H({ 
			class_name: 'title_fieldset',
			innerHTML: gettext('Gadget details')
		})));
	} else {
		//Mashup
		$("info_resource_content").appendChild(UIUtils.createHTMLElement("div", $H({ 
			class_name: 'title_fieldset',
			innerHTML: gettext('Mashup details')
		})));
	}
	var fieldset = UIUtils.createHTMLElement("div", $H({ 
		class_name: 'fieldset'
	}));
	$("info_resource_content").appendChild(fieldset);
	var title = UIUtils.createHTMLElement("div", $H({ 
		class_name: 'title'
	}));
	fieldset.appendChild(title);
	title.appendChild(UIUtils.createHTMLElement("span", $H({ 
		class_name: 'name',
		innerHTML: this._state.getDisplayName()
	})));
	var wikiLink = UIUtils.createHTMLElement("a", $H({ 
		class_name: 'wiki',
		href: this._state.getUriWiki(),
		target: '_blank',
		title: gettext('More info'),
		alt: gettext('More info')
	}));
	
	var wikiImg = UIUtils.createHTMLElement("img", $H({
		src: _currentTheme.getIconURL('catalogue-wiki')
	}));
	
	wikiLink.appendChild(wikiImg);
	title.appendChild(wikiLink);
	
	fieldset.appendChild(UIUtils.createHTMLElement("div", $H({ 
		class_name: 'vendor',
		innerHTML: this._state.getVendor()
	})));
	var rating = UIUtils.createHTMLElement("div", $H({ 
		class_name: 'rating'
	}));
	fieldset.appendChild(rating);
	rating.appendChild(UIUtils.createHTMLElement("span", $H({ 
		id: 'rateStatus',
		innerHTML: gettext('Vote Me... ')
	})));
	rating.appendChild(UIUtils.createHTMLElement("span", $H({ 
		id: 'ratingSaved',
		innerHTML: gettext('Vote Saved ')
	})));
	
	rating.appendChild(UIUtils.createHTMLElement("span", $H({ 
		id: 'votes'
	})));
	var rate_me = UIUtils.createHTMLElement("span", $H({ 
		id: 'rateMe'
	}));
	rating.appendChild(rate_me);
	var rate_me_array = [];
	rate_me_array[0] = UIUtils.createHTMLElement("a", $H({ 
		id: '_1',
		title: gettext('Ehh...')
	}));
	rate_me_array[1] = UIUtils.createHTMLElement("a", $H({ 
		id: '_2',
		title: gettext('Not Bad')
	}));
	rate_me_array[2] = UIUtils.createHTMLElement("a", $H({ 
		id: '_3',
		title: gettext('Pretty Good')
	}));
	rate_me_array[3] = UIUtils.createHTMLElement("a", $H({ 
		id: '_4',
		title: gettext('Out Standing')
	}));
	rate_me_array[4] = UIUtils.createHTMLElement("a", $H({ 
		id: '_5',
		title: gettext('Awesome!')
	}));
	var rate_me_iterator = $A(rate_me_array);
	rate_me_iterator.each(function(item){
		item.observe("click", function(event){
			UIUtils.sendVotes(this);
		});
		item.observe("mouseover", function(event){
			UIUtils.rating(this);
		});
		item.observe("mouseout", function(event){
			UIUtils.off_rating(this);
		});
		rate_me.appendChild(item);
	});
	rating.appendChild(UIUtils.createHTMLElement("span", $H({ 
		id: 'rateResultStatus',
		innerHTML: gettext('Vote Result:')
	})));
	var rate_result = UIUtils.createHTMLElement("span", $H({ 
		id: 'rateResult'
	}));
	rating.appendChild(rate_result);
	rate_result.appendChild(UIUtils.createHTMLElement("a", $H({ 
		id: 'res_1',
		title: gettext('Ehh...')
	})));
	rate_result.appendChild(UIUtils.createHTMLElement("a", $H({ 
		id: 'res_2',
		title: gettext('Not Bad')
	})));
	rate_result.appendChild(UIUtils.createHTMLElement("a", $H({ 
		id: 'res_3',
		title: gettext('Pretty Good')
	})));
	rate_result.appendChild(UIUtils.createHTMLElement("a", $H({ 
		id: 'res_4',
		title: gettext('Out Standing')
	})));
	rate_result.appendChild(UIUtils.createHTMLElement("a", $H({ 
		id: 'res_5',
		title: gettext('Awesome!')
	})));

	var image = UIUtils.createHTMLElement("div", $H({ 
		class_name: 'image'
	}));
	fieldset.appendChild(image);
	image.appendChild(UIUtils.createHTMLElement("img", $H({ 
		src: this._state.getUriImage(),
		alt: this._state.getName()+ ' ' + this._state.getVersion()
	})));
	// tag cloud
	var tagcloud = UIUtils.createHTMLElement("div", $H({ 
		class_name: 'tagcloud'
	}));
	fieldset.appendChild(tagcloud);
	tagcloud.appendChild(UIUtils.createHTMLElement("span", $H({ 
		innerHTML: gettext('Tagcloud') + ':'
	})));
	var tag_links = UIUtils.createHTMLElement("div", $H({ 
		class_name: 'link',
		id: 'view_tags_links'
	}));
	tagcloud.appendChild(tag_links);
	tag_links.appendChild(UIUtils.createHTMLElement("span", $H({ 
		innerHTML: gettext('All tags')
	})));
	var my_tags = UIUtils.createHTMLElement("a", $H({ 
		innerHTML: gettext('My tags')
	}));
	my_tags.observe("click", function(event){
		CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("mytags");
		//the number of tags may make the info_resource container higher
		UIUtils.setInfoResourceHeight();
	});
	tag_links.appendChild(my_tags);
	var others_tags = UIUtils.createHTMLElement("a", $H({ 
		innerHTML: gettext('Others tags')
	}));
	others_tags.observe("click", function(event){
		CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("others");
		//the number of tags may make the info_resource container higher
		UIUtils.setInfoResourceHeight();
	});
	tag_links.appendChild(others_tags);
	var tags = UIUtils.createHTMLElement("div", $H({ 
		class_name: 'tags',
		id: this._id + '_tagcloud'
	}));
	tagcloud.appendChild(tags);
	this._tagsToTagcloud(tags, 'description');
	var add_tags_panel = UIUtils.createHTMLElement("div", $H({
		id: 'add_tags_panel',
		class_name: 'new_tags',
		style: 'display:none;'
	}));
	fieldset.appendChild(add_tags_panel);
	add_tags_panel.appendChild(UIUtils.createHTMLElement("div", $H({
		class_name: 'title',
		innerHTML: gettext('New tags')
	})));
	my_tags = UIUtils.createHTMLElement("div", $H({
		id: 'my_tags',
		class_name: 'my_tags'
	}));
	add_tags_panel.appendChild(my_tags);
	var new_tag_text = UIUtils.createHTMLElement("div", $H({
		id: "new_tag_text",
		class_name: "new_tag_text"
	}));
	my_tags.appendChild(new_tag_text);
	my_tags.appendChild (new_tag_text);
	var new_tag_text_input = UIUtils.createHTMLElement("input", $H({
		id: 'new_tag_text_input',
		type: 'text',
		maxlength: '20'
	}));
	new_tag_text_input.observe("keyup", function(event){
		UIUtils.enlargeInput(this);
	});
	new_tag_text_input.observe("keypress", function(event){
		UIUtils.onReturn(event,UIUtils.sendTags,this);
	});
	new_tag_text.appendChild(new_tag_text_input);
	add_tags_panel.appendChild(UIUtils.createHTMLElement("div", $H({
		id: 'tag_alert',
		class_name: 'message_error'
	})));
	var buttons = UIUtils.createHTMLElement("div", $H({
		class_name: 'buttons'
	}));
	add_tags_panel.appendChild(buttons);
	var link_tag = UIUtils.createHTMLElement("a", $H({
		class_name: 'submit_link',
		innerHTML: gettext('Tag')
	}));
	link_tag.observe("click", function(event){
		UIUtils.sendTags();
	});
	buttons.appendChild(link_tag);
//	var link_delete = UIUtils.createHTMLElement("a", $H({
//		class_name: 'submit_link',
//		innerHTML: gettext('Delete all')
//	}));
//	link_delete.observe("click", function(event){
//		UIUtils.removeAllTags();
//	});
//	buttons.appendChild(link_delete);
	var add_tags_link = UIUtils.createHTMLElement("div", $H({
		id: 'add_tags_link',
		class_name: 'link',
		style: 'text-align:right;'
	}));
	fieldset.appendChild(add_tags_link);
	var add_tags_submit_link = UIUtils.createHTMLElement("a", $H({
		class_name: 'submit_link',
		innerHTML: gettext('Tag the resource')
	}));
	add_tags_submit_link.observe("click", function(event){
		CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud('mytags');
		//the number of tags may make the info_resource container higher
		UIUtils.setInfoResourceHeight();
	});
	add_tags_link.appendChild(add_tags_submit_link);

	// Description
	var description = UIUtils.createHTMLElement("div", $H({ 
		class_name: 'description'
	}));
	fieldset.appendChild(description);
	description.appendChild(UIUtils.createHTMLElement("span", $H({ 
		innerHTML: gettext('Description') + ':'
	})));
	var access_wiki_link = UIUtils.createHTMLElement("div", $H({
		id: 'access_wiki_link',
		class_name: 'link',
		style: 'text-align:right;'
	}));
	var access_wiki_submit_link = UIUtils.createHTMLElement("a", $H({
		class_name: 'submit_link',
		href: this._state.getUriWiki(),
		target: '_blank',
		innerHTML: gettext('Show More...'),
		style: 'display:block'
	}));
	access_wiki_link.appendChild(access_wiki_submit_link);
	description.appendChild(UIUtils.createHTMLElement("div", $H({ 
		class_name: 'text',
		innerHTML: this._state.getDescription() + access_wiki_link.innerHTML
	})));


	// Connectivity
	var connect = UIUtils.createHTMLElement("div", $H({ 
		class_name: 'connect'
	}));
	fieldset.appendChild(connect);
	connect.appendChild(UIUtils.createHTMLElement("span", $H({ 
		innerHTML: gettext('Resource connectivity') + ':'
	})));

	// Advanced connectivity search by events
	var connect_text = UIUtils.createHTMLElement("div", $H({ 
		id:'events_slots',
		class_name: 'text',
		style: 'display:none'
	}));
	connect.appendChild(connect_text);

	// Advanced connectivity search by events
	var events = UIUtils.createHTMLElement("div", $H({ 
		class_name: 'events'
	}));
	connect_text.appendChild(events);
	events.appendChild(UIUtils.createHTMLElement("img", $H({
		title: gettext('All compatible gadgets by events are highlighted in this color'),
		src: _currentTheme.getIconURL('catalogue-resource_compatible_event')
	})));
	if (this._state.getEvents().length != 0) {
		var events_link = UIUtils.createHTMLElement("a",$H({
			class_name: 'submit_link',
			title: gettext('Search by all compatible events'),
			innerHTML: gettext('Events') + ':'
		}));
		events_link.observe("click", function(event) {
			UIUtils.searchByConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, 'connectEvent', this._state.getEvents().join(" "));
		}.bind(this));
		events.appendChild(events_link);
	} else {
		events.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: gettext('Events') + ': '
		})));
	}
	this._events(events);

	// Advanced connectivity search by slots
	var slots = UIUtils.createHTMLElement("div", $H({ 
		class_name: 'slots'
	}));
	connect_text.appendChild(slots);
	slots.appendChild(UIUtils.createHTMLElement("img", $H({
		title: gettext('All compatible gadgets by slots are highlighted in this color'),
		src: _currentTheme.getIconURL('catalogue-resource_compatible_slot')
	})));
	if (this._state.getSlots().length != 0) {
		var slots_link = UIUtils.createHTMLElement("a",$H({
			class_name: 'submit_link',
			title: gettext('Search by all compatible slots'),
			innerHTML: gettext('Slots') + ':'
		}));
		slots_link.observe("click", function(event) {
			UIUtils.searchByConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, 'connectSlot', this._state.getSlots().join(" "));
		}.bind(this));
		slots.appendChild(slots_link);
	} else {
		slots.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: gettext('Slots') + ': '
		})));
	}
	this._slots(events);

	// Connectivity by Slots or Events
	if (this._state.getSlots().length != 0 || this._state.getEvents().length != 0) {
		var search_events_slots_div = UIUtils.createHTMLElement("div", $H({
			id: 'search_events_slots_div',
			class_name: 'link',
			style: 'text-align:right;'
		}));
		fieldset.appendChild(search_events_slots_div);

		var search_events_slots_link = UIUtils.createHTMLElement("a", $H({
			id: 'search_events_slots_link',
			class_name: 'submit_link',
			innerHTML: gettext('Search all connectable gadgets')
		}));
		search_events_slots_link.observe("click", function(event){
			UIUtils.searchByGlobalConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, this._state.getEvents().join(" "), this._state.getSlots().join(" "));
		}.bind(this));
		search_events_slots_div.appendChild(search_events_slots_link);
	}
	var search_advanced_events_slots_div = UIUtils.createHTMLElement("div", $H({
		id: 'search_advanced_events_slots_div',
		class_name: 'link',
		style: 'text-align:right;'
	}));
	fieldset.appendChild(search_advanced_events_slots_div)
	var search_advanced_event_slot_link = UIUtils.createHTMLElement ("a", $H({
		id: 'search_advanced_events_slots_link',
		class_name: 'submit_link',
		innerHTML: gettext('Advanced Search by connectivity')
	}));

	search_advanced_event_slot_link.observe("click", function(event) {
		if (document.getElementById("events_slots").style.display == "block") {
			document.getElementById("events_slots").style.display = "none";
			document.getElementById("search_advanced_events_slots_link").innerHTML = gettext('Advanced Search by connectivity')
		} else {
			document.getElementById("events_slots").style.display = "block";
			document.getElementById("search_advanced_events_slots_link").innerHTML = gettext('Hide Advanced Search by connectivity')
		}
		//the number of tags may make the info_resource container higher
		UIUtils.setInfoResourceHeight();
	});

	search_advanced_events_slots_div.appendChild(search_advanced_event_slot_link);
	// VERSIONS
	var versions = UIUtils.createHTMLElement("div", $H({
		class_name: 'versions'
	}));
	fieldset.appendChild(versions);
	versions.appendChild(UIUtils.createHTMLElement("span", $H({
		innerHTML: gettext('Selected version') + ': '
	})));
	versions.appendChild(UIUtils.createHTMLElement("span", $H({
		id: 'version_link',
		style: 'color:#0000ff;',
		innerHTML: 'v' + this.getVersion()
	})));
	var version_panel = UIUtils.createHTMLElement("div", $H({
		id: 'version_panel',
		class_name: 'version_panel',
		style: 'display:none;'
	}));
	versions.appendChild(version_panel);
	var title_versions_div = UIUtils.createHTMLElement("div", $H({
		class_name: 'version_title'
	}));
	title_versions_div.appendChild(UIUtils.createHTMLElement("span", $H({
		innerHTML: gettext('Choose the version you want to view') + ': '
	})));
	version_panel.appendChild(title_versions_div);
	this._addVersionsToPanel(version_panel);
	var show_versions_div = UIUtils.createHTMLElement("div", $H({
		id: 'view_versions_div',
		class_name: 'link',
		style: 'text-align:right;'
	}));
	fieldset.appendChild(show_versions_div);
	var show_versions_link = UIUtils.createHTMLElement("a", $H({
		id: 'view_versions_link',
		class_name: 'submit_link',
		innerHTML: gettext('Show all versions')
	}));
	show_versions_link.observe("click", function(event) {
		CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).showVersionPanel();
		//the number of tags may make the info_resource container higher
		UIUtils.setInfoResourceHeight();
	});
	show_versions_div.appendChild(show_versions_link);

	var access_template_link = UIUtils.createHTMLElement("div", $H({
		id: 'access_template_link',
		class_name: 'link'
	}));
	fieldset.appendChild(access_template_link);
	var access_template_submit_link = UIUtils.createHTMLElement("a", $H({
		class_name: 'submit_link',
		href: this._state.getUriTemplate(),
		target: '_blank',
		innerHTML: gettext('Access to the Template')
	}));
	access_template_link.appendChild(access_template_submit_link);
	if (this._state.getMashupId()==null){ //it is a Gadget (not visible in Mashups)
		var update_code_link = UIUtils.createHTMLElement("div", $H({
			id: 'update_code_link',
			class_name: 'link'
		}));
		fieldset.appendChild(update_code_link);
		var update_code_submit_link = UIUtils.createHTMLElement("a", $H({
			class_name: 'submit_link',
			innerHTML: gettext('Update code')
		}));
		update_code_submit_link.observe("click", function(event) {
			UIUtils.updateGadgetXHTML();
		});
		update_code_link.appendChild(update_code_submit_link);
	}
	var delete_gadget_link = UIUtils.createHTMLElement("div", $H({
		id: 'delete_gadget_link',
		class_name: 'link'
	}));
	fieldset.appendChild(delete_gadget_link);
	this._deleteGadget(delete_gadget_link);
	if (this._state.getMashupId()==null){ //add gadget button
		var add_gadget_button = UIUtils.createHTMLElement("button", $H({
			id: 'add_gadget_button',
			class_name: 'add_gadget',
			style: 'text-align:center;',
			innerHTML: gettext('Add Gadget')
		}));
		add_gadget_button.observe("click", function(event) {
			CatalogueFactory.getInstance().addResourceToShowCase(UIUtils.getSelectedResource());
		},false,"instance_gadget");

		$("info_resource_content").appendChild(add_gadget_button);
	} else { //add mashup button
		var add_gadget_button = UIUtils.createHTMLElement("button", $H({
			id: 'add_gadget_button',
			class_name: 'add_mashup',
			style: 'text-align:center;',
			innerHTML: gettext('Add Mashup')
		}));
		add_gadget_button.observe("click", function(event){
			CatalogueFactory.getInstance().addMashupResource(UIUtils.getSelectedResource());
		},false,"instance_mashup");

		var merge_mashup_button = UIUtils.createHTMLElement("button", $H({
			id: 'merge_mashup_button',
			class_name: 'add_mashup',
			style: 'text-align:center;',
			innerHTML: gettext('Merge Mashup')
		}));
		merge_mashup_button.observe("click", function(event){
			CatalogueFactory.getInstance().mergeMashupResource(UIUtils.getSelectedResource());
		},false,"instance_mashup");

		$("info_resource_content").appendChild(add_gadget_button);
		$("info_resource_content").appendChild(merge_mashup_button);
	}

	this._rateResource();

	//size of info resource container may change.
	UIUtils.setInfoResourceHeight();
}

Resource.prototype.updateTags = function() {
	var numTags = this._tagsToMoreImportantTags($(this._id + "_important_tags"), 3);
	
	var tags = $$("#" + this._id + " .tags")[0];
	var gotoButton = $$("#" + this._id + " .tags" + " .go_to_tagCloud")[0];
	if(numTags>0 && !gotoButton){
		//go to tagcloud button
		var button = UIUtils.createHTMLElement("a", $H({
			class_name: 'go_to_tagCloud',
			innerHTML: gettext('More')
		}));
		button.observe("click", function(event){
			UIUtils.sendPendingTags();
			UIUtils.showResourceTagCloud(this._id);
		}.bind(this));
		tags.appendChild(button);
	}
	
	if ((this._id == UIUtils.selectedResource) &&  ($(this._id + "_tagcloud") != null))
		this._tagsToTagcloud($(this._id + "_tagcloud"), 'description' , {tags:'mytags'});
}

Resource.prototype.changeTagcloud = function(type) {
	var option = {};
	$("view_tags_links").innerHTML = "";
	option = {tags: type};
	switch(type){
		case "mytags":
			var all_tags = UIUtils.createHTMLElement("a", $H({
				innerHTML: gettext('All tags')
			}));
			all_tags.observe("click", function(event) {
				CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("all");
				//the number of tags may make the info_resource container higher
				UIUtils.setInfoResourceHeight();
			});
			$("view_tags_links").appendChild(all_tags);
			$("view_tags_links").appendChild(UIUtils.createHTMLElement("span", $H({
				innerHTML: gettext('My tags')
			})));
			var others_tags = UIUtils.createHTMLElement("a", $H({
				innerHTML: gettext('Others tags')
			}));
			others_tags.observe("click", function(event){
				CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("others");
				//the number of tags may make the info_resource container higher
				UIUtils.setInfoResourceHeight();
			});
			$("view_tags_links").appendChild(others_tags);
			UIUtils.hidde("add_tags_link");
			UIUtils.show("add_tags_panel");
			$("new_tag_text_input").value="";
			$("new_tag_text_input").size=5;
			$("new_tag_text_input").focus();
			break;
		case "others":
			var all_tags = UIUtils.createHTMLElement("a", $H({
				innerHTML: gettext('All tags')
			}));
			all_tags.observe("click", function(event){
				CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("all");
				//the number of tags may make the info_resource container higher
				UIUtils.setInfoResourceHeight();
			});
			$("view_tags_links").appendChild(all_tags);
			var my_tags = UIUtils.createHTMLElement("a", $H({
				innerHTML: gettext('My tags')
			}));
			my_tags.observe("click", function(event){
				CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("mytags");
				//the number of tags may make the info_resource container higher
				UIUtils.setInfoResourceHeight();
			});
			$("view_tags_links").appendChild(my_tags);
			$("view_tags_links").appendChild(UIUtils.createHTMLElement("span", $H({
				innerHTML: gettext('Others tags')
			})));
			UIUtils.show("add_tags_link");
			UIUtils.hidde("add_tags_panel");
			break;
		case "all":
		default:
			$("view_tags_links").appendChild(UIUtils.createHTMLElement("span", $H({
				innerHTML: gettext('All tags')
			})));
			var my_tags = UIUtils.createHTMLElement("a", $H({
				innerHTML: gettext('My tags')
			}));
			my_tags.observe("click", function(event){
				CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("mytags");
				//the number of tags may make the info_resource container higher
				UIUtils.setInfoResourceHeight();
			});
			$("view_tags_links").appendChild(my_tags);
			var others_tags = UIUtils.createHTMLElement("a", $H({
				innerHTML: gettext('Others tags')
			}));
			others_tags.observe("click", function(event){
				CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("others");
				//the number of tags may make the info_resource container higher
				UIUtils.setInfoResourceHeight();
			});
			$("view_tags_links").appendChild(others_tags);
			UIUtils.show("add_tags_link");
			UIUtils.hidde("add_tags_panel");
	}

	if ($(this._id + '_tagcloud'))
		this._tagsToTagcloud($(this._id + '_tagcloud'), 'description', option);
}

Resource.prototype.showVersionPanel = function() {
	if ($("version_panel").style.display == 'none'){
		$("version_panel").style.display = 'block';
		$("view_versions_link").innerHTML = gettext('Hide all versions'); 
	} else {
		$("version_panel").style.display = 'none'
		$("view_versions_link").innerHTML = gettext('Show all versions');
	}
}

	// *******************
	//  PRIVATE FUNCTIONS
	// *******************
	
	var _getFirstTagNonRepeat = function(list1_, list2_) {
		for (var i=0; i<list1_.length; i++) {
			if (!_containsTag(list1_[i], list2_)) return list1_[i];
		}
		return;
	}
	
	var _containsTag = function(element_, list_)
	{
		for (var i=0; i<list_.length; i++) {
			if (element_.equals(list_[i])) {
				return true;
			}
		}
		return false;
	}
	
Resource.prototype._tagsToMoreImportantTags = function(parent, tagsNumber_) {
	var tagsHTML = '';
	var tagsAux = this._state.getTags();
	var moreImportantTags = [];

	var tagNumber = Math.min(tagsNumber_, tagsAux.length);
	for (var i=0; i<tagNumber; i++){
		var firstTag = _getFirstTagNonRepeat(tagsAux, moreImportantTags);
		if (firstTag) {
			moreImportantTags[i] = firstTag;
			for (var j=0; j<tagsAux.length; j++){
				if ((!_containsTag(tagsAux[j], moreImportantTags)) && (moreImportantTags[i].compareTo(tagsAux[j]) < 0)) {
					moreImportantTags[i] = tagsAux[j];
				}
			}
		} else {
			break;
		}
	}

	parent.innerHTML='';
	for (var i = 0; i < moreImportantTags.length; i++) {
		parent.appendChild(moreImportantTags[i].tagToHTML())
		if (i < (((moreImportantTags.length>tagsNumber_)?tagsNumber_:moreImportantTags.length)-1)){
			parent.appendChild(UIUtils.createHTMLElement("span", $H({
				innerHTML: ', '
			})));
		}
	}
	return moreImportantTags.length;
}

/**
 * @private
 *
 * Builds the event list for searching by event.
 */
Resource.prototype._events = function(parent) {
	parent.innerHMTL = '';
	var eventsAux = this._state.getEvents();

	for (var i = 0; i < eventsAux.length; i++) {
		var tag = UIUtils.createHTMLElement("span", $H({ 
			class_name: 'multiple_size_tag'
		}));
		parent.appendChild(tag);
		var tag_link = UIUtils.createHTMLElement("a", $H({ 
			title: gettext('Search by ') + eventsAux[i],
			innerHTML: eventsAux[i]
		}));
		tag_link.observe("click", function(event){
			UIUtils.searchByConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, 'connectEvent', this.innerHTML);
		});
		tag.appendChild(tag_link);
		tag.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: ((i<(eventsAux.length-1))?",":"")
		})));
	}
}

/**
 * @private
 */
Resource.prototype._addVersionsToPanel = function (parent) {
	var sortByMin = function (a, b) {
		var x = parseFloat(a);
		var y = parseFloat(b);
		return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	}
	parent.innerHMTL = '';
	var versions = this._state.getAllVersions().sort(sortByMin);
	for (var i = 0; i < versions.length; i++) {
		var ver_element = UIUtils.createHTMLElement("span", $H({ 
		}));
		parent.appendChild(ver_element);
		if (versions[i] == this._state.getVersion()) {
			ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: 'v' + versions[i]
			})));
		} else {
			var ver_link = UIUtils.createHTMLElement("a", $H({ 
				title: gettext('Select this version as preferred version'),
				innerHTML: 'v' + versions[i]
			}));
			ver_link.observe("click", function(event){
				UIUtils.selectedVersion = event.currentTarget.innerHTML.substring(1);
				UIUtils.setPreferredGadgetVersion(UIUtils.selectedVersion);
			});
			ver_element.appendChild(ver_link);
		}
		if (this._state.getAddedBy() == 'Yes') {
			ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: " "
			})));
			var delete_img = UIUtils.createHTMLElement("button", $H({
				title: gettext('Delete this version of the gadget'),
				class_name: "delete_icon",
				name: versions[i]
			}));
			delete_img.observe("click", function(event) {
				UIUtils.selectedVersion = event.currentTarget.getAttribute('name')
				LayoutManagerFactory.getInstance().showWindowMenu('deleteAllResourceVersions');
			});
			ver_element.appendChild(delete_img);
			ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: " "
			})));
		} else {
			ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: ((i<(versions.length-1))?", ":"")
			})));
		}
	}
}

/**
 * @private
 *
 * Builds the delete link.
 */
Resource.prototype._deleteGadget = function(parent) {
	var addedBy = this._state.getAddedBy();
	parent.innerHTML = '';
	if (addedBy == 'Yes') {
		var submit_link = UIUtils.createHTMLElement("a", $H({
			class_name: 'submit_link',
			innerHTML: gettext('Delete')
		}));
		submit_link.observe("click", function(event) {
			UIUtils.deleteGadget(this._id);
		}.bind(this));
		parent.appendChild(submit_link);
	}
}

/**
 * @private
 *
 * Builds the slot list for searching by slot.
 */
Resource.prototype._slots = function(parent) {
	parent.innerHMTL = '';
	var slotsAux = this._state.getSlots();

	for (var i = 0; i < slotsAux.length; i++) {
		var tag = UIUtils.createHTMLElement("span", $H({
			class_name: 'multiple_size_tag'
		}));
		parent.appendChild(tag);

		var title = gettext('Search by %(slotName)s');
		title = interpolate(title, {slotName: slotsAux[i]});

		var tag_link = UIUtils.createHTMLElement("a", $H({
			title: title,
			innerHTML: slotsAux[i]
		}));
		tag_link.observe("click", function(event){
			UIUtils.searchByConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, 'connectSlot', this.innerHTML);
		});
		tag.appendChild(tag_link);
		tag.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: ((i<(slotsAux.length-1))?",":"")
		})));
	}
}

/**
 * @private
 */
Resource.prototype._tagsToTagcloud = function(parent, loc) {
	parent.innerHTML = "";
	var tagsAux = this._state.getTags();
	var option = arguments[2] || {tags:'all'};

	switch(option.tags) {
	case 'all':
		for (var i = 0; i < tagsAux.length; i++) {
			var tag = UIUtils.createHTMLElement("span", $H({ 
				class_name: 'multiple_size_tag'
			}));
			tag.appendChild(tagsAux[i].tagToTypedHTML());
			tag.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: ((i<(tagsAux.length-1))?",":"")
			})));
			parent.appendChild(tag);
		}
		break;
	case 'mytags':
		var tags = [];
		var j = 0;
		for (var i=0; i<tagsAux.length; i++) {
			if (tagsAux[i].getAdded_by() == 'Yes') {
				tags[j] = tagsAux[i];
				j++;
			}
		}
		for (var i=0; i<tags.length; i++) {
			var tag = UIUtils.createHTMLElement("span", $H({ 
				class_name: 'multiple_size_tag'
			}));
			tag.appendChild(tags[i].tagToTypedHTML(option));
			var tag_link = UIUtils.createHTMLElement("button", $H({ 
				title: gettext('Delete tag'),
				class_name: 'delete button',
			}));
			tag_link.observe("click", function(event) {
				UIUtils.removeTagUser(event.target.parentNode.firstChild.innerHTML, this._id);
			}.bind(this));
			tag.appendChild(tag_link);

			tag.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: ((i<(tags.length-1))?",":"")
			})));

			parent.appendChild(tag);
		}
		break;
	case 'others':
	default:
		var tags = [];
		var j = 0;
		for (var i = 0; i < tagsAux.length; i++) {
			if (tagsAux[i].getAdded_by() == 'No' || tagsAux[i].getAppearances() > 1) {
				tags[j] = tagsAux[i];
				j++;
			}
		}
		for (var i = 0; i < tags.length; i++) {
			var tag = UIUtils.createHTMLElement("span", $H({
				class_name: 'multiple_size_tag'
			}));
			tag.appendChild(tags[i].tagToTypedHTML());
			tag.appendChild(UIUtils.createHTMLElement("span", $H({
				innerHTML: ((i < (tags.length-1)) ? "," : "")
			})));
			parent.appendChild(tag);
		}
	}
}

/**
 * @private
 */
Resource.prototype._rateResource = function() {
	var vote = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getUserVote();
	var popularity = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getPopularity();
	if (vote !=0 ) {
		$("rateStatus").innerHTML = $("ratingSaved").innerHTML;
		for (var i = 1; i <= vote; i++)
			$("_"+i).className = "on";
	}
	if (popularity != null) {
		var i = 1
		for (i; i<=popularity; i++)
			$("res_"+i).className = "on";

		if ((popularity % 1) !=0) {
			$("res_"+i).className = "md";
			i++;
		}

		for (i; i<=5; i++)
			$("res_"+i).className = "";
	}
	var votes = this._state.getVotes();
	var msg = ngettext("%(voteCount)s vote", "%(voteCount)s votes", votes);
	$("votes").innerHTML = interpolate(msg, {voteCount: votes}, true);
}


/**
 * @private
 */
Resource.prototype._createResource = function(urlTemplate_) {

	// ******************
	//  CALLBACK METHODS
	// ******************

	var onError = function(transport, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError(gettext("Error creating the resource: %(errorMsg)s."), transport, e);
		logManager.log(msg);
		LayoutManagerFactory.getInstance().showMessageMenu(msg, Constants.Logging.ERROR_MSG);
		// Process
	}

	var loadResource = function(transport) {
		var response = transport.responseXML;
		this._state = new ResourceState(response);
		this.paint();
	}

	var persistenceEngine = PersistenceEngineFactory.getInstance();
	// Post Resource to PersistenceEngine. Asyncrhonous call!
	persistenceEngine.send_post(url_Server, url_, this, loadResource, onError);
}



  //////////////////////////////////////////////
  //       RESOURCESTATE (State Object)       //
  //////////////////////////////////////////////
  
	function ResourceState(resourceJSON_) {

	// *******************
	//  PRIVATE VARIABLES
	// *******************
	
	var vendor = null;
	var name = null;
	var displayName = null;
	var version = null;
	var id = null;
	var description = null;
	var uriImage = null;
	var uriWiki = null;
	var mashupId = null;
	var uriTemplate = null;
	var addedBy = null;
	var allVersions = [];
	var tags = [];
	var slots = [];
	var events = [];
	var votes = null;
	var popularity = null;
	var userVote = null;
	var capabilities = [];

	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	
	this.getVendor = function() { return vendor;}
	this.getName = function() { return name;}
	this.getDisplayName = function() { return displayName;}
	this.getVersion = function() { return version;}
	this.getId = function() { return id;}
	this.getAllVersions = function() { return allVersions;}
	this.getDescription = function() { return description;}
	this.getUriImage = function() { return uriImage;}
	this.getUriTemplate = function() { return uriTemplate;}
	this.getUriWiki = function() { return uriWiki;}
	this.getMashupId = function() { return mashupId;}
	this.getAddedBy = function() { return addedBy;}

	this.setTags = function(tagsJSON_) {
		tags.clear();
		for (var i=0; i<tagsJSON_.length; i++)
		{
			tags.push(new Tag(tagsJSON_[i]));
		}
	}
	
	this.addTag = function(tag) { 
		tags.push(new Tag(tag)); 
	}
	
	this.setSlots = function(slotsJSON_) {
		slots.clear();
		for (var i=0; i<slotsJSON_.length; i++)
		{
			slots.push(slotsJSON_[i].friendcode);
		}
	}
	
	this.setEvents = function(eventsJSON_) {
		events.clear();
		for (var i=0; i<eventsJSON_.length; i++)
		{
			events.push(eventsJSON_[i].friendcode);
		}
	}

	this.setVotes = function(voteDataJSON_) {
		votes = voteDataJSON_.voteData[0].votes_number;
		userVote = voteDataJSON_.voteData[0].user_vote;
		popularity = voteDataJSON_.voteData[0].popularity;
	}
	
	this.getContract = function() { 
		for (i=0; i<capabilities.length; i++) {
			var capability = capabilities[i];
			
			if (capability['name'].toLowerCase() == 'contratable') {
				return capability['contract'];
			}
		}
		
		return null;
	}

	this.getTags = function() { return tags;}
	this.getSlots = function() { return slots;}
	this.getEvents = function() { return events;}
	this.getVotes = function() {return votes;}
	this.getUserVote = function() {return userVote;}
	this.getPopularity = function() {return popularity;}
	this.getCapabilities = function() {return capabilities; } 

	// Parsing JSON Resource
	// Constructing the structure

	vendor = resourceJSON_.vendor;
	name = resourceJSON_.name;
	displayName = resourceJSON_.displayName;
	version = resourceJSON_.version;
	id = resourceJSON_.id;
	allVersions = resourceJSON_.versions;
	description = resourceJSON_.description;
	uriImage = resourceJSON_.uriImage;
	uriWiki = resourceJSON_.uriWiki;
	if (resourceJSON_.mashupId && resourceJSON_.mashupId!="")
		mashupId = resourceJSON_.mashupId;
	addedBy = resourceJSON_.added_by_user;
	uriTemplate = resourceJSON_.uriTemplate;
	this.setEvents(resourceJSON_.events);
	this.setSlots(resourceJSON_.slots);
	this.setTags(resourceJSON_.tags);
	votes = resourceJSON_.votes[0].votes_number;
	userVote = resourceJSON_.votes[0].user_vote;
	popularity = resourceJSON_.votes[0].popularity;	
	capabilities = resourceJSON_.capabilities;
}
