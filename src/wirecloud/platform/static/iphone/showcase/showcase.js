/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global OpManagerFactory, Wirecloud, Hash, Widget, Modules */
"use strict";

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
* @author luismarcos.ayllon
*/

// This module provides a set of widgets which can be deployed into dragboard as widget instances
var ShowcaseFactory = (function () {

    // *********************************
    // SINGLETON INSTANCE
    // *********************************
    var instance = null,
        Singleton;

    // *********************************
    // CONSTRUCTOR
    // *********************************
    function Showcase() {

        var loadWidgets,
            onErrorCallback,
            private_widgets,
            private_loaded,
            private_opManager,
            private_persistenceEngine;

        // ******************
        // STATIC VARIABLES
        // ******************
        Showcase.prototype.MODULE_HTML_ID = "showcase";

        // ****************
        // CALLBACK METHODS
        // ****************

        // Load widgets from persistence system
        loadWidgets = function (receivedData) {
            var response = receivedData.responseText,
                jsonWidgetList = JSON.parse(response),
                i, jsonWidget, widget, widgetId;

            // Load all widgets from persitence system
            for (i = 0; i < jsonWidgetList.length; i += 1) {
                jsonWidget = jsonWidgetList[i];
                widget = new Widget(jsonWidget, null);
                widgetId = widget.getId();

                // Insert widget object in showcase object model
                private_widgets.set(widgetId, widget);
            }

            // Showcase loaded
            private_loaded = true;
            private_opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);

        };

        // Error callback (empty widget list)
        onErrorCallback = function (receivedData) {
            private_loaded = true;
            private_opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);
        };

        // *******************************
        // PRIVATE METHODS AND VARIABLES
        // *******************************
        private_widgets = new Hash();
        private_loaded = false;
        private_opManager = OpManagerFactory.getInstance();

        // ****************
        // PUBLIC METHODS
        // ****************

        Showcase.prototype.init = function () {
            // Initial load from persitence system
            Wirecloud.io.makeRequest(Wirecloud.URLs.WIDGET_COLLECTION, {
                method: 'GET',
                onSuccess: loadWidgets,
                onFailure: onErrorCallback,
                onException: onErrorCallback
            });
        };

    }

    // *********************************
    // SINGLETON GET INSTANCE
    // *********************************
    Singleton = function () {
        this.getInstance = function () {
            if (instance === null || instance === undefined) {
                instance = new Showcase();
            }
            return instance;
        };
    };

    return new Singleton();

}());
