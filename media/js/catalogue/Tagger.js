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


function Tagger(){
	
	var _this = this;
	var tags  = $H();
	var new_tag_id = 0;
	
	this.addTag = function(tag_) {
		if (tag_.length < 3) {
			$("tag_alert").style.display="block";
			UIUtils.getError($("tag_alert"),gettext ("Tags must have at least three characters."));
			//may make the info_resource container higher
			UIUtils.setInfoResourceHeight();
		}
		else {
			if (!containsTag(tag_)) {
				var id = 'new_tag_' + new_tag_id;
				new_tag_id++;
				tags[id] = tag_;
				paintTag(id, tag_);
				$("tag_alert").style.display='none';
			}
		}
	}
	
	this.addGlobalTag = function(tag_) {
		if (!containsTag(tag_)) {
			var id = 'new_tag_' + tags.keys().length;
			tags[id] = tag_;
		}
	}

	this.getTags = function(){
		return tags;
	}

	this.removeTag = function(id_) { 
		tags.remove(id_);
		eraserTag(id_);
	}
	
	this.removeAll = function() {
		tags = $H();
		new_tag_id = 0;
		if(!UIUtils.tagmode)eraserAll();
	}

	this.sendTags = function(url, resourceURI, resource)
	{
		if (tags.keys().length>0)
		{
			var onError = function(transport) {
				var msg = interpolate(gettext("Error sending tags: %(errorMsg)s."), {errorMsg: transport.status}, true);
				LogManagerFactory.getInstance().log(msg);
				// Process
			}
			
			var loadTags = function(transport) {
				var responseJSON = transport.responseText;
				var jsonResourceList = eval ('(' + responseJSON + ')');
				resource.setTags(jsonResourceList.tagList);
				
				if (!UIUtils.repaintCatalogue) 
					resource.updateTags();
				if (UIUtils.tagmode) 
					CatalogueFactory.getInstance().updateGlobalTags();
			}
			
			var elements = tags.values();
			var xmlDoc;
			if (window.ActiveXObject)
				xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			else if (document.implementation)
				xmlDoc = document.implementation.createDocument("","",null);
			var tagsXML = xmlDoc.createElement("Tags");
			xmlDoc.appendChild(tagsXML);
			for (var i=0; i<elements.length; i++)
			{
				var tagXML = xmlDoc.createElement("Tag");
				tagXML.appendChild(document.createTextNode(elements[i]));
				tagsXML.appendChild(tagXML);
			}
			var param = {tags_xml: (new XMLSerializer()).serializeToString(xmlDoc)};

			PersistenceEngineFactory.getInstance().send_post(url + resourceURI, param, this, loadTags, onError)
			_this.removeAll();
		}
	}
	
	this.removeTagUser = function(url, resourceURI,id)
	{
		var resource = CatalogueFactory.getInstance().getResource(id);

		var onError = function(transport) {
			var msg = interpolate(gettext("Error removing tag: %(errorMsg)s."), {errorMsg: transport.status}, true);
			LogManagerFactory.getInstance().log(msg);
			// Process
		}
		
		var loadTags = function(transport) {
			var responseJSON = transport.responseText;
			var jsonResourceList = eval ('(' + responseJSON + ')');
			resource.setTags(jsonResourceList.tagList);
			resource.updateTags();
			if (UIUtils.tagmode) 
				CatalogueFactory.getInstance().updateGlobalTags();
		}
		
		PersistenceEngineFactory.getInstance().send_delete(url + resourceURI, this, loadTags, onError);
	}

	var containsTag = function(tag_) {
		var values = tags.values();
		for (var i=0; i<values.length; i++){
			if (values[i] == tag_) {
				return true;
			}
		}
		return false;
	}
	
	var paintTag = function(id_, tag_) {
		var newTag = UIUtils.createHTMLElement("div", $H({ id: id_, class_name: "new_tag" }));
		newTag.observe("mouseover", function(event) {
			$("button_disable_" + id_).hide();
			$("button_enable_" + id_).show();
		});
		newTag.observe("mouseout", function(event) {
			$("button_enable_" + id_).hide();
			$("button_disable_" + id_).show();
		});
		var value = UIUtils.createHTMLElement("span", $H({ innerHTML: tag_ }));
		var disable = UIUtils.createHTMLElement("span", $H({ id: "button_disable_" + id_ }));
		var img_disable = UIUtils.createHTMLElement("img", $H({ src: '/ezweb/images/cancel_gray.png' }));
		disable.appendChild(img_disable);
		var enable = UIUtils.createHTMLElement("span",  $H({ id: "button_enable_" + id_ }));
		enable.hide();
		enable.observe("click", function(event) {
			UIUtils.removeTag(id_);
		});
		var img_enable = UIUtils.createHTMLElement("img", $H({ src: '/ezweb/images/delete.png' }));
		enable.appendChild(img_enable);
		var separator = UIUtils.createHTMLElement("span", $H({ innerHTML: "," }));
		newTag.appendChild(value);
		newTag.appendChild(disable);
		newTag.appendChild(enable);
		newTag.appendChild(separator);
		$("my_tags").insertBefore(newTag, $("new_tag_text"));
	}
	
	var eraserTag = function(id_) {
		if(!UIUtils.tagmode){
			var parentHTML = $("my_tags");
			var tagHTML = $(id_);
			parentHTML.removeChild(tagHTML);
		}
	}
	
	var eraserAll = function() {
		var parentHTML = $("my_tags");
		while(parentHTML.childNodes.length > 1)
		{
			parentHTML.removeChild(parentHTML.childNodes[0]);
		}
	} 
}
