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

/*jslint white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global $, CatalogueViewFactory, Modules, OpManagerFactory, PersistenceEngineFactory */
"use strict";

var CatalogueFactory = (function () {

    // *********************************
    // SINGLETON INSTANCE
    // *********************************

    var persistence_engine = PersistenceEngineFactory.getInstance(),
        active_instance = null,
        Singleton;

    // ************************
    //  SINGLETON GET INSTANCE
    // ************************
    Singleton = function () {
        this.getInstance = function () {
            if (!active_instance) {
                var view_factory = new CatalogueViewFactory();
                active_instance = view_factory.create_catalogue($('catalogue'), persistence_engine);
                OpManagerFactory.getInstance().continueLoadingGlobalModules(Modules.prototype.CATALOGUE);
            }

            return active_instance;
        };
    };

    return new Singleton();
}());
