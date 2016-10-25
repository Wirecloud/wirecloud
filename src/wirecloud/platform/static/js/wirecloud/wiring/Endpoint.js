/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

    var Endpoint = function Endpoint() {

        if (!('name' in this)) {
            Object.defineProperty(this, 'name', {value: null});
        }

        if (!('friendcode' in this)) {
            Object.defineProperty(this, 'friendcode', {value: ""});
        }

        var friendcodeList = this.friendcode !== '' ? this.friendcode.split(/\s+/) : [];
        Object.defineProperty(this, 'friendcodeList', {value: friendcodeList});

        if (!('label' in this)) {
            Object.defineProperty(this, 'label', {value: ""});
        }
        if (!('description' in this)) {
            Object.defineProperty(this, 'description', {value: ""});
        }

        if (!('id' in this)) {
            Object.defineProperty(this, 'id', {value: null});
        }

    };

    Endpoint.prototype.getReachableEndpoints = function getReachableEndpoints() {
        return [];
    };

    /**
     * Disconnects this <code>Endpoint</code> from all the
     * <code>Endpoints</code> this is connected to.
     */
    /* istanbul ignore next */
    Endpoint.prototype.fullDisconnect = function fullDisconnect() {
        var funcName = 'fullDisconnect';
        var msg = utils.gettext("Unimplemented function: %(funcName)s");
        msg = utils.interpolate(msg, {funcName: funcName}, true);
        Wirecloud.GlobalLogManager.log(msg);
        return;
    };

    Wirecloud.wiring.Endpoint = Endpoint;

})(Wirecloud.Utils);
