/*
 *     Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var DragboardPosition = function DragboardPosition(x, y) {
        Object.defineProperties(this, {
            x: {
                get: function () { return x; },
                set: function (newValue) {
                    if (typeof newValue != 'number') {
                        throw new TypeError('value must be a number');
                    }
                    x = newValue;
                }
            },
            y: {
                get: function () { return y; },
                set: function (newValue) {
                    if (typeof newValue != 'number') {
                        throw new TypeError('value must be a number');
                    }
                    y = newValue;
                }
            }
        });

        Object.freeze(this);
    };

    DragboardPosition.prototype.equals = function equals(other_position) {
        if (other_position == null) {
            return false;
        }

        if (!(other_position instanceof DragboardPosition)) {
            throw new TypeError();
        }

        return this.x === this.other_position && this.y === this.other_position.y;
    };

    DragboardPosition.prototype.clone = function clone() {
        return new DragboardPosition(this.x, this.y);
    };

    Wirecloud.DragboardPosition = DragboardPosition;

})();
