/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global OpManagerFactory, PersistenceEngineFactory, Hash, Gadget, Modules, URIs */
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

// This module provides a set of gadgets which can be deployed into dragboard as gadget instances
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

        var loadGadgets,
            onErrorCallback,
            private_gadgets,
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

        // Load gadgets from persistence system
        loadGadgets = function (receivedData) {
            var response = receivedData.responseText,
                jsonGadgetList = JSON.parse(response),
                i, jsonGadget, gadget, gadgetId;

            // Load all gadgets from persitence system
            for (i = 0; i < jsonGadgetList.length; i += 1) {
                jsonGadget = jsonGadgetList[i];
                gadget = new Gadget(jsonGadget, null);
                gadgetId = gadget.getVendor() + '_' + gadget.getName() + '_' + gadget.getVersion();

                // Insert gadget object in showcase object model
                private_gadgets.set(gadgetId, gadget);
            }

            // Showcase loaded
            private_loaded = true;
            private_opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);

        };

        // Error callback (empty gadget list)
        onErrorCallback = function (receivedData) {
            private_loaded = true;
            private_opManager.continueLoadingGlobalModules(Modules.prototype.SHOWCASE);
        };

        // *******************************
        // PRIVATE METHODS AND VARIABLES
        // *******************************
        private_gadgets = new Hash();
        private_loaded = false;
        private_opManager = OpManagerFactory.getInstance();
        private_persistenceEngine = PersistenceEngineFactory.getInstance();

        // ****************
        // PUBLIC METHODS
        // ****************

        // Get a gadget by its gadgetID
        Showcase.prototype.getGadget = function (gadgetId) {
            return private_gadgets.get(gadgetId);
        };


        Showcase.prototype.init = function () {
            // Initial load from persitence system
            private_persistenceEngine.send_get(URIs.GET_GADGETS, this, loadGadgets, onErrorCallback);
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
