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


/**
 * This class represents a Theme.
 */
function Theme() {

	this._themeURL = URIs.BASIC_THEME;

	this._iconMapping = new Object();

	this._imagesToPreload = [];

	// Retrieve custom theme icons

	if (theme_images) {
		var icons = theme_images.icons;
	} else {
		var icons = {};
	}
	
	for (var iconId in icons)
		// Transform to an absolute URL
		this._iconMapping[iconId] = this.getResource('/images/' + icons[iconId]);

	// Retrieve the list of extra images to preload
	if (theme_images.imagesToPreload) {
		this._imagesToPreload = theme_images.imagesToPreload;
	}

}

/**
 * Returns the base URL associated to root path for the resources of this theme
 */
Theme.prototype.getBaseURL = function() {
	return this._themeURL;
}

/**
 * Returns the URL for a resource given its relative path.
 *
 * @param {String} path relative path of the resource
 *
 * @return {String} absolute URL of the resource
 */
Theme.prototype.getResource = function(path) {
	return this._themeURL + path;
}

/**
 * @param {String} iconId
 */
Theme.prototype.iconExists = function(iconId) {
	return this._iconMapping[iconId] !== undefined;
}

/**
 * @param {String} iconId
 */
Theme.prototype.getIconURL = function(iconId) {
	if (this._iconMapping[iconId] === undefined) {
		var msg = gettext("There is not any icon identified by \"%(iconId)s\".");
		msg = interpolate(msg, {iconId: iconId}, true);
		LogManagerFactory.getInstance().log(msg, Constants.Logging.WARN_MSG);
	}

	return this._iconMapping[iconId];
}


Theme.prototype._countIcons = function() {
	if (this._iconCount != undefined)
		return;

	this._iconCount = 0;

	for (var iconId in this._iconMapping)
		this._iconCount++;
}

Theme.prototype.preloadImages = function(onFinishCallback) {
	LayoutManagerFactory.getInstance().logSubTask(gettext("Loading theme images"));

	this._countIcons();
	var loadedCount = this._iconCount + this._imagesToPreload.length;
	var totalCount = loadedCount;
	var imagesNotFound = new Array();

	var _incLoadedCount = function(e, error) {
		var target = this.target;

		loadedCount--;

		// Report
		if ((arguments.length == 2) && error) {
			var msg = gettext("%(current)s/%(total)s Error loading %(image)s");
			imagesNotFound.push(target.src);
		} else {
			var msg = gettext("%(current)s/%(total)s %(image)s");
		}
		msg = interpolate(msg,
			{
				current: totalCount - loadedCount,
				total: totalCount,
				image: target.src
			},
			true);
		LayoutManagerFactory.getInstance().logStep(msg, totalCount);

		// Check if we have finished
		if (loadedCount == 0)
			onFinishCallback(this.theme, imagesNotFound);
	}

	var _notifyError = function(e) {
		_incLoadedCount.call(this, e, true);
	}

	for (var iconId in this._iconMapping) {
		var img = document.createElement('img');
		Element.extend(img);
		var context = {theme: this, target: img};
		img.observe('load', _incLoadedCount.bind(context));
		img.observe('error', _notifyError.bind(context));
		img.observe('abort', _notifyError.bind(context));
		img.src = this._iconMapping[iconId];
	}

	for (var i = 0; i < this._imagesToPreload.length; i++) {
		var img = document.createElement('img');
		Element.extend(img);
		var context = {theme: this, target: img};
		img.observe('load', _incLoadedCount.bind(context));
		img.observe('error', _notifyError.bind(context));
		img.observe('abort', _notifyError.bind(context));
		img.src = this.getResource('/images/' + this._imagesToPreload[i]);
	}
}

/**
 * This class manages a Skin
 */
function SkinManager(){
	
	this.skinName = null;
	this._skinURL = null;
	
}

SkinManager.prototype._setSkin = function (name){
	this.skinName = name;
//	this._skinURL = "/css_generator/workspace/" + name;
	this._skinURL = URIs.SKIN + name;
}

SkinManager.prototype._appendStyle = function(url) {
	// Create the Script Object
	var style = document.createElement('link');
	style.setAttribute("rel", "stylesheet");
	style.setAttribute("type", "text/css");
	style.setAttribute("href", url);

	// Insert the created object to the html head element
	//var head = document.getElementsByTagName('head').item(0);
	document.body.appendChild(style);
}

SkinManager.prototype._removeStyle = function(url) {
	var styleEntry = $$('link[type="text/css"][href="' + url +'"]');
	if (styleEntry.length !== 1)
		return;

	styleEntry = styleEntry[0];
	styleEntry.parentNode.removeChild(styleEntry);
}


SkinManager.prototype.loadSkin = function(newSkin) {
			
	this._removeStyle(this._skinURL);

	this._setSkin(newSkin);

	this._appendStyle(this._skinURL);
								
	//wait for CSS application
	LayoutManagerFactory.getInstance()._notifyPlatformReady(false);
			
}

SkinManager.prototype.unloadSkin = function () {
	this._removeStyle(this._skinURL);
}

/**
 * This class manages the branding shown in a workspace or the catalogue
 **/
function BrandingManager(){
	this.logo_class = null;				//banner logo in normal mode
	this.viewer_logo_class = null;			//banner logo in viewer mode
}

/**
 * set or change the branding
 * @param {Object} branding
 */

BrandingManager.prototype.setBranding = function (branding){
	
	var elements = null;
	var element = null;
	
	var _setLink = function (element, link_url){
		
		if (!link_url) {
			//there is no branding link. Remove the onclick event
			element.onclick = null;
			element.removeClassName('clickable');
		}
		else {
			
			element.onclick = function(){
										window.open(link_url);
										};
			element.addClassName('clickable');
		}
		
	}
	
	if (branding['logo'])
		this.logo_class = branding['logo']['class'];
	if (branding['viewer_logo'])
		this.viewer_logo_class = branding['viewer_logo']['class'];
	
	//check if we are in the viewer or the normal view.
	elements = $$('.' + this.logo_class); 
	for (var i=0;i<elements.length;i++) {
		//normal mode
		//set the normal logo as background for both the wiring and workspace banners
		element = elements[i];
		Element.extend(element);
		element.setAttribute('src', branding['logo']['url']);
		
		//now, set the link to the url of the branding
		_setLink(element, branding['link']);
	
	}
	
	elements = $$('.' + this.viewer_logo_class);
	if (elements.length > 0) {
		//viewer mode
		
		//set the viewer logo as background (there is only one logo)
		element = elements[0];
		Element.extend(element);
		element.setAttribute('src', branding['viewer_logo']['url']);
		
		//now, set the link to the url of the branding
		_setLink(element, branding['link']);
	}
	
}
	