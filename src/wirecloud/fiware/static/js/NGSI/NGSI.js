/*
 *     (C) Copyright 2013 CoNWeT Lab - Universidad Politécnica de Madrid
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
 *     Linking this library statically or dynamically with other modules is
 *     making a combined work based on this library.  Thus, the terms and
 *     conditions of the GNU Affero General Public License cover the whole
 *     combination.
 *
 *     As a special exception, the copyright holders of this library give you
 *     permission to link this library with independent modules to produce an
 *     executable, regardless of the license terms of these independent
 *     modules, and to copy and distribute the resulting executable under
 *     terms of your choice, provided that you also meet, for each linked
 *     independent module, the terms and conditions of the license of that
 *     module.  An independent module is a module which is not derived from
 *     or based on this library.  If you modify this library, you may extend
 *     this exception to your version of the library, but you are not
 *     obligated to do so.  If you do not wish to do so, delete this
 *     exception statement from your version.
 *
 */

/*global ActiveXObject, MashupPlatform*/

(function () {

    "use strict";

    var NGSI;
    /* Detect Node.js */
    if ((typeof require == 'function') && typeof exports != null) {
        NGSI = exports;
    } else {
        NGSI = {};
    }

    NGSI.endpoints = {
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
    };

    NGSI.proxy_endpoints = {
        EVENTSOURCE_COLLECTION: 'eventsource',
        CALLBACK_COLLECTION: 'callbacks'
    };

    /* XML support */

    NGSI.XML = {};

    if (document != null && typeof document === 'object' && typeof document.implementation == 'object' && document.implementation.createDocument) {

        /**
         * creates a new DOMDocument
         */
        NGSI.XML.createDocument = function createDocument(namespaceURL, rootTagName, doctype) {
            return document.implementation.createDocument(namespaceURL, rootTagName, null);
        };

    } else if (typeof DOMImplementation !== 'undefined') {

        /**
         * creates a new DOMDocument
         */
        NGSI.XML.createDocument = function createDocument(namespaceURL, rootTagName, doctype) {
            var implementation = new DOMImplementation();
            return implementation.createDocument(namespaceURL, rootTagName, null);
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

    if (typeof DOMParser !== 'undefined') {

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

    if (typeof XMLSerializer !== 'undefined') {

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

    var ngsi_build_entity_id_element = function ngsi_build_entity_id_element(doc, entity) {
        var entityId, id;

        entityId = doc.createElement('entityId');

        if (entity.type != null) {
            entityId.setAttribute('type', entity.type);
        }
        entityId.setAttribute('isPattern', (typeof entity.isPattern === 'string' && entity.isPattern.trim().toLowerCase() === 'true') || (entity.isPattern === true));

        id = doc.createElement('id');
        NGSI.XML.setTextContent(id, entity.id);
        entityId.appendChild(id);

        return entityId;
    };

    /* Request builders */

    var ngsi_build_register_context_request = function ngsi_build_register_context_request(e, attr, duration, providingApplication, regId) {
        var doc, list, registration, entityIdList, i, attributeList, attribute,
            attributeElement, name, type, isDomain, durationElement,
            registrationIdElement, providingApplicationElement;

        doc = NGSI.XML.createDocument(null, 'registerContextRequest');

        list = doc.createElement('contextRegistrationList');
        doc.documentElement.appendChild(list);

        registration = doc.createElement('contextRegistration');
        list.appendChild(registration);

        entityIdList = doc.createElement('entityIdList');
        registration.appendChild(entityIdList);

        for (i = 0; i < e.length; i += 1) {
            entityIdList.appendChild(ngsi_build_entity_id_element(doc, e[i]));
        }

        attributeList = doc.createElement('contextRegistrationAttributeList');
        registration.appendChild(attributeList);

        for (i = 0; i < attr.length; i += 1) {
            attribute = attr[i];

            attributeElement = doc.createElement('contextRegistrationAttribute');

            name = doc.createElement('name');
            NGSI.XML.setTextContent(name, attribute.name);
            attributeElement.appendChild(name);

            isDomain = doc.createElement('isDomain');
            NGSI.XML.setTextContent(isDomain, 'false');
            attributeElement.appendChild(isDomain);

            if (attribute.type != null) {
                type = doc.createElement('type');
                NGSI.XML.setTextContent(type, attribute.type);
                attributeElement.appendChild(type);
            }

            attributeList.appendChild(attributeElement);
        }

        providingApplicationElement = doc.createElement('providingApplication');
        NGSI.XML.setTextContent(providingApplicationElement, providingApplication);
        registration.appendChild(providingApplicationElement);

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
        var doc, entityIdList, i, id, attributeList, attribute,
            attributeElement;

        doc = NGSI.XML.createDocument(null, 'queryContextRequest');

        entityIdList = doc.createElement('entityIdList');
        doc.documentElement.appendChild(entityIdList);

        for (i = 0; i < e.length; i += 1) {
            entityIdList.appendChild(ngsi_build_entity_id_element(doc, e[i]));
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
        var doc, list, i, j, contextElement, attributeListElement, attributes,
            attribute, attributeElement, name, type, contextValue,
            updateActionElement;

        doc = NGSI.XML.createDocument(null, 'updateContextRequest');

        list = doc.createElement('contextElementList');
        doc.documentElement.appendChild(list);

        for (i = 0; i < update.length; i += 1) {

            contextElement = doc.createElement('contextElement');

            // Entity id
            contextElement.appendChild(ngsi_build_entity_id_element(doc, update[i].entity));

            // attribute list
            attributes = update[i].attributes;
            attributeListElement = doc.createElement('contextAttributeList');
            for (j = 0; j < attributes.length; j += 1) {
                attribute = attributes[j];
                attributeElement = doc.createElement('contextAttribute');

                name = doc.createElement('name');
                NGSI.XML.setTextContent(name, attribute.name);
                attributeElement.appendChild(name);

                if (attribute.type != null) {
                    type = doc.createElement('type');
                    NGSI.XML.setTextContent(type, attribute.type);
                    attributeElement.appendChild(type);
                }

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
        var doc, entityIdList, i, attributeList, attribute, attributeElement;

        doc = NGSI.XML.createDocument(null, 'discoverContextAvailabilityRequest');

        entityIdList = doc.createElement('entityIdList');
        doc.documentElement.appendChild(entityIdList);

        for (i = 0; i < e.length; i += 1) {
            entityIdList.appendChild(ngsi_build_entity_id_element(doc, e[i]));
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

    var ngsi_build_subscribe_update_context_availability_request = function ngsi_build_subscribe_update_context_availability_request(rootElement, e, attr, duration, restriction, subscriptionId, onNotify) {
        var doc, entityIdListElement, i, attributeListElement,
            attributeElement, referenceElement, durationElement,
            restrictionElement, attributeExpressionElement,
            subscriptionIdElement;

        doc = NGSI.XML.createDocument(null, rootElement);

        entityIdListElement = doc.createElement('entityIdList');
        doc.documentElement.appendChild(entityIdListElement);
        for (i = 0; i < e.length; i += 1) {
            entityIdListElement.appendChild(ngsi_build_entity_id_element(doc, e[i]));
        }

        if (Array.isArray(attr) && attr.length > 0) {
            attributeListElement = doc.createElement('attributeList');
            doc.documentElement.appendChild(attributeListElement);
            for (i = 0; i < attr.length; i += 1) {
                attributeElement = doc.createElement('attribute');
                NGSI.XML.setTextContent(attributeElement, attr[i]);
                attributeListElement.appendChild(attributeElement);
            }
        }

        referenceElement = doc.createElement('reference');
        NGSI.XML.setTextContent(referenceElement, onNotify);
        doc.documentElement.appendChild(referenceElement);

        if (duration != null) {
            durationElement = doc.createElement('duration');
            NGSI.XML.setTextContent(durationElement, duration);
            doc.documentElement.appendChild(durationElement);
        }

        if (restriction != null && typeof restriction === 'object') {
            restrictionElement = doc.createElement('restriction');
            doc.documentElement.appendChild(restrictionElement);

            attributeExpressionElement = doc.createElement('attributeExpression');
            NGSI.XML.setTextContent(attributeExpressionElement, restriction.attributeExpression);
            restrictionElement.appendChild(attributeExpressionElement);

            // TODO scope
        }

        if (subscriptionId != null) {
            subscriptionIdElement = doc.createElement('subscriptionId');
            NGSI.XML.setTextContent(subscriptionId, subscriptionId);
            doc.documentElement.appendChild(subscriptionIdElement);
        }

        return doc;
    };

    var ngsi_build_unsubscribe_context_availability_request = function ngsi_build_unsubscribe_context_availability_request(subId) {
        var doc, subscriptionIdElement;

        doc = NGSI.XML.createDocument(null, 'unsubscribeContextAvailabilityRequest');

        subscriptionIdElement = doc.createElement('subscriptionId');
        NGSI.XML.setTextContent(subscriptionIdElement, subId);
        doc.documentElement.appendChild(subscriptionIdElement);

        return doc;
    };

    var ngsi_build_subscribe_update_context_request = function ngsi_build_subscribe_update_context_request(rootElement, e, attr, duration, throttling, conditions, onNotify) {
        var doc, entityIdListElement, i, j, attributeListElement,
            attributeElement, referenceElement, durationElement,
            notifyConditionsElement, condition, notifyConditionElement,
            typeElement, condValueListElement, condValueElement,
            throttlingElement;

        doc = NGSI.XML.createDocument(null, rootElement);

        entityIdListElement = doc.createElement('entityIdList');
        doc.documentElement.appendChild(entityIdListElement);
        for (i = 0; i < e.length; i += 1) {
            entityIdListElement.appendChild(ngsi_build_entity_id_element(doc, e[i]));
        }

        if (Array.isArray(attr)) {
            attributeListElement = doc.createElement('attributeList');
            doc.documentElement.appendChild(attributeListElement);
            for (i = 0; i < attr.length; i += 1) {
                attributeElement = doc.createElement('attribute');
                NGSI.XML.setTextContent(attributeElement, attr[i]);
                attributeListElement.appendChild(attributeElement);
            }
        }

        if (rootElement === 'subscribeContextRequest') {
            referenceElement = doc.createElement('reference');
            NGSI.XML.setTextContent(referenceElement, onNotify);
            doc.documentElement.appendChild(referenceElement);
        }

        if (duration != null) {
            durationElement = doc.createElement('duration');
            NGSI.XML.setTextContent(durationElement, duration);
            doc.documentElement.appendChild(durationElement);
        }

        if (Array.isArray(conditions)) {
            notifyConditionsElement = doc.createElement('notifyConditions');
            doc.documentElement.appendChild(notifyConditionsElement);
            for (i = 0; i < conditions.length; i += 1) {
                condition = conditions[i];

                notifyConditionElement = doc.createElement('notifyCondition');
                notifyConditionsElement.appendChild(notifyConditionElement);

                typeElement = doc.createElement('type');
                NGSI.XML.setTextContent(typeElement, condition.type);
                notifyConditionElement.appendChild(typeElement);

                if (Array.isArray(condition.condValues)) {
                    condValueListElement = doc.createElement('condValueList');
                    notifyConditionElement.appendChild(condValueListElement);

                    for (j = 0; j < condition.condValues; j += 1) {
                        condValueElement = doc.createElement('condValue');
                        NGSI.XML.setTextContent(condValueElement, condition.condValues[j]);
                        condValueListElement.appendChild(condValueElement);
                    }
                }
            }
        }

        if (throttling != null) {
            throttlingElement = doc.createElement('throttling');
            NGSI.XML.setTextContent(throttlingElement, throttling);
            doc.documentElement.appendChild(throttlingElement);
        }

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

        if (doc.documentElement.tagName !== 'registerContextResponse') {
            throw new NGSI.InvalidResponseError('');
        }

        return {
            duration: NGSI.XML.getTextContent(NGSI.XML.getChildElementByTagName(doc.documentElement, 'duration')),
            registrationId: NGSI.XML.getTextContent(NGSI.XML.getChildElementByTagName(doc.documentElement, 'registrationId'))
        };
    };

    var parse_context_registration_response_list = function parse_context_registration_response_list(list) {
        var registrationResponses, registrationResponse, app,
            contextRegistrationElement, entityIdListElement, entityIdList,
            entityIdElement, nameElement, typeElement, entity, idElement, i, j,
            contextRegistrationAttributeListElement, attributeList, attribute,
            providingApplicationElement, data = {};

        registrationResponses = NGSI.XML.getChildElementsByTagName(list, 'contextRegistrationResponse');
        for (i = 0; i < registrationResponses.length; i += 1) {
            registrationResponse = registrationResponses[i];
            app = {
                entities: [],
                attributes: []
            };

            contextRegistrationElement = NGSI.XML.getChildElementByTagName(registrationResponse, 'contextRegistration');

            // Entities
            entityIdListElement = NGSI.XML.getChildElementByTagName(contextRegistrationElement, 'entityIdList');
            if (entityIdListElement != null) {
                entityIdList = NGSI.XML.getChildElementsByTagName(entityIdListElement, 'entityId');
                for (j = 0; j < entityIdList.length; j += 1) {
                    entityIdElement = entityIdList[j];
                    idElement = NGSI.XML.getChildElementByTagName(entityIdElement, 'id');
                    entity = {
                        id: NGSI.XML.getTextContent(idElement),
                        type: entityIdElement.getAttribute('type')
                    };
                    app.entities.push(entity);
                }
            }

            // Attributes
            contextRegistrationAttributeListElement = NGSI.XML.getChildElementByTagName(contextRegistrationElement, 'contextRegistrationAttributeList');
            if (contextRegistrationAttributeListElement != null) {
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
            }

            providingApplicationElement = NGSI.XML.getChildElementByTagName(contextRegistrationElement, 'providingApplication');
            data[NGSI.XML.getTextContent(providingApplicationElement)] = app;
        }

        return data;
    };

    var parse_discover_context_availability_response = function parse_discover_context_availability_response(doc) {
        if (doc.documentElement.tagName !== 'discoverContextAvailabilityResponse') {
            throw new NGSI.InvalidResponseError('');
        }

        var list = NGSI.XML.getChildElementByTagName(doc.documentElement, 'contextRegistrationResponseList');
        return parse_context_registration_response_list(list);
    };

    var parse_subscribe_update_context_availability_response = function parse_subscribe_update_context_availability_response(doc) {
        var data, durationElement, errorCodeElement;

        data = {
            subscriptionId: NGSI.XML.getTextContent(NGSI.XML.getChildElementByTagName(doc.documentElement, 'subscriptionId'))
        };

        durationElement = NGSI.XML.getChildElementByTagName(doc.documentElement, 'duration');
        if (durationElement !== null) {
            data.duration = NGSI.XML.getTextContent(durationElement);
        }

        errorCodeElement = NGSI.XML.getChildElementByTagName(doc.documentElement, 'errorCode');
        if (errorCodeElement !== null) {
            data.errorCode = NGSI.XML.getTextContent(errorCodeElement);
        }

        return data;
    };

    var parse_unsubscribe_context_availability_response = function parse_unsubscribe_context_availability_response(doc) {
        if (doc.documentElement.tagName !== 'unsubscribeContextAvailabilityResponse') {
            throw new NGSI.InvalidResponseError('');
        }

        return {
            subscriptionId: NGSI.XML.getTextContent(NGSI.XML.getChildElementByTagName(doc.documentElement, 'subscriptionId')),
            statusCode: NGSI.XML.getTextContent(NGSI.XML.getChildElementByTagName(doc.documentElement, 'statusCode'))
        };
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
        var data, durationElement, throttlingElement;

        var subIdElement = NGSI.XML.getChildElementByTagName(element, 'subscriptionId');
        data = {
            subscriptionId: NGSI.XML.getTextContent(subIdElement)
        };

        durationElement = NGSI.XML.getChildElementByTagName(element, 'duration');
        if (durationElement != null) {
            data.duration = NGSI.XML.getTextContent(durationElement);
        }

        throttlingElement = NGSI.XML.getChildElementByTagName(element, 'throttling');
        if (throttlingElement != null) {
            data.throttling = NGSI.XML.getTextContent(throttlingElement);
        }

        return data;
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

    var parse_notify_context_availability_request = function parse_notify_context_availability_request(doc, options) {
        var subscriptionIdElement, originatorElement, data;

        if (doc.documentElement.tagName !== 'notifyContextAvailabilityRequest') {
            throw new NGSI.InvalidResponseError();
        }

        var list = NGSI.XML.getChildElementByTagName(doc.documentElement, 'contextRegistrationResponseList');
        return parse_context_registration_response_list(list);
    };

    var parse_notify_context_request = function parse_notify_context_request(doc, options) {
        var subscriptionIdElement, originatorElement, data;

        if (doc.documentElement.tagName !== 'notifyContextRequest') {
            throw new NGSI.InvalidResponseError();
        }

        data = parse_context_response_list(NGSI.XML.getChildElementByTagName(doc.documentElement, 'contextResponseList'), options);

        if (!options.flat) {
            data = {elements: data};
            subscriptionIdElement = NGSI.XML.getChildElementByTagName(doc.documentElement, 'subscriptionId');
            originatorElement = NGSI.XML.getChildElementByTagName(doc.documentElement, 'originator');
            data.subscriptionId = NGSI.XML.getTextContent(subscriptionIdElement);
            data.originator = NGSI.XML.getTextContent(originatorElement);
        }

        return data;
    };

    var init = function init() {
        this.connecting = true;

        this.makeRequest(this.url + NGSI.proxy_endpoints.EVENTSOURCE_COLLECTION, {
            method: 'POST',
            context: this,
            onSuccess: function (response) {
                this.source_url = response.getHeader('Location');
                connect_to_eventsource.call(this);
            },
            onFailure: function () {
                this.connected = false;
                this.connecting = false;
            }
        });
    };

    var connect_to_eventsource = function connect_to_eventsource() {
        var source, closeTimeout;

        source = new EventSource(this.source_url);
        source.addEventListener('init', function wait_load(e) {
            var data, i;

            data = JSON.parse(e.data);

            clearTimeout(closeTimeout);
            source.removeEventListener('init', wait_load, true);
            this.connected = true;
            this.connecting = false;
            this.connection_id = data.id;

            for (i = 0; i < this.onload_callbacks.length; i += 1) {
                try {
                    this.onload_callbacks[i]();
                } catch (e) {}
            }
            this.onload_callbacks = [];
            this.onerror_callbacks = [];

            source.addEventListener('close', function () {
                this.connected = false;
            }.bind(this), true);
            source.addEventListener('notification', function (e) {
                var data, callback_id;

                data = JSON.parse(e.data);
                if (typeof this.callbacks[data.callback_id] === 'function') {
                    this.callbacks[data.callback_id](data.payload);
                }
            }.bind(this), true);
        }.bind(this), true);

        closeTimeout = setTimeout(function () {
            var i;

            for (i = 0; i < this.onerror_callbacks.length; i += 1) {
                try {
                    this.onerror_callbacks[i]();
                } catch (e) {}
            }
            this.onload_callbacks = [];
            this.onerror_callbacks = [];

            source.close();
        }, 30000);
    };

    var ProxyConnection = function ProxyConnection(url, /* TODO */ makeRequest) {
        this.connected = false;
        this.connecting = false;
        this.url = url;
        this.makeRequest = makeRequest;
        this.callbacks = {};
        this.onload_callbacks = [];
        this.onerror_callbacks = [];
    };

    ProxyConnection.prototype.connect = function connect(options) {
        if (options == null) {
            options = {};
        }

        if (this.connected === false && this.connecting === false) {
            if (typeof options.onSuccess === 'function') {
                this.onload_callbacks.push(options.onSuccess);
            }

            if (typeof options.onFailure === 'function') {
                this.onerror_callbacks.push(options.onFailure);
            }

            init.call(this);
        } else {
            if (typeof options.onSuccess === 'function') {
                options.onSuccess();
            }
        }
    };

    ProxyConnection.prototype.request_callback = function request_callback(callback, onSuccess, onFailure) {
        if (typeof callback === 'funtion') {
            onSuccess(callback);
            return;
        }

        var wrappedOnSuccess = function () {
            this.makeRequest(this.url + NGSI.proxy_endpoints.CALLBACK_COLLECTION, {
                contentType: 'application/json',
                postBody: JSON.stringify({connection_id: this.connection_id}),
                onSuccess: function (response) {
                    var data = JSON.parse(response.responseText);
                    this.callbacks[data.callback_id] = callback;
                    onSuccess(data);
                }.bind(this),
                onFailure: function () {
                    if (typeof onFailure === 'function') {
                        onFailure();
                    }
                }
            });
        }.bind(this);

        if (this.connected === false) {
            this.connect({
                onSuccess: wrappedOnSuccess,
                onFailure: function () {
                    if (typeof onFailure === 'function') {
                        onFailure();
                    }
                }
            });
        } else {
            wrappedOnSuccess();
        }
    };

    ProxyConnection.prototype.close_callback = function close_callback(callback_id, onSuccess, onFailure) {
        this.makeRequest(this.url + NGSI.proxy_endpoints.CALLBACK_COLLECTION + '/' + callback_id, {
            method: 'DELETE',
            onSuccess: function (response) {
                if (typeof onSuccess === 'function') {
                    onSuccess();
                }
            },
            onFailure: function (response) {
                if (typeof onFailure === 'function') {
                    onFailure();
                }
            }
        });
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

        if (typeof options.ngsi_proxy_url === 'string') {
            this.ngsi_proxy = new ProxyConnection(options.ngsi_proxy_url, this.makeRequest);
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

        makeXMLRequest.call(this, url, payload, parse_discover_context_availability_response, callbacks);
    };

    NGSI.Connection.prototype.createAvailabilitySubscription = function discoverAvailabilitySubscription(e, attr, duration, restriction, callbacks) {

        if (!Array.isArray(e) || e.length === 0) {
            throw new TypeError();
        }

        if (attr != null && !Array.isArray(attr)) {
            throw new TypeError();
        }

        if (callbacks == null || typeof callbacks !== 'object') {
            throw new TypeError();
        }
        if (typeof callbacks.onNotify != 'string' && typeof callbacks.onNotify != 'function') {
            throw new TypeError('Invalid onNotify callback');
        }
        if (typeof callbacks.onNotify === 'function' && this.ngsi_proxy == null) {
            throw new Error('A ngsi-proxy is needed for using local onNotify callbacks');
        }

        var url = this.url + NGSI.endpoints.SUBSCRIBE_CONTEXT_AVAILABILITY;
        if (typeof callbacks.onNotify === 'function' && this.ngsi_proxy != null) {

            var onNotify = function onNotify(payload) {
                var doc = NGSI.XML.parseFromString(payload, 'application/xml');
                var data = parse_notify_context_availability_request(doc, callbacks);
                callbacks.onNotify(data);
            };

            this.ngsi_proxy.request_callback(onNotify, function (proxy_callback) {
                var payload = ngsi_build_subscribe_update_context_availability_request('subscribeContextAvailabilityRequest', e, attr, duration, restriction, null, proxy_callback.url);

                var oldOnFailure = callbacks.onFailure;
                callbacks.onFailure = function () {
                    this.ngsi_proxy.close_callback(proxy_callback.callback_id);
                    if (typeof oldOnFailure === 'function') {
                        oldOnFailure();
                    }
                }.bind(this);

                makeXMLRequest.call(this, url, payload, parse_subscribe_update_context_availability_response, callbacks);
            }.bind(this), function () {
                if (typeof callbacks.onFailure === 'function') {
                    callbacks.onFailure();
                }
            });
        } else {
            var payload = ngsi_build_subscribe_update_context_availability_request('subscribeContextAvailabilityRequest', e, attr, duration, restriction, null, callbacks.onNotify);
            makeXMLRequest.call(this, url, payload, parse_subscribe_update_context_availability_response, callbacks);
        }
    };

    NGSI.Connection.prototype.updateAvailabilitySubscription = function updateAvailabilitySubscription(subId, e, attr, duration, restriction, callbacks) {
        if (!Array.isArray(e) || e.length === 0) {
            throw new TypeError();
        }

        if (attr != null && !Array.isArray(attr)) {
            throw new TypeError();
        }

        if (callbacks == null) {
            callbacks = {};
        }
        if (typeof callbacks !== 'object') {
            throw new TypeError();
        }

        var payload = ngsi_build_subscribe_update_context_availability_request('updateContextAvailabilitySubscriptionRequest', e, attr, duration, restriction, subId);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT_AVAILABILITY_SUBSCRIPTION;

        makeXMLRequest.call(this, url, payload, parse_subscribe_update_context_availability_response, callbacks);
    };

    NGSI.Connection.prototype.cancelAvailabilitySubscription = function cancelAvailabilitySubscription(subId, callbacks) {
        if (subId == null) {
            throw new TypeError();
        }

        if (callbacks == null) {
            callbacks = {};
        }
        if (typeof callbacks !== 'object') {
            throw new TypeError();
        }

        var payload = ngsi_build_unsubscribe_context_availability_request(subId);
        var url = this.url + NGSI.endpoints.UNSUBSCRIBE_CONTEXT_AVAILABILITY;

        makeXMLRequest.call(this, url, payload, parse_unsubscribe_context_availability_response, callbacks);
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
        if (!Array.isArray(toAdd) || toAdd.length === 0) {
            throw new TypeError();
        }

        if (callbacks == null) {
            callbacks = {};
        }
        if (typeof callbacks !== 'object') {
            throw new TypeError();
        }

        var payload = ngsi_build_update_context_request('APPEND', toAdd);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_update_context_response, callbacks);
    };

    NGSI.Connection.prototype.deleteAttributes = function deleteAttributes(toDelete, callbacks) {
        if (!Array.isArray(toDelete) || toDelete.length === 0) {
            throw new TypeError();
        }

        if (callbacks == null) {
            callbacks = {};
        }
        if (typeof callbacks !== 'object') {
            throw new TypeError();
        }

        var payload = ngsi_build_update_context_request('DELETE', toDelete);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_update_context_response, callbacks);
    };

    NGSI.Connection.prototype.createSubscription = function createSubscription(e, attr, duration, throttling, cond, callbacks) {
        if (!Array.isArray(e) || e.length === 0) {
            throw new TypeError();
        }

        if (callbacks == null || typeof callbacks !== 'object') {
            throw new TypeError();
        }
        if (typeof callbacks.onNotify != 'string' && typeof callbacks.onNotify != 'function') {
            throw new TypeError('Invalid onNotify callback');
        }
        if (typeof callbacks.onNotify === 'function' && this.ngsi_proxy == null) {
            throw new Error('A ngsi-proxy is needed for using local onNotify callbacks');
        }

        var url = this.url + NGSI.endpoints.SUBSCRIBE_CONTEXT;
        if (typeof callbacks.onNotify === 'function' && this.ngsi_proxy != null) {

            var onNotify = function onNotify(payload) {
                var doc = NGSI.XML.parseFromString(payload, 'application/xml');
                var data = parse_notify_context_request(doc, callbacks);
                callbacks.onNotify(data);
            };

            this.ngsi_proxy.request_callback(onNotify, function (proxy_callback) {
                var payload = ngsi_build_subscribe_update_context_request('subscribeContextRequest', e, attr, duration, throttling, cond, proxy_callback.url);

                var oldOnFailure = callbacks.onFailure;
                callbacks.onFailure = function () {
                    this.ngsi_proxy.close_callback(proxy_callback.callback_id);
                    if (typeof oldOnFailure === 'function') {
                        oldOnFailure();
                    }
                }.bind(this);

                makeXMLRequest.call(this, url, payload, parse_subscribe_context_response, callbacks);
            }.bind(this), function () {
                if (typeof callbacks.onFailure === 'function') {
                    callbacks.onFailure();
                }
            });
        } else {
            var payload = ngsi_build_subscribe_update_context_request('subscribeContextRequest', e, attr, duration, throttling, cond, callbacks.onNotify);
            makeXMLRequest.call(this, url, payload, parse_subscribe_context_response, callbacks);
        }
    };

    NGSI.Connection.prototype.updateSubscription = function updateSubscription(subId, duration, throttling, cond, callbacks) {
        if (subId == null) {
            throw new TypeError();
        }

        if (callbacks == null) {
            callbacks = {};
        }
        if (typeof callbacks !== 'object') {
            throw new TypeError();
        }

        var payload = ngsi_build_subscribe_update_context_request('updateContextSubscriptionRequest', subId, duration, throttling, cond);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT_SUBSCRIPTION;

        makeXMLRequest.call(this, url, payload, parse_update_context_subscription_response, callbacks);
    };

    NGSI.Connection.prototype.cancelSubscription = function cancelSubscription(subId, callbacks) {
        if (subId == null) {
            throw new TypeError();
        }

        if (callbacks == null) {
            callbacks = {};
        }
        if (typeof callbacks !== 'object') {
            throw new TypeError();
        }

        var payload = ngsi_build_unsubscribe_context_request(subId);
        var url = this.url + NGSI.endpoints.UNSUBSCRIBE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_unsubscribe_context_response, callbacks);
    };

    if (typeof window !== 'undefined') {
        window.NGSI = NGSI;
    }

})();
