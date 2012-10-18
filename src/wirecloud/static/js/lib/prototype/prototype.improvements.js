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
 * Prototype Improvements v0.1
 *
 * Various additions to the prototype.js
 */

Prototype.BrowserFeatures.OnHashChangeEvent = 'onhashchange' in window;
if (window.navigator.vendor) {
    Prototype.Browser.Safari = window.navigator.vendor.indexOf('Apple') !== -1;
} else {
    Prototype.Browser.Safari = false;
}

Object.extend(Event, {
	KEY_SHIFT:    16,
	KEY_CONTROL:  17,
	KEY_CAPSLOCK: 20,
	KEY_SPACE: 32,
	keyPressed: function(event) {
		return Prototype.Browser.IE ? window.event.keyCode : event.which;
	}
});

Element.addMethods({
		
		triggerEvent : function(element, eventName){
		    if (document.createEvent)
		    {
		        var evt = document.createEvent('HTMLEvents');
		        evt.initEvent(eventName, true, true);
		
		        return element.dispatchEvent(evt);
		    }
		
		    if (element.fireEvent)
		        return element.fireEvent('on' + eventName);
		}
	});


Object.genGUID = function()
{
	var len = 8;
	if(!isNaN(parseInt(arguments[0]))) len = parseInt(arguments[0]);
	var chars = "abcdef0123456789";
	var output = "";
	while(output.length < len)
	{
		var rnd = Math.floor(Math.random() * (chars.length - 1));
		output += chars.charAt(rnd);
	}
	return output;
}

if ('textContent' in document.documentElement) {
	/**
	 * Changes the inner content of an Element treating it as pure text. If
	 * the provided text contains HTML special characters they will be encoded.
	 */
	Element.prototype.setTextContent = function(text) {
		this.textContent = text;
	}

	/**
	 * Return the inner content of an Element treating it as pure text. All
	 * encoded characters will be decoded.
	 */
	Element.prototype.getTextContent = function() {
		return this.textContent;
	}
} else if ('innerText' in document.documentElement) {
	Element.Methods.setTextContent = function(element, text) {
		element.innerText = text;
	}

	Element.Methods.getTextContent = function(element) {
		return element.innerText;
	}
}

if (Prototype.BrowserFeatures.ElementExtensions) {
	var isElement = function(el) {
		return el instanceof Element;
	}
} else {
	var isElement = function(el) {
		return el && ('nodeType' in el) && (el.nodeType === 1);
	}
}

//if (Prototype.Browser.IE || Element.prototype.getBoundingClientRect != undefined) {

if (document.documentElement.getBoundingClientRect != undefined) {
	Element.getRelativeBoundingClientRect = function(element1, element2) {
		var rect1 = element1.getBoundingClientRect();
		var rect2 = element2.getBoundingClientRect();
		return {
			top: rect1.top - rect2.top,
			left: rect1.left - rect2.left,
			right: rect1.right - rect2.left,
			bottom: rect1.bottom - rect2.top
		}
	}
} else if (document.getBoxObjectFor != undefined) {
	Element.getRelativeBoundingClientRect = function(element1, element2) {
		var box1 = document.getBoxObjectFor(element1);
		var box2 = document.getBoxObjectFor(element2);
		return {
			top: box1.screenY - box2.screenY,
			left: box1.screenX - box2.screenX,
			right: box1.screenX + box1.width - box2.screenX,
			bottom: box1.screenY + box1.height - box2.screenY
		}
	}
} else {
	// Unsupported browser
}

//    Hack for right HTTP verbs
Ajax.Request.prototype.request = function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = Object.isString(this.options.parameters) ?
          this.options.parameters :
          Object.toQueryString(this.options.parameters);

    if (!['get', 'post', 'put', 'delete'].include(this.method)) {
      params += (params ? '&' : '') + "_method=" + this.method;
      this.method = 'post';
    }

    if (params && this.method === 'get') {
      this.url += (this.url.include('?') ? '&' : '?') + params;
    }

    this.parameters = params.toQueryParams();

    try {
      var response = new Ajax.Response(this);
      if (this.options.onCreate) this.options.onCreate(response);
      Ajax.Responders.dispatch('onCreate', this, response);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      this.body = ['put', 'post'].include(this.method) ? (this.options.postBody || params) : null;
      this.transport.send(this.body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
}

Ajax.Request.prototype.success = function success() {
    var status = this.getStatus();
    return (status >= 200 && status < 300) || status == 304;
};

Ajax.Request.prototype.setRequestHeaders = function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (['post', 'put'].include(this.method)) {
        headers['Content-type'] = this.options.contentType +
            (this.options.encoding ? '; charset=' + this.options.encoding : '');

        /* Force "Connection: close" for older Mozilla browsers to work
         * around a bug where XMLHttpRequest sends an incorrect
         * Content-length header. See Mozilla Bugzilla #246651.
         */
        if (this.transport.overrideMimeType &&
            (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005) {
            headers['Connection'] = 'close';
        }
    }

    // user-defined headers
    if (typeof this.options.requestHeaders == 'object') {
        var extras = this.options.requestHeaders;

        if (typeof extras.push == 'function') {
            for (var i = 0, length = extras.length; i < length; i += 2) {
                headers[extras[i]] = extras[i+1];
            }
        } else {
            $H(extras).each(function(pair) { headers[pair.key] = pair.value });
        }
    }

    for (var name in headers) {
        this.transport.setRequestHeader(name, headers[name]);
    }
};

Ajax.Base.prototype.initialize = function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   '',
      evalJSON:     false,
      evalJS:       false
    };
    Object.extend(this.options, options || { });

    this.options.method = this.options.method.toLowerCase();

    if (Object.isHash(this.options.parameters))
      this.options.parameters = this.options.parameters.toObject();
};

/*
 * ARRAY EXTENSIONS
 */

Array.prototype.elementExists = function (element) {
	return this.indexOf(element) !== -1;
}

Array.prototype.getElementById = function (id) {
	for (var i = 0; i < this.length; i++) {
		if (this[i].getId() == id)
			return this[i];
	}
	return null;
}

Array.prototype.getElementByName = function (elementName) {
	for (var i = 0; i < this.length; i++) {
		if (this[i].getName() == elementName)
			return this[i];
	}
	return null;
}

Array.prototype.remove = function(element) {
	var index = this.indexOf(element);
	if (index != -1)
		this.splice(index, 1);
}

Array.prototype.removeById = function (id) {
	var element;
	var elementId;
	for (var i = 0; i < this.length; i++) {
		if (typeof this[i].getId == "function") {
			elementId = this[i].getId();
		} else {
			elementId = this[i].id;
		}

		if (elementId == id) {
			element = this[i];
			this.splice(i, 1);
			return element;
		}
	}
	return null;
}
