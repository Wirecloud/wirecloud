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

	// Internal function for theme loading
	var _notifyLoaded = function (transport) {
		var response = transport.responseText;
		try {
			var icons = eval ('(' + response + ')');
		} catch (e) {
			var msg = gettext("The icon catalogue for the \"%(themeName)s\" theme could not be loaded.");
			msg = interpolate(msg, {themeName: this.name}, true);
			LogManagerFactory.getInstance().log(msg);
			return;
		}

		for (var iconId in icons)
			// Transform to an absolute URL
			this._iconMapping[iconId] = this.getResource('/images/' + icons[iconId]);

		this.loaded = true;
		if (this._callback) this._callback(true);
	}.bind(this);

	var _notifyError = function (response) {
		if (this._callback) this._callback(false);
	}.bind(this);

	new Ajax.Request(this.getResource('/icons.json'), {
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

// TODO include this on the ezweb loading process
function initTheme(loaded) {
	if (loaded === false) {
		// TODO log eror
		return;
	}

	var _defaultTheme = _currentTheme;

	if (_INITIAL_THEME != 'default')
		_currentTheme = new Theme(_INITIAL_THEME, _defaultTheme);
}


_INITIAL_THEME = 'default';


// Default theme
var _currentTheme = new Theme('default', null, initTheme);
