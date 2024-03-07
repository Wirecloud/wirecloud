/*
 *     Copyright (c) 2013-2017 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2023 Future Internet Consulting and Development Solutions S.L.
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

    var _NGSIAPI = function _NGSIAPI(parent, platform, _) {
        var key, manager = platform.NGSIManager, NGSIAPI = {};
        var component = parent.MashupPlatform.priv.resource;

        NGSIAPI.Connection = function Connection(url, options) {
            manager.Connection.call(this, component, url, options);
        };
        NGSIAPI.Connection.prototype = platform.NGSIManager.Connection.prototype;

        NGSIAPI.ProxyConnectionError = platform.NGSIManager.NGSI.ProxyConnectionError;
        NGSIAPI.InvalidResponseError = platform.NGSIManager.NGSI.InvalidResponseError;
        NGSIAPI.InvalidRequestError = platform.NGSIManager.NGSI.InvalidRequestError;
        NGSIAPI.ConnectionError = platform.NGSIManager.NGSI.ConnectionError;

        Object.freeze(NGSIAPI);

        parent.NGSI = NGSIAPI;
    };

    // Detects if this is inside an iframe (will use version v1, which defines the MashupPlatform in the window)
    if (window.parent !== window) {
        _NGSIAPI(window, window.parent);
    } else {
        Wirecloud.APIRequirements.NGSI = _NGSIAPI;
    }

})();
