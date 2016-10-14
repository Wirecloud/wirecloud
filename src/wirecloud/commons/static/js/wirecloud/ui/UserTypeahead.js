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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    ns.UserTypeahead = function UserTypeahead(options) {
        options = utils.merge(utils.clone(defaults), options);

        se.Typeahead.call(this, {
            autocomplete: options.autocomplete,
            dataFiltered: true,
            lookup: searchForUser,
            build: function build(typeahead, data) {
                return {
                    value: data.username,
                    title: data.fullname,
                    description: data.username,
                    iconClass: data.organization ? "fa fa-building" : "fa fa-user",
                    context: data
                };
            }
        });
    };
    utils.inherit(ns.UserTypeahead, se.Typeahead);

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var defaults = {
        autocomplete: true
    };

    var searchForUser = function searchForUser(querytext, next) {
        return Wirecloud.io.makeRequest(Wirecloud.URLs.SEARCH_SERVICE, {
            parameters: {namespace: 'user', q: querytext},
            method: 'GET',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'},
            onSuccess: function (response) {
                next(JSON.parse(response.responseText).results);
            }
        });
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
