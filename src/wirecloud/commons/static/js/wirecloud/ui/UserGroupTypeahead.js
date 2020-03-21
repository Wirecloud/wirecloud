/*
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

    const ICON_MAPPING = {
        group: "users",
        organization: "building",
        user: "user"
    };

    ns.UserGroupTypeahead = function UserGroupTypeahead(options) {
        options = utils.merge(utils.clone(defaults), options);

        se.Typeahead.call(this, {
            autocomplete: options.autocomplete,
            lookup: searchForUserGroup,
            build: function build(typeahead, data) {
                return {
                    value: data.name,
                    title: data.fullname || data.name,
                    description: data.name,
                    iconClass: "fas fa-" + ICON_MAPPING[data.type],
                    context: data
                };
            }
        });
    };
    utils.inherit(ns.UserGroupTypeahead, se.Typeahead);

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var defaults = {
        autocomplete: true
    };

    var searchForUserGroup = function searchForUserGroup(querytext, next) {
        return Wirecloud.io.makeRequest(Wirecloud.URLs.SEARCH_SERVICE, {
            parameters: {namespace: 'usergroup', q: querytext},
            method: 'GET',
            contentType: 'application/json',
            requestHeaders: {'Accept': 'application/json'}
        }).then((response) => {
            next(JSON.parse(response.responseText).results);
        });
    };

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
