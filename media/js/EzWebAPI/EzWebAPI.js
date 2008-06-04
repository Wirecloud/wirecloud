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


function _EzWebAPI() {
	this.platform = window.parent;

	// Get id from the URL
	var tmp = document.URL.split("?");
	tmp = tmp[1].split("=");
	this.id = tmp[1];

    if (document.addEventListener) 
           document.addEventListener("DOMContentLoaded", this.addOnLoadNotifier, false);
    
    // Prototype 1.6
    //Event.observe(document, "DOMContentLoaded", this.addOnLoadNotifier); //W3C and IE compliant
}

_EzWebAPI.prototype.addOnLoadNotifier = function() {
    window.parent.Event.observe(window, 'load', function () {EzWebAPI.platform.opManager.igadgetLoaded()}, true);	
}


_EzWebAPI.prototype.getId = function() {
	return EzWebAPI.id;
}

_EzWebAPI.prototype.createRWGadgetVariable = function(name) {
	return new EzWebAPI.platform.RWGadgetVariable(EzWebAPI.id, name);
}

_EzWebAPI.prototype.createRGadgetVariable = function(name, handler) {
	return new EzWebAPI.platform.RGadgetVariable(EzWebAPI.id, name, handler);
}

_EzWebAPI.prototype.send_get = function(url, context, successHandler, errorHandler) {
	var params = {url: url, method: 'GET'};

	successHandler.bind = EzWebAPI.platform.Function.prototype.bind;
	errorHandler.bind = EzWebAPI.platform.Function.prototype.bind;

	EzWebAPI.platform.PersistenceEngineFactory.getInstance().send_post(this.platform.URIs.PROXY, params, context, successHandler, errorHandler);
}

_EzWebAPI.prototype.send_delete = function(url, context, successHandler, errorHandler) {
	var params = {url: url, method: 'DELETE'};

	successHandler.bind = EzWebAPI.platform.Function.prototype.bind;
	errorHandler.bind = EzWebAPI.platform.Function.prototype.bind;

	EzWebAPI.platform.PersistenceEngineFactory.getInstance().send_post(this.platform.URIs.PROXY, params, context, successHandler, errorHandler);
}

_EzWebAPI.prototype.send_post = function(url, parameters, context, successHandler, errorHandler) {
	var params = {url: url, method: 'POST', params: parameters};

	successHandler.bind = EzWebAPI.platform.Function.prototype.bind;
	errorHandler.bind = EzWebAPI.platform.Function.prototype.bind;

	EzWebAPI.platform.PersistenceEngineFactory.getInstance().send_post(this.platform.URIs.PROXY, params, context, successHandler, errorHandler);
}

_EzWebAPI.prototype.send_put = function(url, parameters, context, successHandler, errorHandler) {
	var params = {url: url, method: 'PUT', params: parameters};

	successHandler.bind = EzWebAPI.platform.Function.prototype.bind;
	errorHandler.bind = EzWebAPI.platform.Function.prototype.bind;

	EzWebAPI.platform.PersistenceEngineFactory.getInstance().send_post(this.platform.URIs.PROXY, params, context, successHandler, errorHandler);
}

_EzWebAPI.prototype.getConnection = function() {
    return Ajax.getTransport();
}

var EzWebAPI = new _EzWebAPI();


