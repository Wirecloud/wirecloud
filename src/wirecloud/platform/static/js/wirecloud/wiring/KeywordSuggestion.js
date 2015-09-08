/*
 *     Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global Wirecloud */


(function (ns) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class KeywordSuggestion.
     *
     * @constructor
     */
    ns.KeywordSuggestion = function KeywordSuggestion() {
        this.endpoints = {source: {}, target: {}};
    };

    // ==================================================================================
    // PUBLIC MEMBERS
    // ==================================================================================

    ns.KeywordSuggestion.prototype = {

        /**
         * [TODO: appendEndpoint description]
         *
         * @param {Endpoint} endpoint
         *      [TODO: description]
         * @returns {KeywordSuggestion}
         *      The instance on which the member is called.
         */
        appendEndpoint: function appendEndpoint(endpoint) {

            if (endpoint.missing) {
                return this;
            }

            endpoint.keywords.forEach(function (keyword) {
                updateKeyword.call(this, keyword, endpoint);
            }, this);

            return this;
        },

        /**
         * [TODO: forEachSuggestion description]
         *
         * @param {Endpoint} endpoint
         *      [TODO: description]
         * @param {Function} callback
         *      [TODO: description]
         * @returns {KeywordSuggestion}
         *      The instance on which the member is called.
         */
        forEachSuggestion: function forEachSuggestion(endpoint, callback) {
            var oppositeType;

            if (endpoint.missing) {
                return this;
            }

            oppositeType = getOppositeType(endpoint);
            this._endpointList = [];

            endpoint.keywords.forEach(function (keyword) {
                findEndpoint.call(this, endpoint.component, oppositeType, keyword, callback);
            }, this);

            delete this._endpointList;

            return this;
        },

        /**
         * [TODO: removeEndpoint description]
         *
         * @param {Endpoint} endpoint
         *      [TODO: description]
         * @returns {KeywordSuggestion}
         *      The instance on which the member is called.
         */
        removeEndpoint: function removeEndpoint(endpoint) {

            if (endpoint.missing) {
                return this;
            }

            endpoint.keywords.forEach(function (keyword) {
                removeKeyword.call(this, keyword, endpoint);
            }, this);

            return this;
        },

        /**
         * [TODO: empty description]
         *
         * @returns {KeywordSuggestion}
         *      The instance on which the member is called.
         */
        empty: function empty() {

            this.endpoints = {source: {}, target: {}};

            return this;
        }

    };

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    function findEndpoint(component, type, keyword, callback) {

        if (!(keyword in this.endpoints[type])) {
            return this;
        }

        this.endpoints[type][keyword].forEach(function (endpoint) {
            if (!endpoint.component.equals(component) && (this._endpointList.indexOf(endpoint) < 0)) {
                callback(endpoint);
                this._endpointList.push(endpoint);
            }
        }, this);

        return this;
    }

    function getOppositeType(endpoint) {
        return endpoint.type === 'source' ? 'target' : 'source';
    }

    function removeKeyword(keyword, endpoint) {
        var list = this.endpoints[endpoint.type][keyword];

        list.splice(list.indexOf(endpoint), 1);

        if (!list.length) {
            delete this.endpoints[endpoint.type][keyword];
        }

        return this;
    }

    function updateKeyword(keyword, endpoint) {

        if (!(keyword in this.endpoints[endpoint.type])) {
            this.endpoints[endpoint.type][keyword] = [];
        }

        this.endpoints[endpoint.type][keyword].push(endpoint);

        return this;
    }

})(Wirecloud.wiring);
