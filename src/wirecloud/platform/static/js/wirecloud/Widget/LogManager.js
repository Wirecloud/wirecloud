/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
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
    var LogManager = function LogManager(iWidget) {
        Wirecloud.LogManager.call(this, Wirecloud.GlobalLogManager);
        this.iWidget = iWidget;
    };
    LogManager.prototype = new Wirecloud.LogManager();

    LogManager.prototype.buildExtraInfo = function buildExtraInfo() {
        var extraInfo = document.createElement('div'),
            extraInfoIcon = document.createElement('div'),
            extraInfoText = document.createElement('span');
        extraInfo.className += " iwidget_info_container";
        extraInfo.appendChild(extraInfoIcon);
        extraInfo.appendChild(extraInfoText);
        extraInfoIcon.className = "iwidget_info";
        extraInfoText.innerHTML = this.iWidget.id;
        extraInfoText.setAttribute('title', this.iWidget.name + "\n " + this.iWidget.widget.getInfoString());
        extraInfo.style.cursor = "pointer";

        return extraInfo;
    };

    LogManager.prototype.buildTitle = function buildTitle() {
        var title;

        if (this.iWidget) {
            title = gettext('%(iwidget_name)s\'s logs');
            title = interpolate(title, {iwidget_name: this.iWidget.name}, true);
            return title;
        } else {
            return this.title;
        }
    };

    LogManager.prototype.close = function close() {
        this.title = this.buildTitle();
        this.iWidget = null;
    };

    Wirecloud.Widget.LogManager = LogManager;

})();
