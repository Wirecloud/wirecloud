/*
 *     (C) Copyright 2013 Universidad Politécnica de Madrid
 *
 *     This file is part of ngsijs.
 *
 *     Ngsijs is free software: you can redistribute it and/or modify it under
 *     the terms of the GNU Affero General Public License as published by the
 *     Free Software Foundation, either version 3 of the License, or (at your
 *     option) any later version.
 *
 *     Ngsijs is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with ngsijs. If not, see <http://www.gnu.org/licenses/>.
 *
 */

/*global ActiveXObject, MashupPlatform*/

(function () {

    "use strict";

    var NGSI = {
        endpoints: {
            REGISTER_CONTEXT: 'ngsi9/registerContext',
            DISCOVER_CONTEXT_AVAILABILITY: 'ngsi9/discoverContextAvailability',
            SUBSCRIBE_CONTEXT_AVAILABILITY: 'ngsi9/subscribeContextAvailability',
            UPDATE_CONTEXT_AVAILABILITY_SUBSCRIPTION: 'ngsi9/updateContextAvailabilitySubscription',
            UNSUBSCRIBE_CONTEXT_AVAILABILITY: 'ngsi9/unsubscribeContextAvailability',
            QUERY_CONTEXT: 'ngsi10/queryContext',
            UPDATE_CONTEXT: 'ngsi10/updateContext',
            SUBSCRIBE_CONTEXT: 'ngsi10/subscribeContext',
            UPDATE_CONTEXT_SUBSCRIPTION: 'ngsi10/updateContextSubscription',
            UNSUBSCRIBE_CONTEXT: 'ngsi10/unsubscribeContext'
        }
    };

    /* XML support */

    NGSI.XML = {};

    if (document.implementation && document.implementation.createDocument) {

        /**
         * creates a new DOMDocument
         */
        NGSI.XML.createDocument = function createDocument(namespaceURL, rootTagName, doctype) {
            return document.implementation.createDocument(namespaceURL, rootTagName, null);
        };

    } else if (window.ActiveXObject) {

        NGSI.XML.createDocument = function createDocument(namespaceURL, rootTagName, doctype) {
            var doc = new ActiveXObject("MSXML2.DOMDocument");
            // TODO take into account doctype
            doc.appendChild(NGSI.XML.createElementNS(doc, namespaceURL, rootTagName));
            return doc;
        };

    } else {

        NGSI.XML.createDocument = function createDocument(namespaceURL, rootTagName, doctype) {
            throw new Error('createDocument is not supported in this browser');
        };
    }

    if (window.DOMParser) {

        NGSI.XML.parseFromString = function parseFromString(text, type, fromAjax) {
            var result, new_header, parser = new DOMParser();

            fromAjax = fromAjax !== undefined ? fromAjax : true;

            if (fromAjax) {
                // Remove encoding from the xml header as responseText is allways utf-8
                result = text.match(new RegExp('<?xml(?:[^\/]|\/[^>])*standalone="([^"]+)"(?:[^\/]|\/[^>])*?>'));
                if (result && (result[1] === 'yes' || result[1] === 'no')) {
                    new_header = '<?xml version="1.0" standalone="' + result[1] + '" ?>';
                } else {
                    new_header = '<?xml version="1.0" ?>';
                }
                text = text.replace(/<\?xml([^\/]|\/[^>])*\?>/g, new_header);
            }

            return parser.parseFromString(text, type);
        };

    } else if (window.ActiveXObject) {

        NGSI.XML.parseFromString = function parseFromString(text, type, fromAjax) {
            var xml = new ActiveXObject("Microsoft.XMLDOM");
            xml.async = false;
            xml.loadXML(text);
            return xml;
        };

    } else {

        NGSI.XML.parseFromString = function parseFromString(text, type, fromAjax) {
            var req = new XMLHttpRequest();
            req.open('GET', 'data:' + (type || "application/xml") +
                     ';charset=utf-8,' + encodeURIComponent(text), false);
            if (req.overrideMimeType) {
                req.overrideMimeType(type);
            }
            req.send(null);
            return req.responseXML;
        };

    }

    /* NGSI.XML.getTextContent */

    NGSI.XML.getTextContent = function getTextContent(element) {
        if ("textContent" in element) {
            return element.textContent;
        } else if ("innerText" in element) {
            return element.innerText;
        } else if ("nodeValue" in element) {
            return element.nodeValue;
        }
        return "";
    };

    /* NGSI.XML.setTextContent */

    NGSI.XML.setTextContent = function setTextContent(element, text) {
        if ("textContent" in element) {
            element.textContent = text;
        } else if ("innerText" in element) {
            element.innerText = text;
        } else if ("text" in element) {
            // IE XML Elements
            element.text = text;
        } else if ("nodeValue" in element) {
            element.nodeValue = text;
        }
    };

    /* NGSI.XML.serialize */

    if (window.XMLSerializer) {

        NGSI.XML.serialize = function serialize(node) {
            return (new XMLSerializer()).serializeToString(node);
        };

    } else {

        NGSI.XML.serialize = function serialize(node) {
            if (node.xml) {
                return node.xml;
            } else {
                throw new Error("Error serializating xml");
            }
        };

    }

    NGSI.XML.getChildElementByTagName = function getChildElementByTagName(element, tagName) {
        var xpathResult = element.ownerDocument.evaluate(tagName, element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return xpathResult.singleNodeValue;
    };

    NGSI.XML.getChildElementsByTagName = function getChildElementsByTagName(element, tagName) {
        var xpathResult, result, i;

        xpathResult = element.ownerDocument.evaluate(tagName, element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        result = [];
        for (i = 0; i < xpathResult.snapshotLength; i += 1) {
            result.push(xpathResult.snapshotItem(i));
        }

        return result;
    };

    /* Request utility functions */

    var makeXMLRequest = function makeXMLRequest(url, payload, parse_func, callbacks) {
        this.makeRequest(url, {
            method: 'POST',
            contentType: 'application/xml',
            postBody: NGSI.XML.serialize(payload),
            onSuccess: function (transport) {
                if (typeof callbacks.onSuccess === 'function') {
                    var doc, data;
                    if (transport.responseXML == null) {
                        doc = NGSI.XML.parseFromString(transport.responseText, 'application/xml');
                    } else {
                        doc = transport.responseXML;
                    }
                    data = parse_func(doc, callbacks);

                    callbacks.onSuccess(data);
                }
            },
            onFailure: function (transport) {
                if (typeof callbacks.onFailure === 'function') {
                    callbacks.onFailure();
                }
            },
            onComplete: function (transport) {
                if (typeof callbacks.onComplete === 'function') {
                    callbacks.onComplete();
                }
            }
        });
    };

    /* Request builders */

    var ngsi_build_register_context_request = function ngsi_build_register_context_request(e, attr, duration, providingApplication, regId) {
        var doc, list, registration, entityIdList, entity, entityId, i, id,
            attributeList, attribute, attributeElement, name, type, isDomain,
            durationElement, registrationIdElement;

        doc = NGSI.XML.createDocument(null, 'registerContextRequest');

        list = doc.createElement('contextRegistrationList');
        doc.documentElement.appendChild(list);

        registration = doc.createElement('contextRegistration');
        list.appendChild(registration);

        entityIdList = doc.createElement('entityIdList');
        registration.appendChild(entityIdList);

        for (i = 0; i < e.length; i += 1) {
            entity = e[i];

            entityId = doc.createElement('entityId');
            entityId.setAttribute('type', entity.type);
            entityId.setAttribute('isPattern', 'false');

            id = doc.createElement('id');
            NGSI.XML.setTextContent(id, entity.id);
            entityId.appendChild(id);

            entityIdList.appendChild(entityId);
        }

        attributeList = doc.createElement('contextRegistrationAttributeList');
        registration.appendChild(attributeList);

        for (i = 0; i < attr.length; i += 1) {
            attribute = attr[i];

            attributeElement = doc.createElement('contextRegistrationAttribute');

            name = doc.createElement('name');
            NGSI.XML.setTextContent(name, attribute.name);
            attributeElement.appendChild(name);

            type = doc.createElement('type');
            NGSI.XML.setTextContent(type, attribute.type);
            attributeElement.appendChild(type);

            isDomain = doc.createElement('isDomain');
            NGSI.XML.setTextContent(isDomain, 'false');
            attributeElement.appendChild(isDomain);

            attributeList.appendChild(attributeElement);
        }

        durationElement = doc.createElement('duration');
        NGSI.XML.setTextContent(durationElement, duration);
        doc.documentElement.appendChild(durationElement);

        if (regId != null) {
            registrationIdElement = doc.createElement('registrationId');
            NGSI.XML.setTextContent(registrationIdElement, regId);
            doc.documentElement.appendChild(registrationIdElement);
        }

        return doc;
    };

    var ngsi_build_query_context_request = function ngsi_build_query_context_request(e, attrNames) {
        var doc, entityIdList, entity, entityId, i, id,
            attributeList, attribute, attributeElement;

        doc = NGSI.XML.createDocument(null, 'queryContextRequest');

        entityIdList = doc.createElement('entityIdList');
        doc.documentElement.appendChild(entityIdList);

        for (i = 0; i < e.length; i += 1) {
            entity = e[i];

            entityId = doc.createElement('entityId');
            entityId.setAttribute('type', entity.type);
            entityId.setAttribute('isPattern', 'false');

            id = doc.createElement('id');
            NGSI.XML.setTextContent(id, entity.id);
            entityId.appendChild(id);

            entityIdList.appendChild(entityId);
        }

        if (Array.isArray(attrNames)) {
            attributeList = doc.createElement('attributeList');
            doc.documentElement.appendChild(attributeList);

            for (i = 0; i < attrNames.length; i += 1) {
                attribute = attrNames[i];

                attributeElement = doc.createElement('attribute');
                NGSI.XML.setTextContent(attributeElement, attribute);
                attributeList.appendChild(attributeElement);
            }
        }

        return doc;
    };

    var ngsi_build_update_context_request = function ngsi_build_update_context_request(updateAction, update) {
        var doc, list, entityIdList, entity, entityId, i, j, id, contextElement,
            attributeListElement, attributes, attribute, attributeElement,
            name, type, contextValue, updateActionElement;

        doc = NGSI.XML.createDocument(null, 'updateContextRequest');

        list = doc.createElement('contextElementList');
        doc.documentElement.appendChild(list);

        for (i = 0; i < update.length; i += 1) {

            contextElement = doc.createElement('contextElement');

            // Entity id
            entity = update[i].entity;

            entityId = doc.createElement('entityId');
            entityId.setAttribute('type', entity.type);
            entityId.setAttribute('isPattern', 'false');

            id = doc.createElement('id');
            NGSI.XML.setTextContent(id, entity.id);
            entityId.appendChild(id);

            contextElement.appendChild(entityId);

            // attribute list
            attributes = update[i].attributes;
            attributeListElement = doc.createElement('contextAttributeList');
            for (j = 0; j < attributes.length; j += 1) {
                attribute = attributes[j];
                attributeElement = doc.createElement('contextAttribute');

                name = doc.createElement('name');
                NGSI.XML.setTextContent(name, attribute.name);
                attributeElement.appendChild(name);

                type = doc.createElement('type');
                NGSI.XML.setTextContent(type, attribute.type);
                attributeElement.appendChild(type);

                contextValue = doc.createElement('contextValue');
                NGSI.XML.setTextContent(contextValue, attribute.contextValue);
                attributeElement.appendChild(contextValue);

                attributeListElement.appendChild(attributeElement);
            }
            contextElement.appendChild(attributeListElement);

            list.appendChild(contextElement);
        }

        updateActionElement = doc.createElement('updateAction');
        NGSI.XML.setTextContent(updateActionElement, updateAction);
        doc.documentElement.appendChild(updateActionElement);

        return doc;
    };

    var ngsi_build_discover_context_availability_request = function ngsi_build_discover_context_availability_request(e, attr) {
        var doc, entityIdList, entity, entityId, i, id,
            attributeList, attribute, attributeElement;

        doc = NGSI.XML.createDocument(null, 'discoverContextAvailabilityRequest');

        entityIdList = doc.createElement('entityIdList');
        doc.documentElement.appendChild(entityIdList);

        for (i = 0; i < e.length; i += 1) {
            entity = e[i];

            entityId = doc.createElement('entityId');
            entityId.setAttribute('type', entity.type);
            entityId.setAttribute('isPattern', 'false');

            id = doc.createElement('id');
            NGSI.XML.setTextContent(id, entity.id);
            entityId.appendChild(id);

            entityIdList.appendChild(entityId);
        }

        attributeList = doc.createElement('attributeList');
        doc.documentElement.appendChild(attributeList);

        for (i = 0; i < attr.length; i += 1) {
            attribute = attr[i];

            attributeElement = doc.createElement('attribute');
            NGSI.XML.setTextContent(attributeElement, attribute);
            attributeList.appendChild(attributeElement);
        }

        return doc;
    };


    var ngsi_build_subscribe_context_request = function ngsi_build_subscribe_context_request(e, attr, duration, throttling, cond, callbacks) {
        var doc, entityIdListElement, i, entity, entityIdElement, idElement, attributeListElement, attributeElement, referenceElement, durationElement, notifyConditionsElement, condition, notifyConditionElement, typeElement, condValueListElement, condValueElement, throttlingElement;

        doc = NGSI.XML.createDocument(null, 'subscribeContextRequest');

        entityIdListElement = doc.createElement('entityIdList');
        doc.documentElement.appendChild(entityIdListElement);
        for (i = 0; i < e.length; i += 1) {
            entity = e[i];

            entityIdElement = doc.createElement('entityId');
            entityIdElement.setAttribute('type', entity.type);
            entityIdElement.setAttribute('isPatter', 'true');
            entityIdListElement.appendChild(entityIdElement);

            idElement = doc.createElement('id');
            NGSI.XML.setTextContent(idElement, entity.id);
            entityIdElement.appendChild(idElement);
        }

        attributeListElement = doc.createElement('attributeList');
        doc.documentElement.appendChild(attributeListElement);
        for (i = 0; i < attr.length; i += 1) {
            attributeElement = doc.createElement('attribute');
            NGSI.XML.setTextContent(attributeElement, attr[i]);
            attributeListElement.appendChild(attributeElement);
        }

        referenceElement = doc.createElement('reference');
        NGSI.XML.setTextContent(referenceElement, callbacks.onNotify);
        doc.documentElement.appendChild(referenceElement);

        durationElement = doc.createElement('duration');
        NGSI.XML.setTextContent(durationElement, duration);
        doc.documentElement.appendChild(durationElement);

        notifyConditionsElement = doc.createElement('notifyConditions');
        doc.documentElement.appendChild(notifyConditionsElement);
        for (i = 0; i < cond.length; i += 1) {
            condition = cond[i];

            notifyConditionElement = doc.createElement('notifyCondition');
            notifyConditionsElement.appendChild(notifyConditionElement);

            typeElement = doc.createElement('type');
            NGSI.XML.setTextContent(typeElement, condition.type);
            notifyConditionElement.appendChild(typeElement);

            condValueListElement = doc.createElement('condValueList');
            notifyConditionElement.appendChild(condValueListElement);

            condValueElement = doc.createElement('condValue');
            condValueListElement.appendChild(condValueElement);
        }

        throttlingElement = doc.createElement('throttling');
        NGSI.XML.setTextContent(throttlingElement, throttling);
        doc.documentElement.appendChild(throttlingElement);

        return doc;
    };

    var ngsi_build_update_context_subscription_request = function ngsi_build_update_context_subscription_request(subId, duration, throttling, cond) {

        var doc, durationElement, subscriptionIdElement, notifyConditionsElement,
            notifyConditionElement, condition, typeElement, condValueListElement,
            condValueElement, throttlingElement, i;

        doc = NGSI.XML.createDocument(null, 'updateContextSubscriptionRequest');

        durationElement = doc.createElement('duration');
        NGSI.XML.setTextContent(durationElement, duration);
        doc.documentElement.appendChild(durationElement);

        subscriptionIdElement = doc.createElement('subscriptionId');
        NGSI.XML.setTextContent(subscriptionIdElement, subId);
        doc.documentElement.appendChild(subscriptionIdElement);

        notifyConditionsElement = doc.createElement('notifyConditions');
        doc.documentElement.appendChild(notifyConditionsElement);
        for (i = 0; i < cond.length; i += 1) {
            condition = cond[i];

            notifyConditionElement = doc.createElement('notifyCondition');
            notifyConditionsElement.appendChild(notifyConditionElement);

            typeElement = doc.createElement('type');
            NGSI.XML.setTextContent(typeElement, condition.type);
            notifyConditionElement.appendChild(typeElement);

            condValueListElement = doc.createElement('condValueList');
            notifyConditionElement.appendChild(condValueListElement);

            condValueElement = doc.createElement('condValue');
            condValueListElement.appendChild(condValueElement);
        }

        throttlingElement = doc.createElement('throttling');
        NGSI.XML.setTextContent(throttlingElement, throttling);
        doc.documentElement.appendChild(throttlingElement);

        return doc;
    };

    var ngsi_build_unsubscribe_context_request = function ngsi_build_unsubscribe_context_request(subId) {
        var doc, unsubscribeContextElement, subscriptionIdElement;

        doc = NGSI.XML.createDocument(null, 'unsubscribeContextRequest');

        unsubscribeContextElement = doc.createElement('unsubscribeContext');
        doc.documentElement.appendChild(unsubscribeContextElement);

        subscriptionIdElement = doc.createElement('subscriptionId');
        NGSI.XML.setTextContent(subscriptionIdElement, subId);
        unsubscribeContextElement.appendChild(subscriptionIdElement);

        return doc;
    };

    /* Response parsers */

    var parse_register_context_response =  function parse_register_context_response(doc) {
        var durationElement, data;

        if (doc.documentElement.tagName !== 'registerContextResponse') {
            throw new NGSI.InvalidResponseError('');
        }

        return {
            duration: NGSI.XML.getTextContent(NGSI.XML.getChildElementByTagName(doc.documentElement, 'duration')),
            registrationId: NGSI.XML.getTextContent(NGSI.XML.getChildElementByTagName(doc.documentElement, 'registrationId'))
        };
    };

    var parse_discover_availability_response = function parse_discover_availability_response(doc) {
        var list, registrationResponses, registrationResponse, app,
            entityIdListElement, entityIdList, entityIdElement, nameElement,
            typeElement, entity, idElement, i, j,
            contextRegistrationAttributeListElement, attributeList, attribute,
            providingApplicationElement, data = {};

        if (doc.documentElement.tagName !== 'discoverContextAvailabilityResponse') {
            throw new NGSI.InvalidResponseError('');
        }

        list = NGSI.XML.getChildElementByTagName(doc.documentElement, 'contextRegistrationResponseList');

        registrationResponses = NGSI.XML.getChildElementsByTagName(list, 'contextRegistrationResponse');
        for (i = 0; i < registrationResponses.length; i += 1) {
            registrationResponse = registrationResponses[i];
            app = {
                entities: [],
                attributes: []
            };

            // Entities
            entityIdListElement = NGSI.XML.getChildElementByTagName(registrationResponse, 'entityIdList');
            entityIdList = NGSI.XML.getChildElementsByTagName(entityIdListElement, 'entityId');
            for (j = 0; j < entityIdList.length; j += 1) {
                entityIdElement = NGSI.XML.getChildElementByTagName(entityIdList[j], 'entityId');
                idElement = NGSI.XML.getChildElementByTagName(entityIdElement, 'id');
                entity = {
                    id: NGSI.XML.getTextContent(idElement),
                    type: entityIdElement.getAttribute('type')
                };
                app.entities.push(entity);
            }

            // Attributes
            contextRegistrationAttributeListElement = NGSI.XML.getChildElementByTagName(registrationResponse, 'contextRegistrationAttributeList');
            attributeList = NGSI.XML.getChildElementsByTagName(contextRegistrationAttributeListElement, 'contextRegistrationAttribute');
            for (j = 0; j < attributeList.length; j += 1) {
                nameElement = NGSI.XML.getChildElementByTagName(attributeList[j], 'name');
                typeElement = NGSI.XML.getChildElementByTagName(attributeList[j], 'type');

                attribute = {
                    name: NGSI.XML.getTextContent(nameElement),
                    type: NGSI.XML.getTextContent(typeElement)
                };
                app.attributes.push(attribute);
            }

            providingApplicationElement = NGSI.XML.getChildElementByTagName(registrationResponse, 'providingApplication');
            data[NGSI.XML.getTextContent(providingApplicationElement)] = app;
        }

        return data;
    };

    var parse_context_response_list = function parse_context_response_list(element, options) {
        var contextResponses, contextResponse, entry, entityIdElement, nameElement, flat,
            typeElement, attributeName, contextValueElement, entity, entityId, idElement, i, j,
            contextAttributeListElement, attributeList, attribute,
            data = {};

        flat = !!options.flat;
        contextResponses = NGSI.XML.getChildElementsByTagName(element, 'contextElementResponse');
        for (i = 0; i < contextResponses.length; i += 1) {
            contextResponse = NGSI.XML.getChildElementByTagName(contextResponses[i], 'contextElement');

            if (flat) {
                entry = {};
            } else {
                entry = {
                    entity: null,
                    attributes: {}
                };
            }

            // Entity
            entityIdElement = NGSI.XML.getChildElementByTagName(contextResponse, 'entityId');
            idElement = NGSI.XML.getChildElementByTagName(entityIdElement, 'id');
            entityId = NGSI.XML.getTextContent(idElement);
            if (flat) {
                entry.id = entityId,
                entry.type = entityIdElement.getAttribute('type');
            } else {
                entry.entity = {
                    id: NGSI.XML.getTextContent(idElement),
                    type: entityIdElement.getAttribute('type')
                };
            }

            // Attributes
            contextAttributeListElement = NGSI.XML.getChildElementByTagName(contextResponse, 'contextAttributeList');
            attributeList = NGSI.XML.getChildElementsByTagName(contextAttributeListElement, 'contextAttribute');
            for (j = 0; j < attributeList.length; j += 1) {
                nameElement = NGSI.XML.getChildElementByTagName(attributeList[j], 'name');
                typeElement = NGSI.XML.getChildElementByTagName(attributeList[j], 'type');
                contextValueElement = NGSI.XML.getChildElementByTagName(attributeList[j], 'contextValue');

                attributeName = NGSI.XML.getTextContent(nameElement);
                if (flat) {
                    entry[attributeName] = NGSI.XML.getTextContent(contextValueElement);
                } else {
                    entry.attributes[attributeName] = {
                        name: attributeName,
                        type: NGSI.XML.getTextContent(typeElement),
                        contextValue: NGSI.XML.getTextContent(contextValueElement)
                    };
                }
            }

            data[entityId] = entry;
        }

        return data;
    };

    var parse_query_context_response = function parse_query_context_response(doc, options) {

        if (doc.documentElement.tagName !== 'queryContextResponse') {
            throw new NGSI.InvalidResponseError('');
        }

        return parse_context_response_list(NGSI.XML.getChildElementByTagName(doc.documentElement, 'contextResponseList'), options);
    };

    var parse_update_context_response = function parse_update_context_response(doc, options) {
        if (doc.documentElement.tagName !== 'updateContextResponse') {
            throw new NGSI.InvalidResponseError('');
        }

        return parse_context_response_list(NGSI.XML.getChildElementByTagName(doc.documentElement, 'contextResponseList'), options);
    };

    var parse_subscribe_response_element = function parse_subscribe_response_element(element) {
        var subIdElement = NGSI.XML.getChildElementByTagName(element, 'subscriptionId');
        var durationElement = NGSI.XML.getChildElementByTagName(element, 'duration');
        var throttlingElement = NGSI.XML.getChildElementByTagName(element, 'throttling');

        return {
            subscriptionId: NGSI.XML.getTextContent(subIdElement),
            duration: NGSI.XML.getTextContent(durationElement),
            throttling: NGSI.XML.getTextContent(throttlingElement)
        };
    };

    var parse_subscribe_context_response = function parse_subscribe_context_response(doc) {

        if (doc.documentElement.tagName !== 'subscribeContextResponse') {
            throw new NGSI.InvalidResponseError();
        }

        var subscribeResponse = NGSI.XML.getChildElementByTagName(doc.documentElement, 'subscribeResponse');
        return parse_subscribe_response_element(subscribeResponse);
    };

    var parse_update_context_subscription_response = function parse_update_context_subscription_response(doc) {

        if (doc.documentElement.tagName !== 'updateContextSubscriptionResponse') {
            throw new NGSI.InvalidResponseError();
        }

        var subscribeResponse = NGSI.XML.getChildElementByTagName(doc.documentElement, 'subscribeResponse');
        return parse_subscribe_response_element(subscribeResponse);
    };

    var parse_unsubscribe_context_response = function parse_unsubscribe_context_response(doc) {

        if (doc.documentElement.tagName !== 'unsubscribeContextResponse') {
            throw new NGSI.InvalidResponseError();
        }

        var unsubscribeResponse = NGSI.XML.getChildElementByTagName(doc.documentElement, 'unsubscribeResponse');
        var subIdElement = NGSI.XML.getChildElementByTagName(unsubscribeResponse, 'subscriptionId');

        return {
            subscriptionId: NGSI.XML.getTextContent(subIdElement)
        };
    };

    /* NGSI Connection Error */

    NGSI.ConnectionError = function ConnectionError(message) {
        this.name = 'ConnectionError';
        this.message = message || '';
    };
    NGSI.ConnectionError.prototype = new Error();
    NGSI.ConnectionError.prototype.constructor = NGSI.ConnectionError;

    NGSI.InvalidRequestError = function InvalidRequestError(message) {
        this.name = 'InvalidRequest';
        this.message = message || '';
    };
    NGSI.InvalidRequestError.prototype = new Error();
    NGSI.InvalidRequestError.prototype.constructor = NGSI.InvalidRequestError;

    NGSI.InvalidResponseError = function InvalidResponseError(message) {
        this.name = 'InvalidResponse';
        this.message = message || '';
    };
    NGSI.InvalidResponseError.prototype = new Error();
    NGSI.InvalidResponseError.prototype.constructor = NGSI.InvalidResponseError;


    /* NGSI Connection */
    NGSI.Connection = function NGSIConnection(url, options) {
        this.url = "" + url;

        if (this.url[this.url.length - 1] !== '/') {
            this.url += '/';
        }

        if (options == null) {
            options = {};
        }

        if (typeof options.requestFunction === 'function') {
            this.makeRequest = options.requestFunction;
        }
    };

    NGSI.Connection.prototype.createRegistration = function createRegistration(e, attr, duration, providingApplication, callbacks) {
        if (!Array.isArray(e) || e.length === 0) {
            throw new TypeError();
        }

        if (!Array.isArray(attr)) {
            throw new TypeError();
        }

        if (callbacks == null) {
            callbacks = {};
        }
        if (typeof callbacks !== 'object') {
            throw new TypeError();
        }

        var payload = ngsi_build_register_context_request(e, attr, duration, providingApplication);
        var url = this.url + NGSI.endpoints.REGISTER_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_register_context_response, callbacks);
    };

    NGSI.Connection.prototype.updateRegistration = function updateRegistration(regId, e, attr, duration, providingApplication, callbacks) {
        if (!Array.isArray(e) || e.length === 0) {
            throw new TypeError();
        }

        if (!Array.isArray(attr)) {
            throw new TypeError();
        }

        if (callbacks == null) {
            callbacks = {};
        }
        if (typeof callbacks !== 'object') {
            throw new TypeError();
        }

        var payload = ngsi_build_register_context_request(e, attr, duration, providingApplication, regId);
        var url = this.url + NGSI.endpoints.REGISTER_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_register_context_response, callbacks);
    };

    NGSI.Connection.prototype.cancelRegistration = function cancelRegistration(regId, callbacks) {
        this.updateRegistration(regId, [], [], 0, '', callbacks);
    };

    NGSI.Connection.prototype.discoverAvailability = function discoverAvailability(e, attr, callbacks) {

        if (!Array.isArray(e) || e.length === 0) {
            throw new TypeError();
        }

        if (attr != null && !Array.isArray(attr)) {
            throw new TypeError();
        } else if (attr == null) {
            attr = [];
        }

        if (callbacks == null) {
            callbacks = {};
        }
        if (typeof callbacks !== 'object') {
            throw new TypeError();
        }

        var payload = ngsi_build_discover_context_availability_request(e, attr);
        var url = this.url + NGSI.endpoints.DISCOVER_CONTEXT_AVAILABILITY;

        makeXMLRequest.call(this, url, payload, parse_discover_availability_response, callbacks);
    };

    NGSI.Connection.prototype.createAvailabilitySubscription = function discoverAvailabilitySubscription(e, attr, duration, callback) {
        throw new Error('TBD');
    };

    NGSI.Connection.prototype.updateAvailabilitySubscription = function updateAvailabilitySubscription(subId, e, attr, duration, callback) {
        throw new Error('TBD');
    };

    NGSI.Connection.prototype.cancelAvailabilitySubscription = function cancelAvailabilitySubscription(subId) {
        throw new Error('TBD');
    };

    NGSI.Connection.prototype.query = function query(e, attrNames, callbacks) {
        if (!Array.isArray(e) || e.length === 0) {
            throw new TypeError();
        }

        if (attrNames != null && !Array.isArray(attrNames)) {
            throw new TypeError();
        } else if (attrNames == null) {
            attrNames = [];
        }

        if (callbacks == null) {
            callbacks = {};
        }
        if (typeof callbacks !== 'object') {
            throw new TypeError();
        }

        var payload = ngsi_build_query_context_request(e, attrNames);
        var url = this.url + NGSI.endpoints.QUERY_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_query_context_response, callbacks);
    };

    NGSI.Connection.prototype.updateAttributes = function updateAttributes(update, callbacks) {
        if (!Array.isArray(update) || update.length === 0) {
            throw new TypeError();
        }

        if (callbacks == null) {
            callbacks = {};
        }
        if (typeof callbacks !== 'object') {
            throw new TypeError();
        }

        var payload = ngsi_build_update_context_request('UPDATE', update);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_update_context_response, callbacks);
    };

    NGSI.Connection.prototype.addAttributes = function addAttributes(toAdd, callbacks) {
        var payload = ngsi_build_update_context_request('APPEND', toAdd);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_update_context_response, callbacks);
    };

    NGSI.Connection.prototype.deleteAttributes = function deleteAttributes(toDelete, callbacks) {
        var payload = ngsi_build_update_context_request('DELETE', toDelete);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_update_context_response, callbacks);
    };

    NGSI.Connection.prototype.createSubscription = function createSubscription(e, attr, duration, throttling, cond, callbacks) {
        var payload = ngsi_build_subscribe_context_request(e, attr, duration, throttling, cond, callbacks);
        var url = this.url + NGSI.endpoints.SUBSCRIBE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_subscribe_context_response, callbacks);
    };

    NGSI.Connection.prototype.updateSubscription = function updateSubscription(subId, duration, throttling, cond, callbacks) {
        var payload = ngsi_build_update_context_subscription_request(subId, duration, throttling, cond);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT_SUBSCRIPTION;

        makeXMLRequest.call(this, url, payload, parse_update_context_subscription_response, callbacks);
    };

    NGSI.Connection.prototype.cancelSubscription = function cancelSubscription(subId, callbacks) {
        var payload = ngsi_build_unsubscribe_context_request(subId);
        var url = this.url + NGSI.endpoints.UNSUBSCRIBE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_unsubscribe_context_response, callbacks);
    };

    window.NGSI = NGSI;
})();
