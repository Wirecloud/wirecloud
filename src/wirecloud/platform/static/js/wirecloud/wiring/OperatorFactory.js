/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
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

/*global Wirecloud */

(function () {

    "use strict";

    var OperatorFactory = {};

    /*************************************************************************
     * Public methods
     *************************************************************************/

    OperatorFactory.getAvailableOperators = function getAvailableOperators() {
        return Wirecloud.LocalCatalogue.getAvailableResourcesByType('operator');
    };

    OperatorFactory.getOperatorMeta = function getOperatorMeta(name) {
        return Wirecloud.LocalCatalogue.getResourceId(name);
    };

    /*************************************************************************
     * Make OperatorFactory public
     *************************************************************************/
    Wirecloud.wiring.OperatorFactory = OperatorFactory;
})();
