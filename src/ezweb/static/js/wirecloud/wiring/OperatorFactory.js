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

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50, prototypejs: true */
/*global gettext */

// TODO
Wirecloud.wiring = {};

(function () {

    "use strict";

    var operatorList, operators, i, operator, OperatorFactory;

    // TODO this is for testing
    var inputs = [{"name":"sum1", "label":"sumando 1","desc":"Este es el primer sumando", "type":"N", "index":0, "required": true, "defaultValue": 0},
    {"name":"sum2", "label":"sumando 2", "desc":"Este es el segundo sumando", "type":"N", "index":1, "required": true, "defaultValue": 0},
    {"name":"sum3", "label":"sumando 3", "desc":"Este es el tercer sumando", "type":"N", "index":2, "required": true, "defaultValue": 0}];

    var outputs = [{"name":"res", "label":"resultado" ,"desc":"Este es el resultado de sumar todos los inputs del operador", "type":"N", "index":0, "required": true, "defaultValue": 0}];

    var code = function (params, callback) {
        callback(param[0] + param[1] + param[2])
    }

    var myname = 'Multi-Sumador';
    var description = 'Suma todos los enteros introducidos y devuelve el resultado'
    
    var OpSumadorTriple = new OperatorMeta (myname, description, inputs, outputs, code);

    inputs = [
        {"name":"sum1", "label":"sumando 1","desc":"Este es el primer sumando", "type":"S", "index":0, "required": true, "defaultValue": 0},
    ];

    outputs = [
        {"name":"res", "label":"resultado" ,"desc":"Este es el resultado de sumar todos los inputs del operador", "type":"N", "index":0, "required": true, "defaultValue": 0}
    ];

    code = function (params, callback) {
        callback(params);
    }

    var description = 'Suma todos los enteros introducidos y devuelve el resultado'
    
    var Channel = new OperatorMeta ('Channel', description, inputs, outputs, code);
    //TODO END
    
    var smsReceiver = new OperatorMeta('Receive SMS',
        '',
        [{"name": "contact", "label": "contact", "desc": "", "type": "S", "index": 0}, {"name": "auth", "label": "contact", "desc": "", "type": "S", "index": 1}],
        [{"name": "message", "label": "SMS Message", "desc": "Received SMS", "type": "S", "index": 0}],
        function () {}
        );
    var jabberReceiver = new OperatorMeta('ReceiveJabber',
        '',
        [{"name": "contact", "label": "contact", "desc": "", "type": "S", "index": 0}, {"name": "auth", "label": "contact", "desc": "", "type": "S", "index": 1}],
        [{"name": "message", "label": "SMS Message", "desc": "Received SMS", "type": "S", "index": 0}],
        function () {}
        );
    var twitterReceiver = new OperatorMeta('ReceiveTwitter',
        '',
        [{"name": "contact", "label": "contact", "desc": "", "type": "S", "index": 0}, {"name": "auth", "label": "contact", "desc": "", "type": "S", "index": 1}],
        [{"name": "message", "label": "SMS Message", "desc": "Received SMS", "type": "S", "index": 0}],
        function () {}
        );

    operatorList = [OpSumadorTriple, Channel, smsReceiver, jabberReceiver, twitterReceiver];

    operators = {};
    for (i = 0; i < operatorList.length; i += 1) {
        operator = operatorList[i];
        operators[operator.getName()] = operator;
    }

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
