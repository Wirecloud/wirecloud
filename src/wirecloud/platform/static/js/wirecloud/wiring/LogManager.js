/*
 *     Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

    /**
     *
     */
    var LogManager = function LogManager(wiring) {
        Wirecloud.LogManager.call(this, Wirecloud.GlobalLogManager);
        Object.defineProperty(this, 'wiring', {value: wiring});
    };
    LogManager.prototype = new Wirecloud.LogManager();

    LogManager.prototype.buildExtraInfo = function buildExtraInfo() {
        var extraInfo = document.createElement('div');

        return extraInfo;
    };

    LogManager.prototype.buildTitle = function buildTitle() {
        return gettext('Wiring\'s logs');
    };

    LogManager.prototype.close = function close() {
    };

    Wirecloud.wiring.LogManager = LogManager;

})();
