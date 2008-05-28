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


function Tagger(){
	
	var _this = this;
	var tags  = $H();
	
	this.addTag = function(tag_) {
		if (tag_.length < 3) {
			$("tag_alert").style.display="block";
			UIUtils.getError($("tag_alert"),gettext ("Tags must have at least three characters."));
		}
		else {
			if (!containsTag(tag_)) {
				var id = 'new_tag_' + tags.keys().length;
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
				resource.updateTags();
				if (UIUtils.tagmode) CatalogueFactory.getInstance().updateGlobalTags();
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
	
			PersistenceEngineFactory.getInstance().send_post(url + resourceURI, param, this, loadTags, onError);
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
			if (UIUtils.tagmode) CatalogueFactory.getInstance().updateGlobalTags();
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
