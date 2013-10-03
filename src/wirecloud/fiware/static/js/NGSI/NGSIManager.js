/*
 *     (C) Copyright 2013 Universidad Politécnica de Madrid
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

/*global opManager, Wirecloud*/

(function (NGSI) {

    "use strict";

    var register_widget_subscription, register_operator_subscription, unload_widget, unload_operator,
        subscriptionsByWidget, subscriptionsByOperator, proxy_connections, Manager, ProxyConnection,
        original_connection;

    subscriptionsByWidget = {};
    subscriptionsByOperator = {};
    proxy_connections = {};
    Manager = {};

    register_widget_subscription = function register_widget_subscription(iWidgetId, subscription) {

        var iWidget;

        if (!(iWidgetId in subscriptionsByWidget)) {
            iWidget = opManager.activeWorkspace.getIWidget(iWidgetId);
            subscriptionsByWidget[iWidgetId] = [];
            iWidget.addEventListener('unload', unload_widget);
        }

        subscriptionsByWidget[iWidgetId].push(subscription);
    };

    unload_widget = function unload_widget(iWidget) {
        var i, subscriptions;

        subscriptions = subscriptionsByWidget[iWidget.id];
        for (i = 0; i < subscriptions.length; i += 1) {
            subscriptions[i].close();
        }

        delete subscriptionsByWidget[iWidget.id];
    };

    register_operator_subscription = function register_operator_subscription(iOperatorId, subscription) {

        var iOperator;

        if (!(iOperatorId in subscriptionsByOperator)) {
            iOperator = opManager.activeWorkspace.wiring.ioperators[iOperatorId];
            subscriptionsByOperator[iOperatorId] = [];
            iOperator.addEventListener('unload', unload_operator);
        }

        subscriptionsByOperator[iOperatorId].push(subscription);
    };

    unload_operator = function unload_operator(iOperator) {
        var i, subscriptions;

        subscriptions = subscriptionsByOperator[iOperator.id];
        for (i = 0; i < subscriptions.length; i += 1) {
            subscriptions[i].close();
        }

        delete subscriptionsByOperator[iOperator.id];
    };

    // Overload NGSI connection constructor
    Manager.Connection = function Connection(type, id, url, options) {
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
            options.ngsi_proxy_connection = proxy_connections[options.ngsi_proxy_url];
            delete options.ngsi_proxy_url;
        }

        NGSI.Connection.call(this, url, options);
    };
    Manager.Connection.prototype = NGSI.Connection.prototype;

    Manager.NGSI = NGSI;
    window.NGSIManager = Manager;

})(NGSI);

delete window.NGSI;
