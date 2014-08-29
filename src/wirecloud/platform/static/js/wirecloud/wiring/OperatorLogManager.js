/*
 *     Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, interpolate, Wirecloud*/

(function () {

    "use strict";

    /**
     *
     */
    var OperatorLogManager = function OperatorLogManager(ioperator) {
        Wirecloud.LogManager.call(this, ioperator.wiring.logManager);
        this.ioperator = ioperator;
    };
    OperatorLogManager.prototype = new Wirecloud.LogManager();

    OperatorLogManager.prototype.buildTitle = function buildTitle() {
        var title;

        if (this.ioperator) {
            title = gettext('%(ioperator_title)s\'s logs');
            title = interpolate(title, {ioperator_title: this.ioperator.name}, true);
            return title;
        } else {
            return this.title;
        }
    };

    OperatorLogManager.prototype.close = function close() {
        this.title = this.buildTitle();
        this.ioperator = null;
    };

    Wirecloud.wiring.OperatorLogManager = OperatorLogManager;

})();
