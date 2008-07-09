  //////////////////////////////////////////////
  //                RESOURCE                  //
  //////////////////////////////////////////////

function Resource( id_, resourceJSON_, urlTemplate_) {
	
	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	
	this.getVendor = function() { return state.getVendor();}
	this.getName = function() { return state.getName();}
	this.getVersion = function() { return state.getVersion();}
	this.getAllVersions = function() { return state.getAllVersions();}
	this.getDescription = function() { return state.getDescription();}
	this.getUriImage = function() { return state.getUriImage();}
	this.getUriTemplate = function() { return state.getUriTemplate();}
	this.getUriWiki = function() { return state.getUriWiki();}
	this.getAddedBy = function() { return state.getAddedBy();}
	this.getTags = function() { return state.getTags();}
	this.setTags = function(tags_) { state.setTags(tags_);}
	this.getSlots = function() { return state.getSlots();}
	this.setSlots = function(slots_) { state.setSlots(slots_);}
	this.getEvents = function() { return state.getEvents();}
	this.setEvents = function(events_) { state.setEvents(events_);}
	this.getTagger = function() { return tagger;}
	this.setVotes = function(voteData_) {
		state.setVotes(voteData_);
		_rateResource();
	}
	this.getVotes = function() {return state.getVotes();}
	this.getUserVote = function() {return state.getUserVote();}
	this.getPopularity = function() {return state.getPopularity();}
	this.getSelectedVersion = function() {return versionSelected;}
	this.setSelectedVersion = function(version_) {versionSelected = version_;}
	
	this.paint = function(){
		var newResource = UIUtils.createHTMLElement("div", $H({
            id: id_
        }));
		$("resources").appendChild(newResource);
		var resource = UIUtils.createHTMLElement("div", $H({
            class_name: 'resource'
        }));
		resource.observe("mouseover", function(event){
            UIUtils.mouseOverResource(id_);
        });
		resource.observe("mouseout", function(event){
            UIUtils.mouseOutResource(id_);
        });
		newResource.appendChild(resource);
		// TOP
		resource.appendChild(UIUtils.createHTMLElement("div", $H({
            class_name: 'top'
        })));
		// TOOLBAR
		var toolbar = UIUtils.createHTMLElement("div", $H({
            class_name: 'toolbar'
        }));
		resource.appendChild(toolbar);
		var content_toolbar = UIUtils.createHTMLElement("div", $H({
            id: id_ + '_toolbar',
			style: 'display:none'
        }));
		toolbar.appendChild(content_toolbar);
		var wiki = UIUtils.createHTMLElement("a", $H({
            title: gettext ('Access to the wiki'),
			target: '_blank',
			href: state.getUriWiki()
        }));
		content_toolbar.appendChild(wiki);
		var wiki_img = UIUtils.createHTMLElement("img", $H({
            id: id_ + '_wiki_img',
			src: '/ezweb/images/wiki_gray.png'
        }));
		wiki_img.observe("mouseover", function(event){
			this.src = '/ezweb/images/wiki.png';
		});
		wiki_img.observe("mouseout", function(event){
			this.src = '/ezweb/images/wiki_gray.png';
		});
		wiki.appendChild(wiki_img);
		var template = UIUtils.createHTMLElement("a", $H({
            title: gettext ('Show template'),
			target: '_blank',
			href: state.getUriTemplate()
        }));
		content_toolbar.appendChild(template);
		var template_img = UIUtils.createHTMLElement("img", $H({
            id: id_ + '_template_img',
			src: '/ezweb/images/template_gray.png'
        }));
		template_img.observe("mouseover", function(event){
			this.src = '/ezweb/images/template.png';
		});
		template_img.observe("mouseout", function(event){
			this.src = '/ezweb/images/template_gray.png';
		});
		template.appendChild(template_img);
		if (state.getAddedBy() == 'Yes') {
			var deleteResource = UIUtils.createHTMLElement("a", $H({
				title: gettext('Delete gadget')
			}));
			deleteResource.observe("click", function(event){
				UIUtils.selectedResource = id;
				UIUtils.selectedVersion = null;
				LayoutManagerFactory.getInstance().showWindowMenu('deleteAllResourceVersions');
			});
			content_toolbar.appendChild(deleteResource);
			var delete_img = UIUtils.createHTMLElement("img", $H({
				id: id_ + '_delete_img',
				src: '/ezweb/images/cancel_gray.png'
			}));
			delete_img.observe("mouseover", function(event){
				this.src = '/ezweb/images/delete.png';
			});
			delete_img.observe("mouseout", function(event){
				this.src = '/ezweb/images/cancel_gray.png';
			});
			deleteResource.appendChild(delete_img);
		}
		// CONTENT
		var content = UIUtils.createHTMLElement("div", $H({
            class_name: 'content',
			id: id_ + '_content'
        }));
		resource.appendChild(content);
		content.appendChild(UIUtils.createHTMLElement("div", $H({
            class_name: 'title',
			innerHTML: state.getName()
        }))); 
		var image_div = UIUtils.createHTMLElement("div", $H({
            class_name: 'image'
        })); 
		content.appendChild(image_div);
		var image_link = UIUtils.createHTMLElement("a", $H({
            title: gettext('Show resource details')
        }));
		image_link.observe("click", function(event){
			UIUtils.sendPendingTags();
			UIUtils.clickOnResource(id_);
		});
		image_div.appendChild(image_link);
		var image = UIUtils.createHTMLElement("img", $H({
			id: id_ + '_img',
            src: state.getUriImage()
        }));
		image.observe("error", function(event){
			this.src = '/ezweb/images/not_available.jpg';
		});
		image.observe("abort", function(event){
			this.src = '/ezweb/images/not_available.jpg';
		});
		image_link.appendChild(image);
		var tags = UIUtils.createHTMLElement("div", $H({
            class_name: 'tags'
        })); 
		content.appendChild(tags);
		var important_tags = UIUtils.createHTMLElement("div", $H({
            id: id_ + '_important_tags',
			class_name: 'important_tags'
        })); 
		tags.appendChild(important_tags);
		_tagsToMoreImportantTags(important_tags, 3);
		var button = UIUtils.createHTMLElement("button", $H({
            innerHTML: gettext('Add Instance')
        })); 
		button.observe("click", function(event){
			CatalogueFactory.getInstance().addResourceToShowCase(id_);
		});
		content.appendChild(button);
		// BOTTOM
		var bottom = UIUtils.createHTMLElement("div", $H({
			id: id_ + '_bottom',
            class_name: 'bottom'
        }));
		resource.appendChild(bottom);
	}
	
	this.showInfo = function() {
		$("info_resource_content").innerHTML = '';
		$("info_resource_content").appendChild(UIUtils.createHTMLElement("div", $H({ 
			class_name: 'title_fieldset',
			innerHTML: gettext('Resource details')
		})));
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
			innerHTML: state.getName()
		})));
		title.appendChild(UIUtils.createHTMLElement("span", $H({ 
			class_name: 'version',
			innerHTML: state.getVersion()
		})));
		fieldset.appendChild(UIUtils.createHTMLElement("div", $H({ 
			class_name: 'vendor',
			innerHTML: state.getVendor()
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
		rating.appendChild(UIUtils.createHTMLElement("span", $H({ 
			id: 'votes'
		})));
		var image = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'image'
		}));
		fieldset.appendChild(image);
		image.appendChild(UIUtils.createHTMLElement("img", $H({ 
			src: state.getUriImage(),
			alt: state.getName()+ ' ' + state.getVersion()
		})));
		var description = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'description'
		}));
		fieldset.appendChild(description);
		description.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: gettext('Description') + ':'
		})));
		description.appendChild(UIUtils.createHTMLElement("div", $H({ 
			class_name: 'text',
			innerHTML: state.getDescription()
		})));
		var connect = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'connect'
		}));
		fieldset.appendChild(connect);
		connect.appendChild(UIUtils.createHTMLElement("span", $H({ 
			innerHTML: gettext('Gadget connectivity') + ':'
		})));
		var connect_text = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'text'
		}));
		connect.appendChild(connect_text);
		var events = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'events'
		}));
		connect_text.appendChild(events);
		events.appendChild(UIUtils.createHTMLElement("img", $H({
			title: gettext('All compatible gadgets by events are highlighted in this color'),
			src: '/ezweb/images/resource_compatible_event.png'
		})));
		if (state.getEvents().length != 0)
		{
			var events_link = UIUtils.createHTMLElement("a",$H({
				class_name: 'submit_link',
				title: gettext('Search by all compatible events'),
				innerHTML: gettext('Events') + ':'
			}));
			events_link.observe("click", function(event){
				UIUtils.searchByConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, 'connectEvent', state.getEvents().join(" "));
			});
			events.appendChild(events_link);
		} else {
			events.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: gettext('Events') + ': '
			})));
		}
		_events(events);
		var slots = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'slots'
		}));
		connect_text.appendChild(slots);
		slots.appendChild(UIUtils.createHTMLElement("img", $H({
			title: gettext('All compatible gadgets by slots are highlighted in this color'),
			src: '/ezweb/images/resource_compatible_slot.png'
		})));
		if (state.getSlots().length != 0)
		{
			var slots_link = UIUtils.createHTMLElement("a",$H({
				class_name: 'submit_link',
				title: gettext('Search by all compatible slots'),
				innerHTML: gettext('Slots') + ':'
			}));
			slots_link.observe("click", function(event){
				UIUtils.searchByConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, 'connectSlot', state.getSlots().join(" "));
			});
			slots.appendChild(slots_link);
		} else {
			slots.appendChild(UIUtils.createHTMLElement("span", $H({ 
				innerHTML: gettext('Slots') + ': '
			})));
		}
		_slots(slots);
		if (state.getSlots().length != 0 || state.getEvents().length != 0) {
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
				UIUtils.searchByGlobalConnectivity(URIs.GET_RESOURCES_SIMPLE_SEARCH, state.getEvents().join(" "), state.getSlots().join(" "));
			});
			search_events_slots_div.appendChild(search_events_slots_link);
		}
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
		_addVersionsToPanel (version_panel);
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
		show_versions_link.observe("click", function(event){
			CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).showVersionPanel();
		});
		show_versions_div.appendChild(show_versions_link);
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
		});
		tag_links.appendChild(my_tags);
		var others_tags = UIUtils.createHTMLElement("a", $H({ 
			innerHTML: gettext('Others tags')
		}));
		others_tags.observe("click", function(event){
			CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("others");
		});
		tag_links.appendChild(others_tags);
		var tags = UIUtils.createHTMLElement("div", $H({ 
			class_name: 'tags',
			id: id_ + '_tagcloud'
		}));
		tagcloud.appendChild(tags);
		_tagsToTagcloud(tags, 'description');
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
		var new_tag_text_input = UIUtils.createHTMLElement("input", $H({
			id: 'new_tag_text_input',
			type: 'text',
			maxlength: '20'
		}));
		new_tag_text_input.observe("keyup", function(event){
			UIUtils.enlargeInput(this);
		});
		new_tag_text_input.observe("keypress", function(event){
			UIUtils.onReturn(event,UIUtils.addTag,this);
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
		var link_delete = UIUtils.createHTMLElement("a", $H({
			class_name: 'submit_link',
			innerHTML: gettext('Delete all')
		}));
		link_delete.observe("click", function(event){
			UIUtils.removeAllTags();
		});
		buttons.appendChild(link_delete);
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
		});
		add_tags_link.appendChild(add_tags_submit_link);
		var access_wiki_link = UIUtils.createHTMLElement("div", $H({
			id: 'access_wiki_link',
			class_name: 'link'
		}));
		fieldset.appendChild(access_wiki_link);
		var access_wiki_submit_link = UIUtils.createHTMLElement("a", $H({
			class_name: 'submit_link',
			href: state.getUriWiki(),
			target: '_blank',
			innerHTML: gettext('Access to the Wiki')
		}));
		access_wiki_link.appendChild(access_wiki_submit_link);
		var access_template_link = UIUtils.createHTMLElement("div", $H({
			id: 'access_template_link',
			class_name: 'link'
		}));
		fieldset.appendChild(access_template_link);
		var access_template_submit_link = UIUtils.createHTMLElement("a", $H({
			class_name: 'submit_link',
			href: state.getUriTemplate(),
			target: '_blank',
			innerHTML: gettext('Access to the Template')
		}));
		access_template_link.appendChild(access_template_submit_link);
		var update_code_link = UIUtils.createHTMLElement("div", $H({
			id: 'update_code_link',
			class_name: 'link'
		}));
		fieldset.appendChild(update_code_link);
		var update_code_submit_link = UIUtils.createHTMLElement("a", $H({
			class_name: 'submit_link',
			innerHTML: gettext('Update gadget code')
		}));
		update_code_submit_link.observe("click", function(event){
			UIUtils.updateGadgetXHTML();
		});
		update_code_link.appendChild(update_code_submit_link);
		var delete_gadget_link = UIUtils.createHTMLElement("div", $H({
			id: 'delete_gadget_link',
			class_name: 'link'
		}));
		fieldset.appendChild(delete_gadget_link);
		_deleteGadget(delete_gadget_link);
		var add_gadget_button = UIUtils.createHTMLElement("button", $H({
			id: 'add_gadget_button',
			class_name: 'add_gadget_button',
			style: 'text-align:center;',
			innerHTML: gettext('Add Instance')
		}));
		add_gadget_button.observe("click", function(event){
			CatalogueFactory.getInstance().addResourceToShowCase(UIUtils.getSelectedResource());
		});
		$("info_resource_content").appendChild(add_gadget_button);
		$("info_resource_content").appendChild(UIUtils.createHTMLElement("div", $H({
			id: 'content_bottom_margin'
		})));
		$("info_resource_content").appendChild(UIUtils.createHTMLElement("div", $H({
			class_name: 'bottom'
		})));
		_rateResource();
	}

	this.updateTags = function()
	{
		_tagsToMoreImportantTags($(id + "_important_tags"), 3);
		if ((id == UIUtils.selectedResource) &&  ($(id + "_tagcloud") != null))
		{
			_tagsToTagcloud($(id + "_tagcloud"), 'description' , {tags:'mytags'});
		}
	}

	this.changeTagcloud = function(type){
		var option = {};
		$("view_tags_links").innerHTML = "";
		option = {tags: type};
		switch(type){
			case "mytags":
				var all_tags = UIUtils.createHTMLElement("a", $H({
					innerHTML: gettext('All tags')
				}));
				all_tags.observe("click", function(event){
					CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("all");
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
				});
				$("view_tags_links").appendChild(all_tags);
				var my_tags = UIUtils.createHTMLElement("a", $H({
					innerHTML: gettext('My tags')
				}));
				my_tags.observe("click", function(event){
					CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("mytags");
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
				});
				$("view_tags_links").appendChild(my_tags);
				var others_tags = UIUtils.createHTMLElement("a", $H({
					innerHTML: gettext('Others tags')
				}));
				others_tags.observe("click", function(event){
					CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).changeTagcloud("others");
				});
				$("view_tags_links").appendChild(others_tags);
				UIUtils.show("add_tags_link");
				UIUtils.hidde("add_tags_panel");
		}
		if ($(id + '_tagcloud'))
		{
			_tagsToTagcloud($(id + '_tagcloud'), 'description', option);
		}
	}

	this.showVersionPanel = function(){
		if ($("version_panel").style.display == 'none'){
			$("version_panel").style.display = 'block';
			$("view_versions_link").innerHTML = gettext('Hide all versions'); 
		}else{
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
	
	var _tagsToMoreImportantTags = function(parent, tagsNumber_){
		var tagsHTML = '';
		var tagsAux = state.getTags();
		var moreImportantTags = [];
		
		var tagNumber = Math.min(tagsNumber_, tagsAux.length);
		for (var i=0; i<tagNumber; i++){
			var firstTag = _getFirstTagNonRepeat(tagsAux, moreImportantTags);
			if (firstTag){
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
		for (var i=0; i<moreImportantTags.length; i++)
		{
			parent.appendChild(moreImportantTags[i].tagToHTML())
			if (i<(((moreImportantTags.length>tagsNumber_)?tagsNumber_:moreImportantTags.length)-1)){
				parent.appendChild(UIUtils.createHTMLElement("span", $H({
            		innerHTML: ', '
        		})));
			}
		}
	}

	var _events = function(parent){
		parent.innerHMTL = '';
		var eventsAux = state.getEvents();
		
		for (var i=0; i<eventsAux.length; i++)
		{
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
	
	var _addVersionsToPanel = function (parent){
		
		var sortByMin = function (a, b){
			var x = parseFloat(a);
			var y = parseFloat(b);
			return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		} 
		parent.innerHMTL = '';
		var versions = state.getAllVersions().sort(sortByMin);
		for (var i=0; i<versions.length; i++){
			var ver_element = UIUtils.createHTMLElement("span", $H({ 
			}));
			parent.appendChild(ver_element);
			if (versions[i] == state.getVersion()){
				ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
					innerHTML: 'v' + versions[i]
				})));					
			}else{
				var ver_link = UIUtils.createHTMLElement("a", $H({ 
					title: gettext('Selet this version as preferred version'),
					innerHTML: 'v' + versions[i]
				}));
				ver_link.observe("click", function(event){
					UIUtils.selectedVersion = event.currentTarget.innerHTML.substring(1);
					UIUtils.setPreferredGadgetVersion(UIUtils.selectedVersion);
				});
				ver_element.appendChild(ver_link);
			}
			if (state.getAddedBy() == 'Yes') {
				ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
					innerHTML: " "
				})));
				var delete_img = UIUtils.createHTMLElement("img", $H({
					title: gettext('Delete this version of the gadget'),
					id: "deleteIcon_v" + versions[i],
					src: '/ezweb/images/cancel_gray.png',
					style: 'border:none;',
					name: versions[i]
				}));
				delete_img.observe("click", function(event){
					UIUtils.selectedVersion = event.currentTarget.getAttribute('name')
					LayoutManagerFactory.getInstance().showWindowMenu('deleteAllResourceVersions');
				});
				delete_img.observe("mouseover", function(event){
					this.src='/ezweb/images/delete.png';
				});
				delete_img.observe("mouseout", function(event){
					this.src='/ezweb/images/cancel_gray.png';
				});
				ver_element.appendChild(delete_img);
				ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
					innerHTML: " "
				})));
			}else{
				ver_element.appendChild(UIUtils.createHTMLElement("span", $H({ 
					innerHTML: ((i<(versions.length-1))?", ":"")
				})));
			}
		}
	}
	
	var _deleteGadget = function(parent){
		var addedBy = state.getAddedBy();
		parent.innerHTML = '';
		if (addedBy == 'Yes'){
			var submit_link = UIUtils.createHTMLElement("a", $H({
				class_name: 'submit_link',
				innerHTML: gettext('Delete gadget')
			}));
			submit_link.observe("click", function(event){
				UIUtils.deleteGadget(id);
			});
			parent.appendChild(submit_link);
    	}
	}
	
	var _slots = function(parent){
		parent.innerHMTL = '';
		var slotsAux = state.getSlots();
		
		for (var i=0; i<slotsAux.length; i++)
		{
			var tag = UIUtils.createHTMLElement("span", $H({ 
				class_name: 'multiple_size_tag'
			}));
			parent.appendChild(tag);
			var tag_link = UIUtils.createHTMLElement("a", $H({ 
				title: gettext('Search by ') + slotsAux[i],
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

	var _tagsToTagcloud = function(parent, loc){
		parent.innerHTML = "";
		var tagsAux = state.getTags();
		var option = arguments[2] || {tags:'all'};
			
		switch(option.tags) {
			case 'all':
				for (var i=0; i<tagsAux.length; i++) {
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
					if (tagsAux[i].getAdded_by() == 'Yes')
					{
						tags[j] = tagsAux[i];
						j++;
					}
				}
				for (var i=0; i<tags.length; i++) {
					var tag = UIUtils.createHTMLElement("span", $H({ 
						class_name: 'multiple_size_tag'
					}));
					tag.appendChild(tags[i].tagToTypedHTML(option));
					var tag_link = UIUtils.createHTMLElement("a", $H({ 
						title: gettext('Delete tag')
					}));
					tag_link.observe("click", function(event){
						UIUtils.removeTagUser(this.parentNode.firstChild.innerHTML, id);
					});
					tag.appendChild(tag_link);
					var tag_img = UIUtils.createHTMLElement("img", $H({
						id: id + "_deleteIcon_" + i + "_" + loc,
						src: '/ezweb/images/cancel_gray.png',
						style: 'border:none;',
						name: 'op1'
					}));
					tag_img.observe("mouseover", function(event){
						this.src='/ezweb/images/delete.png';
					});
					tag_img.observe("mouseout", function(event){
						this.src='/ezweb/images/cancel_gray.png';
					});
					tag_link.appendChild(tag_img);
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
				for (var i=0; i<tagsAux.length; i++) {
					if (tagsAux[i].getAdded_by() == 'No' || tagsAux[i].getAppearances()>1)
					{
						tags[j] = tagsAux[i];
						j++;
					}
				}
				for (var i=0; i<tags.length; i++) {
					var tag = UIUtils.createHTMLElement("span", $H({ 
						class_name: 'multiple_size_tag'
					}));
					tag.appendChild(tags[i].tagToTypedHTML());
					tag.appendChild(UIUtils.createHTMLElement("span", $H({ 
						innerHTML: ((i<(tags.length-1))?",":"")
					})));
					parent.appendChild(tag);
				}
		}
	}

	var _rateResource = function()
	{
		var vote = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getUserVote();
		var popularity = CatalogueFactory.getInstance().getResource(UIUtils.selectedResource).getPopularity();
		if (vote!=0)
		{
			$("rateStatus").innerHTML = $("ratingSaved").innerHTML;
			for (var i = 1; i<=vote; i++)
			{
				$("_"+i).className = "on";
			}
		}
		if (popularity!=null)
		{
			var i = 1
			for (i; i<=popularity; i++)
			{
				$("res_"+i).className = "on";
			}
			if ((popularity%1)!=0)
			{
				$("res_"+i).className = "md";
				i++;
			}
			for (i; i<=5; i++)
			{
				$("res_"+i).className = "";
			}
		}
		$("votes").innerHTML = state.getVotes()+ " " + gettext ('votes');
	}


	var _createResource = function(urlTemplate_) {
		
		// ******************
		//  CALLBACK METHODS 
		// ******************
	
		// Not like the remaining methods. This is a callback function to process AJAX requests, so must be public.
		
		onError = function(transport) {
			msg = interpolate(gettext("Error creating the resource: %(errorMsg)s."), {errorMsg: transport.status}, true);
			LogManagerFactory.getInstance().log(msg);
			// Process
		}
		
		loadResource = function(transport) {
			var response = transport.responseXML;
			state = new ResourceState(response);
			this.paint();
		}
		
		var persistenceEngine = PersistenceEngineFactory.getInstance();
		// Post Resource to PersistenceEngine. Asyncrhonous call!
		persistenceEngine.send_post(url_Server, url_, this, loadResource, onError);
	}
	
	// *******************
	//  PRIVATE VARIABLES
	// *******************

	var state = null;
	var id = id_;
	var tagger = new Tagger();
	var versionSelected = null;
	
	if (urlTemplate_ != null) {
		_createResource(urlTemplate_);
	}
	else {
		state = new ResourceState(resourceJSON_);
		this.paint();
	}
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
	var version = null;
	var description = null;
	var uriImage = null;
	var uriWiki = null;
	var uriTemplate = null;
	var addedBy = null;
	var allVersions = [];
	var tags = [];
	var slots = [];
	var events = [];
	var votes = null;
	var popularity = null;
	var userVote = null;

	// ******************
	//  PUBLIC FUNCTIONS
	// ******************
	
	this.getVendor = function() { return vendor;}
	this.getName = function() { return name;}
	this.getVersion = function() { return version;}
	this.getAllVersions = function() { return allVersions;}
	this.getDescription = function() { return description;}
	this.getUriImage = function() { return uriImage;}
	this.getUriTemplate = function() { return uriTemplate;}
	this.getUriWiki = function() { return uriWiki;}
	this.getAddedBy = function() { return addedBy;}

	this.setTags = function(tagsJSON_) {
		tags.clear();
		for (var i=0; i<tagsJSON_.length; i++)
		{
			tags.push(new Tag(tagsJSON_[i]));
		}
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

	
	this.getTags = function() { return tags;}
	this.getSlots = function() { return slots;}
	this.getEvents = function() { return events;}
	this.getVotes = function() {return votes;}
	this.getUserVote = function() {return userVote;}
	this.getPopularity = function() {return popularity;}
	
	// Parsing JSON Resource
	// Constructing the structure
	
	vendor = resourceJSON_.vendor;
	name = resourceJSON_.name;
	version = resourceJSON_.version;
	allVersions = resourceJSON_.versions;
	description = resourceJSON_.description;
	uriImage = resourceJSON_.uriImage;
	uriWiki = resourceJSON_.uriWiki;
	addedBy = resourceJSON_.added_by_user;
	uriTemplate = resourceJSON_.uriTemplate;
	this.setEvents(resourceJSON_.events);
	this.setSlots(resourceJSON_.slots);
	this.setTags(resourceJSON_.tags);
	votes = resourceJSON_.votes[0].votes_number;
	userVote = resourceJSON_.votes[0].user_vote;
	popularity = resourceJSON_.votes[0].popularity;	

}