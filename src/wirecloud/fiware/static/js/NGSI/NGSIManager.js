/*
 *     (C) Copyright 2013-2014 Universidad Politécnica de Madrid
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

/*global NGSI, Wirecloud*/

(function (NGSI) {

    "use strict";

    var register_widget_proxy, register_operator_proxy, unload_widget, unload_operator,
        proxiesByWidget, proxiesByOperator, proxy_connections, Manager;

    proxiesByWidget = {};
    proxiesByOperator = {};
    proxy_connections = {};
    Manager = {};

    register_widget_proxy = function register_widget_proxy(id, proxy) {
        var iwidget;

        if (!(id in proxiesByWidget)) {
            iwidget = Wirecloud.activeWorkspace.getIWidget(id).internal_iwidget;
            proxiesByWidget[id] = [];
            iwidget.addEventListener('unload', unload_widget);
        }

        proxiesByWidget[id].push(proxy);
    };

    unload_widget = function unload_widget(iwidget) {
        var i, proxies;

        proxies = proxiesByWidget[iwidget.id];
        for (i = 0; i < proxies.length; i += 1) {
            try {
                proxies[i].close();
            } catch (e) {}
        }
        proxies.length = 0;

        iwidget.removeEventListener('unload', unload_widget);
        delete proxiesByWidget[iwidget.id];
    };

    register_operator_proxy = function register_operator_proxy(id, proxy) {

        var ioperator;

        if (!(id in proxiesByOperator)) {
            ioperator = Wirecloud.activeWorkspace.wiring.ioperators[id];
            proxiesByOperator[id] = [];
            ioperator.addEventListener('unload', unload_operator);
        }

        proxiesByOperator[id].push(proxy);
    };

    unload_operator = function unload_operator(ioperator) {
        var i, proxies;

        proxies = proxiesByOperator[ioperator.id];
        for (i = 0; i < proxies.length; i += 1) {
            try {
                proxies[i].close();
            } catch (e) {}
        }
        proxies.length = 0;

        ioperator.removeEventListener('unload', unload_operator);
        delete proxiesByOperator[ioperator.id];
    };

    // Overload NGSI connection constructor
    Manager.Connection = function Connection(type, id, url, options) {
        var wrapped_proxy;

        if (options == null) {
            options = {};
        }

        if (typeof options.requestFunction !== 'function') {
            options.requestFunction = Wirecloud.io.makeRequest;
        }

        if (options.ngsi_proxy_url != null) {
            if (!(options.ngsi_proxy_url in proxy_connections)) {
                proxy_connections[options.ngsi_proxy_url] = new NGSI.ProxyConnection(options.ngsi_proxy_url, options.requestFunction);
            }

            wrapped_proxy = new WirecloudResourceProxy(proxy_connections[options.ngsi_proxy_url], this);
            options.ngsi_proxy_connection = wrapped_proxy;
            switch (type) {
            case "operator":
                register_operator_proxy(id, wrapped_proxy);
                break;
            case "widget":
                register_widget_proxy(id, wrapped_proxy);
                break;
            }
            delete options.ngsi_proxy_url;
        }

        if (options.use_user_fiware_token === true) {
            if (options.request_headers == null) {
                options.request_headers = {};
            }
            options.request_headers['X-FI-WARE-OAuth-Token'] = 'true';
            options.request_headers['X-FI-WARE-OAuth-Header-Name'] = 'X-Auth-Token';
        }

        NGSI.Connection.call(this, url, options);
    };
    Manager.Connection.prototype = NGSI.Connection.prototype;

    var WirecloudResourceProxy = function WirecloudResourceProxy(real_proxy, connection) {
        Object.defineProperty(this, 'real_proxy', {value: real_proxy});
        Object.defineProperty(this, 'connection', {value: connection});
        Object.defineProperty(this, 'connected', {get: function () { return this.real_proxy.connected; }});
        Object.defineProperty(this, 'connecting', {get: function () { return this.real_proxy.connecting; }});
        Object.defineProperty(this, 'url', {get: function () { return this.real_proxy.url; }});
        this.callbacks = [];
    };
    WirecloudResourceProxy.prototype = new NGSI.ProxyConnection();

    WirecloudResourceProxy.prototype.connect = function connect(options) {
        this.real_proxy.connect(options);
    };

    WirecloudResourceProxy.prototype.request_callback = function request_callback(onNotify, onSuccess, onFailure) {
        var old_on_success = onSuccess;
        onSuccess = function (data) {
            this.callbacks.push(data.callback_id);
            if (typeof old_on_success === 'function') {
                old_on_success(data);
            }
        }.bind(this);
        this.real_proxy.request_callback(onNotify, onSuccess, onFailure);
    };

    WirecloudResourceProxy.prototype.close_callback = function close_callback(callback_id, onSuccess, onFailure) {
        if (this.callbacks.indexOf(callback_id) === -1) {
            throw new TypeError('unhandled callback: ' + callback_id);
        }
        var old_on_success = onSuccess;
        onSuccess = function (data) {
            var index = this.callbacks.indexOf(callback_id);
            if (index != -1) {
                this.callbacks.splice(index, 1);
            }
            if (typeof old_on_success === 'function') {
                old_on_success(data);
            }
        }.bind(this);
        this.real_proxy.close_callback(callback_id, onSuccess, onFailure);
    };

    WirecloudResourceProxy.prototype.associate_subscription_id_to_callback = function associate_subscription_id_to_callback(callback_id, subscription_id) {
        this.real_proxy.associate_subscription_id_to_callback(callback_id, subscription_id);
    };

    WirecloudResourceProxy.prototype.close_callback_by_subscriptionId = function close_callback_by_subscriptionId(subscription_id, onSuccess, onFailure) {
        var callback_id;

        if (subscription_id in this.real_proxy.callbacks_by_subscriptionId) {
            callback_id = this.real_proxy.callbacks_by_subscriptionId[subscription_id].callback_id;
            if (this.callbacks.indexOf(callback_id) !== -1) {
                var old_on_success = onSuccess;
                onSuccess = function (data) {
                    var index = this.callbacks.indexOf(callback_id);
                    if (index != -1) {
                        this.callbacks.splice(index, 1);
                    }
                    if (typeof old_on_success === 'function') {
                        old_on_success(data);
                    }
                }.bind(this);
                this.real_proxy.close_callback_by_subscriptionId(subscription_id, onSuccess, onFailure);
                return;
            }
        }
        if (typeof onSuccess === 'function') {
            onSuccess();
        }
    };

    WirecloudResourceProxy.prototype.close = function close() {
        var i;

        for (i = 0; i < this.callbacks.length; i++) {
            if (this.real_proxy.callbacks[this.callbacks[i]].subscription_id != null) {
                this.connection.cancelSubscription(this.real_proxy.callbacks[this.callbacks[i]].subscription_id);
            }
        }
    };

    Manager.NGSI = NGSI;
    window.NGSIManager = Manager;

})(NGSI);

delete window.NGSI;
