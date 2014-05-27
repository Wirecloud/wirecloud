/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var VERSION_RE = /^((?:[1-9]\d*\.|0\.)*(?:[1-9]\d*|0))((?:a|b|rc)[1-9]\d*)?$/;

    var Version = function Version(version, source) {
        var groups;
        if (typeof version == 'string') {
            groups = version.match(VERSION_RE);
            this.array = groups[1].split('.').map(function (x) { return parseInt(x, 10); });
            this.pre_version = groups[2] != null ? groups[2] : null;
            this.text = version;
        } else if (version instanceof Array) {
            this.array = version;
            this.pre_version = null;
            this.text = version.join('.');
        } else {
            throw new TypeError();
        }
        this.source = source;
        Object.freeze(this);
    };

    Version.prototype.compareTo = function compareTo(version) {
        var len, value1, value2, pre_version1, pre_version2, i;

        len = Math.max(this.array.length, version.array.length);

        for (i = 0; i < len; i += 1) {
            value1 = this.array[i] != null ? this.array[i] : 0;
            value2 = version.array[i] != null ? version.array[i] : 0;

            if (value1 !== value2) {
                return value1 - value2;
            }
        }

        pre_version1 = this.pre_version;
        if (pre_version1 == null) {
            pre_version1 = "z";
        }
        pre_version2 = version.pre_version;
        if (pre_version2 == null) {
            pre_version2 = "z";
        }

        if (pre_version1 < pre_version2) {
            return -1;
        } else if (pre_version1 > pre_version2) {
            return 1;
        } else {
            return 0;
        }
    };

    Version.prototype.toString = function toString() {
        return this.text;
    };

    Wirecloud.Version = Version;
})();
