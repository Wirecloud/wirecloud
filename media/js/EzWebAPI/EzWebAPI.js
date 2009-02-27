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


function _EzWebAPI() {
	this.platform = window.parent;

	// Get id from the URL
	var tmp = document.URL.split("?", 2)[1];
	tmp = tmp.split("#", 2)[0];
	tmp = tmp.split("&");
	for (var i = 0; i < tmp.length; i++) {
		var current = tmp[i];
		current = current.split("=", 2);
		if (current[0] = "id") {
			this.id = parseInt(current[1]);
			break;
		}
	}

    /*if (document.addEventListener) 
           document.addEventListener("DOMContentLoaded", this.addOnLoadNotifier, false);
    */
    // Prototype 1.6
    //Event.observe(document, "DOMContentLoaded", this.addOnLoadNotifier); //W3C and IE compliant
}

_EzWebAPI.prototype.addOnLoadNotifier = function() {
   // window.parent.Event.observe(window, 'load', function () {EzWebAPI.platform.opManager.igadgetLoaded(EzWebAPI.getId())}, true);	
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

_EzWebAPI.prototype.send_get = function(url, context, successHandler, errorHandler, requestHeaders) {
	var params = {url: url, method: 'GET'};
	

	successHandler.bind = EzWebAPI.platform.Function.prototype.bind;
	errorHandler.bind = EzWebAPI.platform.Function.prototype.bind;

	EzWebAPI.platform.PersistenceEngineFactory.getInstance().send_post(this.platform.URIs.PROXY, params, context, successHandler, errorHandler, requestHeaders);
}

_EzWebAPI.prototype.send_delete = function(url, context, successHandler, errorHandler) {
	var params = {url: url, method: 'DELETE'};

	successHandler.bind = EzWebAPI.platform.Function.prototype.bind;
	errorHandler.bind = EzWebAPI.platform.Function.prototype.bind;

	EzWebAPI.platform.PersistenceEngineFactory.getInstance().send_post(this.platform.URIs.PROXY, params, context, successHandler, errorHandler);
}

_EzWebAPI.prototype.send_post = function(url, parameters, context, successHandler, errorHandler, requestHeaders) {
	if (typeof(parameters)=="string")
		var p = parameters;
	else
		var p = this.platform.Object.toJSON(parameters);
	var params = {url: url, method: 'POST', params: p};

	successHandler.bind = EzWebAPI.platform.Function.prototype.bind;
	errorHandler.bind = EzWebAPI.platform.Function.prototype.bind;

	EzWebAPI.platform.PersistenceEngineFactory.getInstance().send_post(this.platform.URIs.PROXY, params, context, successHandler, errorHandler, requestHeaders);
}

_EzWebAPI.prototype.send_put = function(url, parameters, context, successHandler, errorHandler) {
	if (typeof(parameters)=="string")
		var p = parameters;
	else
		var p = this.platform.Object.toJSON(parameters);
	var params = {url: url, method: 'PUT', params: p};

	successHandler.bind = EzWebAPI.platform.Function.prototype.bind;
	errorHandler.bind = EzWebAPI.platform.Function.prototype.bind;

	EzWebAPI.platform.PersistenceEngineFactory.getInstance().send_post(this.platform.URIs.PROXY, params, context, successHandler, errorHandler);
}

_EzWebAPI.prototype.getConnection = function() {
    return Ajax.getTransport();
}

var EzWebAPI = new _EzWebAPI();


