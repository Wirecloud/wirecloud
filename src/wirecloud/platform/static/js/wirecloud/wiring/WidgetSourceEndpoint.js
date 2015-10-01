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

/*global Wirecloud */

(function (utils) {

    "use strict";

    var WidgetSourceEndpoint = function WidgetSourceEndpoint(iwidget, meta) {
        Object.defineProperty(this, 'iwidget', {value: iwidget});
        Object.defineProperty(this, 'component', {value: iwidget});

        Object.defineProperty(this, 'meta', {value: meta});
        if (meta != null) {
            Object.defineProperty(this, 'name', {value: meta.name});
            Object.defineProperty(this, 'missing', {value: false});
            Object.defineProperty(this, 'friendcode', {value: meta.friendcode});
            Object.defineProperty(this, 'keywords', {value: meta.friendcode.trim().split(/\s+/)});
            Object.defineProperty(this, 'label', {value: meta.label});
            Object.defineProperty(this, 'description', {value: meta.description ? meta.description : utils.gettext("No description provided.")});
            Object.defineProperty(this, 'id', {value: 'widget/' + iwidget.id + '/' + this.meta.name});
        }

        Wirecloud.wiring.SourceEndpoint.call(this);
    };
    WidgetSourceEndpoint.prototype = new Wirecloud.wiring.SourceEndpoint();

    WidgetSourceEndpoint.prototype.toString = function toString() {
        return this.id;
    };

    WidgetSourceEndpoint.prototype.toJSON = function toJSON() {
        return {
            type: this.component.meta.type,
            id: this.component.id,
            endpoint: this.name
        };
    };

    Wirecloud.wiring.WidgetSourceEndpoint = WidgetSourceEndpoint;

})(Wirecloud.Utils);
