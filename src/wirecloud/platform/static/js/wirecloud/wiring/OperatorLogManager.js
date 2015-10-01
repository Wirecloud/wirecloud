/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global StyledElements, Wirecloud */

(function (ns, se, utils) {

    "use strict";

    /**
     * Create a new instance of class OperatorLogManager.
     * @extends {LogManager}
     *
     * @constructor
     * @param {Operator} operator
     *      [TODO: description]
     * @param {Wiring} wiringEngine
     *      [TODO: description]
     */
    ns.OperatorLogManager = utils.defineClass({

        constructor: function OperatorLogManager(operator, wiringEngine) {
            this.superClass(wiringEngine.logManager);
            this.operator = operator;
        },

        inherit: Wirecloud.LogManager,

        members: {

            buildTitle: function buildTitle() {
                return utils.interpolate(utils.gettext("%(operator_title)s's logs"), {
                    operator_title: this.operator.title
                });
            }

        }

    });

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
