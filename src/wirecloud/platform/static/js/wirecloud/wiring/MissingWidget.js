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

/* global StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class MissingWidget.
     *
     * @extend Wirecloud.wiring.MissingComponent
     * @name Wirecloud.wiring.MissingWidget
     *
     * @constructor
     * @param {Wirecloud.Widget} widget real widget instance
     * @param {Wirecloud.Wiring} wiringEngine Wiring Engine associated to this
     *     component
     * @param {String} reason text describing the reason this widget cannot be
     *     loaded
     */
    ns.MissingWidget = utils.defineClass({

        constructor: function MissingWidget(widget, wiringEngine, reason) {
            this.superClass(widget.id, widget.meta, wiringEngine, reason);
            Object.defineProperties(this, {
                title: {value: widget.title},
                reason: {value: utils.interpolate(reason, {id: this.id, uri: this.meta.uri})},
            });
            this.logManager.log(this.reason, Wirecloud.constants.LOGGING.ERROR_MSG);
        },

        statics: {
            DEFAULT_PERMISSIONS: {
                'close': true,
                'move': true,
                'rename': true,
                'resize': true
            }
        },

        inherit: ns.MissingComponent

    });

})(Wirecloud.wiring, StyledElements, StyledElements.Utils);
