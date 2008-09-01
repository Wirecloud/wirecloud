/* 
 * MORFEO Project 
 * http://morfeo-project.org 
 * 
 * Component: EzWeb
 * 
 * (C) Copyright 2007-2008 Telefónica Investigación y Desarrollo 
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

/**
 * This class represents a instance of a Gadget.
 * @author aarranz
 */
function IGadget(gadget, iGadgetId, iGadgetCode, iGadgetName, dragboard) {
	this.id = iGadgetId;
	this.code = iGadgetCode;
	this.name = iGadgetName;
	this.gadget = gadget;
	
	this.dragboard = dragboard;
	this.iGadgetElement=$('mymw-content');
	this.iGadgetTabBar=$('mymw-nav');

}

/**
 * Returns the associated Gadget class.
 */
IGadget.prototype.getGadget = function() {
	return this.gadget;
}

/**
 * Return the Tab of the IGadget
 */
IGadget.prototype.getTab = function() {
	return this.dragboard.tab;
}

IGadget.prototype.getId = function() {
	return this.id;
}

IGadget.prototype.getVisibleName = function() {
	var visibleName = this.name;
	if (visibleName.length > 13)
		visibleName = visibleName.substring(0, 11)+"...";
	return visibleName;
}

/**
 * Paints the gadget instance
 * @param where HTML Element where the igadget will be painted
 */
IGadget.prototype.paint = function() {
	
	//Generate the related gadgets html
	var relatedhtml ="";
	var related = this.dragboard.workSpace.getRelatedIGadgets(this.id);
	if (related.length > 0){
		relatedhtml +='<div id="related_gadgets" class="related_gadgets">';
		for (i=0;i<related.length;i++){
			relatedhtml += '<div class="related_gadget_div" onclick="OpManagerFactory.getInstance().showRelatedIgadget('+related[i].id+','+related[i].dragboard.tab.tabInfo.id+')" >';
			relatedhtml += '<img id="related_'+related[i].getId()+'" class="related_gadget" src="'+related[i].getGadget().getIPhoneImageURI()+'" />';
			relatedhtml += '</div>';
		}
		relatedhtml +='</div>'
	}
	
	// Generate the Gadget html
	var html = '<div id="gadget_content" class="';
	if (related.length > 0)
			html += 'gadget_content">';
	else
		html +='gadget_content_full">';
	html += '<object onload=\'OpManagerFactory.getInstance().igadgetLoaded('+this.id+');\' class="gadget_object" type="text/html" data="'+this.gadget.getXHtml().getURICode()+'?id='+this.id+'" standby="Loading...">'; 
	html += '"Loading...."';
	html += '</object></div>';
	
	//create a new Tab and add the new content
	tab = new MYMW.ui.Tab ({
		id : this.getTabId(),
		label : this.getVisibleName(),
		content : html+relatedhtml				
		});
	this.dragboard.workSpace.tabView.addTab(tab);
	this.dragboard.workSpace.tabView.set('activeTab', tab);
}

IGadget.prototype.getTabId = function() {
	return "mymwtab_"+this.id;
}

/**
 * Saves the igadget into persistence. Used only for the first time, that is, for creating igadgets.
 */
IGadget.prototype.save = function() {
	function onSuccess(transport) {
		var igadgetInfo = eval ('(' + transport.responseText + ')');
		this.id = igadgetInfo['id'];
		this.dragboard.addIGadget(this, igadgetInfo);
	}

	function onError(transport, e) {
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

		msg = interpolate(gettext("Error adding igadget to persistence: %(errorMsg)s."), {errorMsg: msg}, true);
		LogManagerFactory.getInstance().log(msg);
	}
	
	if(this.dragboard.isLocked()){
		LayoutManagerFactory.getInstance().showMessageMenu(interpolate(gettext("The destination tab (%(tabName)s) is locked. Try to unlock it or select an unlocked tab."), {'tabName': this.dragboard.tab.tabInfo.name}, true));
		return;
	}

	var persistenceEngine = PersistenceEngineFactory.getInstance();
	var data = new Hash();
	data['left'] = this.position.x;
	data['top'] = this.position.y;
	data['width'] = this.contentWidth;
	data['height'] = this.contentHeight;
	data['code'] = this.code;
	data['name'] = this.name;
	
	var uri = URIs.POST_IGADGET.evaluate({tabId: this.dragboard.tabId, workspaceId: this.dragboard.workSpaceId});
	
	data['uri'] = uri;
	data['gadget'] = URIs.GET_GADGET.evaluate({vendor: this.gadget.getVendor(),
	                                           name: this.gadget.getName(),
	                                           version: this.gadget.getVersion()});
	data = {igadget: data.toJSON()};
	persistenceEngine.send_post(uri , data, this, onSuccess, onError);
}
