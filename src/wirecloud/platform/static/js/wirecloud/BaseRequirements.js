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

/*global Wirecloud*/

(function () {

    "use strict";

    var check_basic_requirements = function check_basic_requirements() {
        var tester = {};

        if (!('addEventListener' in document.documentElement)) {
            throw new Error('Missing basic DOM event support');
        }

        if (!('JSON' in window)) {
            throw new Error('Missing JSON support');
        }

        if (!('freeze' in Object)) {
            throw new Error('Missing Object.freeze support');
        }

        if (!('defineProperty' in Object)) {
            throw new Error('Missing Object.defineProperty support');
        }

        try {
            tester = {};
            Object.defineProperty(tester, 'property', {});
        } catch (e) {
            throw new Error('Missing proper Object.defineProperty support');
        }

        if (!('defineProperties' in Object)) {
            throw new Error('Missing Object.defineProperties support');
        }

        if (!('defineProperties' in Object)) {
            throw new Error('Missing Object.defineProperties support');
        }

        if (!('classList' in document.documentElement)) {
            throw new Error('Missing Element.classList support');
        }

        if (window.history == null || typeof window.history.pushState !== 'function' || typeof window.history.replaceState !== 'function') {
            throw new Error("Missing HTML5's history API support");
        }

        if (!('pointerEvents' in document.documentElement.style)) {
            throw new Error('Missing pointer-events support for HTML elements');
        }
    };

    Wirecloud.check_basic_requirements = check_basic_requirements;

})();
