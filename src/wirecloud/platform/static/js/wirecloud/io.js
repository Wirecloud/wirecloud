/*
 *     Copyright 2012-2017 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals Wirecloud */


(function (utils) {

    "use strict";

    var HANDLER_RE = new RegExp(/^on(?:Complete|Exception|Failure|Success|UploadProgress|\d{3})$/);

    var setRequestHeaders = function setRequestHeaders() {
        var headers, name;

        headers = utils.merge({
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

    var onAbort = function onAbort(event) {
        event.stopPropagation();
        event.preventDefault();

        var response = new Response(this);
        Wirecloud.Task.prototype.abort.call(this, response);

        utils.callCallback(this.options.onAbort);
        if (this.options.onComplete) {
            try {
                this.options.onComplete(response);
            } catch (e) {
                utils.callCallback(this.options.onException, response, e);
            }
        }
    };

    var onReadyStateChange = function onReadyStateChange(handler, error) {
        var response = new Response(this);
        if (error) {
            handler(new io.ConnectionError(this));
        } else {
            handler(response);
        }

        try {
            if (('on' + response.status) in this.options) {
                this.options['on' + response.status](response);
            } else if (this.options.onSuccess && (response.status >= 200 && response.status < 300)) {
                this.options.onSuccess(response);
            } else if (this.options.onFailure && (response.status < 200 || response.status >= 300)) {
                this.options.onFailure(response);
            }
        } catch (e) {
            utils.callCallback(this.options.onException, response, e);
        }

        if (this.options.onComplete) {
            try {
                this.options.onComplete(response);
            } catch (e) {
                utils.callCallback(this.options.onException, response, e);
            }
        }

        return response;
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
        var key, query = [];

        if (parameters == null) {
            return null;
        } else if (typeof parameters === 'string') {
            parameters = parameters.trim();
            if (parameters !== '') {
                return parameters;
            } else {
                return null;
            }
        } else /* if (typeof parameters === 'object') */ {
            for (key in parameters) {
                if (typeof parameters[key] === 'undefined') {
                    continue;
                } else if (parameters[key] === null) {
                    query.push(encodeURIComponent(key) + '=');
                } else {
                    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key]));
                }
            }
        }

        if (query.length > 0) {
            return query.join('&');
        } else {
            return null;
        }
    };

    var Request = function Request(url, options) {
        var key;

        this.options = utils.merge({
            method: 'POST',
            asynchronous: true,
            responseType: null,
            contentType: null,
            encoding: null,
            postBody: null
        }, options);

        for (key in this.options) {
            if (HANDLER_RE.test(key) && this.options[key] != null && typeof this.options[key] !== 'function') {
                throw new TypeError(utils.interpolate('Invalid %(callback)s callback', {callback: key}, true));
            }
        }

        if (this.options.context != null) {
            for (key in this.options) {
                if (HANDLER_RE.test(key) && typeof this.options[key] === 'function') {
                    this.options[key] = this.options[key].bind(this.options.context);
                }
            }
        }

        Object.defineProperties(this, {
            method: {
                value: this.options.method.toUpperCase()
            }
        });

        if (['PUT', 'POST'].indexOf(this.method) !== -1 && this.options.postBody == null) {
            var parameters = toQueryString(this.options.parameters);
            if (parameters != null) {
                this.options.postBody = parameters;
                if (this.options.contentType == null) {
                    this.options.contentType = 'application/x-www-form-urlencoded';
                }
                if (this.options.encoding == null) {
                    this.options.encoding = 'UTF-8';
                }
            }
        }

        Object.defineProperties(this, {
            url: {
                value: url
            },
            abort: {
                value: function () {
                    this.transport.aborted = true;
                    this.transport.abort();
                    return this;
                }
            }
        });

        this.transport = new XMLHttpRequest();
        if (this.options.withCredentials === true && this.options.supportsAccessControl) {
            this.transport.withCredentials = true;
        }
        if (this.options.responseType) {
            this.transport.responseType = this.options.responseType;
        }
        this.transport.addEventListener('abort', onAbort.bind(this), true);
        if (typeof this.options.onUploadProgress === 'function') {
            this.transport.upload.addEventListener('progress', options.onUploadProgress, false);
        }

        Wirecloud.Task.call(this, "making request", function (resolve, reject, update) {
            this.transport.upload.addEventListener('progress', function (event) {
                var progress = Math.round(event.loaded * 100 / event.total);
                update(progress / 2);
            });
            this.transport.addEventListener("progress", function (event) {
                if (event.lengthComputable) {
                    var progress = Math.round(event.loaded * 100 / event.total);
                    update(50 + (progress / 2));
                }
            }.bind(this));
            this.transport.addEventListener("load", function () {
                onReadyStateChange.call(this, resolve);
            }.bind(this));
            this.transport.addEventListener("error", function () {
                onReadyStateChange.call(this, reject, true);
            }.bind(this));
        }.bind(this));

        this.transport.open(this.method, this.url, this.options.asynchronous);
        setRequestHeaders.call(this);
        this.transport.send(this.options.postBody);
    };
    utils.inherit(Request, Wirecloud.Task);

    var io = {};

    /**
     * Error raised if there are problems connecting to the server. Browsers
     * doesn't provide details about the connection problem due security
     * concerns, so this exception doesn't provide those details.
     *
     * @class
     * @extends Error
     * @name Wirecloud.io.ConnectionError
     * @summary Exception raised for connection problems.
     */
    io.ConnectionError = function ConnectionError() {
        this.name = 'ConnectionError';
        this.message = 'Connection Error';
    };

    io.ConnectionError.prototype = new Error();
    io.ConnectionError.prototype.constructor = io.ConnectionError;

    io.ConnectionError.prototype.toString = function toString() {
        return this.message;
    };

    io.buildProxyURL = function buildProxyURL(url, options) {
        var forceProxy, hash;

        options = utils.merge({
            method: 'POST',
            asynchronous: true,
            responseType: null,
            contentType: null,
            encoding: null,
            postBody: null
        }, options);

        if (!(url instanceof URL)) {
            url = new URL(url, Wirecloud.location.base);
        }

        forceProxy = !!options.forceProxy;
        if (["blob:", "data:"].indexOf(url.protocol) !== -1) {
            return url.toString();
        }

        hash = url.hash;
        url.hash = '';
        if (forceProxy || (options.supportsAccessControl !== true && url.origin !== Wirecloud.location.domain)) {
            url = new URL(
                Wirecloud.URLs.PROXY.evaluate({protocol: url.protocol.slice(0, -1), domain: url.host, path: url.pathname}) + url.search,
                Wirecloud.location.base
            ).toString();
        } else {
            url = url.toString();
        }

        // Add parameters
        if (['PUT', 'POST'].indexOf(options.method) === -1 || options.postBody != null) {
            var parameters = toQueryString(options.parameters);
            if (parameters != null) {
                if (url.indexOf('?') !== -1) {
                    url += '&' + parameters;
                }  else {
                    url += '?' + parameters;
                }
            }
        }

        return url + hash;
    };

    io.makeRequest = function makeRequest(url, options) {
        return new Request(Wirecloud.io.buildProxyURL(url, options), options);
    };

    Wirecloud.io = io;

})(Wirecloud.Utils);
