/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    /**
     * Create a new instance of class TargetEndpoint.
     * @extends {Endpoint}
     *
     * @constructor
     * @param {Wiring.Endpoint} wiringEndpoint
     *      [TODO: description]
     * @param {ComponentDraggable} component
     *      [TODO: description]
     */
    ns.TargetEndpoint = function TargetEndpoint(wiringEndpoint, component) {
        ns.Endpoint.call(this, 'target', wiringEndpoint, component);
    };

    utils.inherit(ns.TargetEndpoint, ns.Endpoint, {
    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
