/*
 *     (C) Copyright 2011-2013 Universidad Politécnica de Madrid
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

/*global Wirecloud*/

(function () {

    "use strict";

    var Version = function Version(version, source) {
        if (typeof version == 'string') {
            this.text = version;
            this.array = version.split('.').map(function (x) { return parseInt(x, 10); });
        } else if (version instanceof Array) {
            this.array = version;
            this.text = version.join('.');
        } else {
            throw new TypeError();
        }
        this.source = source;
    };

    Version.prototype.compareTo = function compareTo(version) {
        var len, value1, value2, i;

        len = Math.max(this.array.length, version.array.length);

        for (i = 0; i < len; i += 1) {
            value1 = this.array[i] != null ? this.array[i] : 0;
            value2 = version.array[i] != null ? version.array[i] : 0;

            if (value1 !== value2) {
                return value1 - value2;
            }
        }

        return 0;
    };

    Wirecloud.Version = Version;
})();
