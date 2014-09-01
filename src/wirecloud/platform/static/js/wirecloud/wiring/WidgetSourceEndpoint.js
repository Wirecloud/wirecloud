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

/*global Wirecloud */

(function () {

    "use strict";

    var WidgetSourceEndpoint = function WidgetSourceEndpoint(iwidget, meta) {
        Object.defineProperty(this, 'meta', {value: meta});
        Object.defineProperty(this, 'name', {value: meta.name});
        Object.defineProperty(this, 'friendcode', {value: meta.friendcode});
        Object.defineProperty(this, 'label', {value: meta.label});
        Object.defineProperty(this, 'description', {value: meta.description});
        Object.defineProperty(this, 'iwidget', {value: iwidget});

        Wirecloud.wiring.SourceEndpoint.call(this, this.meta.name, this.meta.type, this.friendcode, 'iwidget_' + iwidget.id + '_' + this.meta.name);
    };
    WidgetSourceEndpoint.prototype = new Wirecloud.wiring.SourceEndpoint();

    WidgetSourceEndpoint.prototype.serialize = function serialize() {
        return {
            'type': 'iwidget',
            'id': this.iwidget.id,
            'endpoint': this.meta.name
        };
    };

    Wirecloud.wiring.WidgetSourceEndpoint = WidgetSourceEndpoint;

})();
