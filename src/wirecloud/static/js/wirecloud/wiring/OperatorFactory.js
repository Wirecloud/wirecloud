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

    var operatorList, operators, i, operator, OperatorFactory;

    var sendSms = new OperatorMeta({
        name: 'Send SMS',
        description: '',
        inputs: {
            'message': {
                "name": "message",
                "label": "Message",
                "desc": "The message to send",
                "action_label": 'Send SMS',
                "type": "S",
                "index": 0,
                "callback": function (data) {

                    var element, doc = EzWebExt.XML.createDocument('http://telecomitalia.it/ictservice/smsService/rest', 'rest:SmsOut');

                    element = doc.createElement('rest:Recipient');
                    element.textContent = data.recipient;
                    doc.documentElement.appendChild(element);

                    element = doc.createElement('rest:Sender');
                    element.textContent = ezweb_user_name;
                    doc.documentElement.appendChild(element);

                    element = doc.createElement('rest:MessageBody');
                    element.textContent = data.text;
                    doc.documentElement.appendChild(element);

                    element = doc.createElement('rest:ContentType');
                    element.textContent = 'Text';
                    doc.documentElement.appendChild(element);

                    Wirecloud.io.makeRequest("https://cassiopea.tilab.com:9443/camel-dynamic-container/camelServices/smsService/sms", {
                        method: 'POST',
                        postBody: EzWebExt.XML.serializeXML(doc),
                        contentType: 'application/xml',
                        requestHeaders: {
                            'Accept': 'application/xml, text/plain',
                            'Authorization': 'Basic Zml3YXJlOmZpd2FyZSQ='
                        },
                        onSuccess: function () {
                            this.sendEvent('ack', {id: data.id, result: 'success'});
                        }.bind(this),
                        onFailure: function () {
                            this.sendEvent('ack', {id: data.id, result: 'error'});
                        }.bind(this)
                    });
                }
            }
        },
        outputs: {
            'ack': {
                'name': 'ack',
                'label': "Acknowledge",
                'desc': '',
                'type': 'S',
                'index': 0
            }
        }
    });

    operatorList = [sendSms];

    operators = {};
    for (i = 0; i < operatorList.length; i += 1) {
        operator = operatorList[i];
        operators[operator.name] = operator;
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
