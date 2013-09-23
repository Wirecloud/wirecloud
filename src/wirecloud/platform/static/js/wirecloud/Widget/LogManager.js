/*
 *     (C) Copyright 2013 Universidad Politécnica de Madrid
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

/*global gettext, interpolate, LogManagerFactory, OpManagerFactory, Wirecloud*/

(function () {

    "use strict";

    /**
     *
     */
    var LogManager = function LogManager(iWidget) {
        var globalManager = LogManagerFactory.getInstance();
        LogManager.call(this, globalManager);

        globalManager.childManagers.push(this);
        this.iWidget = iWidget;
    };
    LogManager.prototype = new LogManager();

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
        extraInfo.addEventListener('click', function () {
            OpManagerFactory.getInstance().showLogs(this);
        }.bind(this), true);

        return extraInfo;
    };

    LogManager.prototype.buildTitle = function buildTitle() {
        var title;

        if (this.iWidget) {
            title = gettext('iWidget #%(iWidgetId)s Logs');
            title = interpolate(title, {iWidgetId: this.iWidget.id}, true);
            return title;
        } else {
            return this.title;
        }
    };

    LogManager.prototype.buildSubTitle = function buildSubTitle() {
        if (this.iWidget) {
            return this.iWidget.name;
        } else {
            return this.subtitle;
        }
    };

    LogManager.prototype.close = function close() {
        this.title = this.buildTitle();
        this.subtitle = this.buildSubTitle();
        this.iWidget = null;
    };

    Wirecloud.Widget.LogManager = LogManager;

})();
