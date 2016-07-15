/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var openstack_tokens = {};

    var on_get_token_resolve = function on_get_token_resolve(url, response) {
        var token = response.getHeader('X-Subject-Token');
        openstack_tokens[url].token = token;

        for (var i = 0; i < openstack_tokens[url].resolveListeners.length; i++) {
            utils.callCallback(openstack_tokens[url].resolveListeners[i], token);
        }
        openstack_tokens[url].resolveListeners = null;
        openstack_tokens[url].rejectListeners = null;
    };

    var on_get_token_reject = function on_get_token_reject(url, response) {
        for (var i = 0; i < openstack_tokens[url].rejectListeners.length; i++) {
            utils.callCallback(openstack_tokens[url].rejectListeners[i]);
        }
        openstack_tokens[url].resolveListeners = null;
        openstack_tokens[url].rejectListeners = null;
    };

    var get_openstack_token_from_idm_token = function get_openstack_token_from_idm_token(url, resolve, reject) {
        if (openstack_tokens[url] != null) {

            if (openstack_tokens[url].token != null) {
                resolve(openstack_tokens[url].token);
            } else {
                openstack_tokens[url].resolveListeners.push(resolve);
                openstack_tokens[url].rejectListeners.push(reject);
            }
        } else {
            openstack_tokens[url] = {
                token: null,
                resolveListeners: [resolve],
                rejectListeners: [reject]
            };

            var endpoint_url = url + 'v3/auth/tokens';
            Wirecloud.io.makeRequest(endpoint_url, {
                method: 'POST',
                contentType: 'application/json',
                requestHeaders: {
                    'Accept': 'application/json',
                    'X-FI-WARE-OAuth-Token': 'true',
                    'X-FI-WARE-OAuth-Token-Body-Pattern': '%idm_token%'
                },
                postBody: JSON.stringify({
                    "auth": {
                        "identity": {
                            "methods": ["oauth2"],
                            "oauth2": {
                                "access_token_id": '%idm_token%'
                            }
                        }
                    }
                }),
                onSuccess: on_get_token_resolve.bind(null, url),
                onFailure: on_get_token_reject.bind(null, url)
            });
        }
    };

    window.OpenStackManager = {
        get_openstack_token_from_idm_token: get_openstack_token_from_idm_token
    };

})(Wirecloud.Utils);
