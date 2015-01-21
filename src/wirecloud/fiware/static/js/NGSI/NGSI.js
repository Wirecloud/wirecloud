/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global ActiveXObject, DOMImplementation, EventSource, exports*/

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

    if (typeof document === 'object' && document != null && typeof document.implementation == 'object' && document.implementation.createDocument) {

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

    } else if (typeof window === 'object' && window != null && window.ActiveXObject) {

        NGSI.XML.createDocument = function createDocument(namespaceURL, rootTagName, doctype) {
            var doc = new ActiveXObject("MSXML2.DOMDocument");
            // TODO take into account doctype
            doc.appendChild(NGSI.XML.createElementNS(doc, namespaceURL, rootTagName));
            return doc;
        };

    } else {
        throw new Error('NGSI.js is not able to create DOM documents in this enviroment');
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

    if (typeof XPathResult !== 'undefined') {

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

    } else {

        NGSI.XML.getChildElementByTagName = function getChildElementByTagName(element, tagName) {
            var i, child;

            for (i = 0; i < element.childNodes.length; i += 1) {
                child = element.childNodes[i];
                if (child.nodeType === Node.ELEMENT_TYPE || child.localName === tagName) {
                    return element.childNodes[i];
                }
            }

            return null;
        };

        NGSI.XML.getChildElementsByTagName = function getChildElementsByTagName(element, tagName) {
            var i, child, result = [];

            for (i = 0; i < element.childNodes.length; i += 1) {
                child = element.childNodes[i];
                if (child.nodeType === Node.ELEMENT_TYPE || child.localName === tagName) {
                    result.push(element.childNodes[i]);
                }
            }

            return result;
        };

    }

    /* Request utility functions */

    var makeXMLRequest = function makeXMLRequest(url, payload, parse_func, callbacks, parameters) {
        this.makeRequest(url, {
            method: 'POST',
            contentType: 'application/xml',
            requestHeaders: this.request_headers,
            parameters: parameters,
            postBody: NGSI.XML.serialize(payload),
            onSuccess: function (response) {
                if (typeof callbacks.onSuccess === 'function') {
                    var doc, data;
                    if (response.responseXML == null) {
                        doc = NGSI.XML.parseFromString(response.responseText, 'application/xml');
                    } else {
                        doc = response.responseXML;
                    }
                    try {
                        if (doc.getElementsByTagName('parsererror').length > 0) {
                            throw new NGSI.InvalidResponseError('Server returned invalid xml content');
                        }
                        data = parse_func(doc, callbacks);
                    } catch (e) {
                        if (typeof callbacks.onFailure === 'function') {
                            callbacks.onFailure(e);
                        }
                        return;
                    }

                    callbacks.onSuccess.apply(null, data);
                }
            },
            onFailure: function (response) {
                var error;

                if (typeof callbacks.onFailure === 'function') {
                    if ([0, 502, 504].indexOf(response.status) !== -1) {
                        error = new NGSI.ConnectionError('Connection Error');
                    } else {
                        error = new NGSI.InvalidResponseError('Unexpected error code: ' + response.status);
                    }
                    callbacks.onFailure(error);
                }
            },
            onComplete: function (response) {
                if (typeof callbacks.onComplete === 'function') {
                    callbacks.onComplete();
                }
            }
        });
    };

    var assert_root_element = function assert_root_element(doc, expected_root_element) {
        if (doc.documentElement.tagName !== expected_root_element) {
            throw new NGSI.InvalidResponseError('Unexpected root element in response: ' + doc.documentElement.tagName);
        }
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

    var ngsi_build_scope_restriction_element = function ngsi_build_scope_restriction_element(doc, scope) {
        var restrictionValueElement, vertexListElement, i, vertice,
            vertexElement, latitudeElement, longitudeElement, invertedElement,
            centerLatitudeElement, centerLongitudeElement, radiusElement;

        if ('polygon' in scope.value) {
            restrictionValueElement = doc.createElement('polygon');

            vertexListElement = doc.createElement('vertexList');
            restrictionValueElement.appendChild(vertexListElement);
            for (i = 0; i < scope.value.polygon.vertices.length; i++) {
                vertice = scope.value.polygon.vertices[i];

                vertexElement = doc.createElement('vertex');
                vertexListElement.appendChild(vertexElement);
                latitudeElement = doc.createElement('latitude');
                NGSI.XML.setTextContent(latitudeElement, vertice.latitude);
                vertexElement.appendChild(latitudeElement);
                longitudeElement = doc.createElement('longuitude');
                NGSI.XML.setTextContent(longitudeElement, vertice.longitude);
                vertexElement.appendChild(longitudeElement);
            }

            if (scope.value.polygon.inverted) {
                invertedElement = doc.createElement('inverted');
                NGSI.XML.setTextContent(invertedElement, 'true');
                restrictionValueElement.appendChild(invertedElement);
            }
        } else if ('circle' in scope.value) {
            restrictionValueElement = doc.createElement('circle');

            centerLatitudeElement = doc.createElement('centerLatitude');
            NGSI.XML.setTextContent(centerLatitudeElement, scope.value.circle.centerLatitude);
            restrictionValueElement.appendChild(centerLatitudeElement);
            centerLongitudeElement = doc.createElement('centerLongitude');
            NGSI.XML.setTextContent(centerLongitudeElement, scope.value.circle.centerLongitude);
            restrictionValueElement.appendChild(centerLongitudeElement);
            radiusElement = doc.createElement('radius');
            NGSI.XML.setTextContent(radiusElement, scope.value.circle.radius);
            restrictionValueElement.appendChild(radiusElement);

            if (scope.value.circle.inverted) {
                invertedElement = doc.createElement('inverted');
                NGSI.XML.setTextContent(invertedElement, 'true');
                restrictionValueElement.appendChild(invertedElement);
            }
        }

        return restrictionValueElement;
    };

    var ngsi_build_restriction_element = function ngsi_build_restriction_element(doc, restriction) {
        var restrictionElement, attributeExpressionElement, scopeElement,
            operationScopeElement, scopeTypeElement, scopeValueElement, i;


        restrictionElement = doc.createElement('restriction');

        if (restriction.attributeExpression != null) {
            attributeExpressionElement = doc.createElement('attributeExpression');
            NGSI.XML.setTextContent(attributeExpressionElement, restriction.attributeExpression);
            restrictionElement.appendChild(attributeExpressionElement);
        }

        if (Array.isArray(restriction.scopes)) {
            scopeElement = doc.createElement('scope');
            restrictionElement.appendChild(scopeElement);

            for (i = 0; i < restriction.scopes.length; i++) {
                operationScopeElement = doc.createElement('operationScope');

                scopeTypeElement = doc.createElement('scopeType');
                NGSI.XML.setTextContent(scopeTypeElement, restriction.scopes[i].type);
                operationScopeElement.appendChild(scopeTypeElement);

                scopeValueElement = doc.createElement('scopeValue');
                scopeValueElement.appendChild(ngsi_build_scope_restriction_element(doc, restriction.scopes[i]));
                operationScopeElement.appendChild(scopeValueElement);

                scopeElement.appendChild(operationScopeElement);
            }
        }

        return restrictionElement;
    };

    var ngsi_build_attribute_metadata_element = function ngsi_build_attribute_metadata_element(doc, metadata) {
        var metadataElement, i, contextMetadataElement, nameElement, typeElement, valueElement;

        metadataElement = doc.createElement('metadata');
        for (i = 0; i < metadata.length; i++) {
            contextMetadataElement = doc.createElement('contextMetadata');

            nameElement = doc.createElement('name');
            NGSI.XML.setTextContent(nameElement, metadata[i].name);
            contextMetadataElement.appendChild(nameElement);

            typeElement = doc.createElement('type');
            NGSI.XML.setTextContent(typeElement, metadata[i].type);
            contextMetadataElement.appendChild(typeElement);

            valueElement = doc.createElement('value');
            NGSI.XML.setTextContent(valueElement, metadata[i].value);
            contextMetadataElement.appendChild(valueElement);

            metadataElement.appendChild(contextMetadataElement);
        }

        return metadataElement;
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

    var ngsi_build_query_context_request = function ngsi_build_query_context_request(e, attrNames, restriction) {
        var doc, entityIdList, i, attributeList, attribute,
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

        if (restriction != null) {
            doc.documentElement.appendChild(ngsi_build_restriction_element(doc, restriction));
        }

        return doc;
    };

    var ngsi_build_update_context_request = function ngsi_build_update_context_request(updateAction, update) {
        var doc, list, i, j, contextElement, attributeListElement, attributes,
            attribute, attributeElement, name, type, contextValueElement,
            contextValue, updateActionElement;

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

                contextValueElement = doc.createElement('contextValue');
                if (attribute.contextValue == null) {
                    contextValue = 'emptycontent';
                } else {
                    contextValue = "" + attribute.contextValue;
                    if (contextValue.trim() === '') {
                        contextValue = 'emptycontent';
                    }
                }
                NGSI.XML.setTextContent(contextValueElement, contextValue);
                attributeElement.appendChild(contextValueElement);

                if (Array.isArray(attribute.metadata) && attribute.metadata.length > 0) {
                    attributeElement.appendChild(ngsi_build_attribute_metadata_element(doc, attribute.metadata));
                }

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

        if (restriction != null) {
            doc.documentElement.appendChild(ngsi_build_restriction_element(doc, restriction));
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

    var ngsi_build_subscribe_update_context_request = function ngsi_build_subscribe_update_context_request(subscriptionId, e, attr, duration, throttling, conditions, onNotify) {
        var doc, entityIdListElement, i, j, attributeListElement,
            attributeElement, referenceElement, durationElement,
            notifyConditionsElement, condition, notifyConditionElement,
            typeElement, condValueListElement, condValueElement,
            throttlingElement, subscriptionIdElement;

        if (subscriptionId) {
            doc = NGSI.XML.createDocument(null, 'updateContextSubscriptionRequest');
        } else {
            doc = NGSI.XML.createDocument(null, 'subscribeContextRequest');

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
        }

        if (subscriptionId == null) {
            referenceElement = doc.createElement('reference');
            NGSI.XML.setTextContent(referenceElement, onNotify);
            doc.documentElement.appendChild(referenceElement);
        } else {
            subscriptionIdElement = doc.createElement('subscriptionId');
            NGSI.XML.setTextContent(subscriptionIdElement, subscriptionId);
            doc.documentElement.appendChild(subscriptionIdElement);
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

                    for (j = 0; j < condition.condValues.length; j += 1) {
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
        var doc, subscriptionIdElement;

        doc = NGSI.XML.createDocument(null, 'unsubscribeContextRequest');

        subscriptionIdElement = doc.createElement('subscriptionId');
        NGSI.XML.setTextContent(subscriptionIdElement, subId);
        doc.documentElement.appendChild(subscriptionIdElement);

        return doc;
    };

    /* Response parsers */

    var parse_metadata_element = function parse_metadata_element(metadataElement) {
        var metadata, metadataElements, i, nameElement, typeElement, valueElement;

        metadata = [];
        if (metadataElement == null) {
            return metadata;
        }

        metadataElements = NGSI.XML.getChildElementsByTagName(metadataElement, 'contextMetadata');
        for (i = 0; i < metadataElements.length; i++) {
            nameElement = NGSI.XML.getChildElementByTagName(metadataElements[i], 'name');
            typeElement = NGSI.XML.getChildElementByTagName(metadataElements[i], 'type');
            valueElement = NGSI.XML.getChildElementByTagName(metadataElements[i], 'value');
            metadata.push({
                name: NGSI.XML.getTextContent(nameElement),
                type: NGSI.XML.getTextContent(typeElement),
                value: NGSI.XML.getTextContent(valueElement)
            });
        }

        return metadata;
    };

    var parse_register_context_response =  function parse_register_context_response(doc) {

        assert_root_element(doc, 'registerContextResponse');

        return [{
            duration: NGSI.XML.getTextContent(NGSI.XML.getChildElementByTagName(doc.documentElement, 'duration')),
            registrationId: NGSI.XML.getTextContent(NGSI.XML.getChildElementByTagName(doc.documentElement, 'registrationId'))
        }];
    };

    var parse_context_registration_response_list = function parse_context_registration_response_list(list) {
        var registrationResponses, registrationResponse, registration,
            contextRegistrationElement, entityIdListElement, entityIdList,
            entityIdElement, nameElement, typeElement, entity, idElement, i, j,
            contextRegistrationAttributeListElement, attributeList, attribute,
            providingApplicationElement, data = [];

        registrationResponses = NGSI.XML.getChildElementsByTagName(list, 'contextRegistrationResponse');
        for (i = 0; i < registrationResponses.length; i += 1) {
            registrationResponse = registrationResponses[i];
            registration = {
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
                    registration.entities.push(entity);
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
                    registration.attributes.push(attribute);
                }
            }

            providingApplicationElement = NGSI.XML.getChildElementByTagName(contextRegistrationElement, 'providingApplication');
            registration.providingApplication = NGSI.XML.getTextContent(providingApplicationElement);

            data.push(registration);
        }

        return data;
    };

    var parse_discover_context_availability_response = function parse_discover_context_availability_response(doc) {

        assert_root_element(doc, 'discoverContextAvailabilityResponse');

        var list = NGSI.XML.getChildElementByTagName(doc.documentElement, 'contextRegistrationResponseList');
        return [parse_context_registration_response_list(list)];
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

        return [data];
    };

    var parse_unsubscribe_context_availability_response = function parse_unsubscribe_context_availability_response(doc) {

        assert_root_element(doc, 'unsubscribeContextAvailabilityResponse');

        return [{
            subscriptionId: NGSI.XML.getTextContent(NGSI.XML.getChildElementByTagName(doc.documentElement, 'subscriptionId')),
            statusCode: NGSI.XML.getTextContent(NGSI.XML.getChildElementByTagName(doc.documentElement, 'statusCode'))
        }];
    };

    var parse_context_response_list = function parse_context_response_list(element, update_response, options) {
        var contextResponses, contextResponse, entry, entityIdElement, nameElement, flat,
            typeElement, attributeName, contextValueElement, entityId, idElement, i, j,
            contextAttributeListElement, attributeList, contextValue, data, metadataElement,
            status_info, error_data;

        flat = !!options.flat;
        if (flat) {
            data = {};
        } else {
            data = [];
        }
        error_data = [];
        if (update_response) {
            contextValue = "";
        }

        contextResponses = NGSI.XML.getChildElementsByTagName(element, 'contextElementResponse');
        for (i = 0; i < contextResponses.length; i += 1) {
            contextResponse = NGSI.XML.getChildElementByTagName(contextResponses[i], 'contextElement');
            status_info = process_status_info(contextResponses[i]);

            if (flat) {
                entry = {};
            } else {
                entry = {
                    entity: null,
                    attributes: []
                };
            }

            // Entity
            entityIdElement = NGSI.XML.getChildElementByTagName(contextResponse, 'entityId');
            idElement = NGSI.XML.getChildElementByTagName(entityIdElement, 'id');
            entityId = NGSI.XML.getTextContent(idElement);
            if (status_info.code === 200 && flat) {
                entry.id = entityId;
                entry.type = entityIdElement.getAttribute('type');
            } else {
                entry.entity = {
                    id: NGSI.XML.getTextContent(idElement),
                    type: entityIdElement.getAttribute('type')
                };
            }

            // Attributes
            contextAttributeListElement = NGSI.XML.getChildElementByTagName(contextResponse, 'contextAttributeList');
            if (contextAttributeListElement != null) {
                attributeList = NGSI.XML.getChildElementsByTagName(contextAttributeListElement, 'contextAttribute');
                for (j = 0; j < attributeList.length; j += 1) {
                    nameElement = NGSI.XML.getChildElementByTagName(attributeList[j], 'name');
                    attributeName = NGSI.XML.getTextContent(nameElement);

                    if (!update_response) {
                        contextValueElement = NGSI.XML.getChildElementByTagName(attributeList[j], 'contextValue');
                        contextValue = NGSI.XML.getTextContent(contextValueElement);
                        if (contextValue === 'emptycontent') {
                            contextValue = '';
                        }
                    }

                    if (flat) {
                        entry[attributeName] = contextValue;
                    } else {
                        typeElement = NGSI.XML.getChildElementByTagName(attributeList[j], 'type');
                        metadataElement = NGSI.XML.getChildElementByTagName(attributeList[j], 'metadata');
                        if (update_response) {
                            entry.attributes.push({
                                name: attributeName,
                                type: NGSI.XML.getTextContent(typeElement)
                            });
                            if (metadataElement != null) {
                                entry.attributes[entry.attributes.length - 1].metadata = parse_metadata_element(metadataElement);
                            }
                        } else {
                            entry.attributes.push({
                                name: attributeName,
                                type: NGSI.XML.getTextContent(typeElement),
                                contextValue: contextValue,
                                metadata: parse_metadata_element(metadataElement)
                            });
                        }
                    }
                }
            }

            if (status_info.code === 200) {
                if (flat) {
                    data[entityId] = entry;
                } else {
                    data.push(entry);
                }
            } else {
                if (update_response) {
                    entry.statusCode = status_info;
                }
                error_data.push(entry);
            }
        }

        return [data, error_data];
    };

    var process_status_info = function process_status_info(element) {
        var statusCodeElement, status_info, detailsElement;

        statusCodeElement = NGSI.XML.getChildElementByTagName(element, 'statusCode');

        status_info = {
            code: parseInt(NGSI.XML.getChildElementByTagName(statusCodeElement, 'code').textContent, 10),
            reasonPhrase: NGSI.XML.getChildElementByTagName(statusCodeElement, 'reasonPhrase').textContent
        };

        detailsElement = NGSI.XML.getChildElementByTagName(statusCodeElement, 'details');
        if (detailsElement != null) {
            status_info.details = detailsElement.textContent;
        }

        return status_info;
    };

    var process_error_code = function process_error_code(element) {
        var errorCodeElement, codeElement, reasonPhraseElement, detailsElement, details;

        errorCodeElement = NGSI.XML.getChildElementByTagName(element, 'errorCode');
        if (errorCodeElement != null) {
            codeElement = NGSI.XML.getChildElementByTagName(errorCodeElement, 'code');
            reasonPhraseElement = NGSI.XML.getChildElementByTagName(errorCodeElement, 'reasonPhrase');
            detailsElement = NGSI.XML.getChildElementByTagName(errorCodeElement, 'details');
            if (detailsElement != null) {
                details = detailsElement.textContent;
            }

            throw new NGSI.InvalidRequestError(parseInt(codeElement.textContent, 10), reasonPhraseElement.textContent, details);
        }
    };

    var NGSI_QUERY_COUNT_RE = new RegExp('Count: (\\d+)');
    var NGSI_INVALID_OFFSET_RE = new RegExp('Number of matching entities: (\\d+). Offset is (\\d+)');

    var parse_query_context_response = function parse_query_context_response(doc, options) {
        var details, parsed_details, data;

        assert_root_element(doc, 'queryContextResponse');

        try {
            process_error_code(doc.documentElement);
        } catch (e) {
            switch (e.code) {
            case 200:
                parsed_details = e.details.match(NGSI_QUERY_COUNT_RE);
                if (parsed_details) {
                    details = {
                        "count": parseInt(parsed_details[1], 10)
                    };
                }
                break;
            case 404:
                data = options.flat ? {} : [];
                parsed_details = e.details.match(NGSI_INVALID_OFFSET_RE);
                if (parsed_details) {
                    details = e.details = {
                        "text": e.details,
                        "matches": parseInt(parsed_details[1]),
                        "offset": parseInt(parsed_details[2])
                    };
                }
                if (options.offset != null && options.offset !== 0) {
                    throw e;
                } else {
                    return [data, details];
                }
                break;
            default:
                throw e;
            }
        }

        return [parse_context_response_list(NGSI.XML.getChildElementByTagName(doc.documentElement, 'contextResponseList'), false, options)[0], details];
    };

    var parse_update_context_response = function parse_update_context_response(doc, options) {

        assert_root_element(doc, 'updateContextResponse');

        process_error_code(doc.documentElement);

        return parse_context_response_list(NGSI.XML.getChildElementByTagName(doc.documentElement, 'contextResponseList'), true, options);
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

        assert_root_element(doc, 'subscribeContextResponse');

        var subscribeResponse = NGSI.XML.getChildElementByTagName(doc.documentElement, 'subscribeResponse');
        return [parse_subscribe_response_element(subscribeResponse)];
    };

    var parse_update_context_subscription_response = function parse_update_context_subscription_response(doc) {

        assert_root_element(doc, 'updateContextSubscriptionResponse');

        var subscribeResponse = NGSI.XML.getChildElementByTagName(doc.documentElement, 'subscribeResponse');
        return [parse_subscribe_response_element(subscribeResponse)];
    };

    var parse_unsubscribe_context_response = function parse_unsubscribe_context_response(doc) {

        assert_root_element(doc, 'unsubscribeContextResponse');

        var subIdElement = NGSI.XML.getChildElementByTagName(doc.documentElement, 'subscriptionId');

        return [{
            subscriptionId: NGSI.XML.getTextContent(subIdElement)
        }];
    };

    var parse_notify_context_availability_request = function parse_notify_context_availability_request(doc, options) {

        assert_root_element(doc, 'notifyContextAvailabilityRequest');

        var list = NGSI.XML.getChildElementByTagName(doc.documentElement, 'contextRegistrationResponseList');
        return [parse_context_registration_response_list(list)];
    };

    NGSI.parseNotifyContextRequest = function parseNotifyContextRequest(doc, options) {
        var subscriptionIdElement, originatorElement, data;

        assert_root_element(doc, 'notifyContextRequest');

        data = parse_context_response_list(NGSI.XML.getChildElementByTagName(doc.documentElement, 'contextResponseList'), false, options)[0];

        data = {elements: data};
        subscriptionIdElement = NGSI.XML.getChildElementByTagName(doc.documentElement, 'subscriptionId');
        originatorElement = NGSI.XML.getChildElementByTagName(doc.documentElement, 'originator');
        data.subscriptionId = NGSI.XML.getTextContent(subscriptionIdElement);
        data.originator = NGSI.XML.getTextContent(originatorElement);

        return data;
    };

    var onInitFailure = function (response, error) {
        var i;

        this.connected = false;
        this.connecting = false;

        if (error == null) {
            if ([0, 502, 504].indexOf(response.status) !== -1) {
                error = new NGSI.ConnectionError();
            } else {
                error = new NGSI.InvalidResponseError('Unexpected error code: ' + response.status);
            }
        }

        for (i = 0; i < this.onerror_callbacks.length; i += 1) {
            try {
                this.onerror_callbacks[i](error);
            } catch (e) {}
        }
        this.onload_callbacks = [];
        this.onerror_callbacks = [];

    };

    var init = function init() {
        this.connecting = true;

        this.makeRequest(this.url + NGSI.proxy_endpoints.EVENTSOURCE_COLLECTION, {
            method: 'POST',
            onSuccess: function (response) {
                if (response.status !== 201) {
                    onInitFailure.call(this, response);
                } else {
                    this.source_url = response.getHeader('Location');
                    if (this.source_url == null) {
                        onInitFailure.call(this, response, new NGSI.InvalidResponseError('Missing Location Header'));
                    } else {
                        connect_to_eventsource.call(this);
                    }
                }
            }.bind(this),
            onFailure: onInitFailure.bind(this)
        });
    };

    var connect_to_eventsource = function connect_to_eventsource() {
        var source, closeTimeout;
        var _wait_event_source_init = null;
        var wait_event_source_init = function wait_event_source_init(e) {
            var data, i;

            data = JSON.parse(e.data);

            clearTimeout(closeTimeout);
            source.removeEventListener('init', _wait_event_source_init, true);
            this.connected = true;
            this.connecting = false;
            this.connection_id = data.id;

            for (i = 0; i < this.onload_callbacks.length; i += 1) {
                try {
                    this.onload_callbacks[i]();
                } catch (exception) {}
            }
            this.onload_callbacks = [];
            this.onerror_callbacks = [];

            source.addEventListener('close', function () {
                this.connected = false;
            }.bind(this), true);
            source.addEventListener('notification', function (e) {
                var data;

                data = JSON.parse(e.data);
                this.callbacks[data.callback_id].method(data.payload);
            }.bind(this), true);
        };

        _wait_event_source_init = wait_event_source_init.bind(this);
        source = new EventSource(this.source_url);
        source.addEventListener('init', _wait_event_source_init, true);

        closeTimeout = setTimeout(function () {
            var i, error = new NGSI.ConnectionError("Connection timeout");

            for (i = 0; i < this.onerror_callbacks.length; i += 1) {
                try {
                    this.onerror_callbacks[i](error);
                } catch (e) {}
            }
            this.onload_callbacks = [];
            this.onerror_callbacks = [];

            source.close();
        }.bind(this), 30000);
    };

    NGSI.ProxyConnection = function ProxyConnection(url, /* TODO */ makeRequest) {
        this.url = "" + url;

        if (this.url[this.url.length - 1] !== '/') {
            this.url += '/';
        }

        this.connected = false;
        this.connecting = false;
        this.makeRequest = makeRequest;
        this.callbacks = {};
        this.callbacks_by_subscriptionId = {};
        this.onload_callbacks = [];
        this.onerror_callbacks = [];
    };

    NGSI.ProxyConnection.prototype.connect = function connect(options) {
        if (options == null) {
            options = {};
        }

        if (this.connected === false) {
            if (typeof options.onSuccess === 'function') {
                this.onload_callbacks.push(options.onSuccess);
            }

            if (typeof options.onFailure === 'function') {
                this.onerror_callbacks.push(options.onFailure);
            }
        }

        if (this.connected === false && this.connecting === false) {
            init.call(this);
        } else if (this.connected === true && typeof options.onSuccess === 'function') {
            options.onSuccess();
        }
    };

    NGSI.ProxyConnection.prototype.request_callback = function request_callback(callback, onSuccess, onFailure) {
        if (typeof callback !== 'function') {
            throw new TypeError('callback parameter must be a function');
        }

        var wrappedOnSuccess = function () {
            this.makeRequest(this.url + NGSI.proxy_endpoints.CALLBACK_COLLECTION, {
                contentType: 'application/json',
                postBody: JSON.stringify({connection_id: this.connection_id}),
                onSuccess: function (response) {
                    var data = JSON.parse(response.responseText);
                    this.callbacks[data.callback_id] = {
                        callback_id: data.callback_id,
                        method: callback,
                        subscription_id: null
                    };
                    onSuccess(data);
                }.bind(this),
                onFailure: function (response) {
                    var error;
                    if (response.status === 0) {
                        error = new NGSI.ConnectionError();
                    } else {
                        error = new NGSI.InvalidResponseError('Unexpected error code: ' + response.status);
                    }
                    if (typeof onFailure === 'function') {
                        onFailure(error);
                    }
                }
            });
        }.bind(this);

        if (this.connected === false) {
            this.connect({
                onSuccess: wrappedOnSuccess,
                onFailure: function (e) {
                    if (typeof onFailure === 'function') {
                        onFailure(e);
                    }
                }
            });
        } else {
            wrappedOnSuccess();
        }
    };

    NGSI.ProxyConnection.prototype.close_callback = function close_callback(callback_id, onSuccess, onFailure) {
        this.makeRequest(this.url + NGSI.proxy_endpoints.CALLBACK_COLLECTION + '/' + callback_id, {
            method: 'DELETE',
            onSuccess: function (response) {
                this.purge_callback(callback_id);

                if (typeof onSuccess === 'function') {
                    onSuccess();
                }
            }.bind(this),
            onFailure: function (response) {
                if (typeof onFailure === 'function') {
                    onFailure();
                }
            }
        });
    };

    NGSI.ProxyConnection.prototype.associate_subscription_id_to_callback = function associate_subscription_id_to_callback(callback_id, subscription_id) {
        if (callback_id in this.callbacks && this.callbacks[callback_id].subscription_id === null) {
            this.callbacks_by_subscriptionId[subscription_id] = this.callbacks[callback_id];
            this.callbacks[callback_id].subscription_id = subscription_id;
        }
    };

    NGSI.ProxyConnection.prototype.close_callback_by_subscriptionId = function close_callback_by_subscriptionId(subscription_id, onSuccess, onFailure) {
        if (subscription_id in this.callbacks_by_subscriptionId) {
            this.close_callback(this.callbacks_by_subscriptionId[subscription_id].callback_id, onSuccess, onFailure);
        } else {
            if (typeof onSuccess === 'function') {
                onSuccess();
            }
        }
    };

    NGSI.ProxyConnection.prototype.purge_callback = function purge_callback(callback_id) {
        if (this.callbacks[callback_id].subscription_id != null) {
            delete this.callbacks_by_subscriptionId[this.callbacks[callback_id].subscription_id];
        }
        delete this.callbacks[callback_id];
    };

    /* NGSI Connection Error */

    NGSI.ConnectionError = function ConnectionError(message) {
        this.name = 'ConnectionError';
        this.message = message || 'Connection Error';
    };
    NGSI.ConnectionError.prototype = new Error();
    NGSI.ConnectionError.prototype.constructor = NGSI.ConnectionError;

    NGSI.InvalidRequestError = function InvalidRequestError(code, message, details) {
        this.name = 'InvalidRequest';
        this.code = code;
        this.message = message || '';
        this.details = details || '';
    };
    NGSI.InvalidRequestError.prototype = new Error();
    NGSI.InvalidRequestError.prototype.constructor = NGSI.InvalidRequestError;

    NGSI.InvalidResponseError = function InvalidResponseError(message) {
        this.name = 'InvalidResponse';
        this.message = message || '';
    };
    NGSI.InvalidResponseError.prototype = new Error();
    NGSI.InvalidResponseError.prototype.constructor = NGSI.InvalidResponseError;

    NGSI.ProxyConnectionError = function ProxyConnectionError(cause) {
        this.name = 'ProxyConnectionError';
        this.cause = cause;
    };
    NGSI.ProxyConnectionError.prototype = new Error();
    NGSI.ProxyConnectionError.prototype.constructor = NGSI.ProxyConnectionError;

    /* NGSI Connection */
    NGSI.Connection = function NGSIConnection(url, options) {
        this.url = "" + url;

        if (this.url[this.url.length - 1] !== '/') {
            this.url += '/';
        }

        if (options == null) {
            options = {};
        }

        this.request_headers = options.request_headers;

        if (typeof options.requestFunction === 'function') {
            this.makeRequest = options.requestFunction;
        }

        if (options.ngsi_proxy_connection instanceof NGSI.ProxyConnection) {
            this.ngsi_proxy = options.ngsi_proxy_connection;
        } else if (typeof options.ngsi_proxy_url === 'string') {
            this.ngsi_proxy = new NGSI.ProxyConnection(options.ngsi_proxy_url, this.makeRequest);
        }
    };

    NGSI.Connection.prototype.createRegistration = function createRegistration(entities, attributes, duration, providingApplication, callbacks) {
        if (!Array.isArray(entities) || entities.length === 0) {
            throw new TypeError('entities parameter must be a non-empty array');
        }

        if (attributes != null && !Array.isArray(attributes)) {
            throw new TypeError('attributes parameter must be an array or null');
        } else if (attributes == null) {
            attributes = [];
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_register_context_request(entities, attributes, duration, providingApplication);
        var url = this.url + NGSI.endpoints.REGISTER_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_register_context_response, callbacks);
    };

    NGSI.Connection.prototype.updateRegistration = function updateRegistration(regId, entities, attributes, duration, providingApplication, callbacks) {
        if (!Array.isArray(entities) || entities.length === 0) {
            throw new TypeError('entities parameter must be a non-empty array');
        }

        if (attributes != null && !Array.isArray(attributes)) {
            throw new TypeError('attributes parameter must be an array or null');
        } else if (attributes == null) {
            attributes = [];
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_register_context_request(entities, attributes, duration, providingApplication, regId);
        var url = this.url + NGSI.endpoints.REGISTER_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_register_context_response, callbacks);
    };

    NGSI.Connection.prototype.cancelRegistration = function cancelRegistration(regId, callbacks) {
        this.updateRegistration(regId, [{id: 'canceled registration'}], [], 'PT0H', 'http://canceled.registration.com', callbacks);
    };

    NGSI.Connection.prototype.discoverAvailability = function discoverAvailability(entities, attributeNames, callbacks) {

        if (!Array.isArray(entities) || entities.length === 0) {
            throw new TypeError('entities parameter must be a non-empty array');
        }

        if (attributeNames != null && !Array.isArray(attributeNames)) {
            throw new TypeError('attributeNames parameter must be an array or null');
        } else if (attributeNames == null) {
            attributeNames = [];
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_discover_context_availability_request(entities, attributeNames);
        var url = this.url + NGSI.endpoints.DISCOVER_CONTEXT_AVAILABILITY;

        makeXMLRequest.call(this, url, payload, parse_discover_context_availability_response, callbacks);
    };

    NGSI.Connection.prototype.createAvailabilitySubscription = function createAvailabilitySubscription(entities, attributeNames, duration, restriction, options) {

        if (!Array.isArray(entities) || entities.length === 0) {
            throw new TypeError('entities parameter must be a non-empty array');
        }

        if (attributeNames != null && !Array.isArray(attributeNames)) {
            throw new TypeError('attributeNames parameter must be an array or null');
        }

        if (options == null) {
            throw new TypeError('Missing options parameter');
        }
        if (typeof options.onNotify != 'string' && typeof options.onNotify != 'function') {
            throw new TypeError('Invalid onNotify callback');
        }
        if (typeof options.onNotify === 'function' && this.ngsi_proxy == null) {
            throw new Error('A ngsi-proxy is needed for using local onNotify callbacks');
        }

        var url = this.url + NGSI.endpoints.SUBSCRIBE_CONTEXT_AVAILABILITY;
        if (typeof options.onNotify === 'function' && this.ngsi_proxy != null) {

            var onNotify = function onNotify(payload) {
                var doc = NGSI.XML.parseFromString(payload, 'application/xml');
                var data = parse_notify_context_availability_request(doc, options);
                options.onNotify(data);
            };

            this.ngsi_proxy.request_callback(onNotify, function (proxy_callback) {
                var payload = ngsi_build_subscribe_update_context_availability_request('subscribeContextAvailabilityRequest', entities, attributeNames, duration, restriction, null, proxy_callback.url);

                var oldOnFailure = options.onFailure;
                options.onFailure = function () {
                    this.ngsi_proxy.close_callback(proxy_callback.callback_id);
                    if (typeof oldOnFailure === 'function') {
                        oldOnFailure();
                    }
                }.bind(this);

                var oldOnSuccess = options.onSuccess;
                options.onSuccess = function (data) {
                    this.ngsi_proxy.associate_subscription_id_to_callback(proxy_callback.callback_id, data.subscriptionId);
                    if (typeof oldOnSuccess === 'function') {
                        oldOnSuccess(data);
                    }
                }.bind(this);

                makeXMLRequest.call(this, url, payload, parse_subscribe_update_context_availability_response, options);
            }.bind(this), function () {
                if (typeof options.onFailure === 'function') {
                    options.onFailure();
                }
            });
        } else {
            var payload = ngsi_build_subscribe_update_context_availability_request('subscribeContextAvailabilityRequest', entities, attributeNames, duration, restriction, null, options.onNotify);
            makeXMLRequest.call(this, url, payload, parse_subscribe_update_context_availability_response, options);
        }
    };

    NGSI.Connection.prototype.updateAvailabilitySubscription = function updateAvailabilitySubscription(subId, entities, attributeNames, duration, restriction, callbacks) {
        if (subId == null) {
            throw new TypeError('subId parameter cannot be null');
        }

        if (!Array.isArray(entities) || entities.length === 0) {
            throw new TypeError('entities parameter must be a non-empty array');
        }

        if (attributeNames != null && !Array.isArray(attributeNames)) {
            throw new TypeError('attributeNames parameter must be an array or null');
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_subscribe_update_context_availability_request('updateContextAvailabilitySubscriptionRequest', entities, attributeNames, duration, restriction, subId);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT_AVAILABILITY_SUBSCRIPTION;

        makeXMLRequest.call(this, url, payload, parse_subscribe_update_context_availability_response, callbacks);
    };

    NGSI.Connection.prototype.cancelAvailabilitySubscription = function cancelAvailabilitySubscription(subId, callbacks) {
        if (subId == null) {
            throw new TypeError('subId parameter cannot be null');
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_unsubscribe_context_availability_request(subId);
        var url = this.url + NGSI.endpoints.UNSUBSCRIBE_CONTEXT_AVAILABILITY;

        makeXMLRequest.call(this, url, payload, parse_unsubscribe_context_availability_response, callbacks);
    };

    NGSI.Connection.prototype.query = function query(entities, attrNames, options) {
        var url, parameters, payload;

        if (!Array.isArray(entities) || entities.length === 0) {
            throw new TypeError('entities parameter must be a non-empty array');
        }

        if (attrNames != null && !Array.isArray(attrNames)) {
            throw new TypeError('attrNames must be null or an array');
        } else if (attrNames == null) {
            attrNames = [];
        }

        if (options == null) {
            options = {};
        }

        // Parse pagination parameters
        parameters = {};
        if (options.limit != null) {
            if (typeof options.limit !== 'number' || options.limit < 20) {
                throw new TypeError('invalid value for the limit option');
            }
            parameters.limit = options.limit;
        }

        if (options.offset != null) {
            if (typeof options.offset !== 'number' || options.offset < 0) {
                throw new TypeError('invalid value for the offset option');
            }
            parameters.offset = options.offset;
        }

        if (options.details != null) {
            if (typeof options.details !== 'boolean') {
                throw new TypeError('invalid value for the details option');
            }
            if (options.details) {
                parameters.details = 'on';
            } else {
                parameters.details = 'off';
            }
        }

        url = this.url + NGSI.endpoints.QUERY_CONTEXT;
        payload = ngsi_build_query_context_request(entities, attrNames, options.restriction);
        makeXMLRequest.call(this, url, payload, parse_query_context_response, options, parameters);
    };

    NGSI.Connection.prototype.updateAttributes = function updateAttributes(update, callbacks) {
        if (!Array.isArray(update) || update.length === 0) {
            throw new TypeError('update parameter must be a non-empty array');
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_update_context_request('UPDATE', update);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_update_context_response, callbacks);
    };

    NGSI.Connection.prototype.addAttributes = function addAttributes(toAdd, callbacks) {
        if (!Array.isArray(toAdd) || toAdd.length === 0) {
            throw new TypeError('toAdd parameter must be a non-empty array');
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_update_context_request('APPEND', toAdd);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_update_context_response, callbacks);
    };

    NGSI.Connection.prototype.deleteAttributes = function deleteAttributes(toDelete, callbacks) {
        if (!Array.isArray(toDelete) || toDelete.length === 0) {
            throw new TypeError('toDelete parameter must be a non-empty array');
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_update_context_request('DELETE', toDelete);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_update_context_response, callbacks);
    };

    NGSI.Connection.prototype.createSubscription = function createSubscription(entities, attributeNames, duration, throttling, cond, options) {
        if (!Array.isArray(entities) || entities.length === 0) {
            throw new TypeError('entities parameter must be a non-empty array');
        }

        if (attributeNames != null && !Array.isArray(attributeNames)) {
            throw new TypeError('attributeNames parameter must be an array or null');
        }

        if (options == null) {
            throw new TypeError('Missing options parameter');
        }
        if (typeof options.onNotify != 'string' && typeof options.onNotify != 'function') {
            throw new TypeError('Invalid onNotify callback');
        }
        if (typeof options.onNotify === 'function' && this.ngsi_proxy == null) {
            throw new Error('A ngsi-proxy is needed for using local onNotify callbacks');
        }

        var url = this.url + NGSI.endpoints.SUBSCRIBE_CONTEXT;
        if (typeof options.onNotify === 'function' && this.ngsi_proxy != null) {

            var onNotify = function onNotify(payload) {
                var doc = NGSI.XML.parseFromString(payload, 'application/xml');
                var data = NGSI.parseNotifyContextRequest(doc, options);
                options.onNotify(data);
            };

            this.ngsi_proxy.request_callback(onNotify, function (proxy_callback) {
                var payload = ngsi_build_subscribe_update_context_request(null, entities, attributeNames, duration, throttling, cond, proxy_callback.url);

                var oldOnFailure = options.onFailure;
                options.onFailure = function () {
                    this.ngsi_proxy.close_callback(proxy_callback.callback_id);
                    if (typeof oldOnFailure === 'function') {
                        oldOnFailure();
                    }
                }.bind(this);

                var oldOnSuccess = options.onSuccess;
                options.onSuccess = function (data) {
                    this.ngsi_proxy.associate_subscription_id_to_callback(proxy_callback.callback_id, data.subscriptionId);
                    if (typeof oldOnSuccess === 'function') {
                        oldOnSuccess(data);
                    }
                }.bind(this);

                makeXMLRequest.call(this, url, payload, parse_subscribe_context_response, options);
            }.bind(this), function (e) {
                if (typeof options.onFailure === 'function') {
                    var exception = new NGSI.ProxyConnectionError(e);
                    try {
                        options.onFailure(exception);
                    } catch (error) {}
                }

                if (typeof options.onComplete === 'function') {
                    try {
                        options.onComplete();
                    } catch (error) {}
                }
            });
        } else {
            var payload = ngsi_build_subscribe_update_context_request(null, entities, attributeNames, duration, throttling, cond, options.onNotify);
            makeXMLRequest.call(this, url, payload, parse_subscribe_context_response, options);
        }
    };

    NGSI.Connection.prototype.updateSubscription = function updateSubscription(subId, duration, throttling, cond, options) {
        if (subId == null) {
            throw new TypeError('subId parameter cannot be null');
        }

        if (options == null) {
            options = {};
        }

        var payload = ngsi_build_subscribe_update_context_request(subId, null, null, duration, throttling, cond);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT_SUBSCRIPTION;

        makeXMLRequest.call(this, url, payload, parse_update_context_subscription_response, options);
    };

    NGSI.Connection.prototype.cancelSubscription = function cancelSubscription(subId, options) {
        if (subId == null) {
            throw new TypeError('subId parameter cannot be null');
        }

        if (options == null) {
            options = {};
        }

        if (this.ngsi_proxy) {
            var old_success_callback = options.onSuccess;
            options.onSuccess = function (data) {
                var onSuccess = old_success_callback;
                if (onSuccess != null) {
                    onSuccess = onSuccess.bind(null, data);
                }
                this.ngsi_proxy.close_callback_by_subscriptionId(data.subscriptionId, onSuccess, options.onFailure);
            }.bind(this);
        }
        var payload = ngsi_build_unsubscribe_context_request(subId);
        var url = this.url + NGSI.endpoints.UNSUBSCRIBE_CONTEXT;

        makeXMLRequest.call(this, url, payload, parse_unsubscribe_context_response, options);
    };

    if (typeof window !== 'undefined') {
        window.NGSI = NGSI;
    }

})();
