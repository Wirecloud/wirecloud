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


(function () {

    "use strict";

    var Theme = function Theme(desc) {
        Object.defineProperties(this, {
            name: {value: desc.name},
            label: {value: desc.label},
            baseurl: {value: desc.baseurl},
            templates: {value: desc.templates}
        });
        Object.freeze();
    };

    Theme.prototype.get_static_url = function get_static_url(path) {
        return this.baseurl + path;
    };

    Wirecloud.ui.Theme = Theme;

})();
