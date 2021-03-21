/*
 *     Copyright 2012-2017 (c) CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020-2021 Future Internet Consulting and Development Solutions S.L.
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

    const HANDLER_RE = new RegExp(/^on(?:Complete|Exception|Failure|Success|UploadProgress|\d{3})$/);

    const setRequestHeaders = function setRequestHeaders() {
        const headers = utils.merge({
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
        }, this.options.requestHeaders);

        if (!('Content-Type' in headers) && this.options.contentType != null) {
            headers['Content-Type'] = this.options.contentType;
            if (this.options.encoding != null) {
                headers['Content-Type'] += '; charset=' + this.options.encoding;
            }
        }

        for (const name in headers) {
            if (headers[name] != null) {
                this.transport.setRequestHeader(name, headers[name]);
            }
        }
    };

    const onAbort = function onAbort(event) {
        event.stopPropagation();
        event.preventDefault();

        const response = new Response(this);
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

    const onReadyStateChange = function onReadyStateChange(handler, error) {
        const response = new Response(this);
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

    const Response = class Response {

        constructor(request) {
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
        }

        getHeader(name) {
            try {
                return this.transport.getResponseHeader(name);
            } catch (e) { return null; }
        }

        getAllResponseHeaders() {
            return this.transport.getAllResponseHeaders();
        }

    }

    const toQueryString = function toQueryString(parameters) {
        const query = [];

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
            for (const key in parameters) {
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

    const Request = class Request extends Wirecloud.Task {

        constructor(url, options) {
            options = utils.merge({
                method: 'POST',
                asynchronous: true,
                responseType: null,
                contentType: null,
                encoding: null,
                postBody: null
            }, options);

            for (const key in options) {
                if (HANDLER_RE.test(key) && options[key] != null && typeof options[key] !== 'function') {
                    throw new TypeError(utils.interpolate('Invalid %(callback)s callback', {callback: key}, true));
                }
            }

            if (options.context != null) {
                for (const key in options) {
                    if (HANDLER_RE.test(key) && typeof options[key] === 'function') {
                        options[key] = options[key].bind(options.context);
                    }
                }
            }

            const method = options.method.toUpperCase();

            if (['PUT', 'POST'].indexOf(method) !== -1 && options.postBody == null) {
                const parameters = toQueryString(options.parameters);
                if (parameters != null) {
                    options.postBody = parameters;
                    if (options.contentType == null) {
                        options.contentType = 'application/x-www-form-urlencoded';
                    }
                    if (options.encoding == null) {
                        options.encoding = 'UTF-8';
                    }
                }
            }

            const transport = new XMLHttpRequest();
            if (options.withCredentials === true && options.supportsAccessControl) {
                transport.withCredentials = true;
            }
            if (options.responseType) {
                transport.responseType = options.responseType;
            }

            super("making request", (resolve, reject, update) => {
                transport.upload.addEventListener('progress', (event) => {
                    const progress = Math.round(event.loaded * 100 / event.total);
                    update(progress / 2);
                });
                transport.addEventListener("progress", (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round(event.loaded * 100 / event.total);
                        update(50 + (progress / 2));
                    }
                });
                transport.addEventListener("load", () => {
                    onReadyStateChange.call(this, resolve);
                });
                transport.addEventListener("error", () => {
                    onReadyStateChange.call(this, reject, true);
                });
            });

            Object.defineProperties(this, {
                options: {
                    value: options
                },
                method: {
                    value: method
                },
                transport: {
                    value: transport
                },
                url: {
                    value: url
                }
            });

            transport.addEventListener('abort', onAbort.bind(this), true);
            if (typeof this.options.onUploadProgress === 'function') {
                this.transport.upload.addEventListener('progress', options.onUploadProgress, false);
            }
            if (typeof this.options.onProgress === 'function') {
                this.transport.addEventListener('progress', options.onProgress, false);
            }

            this.transport.open(this.method, this.url, this.options.asynchronous);
            setRequestHeaders.call(this);
            this.transport.send(this.options.postBody);
        }

        abort() {
            this.transport.aborted = true;
            this.transport.abort();
            return this;
        }

    }

    const io = {};

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
    io.ConnectionError = class ConnectionError extends Error {

        constructor() {
            const message = "Connection Error";

            super(message);

            this.name = "ConnectionError";
            this.message = message;

            // Maintains proper stack trace for where our error was thrown (only available on V8)
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, this.constructor);
            }
        }

        toString() {
            return this.message;
        }

    }


    io.buildProxyURL = function buildProxyURL(url, options) {
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

        const forceProxy = !!options.forceProxy;
        if (["blob:", "data:"].indexOf(url.protocol) !== -1) {
            return url.toString();
        }

        const hash = url.hash;
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
            const parameters = toQueryString(options.parameters);
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
