/*
 *     Copyright (c) 2011-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, Wirecloud*/

(function () {

    "use strict";

    Wirecloud.constants.LOGGING = {
        ERROR_MSG: 1,
        WARN_MSG:  2,
        INFO_MSG:  3
    };

    Wirecloud.constants.HTTP_STATUS_DESCRIPTIONS = {
        "0": gettext("Connection Refused"),
        "400": gettext("Bad Request"),
        "401": gettext("Unauthorized"),
        "402": gettext("Payment Required"),
        "403": gettext("Forbidden"),
        "404": gettext("Not Found"),
        "405": gettext("Method Not Allowed"),
        "406": gettext("Not Acceptable"),
        "407": gettext("Proxy Authentication Required"),
        "408": gettext("Request Timeout"),
        "409": gettext("Conflict"),
        "410": gettext("Gone"),
        "411": gettext("Length Required"),
        "412": gettext("Precondition Failed"),
        "413": gettext("Request Entity Too Large"),
        "414": gettext("Request-URI Too Long"),
        "415": gettext("Unsupported Media Type"),
        "416": gettext("Requested Range Not Satisfiable"),
        "417": gettext("Expectation Failed"),
        "422": gettext("Unprocessable Entity"),
        "423": gettext("Locked"),
        "424": gettext("Failed Dependency"),
        "426": gettext("Upgrade Required"),
        "500": gettext("Internal Server Error"),
        "501": gettext("Not Implemented"),
        "502": gettext("Bad Gateway"),
        "503": gettext("Service Unavailable"),
        "504": gettext("Gateway Timeout"),
        "505": gettext("HTTP Version Not Supported"),
        "506": gettext("Variant Also Negotiates"),
        "507": gettext("Insufficient Storage"),
        "508": gettext("Loop Detected"),
        "510": gettext("Not Extended")
    };

    Wirecloud.constants.UNKNOWN_STATUS_CODE_DESCRIPTION = gettext("Unknown status code");

})();
