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
function Theme(name, baseTheme, callback) {
	this.loaded = false;

	this.name = name;
	this._themeURL = "/ezweb/themes/" + name;

	this._callback = callback;
	if (baseTheme)
		this._iconMapping = Object.clone(baseTheme._iconMapping);
	else
		this._iconMapping = new Object();

	this._imagesToPreload = [];

	// Internal function for theme loading
	var _notifyLoaded = function (transport) {
		var themeDesc = transport.responseText;
		try {
			themeDesc = JSON.parse(themeDesc);
		} catch (e) {
			var msg = gettext("Theme description \"%(themeName)s\" could not be loaded.");
			msg = interpolate(msg, {themeName: this.name}, true);
			if (this._callback) this._callback(this, msg);
			return;
		}

		// Retreive custom theme icons
		if (themeDesc.icons) {
			var icons = themeDesc.icons;
		} else {
			var icons = {};
		}

		for (var iconId in icons)
			// Transform to an absolute URL
			this._iconMapping[iconId] = this.getResource('/images/' + icons[iconId]);


		// Retreive the list of extra images to preload
		if (themeDesc.imagesToPreload) {
			this._imagesToPreload = themeDesc.imagesToPreload;
		}

		this.loaded = true;
		if (this._callback) this._callback(this, null);
	}.bind(this);

	var _notifyError = function (response, e) {
		var logManager = LogManagerFactory.getInstance();
		var msg = logManager.formatError("%(errorMsg)s", response, e);

		if (this._callback) this._callback(this, msg);
	}.bind(this);

	new Ajax.Request(this.getResource('/theme.json'), {
		method: 'get',
		onSuccess: _notifyLoaded,
		onFailure: _notifyError
	});
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

Theme.prototype._appendStyle = function(url) {
	// Create the Script Object
	var style = document.createElement('link');
	style.setAttribute("rel", "stylesheet");
	style.setAttribute("type", "text/css");
	//style.setAttribute("media", "screen,projection");
	style.setAttribute("href", url);

	// Insert the created object to the html head element
	var head = document.getElementsByTagName('head').item(0);
	head.appendChild(style);
}

Theme.prototype._removeStyle = function(url) {
	var styleEntry = $$('link[type="text/css"][href="' + url +'"]');
	if (styleEntry.length !== 1)
		return;

	styleEntry = styleEntry[0];
	styleEntry.parentNode.removeChild(styleEntry);
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

Theme.prototype.applyStyle = function() {
	if (_ONLY_ONE_CSS_FILE === false) {
		this._appendStyle(this.getResource('/css/ezweb.css'));
		this._appendStyle(this.getResource('/css/wiring.css'));
		this._appendStyle(this.getResource('/css/catalogue.css'));
		this._appendStyle(this.getResource('/css/dragboard.css'));
		if (BrowserUtilsFactory.getInstance().isIE())
			this._appendStyle(this.getResource('/css/ie.css'));
	} else {
		this._appendStyle(this.getResource('/css/ezweb_theme_' + _EzWeb_RELEASE + '.css'));
	}
}

Theme.prototype.deapplyStyle = function() {
	if (_ONLY_ONE_CSS_FILE === false) {
		this._removeStyle(this.getResource('/css/ezweb.css'));
		this._removeStyle(this.getResource('/css/wiring.css'));
		this._removeStyle(this.getResource('/css/catalogue.css'));
		this._removeStyle(this.getResource('/css/dragboard.css'));
		if (BrowserUtilsFactory.getInstance().isIE())
			this._removeStyle(this.getResource('/css/ie.css'));
	} else {
		this._removeStyle(this.getResource('/css/ezweb_theme_' + _EzWeb_RELEASE + '.css'));
	}
}
