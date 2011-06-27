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
    var ezwebLocation = this.platform.document.location;
    this.platform_domain = ezwebLocation.protocol + '//' + ezwebLocation.host;
    this.platform_protocol = ezwebLocation.protocol.substr(0, ezwebLocation.protocol.length - 1);
    this.platform_host = ezwebLocation.host;

    // Get id from the URL
    var tmp = document.URL.substr(document.URL.lastIndexOf('#'));
    tmp = tmp.split("&");
    for (var i = 0; i < tmp.length; i++) {
        var current = tmp[i];
        current = current.split("=", 2);
        if (current[0] == "id") {
            this.id = parseInt(current[1]);
            break;
        }
    }
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
	EzWebAPI._old_send('GET', url, null, context, successHandler, errorHandler, requestHeaders);
}

_EzWebAPI.prototype.send_delete = function(url, context, successHandler, errorHandler, requestHeaders) {
	EzWebAPI._old_send('DELETE', url, null, context, successHandler, errorHandler, requestHeaders);
}

_EzWebAPI.prototype.send_post = function(url, parameters, context, successHandler, errorHandler, requestHeaders) {
	EzWebAPI._old_send('POST', url, parameters, context, successHandler, errorHandler, requestHeaders);
}

_EzWebAPI.prototype.send_put = function(url, parameters, context, successHandler, errorHandler, requestHeaders) {
	EzWebAPI._old_send('PUT', url, parameters, context, successHandler, errorHandler, requestHeaders);
}

_EzWebAPI.prototype._old_send = function(method, url, parameters, context, successHandler, errorHandler, requestHeaders) {
	// Mixing onFailure and onException is a very bad idea, but it is the expected behabiour for this old API
	var options = {
		method: method,
		onSuccess: successHandler,
		onFailure: errorHandler,
		onException: errorHandler,
		parameters: parameters
	};

	EzWebAPI.send(url, context, options);
}

_EzWebAPI.prototype.buildProxyURL = function(url, options) {
    var final_url, protocolEnd, link, forceProxy, hostStart, pathStart, protocol,
        host, rest;

    forceProxy = options != null && !!options.forceProxy;

    if (url.length > 4 && url.indexOf('www.') === 0) {
        url = 'http://' + url;
    }

    protocol = this.platform_protocol;
    host = this.platform_host;

    protocolEnd = url.indexOf('://');
    if (protocolEnd !== -1) {
        hostStart = protocolEnd + 3;
        pathStart = url.indexOf('/', hostStart);
        if (pathStart === -1) {
            pathStart = url.length;
        }

        protocol = url.substr(0, protocolEnd);
        host = url.substr(hostStart, pathStart - hostStart);
        rest = url.substring(pathStart);
        final_url = url;
    } else {
        if (url.charAt(0) === '/') {
            rest = url;
        } else {
            rest = '/' + url;
        }

        if (!forceProxy) {
            final_url = EzWebAPI.platform_domain + rest;
        }
    }

    if (forceProxy || protocol !== this.platform_protocol || host !== this.platform_host) {
        final_url = this.platform_domain +
            this.platform.URIs.PROXY + '/' +
            encodeURIComponent(protocol) + '/' +
            encodeURIComponent(host) + rest;
    }

    return final_url;
}

_EzWebAPI.prototype.send = function(url, context, options) {
	if (context != null) {
		//Add the binding to each handler
		var handlerRegExp = new RegExp(/^on(?:Create|Complete|Exception|Failure|Interactive|Loaded|Loading|Success|Uninitialized|\d{3})$/);
		for (var index in options) {
			if (index.match(handlerRegExp) && options[index]) {
				options[index].bind = EzWebAPI.platform.Function.prototype.bind;
				options[index] = options[index].bind(context);
			}
		}
	}

	var final_url = EzWebAPI.buildProxyURL(url, options);
	return EzWebAPI.platform.PersistenceEngineFactory.getInstance().send(final_url, options);
}

_EzWebAPI.prototype.NO_LOG_MSG = 0;
_EzWebAPI.prototype.ERROR_MSG  = 1;
_EzWebAPI.prototype.WARN_MSG   = 2;
_EzWebAPI.prototype.INFO_MSG   = 3;

_EzWebAPI.prototype.log = function(msg, level) {
	EzWebAPI.platform.OpManagerFactory.getInstance().logIGadgetError(this.getId(), msg, level);
}

_EzWebAPI.prototype.getHTTPStatusCodeDescription = function(code) {
    var desc;

    desc = this.platform.Constants.HttpStatusDescription[code];
    if (!desc) {
        desc = this.platform.Constants.UnknownStatusCodeDescription;
    }
    return desc;
}

_EzWebAPI.prototype.drawAttention = function() {
    this.platform.OpManagerFactory.getInstance().drawAttention(this.getId());
};

var EzWebAPI = new _EzWebAPI();
