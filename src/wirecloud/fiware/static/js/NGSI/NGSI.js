/*
 *     Copyright (c) 2013-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global EventSource, exports, require */

(function () {

    "use strict";

    /**
     * @namespace
     * @name NGSI
     */
    var NGSI;

    var privates = new WeakMap();

    /* Detect Node.js */
    /* istanbul ignore if */
    if ((typeof require === 'function') && typeof exports != null) {
        NGSI = exports;
        var URL = require('whatwg-url').URL;
    } else {
        NGSI = {};
        var URL = window.URL;
    }

    NGSI.endpoints = {
        REGISTER_CONTEXT: 'v1/registry/registerContext',
        DISCOVER_CONTEXT_AVAILABILITY: 'v1/registry/discoverContextAvailability',
        SUBSCRIBE_CONTEXT_AVAILABILITY: 'v1/registry/subscribeContextAvailability',
        UPDATE_CONTEXT_AVAILABILITY_SUBSCRIPTION: 'v1/registry/updateContextAvailabilitySubscription',
        UNSUBSCRIBE_CONTEXT_AVAILABILITY: 'v1/registry/unsubscribeContextAvailability',
        QUERY_CONTEXT: 'v1/queryContext',
        UPDATE_CONTEXT: 'v1/updateContext',
        SUBSCRIBE_CONTEXT: 'v1/subscribeContext',
        UPDATE_CONTEXT_SUBSCRIPTION: 'v1/updateContextSubscription',
        UNSUBSCRIBE_CONTEXT: 'v1/unsubscribeContext',
        CONTEXT_TYPES: 'v1/contextTypes',

        v2: {
            BATCH_QUERY_OP: 'v2/op/query',
            BATCH_UPDATE_OP: 'v2/op/update',
            ENTITY_ATTRS_COLLECTION: 'v2/entities/%(entityId)s/attrs',
            ENTITY_ATTR_ENTRY: 'v2/entities/%(entityId)s/attrs/%(attribute)s',
            ENTITY_ATTR_VALUE_ENTRY: 'v2/entities/%(entityId)s/attrs/%(attribute)s/value',
            ENTITY_COLLECTION: 'v2/entities',
            ENTITY_ENTRY: 'v2/entities/%(entityId)s',
            SUBSCRIPTION_COLLECTION: 'v2/subscriptions',
            SUBSCRIPTION_ENTRY: 'v2/subscriptions/%(subscriptionId)s',
            TYPE_COLLECTION: 'v2/types',
            TYPE_ENTRY: 'v2/types/%(typeId)s'
        }
    };

    NGSI.proxy_endpoints = {
        EVENTSOURCE_COLLECTION: 'eventsource',
        CALLBACK_COLLECTION: 'callbacks'
    };

    /* Request utility functions */

    var interpolate = function interpolate(pattern, attributes) {
        return pattern.replace(/%\(\w+\)s/g,
            function (match) {
                return String(attributes[match.slice(2, -2)]);
            });
    };

    var makeJSONRequest = function makeJSONRequest(url, payload, parse_func, callbacks, parameters) {
        var body = null, contentType = null, requestHeaders;

        if (payload != null) {
            contentType = 'application/json';
            body = JSON.stringify(payload);
        }

        requestHeaders = JSON.parse(JSON.stringify(this.request_headers));
        requestHeaders.Accept = 'application/json';

        this.makeRequest(url, {
            method: body != null ? 'POST' : 'GET',
            contentType: contentType,
            requestHeaders: requestHeaders,
            parameters: parameters,
            postBody: body
        }).then(
            function (response) {
                var error;

                if (response.status !== 200) {
                    if (typeof callbacks.onFailure === 'function') {
                        if (response instanceof NGSI.ConnectionError) {
                            error = response;
                        } else if ([0, 502, 504].indexOf(response.status) !== -1) {
                            error = new NGSI.ConnectionError('Connection Error');
                        } else {
                            error = new NGSI.InvalidResponseError('Unexpected error code: ' + response.status);
                        }
                        callbacks.onFailure(error);
                    }
                } else if (typeof callbacks.onSuccess === 'function') {
                    var data;
                    try {
                        try {
                            data = JSON.parse(response.responseText);
                        } catch (e1) {
                            throw new NGSI.InvalidResponseError('Server returned invalid JSON content');
                        }
                        data = parse_func(data, callbacks);
                    } catch (e) {
                        if (typeof callbacks.onFailure === 'function') {
                            callbacks.onFailure(e);
                        }
                        if (typeof callbacks.onComplete === 'function') {
                            callbacks.onComplete();
                        }
                        return;
                    }

                    callbacks.onSuccess.apply(null, data);
                }
                if (typeof callbacks.onComplete === 'function') {
                    callbacks.onComplete();
                }
            },
            function (error) {
                if (typeof callbacks.onFailure === 'function') {
                    // Allow to customize error details by "backends"
                    if (!(error instanceof NGSI.ConnectionError)) {
                        error = new NGSI.ConnectionError();
                    }
                    try {
                        callbacks.onFailure(error);
                    } catch (e) {}
                }
                if (typeof callbacks.onComplete === 'function') {
                    callbacks.onComplete();
                }
            }
        );
    };

    var deleteHeader = function deleteHeader(headerName, requestHeaders) {
        var headerNameLow = headerName.trim().toLowerCase();
        var keys = Object.keys(requestHeaders);
        var index = keys.map(function (headerName) {
            return headerName.trim().toLowerCase();
        }).indexOf(headerNameLow);
        if (index !== -1) {
            delete requestHeaders[keys[index]];
        }
    };

    var makeJSONRequest2 = function makeJSONRequest2(url, options) {
        if (options.postBody != null) {
            options.contentType = 'application/json';
            options.postBody = JSON.stringify(options.postBody);
        }

        var requestHeaders = JSON.parse(JSON.stringify(this.request_headers));
        requestHeaders.Accept = 'application/json';

        for (var headerName in options.requestHeaders) {
            if (options.requestHeaders[headerName] != null) {
                deleteHeader(headerName, requestHeaders);
                requestHeaders[headerName] = options.requestHeaders[headerName];
            }
        }
        options.requestHeaders = requestHeaders;

        return this.makeRequest(url, options).then(
            function (response) {
                if ([0, 502, 504].indexOf(response.status) !== -1) {
                    return Promise.reject(new NGSI.ConnectionError());
                }
                return Promise.resolve(response);
            },
            function (error) {
                // Allow to customize error details by "backends"
                if (!(error instanceof NGSI.ConnectionError)) {
                    error = new NGSI.ConnectionError();
                }
                return Promise.reject(error);
            }
        );
    };

    var ngsi_build_entity_id_element_json = function ngsi_build_entity_id_element_json(entity) {
        var entityId, isPattern;

        isPattern = (typeof entity.isPattern === 'string' && entity.isPattern.trim().toLowerCase() === 'true') || (entity.isPattern === true);
        entityId = {
            id: "" + entity.id,
            isPattern: "" + isPattern
        };

        if (entity.type != null) {
            entityId.type = "" + entity.type;
        }

        return entityId;
    };

    var ngsi_build_scope_restriction_element_json = function ngsi_build_scope_restriction_element_json(scope) {
        var result, i, vertice;

        if ('polygon' in scope.value) {
            result = {
                polygon: {
                    vertices: []
                }
            };
            for (i = 0; i < scope.value.polygon.vertices.length; i++) {
                vertice = scope.value.polygon.vertices[i];
                result.polygon.vertices.push({
                    latitude: "" + vertice.latitude,
                    longitude: "" + vertice.longitude
                });
            }

            if (scope.value.polygon.inverted) {
                result.polygon.inverted = 'true';
            }
        } else if ('circle' in scope.value) {
            result = {
                circle: {
                    centerLatitude: "" + scope.value.circle.centerLatitude,
                    centerLongitude: "" + scope.value.circle.centerLongitude,
                    radius: scope.value.circle.radius
                }
            };

            if (scope.value.circle.inverted) {
                result.circle.inverted = 'true';
            }
        }

        return result;
    };

    var ngsi_build_restriction_element_json = function ngsi_build_restriction_element_json(restriction) {
        var result, i;

        result = {
            'scopes': []
        };

        if (Array.isArray(restriction.scopes)) {
            for (i = 0; i < restriction.scopes.length; i++) {
                result.scopes.push({
                    type: restriction.scopes[i].type,
                    value: ngsi_build_scope_restriction_element_json(restriction.scopes[i])
                });
            }
        }

        return result;
    };

    var ngsi_build_attribute_metadata_element = function ngsi_build_attribute_metadata_element(metadata) {
        var result, i;

        result = [];
        for (i = 0; i < metadata.length; i++) {
            result.push({
                name: "" + metadata[i].name,
                type: "" + metadata[i].type,
                value: "" + metadata[i].value
            });
        }

        return result;
    };

    /* Request builders */

    var ngsi_build_register_context_request = function ngsi_build_register_context_request(e, attr, duration, providingApplication, regId) {
        var doc, i, attribute, attributeElement;

        doc = {
            'contextRegistrations': [
                {
                    'entities': [],
                    'attributes': [],
                    'providingApplication': providingApplication
                }
            ],
            'duration': "" + duration,
        };

        for (i = 0; i < e.length; i += 1) {
            doc.contextRegistrations[0].entities.push(ngsi_build_entity_id_element_json(e[i]));
        }

        for (i = 0; i < attr.length; i += 1) {
            attribute = attr[i];
            attributeElement = {
                name: attribute.name,
                isDomain: "false"
            };

            if (attribute.type != null) {
                attributeElement.type = "" + attribute.type;
            }

            doc.contextRegistrations[0].attributes.push(attributeElement);
        }

        if (regId != null) {
            doc.registrationId = "" + regId;
        }

        return doc;
    };

    var ngsi_build_query_context_request = function ngsi_build_query_context_request(e, attrNames, restriction) {
        var body, i;

        body = {
            entities: []
        };

        for (i = 0; i < e.length; i += 1) {
            body.entities.push(ngsi_build_entity_id_element_json(e[i]));
        }

        if (Array.isArray(attrNames) && attrNames.length > 0) {
            body.attributes = [];

            for (i = 0; i < attrNames.length; i += 1) {
                body.attributes.push("" + attrNames[i]);
            }
        }

        if (restriction != null) {
            body.restriction = ngsi_build_restriction_element_json(restriction);
        }

        return body;
    };

    var ngsi_build_update_context_request = function ngsi_build_update_context_request(updateAction, update) {
        var body, i, j, contextElement, attributeListElement, attributes,
            attribute, attributeElement, value;

        body = {
            contextElements: [],
            updateAction: updateAction
        };

        for (i = 0; i < update.length; i += 1) {

            // Basic entity info
            contextElement = ngsi_build_entity_id_element_json(update[i].entity);

            // attribute list
            attributes = update[i].attributes;
            if (attributes != null) {
                attributeListElement = contextElement.attributes = [];
                for (j = 0; j < attributes.length; j += 1) {
                    attribute = attributes[j];

                    attributeElement = {
                        "name": "" + attribute.name
                    };

                    if (attribute.type != null) {
                        attributeElement.type = "" + attribute.type;
                    }

                    if (updateAction !== 'DELETE') {
                        if (attribute.value != null) {
                            value = attribute.value;
                        } else if (attribute.contextValue != null) {
                            value = attribute.contextValue;
                        } else {
                            value = null;
                        }

                        attributeElement.value = value;
                    }

                    if (Array.isArray(attribute.metadata) && attribute.metadata.length > 0) {
                        attributeElement.metadatas = ngsi_build_attribute_metadata_element(attribute.metadata);
                    }

                    attributeListElement.push(attributeElement);
                }
            }

            body.contextElements.push(contextElement);
        }

        return body;
    };

    var ngsi_build_discover_context_availability_request = function ngsi_build_discover_context_availability_request(e, attr) {
        var doc, i;

        doc = {
            "entities": [],
            "attributes": attr
        };

        for (i = 0; i < e.length; i += 1) {
            doc.entities.push(ngsi_build_entity_id_element_json(e[i]));
        }

        return doc;
    };

    var ngsi_build_subscribe_update_context_availability_request = function ngsi_build_subscribe_update_context_availability_request(e, attr, duration, restriction, subscriptionId, onNotify) {
        var doc, i;

        if (subscriptionId) {
            doc = {
                "entities": [],
                "subscriptionId": subscriptionId
            };
        } else {
            doc = {
                "entities": [],
                "reference": onNotify
            };
        }

        for (i = 0; i < e.length; i += 1) {
            doc.entities.push(ngsi_build_entity_id_element_json(e[i]));
        }

        if (Array.isArray(attr) && attr.length > 0) {
            doc.attributes = attr;
        }

        if (duration != null) {
            doc.duration = "" + duration;
        }

        if (restriction != null) {
            doc.restriction = ngsi_build_restriction_element_json(restriction);
        }

        return doc;
    };

    var ngsi_build_unsubscribe_context_availability_request = function ngsi_build_unsubscribe_context_availability_request(subId) {
        return {
            "subscriptionId": subId
        };
    };

    var ngsi_build_subscribe_update_context_request = function ngsi_build_subscribe_update_context_request(subscriptionId, e, attr, duration, throttling, conditions, onNotify) {
        var doc, i, condition, notifyConditionElement;

        if (subscriptionId) {
            doc = {
                "subscriptionId": subscriptionId
            };
        } else {
            doc = {
                "entities": [],
                "reference": onNotify
            };

            for (i = 0; i < e.length; i += 1) {
                doc.entities.push(ngsi_build_entity_id_element_json(e[i]));
            }

            if (Array.isArray(attr)) {
                doc.attributes = attr;
            }
        }

        if (duration != null) {
            doc.duration = "" + duration;
        }

        if (Array.isArray(conditions)) {
            doc.notifyConditions = [];
            for (i = 0; i < conditions.length; i += 1) {
                condition = conditions[i];

                notifyConditionElement = {
                    "type": condition.type
                };
                doc.notifyConditions.push(notifyConditionElement);

                if (Array.isArray(condition.condValues)) {
                    notifyConditionElement.condValues = condition.condValues;
                }
            }
        }

        if (throttling != null) {
            doc.throttling = "" + throttling;
        }

        return doc;
    };

    var ngsi_build_unsubscribe_context_request = function ngsi_build_unsubscribe_context_request(subId) {
        return {
            'subscriptionId': subId
        };
    };

    var ngsi_build_replace_entity_request = function ngsi_build_replace_entity_request(entity, options, parameters) {
        if (entity.type != null) {
            parameters.type = entity.type;
            delete entity.type;
        }

        if (options.keyValues === true) {
            parameters.options = "keyValues";
        }
        delete entity.id;
        return entity;
    };

    /* Response parsers */

    var parse_register_context_response =  function parse_register_context_response(data) {

        process_error_code_json(data);

        if (typeof data !== 'object' || typeof data.registrationId !== 'string' || typeof data.duration !== 'string') {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        return [data];
    };

    var parse_context_registration_response_list = function parse_context_registration_response_list(registrationResponses) {
        var registrationResponse, registration, i, data = [];

        for (i = 0; i < registrationResponses.length; i += 1) {
            registrationResponse = registrationResponses[i].contextRegistration;
            registration = {
                entities: [],
                attributes: [],
                providingApplication: registrationResponse.providingApplication
            };

            // Entities
            if (registrationResponse.entities != null) {
                registration.entities = registrationResponse.entities;
            }

            // Attributes
            if (registrationResponse.attributes != null) {
                registration.attributes = registrationResponse.attributes;
            }

            data.push(registration);
        }

        return data;
    };

    var parse_discover_context_availability_response = function parse_discover_context_availability_response(data) {

        if (typeof data !== 'object' || Array.isArray(data)) {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        process_error_code_json(data);

        if (!Array.isArray(data.contextRegistrationResponses)) {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        return [parse_context_registration_response_list(data.contextRegistrationResponses)];
    };

    var parse_subscribe_update_context_availability_response = function parse_subscribe_update_context_availability_response(data) {

        process_error_code_json(data);

        if (typeof data.subscriptionId !== 'string') {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        if ('duration' in data && typeof data.duration !== 'string') {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        return [data];
    };

    var parse_unsubscribe_context_availability_response = function parse_unsubscribe_context_availability_response(data) {

        if (typeof data !== 'object' || Array.isArray(data) || !('subscriptionId' in data)) {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        return [{
            subscriptionId: data.subscriptionId,
            statusCode: process_status_info_json(data)
        }];
    };

    var parse_context_response_list_json = function parse_context_response_list_json(elements, update_response, options) {
        var contextResponse, entry, flat, i, j, value, data,
            attribute_info, attribute_entry, status_info, error_data;

        flat = !!options.flat;
        if (flat) {
            data = {};
        } else {
            data = [];
        }
        error_data = [];
        if (update_response) {
            value = "";
        }

        for (i = 0; i < elements.length; i += 1) {
            contextResponse = elements[i].contextElement;
            status_info = process_status_info_json(elements[i]);

            if (flat) {
                entry = {};
            } else {
                entry = {
                    entity: null,
                    attributes: []
                };
            }

            // Entity
            if (status_info.code === 200 && flat) {
                entry.id = contextResponse.id;
                entry.type = contextResponse.type;
            } else {
                entry.entity = {
                    id: contextResponse.id,
                    type: contextResponse.type
                };
            }

            // attributes
            if (contextResponse.attributes != null) {
                for (j = 0; j < contextResponse.attributes.length; j += 1) {
                    attribute_info = contextResponse.attributes[j];
                    if (!update_response) {
                        value = attribute_info.value;
                    }

                    if (flat) {
                        entry[attribute_info.name] = value;
                    } else {
                        attribute_entry = {
                            name: attribute_info.name,
                            type: attribute_info.type
                        };
                        if (!update_response) {
                            attribute_entry.value = value;
                        }
                        if (attribute_info.metadatas != null) {
                            attribute_entry.metadata = attribute_info.metadatas;
                        }
                        entry.attributes.push(attribute_entry);
                    }
                }
            }

            if (status_info.code === 200) {
                if (flat) {
                    data[contextResponse.id] = entry;
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

    var parse_available_types_response = function parse_available_types_response(data, options) {
        var parsed_details, status_info, details;

        status_info = process_status_info_json(data);
        if (status_info.code === 404) {
            if (typeof status_info.details === 'string') {
                parsed_details = status_info.details.match(NGSI_INVALID_OFFSET_RE);
                if (parsed_details) {
                    details = status_info.details = {
                        "text": status_info.details,
                        "matches": parseInt(parsed_details[1]),
                        "offset": parseInt(parsed_details[2])
                    };
                }
            } if (options.details) {
                details = {
                    "count": 0
                };
            }
            if (options.offset !== 0) {
                throw status_info;
            } else {
                return [[], details];
            }
        } else if (status_info.code !== 200) {
            throw new NGSI.InvalidResponseError('Unexpected error code');
        } else if (typeof status_info.details === 'string') {
            parsed_details = status_info.details.match(NGSI_QUERY_COUNT_RE);
            if (parsed_details) {
                details = {
                    "count": parseInt(parsed_details[1], 10)
                };
            }
        }

        return [data.types, details];
    };

    var parse_type_info_response = function parse_type_info_response(data) {
        var status_info;

        if (typeof data !== 'object' || Array.isArray(data)) {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        status_info = process_status_info_json(data);

        if (status_info.code === 404) {
            throw new NGSI.NotFoundError({
                details: data,
                message: status_info.reasonPhrase
            });
        } else if (status_info.code !== 200) {
            throw new NGSI.InvalidResponseError('Unexpected error code');
        }

        delete data.statusCode;
        return [data];
    };

    var process_status_info_json = function process_status_info_json(obj) {
        if (!("statusCode" in obj)) {
            throw new NGSI.InvalidResponseError('missing response status code info');
        }

        obj.statusCode.code = parseInt(obj.statusCode.code, 10);

        return obj.statusCode;
    };

    var process_error_code_json = function process_error_code_json(data) {
        if ('errorCode' in data) {
            throw new NGSI.InvalidRequestError(parseInt(data.errorCode.code, 10), data.errorCode.reasonPhrase, data.errorCode.details);
        }
    };

    var NGSI_QUERY_COUNT_RE = new RegExp('Count: (\\d+)');
    var NGSI_INVALID_OFFSET_RE = new RegExp('Number of matching entities: (\\d+). Offset is (\\d+)');

    var parse_query_context_response = function parse_query_context_response(doc, options) {
        var details, parsed_details, data;

        if (typeof doc !== 'object' || Array.isArray(doc)) {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        try {
            process_error_code_json(doc);
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
                } else if (options.details === true && options.offset === 0) {
                    details = e.details = {
                        "count": 0
                    };
                }

                if (options.offset !== 0) {
                    throw e;
                } else {
                    return [data, details];
                }
                break;
            default:
                throw e;
            }
        }

        if (!Array.isArray(doc.contextResponses)) {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        return [parse_context_response_list_json(doc.contextResponses, false, options)[0], details];
    };

    var parse_update_context_response = function parse_update_context_response(data, options) {

        process_error_code_json(data);

        return parse_context_response_list_json(data.contextResponses, true, options);
    };

    var parse_subscribe_response_element = function parse_subscribe_response_element(data) {

        process_error_code_json(data);

        if (typeof data.subscriptionId !== 'string') {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        if ('duration' in data && typeof data.duration !== 'string') {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        if ('throttling' in data && typeof data.throttling !== 'string') {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        return data;
    };

    var parse_subscribe_context_response = function parse_subscribe_context_response(data) {

        process_error_code_json(data);

        if (typeof data !== 'object' || typeof data.subscribeResponse !== 'object') {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        return [parse_subscribe_response_element(data.subscribeResponse)];
    };

    var parse_update_context_subscription_response = function parse_update_context_subscription_response(data) {

        process_error_code_json(data);

        if (typeof data !== 'object' || typeof data.subscribeResponse !== 'object') {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        return [parse_subscribe_response_element(data.subscribeResponse)];
    };

    var parse_unsubscribe_context_response = function parse_unsubscribe_context_response(data) {

        process_error_code_json(data);

        if (typeof data !== 'object' || typeof data.subscriptionId !== 'string') {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        data.statusCode = process_status_info_json(data);
        return [data];
    };

    var parse_notify_context_availability_request = function parse_notify_context_availability_request(data, options) {

        if (typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.contextRegistrationResponses)) {
            throw new NGSI.InvalidResponseError('The server returned an invalid json structure');
        }

        return [parse_context_registration_response_list(data.contextRegistrationResponses)];
    };

    var parse_pagination_options = function parse_pagination_options(options, default_details) {
        var parameters = {};

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
        } else {
            options.offset = 0;
        }

        if (default_details != null) {
            if (options.details != null) {
                if (typeof options.details !== 'boolean') {
                    throw new TypeError('invalid value for the details option');
                }
                if (options.details) {
                    parameters.details = 'on';
                } else {
                    parameters.details = 'off';
                }
            } else {
                parameters.details = default_details;
                options.details = default_details === 'on';
            }
        }

        return parameters;
    };

    var parse_pagination_options2 = function parse_pagination_options2(options, optionsparams) {
        var parameters = {};

        if (options.limit != null) {
            if (typeof options.limit !== 'number' || !Number.isInteger(options.limit) || options.limit < 1) {
                throw new TypeError('invalid value for the limit option');
            }
            parameters.limit = options.limit;
        } else {
            options.limit = 20;
        }

        if (options.offset != null) {
            if (typeof options.offset !== 'number' || !Number.isInteger(options.offset) || options.offset < 0) {
                throw new TypeError('invalid value for the offset option');
            }
            parameters.offset = options.offset;
        } else {
            options.offset = 0;
        }

        if (options.count != null) {
            if (typeof options.count !== 'boolean') {
                throw new TypeError('invalid value for the count option');
            }
            optionsparams.push('count');
        }

        return parameters;
    };

    var parse_error_response = function parse_error_response(response) {
        if (response.getHeader('Content-Type') !== 'application/json') {
            throw new TypeError("Unexpected response mimetype");
        }

        return JSON.parse(response.responseText);
    };

    NGSI.parseNotifyContextRequest = function parseNotifyContextRequest(data, options) {
        return {
            elements: parse_context_response_list_json(data.contextResponses, false, options)[0],
            "subscriptionId": data.subscriptionId,
            "originator": data.originator
        };
    };

    var init = function init() {
        return this.makeRequest(new URL(NGSI.proxy_endpoints.EVENTSOURCE_COLLECTION, this.url), {
            supportsAccessControl: true,  // required for using CORS on WireCloud
            method: 'POST'
        }).then(
            function (response) {
                if ([0, 502, 504].indexOf(response.status) !== -1) {
                    privates.get(this).promise = null;
                    return Promise.reject(new NGSI.ConnectionError());
                } else if (response.status !== 201) {
                    privates.get(this).promise = null;
                    return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status));
                }

                var priv = privates.get(this);
                priv.source_url = response.getHeader('Location');
                if (priv.source_url == null) {
                    return Promise.reject(new NGSI.InvalidResponseError('Missing Location Header'));
                }
                return connect_to_eventsource.call(this);
            }.bind(this),
            function (error) {
                privates.get(this).promise = null;

                // Allow to customize error details by "backends"
                if (!(error instanceof NGSI.ConnectionError)) {
                    error = new NGSI.ConnectionError();
                }
                return Promise.reject(error);
            }.bind(this)
        );
    };

    var connect_to_eventsource = function connect_to_eventsource() {
        return new Promise(function (resolve, reject) {
            var closeTimeout;
            var _wait_event_source_init = null;
            var priv = privates.get(this);
            var wait_event_source_init = function wait_event_source_init(e) {
                var data = JSON.parse(e.data);

                clearTimeout(closeTimeout);

                priv.promise = null;
                priv.connection_id = data.id;

                priv.source.removeEventListener('init', _wait_event_source_init, true);
                priv.source.addEventListener('notification', function (e) {
                    var data = JSON.parse(e.data);
                    priv.callbacks[data.callback_id].method(data.payload, data.headers);
                }.bind(this), true);

                resolve();
            };

            _wait_event_source_init = wait_event_source_init.bind(this);
            priv.source = new EventSource(priv.source_url);
            priv.source.addEventListener('init', _wait_event_source_init, true);

            closeTimeout = setTimeout(function () {
                priv.promise = null;
                priv.source.close();
                priv.source = null;
                reject(new NGSI.ConnectionError("Connection timeout"));
            }.bind(this), 30000);
        }.bind(this));
    };

    var on_callback_subscriptions_get = function on_callback_subscriptions_get() {
        var mapping = {};
        var callbacks = privates.get(this).callbacks;
        for (var key in callbacks) {
            mapping[key] = callbacks[key].subscription;
        }
        return mapping;
    };

    var on_connected_get = function on_connected_get() {
        var priv = privates.get(this);
        return priv.source != null && priv.connection_id != null
    };

    var on_connecting_get = function on_connecting_get() {
        return privates.get(this).promise !== null;
    };

    var on_connection_id_get = function on_connection_id_get() {
        return privates.get(this).connection_id;
    };

    var on_subscription_callbacks_get = function on_subscription_callbacks_get() {
        var mapping = {};
        var subscriptions = privates.get(this).callbacksBySubscriptionId;
        for (var key in subscriptions) {
            mapping[key] = subscriptions[key].callback_id;
        }
        return mapping;
    };

    NGSI.ProxyConnection = function ProxyConnection(url, makeRequest /* TODO */) {

        try {
            url = new URL(url);
        } catch (e) {
            throw new TypeError("invalid url parameter");
        }

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new TypeError("unsupported protocol: " + url.protocol.substr(0, url.protocol.length - 1));
        }

        if (url.pathname[url.pathname.length - 1] !== '/') {
            url.pathname += '/';
        }

        this.makeRequest = makeRequest;
        privates.set(this, {
            callbacks: {},
            callbacksBySubscriptionId: {},
            connected: false,
            connection_id: null,
            promise: null,
            source: null
        });

        Object.defineProperties(this, {
            callbackSubscriptions: {
                get: on_callback_subscriptions_get
            },
            connected: {
                get: on_connected_get
            },
            connecting: {
                get: on_connecting_get
            },
            connection_id: {
                get: on_connection_id_get
            },
            subscriptionCallbacks: {
                get: on_subscription_callbacks_get
            },
            url: {
                value: url
            }
        });
    };

    /**
     * Stablishes the connection with the ngsi proxy.
     *
     * @returns {Promise}
     */
    NGSI.ProxyConnection.prototype.connect = function connect() {
        if (this.connected === true) {
            return Promise.resolve();
        }

        var priv = privates.get(this);
        if (priv.promise === null) {
            priv.promise = init.call(this);
        }

        return priv.promise;
    };

    /**
     * Requests a new callback endpoint
     *
     * @param {Function} listener
     *     function that will be called when a notification arrives through the
     *     ngsi-proxy callback endpoint.
     * @returns {Promise}
     */
    NGSI.ProxyConnection.prototype.requestCallback = function requestCallback(callback) {
        if (typeof callback !== 'function') {
            throw new TypeError('callback parameter must be a function');
        }

        return this.connect().then(function () {
            return this.makeRequest(this.url + NGSI.proxy_endpoints.CALLBACK_COLLECTION, {
                supportsAccessControl: true,  // required for using CORS on WireCloud
                method: 'POST',
                contentType: 'application/json',
                postBody: JSON.stringify({connection_id: this.connection_id})
            }).then(
                function (response) {
                    if ([200, 201].indexOf(response.status) === -1) {
                        return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status));
                    }
                    var data = JSON.parse(response.responseText);
                    var priv = privates.get(this);
                    priv.callbacks[data.callback_id] = {
                        callback_id: data.callback_id,
                        method: callback,
                        subscription: null
                    };
                    return Promise.resolve(data);
                }.bind(this),
                function (error) {
                    // Allow to customize error details by "backends"
                    if (!(error instanceof NGSI.ConnectionError)) {
                        error = new NGSI.ConnectionError();
                    }
                    return Promise.reject(error);
                }
            );
        }.bind(this));
    };

    /**
     * Closes the connection with the ngsi-proxy. All the callback endpoints
     * will be removed.
     *
     * @returns {Promise}
     */
    NGSI.ProxyConnection.prototype.close = function close() {
        if (this.connected === false) {
            return Promise.resolve();
        }

        var priv = privates.get(this);
        return this.makeRequest(priv.source_url, {
            supportsAccessControl: true,  // required for using CORS on WireCloud
            method: 'DELETE'
        }).then(
            function (response) {
                if (response.status !== 204) {
                    return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status));
                }
                priv.source.close();
                priv.source = null;
                priv.connection_id = null;
                priv.callbacks = {};
                priv.callbacksBySubscriptionId = {};
            }.bind(this),
            function (error) {
                // Allow to customize error details by "backends"
                if (!(error instanceof NGSI.ConnectionError)) {
                    error = new NGSI.ConnectionError();
                }
                return Promise.reject(error);
            }
        );
    };

    /**
     * Deletes a callback from the ngsi-proxy server
     *
     * @param {String} callback
     *     id of the callback to delete
     * @returns {Promise}
     */
    NGSI.ProxyConnection.prototype.closeCallback = function closeCallback(callback_id) {
        return this.makeRequest(this.url + NGSI.proxy_endpoints.CALLBACK_COLLECTION + '/' + callback_id, {
            supportsAccessControl: true,  // required for using CORS on WireCloud
            method: 'DELETE'
        }).then(
            function (response) {
                if (response.status !== 204) {
                    return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status));
                }
                this.purgeCallback(callback_id);
            }.bind(this),
            function (error) {
                // Allow to customize error details by "backends"
                if (!(error instanceof NGSI.ConnectionError)) {
                    error = new NGSI.ConnectionError();
                }
                return Promise.reject(error);
            }
        );
    };

    /**
     * Associates a callback with a the indicated NGSI subscription. If the
     * callback is currently not managed by this proxy connection, the
     * association is ignored.
     *
     * @param {String} callback
     *     id of the callback to associate
     * @param {String} subscription
     *     id of the subscription to associate
     * @returns {NGSI.ProxyConnection}
     */
    NGSI.ProxyConnection.prototype.associateSubscriptionId = function associateSubscriptionId(callback, subscription) {
        var priv = privates.get(this);

        if (!(callback in priv.callbacks)) {
            return this;
        }

        if (priv.callbacks[callback].subscription != null) {
            throw new TypeError("Already associated callback");
        }

        priv.callbacksBySubscriptionId[subscription] = priv.callbacks[callback];
        priv.callbacks[callback].subscription = subscription;

        return this;
    };

    /**
     * Closes the callback associated with the indicated subscription. If the
     * subscription is currently not managed by this proxy connection, the
     * operation is ignored.
     *
     * @param {String} subscription
     *     id of the subscription to close
     * @returns {Promise}
     */
    NGSI.ProxyConnection.prototype.closeSubscriptionCallback = function closeSubscriptionCallback(subscription) {
        var priv = privates.get(this);

        if (subscription in priv.callbacksBySubscriptionId) {
            return this.closeCallback(priv.callbacksBySubscriptionId[subscription].callback_id);
        } else {
            return Promise.resolve();
        }
    };

    /**
     * Removes the callback from this proxy connection.
     */
    NGSI.ProxyConnection.prototype.purgeCallback = function purgeCallback(callback) {
        var priv = privates.get(this);

        if (callback in priv.callbacks) {
            var subscription = priv.callbacks[callback].subscription;
            if (subscription != null) {
                delete priv.callbacksBySubscriptionId[subscription];
            }
            delete priv.callbacks[callback];
        }
    };

    /* NGSI Connection Error */

    /**
     * Error raised if there are problems connecting to the context broker
     * server. Browsers doesn't provide details about the connection problem due
     * security concerns, so this exception doesn't provide those details.
     *
     * @class
     * @extends Error
     * @name NGSI.ConnectionError
     * @summary Exception raised for connection problems.
     */
    NGSI.ConnectionError = function ConnectionError(message) {
        this.name = 'ConnectionError';
        this.message = message || 'Connection Error';
    };
    NGSI.ConnectionError.prototype = new Error();
    NGSI.ConnectionError.prototype.constructor = NGSI.ConnectionError;

    /**
     * Error raised if the context broker server detected some problems with the
     * data provided in the request.
     *
     * @class
     * @extends Error
     * @name NGSI.InvalidRequestError
     * @summary Exception raised when the context broker server reject the
     * request.
     */
    NGSI.InvalidRequestError = function InvalidRequestError(code, message, details) {
        this.name = 'InvalidRequest';
        this.code = code;
        this.message = message || '';
        this.details = details || '';
    };
    NGSI.InvalidRequestError.prototype = new Error();
    NGSI.InvalidRequestError.prototype.constructor = NGSI.InvalidRequestError;

    /**
     * Exception raised when the server returns an unexpected response. This
     * usually means that the server doesn't conform to the FIWARE NGSI
     * Specification or that the server doesn't use a version supported by this
     * library.
     *
     * @class
     * @extends Error
     * @name NGSI.InvalidResponseError
     * @summary Exception raised when detecting invalid responses from the
     * server.
     */
    NGSI.InvalidResponseError = function InvalidResponseError(message, correlator) {
        this.name = 'InvalidResponse';
        this.message = message || '';
        this.correlator = correlator;
    };
    NGSI.InvalidResponseError.prototype = new Error();
    NGSI.InvalidResponseError.prototype.constructor = NGSI.InvalidResponseError;

    NGSI.NotFoundError = function NotFoundError(options) {
        this.name = 'NotFound';
        this.message = options.message || '';
        this.details = options.details || '';
        this.correlator = options.correlator || null;
    };
    NGSI.NotFoundError.prototype = new Error();
    NGSI.NotFoundError.prototype.constructor = NGSI.NotFoundError;

    NGSI.ProxyConnectionError = function ProxyConnectionError(cause) {
        this.name = 'ProxyConnectionError';
        this.cause = cause;
    };
    NGSI.ProxyConnectionError.prototype = new Error();
    NGSI.ProxyConnectionError.prototype.constructor = NGSI.ProxyConnectionError;

    /**
     * Creates a new NGSI Connection.
     *
     * @name NGSI.Connection
     * @class
     * @summary A context broker connection.
     *
     * @param {String|URL} url URL of the context broker
     * @param {Object} options
     *
     * @example <caption>Basic usage</caption>
     *
     * var connection = new NGSI.Connection("https://orion.example.com");
     *
     * @example <caption>Using the FIWARE Lab's instance</caption>
     *
     * var connection = new NGSI.Connection("http://orion.lab.fiware.org", {
     *     requestHeaders: {
     *         "X-Auth-Token": token
     *     }
     * });
     *
     **/
    NGSI.Connection = function NGSIConnection(url, options) {

        try {
            url = new URL(url);
        } catch (e) {
            throw new TypeError("invalid url parameter");
        }

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new TypeError("unsupported protocol: " + url.protocol.substr(0, url.protocol.length - 1));
        }

        if (url.pathname[url.pathname.length - 1] !== '/') {
            url.pathname += '/';
        }

        if (options == null) {
            options = {};
        }

        if (options.request_headers != null) {
            this.request_headers = options.request_headers;
        } else {
            this.request_headers = {};
        }

        if (options.service != null) {
            deleteHeader("FIWARE-Service", this.request_headers);
            this.request_headers["FIWARE-Service"] = options.service;
        }

        if (options.servicepath != null) {
            deleteHeader("FIWARE-ServicePath", this.request_headers);
            this.request_headers["FIWARE-ServicePath"] = options.servicepath;
        }

        if (typeof options.requestFunction === 'function') {
            this.makeRequest = options.requestFunction;
        }

        if (options.ngsi_proxy_connection instanceof NGSI.ProxyConnection) {
            this.ngsi_proxy = options.ngsi_proxy_connection;
        } else if (typeof options.ngsi_proxy_url === 'string') {
            this.ngsi_proxy = new NGSI.ProxyConnection(options.ngsi_proxy_url, this.makeRequest);
        }

        Object.defineProperties(this, {
            url: {value: url},
            v1: {value: this},
            v2: {value: new NGSI.Connection.V2(this)}
        });
    };

    /**
     * Registers context information (entities and attributes) into the NGSI
     * server.
     *
     * @name NGSI.Connection@v1.createRegistration
     * @memberof NGSI.Connection
     * @method "v1.createRegistration"
     *
     * @param {Array} entities
     *
     * the list of entities that are going to be registered
     *
     * @param {Array} attributes
     *
     * the list of attributes that are going to be assigned to
     * the entities
     *
     * @param {String} duration
     *
     * time interval during which the registration will be active, using as
     * reference the current time. String following the format defined at
     * http://books.xmlschemata.org/relaxng/ch19-77073.html.
     *
     * @param {String} providingApplication
     *
     * the URI of the application to which this registration will belongs to
     *
     * @param {Object} [callbacks]
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     *
     * @example
     *
     * connection.v1.createRegistration([
     *         {type: 'Technician', id: 'entity1'}
     *     ], [
     *         {name: 'attr1', type: 'string'},
     *         {name: 'attr2'},
     *         {name: 'attr3', type: 'number'}
     *     ],
     *     'PT24H',
     *     'http://app.example.com/',
     *     {
     *         onSuccess: function (data) {
     *             //data.subscriptionId
     *         }
     *     }
     * );
     *
     */
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
        var url = new URL(NGSI.endpoints.REGISTER_CONTEXT, this.url);

        makeJSONRequest.call(this, url, payload, parse_register_context_response, callbacks);
    };

    /**
     * Updates an existing registration.
     *
     * @name NGSI.Connection#v1.updateRegistration
     * @memberof NGSI.Connection
     * @method "v1.updateRegistration"
     *
     * @param {String} regId
     *
     * id of the registration to update
     *
     * @param {Array} entities
     *
     * list of entities to update
     *
     * @param {Array} attributes
     *
     * list of attributes to associate with this registration
     *
     * @param {String} duration
     *
     * time interval during which the registration will be active, using as
     * reference the current time. String following the format defined at
     * http://books.xmlschemata.org/relaxng/ch19-77073.html.
     *
     * @param {String} providingApplication
     *
     * URL identifing the source of the context information
     *
     * @param {Object} [callbacks]
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example
     *
     * connection.v1.updateRegistration("167",
     *     [
     *         {type: 'Technician', id: 'entity1'}
     *     ],
     *     [
     *         {name: 'attr1', type: 'string'},
     *         {name: 'attr2'}
     *     ],
     *     'PT24H',
     *     'http://app.example.com/'
     * );
     *
     */
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
        var url = new URL(NGSI.endpoints.REGISTER_CONTEXT, this.url);

        return makeJSONRequest.call(this, url, payload, parse_register_context_response, callbacks);
    };

    /**
     * Cancels an existing registration by marking it as expired.
     *
     * @name NGSI.Connection#v1.updateRegistration
     * @memberof NGSI.Connection
     * @method "v1.updateRegistration"
     *
     * @param {String} regId
     *
     * id of the registration to cancelRegistration
     *
     * @param {Object} [callbacks]
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example
     *
     * connection.v1.cancelRegistration("167", {
     *     onSuccess: function () {
     *         // Registration cancelled successfully
     *     }
     * });
     */
    NGSI.Connection.prototype.cancelRegistration = function cancelRegistration(regId, callbacks) {
        if (regId == null) {
            throw new TypeError('regId parameter cannot be null');
        }
        this.updateRegistration(regId, [{id: 'canceled registration'}], [], 'PT0H', 'http://canceled.registration.com', callbacks);
    };

    /**
     * Discovers context information registrations on the NGSI server.
     *
     * @name NGSI.Connection#v1.discoverAvailability
     * @memberof NGSI.Connection
     * @method "v1.discoverAvailability"
     *
     * @param {Array} entities
     *
     * the list of **Entities** that are going to be queried
     *
     * @param {?Array} attributeNames
     *
     * list of attribute names to query. Use `null` for retrieving all the attributes
     *
     * @param {Object} [callbacks]
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example
     *
     * connection.v1.discoverAvailability([
     *         {type: 'Technician', id: 'entity1'},
     *         {type: 'Van', id: '.*', isPattern: true},
     *     ],
     *     null,
     *     {
     *         onSuccess: function (registrations) {
     *             ...
     *         }
     *     }
     * );
     *
     */
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
        var url = new URL(NGSI.endpoints.DISCOVER_CONTEXT_AVAILABILITY, this.url);

        makeJSONRequest.call(this, url, payload, parse_discover_context_availability_response, callbacks);
    };

    /**
     * Creates a subscription about context availability.
     *
     * @name NGSI.Connection#v1.createAvailabilitySubscription
     * @memberof NGSI.Connection
     * @method "v1.createAvailabilitySubscription"
     *
     * @param {Array} entities
     *
     * the list of **Entities** that are going to be queried
     *
     * @param {?Array} attributeNames
     *
     * list of attribute names to query. Use `null` for retrieving all the attributes
     *
     * @param {?String} duration
     *
     * time interval during which the registration will be active, using as
     * reference the current time. String following the format defined at
     * http://books.xmlschemata.org/relaxng/ch19-77073.html.
     *
     * @param {Object} restriction
     *
     *
     * @param {Object} [options]
     *
     * - `onNotify`: URL of the service or callback function to be used for
     *   notifying updates in the context availability
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     */
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
        if (typeof options.onNotify !== 'string' && typeof options.onNotify !== 'function') {
            throw new TypeError('Invalid onNotify callback');
        }
        if (typeof options.onNotify === 'function' && this.ngsi_proxy == null) {
            throw new TypeError('A ngsi-proxy is needed for using local onNotify callbacks');
        }

        var url = new URL(NGSI.endpoints.SUBSCRIBE_CONTEXT_AVAILABILITY, this.url);
        if (typeof options.onNotify === 'function' && this.ngsi_proxy != null) {

            var onNotify = function onNotify(payload) {
                var doc = JSON.parse(payload);
                var data = parse_notify_context_availability_request(doc, options);
                options.onNotify(data);
            };

            this.ngsi_proxy.requestCallback(onNotify).then(function (proxy_callback) {
                var payload = ngsi_build_subscribe_update_context_availability_request(entities, attributeNames, duration, restriction, null, proxy_callback.url);

                var oldOnFailure = options.onFailure;
                options.onFailure = function () {
                    this.ngsi_proxy.closeCallback(proxy_callback.callback_id);
                    if (typeof oldOnFailure === 'function') {
                        oldOnFailure.apply(this, arguments);
                    }
                }.bind(this);

                var oldOnSuccess = options.onSuccess;
                options.onSuccess = function (data) {
                    this.ngsi_proxy.associateSubscriptionId(proxy_callback.callback_id, data.subscriptionId);
                    if (typeof oldOnSuccess === 'function') {
                        oldOnSuccess(data);
                    }
                }.bind(this);

                makeJSONRequest.call(this, url, payload, parse_subscribe_update_context_availability_response, options);
            }.bind(this), function () {
                if (typeof options.onFailure === 'function') {
                    options.onFailure();
                }
            });
        } else {
            var payload = ngsi_build_subscribe_update_context_availability_request(entities, attributeNames, duration, restriction, null, options.onNotify);
            makeJSONRequest.call(this, url, payload, parse_subscribe_update_context_availability_response, options);
        }
    };

    /**
     * Updates an existing context availability subscription.
     *
     * @name NGSI.Connection#v1.updateAvailabilitySubscription
     * @memberof NGSI.Connection
     * @method "v1.updateAvailabilitySubscription"
     *
     * @param {String} subId
     *
     * id of the subscription to update
     *
     * @param {Array} entities
     *
     * the list of **Entities** that are going to be queried
     *
     * @param {?Array} attributeNames
     *
     * list of attribute names to query. Use `null` for retrieving all the attributes
     *
     * @param {?String} duration
     *
     * time interval during which the registration will be active, using as
     * reference the current time. String following the format defined at
     * http://books.xmlschemata.org/relaxng/ch19-77073.html.
     *
     * @param {Object} restriction
     *
     * @param {Object} [callbacks]
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     */
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

        var payload = ngsi_build_subscribe_update_context_availability_request(entities, attributeNames, duration, restriction, subId);
        var url = new URL(NGSI.endpoints.UPDATE_CONTEXT_AVAILABILITY_SUBSCRIPTION, this.url);

        makeJSONRequest.call(this, url, payload, parse_subscribe_update_context_availability_response, callbacks);
    };

    /**
     * Cancels an existing context availability subscription.
     *
     * @name NGSI.Connection#v1.cancelAvailabilitySubscription
     * @memberof NGSI.Connection
     * @method "v1.cancelAvailabilitySubscription"
     *
     * @param {String} subId
     *
     * id of the subscription to cancel
     *
     * @param {Object} [callbacks]
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     */
    NGSI.Connection.prototype.cancelAvailabilitySubscription = function cancelAvailabilitySubscription(subId, callbacks) {
        if (subId == null) {
            throw new TypeError('subId parameter cannot be null');
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_unsubscribe_context_availability_request(subId);
        var url = new URL(NGSI.endpoints.UNSUBSCRIBE_CONTEXT_AVAILABILITY, this.url);

        makeJSONRequest.call(this, url, payload, parse_unsubscribe_context_availability_response, callbacks);
    };

    /**
     * Query for context information. That information is returned using pagination
     * (see supported options), so its very recommended the use of the `details`
     * option.
     *
     * @name NGSI.Connection#v1.query
     * @memberof NGSI.Connection
     * @method "v1.query"
     *
     * @param {Array} Entities
     *
     * list of **Entities** to query
     *
     * @param {?Array} attributeNames
     *
     * list of attribute names to query. Use `null` for retrieving all the attributes
     *
     * @param {Object} options
     *
     * - `details` (`Boolean`; default: `false`): Request total count
     * - `limit` (`Number`; default: `20`): This option allow you to specify
     *   the maximum number of entities you want to receive from the server
     * - `offset` (`Number`; default: `0`): Allows you to skip a given number of
     *   elements at the beginning
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example
     * connection.v1.query([
     *         {type: 'Technician', id: '.*', isPattern: true}
     *     ],
     *     null,
     *     {
     *         limit: 100,
     *         offset: 200,
     *         details: true
     *         onSuccess: function (data, details) {
     *             ...
     *         }
     *     }
     * );
     *
     */
    NGSI.Connection.prototype.query = function query(entities, attributesName, options) {
        var url, parameters, payload;

        if (!Array.isArray(entities) || entities.length === 0) {
            throw new TypeError('entities parameter must be a non-empty array');
        }

        if (attributesName != null && !Array.isArray(attributesName)) {
            throw new TypeError('attributesName must be null or an array');
        } else if (attributesName == null) {
            attributesName = [];
        }

        if (options == null) {
            options = {};
        }

        parameters = parse_pagination_options(options, 'off');

        url = new URL(NGSI.endpoints.QUERY_CONTEXT, this.url);
        payload = ngsi_build_query_context_request(entities, attributesName, options.restriction);
        makeJSONRequest.call(this, url, payload, parse_query_context_response, options, parameters);
    };

    /**
     * Updates entity attributes
     *
     * @name NGSI.Connection#v1.updateAttributes
     * @memberof NGSI.Connection
     * @method "v1.updateAttributes"
     *
     * @param {Array} update
     *
     *   attribute changes
     *
     * @param {Object} [options]
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example
     *
     * connection.v1.updateAttributes([
     *         {
     *             'entity': {type: 'Technician', id: 'entity1'},
     *             'attributes': [
     *                 {name: 'mobile_phone', type: 'string', contextValue: '0034223456789'},
     *                 {name: 'attr2', contextValue: 'value'},
     *                 {name: 'attr3', contextValue: 5}
     *             ]
     *         }
     *     ], {
     *         onSuccess: function (data) {
     *         }
     *     }
     * );
     *
     */
    NGSI.Connection.prototype.updateAttributes = function updateAttributes(update, callbacks) {
        if (!Array.isArray(update) || update.length === 0) {
            throw new TypeError('update parameter must be a non-empty array');
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_update_context_request('UPDATE', update);
        var url = new URL(NGSI.endpoints.UPDATE_CONTEXT, this.url);

        makeJSONRequest.call(this, url, payload, parse_update_context_response, callbacks);
    };

    /**
     * Adds or updates entity attributes. This operation will create attributes
     * and entities.
     *
     * @name NGSI.Connection#v1.addAttributes
     * @memberof NGSI.Connection
     * @method "v1.addAttributes"
     *
     * @param {Array} toAdd
     *
     * attribute additions
     *
     * @param {Object} [options]
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example
     *
     * connection.v1.addAttributes([
     *         {
     *             'entity': {type: 'Technician', id: 'entity1'},
     *             'attributes': [
     *                 {'name': 'new_attribute', 'type': 'string', 'contextValue': 'value'}
     *             ]
     *         }
     *     ], {
     *         onSuccess: function (data, partial_errors) {
     *         }
     *     }
     * );
     *
     */
    NGSI.Connection.prototype.addAttributes = function addAttributes(toAdd, callbacks) {
        if (!Array.isArray(toAdd) || toAdd.length === 0) {
            throw new TypeError('toAdd parameter must be a non-empty array');
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_update_context_request('APPEND', toAdd);
        var url = new URL(NGSI.endpoints.UPDATE_CONTEXT, this.url);

        makeJSONRequest.call(this, url, payload, parse_update_context_response, callbacks);
    };

    /**
     * Deletes attributes form entities. This method also removes entities from
     * the context broker server.
     *
     * @name NGSI.Connection#v1.deleteAttributes
     * @memberof NGSI.Connection
     * @method "v1.deleteAttributes"
     *
     * @param {Array} toDelete
     *
     * attributes to remove
     *
     * @param {Object} [callbacks]
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example <caption>Removing the `position` attribute from the `Madrid` entity</caption>
     *
     * connection.v1.deleteAttributes([
     *         {
     *             'entity': {type: 'City', id: 'Madrid'},
     *             'attributes': {
     *                 'name': 'position',
     *                 'type': 'coords'
     *             }
     *         }
     *     ], {
     *         onSuccess: function (data, partial_errors) {
     *         }
     *     }
     * );
     *
     * @example <caption>Removing `Madrid` from the context broker</caption>**
     *
     * connection.v1.deleteAttributes([
     *         {
     *             'entity': {type: 'City', id: 'Madrid'}
     *         }
     *     ], {
     *         onSuccess: function (data, partial_errors) {
     *         }
     *     }
     * );
     *
     */
    NGSI.Connection.prototype.deleteAttributes = function deleteAttributes(toDelete, callbacks) {
        if (!Array.isArray(toDelete) || toDelete.length === 0) {
            throw new TypeError('toDelete parameter must be a non-empty array');
        }

        if (callbacks == null) {
            callbacks = {};
        }

        var payload = ngsi_build_update_context_request('DELETE', toDelete);
        var url = new URL(NGSI.endpoints.UPDATE_CONTEXT, this.url);

        makeJSONRequest.call(this, url, payload, parse_update_context_response, callbacks);
    };

    /**
     * Creates a context information subscription.
     *
     * @name NGSI.Connection#v1.createSubscription
     * @memberof NGSI.Connection
     * @method "v1.createSubscription"
     *
     * @param {Array} entities
     *
     * the list of **Entities** that are going to be queried
     *
     * @param {?Array} attributeNames
     *
     * list of attribute names to query. Use `null` for retrieving all the attributes
     *
     * @param {?String} duration
     *
     * time interval during which the registration will be active, using as
     * reference the current time. String following the format defined at
     * http://books.xmlschemata.org/relaxng/ch19-77073.html.
     *
     * @param {?String} throttling
     *
     * minimal period of time in seconds which must elapse between two
     * consecutive notifications. String following the format defined at
     * http://books.xmlschemata.org/relaxng/ch19-77073.html.
     *
     * @param {Array} cond
     *
     * declare the condition or conditions that will trigger notifications.
     *
     * @param {Object} [options]
     *
     * - `onNotify`: URL of the service or callback function to be used for
     *   notifying updates in the context availability
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example
     *
     * connection.v1.createSubscription([
     *         {type: 'Technician', id: 'tech*', isPattern: true},
     *         {type: 'Van', id: 'van1'},
     *     ],
     *     null,
     *     'PT24H',
     *     null,
     *     [{type: 'ONCHANGE', condValues: ['position']}],
     *     {
     *         onNotify: function (data) {
     *             // called when a notification arrives
     *         },
     *         onSuccess: function (data) {
     *             // subscription created successfully
     *             // data.subscriptionId contains the id associated with the created subscription
     *         }
     *     }
     * );
     *
     */
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
        if (typeof options.onNotify !== 'string' && typeof options.onNotify !== 'function') {
            throw new TypeError('Invalid onNotify callback');
        }
        if (typeof options.onNotify === 'function' && this.ngsi_proxy == null) {
            throw new TypeError('A ngsi-proxy is needed for using local onNotify callbacks');
        }

        var url = new URL(NGSI.endpoints.SUBSCRIBE_CONTEXT, this.url);
        if (typeof options.onNotify === 'function' && this.ngsi_proxy != null) {

            var onNotify = function onNotify(payload) {
                var doc = JSON.parse(payload);
                var data = NGSI.parseNotifyContextRequest(doc, options);
                options.onNotify(data);
            };

            this.ngsi_proxy.requestCallback(onNotify).then(function (proxy_callback) {
                var payload = ngsi_build_subscribe_update_context_request(null, entities, attributeNames, duration, throttling, cond, proxy_callback.url);

                var oldOnFailure = options.onFailure;
                options.onFailure = function () {
                    this.ngsi_proxy.closeCallback(proxy_callback.callback_id);
                    if (typeof oldOnFailure === 'function') {
                        oldOnFailure.apply(this, arguments);
                    }
                }.bind(this);

                var oldOnSuccess = options.onSuccess;
                options.onSuccess = function (data) {
                    this.ngsi_proxy.associateSubscriptionId(proxy_callback.callback_id, data.subscriptionId);
                    if (typeof oldOnSuccess === 'function') {
                        oldOnSuccess(data);
                    }
                }.bind(this);

                makeJSONRequest.call(this, url, payload, parse_subscribe_context_response, options);
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
            makeJSONRequest.call(this, url, payload, parse_subscribe_context_response, options);
        }
    };

    /**
     * Updates a context subcription.
     *
     * @name NGSI.Connection#v1.updateSubscription
     * @memberof NGSI.Connection
     * @method "v1.updateSubscription"
     *
     * @param {String} subId
     *
     * id of the subscription to update
     *
     * @param {?String} duration
     *
     * time interval during which the registration will be active, using as
     * reference the current time. String following the format defined at
     * http://books.xmlschemata.org/relaxng/ch19-77073.html.
     *
     * @param {?String} throttling
     *
     * minimal period of time in seconds which must elapse between two
     * consecutive notifications. String following the format defined at
     * http://books.xmlschemata.org/relaxng/ch19-77073.html.
     *
     * @param {?Object} cond
     *
     * declare the condition or conditions that will trigger notifications. Pass
     * `null` for not modifying current conditions.
     *
     * @param {Object} [options]
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example
     *
     * connection.v1.updateSubscription(
     *     'sub1',
     *     'PT20H',
     *     null,
     *     null,
     *     {
     *         onSuccess: function (response_data) {
     *             // subscription updated successfully
     *         }
     *     }
     * );
     */
    NGSI.Connection.prototype.updateSubscription = function updateSubscription(subId, duration, throttling, cond, options) {
        if (subId == null) {
            throw new TypeError('subId parameter cannot be null');
        }

        if (options == null) {
            options = {};
        }

        var payload = ngsi_build_subscribe_update_context_request(subId, null, null, duration, throttling, cond);
        var url = new URL(NGSI.endpoints.UPDATE_CONTEXT_SUBSCRIPTION, this.url);

        makeJSONRequest.call(this, url, payload, parse_update_context_subscription_response, options);
    };

    /**
     * Cancels a context subscription
     *
     * @name NGSI.Connection#v1.cancelSubscription
     * @memberof NGSI.Connection
     * @method "v1.cancelSubscription"
     *
     * @param {String} subId
     *
     * id of the context subscription to cancel
     *
     * @param {Object} [options]
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example
     *
     * connection.v1.cancelSubscription('sub1',
     *     {
     *         onSuccess: function (data) {
     *             // Subscription canceled successfully
     *             // data.subscriptionId should be equal to 'sub1'
     *         }
     *     }
     * );
     *
     */
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
                this.ngsi_proxy.closeSubscriptionCallback(data.subscriptionId);
                if (typeof old_success_callback === "function") {
                    old_success_callback(data);
                }
            }.bind(this);
        }
        var payload = ngsi_build_unsubscribe_context_request(subId);
        var url = new URL(NGSI.endpoints.UNSUBSCRIBE_CONTEXT, this.url);

        makeJSONRequest.call(this, url, payload, parse_unsubscribe_context_response, options);
    };

    /**
     * Gets info about about the used context types. This information is
     * currently composed of the type name and the attributes used with that
     * type (the attribute set returned by this operation is the union of the
     * attributes used in each of the entities belonging to that type).
     *
     * @name NGSI.Connection
     * @memberof NGSI.Connection
     * @method "v1.getAvailableTypes"
     *
     * @param {Object} [options]
     *
     * - `details` (`Boolean`; default: `true`): Request total count
     * - `limit` (`Number`; default: `20`): This option allow you to specify
     *   the maximum number of entities you want to receive from the server
     * - `offset` (`Number`; default: `0`): Allows you to skip a given number of
     *   elements at the beginning
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example
     *
     * connection.v1.getAvailableTypes({
     *     onSuccess: function (types, details) {
     *         // The types parameter contains the information
     *         // about the available types, see next slide for
     *         // more info
     *     }
     * });
     *
     */
    NGSI.Connection.prototype.getAvailableTypes = function getAvailableTypes(options) {
        var url = new URL(NGSI.endpoints.CONTEXT_TYPES, this.url);
        var parameters = parse_pagination_options(options, 'on');
        makeJSONRequest.call(this, url, null, parse_available_types_response, options, parameters);
    };

    /**
     * Gets info about about a concrete entity type. This information is
     * currently composed of the type name and the attributes used with that
     * type (the attribute set returned by this operation is the union of the
     * attributes used in each of the entities belonging to that type).
     *
     * @name NGSI.Connection#v1.getTypeInfo
     * @memberof NGSI.Connection
     * @method "v1.getTypeInfo"
     *
     * @param {String} type
     *
     * Name of the type to query about
     *
     * @param {Object} options
     *
     * - `onSuccess`: callback called if the request finishes successfully
     * - `onFailure`: callback called if the request finishes with errors
     * - `onComplete`: callback called regardless of whether the request is
     *   successful or not
     *
     * @example
     *
     * connection.v1.getTypeInfo("Room", {
     *     onSuccess: function (type_info) {
     *         // The type_info parameter contains the information
     *         // about the Room type, see next slide for more info
     *     }
     * });
     *
     */
    NGSI.Connection.prototype.getTypeInfo = function getTypeInfo(type, options) {

        if (type == null) {
            throw new TypeError("Invalid type parameter");
        }

        var url = new URL(NGSI.endpoints.CONTEXT_TYPES + '/' + encodeURIComponent(type), this.url);
        makeJSONRequest.call(this, url, null, parse_type_info_response, options);
    };

    NGSI.Connection.V2 = function V2(connection) {
        privates.set(this, connection);
    };

    /**
     * Retrieves the available entities using pagination.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.listEntities
     * @method "v2.listEntities"
     * @memberof NGSI.Connection
     *
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `attrs` (`String`): Comma-separated list of attribute names whose data
     *   are to be included in the response. The attributes are retrieved in the
     *   order specified by this parameter. If this parameter is not included,
     *   the attributes are retrieved in arbitrary order.
     * - `correlator` (`String`): Transaction id
     * - `count` (`Boolean`; default: `false`): Request total count
     * - `id` (`String`): A comma-separated list of entity ids to retrieve
     * - `idPattern` (`String`): A correctly formated regular expression.
     *   Retrieve entities whose ID matches the regular expression. Incompatible
     *   with the `id` option
     * - `limit` (`Number`; default: `20`): This option allow you to specify
     *   the maximum number of entities you want to receive from the server
     * - `offset` (`Number`; default: `0`): Allows you to skip a given number of
     *   elements at the beginning
     * - `metadata` (`String`): A comma-separated list of metadata names to
     *   include in the response
     * - `mq` (`String`): A query expression for attribute metadata, composed of
     *   a list of statements separated by semicolons (`;`)
     * - `orderBy` (`String`): Criteria for ordering results
     * - `q` (`String`): A query expression, composed of a list of statements
     *   separated by semicolons (`;`)
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     * - `type` (`String`): A comma-separated list of entity types to retrieve
     * - `typePattern` (`String`): A correctly formated regular expression.
     *   Retrieve entities whose type matches the regular expression.
     *   Incompatible with the `type` option.
     * - `unique` (`Boolean`): Represent entities as an array of non-repeated
     *   attribute values.
     * - `values` (`Boolean`): Represent entities as an array of attribute
     *   values
     *
     * @returns {Promise}
     *
     * @example <caption>Retrieve first 20 entities from the Context Broker</caption>
     *
     * connection.v2.listEntities().then(
     *     (response) => {
     *         // Entities retrieved successfully
     *         // response.correlator transaction id associated with the server response
     *         // response.limit contains the used page size
     *         // response.results is an array with the retrieved entities
     *         // response.offset contains the offset used in the request
     *     }, (error) => {
     *         // Error retrieving entities
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Retrieve second page from the Context Broker requesting pagination details</caption>
     *
     * connection.v2.listEntities({offset: 20, count: true}).then(
     *     (response) => {
     *         // Entities retrieved successfully
     *         // response.results is an array with the retrieved entities
     *         // response.correlator transaction id associated with the server response
     *         // response.count contains the total number of entities selected
     *         //   by this query
     *         // response.offset contains the offset used in the request
     *     }, (error) => {
     *         // Error retrieving entities
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     */
    NGSI.Connection.V2.prototype.listEntities = function listEntities(options) {
        if (options == null) {
            options = {};
        }

        if (options.id != null && options.idPattern != null) {
            throw new TypeError('id and idPattern options cannot be used at the same time');
        }

        if (options.type != null && options.typePattern != null) {
            throw new TypeError('type and typePattern options cannot be used at the same time');
        }

        var connection = privates.get(this);
        var url = new URL(NGSI.endpoints.v2.ENTITY_COLLECTION, connection.url);
        var optionsparams = [];
        var parameters = parse_pagination_options2(options, optionsparams);

        if (options.keyValues === true) {
            optionsparams.push("keyValues");
        }
        if (options.values === true) {
            optionsparams.push("values");
        }
        if (options.unique === true) {
            optionsparams.push("unique");
        }
        if (optionsparams.length !== 0) {
            parameters.options = optionsparams.join(',');
        }

        parameters.attrs = options.attrs;
        parameters.id = options.id;
        parameters.idPattern = options.idPattern;
        parameters.orderBy = options.orderBy;
        parameters.metadata = options.metadata;
        parameters.mq = options.mq;
        parameters.q = options.q;
        parameters.type = options.type;
        parameters.typePattern = options.typePattern;
        parameters.georel = options.georel;
        parameters.geometry = options.geometry;
        parameters.coords = options.coords;

        return makeJSONRequest2.call(connection, url, {
            method: "GET",
            parameters: parameters,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');

            if (response.status !== 200) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }

            try {
                var data = JSON.parse(response.responseText);
            } catch (e) {
                return Promise.reject(new NGSI.InvalidResponseError('Server returned invalid JSON content', correlator));
            }

            var result = {
                results: data,
                limit: options.limit,
                offset: options.offset,
                correlator: correlator
            };
            if (options.count === true) {
                result.count = parseInt(response.getHeader("Fiware-Total-Count"), 10);
            }

            return Promise.resolve(result);
        });
    };

    /**
     * Creates a new entity.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.createEntity
     * @method "v2.createEntity"
     * @memberof NGSI.Connection
     *
     * @param {Object}
     *
     * entity values to be used for creating the new entity
     *
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `keyValues` (`Boolean`; default: `false`): Use flat attributes
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     *
     * @returns {Promise}
     *
     * @example <caption>Basic usage</caption>
     *
     * connection.v2.createEntity({
     *     "id": "Spain-Road-A62",
     *     "type": "Road",
     *     "name": {"value": "A-62"},
     *     "alternateName": {"value": "E-80"},
     *     "description": {"value": "Autovía de Castilla"},
     *     "roadClass": {"value": "motorway"},
     *     "length": {"value": 355},
     *     "refRoadSegment": {
     *         "value": [
     *             "Spain-RoadSegment-A62-0-355-forwards",
     *             "Spain-RoadSegment-A62-0-355-backwards"
     *         ]
     *      },
     *     "responsible": {"value": "Ministerio de Fomento - Gobierno de España"}
     * }).then(
     *     (response) => {
     *         // Entity created successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error creating the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Using the keyValues option</caption>
     *
     * connection.v2.createEntity({
     *     "id": "Spain-Road-A62",
     *     "type": "Road",
     *     "name": "A-62",
     *     "alternateName": "E-80",
     *     "description": "Autovía de Castilla",
     *     "roadClass": "motorway",
     *     "length": 355,
     *     "refRoadSegment": [
     *         "Spain-RoadSegment-A62-0-355-forwards",
     *         "Spain-RoadSegment-A62-0-355-backwards"
     *     ],
     *     "responsible": "Ministerio de Fomento - Gobierno de España"
     * }, {keyValues: true}).then(
     *     (response) => {
     *         // Entity created successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error creating the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.createEntity = function createEntity(entity, options) {
        if (options == null) {
            options = {};
        }

        var connection = privates.get(this);
        var parameters = {};

        if (options.keyValues === true) {
            parameters.options = "keyValues";
        }

        var url = new URL(NGSI.endpoints.v2.ENTITY_COLLECTION, connection.url);
        return makeJSONRequest2.call(connection, url, {
            method: "POST",
            postBody: entity,
            parameters: parameters,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 201) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            return Promise.resolve({
                correlator: correlator,
                entity: entity,
                location: response.getHeader('Location')
            });
        });
    };

    /**
     * Gets all the details of an entity.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.getEntity
     * @method "v2.getEntity"
     * @memberof NGSI.Connection
     *
     * @param {String|Object} options
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `keyValues` (`Boolean`; default: `false`): Use flat attributes
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     * - `type` (`String`): Entity type, to avoid ambiguity in case there are
     *   several entities with the same entity id.
     *
     * @returns {Promise}
     *
     * @example <caption>Basic usage</caption>
     *
     * connection.v2.getEntity("Spain-Road-A62").then(
     *     (response) => {
     *         // Entity details retrieved successfully
     *         // response.entity entity details
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error retrieving entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Retrieve a typed entity and using the keyValues option</caption>
     *
     * connection.v2.getEntity({
     *     id: "Spain-Road-A62",
     *     type: "Road",
     *     keyValues: true
     * }).then(
     *     (response) => {
     *         // Entity details retrieved successfully
     *         // response.entity entity details
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error retrieving entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.getEntity = function getEntity(options) {
        if (options == null) {
            throw new TypeError("missing options parameter");
        }

        if (typeof options === "string") {
            options = {
                id: options
            };
        }

        var connection = privates.get(this);
        var url = new URL(interpolate(NGSI.endpoints.v2.ENTITY_ENTRY, {entityId: encodeURIComponent(options.id)}), connection.url);
        var parameters = {};
        if (options.type != null) {
            parameters.type = options.type;
        }

        if (options.keyValues === true) {
            parameters.options = "keyValues";
        }

        return makeJSONRequest2.call(connection, url, {
            method: "GET",
            parameters: parameters,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 200) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            try {
                var data = JSON.parse(response.responseText);
            } catch (e) {
                throw new NGSI.InvalidResponseError('Server returned invalid JSON content', correlator);
            }
            return Promise.resolve({
                correlator: correlator,
                entity: data
            });
        });
    };

    /**
     * Gets all the attributes of an entity.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.getEntityAttributes
     * @method "v2.getEntityAttributes"
     * @memberof NGSI.Connection
     *
     * @param {String|Object} options
     *
     * String with the id of the entity to query or an object with extra
     * options:
     *
     * - `correlator` (`String`): Transaction id
     * - `keyValues` (`Boolean`; default: `false`): Use flat attributes
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     * - `type` (`String`): Entity type, to avoid ambiguity in case there are
     *   several entities with the same entity id.
     *
     * @returns {Promise}
     *
     * @example <caption>Basic usage</caption>
     *
     * connection.v2.getEntityAttributes("Spain-Road-A62").then(
     *     (response) => {
     *         // Entity attributes retrieved successfully
     *         // response.attributes entity attributes
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error retrieving the attributes of the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Retrieve a typed entity and using the keyValues option</caption>
     *
     * connection.v2.getEntityAttributes({
     *     id: "Spain-Road-A62",
     *     type: "Road",
     *     keyValues: true
     * }).then(
     *     (response) => {
     *         // Entity attributes retrieved successfully
     *         // response.attributes entity attributes
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error retrieving the attributes of the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.getEntityAttributes = function getEntityAttributes(options) {
        if (options == null) {
            throw new TypeError("missing options parameter");
        }

        if (typeof options === "string") {
            options = {
                id: options
            };
        }

        var connection = privates.get(this);
        var url = new URL(interpolate(NGSI.endpoints.v2.ENTITY_ATTRS_COLLECTION, {entityId: encodeURIComponent(options.id)}), connection.url);
        var parameters = {};
        if (options.type != null) {
            parameters.type = options.type;
        }

        if (options.keyValues === true) {
            parameters.options = "keyValues";
        }

        return makeJSONRequest2.call(connection, url, {
            method: "GET",
            parameters: parameters,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 200) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            try {
                var data = JSON.parse(response.responseText);
            } catch (e) {
                throw new NGSI.InvalidResponseError('Server returned invalid JSON content', correlator);
            }
            return Promise.resolve({
                attributes: data,
                correlator: correlator
            });
        });
    };

    /**
     * Updates or appends attributes to an entity.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.appendEntityAttributes
     * @method "v2.appendEntityAttributes"
     * @memberof NGSI.Connection
     *
     * @param {Object} changes
     *
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): transaction id
     * - `keyValues` (`Boolean`; default: `false`): Use flat attributes
     * - `strict` (`Boolean`; default: `false`): Force strict append semantics
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     * - `type` (`String`): Entity type, to avoid ambiguity in case there are
     *   several entities with the same entity id.
     *
     * @returns {Promise}
     *
     * @example <caption>Append or update the temperature attribute</caption>
     *
     * connection.v2.appendEntityAttributes({
     *     "id": "Bcn-Welt",
     *     "temperature": {
     *         "value": 31.5
     *     }
     * }).then(
     *     (response) => {
     *         // Attributes appended successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error appending the attributes to the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Append the temperature attribute</caption>
     *
     * connection.v2.appendEntityAttributes({
     *     "id": "Bcn-Welt",
     *     "temperature": 31.5
     * }, {
     *     strict: true,
     *     keyValues: true
     * }).then(
     *     (response) => {
     *         // Attributes appended successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error appending the attributes to the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.appendEntityAttributes = function appendEntityAttributes(changes, options) {
        if (options == null) {
            options = {};
        }

        var connection = privates.get(this);
        var url = new URL(interpolate(NGSI.endpoints.v2.ENTITY_ATTRS_COLLECTION, {entityId: encodeURIComponent(changes.id)}), connection.url);
        var parameters = {};
        var optionsparams = [];

        // Remove id from the payload
        delete changes.id;
        if (changes.type != null) {
            parameters.type = changes.type;
            delete changes.type;
        }

        if (options.strict === true) {
            optionsparams.push("append");
        }

        if (options.keyValues === true) {
            optionsparams.push("keyValues");
        }

        if (optionsparams.length > 0) {
            parameters.options = optionsparams.join(',');
        }

        return makeJSONRequest2.call(connection, url, {
            method: "POST",
            parameters: parameters,
            postBody: changes,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 204) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            return Promise.resolve({
                correlator: correlator
            });
        });
    };

    /**
     * Updates attributes of an entity.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.updateEntityAttributes
     * @method "v2.updateEntityAttributes"
     * @memberof NGSI.Connection
     *
     * @param {Object} changes
     *
     * New values for the attributes, including the `id` and the `type` values
     * for searching the entity to update.
     *
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `keyValues` (`Boolean`; default: `false`): Use flat attributes
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     *
     * @returns {Promise}
     *
     * @example <caption>Basic attribute update</caption>
     *
     * connection.v2.updateEntityAttributes({
     *     "id": "sensor",
     *     "temperature": {
     *         "value": 31.5
     *     },
     *     "humidity": {
     *         "value": 50.2
     *     }
     * }).then(
     *     (response) => {
     *         // Attributes updated successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error updating the attributes of the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Update some attributes using the keyValues option</caption>
     *
     * connection.v2.updateEntityAttributes({
     *     "id": "sensor",
     *     "temperature": 31.5
     *     "humidity": 50.2
     * }, {
     *     keyValues: true
     * }).then(
     *     (response) => {
     *         // Attributes updated successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error updating the attributes of the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.updateEntityAttributes = function updateEntityAttributes(changes, options) {
        if (options == null) {
            options = {};
        }

        if (changes == null) {
            throw new TypeError("missing changes parameter");
        }

        var connection = privates.get(this);
        var url = new URL(interpolate(NGSI.endpoints.v2.ENTITY_ATTRS_COLLECTION, {entityId: encodeURIComponent(changes.id)}), connection.url);
        var parameters = {};

        // Remove id from the payload
        delete changes.id;
        if (changes.type != null) {
            parameters.type = changes.type;
            delete changes.type;
        }

        if (options.keyValues === true) {
            parameters.options = "keyValues";
        }

        return makeJSONRequest2.call(connection, url, {
            method: "PATCH",
            parameters: parameters,
            postBody: changes,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 204) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            return Promise.resolve({
                correlator: correlator
            });
        });
    };

    /**
     * Replaces all the attributes associated with a entity.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.replaceEntityAttributes
     * @method "v2.replaceEntityAttributes"
     * @memberof NGSI.Connection
     *
     * @param {Object} entity
     *
     * New values for the attributes, including the `id` and the `type` values
     * for searching the entity to update.
     *
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `keyValues` (`Boolean`; default: `false`): Use flat attributes
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     *
     * @returns {Promise}
     *
     * @example <caption>Basic usage</caption>
     *
     * connection.v2.replaceEntityAttributes({
     *     "id": "Spain-Road-A62",
     *     "type": "Road",
     *     "name": {"value": "A-62"},
     *     "alternateName": {"value": "E-80"},
     *     "description": {"value": "Autovía de Castilla"},
     *     "roadClass": {"value": "motorway"},
     *     "length": {"value": 355},
     *     "refRoadSegment": {
     *         "value": [
     *             "Spain-RoadSegment-A62-0-355-forwards",
     *             "Spain-RoadSegment-A62-0-355-backwards"
     *         ]
     *      },
     *     "responsible": {"value": "Ministerio de Fomento - Gobierno de España"}
     * }).then(
     *     (response) => {
     *         // Entity attributes replaced successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error replacing the attributes of the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Using the keyValues option</caption>
     *
     * connection.v2.replaceEntityAttributes({
     *     "id": "Spain-Road-A62",
     *     "type": "Road",
     *     "name": "A-62",
     *     "alternateName": "E-80",
     *     "description": "Autovía de Castilla",
     *     "roadClass": "motorway",
     *     "length": 355,
     *     "refRoadSegment": [
     *         "Spain-RoadSegment-A62-0-355-forwards",
     *         "Spain-RoadSegment-A62-0-355-backwards"
     *     ],
     *     "responsible": "Ministerio de Fomento - Gobierno de España"
     * }, {keyValues: true}).then(
     *     (response) => {
     *         // Entity attributes replaced successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error replacing the attributes of the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.replaceEntityAttributes = function replaceEntityAttributes(entity, options) {
        if (options == null) {
            options = {};
        }

        var connection = privates.get(this);
        var url = new URL(interpolate(NGSI.endpoints.v2.ENTITY_ATTRS_COLLECTION, {entityId: encodeURIComponent(entity.id)}), connection.url);
        var parameters = {};
        var payload = ngsi_build_replace_entity_request(entity, options, parameters);
        return makeJSONRequest2.call(connection, url, {
            method: "PUT",
            postBody: payload,
            parameters: parameters,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 204) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            return Promise.resolve({
                correlator: correlator,
                entity: entity
            });
        });
    };

    /**
     * Removes an entity from the orion context broker server.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.deleteEntity
     * @method "v2.deleteEntity"
     * @memberof NGSI.Connection
     *
     * @param {String|Object} options
     *
     * String with the entity id to remove or an object providing options:
     *
     * - `correlator` (`String`): Transaction id
     * - `id` (`String`): Id of the entity to remove
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     * - `type` (`String`): Entity type, to avoid ambiguity in case there are
     *   several entities with the same entity id.
     *
     * @returns {Promise}
     *
     * @example <caption>Remove entity by Id</caption>
     *
     * connection.v2.deleteEntity("Spain-Road-A62").then(
     *     (response) => {
     *         // Entity deleted successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error deleting the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Remove entity by Id and type</caption>
     *
     * connection.v2.deleteEntity({
     *     id: "Spain-Road-A62",
     *     type: "Road"
     *  }).then(
     *     (response) => {
     *         // Entity deleted successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error deleting the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     */
    NGSI.Connection.V2.prototype.deleteEntity = function deleteEntity(options) {
        if (options == null) {
            throw new TypeError("missing options parameter");
        }

        if (typeof options === "string") {
            options = {
                id: options
            };
        }

        var connection = privates.get(this);
        var url = new URL(interpolate(NGSI.endpoints.v2.ENTITY_ENTRY, {entityId: encodeURIComponent(options.id)}), connection.url);

        var parameters = {};
        if (options.type != null) {
            parameters.type = options.type;
        }

        return makeJSONRequest2.call(connection, url, {
            method: "DELETE",
            parameters: parameters,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status === 404) {
                try {
                    var error = parse_error_response(response);
                } catch (e) {
                    return Promise.reject(new NGSI.InvalidResponseError(null, correlator));
                }
                return Promise.reject(new NGSI.NotFoundError({message: error.description, correlator: correlator}));
            } else if (response.status !== 204) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            return Promise.resolve({
                correlator: correlator
            });
        });
    };

    /**
     * Gets the details about an entity attribute.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.getEntityAttribute
     * @method "v2.getEntityAttribute"
     * @memberof NGSI.Connection
     *
     * @param {Object} options
     *
     * Object with options:
     *
     * - `attribute` (`String`): Name of the attribute to query
     * - `correlator` (`String`): Transaction id
     * - `id` (`String`): Id of the entity to query
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     * - `type` (`String`): Entity type, to avoid ambiguity in case there are
     *   several entities with the same entity id.
     *
     * @returns {Promise}
     *
     * @example <caption>Basic usage</caption>
     *
     * connection.v2.getEntityAttribute({
     *     id: "Bcn_Welt",
     *     attribute: "temperature"
     * }).then(
     *     (response) => {
     *         // Entity details retrieved successfully
     *         // response.entity entity details
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error retrieving entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Get entity attribute using the type option</caption>
     *
     * connection.v2.getEntityAttribute({
     *     id: "Bcn_Welt",
     *     type: "Room",
     *     attribute: "temperature"
     * }).then(
     *     (response) => {
     *         // Entity details retrieved successfully
     *         // response.entity entity details
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error retrieving entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.getEntityAttribute = function getEntityAttribute(options) {
        if (options == null) {
            throw new TypeError("missing options parameter");
        }

        if (options.id == null) {
            throw new TypeError("missing id option");
        } else if (options.attribute == null) {
            throw new TypeError("missing attribute option");
        }

        var connection = privates.get(this);
        var url = connection.url + interpolate(
            NGSI.endpoints.v2.ENTITY_ATTR_ENTRY, {
                entityId: encodeURIComponent(options.id),
                attribute: encodeURIComponent(options.attribute)
            }
        );
        var parameters = {};
        if (options.type != null) {
            parameters.type = options.type;
        }

        return makeJSONRequest2.call(connection, url, {
            method: "GET",
            parameters: parameters,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 200) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status), correlator);
            }
            try {
                var data = JSON.parse(response.responseText);
            } catch (e) {
                throw new NGSI.InvalidResponseError('Server returned invalid JSON content', correlator);
            }
            return Promise.resolve({
                correlator: correlator,
                attribute: data
            });
        });
    };

    /**
     * Update the details about an entity attribute.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.replaceEntityAttribute
     * @method "v2.replaceEntityAttribute"
     * @memberof NGSI.Connection
     *
     * @param {Object} changes
     *
     * Object with the new values for the attribute
     *
     * @param {Object} [options]
     *
     * Object with options (those options can also be passed inside the changes
     * parameter):
     *
     * - `attribute` (`String`): Name of the attribute to modify
     * - `correlator` (`String`): Transaction id
     * - `id` (`String`): Id of the entity to modify
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     * - `type` (`String`): Entity type, to avoid ambiguity in case there are
     *   several entities with the same entity id.
     *
     * @returns {Promise}
     *
     * @example <caption>Simple usage</caption>
     *
     * connection.v2.replaceEntityAttribute({
     *     id: "Bcn_Welt",
     *     attribute: "temperature"
     *     value: 25,
     *     metadata: {
     *         "unitCode": {
     *             "value": "CEL"
     *         }
     *     }
     * }).then(
     *     (response) => {
     *         // Entity attribute replaced successfully
     *         // response.attribute attribute details
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error replacing entity attribute
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *         // Entity details retrieved successfully
     *     }
     * );
     *
     * @example <caption>Partial update</caption>
     *
     * connection.v2.getEntityAttribute({
     *     id: "Bcn_Welt",
     *     attribute: "temperature"
     * }).then((response) => {
     *     var changes = response.attribute;
     *     changes.metadata.unitCode = {
     *         "value": "FAR"
     *     };
     *     return connection.v2.replaceEntityAttribute(changes, {
     *         id: "Bcn_Welt",
     *         attribute: "temperature"
     *     });
     * }).then(
     *     (response) => {
     *         // Entity attribute replaced successfully
     *         // response.attribute attribute details
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error replacing entity attribute
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     */
    NGSI.Connection.V2.prototype.replaceEntityAttribute = function replaceEntityAttribute(changes, options) {
        if (changes == null) {
            throw new TypeError("missing changes parameter");
        }

        if (options == null) {
            options = {
                attribute: changes.attribute,
                correlator: changes.correlator,
                id: changes.id,
                service: changes.service,
                servicepath: changes.servicepath,
                type: changes.type
            };
        }

        if (options.id == null) {
            throw new TypeError("missing id option");
        } else if (options.attribute == null) {
            throw new TypeError("missing attribute option");
        }

        var data = {
            value: changes.value,
            metadata: changes.metadata
        };
        var connection = privates.get(this);
        var url = connection.url + interpolate(
            NGSI.endpoints.v2.ENTITY_ATTR_ENTRY, {
                entityId: encodeURIComponent(options.id),
                attribute: encodeURIComponent(options.attribute)
            }
        );
        var parameters = {};
        if (options.type != null) {
            parameters.type = options.type;
        }

        return makeJSONRequest2.call(connection, url, {
            method: "PUT",
            parameters: parameters,
            postBody: data,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 204) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            return Promise.resolve({
                correlator: correlator,
                attribute: data
            });
        });
    };

    /**
     * Removes a single attribute from an entity stored in the orion context
     * broker server.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.deleteEntityAttribute
     * @method "v2.deleteEntityAttribute"
     * @memberof NGSI.Connection
     *
     * @param {Object} options
     *
     * Object providing information about the attribute to remove and any
     * extra options:
     *
     * - `attribute` (`String`): Name of the attribute to delete
     * - `correlator` (`String`): Transaction id
     * - `id` (`String`): Id of the entity to modify
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     * - `type` (`String`): Entity type, to avoid ambiguity in case there are
     *   several entities with the same entity id.
     *
     * @returns {Promise}
     *
     * @example <caption>Remove an attribute from an entity</caption>
     *
     * connection.v2.deleteEntityAttribute({
     *     id: "Bcn_Welt",
     *     attribute: "temperature"
     * }).then(
     *     (response) => {
     *         // Entity attribute deleted successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error deleting the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Remove an attribute from an entity indicating the entity type</caption>
     *
     * connection.v2.deleteEntityAttribute({
     *     id: "Bcn_Welt",
     *     type: "Room",
     *     attribute: "temperature"
     *  }).then(
     *     (response) => {
     *         // Entity attribute deleted successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error deleting the entity
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     */
    NGSI.Connection.V2.prototype.deleteEntityAttribute = function deleteEntityAttribute(options) {
        if (options == null) {
            throw new TypeError("missing options parameter");
        }

        if (options.id == null) {
            throw new TypeError("missing id option");
        } else if (options.attribute == null) {
            throw new TypeError("missing attribute option");
        }

        var connection = privates.get(this);
        var url = connection.url + interpolate(
            NGSI.endpoints.v2.ENTITY_ATTR_ENTRY, {
                entityId: encodeURIComponent(options.id),
                attribute: encodeURIComponent(options.attribute)
            }
        );

        var parameters = {};
        if (options.type != null) {
            parameters.type = options.type;
        }

        return makeJSONRequest2.call(connection, url, {
            method: "DELETE",
            parameters: parameters,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status === 404) {
                try {
                    var error = parse_error_response(response);
                } catch (e) {
                    return Promise.reject(new NGSI.InvalidResponseError(null, correlator));
                }
                return Promise.reject(new NGSI.NotFoundError({message: error.description, correlator: correlator}));
            } else if (response.status !== 204) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            return Promise.resolve({
                correlator: correlator
            });
        });
    };

    /**
     * Gets the value of an entity attribute.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.getEntityAttributeValue
     * @method "v2.getEntityAttributeValue"
     * @memberof NGSI.Connection
     *
     * @param {Object} options
     *
     * Object with extra options:
     *
     * - `attribute` (`String`): Name of the attribute to query
     * - `correlator` (`String`): Transaction id
     * - `id` (`String`): Id of the entity to query
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     * - `type` (`String`): Entity type, to avoid ambiguity in case there are
     *   several entities with the same entity id.
     *
     * @returns {Promise}
     *
     * @example <caption>Basic usage</caption>
     *
     * connection.v2.getEntityAttributeValue({
     *     id: "Bcn_Welt",
     *     attribute: "temperature"
     * }).then(
     *     (response) => {
     *         // Entity value retrieved successfully
     *         // response.value entity value
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error retrieving attribute value
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Get attribute value from a typed entity</caption>
     *
     * connection.v2.getEntityAttributeValue({
     *     id: "Bcn_Welt",
     *     type: "Room",
     *     attribute: "temperature"
     * }).then(
     *     (response) => {
     *         // Entity value retrieved successfully
     *         // response.value entity value
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error retrieving attribute value
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.getEntityAttributeValue = function getEntityAttributeValue(options) {
        if (options == null) {
            throw new TypeError("missing options parameter");
        }

        if (options.id == null) {
            throw new TypeError("missing id option");
        } else if (options.attribute == null) {
            throw new TypeError("missing attribute option");
        }

        var connection = privates.get(this);
        var url = connection.url + interpolate(
            NGSI.endpoints.v2.ENTITY_ATTR_VALUE_ENTRY, {
                entityId: encodeURIComponent(options.id),
                attribute: encodeURIComponent(options.attribute)
            }
        );
        var parameters = {};
        if (options.type != null) {
            parameters.type = options.type;
        }

        return makeJSONRequest2.call(connection, url, {
            method: "GET",
            parameters: parameters,
            requestHeaders: {
                // See bug telefonicaid/fiware-orion#2696
                "Accept": "application/json, text/plain",
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 200) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            try {
                var data = JSON.parse(response.responseText);
            } catch (e) {
                throw new NGSI.InvalidResponseError('Server returned invalid JSON content', correlator);
            }
            return Promise.resolve({
                correlator: correlator,
                value: data
            });
        });
    };

    /**
     * Updates the value of an entity attribute.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.replaceEntityAttributeValue
     * @method "v2.replaceEntityAttributeValue"
     * @memberof NGSI.Connection
     *
     * @param {Object} options
     *
     * Object with options:
     *
     * - `attribute` (`String`): Name of the attribute to query
     * - `correlator` (`String`): Transaction id
     * - `id` (`String`): Id of the entity to query
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     * - `value` (`String`|`Boolean`|`Number`|`Object`|`Array`) new value
     * - `type` (`String`): Entity type, to avoid ambiguity in case there are
     *   several entities with the same entity id.
     *
     * @returns {Promise}
     *
     * @example <caption>Basic usage</caption>
     *
     * connection.v2.replaceEntityAttributeValue({
     *     id: "Bcn_Welt",
     *     attribute: "temperature",
     *     value: 21
     * }).then(
     *     (response) => {
     *         // Entity value replaced successfully
     *         // response.value entity value
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error replacing attribute value
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Get attribute value from a typed entity</caption>
     *
     * connection.v2.replaceEntityAttributeValue({
     *     id: "Bcn_Welt",
     *     type: "Room",
     *     attribute: "temperature",
     *     value: 21
     * }).then(
     *     (response) => {
     *         // Entity value replaced successfully
     *         // response.value entity value
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error replacing attribute value
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.replaceEntityAttributeValue = function replaceEntityAttributeValue(options) {
        if (options == null) {
            throw new TypeError("missing options parameter");
        }

        if (options.id == null) {
            throw new TypeError("missing id option");
        } else if (options.attribute == null) {
            throw new TypeError("missing attribute option");
        } else if (typeof options.value === "undefined") {
            throw new TypeError("missing value option");
        }

        var connection = privates.get(this);
        var url = connection.url + interpolate(
            NGSI.endpoints.v2.ENTITY_ATTR_VALUE_ENTRY, {
                entityId: encodeURIComponent(options.id),
                attribute: encodeURIComponent(options.attribute)
            }
        );
        var parameters = {};
        if (options.type != null) {
            parameters.type = options.type;
        }

        // See bug telefonicaid/fiware-orion#2696
        return makeJSONRequest2.call(connection, url, {
            method: "PUT",
            parameters: parameters,
            postBody: options.value,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 204) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            return Promise.resolve({
                correlator: correlator,
                value: options.value
            });
        });
    };

    /**
     * Retrieves the available types (using pagination).
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.listTypes
     * @method "v2.listTypes"
     * @memberof NGSI.Connection
     *
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `count` (`Boolean`; default: `false`): request total count
     * - `limit` (`Number`; default: `20`): This option allow you to specify
     *   the maximum number of subscriptions you want to receive from the
     *   server
     * - `offset` (`Number`; default: `0`): Allows you to skip a given
     *   number of elements at the beginning
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     *
     * @returns {Promise}
     *
     * @example <caption>Retrieve first 20 subscriptions from the Context Broker</caption>
     *
     * connection.v2.listTypes().then(
     *     (response) => {
     *         // Types retrieved successfully
     *         // response.results is an array with the retrieved subscriptions
     *     }, (error) => {
     *         // Error retrieving available types
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Retrieve second page from the Context Broker requesting pagination details</caption>
     *
     * connection.v2.listTypes({offset: 20, count: true}).then(
     *     (response) => {
     *         // Types retrieved successfully
     *         // response.correlator transaction id associated with the server response
     *         // response.limit contains the used page size
     *         // response.results is an array with the retrieved subscriptions
     *         // response.count contains the number of available subscriptions
     *         // response.offset contains the offset used in the request
     *     }, (error) => {
     *         // Error retrieving available types
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.listTypes = function listTypes(options) {
        if (options == null) {
            options = {};
        }

        var connection = privates.get(this);
        var url = new URL(NGSI.endpoints.v2.TYPE_COLLECTION, connection.url);
        var optionsparams = [];
        var parameters = parse_pagination_options2(options, optionsparams);
        if (options.values === true) {
            optionsparams.push("values");
        }
        if (optionsparams.length !== 0) {
            parameters.options = optionsparams.join(',');
        }

        return makeJSONRequest2.call(connection, url, {
            method: "GET",
            parameters: parameters,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 200) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }

            var result = {
                correlator: correlator,
                limit: options.limit,
                offset: options.offset,
                results: JSON.parse(response.responseText),
            };
            if (options.count === true) {
                result.count = parseInt(response.getHeader("Fiware-Total-Count"), 10);
            }

            return Promise.resolve(result);
        });
    };

    /**
     * Gets all the details about an entity type.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.getType
     * @method "v2.getType"
     * @memberof NGSI.Connection
     *
     * @param {String|Object} options
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     *
     * @returns {Promise}
     *
     * @example <caption>Basic usage</caption>
     *
     * connection.v2.getType("Room").then(
     *     (response) => {
     *         // Type details retrieved successfully
     *         // response.type type details
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error retrieving type
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.getType = function getType(options) {
        if (options == null) {
            throw new TypeError("missing options parameter");
        }

        if (typeof options === "string") {
            options = {
                id: options
            };
        }

        var connection = privates.get(this);
        var url = new URL(interpolate(NGSI.endpoints.v2.TYPE_ENTRY, {typeId: encodeURIComponent(options.id)}), connection.url);

        return makeJSONRequest2.call(connection, url, {
            method: "GET",
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 200) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            try {
                var data = JSON.parse(response.responseText);
            } catch (e) {
                throw new NGSI.InvalidResponseError('Server returned invalid JSON content', correlator);
            }
            return Promise.resolve({
                correlator: correlator,
                type: data
            });
        });
    };

    /**
     * Retrieves the available subscriptions (using pagination).
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.listSubscriptions
     * @method "v2.listSubscriptions"
     * @memberof NGSI.Connection
     *
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `count` (`Boolean`; default: `false`): request total count
     * - `limit` (`Number`; default: `20`): This option allow you to specify
     *   the maximum number of subscriptions you want to receive from the
     *   server
     * - `offset` (`Number`; default: `0`): Allows you to skip a given
     *   number of elements at the beginning
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     *
     * @returns {Promise}
     *
     * @example <caption>Retrieve first 20 subscriptions from the Context Broker</caption>
     *
     * connection.v2.listSubscriptions().then(
     *     (response) => {
     *         // Subscriptions retrieved successfully
     *         // response.results is an array with the retrieved subscriptions
     *     }, (error) => {
     *         // Error retrieving subscriptions
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Retrieve second page from the Context Broker requesting pagination details</caption>
     *
     * connection.v2.listSubscriptions({offset: 20, details: true}).then(
     *     (response) => {
     *         // Subscriptions retrieved successfully
     *         // response.correlator transaction id associated with the server response
     *         // response.limit contains the used page size
     *         // response.results is an array with the retrieved subscriptions
     *         // response.count contains the number of available subscriptions
     *         // response.offset contains the offset used in the request
     *     }, (error) => {
     *         // Error retrieving subscriptions
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.listSubscriptions = function listSubscriptions(options) {
        if (options == null) {
            options = {};
        }

        var connection = privates.get(this);
        var url = new URL(NGSI.endpoints.v2.SUBSCRIPTION_COLLECTION, connection.url);
        var optionsparams = [];
        var parameters = parse_pagination_options2(options, optionsparams);

        if (optionsparams.length !== 0) {
            parameters.options = optionsparams.join(',');
        }

        return makeJSONRequest2.call(connection, url, {
            method: "GET",
            parameters: parameters,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 200) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }

            var result = {
                correlator: correlator,
                limit: options.limit,
                offset: options.offset,
                results: JSON.parse(response.responseText),
            };
            if (options.count === true) {
                result.count = parseInt(response.getHeader("Fiware-Total-Count"), 10);
            }

            return Promise.resolve(result);
        });
    };

    /**
     * Creates a new subscription.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.createSubscription
     * @method "v2.createSubscription"
     * @memberof NGSI.Connection
     *
     * @param {Object}
     *
     * subscription values to be used for creating it
     *
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     *
     * @returns {Promise}
     *
     * @example <caption>Basic usage</caption>
     *
     * connection.v2.createSubscription({
     *    "description": "One subscription to rule them all",
     *    "subject": {
     *        "entities": [
     *            {
     *                "idPattern": ".*",
     *                "type": "Room"
     *            }
     *        ],
     *        "condition": {
     *            "attrs": [
     *                "temperature"
     *            ],
     *            "expression": {
     *                "q": "temperature>40"
     *            }
     *        }
     *    },
     *    "notification": {
     *        "http": {
     *            "url": "http://localhost:1234"
     *        },
     *        "attrs": [
     *            "temperature",
     *            "humidity"
     *        ]
     *    },
     *    "expires": "2016-04-05T14:00:00.00Z",
     *    "throttling": 5
     * }).then(
     *     (response) => {
     *         // Subscription created successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error creating the subscription
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Creating a subscription using a callback</caption>
     *
     * connection.v2.createSubscription({
     *    "description": "One subscription to rule them all",
     *    "subject": {
     *        "entities": [
     *            {
     *                "idPattern": ".*",
     *                "type": "Room"
     *            }
     *        ],
     *        "condition": {
     *            "attrs": [
     *                "temperature"
     *            ],
     *            "expression": {
     *                "q": "temperature>40"
     *            }
     *        }
     *    },
     *    "notification": {
     *        "callback": function () {
     *        },
     *        "attrs": [
     *            "temperature",
     *            "humidity"
     *        ]
     *    },
     *    "expires": "2016-04-05T14:00:00.00Z",
     *    "throttling": 5
     * }).then(
     *     (response) => {
     *         // Subscription created successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error creating the subscription
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.createSubscription = function createSubscription(subscription, options) {
        var p, proxy_callback;
        var connection = privates.get(this);

        if (options == null) {
            options = {};
        }

        if (typeof subscription !== 'object') {
            throw new TypeError('invalid subscription parameter');
        }

        if ('callback' in subscription.notification) {
            if (typeof subscription.notification.callback !== "function") {
                throw new TypeError('invalid callback configuration');
            }

            var onNotify = function onNotify(payload, headers) {
                var notification = JSON.parse(payload);
                notification.attrsformat = headers['ngsiv2-attrsformat'];
                this(notification);
            }.bind(subscription.notification.callback);

            p = connection.ngsi_proxy.requestCallback(onNotify).then(
                function (response) {
                    proxy_callback = response;
                    delete subscription.notification.callback;
                    subscription.notification.http = {
                        url: proxy_callback.url
                    };
                }
            );
        } else {
            p = Promise.resolve();
        }

        var url = new URL(NGSI.endpoints.v2.SUBSCRIPTION_COLLECTION, connection.url);
        return p.then(function () {
            return makeJSONRequest2.call(connection, url, {
                method: "POST",
                postBody: subscription,
                requestHeaders: {
                    "FIWARE-Correlator": options.correlator,
                    "FIWARE-Service": options.service,
                    "FIWARE-ServicePath": options.servicepath
                }
            });
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 201) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }

            var subscription_url = response.getHeader('Location');
            var subscription_id = subscription_url.split('/').pop();
            subscription.id = subscription_id;

            if (proxy_callback) {
                this.ngsi_proxy.associateSubscriptionId(proxy_callback.callback_id, subscription_id);
            }

            return Promise.resolve({
                correlator: correlator,
                subscription: subscription,
                location: subscription_url
            });
        }.bind(connection), function (error) {
            if (proxy_callback) {
                this.ngsi_proxy.closeCallback(proxy_callback.callback_id);
            }
            return Promise.reject(error);
        }.bind(connection));
    };

    /**
     * Gets all the details of a subscription.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.getSubscription
     * @method "v2.getSubscription"
     * @memberof NGSI.Connection
     *
     * @param {String|Object} options
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     *
     * @returns {Promise}
     *
     * @example <caption>Basic usage</caption>
     *
     * connection.v2.getSubscription("abcdef").then(
     *     (response) => {
     *         // Subscription details retrieved successfully
     *         // response.subscription subscription details
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error retrieving subscription
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.getSubscription = function getSubscription(options) {
        if (options == null) {
            throw new TypeError("missing options parameter");
        }

        if (typeof options === "string") {
            options = {
                id: options
            };
        }

        var connection = privates.get(this);
        var url = new URL(interpolate(NGSI.endpoints.v2.SUBSCRIPTION_ENTRY, {subscriptionId: encodeURIComponent(options.id)}), connection.url);

        return makeJSONRequest2.call(connection, url, {
            method: "GET",
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 200) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            try {
                var data = JSON.parse(response.responseText);
            } catch (e) {
                throw new NGSI.InvalidResponseError('Server returned invalid JSON content', correlator);
            }
            return Promise.resolve({
                correlator: correlator,
                subscription: data
            });
        });
    };

    /**
     * Updates a subscription.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.updateSubscription
     * @method "v2.updateSubscription"
     * @memberof NGSI.Connection
     *
     * @param {Object} changes
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     *
     * @returns {Promise}
     *
     * @example <caption>Update subscription expiration time</caption>
     *
     * connection.v2.updateSubscription({
     *     "id": "abcdef",
     *     "expires": "2016-04-05T14:00:00.00Z"
     * }).then(
     *     (response) => {
     *         // Subscription updated successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error updating subscription
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     * @example <caption>Use a custom service path for the update operation</caption>
     *
     * connection.v2.updateSubscription({
     *     "id": "abcdef",
     *     "expires": "2016-04-05T14:00:00.00Z"
     * }, {
     *     servicepath: "/Spain/Madrid"
     * }).then(
     *     (response) => {
     *         // Subscription updated successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error updating subscription
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.updateSubscription = function updateSubscription(changes, options) {
        if (options == null) {
            options = {};
        }

        var connection = privates.get(this);
        var url = new URL(interpolate(NGSI.endpoints.v2.SUBSCRIPTION_ENTRY, {subscriptionId: encodeURIComponent(changes.id)}), connection.url);

        // Remove id from the payload
        delete changes.id;

        return makeJSONRequest2.call(connection, url, {
            method: "PATCH",
            postBody: changes,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 204) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            return Promise.resolve({
                correlator: correlator
            });
        });
    };

    /**
     * Removes a subscription from the orion context broker server.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.deleteSubscription
     * @method "v2.deleteSubscription"
     * @memberof NGSI.Connection
     *
     * @param {String|Object} options
     *
     * String with the id of the subscription to remove or an object with
     * options:
     *
     * - `correlator` (`String`): Transaction id
     * - `id` (`String`): Id of the subscription to remove
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     *
     * @returns {Promise}
     *
     * @example
     *
     * connection.v2.deleteSubscription("57f7787a5f817988e4eb3dda").then(
     *     (response) => {
     *         // Subscription deleted successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error deleting subscription
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     */
    NGSI.Connection.V2.prototype.deleteSubscription = function deleteSubscription(options) {
        if (options == null) {
            throw new TypeError("missing options parameter");
        }

        if (typeof options === "string") {
            options = {
                id: options
            };
        }

        var connection = privates.get(this);
        var url = new URL(interpolate(NGSI.endpoints.v2.SUBSCRIPTION_ENTRY, {subscriptionId: encodeURIComponent(options.id)}), connection.url);

        return makeJSONRequest2.call(connection, url, {
            method: "DELETE",
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status === 404) {
                try {
                    var error = parse_error_response(response);
                } catch (e) {
                    return Promise.reject(new NGSI.InvalidResponseError(null, correlator));
                }
                return Promise.reject(new NGSI.NotFoundError({message: error.description, correlator: correlator}));
            } else if (response.status !== 204) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            return Promise.resolve({
                correlator: correlator
            });
        });
    };

    /**
     * This operation allows to create, update and/or delete several entities
     * in a single batch operation.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @name NGSI.Connection#v2.batchUpdate
     * @method "v2.batchUpdate"
     * @memberof NGSI.Connection
     *
     * @param {Object} changes
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `keyValues` (`Boolean`; default: `false`): Use flat attributes
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     *
     * @returns {Promise}
     *
     * @example <caption>Basic usage</caption>
     *
     * connection.v2.batchUpdate({
     *    "actionType": "APPEND",
     *    "entities": [
     *        {
     *            "type": "Room",
     *            "id": "Bcn-Welt",
     *            "temperature": {
     *                "value": 21.7
     *            },
     *            "humidity": {
     *                "value": 60
     *            }
     *        },
     *        {
     *            "type": "Room",
     *            "id": "Mad_Aud",
     *            "temperature": {
     *                "value": 22.9
     *            },
     *            "humidity": {
     *                "value": 85
     *            }
     *        }
     *    ]
     * }).then(
     *     (response) => {
     *         // Attributes appended successfully
     *         // response.correlator transaction id associated with the server response
     *     }, (error) => {
     *         // Error appending attributes to the entities
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.batchUpdate = function batchUpdate(changes, options) {
        if (options == null) {
            options = {};
        }

        if (changes == null) {
            throw new TypeError("missing changes parameter");
        }

        var connection = privates.get(this);
        var url = new URL(interpolate(NGSI.endpoints.v2.BATCH_UPDATE_OP), connection.url);
        var parameters = {};

        if (options.keyValues === true) {
            parameters.options = "keyValues";
        }

        return makeJSONRequest2.call(connection, url, {
            method: "POST",
            parameters: parameters,
            postBody: changes,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 204) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }
            return Promise.resolve({
                correlator: correlator
            });
        });
    };

    /**
     * This operation allows to make several entity queries at once.
     *
     * > This method uses v2 of the FIWARE's NGSI Specification
     *
     * @since 1.0
     *
     * @memberof NGSI.Connection
     * @method "v2.batchQuery"
     * @memberof NGSI.Connection
     *
     * @param {Object} [options]
     *
     * Object with extra options:
     *
     * - `correlator` (`String`): Transaction id
     * - `count` (`Boolean`; default: `false`): Request total count
     * - `limit` (`Number`; default: `20`): This option allow you to specify
     *   the maximum number of entities you want to receive from the server
     * - `offset` (`Number`; default: `0`): Allows you to skip a given number of
     *   elements at the beginning
     * - `orderBy` (`String`): Criteria for ordering results
     * - `service` (`String`): Service/tenant to use in this operation
     * - `servicepath` (`String`): Service path to use in this operation
     * - `unique` (`Boolean`): Represent entities as an array of non-repeated
     *   attribute values.
     * - `values` (`Boolean`): Represent entities as an array of attribute
     *   values
     *
     * @returns {Promise}
     *
     * @example <caption>Retrieve first 20 entities from the Context Broker</caption>
     *
     * connection.v2.batchQuery({
     *    "entities": [
     *        {
     *            "idPattern": ".*",
     *            "type": "myFooType"
     *        },
     *        {
     *            "id": "myBar",
     *            "type": "myBarType"
     *        }
     *    ],
     *    "attributes": [
     *        "temperature",
     *        "humidity"
     *    ]
     * }).then(
     *     (response) => {
     *         // Entities retrieved successfully
     *         // response.correlator transaction id associated with the server response
     *         // response.limit contains the used page size
     *         // response.results is an array with the retrieved entities
     *         // response.offset contains the offset used in the request
     *     }, (error) => {
     *         // Error retrieving entities
     *         // If the error was reported by Orion, error.correlator will be
     *         // filled with the associated transaction id
     *     }
     * );
     *
     */
    NGSI.Connection.V2.prototype.batchQuery = function batchQuery(query, options) {
        if (options == null) {
            options = {};
        }

        if (query == null) {
            throw new TypeError("missing query parameter");
        }

        var connection = privates.get(this);
        var url = new URL(NGSI.endpoints.v2.BATCH_QUERY_OP, connection.url);
        var optionsparams = [];
        var parameters = parse_pagination_options2(options, optionsparams);

        if (options.keyValues === true) {
            optionsparams.push("keyValues");
        }
        if (options.values === true) {
            optionsparams.push("values");
        }
        if (options.unique === true) {
            optionsparams.push("unique");
        }
        if (optionsparams.length > 0) {
            parameters.options = optionsparams.join(',');
        }

        parameters.orderBy = options.orderBy;

        return makeJSONRequest2.call(connection, url, {
            method: "POST",
            parameters: parameters,
            postBody: query,
            requestHeaders: {
                "FIWARE-Correlator": options.correlator,
                "FIWARE-Service": options.service,
                "FIWARE-ServicePath": options.servicepath
            }
        }).then(function (response) {
            var correlator = response.getHeader('Fiware-correlator');
            if (response.status !== 200) {
                return Promise.reject(new NGSI.InvalidResponseError('Unexpected error code: ' + response.status, correlator));
            }

            try {
                var data = JSON.parse(response.responseText);
            } catch (e) {
                return Promise.reject(new NGSI.InvalidResponseError('Server returned invalid JSON content', correlator));
            }

            var result = {
                correlator: correlator,
                limit: options.limit,
                offset: options.offset,
                results: data
            };
            if (options.count === true) {
                result.count = parseInt(response.getHeader("Fiware-Total-Count"), 10);
            }

            return Promise.resolve(result);
        });
    };


    /* istanbul ignore else */
    if (typeof window !== 'undefined') {
        window.NGSI = NGSI;
    }

})();
