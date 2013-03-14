/*
 *     (C) Copyright 2012-2013 Universidad Politécnica de Madrid
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

/*global Ajax*/

Wirecloud.location = {
    'domain': document.location.protocol + '//' + document.location.host,
    'protocol': document.location.protocol.substr(0, document.location.protocol.length - 1),
    'host': document.location.host
};

(function () {

    "use strict";

    var io = {};

    io.buildProxyURL = function buildProxyURL(url, options) {
        var final_url, protocolEnd, link, forceProxy, hostStart, pathStart, protocol,
            host, rest;

        forceProxy = options != null && !!options.forceProxy;

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

        if (forceProxy || protocol !== Wirecloud.location.protocol || host !== Wirecloud.location.host) {
            final_url = Wirecloud.location.domain +
                Wirecloud.URLs.PROXY.evaluate({protocol: protocol, domain: host, path: rest});
        }

        return final_url;
    };

    io.makeRequest = function makeRequest(url, options) {
        var handlerRegExp, key;

        if (options != null && options.context != null) {
            handlerRegExp = new RegExp(/^on(?:Create|Complete|Exception|Failure|Interactive|Loaded|Loading|Success|Uninitialized|\d{3})$/);
            for (key in options) {
                if (handlerRegExp.test(key) && typeof options[key] === 'function') {
                    options[key] = options[key].bind(options.context);
                }
            }
        }

        return new Ajax.Request(Wirecloud.io.buildProxyURL(url, options), options);
    };

    Wirecloud.io = io;

})();
