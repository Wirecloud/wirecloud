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

/* global StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class KeywordSuggestion.
     * @extends {Wiring.KeywordSuggestion}
     *
     * @constructor
     */
    ns.KeywordSuggestion = utils.defineClass({

        constructor: function KeywordSuggestion() {
            this.superClass();
        },

        inherit: Wirecloud.wiring.KeywordSuggestion,

        members: {

            /**
             * [TODO: hideSuggestions description]
             * @param {Endpoint} endpoint
             *      [TODO: description]
             * @returns {KeywordSuggestion}
             *      The instance on which the member is called.
             */
            hideSuggestions: function hideSuggestions(endpoint) {

                endpoint.deactivate();

                return this.forEachSuggestion(endpoint, function (foundEndpoint) {
                    foundEndpoint.deactivate();
                });
            },

            /**
             * [TODO: showSuggestions description]
             * @param {Endpoint} endpoint
             *      [TODO: description]
             * @returns {KeywordSuggestion}
             *      The instance on which the member is called.
             */
            showSuggestions: function showSuggestions(endpoint) {

                endpoint.activate();

                return this.forEachSuggestion(endpoint, function (foundEndpoint) {
                    foundEndpoint.activate();
                });
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
