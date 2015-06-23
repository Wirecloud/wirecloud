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

/*global gettext, Wirecloud*/

(function () {

    "use strict";

    /**
     *
     */
    var ConnectionLogManager = function ConnectionLogManager(wiring) {
        Wirecloud.LogManager.call(this, wiring.logManager);
        Object.defineProperty(this, 'wiring', {value: wiring});
    };
    ConnectionLogManager.prototype = new Wirecloud.LogManager();

    ConnectionLogManager.prototype.buildExtraInfo = function buildExtraInfo() {
        var extraInfo = document.createElement('div');

        return extraInfo;
    };

    ConnectionLogManager.prototype.buildTitle = function buildTitle() {
        return gettext('Connection logs');
    };

    ConnectionLogManager.prototype.close = function close() {
    };

    Wirecloud.wiring.ConnectionLogManager = ConnectionLogManager;

})();
