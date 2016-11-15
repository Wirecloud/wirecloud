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

    var VERSION_RE = /^((?:[1-9]\d*\.|0\.)*(?:[1-9]\d*|0))((?:a|b|rc)[1-9]\d*)?(-dev(.+)?)?$/; // Hangs if it doesn't match the RE

    /**
     * Creates a Version object. This kind of instance allows you to:
     * - validate versions
     * - compare versions
     * - remove internal details when displaying them to the end user
     *
     * @constructor
     * @name Wirecloud.Version
     * @param {String} version
     *     version as a string
     */
    var Version = function Version(version) {
        var groups, msg;
        if (typeof version === 'string') {
            groups = version.match(VERSION_RE);
            if (groups == null) {
                msg = "%(version)s is not a valid version";
                throw new TypeError(utils.interpolate(msg, {version: version}));
            }

            this.array = groups[1].split('.').map(function (x) { return parseInt(x, 10); });
            /**
             * Pre-version part of the version, `null` if this version has not a
             * pre-version part.
             *
             * **Example**: "a1"
             *
             * @name Wirecloud.Version#pre_version
             * @type {String}
             */
            this.pre_version = groups[2] != null ? groups[2] : null;
            /**
             * Indicates if this version is a development version
             *
             * @name Wirecloud.Version#dev
             * @type {Boolean}
             */
            this.dev = groups[3] != null;
            /**
             * Dev user part of the version, `null` if this version has not a
             * dev user part.
             *
             * **Example**: "admin"
             *
             * @name Wirecloud.Version#devtext
             * @type {String}
             */
            this.devtext = groups[4];
            /**
             * String representing this version.
             *
             * **Example**: "1.0rc1-devadmin"
             *
             * @name Wirecloud.Version#text
             * @type {String}
             * @See {@link Wirecloud.Version#toString} for getting a string
             *     representation for the end user.
             */
            this.text = version;
        } else {
            throw new TypeError("missing or invalid version parameter");
        }
        Object.freeze(this);
    };

    /**
     * Compares this version with the specified version for order
     *
     * @name Wirecloud.Version#compareTo
     * @method
     *
     * @param {String|Wirecloud.Version} version
     *     the version to be compared.
     *
     * @returns {Number}
     *     a negative integer, zero, or a positive integer as this version is
     *     less than, equal to, or greater than the specified version.
     */
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
            if (this.dev === version.dev) {
                // If neither or both are dev return 0 (equals) if devtext are the same
                // If neither are dev versions, both devtext will be null
                return this.devtext === version.devtext ? 0 : 1;
            } else {
                // Development versions are lower
                return this.dev ? -1 : 1;
            }
        }
    };

    /**
     * Returns a string representation of the version.
     *
     * **Example**:
     *
     * ```javascript
     * var version = new Wirecloud.Version("1.0-devadmin");
     * version.toString() => "1.0-dev"
     * ```
     *
     * @name Wirecloud.Version#toString
     * @method
     *
     * @returns {String}
     *     a string representation of the version.
     */
    Version.prototype.toString = function toString() {
        return this.text.replace(/-dev.*$/, '-dev');
    };

    Wirecloud.Version = Version;

})(Wirecloud.Utils);
