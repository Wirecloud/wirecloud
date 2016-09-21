/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var VERSION_RE = /^((?:[1-9]\d*\.|0\.)*(?:[1-9]\d*|0))((?:a|b|rc)[1-9]\d*)?(-dev.*)?$/; // Hangs if it doesn't match the RE

    var Version = function Version(version, source) {
        var groups, msg;
        if (typeof version == 'string') {
            groups = version.match(VERSION_RE);
            if (groups == null) {
                msg = "%(version)s is not a valid version";
                throw new TypeError(utils.interpolate(msg, {version: version}));
            }
            this.array = groups[1].split('.').map(function (x) { return parseInt(x, 10); });
            this.pre_version = groups[2] != null ? groups[2] : null;
            this.dev = groups[3] != null;
            this.text = version;
        } else if (version instanceof Array) {
            this.array = version;
            this.pre_version = null;
            this.dev = false;
            this.text = version.join('.');
        } else {
            throw new TypeError("missing or invalid version parameter");
        }
        this.source = source;
        Object.freeze(this);
    };

    Version.prototype.compareTo = function compareTo(version) {
        var len, value1, value2, pre_version1, pre_version2, i;

        if (!(version instanceof Version)) {
            // Try to parse version
            try {
                version = new Version(version);
            } catch (e) {
                throw new TypeError("invalid version parameter");
            }
        }

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
            // If neither or both are dev return 0 (equals)
            if (this.dev === version.dev) {
                return 0;
            } else {
                // Development versions are lower
                return this.dev ? -1 : 1;
            }
        }
    };

    Version.prototype.toString = function toString() {
        return this.text.replace(/-dev.*$/, '-dev');
    };

    Wirecloud.Version = Version;

})(Wirecloud.Utils);
