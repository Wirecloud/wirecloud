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

    var smsReceiver = new OperatorMeta('Get SMS',
        '',
        [{"name": "contact", "label": "Sender (vcard)", "desc": "Person who sent the SMS", "type": "S", "index": 0}], //, {"name": "auth", "label": "contact", "desc": "", "type": "S", "index": 1}],
        [{"name": "message", "label": "Message", "desc": "The received SMS message", "type": "S", "index": 0}],
        function () {}
        );
    var jabberReceiver = new OperatorMeta('Get Jabber',
        '',
        [{"name": "contact", "label": "Sender (vcard)", "desc": "Person who sent the Jabber message", "type": "S", "index": 0}], // {"name": "auth", "label": "contact", "desc": "", "type": "S", "index": 1}],
        [{"name": "message", "label": "Message", "desc": "The received Jabber message", "type": "S", "index": 0}],
        function () {}
        );
    var twitterReceiver = new OperatorMeta('Get Tweet',
        '',
        [{"name": "contact", "label": "Sender (vcard)", "desc": "Person who mentioned me in Tweeter", "type": "S", "index": 0}], // {"name": "auth", "label": "contact", "desc": "", "type": "S", "index": 1}],
        [{"name": "message", "label": "Message", "desc": "The received tweet", "type": "S", "index": 0}],
        function () {}
        );
    var getContactsFromGMail = new OperatorMeta('Get GMail Contacts',
        '',
        [],
        [{"name": "vcard", "label": "Vcard", "desc": "The list of GMail contacts in vcard format", "type": "S", "index": 0}],
        function () {}
        );
    var sendTweet = new OperatorMeta('Send Tweet',
        '',
        [{"name": "message", "label": "Message", "desc": "The mention to tweet", "type": "S", "index": 0}, {"name": "auth", "label": "contact", "desc": "Vcard of the contact to mention", "type": "S", "index": 1}],
        [],
        function () {}
        );

    var sendSms = new OperatorMeta('Send SMS',
        '',
        [
            {
                "name": "message",
                "label": "Message",
                "desc": "The message to send",
                "action_label": 'Send SMS',
                "type": "S",
                "index": 0,
                "callback": function (data) {

                    var element, doc = EzWebExt.XML.createDocument('http://telecomitalia.it/ictservice/smsService/rest', 'rest:SmsOut');

                    element = doc.createElement('rest:Recipient');
                    element.textContent = this.contact_phone;
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
            },
            {
                "name": "contact",
                "label": "contact",
                "desc": "Vcard of the contact to send the sms",
                "type": "S",
                "index": 1,
                "callback": function (data) {
                    this.contact_phone = data;
//                    this.contact_phone = VCard.parse(data)['tel'][0];
                }
            }
        ],
        [
            {'name': 'ack', 'label': "Acknowledge", 'desc': '', 'type': 'S', 'index': 0}
        ],
        function () {}
        );

    var sendJabber = new OperatorMeta('Send Msg to Jabber',
        '',
        [{"name": "message", "label": "Message", "desc": "The message to send", "type": "S", "index": 0}, {"name": "auth", "label": "contact", "desc": "Vcard of the contact to send the Jabber message", "type": "S", "index": 1}],
        [],
        function () {}
        );
    operatorList = [smsReceiver, jabberReceiver, twitterReceiver, getContactsFromGMail, sendTweet, sendSms, sendJabber];

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
