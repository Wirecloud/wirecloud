/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.
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

/* globals Wirecloud */


(function (ns) {

    "use strict";

    const findEndpoint = function findEndpoint(component, type, friendcode, callback) {

        if (!(friendcode in this.endpoints[type])) {
            return this;
        }

        this.endpoints[type][friendcode].forEach(function (endpoint) {
            if (!endpoint.component.equals(component) && (this._endpointList.indexOf(endpoint) < 0)) {
                callback(endpoint);
                this._endpointList.push(endpoint);
            }
        }, this);

        return this;
    };

    const getOppositeType = function getOppositeType(endpoint) {
        return endpoint.type === 'source' ? 'target' : 'source';
    };

    const removeFriendcode = function removeFriendcode(friendcode, endpoint) {
        const list = this.endpoints[endpoint.type][friendcode];

        list.splice(list.indexOf(endpoint), 1);

        if (!list.length) {
            delete this.endpoints[endpoint.type][friendcode];
        }

        return this;
    };

    const updateFriendcode = function updateFriendcode(friendcode, endpoint) {

        if (!(friendcode in this.endpoints[endpoint.type])) {
            this.endpoints[endpoint.type][friendcode] = [];
        }

        this.endpoints[endpoint.type][friendcode].push(endpoint);

        return this;
    };

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * Create a new instance of class KeywordSuggestion.
     *
     * @constructor
     */
    ns.KeywordSuggestion = class KeywordSuggestion {

        constructor() {
            this.endpoints = {source: {}, target: {}};
        }

        /**
         * Adds an endpoint into the managed endpoints.
         *
         * @param {Wirecloud.ui.WiringEditor.Endpoint} endpoint
         *      Endpoint to add.
         * @returns {Wirecloud.wiring.KeywordSuggestion}
         *      The instance on which the member is called.
         */
        appendEndpoint(endpoint) {
            if (endpoint.missing) {
                return this;
            }

            endpoint.friendcodeList.forEach(function (friendcode) {
                updateFriendcode.call(this, friendcode, endpoint);
            }, this);

            return this;
        }

        /**
         * Loop over the suggested endpoints to be connected to the endpoint
         * provided as reference.
         *
         * @param {Wirecloud.ui.WiringEditor.Endpoint} endpoint
         *      Endpoint to which the engine should search connection
         *      recommendations
         * @param {Function} callback
         *      Function to call for each suggestion
         * @returns {Wirecloud.wiring.KeywordSuggestion}
         *      The instance on which the member is called.
         */
        forEachSuggestion(endpoint, callback) {
            if (endpoint.missing) {
                return this;
            }

            const oppositeType = getOppositeType(endpoint);
            this._endpointList = [];

            endpoint.friendcodeList.forEach(function (friendcode) {
                findEndpoint.call(this, endpoint.component, oppositeType, friendcode, callback);
            }, this);

            delete this._endpointList;

            return this;
        }

        /**
         * Removes an endpoint from the managed ones
         *
         * @param {Wirecloud.ui.WiringEditor.Endpoint} endpoint
         *      Endpoint to remove
         * @returns {Wirecloud.wiring.KeywordSuggestion}
         *      The instance on which the member is called.
         */
        removeEndpoint(endpoint) {
            if (endpoint.missing) {
                return this;
            }

            endpoint.friendcodeList.forEach(function (friendcode) {
                removeFriendcode.call(this, friendcode, endpoint);
            }, this);

            return this;
        }

        /**
         * Clear the status of this instance.
         *
         * @returns {Wirecloud.wiring.KeywordSuggestion}
         *      The instance on which the member is called.
         */
        empty() {
            this.endpoints = {source: {}, target: {}};

            return this;
        }

    }

})(Wirecloud.wiring);
