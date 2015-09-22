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

/* global gettext, StyledElements, Wirecloud */

(function (ns, se, utils) {

    "use strict";

    /**
     * Create a new instance of class ConnectionLogManager.
     * @extends {LogManager}
     *
     * @constructor
     * @param {Connection} connection
     *      [TODO: description]
     * @param {Wiring} wiringEngine
     *      [TODO: description]
     */
    ns.ConnectionLogManager = utils.defineClass({

        constructor: function ConnectionLogManager(connection, wiringEngine) {
            this.superClass(wiringEngine.logManager);
            this.connection = connection;
        },

        inherit: Wirecloud.LogManager,

        members: {

            buildTitle: function buildTitle() {
                return utils.gettext("Connection's logs");
            }

        }

    });

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
