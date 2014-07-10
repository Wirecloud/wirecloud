/*
 *     Copyright 2012-2013 (c) CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/*global interpolate, Wirecloud*/

Wirecloud.location = {
    'domain': document.location.protocol + '//' + document.location.host,
    'protocol': document.location.protocol.substr(0, document.location.protocol.length - 1),
    'host': document.location.host
};

(function () {

    "use strict";

    var HANDLER_RE = new RegExp(/^on(?:Create|Complete|Exception|Failure|Interactive|Loaded|Loading|Success|Uninitialized|\d{3})$/);

    var setRequestHeaders = function setRequestHeaders() {
        var headers, name;

        headers = Wirecloud.Utils.merge({
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
        }, this.options.requestHeaders);

        if (!('Content-Type' in headers) && this.options.contentType != null) {
            headers['Content-Type'] = this.options.contentType;
            if (this.options.encoding != null) {
                headers['Content-Type'] += '; charset=' + this.options.encoding;
            }
        }

        for (name in headers) {
            if (headers[name] != null) {
                this.transport.setRequestHeader(name, headers[name]);
            }
        }
    };

    var onReadyStateChange = function onReadyStateChange() {
        if (this.transport.readyState == 4) {

            var response = new Response(this);

            try {
                if (('on' + response.status) in this.options) {
                    this.options['on' + response.status](response);
                } else if (this.options.onSuccess && (response.status >= 200 && response.status < 300)) {
                    this.options.onSuccess(response);
                } else if (this.options.onFailure && (response.status < 200 || response.status >= 300)) {
                    this.options.onFailure(response);
                }
            } catch (e) {
                if (this.options.onException) {
                    try {
                        this.options.onException(response, e);
                    } catch (e2) {}
                }
            }

            if (this.options.onComplete) {
                try {
                    this.options.onComplete(response);
                } catch (e) {
                    if (this.options.onException) {
                        try {
                            this.options.onException(response, e);
                        } catch (e2) {}
                    }
                }
            }
        }
    };

    var Response = function Response(request) {
        Object.defineProperties(this, {
            'request': {value: request},
            'transport': {value: request.transport},
            'status': {value: request.transport.status},
            'statusText': {value: request.transport.statusText},
            'response': {value: request.transport.response}
        });

        if (request.options.responseType == null || request.options.responseType === '') {
            Object.defineProperties(this, {
                'responseText': {value: request.transport.responseText},
                'responseXML': {value: request.transport.responseXML}
            });
        }
    };

    Response.prototype.getHeader = function getHeader(name) {
        try {
            return this.transport.getResponseHeader(name);
        } catch (e) { return null; }
    };

    Response.prototype.getAllResponseHeaders = function getAllResponseHeaders() {
        return this.transport.getAllResponseHeaders();
    };

    var toQueryString = function toQueryString(parameters) {
        var key, query = '';

        if (typeof parameters === 'string') {
            return parameters;
        }

        for (key in parameters) {
            query += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key]);
        }

        return query.substr(1);
    };

    var Request = function Request(url, options) {
        var key;

        this.url = url;
        this.options = Wirecloud.Utils.merge({
            method:       'POST',
            asynchronous: true,
            responseType: null,
            contentType:  null,
            encoding:     null,
            postBody:     null
        }, options);

        for (key in this.options) {
            if (HANDLER_RE.test(key) && this.options[key] != null && typeof this.options[key] !== 'function') {
                throw new TypeError(interpolate('Invalid %(callback)s callback', {callback: key}, true));
            }
        }
        this.method = this.options.method.toUpperCase();

        if (this.options.parameters != null && (typeof this.options.parameters === 'string' || typeof this.options.parameters === 'object')) {
            if (['PUT', 'POST'].indexOf(this.method) !== -1 && this.options.postBody == null) {
                this.options.postBody = toQueryString(this.options.parameters);
                if (this.options.contentType == null) {
                    this.options.contentType = 'application/x-www-form-urlencoded';
                }
                if (this.options.encoding == null) {
                    this.options.encoding = 'UTF-8';
                }
            } else {
                if (this.url.indexOf('?') !== -1) {
                    this.url += '&' + toQueryString(this.options.parameters);
                }  else {
                    this.url += '?' + toQueryString(this.options.parameters);
                }
            }
        }

        this.transport = new XMLHttpRequest();
        if (this.options.withCredentials === true && this.options.supportsAccessControl) {
            this.transport.withCredentials = true;
        }
        this.transport.open(this.options.method, this.url, this.options.asynchronous);
        if (this.options.responseType) {
            this.transport.responseType = this.options.responseType;
        }
        this.transport.addEventListener('readystatechange', onReadyStateChange.bind(this), true);
        if (typeof this.options.onUploadProgress === 'function') {
            this.transport.upload.addEventListener('progress', options.onUploadProgress, false);
        }
        setRequestHeaders.call(this);
        this.transport.send(this.options.postBody);
    };

    var io = {};

    io.buildProxyURL = function buildProxyURL(url, options) {
        var final_url, protocolEnd, link, forceProxy, hostStart, pathStart, protocol,
            host, rest;

        if (options == null) {
            options = {};
        }

        forceProxy = !!options.forceProxy;

        if (url.length > 4 && url.indexOf('www.') === 0) {
            url = 'http://' + url;
        }

        protocol = Wirecloud.location.protocol;
        host = Wirecloud.location.host;

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
                final_url = Wirecloud.location.domain + rest;
            }
        }

        if (forceProxy || (options.supportsAccessControl !== true && (protocol !== Wirecloud.location.protocol || host !== Wirecloud.location.host))) {
            final_url = Wirecloud.location.domain +
                Wirecloud.URLs.PROXY.evaluate({protocol: protocol, domain: host, path: rest});
        }

        return final_url;
    };

    io.makeRequest = function makeRequest(url, options) {
        var key;

        if (options != null && options.context != null) {
            for (key in options) {
                if (HANDLER_RE.test(key) && typeof options[key] === 'function') {
                    options[key] = options[key].bind(options.context);
                }
            }
        }

        return new Request(Wirecloud.io.buildProxyURL(url, options), options);
    };

    Wirecloud.io = io;

})();
