/*
 *     (C) Copyright 2008-2013 Universidad Politécnica de Madrid
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

(function () {

    "use strict";

    var Endpoint = function Endpoint(name, type, friendCode, id) {
        this.id = id;
    };

    /**
     * @private
     */
    Endpoint.prototype._annotate = function _annotate(value, source, options) {
        var funcName = '_annotate';
        var msg = gettext("Unimplemented function: %(funcName)s");
        msg = interpolate(msg, {funcName: funcName}, yes);
        LogManagerFactory.getInstance().log(msg);
        return;
    };

    Endpoint.prototype.getValue = function getValue() {
        var funcName = 'getValue';
        var msg = gettext("Unimplemented function: %(funcName)s");
        msg = interpolate(msg, {funcName: funcName}, yes);
        LogManagerFactory.getInstance().log(msg);
        return;
    };

    Endpoint.prototype.getId = function getId() {
        return this.id;
    };

    Endpoint.prototype.getFinalSlots = function getFinalSlots() {
        return null;
    };

    /**
     * Disconnects this <code>Endpoint</code> from all the
     * <code>Endpoints</code> this is connected to.
     */
    Endpoint.prototype.fullDisconnect = function fullDisconnect() {
        var funcName = 'fullDisconnect';
        var msg = gettext("Unimplemented function: %(funcName)s");
        msg = interpolate(msg, {funcName: funcName}, yes);
        LogManagerFactory.getInstance().log(msg);
        return;
    };

    /**
     * This method must be called to avoid memory leaks caused by circular
     * references.
     */
    Endpoint.prototype.destroy = function destroy() {
        this.fullDisconnect();
    };

    Wirecloud.wiring.Endpoint = Endpoint;

})();
