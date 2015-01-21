/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var key, manager = window.parent.NGSIManager, NGSIAPI = {};

    if (MashupPlatform.operator != null) {
        NGSIAPI.Connection = function Connection(url, options) {
            manager.Connection.call(this, 'operator', MashupPlatform.operator.id, url, options);
        };
    } else if (MashupPlatform.widget != null) {
        NGSIAPI.Connection = function Connection(url, options) {
            manager.Connection.call(this, 'widget', MashupPlatform.widget.id, url, options);
        };
    } else {
        throw new Error('Unknown resource type');
    }
    NGSIAPI.Connection.prototype = window.parent.NGSIManager.Connection.prototype;

    NGSIAPI.ProxyConnectionError = window.parent.NGSIManager.NGSI.ProxyConnectionError;
    NGSIAPI.InvalidResponseError = window.parent.NGSIManager.NGSI.InvalidResponseError;
    NGSIAPI.InvalidRequestError = window.parent.NGSIManager.NGSI.InvalidRequestError;
    NGSIAPI.ConnectionError = window.parent.NGSIManager.NGSI.ConnectionError;

    Object.freeze(NGSIAPI);

    window.NGSI = NGSIAPI;
})();
