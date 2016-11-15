/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    Wirecloud.constants.LOGGING = {
        ERROR_MSG: 1,
        WARN_MSG: 2,
        INFO_MSG: 3,
        DEBUG_MSG: 4
    };

    Wirecloud.constants.HTTP_STATUS_DESCRIPTIONS = {
        "0": utils.gettext("Connection Refused"),
        "400": utils.gettext("Bad Request"),
        "401": utils.gettext("Unauthorized"),
        "402": utils.gettext("Payment Required"),
        "403": utils.gettext("Forbidden"),
        "404": utils.gettext("Not Found"),
        "405": utils.gettext("Method Not Allowed"),
        "406": utils.gettext("Not Acceptable"),
        "407": utils.gettext("Proxy Authentication Required"),
        "408": utils.gettext("Request Timeout"),
        "409": utils.gettext("Conflict"),
        "410": utils.gettext("Gone"),
        "411": utils.gettext("Length Required"),
        "412": utils.gettext("Precondition Failed"),
        "413": utils.gettext("Request Entity Too Large"),
        "414": utils.gettext("Request-URI Too Long"),
        "415": utils.gettext("Unsupported Media Type"),
        "416": utils.gettext("Requested Range Not Satisfiable"),
        "417": utils.gettext("Expectation Failed"),
        "422": utils.gettext("Unprocessable Entity"),
        "423": utils.gettext("Locked"),
        "424": utils.gettext("Failed Dependency"),
        "426": utils.gettext("Upgrade Required"),
        "500": utils.gettext("Internal Server Error"),
        "501": utils.gettext("Not Implemented"),
        "502": utils.gettext("Bad Gateway"),
        "503": utils.gettext("Service Unavailable"),
        "504": utils.gettext("Gateway Timeout"),
        "505": utils.gettext("HTTP Version Not Supported"),
        "506": utils.gettext("Variant Also Negotiates"),
        "507": utils.gettext("Insufficient Storage"),
        "508": utils.gettext("Loop Detected"),
        "510": utils.gettext("Not Extended")
    };

    Wirecloud.constants.UNKNOWN_STATUS_CODE_DESCRIPTION = utils.gettext("Unknown status code");

})(Wirecloud.Utils);
