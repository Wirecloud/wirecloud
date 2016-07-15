/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var WidgetLogManager = function WidgetLogManager(widget) {
        Wirecloud.LogManager.call(this, Wirecloud.GlobalLogManager);
        this.widget = widget;
    };
    WidgetLogManager.prototype = new Wirecloud.LogManager();

    WidgetLogManager.prototype.buildExtraInfo = function buildExtraInfo() {
        var extraInfo = document.createElement('div'),
            extraInfoIcon = document.createElement('div'),
            extraInfoText = document.createElement('span');
        extraInfo.className += " iwidget_info_container";
        extraInfo.appendChild(extraInfoIcon);
        extraInfo.appendChild(extraInfoText);
        extraInfoIcon.className = "iwidget_info";
        extraInfoText.innerHTML = this.widget.id;
        extraInfoText.setAttribute('title', this.widget.title + "\n " + this.widget.meta.getInfoString());
        extraInfo.style.cursor = "pointer";

        return extraInfo;
    };

    WidgetLogManager.prototype.buildTitle = function buildTitle() {
        return utils.gettext("Logs");
    };

    Wirecloud.WidgetLogManager = WidgetLogManager;

})(Wirecloud.Utils);
