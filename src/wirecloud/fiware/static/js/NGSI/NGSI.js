/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global EventSource, exports */

(function () {

    "use strict";

    var NGSI;

    /* Detect Node.js */
    /* istanbul ignore if */
    if ((typeof require == 'function') && typeof exports != null) {
        NGSI = exports;
    } else {
        NGSI = {};
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
        CONTEXT_TYPES: 'v1/contextTypes'
    };

    NGSI.proxy_endpoints = {
        EVENTSOURCE_COLLECTION: 'eventsource',
        CALLBACK_COLLECTION: 'callbacks'
    };

    /* Request utility functions */

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
            postBody: body,
            onSuccess: function (response) {
                if (typeof callbacks.onSuccess === 'function') {
                    var data;
                    try {
                        try {
                            data = JSON.parse(response.responseText);
                        } catch (error) {
                            throw new NGSI.InvalidResponseError('Server returned invalid JSON content');
                        }
                        data = parse_func(data, callbacks);
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
                    if (response instanceof NGSI.ConnectionError) {
                        error = response;
                    } else if ([0, 502, 504].indexOf(response.status) !== -1) {
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
                    longuitude: "" + vertice.longuitude
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
            attribute, attributeElement, contextValue;

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
                        if (attribute.contextValue == null) {
                            contextValue = 'emptycontent';
                        } else if (typeof attribute.contextValue === 'string') {
                            contextValue = attribute.contextValue;
                            if (contextValue.trim() === '') {
                                attributeElement.valuecontextValue = 'emptycontent';
                            }
                        } else if (typeof attribute.contextValue === 'number' || typeof attribute.contextValue === 'boolean') {
                            contextValue = "" + attribute.contextValue;
                        } else {
                            contextValue = attribute.contextValue;
                        }

                        attributeElement.value = contextValue;
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
        var contextResponse, entry, flat, i, j, contextValue, data,
            attribute_info, attribute_entry, status_info, error_data;

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
                        contextValue = attribute_info.value;
                        if (contextValue === 'emptycontent') {
                            contextValue = '';
                        }
                    }

                    if (flat) {
                        entry[attribute_info.name] = contextValue;
                    } else {
                        attribute_entry = {
                            name: attribute_info.name,
                            type: attribute_info.type
                        };
                        if (!update_response) {
                            attribute_entry.contextValue = contextValue;
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
        var status_info = process_status_info_json(data);

        if (status_info.code != 200) {
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

        return parameters;
    };

    NGSI.parseNotifyContextRequest = function parseNotifyContextRequest(data, options) {
        return {
            elements: parse_context_response_list_json(data.contextResponses, false, options)[0],
            "subscriptionId": data.subscriptionId,
            "originator": data.originator
        };
    };

    var onInitFailure = function onInitFailure(error) {
        var i;

        this.connected = false;
        this.connecting = false;

        if (!(error instanceof Error)) {
            // Error response
            if ([0, 502, 504].indexOf(error.status) !== -1) {
                error = new NGSI.ConnectionError();
            } else {
                error = new NGSI.InvalidResponseError('Unexpected error code: ' + error.status);
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
                        onInitFailure.call(this, new NGSI.InvalidResponseError('Missing Location Header'));
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

    NGSI.ProxyConnection = function ProxyConnection(url, makeRequest /* TODO */) {
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

        if (options.request_headers != null) {
            this.request_headers = options.request_headers;
        } else {
            this.request_headers = {};
        }

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

        makeJSONRequest.call(this, url, payload, parse_register_context_response, callbacks);
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

        makeJSONRequest.call(this, url, payload, parse_register_context_response, callbacks);
    };

    NGSI.Connection.prototype.cancelRegistration = function cancelRegistration(regId, callbacks) {
        if (regId == null) {
            throw new TypeError('regId parameter cannot be null');
        }
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

        makeJSONRequest.call(this, url, payload, parse_discover_context_availability_response, callbacks);
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
        if (typeof options.onNotify !== 'string' && typeof options.onNotify !== 'function') {
            throw new TypeError('Invalid onNotify callback');
        }
        if (typeof options.onNotify === 'function' && this.ngsi_proxy == null) {
            throw new TypeError('A ngsi-proxy is needed for using local onNotify callbacks');
        }

        var url = this.url + NGSI.endpoints.SUBSCRIBE_CONTEXT_AVAILABILITY;
        if (typeof options.onNotify === 'function' && this.ngsi_proxy != null) {

            var onNotify = function onNotify(payload) {
                var doc = JSON.parse(payload);
                var data = parse_notify_context_availability_request(doc, options);
                options.onNotify(data);
            };

            this.ngsi_proxy.request_callback(onNotify, function (proxy_callback) {
                var payload = ngsi_build_subscribe_update_context_availability_request(entities, attributeNames, duration, restriction, null, proxy_callback.url);

                var oldOnFailure = options.onFailure;
                options.onFailure = function () {
                    this.ngsi_proxy.close_callback(proxy_callback.callback_id);
                    if (typeof oldOnFailure === 'function') {
                        oldOnFailure.apply(this, arguments);
                    }
                }.bind(this);

                var oldOnSuccess = options.onSuccess;
                options.onSuccess = function (data) {
                    this.ngsi_proxy.associate_subscription_id_to_callback(proxy_callback.callback_id, data.subscriptionId);
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
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT_AVAILABILITY_SUBSCRIPTION;

        makeJSONRequest.call(this, url, payload, parse_subscribe_update_context_availability_response, callbacks);
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

        makeJSONRequest.call(this, url, payload, parse_unsubscribe_context_availability_response, callbacks);
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

        parameters = parse_pagination_options(options, 'off');

        url = this.url + NGSI.endpoints.QUERY_CONTEXT;
        payload = ngsi_build_query_context_request(entities, attrNames, options.restriction);
        makeJSONRequest.call(this, url, payload, parse_query_context_response, options, parameters);
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

        makeJSONRequest.call(this, url, payload, parse_update_context_response, callbacks);
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

        makeJSONRequest.call(this, url, payload, parse_update_context_response, callbacks);
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

        makeJSONRequest.call(this, url, payload, parse_update_context_response, callbacks);
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
        if (typeof options.onNotify !== 'string' && typeof options.onNotify !== 'function') {
            throw new TypeError('Invalid onNotify callback');
        }
        if (typeof options.onNotify === 'function' && this.ngsi_proxy == null) {
            throw new TypeError('A ngsi-proxy is needed for using local onNotify callbacks');
        }

        var url = this.url + NGSI.endpoints.SUBSCRIBE_CONTEXT;
        if (typeof options.onNotify === 'function' && this.ngsi_proxy != null) {

            var onNotify = function onNotify(payload) {
                var doc = JSON.parse(payload);
                var data = NGSI.parseNotifyContextRequest(doc, options);
                options.onNotify(data);
            };

            this.ngsi_proxy.request_callback(onNotify, function (proxy_callback) {
                var payload = ngsi_build_subscribe_update_context_request(null, entities, attributeNames, duration, throttling, cond, proxy_callback.url);

                var oldOnFailure = options.onFailure;
                options.onFailure = function () {
                    this.ngsi_proxy.close_callback(proxy_callback.callback_id);
                    if (typeof oldOnFailure === 'function') {
                        oldOnFailure.apply(this, arguments);
                    }
                }.bind(this);

                var oldOnSuccess = options.onSuccess;
                options.onSuccess = function (data) {
                    this.ngsi_proxy.associate_subscription_id_to_callback(proxy_callback.callback_id, data.subscriptionId);
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

    NGSI.Connection.prototype.updateSubscription = function updateSubscription(subId, duration, throttling, cond, options) {
        if (subId == null) {
            throw new TypeError('subId parameter cannot be null');
        }

        if (options == null) {
            options = {};
        }

        var payload = ngsi_build_subscribe_update_context_request(subId, null, null, duration, throttling, cond);
        var url = this.url + NGSI.endpoints.UPDATE_CONTEXT_SUBSCRIPTION;

        makeJSONRequest.call(this, url, payload, parse_update_context_subscription_response, options);
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

        makeJSONRequest.call(this, url, payload, parse_unsubscribe_context_response, options);
    };

    NGSI.Connection.prototype.getAvailableTypes = function getAvailableTypes(options) {
        var url = this.url + NGSI.endpoints.CONTEXT_TYPES;
        var parameters = parse_pagination_options(options, 'on');
        makeJSONRequest.call(this, url, null, parse_available_types_response, options, parameters);
    };

    NGSI.Connection.prototype.getTypeInfo = function getTypeInfo(type, options) {

        if (type == null) {
            throw new TypeError("Invalid type parameter");
        }

        var url = this.url + NGSI.endpoints.CONTEXT_TYPES + '/' + encodeURIComponent(type);
        makeJSONRequest.call(this, url, null, parse_type_info_response, options);
    };

    /* istanbul ignore else */
    if (typeof window !== 'undefined') {
        window.NGSI = NGSI;
    }

})();
