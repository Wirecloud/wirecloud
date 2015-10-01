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

/* global StyledElements, Wirecloud */

(function (ns, se, utils) {

    "use strict";

    /**
     * Create a new instance of class MissingComponentLogManager.
     * @extends {LogManager}
     *
     * @constructor
     * @param {MissincComponent} component
     *      [TODO: description]
     * @param {Wiring} wiringEngine
     *      [TODO: description]
     */
    ns.MissingComponentLogManager = utils.defineClass({

        constructor: function MissingComponentLogManager(component, wiringEngine) {
            this.superClass(wiringEngine.logManager);
            this.component = component;
        },

        inherit: Wirecloud.LogManager,

        members: {

            buildTitle: function buildTitle() {
                return utils.interpolate(utils.gettext("%(component_type)s's logs"), {
                    component_type: utils.capitalize(this.component.meta.type)
                });
            }

        }

    });

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
