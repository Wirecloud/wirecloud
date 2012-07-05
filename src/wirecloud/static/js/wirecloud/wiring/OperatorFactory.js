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

/*global EzWebExt, ezweb_user_name, OperatorMeta, Wirecloud */

// TODO
Wirecloud.wiring = {};

(function () {

    "use strict";

    var operators, i, operator, OperatorFactory;

    operators = {};

    Wirecloud.io.makeRequest('api/operators', {
        method: 'GET',
        onSuccess: function onSuccess(transport) {
            var key, operator_jsons, operator;

            operator_jsons = JSON.parse(transport.responseText);
            for (key in operator_jsons) {
                operator = new OperatorMeta(operator_jsons[key]);
                operators[operator.uri] = operator;
            }
        }
    });

    OperatorFactory = {};

    /*************************************************************************
     * Private methods
     *************************************************************************/
     
    /*************************************************************************
     * Public methods
     *************************************************************************/

    OperatorFactory.getAvailableOperators = function getAvailableOperators() {
        return operators;
    };

    OperatorFactory.getOperatorMeta = function getOperatorMeta(name) {
        return operators[name];
    };

    /*************************************************************************
     * Make Anchor public
     *************************************************************************/
    Wirecloud.wiring.OperatorFactory = OperatorFactory;
})();
