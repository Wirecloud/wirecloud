/*
 *     Copyright (c) 2013-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals NGSI, Wirecloud */


(function (NGSI, utils) {

    "use strict";

    var proxiesByComponent = {
        "widget": {},
        "operator": {}
    };
    var proxy_connections = {};
    var Manager = {};

    // TODO
    var proxy_base_url = new URL(Wirecloud.URLs.PROXY.evaluate({protocol: 'x', domain: 'x', path: 'x'}), Wirecloud.location.base);
    proxy_base_url = proxy_base_url.toString().slice(0, -"/x/xx".length);

    var unload_component = function unload_component(component) {
        var proxies = proxiesByComponent[component.meta.type][component.id];
        proxies.forEach((proxy) => {
            var proxy_info = proxy_connections[proxy.url];
            proxy_info.usages -= 1;
            if (proxy_info.usages === 0) {
                proxy_info.proxy.close();
                delete proxy_connections[proxy.url];
            }
            try {
                proxy.close();
            } catch (e) {}
        });
        proxies.length = 0;

        component.removeEventListener('unload', unload_component);
        delete proxiesByComponent[component.meta.type][component.id];

        // Search unused proxy connections
    };

    var register_component_proxy = function register_component_proxy(component, proxy) {
        var id = component.id;
        var type = component.meta.type;

        if (!(id in proxiesByComponent[type])) {
            proxiesByComponent[type][id] = [];
            component.addEventListener('unload', unload_component);
        }

        proxiesByComponent[type][id].push(proxy);
    };

    var make_request = function make_request(url, options) {
        return Wirecloud.io.makeRequest(url, options).then(
            (response) => {
                var details, via_header;

                if (response.request.url.startsWith(proxy_base_url)) {
                    via_header = response.getHeader('Via');
                    if (response.status === 0) {
                        return Promise.reject(new NGSI.ConnectionError(utils.gettext("Error connecting to the WireCloud's proxy")));
                    } else if (via_header == null) {
                        // Error coming directly from WireCloud's proxy
                        switch (response.status) {
                        case 403:
                            return Promise.reject(new NGSI.ConnectionError(utils.gettext("You aren't allowed to use the WireCloud's proxy. Have you signed off from WireCloud?")));
                        case 502:
                        case 504:
                            details = JSON.parse(response.responseText);
                            return Promise.reject(new NGSI.ConnectionError(details.description));
                        default:
                            return Promise.reject(new NGSI.ConnectionError(utils.gettext("Unexpected response from WireCloud's proxy")));
                        }
                    }
                }

                return Promise.resolve(response);
            }
        );
    };

    // Overload NGSI connection constructor
    Manager.Connection = function Connection(component, url, options) {

        if (options == null) {
            options = {};
        }

        if (typeof options.requestFunction !== 'function') {
            options.requestFunction = make_request;
        }

        if (options.ngsi_proxy_url != null) {
            var wrapped_proxy = new WirecloudResourceProxy(options.ngsi_proxy_url, this, options.requestFunction);
            options.ngsi_proxy_connection = wrapped_proxy;
            register_component_proxy(component, wrapped_proxy);
            delete options.ngsi_proxy_url;
        }

        if (options.use_user_fiware_token === true) {
            if (options.request_headers == null) {
                options.request_headers = {};
            }
            options.request_headers['FIWARE-OAuth-Token'] = 'true';
            options.request_headers['FIWARE-OAuth-Header-Name'] = 'X-Auth-Token';
        }

        NGSI.Connection.call(this, url, options);
    };
    Manager.Connection.prototype = NGSI.Connection.prototype;

    var privates = new WeakMap();

    var on_connected_get = function on_connected_get() {
        return privates.get(this).real_proxy.connected;
    };

    var on_connecting_get = function on_connecting_get() {
        return privates.get(this).real_proxy.connecting;
    };

    var on_url_get = function on_url_get() {
        return privates.get(this).real_proxy.url;
    };

    var WirecloudResourceProxy = function WirecloudResourceProxy(url, connection, requestFunction) {
        url = new URL(url);
        if (url.pathname[url.pathname.length - 1] !== '/') {
            url.pathname += '/';
        }

        if (!(url in proxy_connections)) {
            proxy_connections[url] = {
                proxy: new NGSI.ProxyConnection(url, requestFunction),
                usages: 0
            };
        }
        var real_proxy = proxy_connections[url].proxy;
        proxy_connections[url].usages += 1;
        privates.set(this, {
            callbacks: [],
            real_proxy: real_proxy
        });
        Object.defineProperties(this, {
            connection: {value: connection},
            connected: {get: on_connected_get},
            connecting: {get: on_connecting_get},
            url: {get: on_url_get}
        });
    };
    utils.inherit(WirecloudResourceProxy, NGSI.ProxyConnection);

    WirecloudResourceProxy.prototype.connect = function connect(options) {
        return privates.get(this).real_proxy.connect(options);
    };

    WirecloudResourceProxy.prototype.requestCallback = function requestCallback(onNotify) {
        var priv = privates.get(this);
        return priv.real_proxy.requestCallback(onNotify).then((data) => {
            priv.callbacks.push(data.callback_id);
            return Promise.resolve(data);
        });
    };

    WirecloudResourceProxy.prototype.closeCallback = function closeCallback(callback_id) {
        var priv = privates.get(this);
        if (priv.callbacks.indexOf(callback_id) === -1) {
            throw new TypeError('unhandled callback: ' + callback_id);
        }
        return priv.real_proxy.closeCallback(callback_id).then(() => {
            var index = priv.callbacks.indexOf(callback_id);
            if (index !== -1) {
                priv.callbacks.splice(index, 1);
            }
        });
    };

    WirecloudResourceProxy.prototype.associateSubscriptionId = function associateSubscriptionId(callback_id, subscription_id) {
        privates.get(this).real_proxy.associateSubscriptionId(callback_id, subscription_id);
        return this;
    };

    WirecloudResourceProxy.prototype.closeSubscriptionCallback = function closeSubscriptionCallback(subscription_id) {
        var priv = privates.get(this);

        if (subscription_id in priv.real_proxy.subscriptionCallbacks) {
            var callback_id = priv.real_proxy.subscriptionCallbacks[subscription_id];
            if (priv.callbacks.indexOf(callback_id) !== -1) {
                return priv.real_proxy.closeSubscriptionCallback(subscription_id).then(() => {
                    var index = priv.callbacks.indexOf(callback_id);
                    if (index !== -1) {
                        priv.callbacks.splice(index, 1);
                    }
                });
            }
        }

        return Promise.resolve();
    };

    WirecloudResourceProxy.prototype.close = function close() {
        var priv = privates.get(this);
        var callbackSubscriptions = priv.real_proxy.callbackSubscriptions;

        priv.callbacks.forEach((callback) => {
            this.closeCallback(callback);
            if (callbackSubscriptions[callback] != null) {
                this.connection.cancelSubscription(callbackSubscriptions[callback]);
            }
        });
        priv.callbacks = [];
    };

    Manager.NGSI = NGSI;
    window.NGSIManager = Manager;

})(NGSI, Wirecloud.Utils);

delete window.NGSI;
