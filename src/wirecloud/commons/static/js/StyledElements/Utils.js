/*
 *     Copyright (c) 2008-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements */


// TODO
/**
 * @namespace StyledElements
 */
if (window.StyledElements == null) {
    window.StyledElements = {};
}

(function () {

    "use strict";

    /**
     * @namespace StyledElements.Utils
     */
    var Utils = {};

    /**
     * Overwrite the following method for supporting translations
     */
    Utils.gettext = function gettext(text) {
        return text;
    };

    /**
     * Overwrite the following method for supporting translations
     */
    Utils.ngettext = function ngettext(singular, plural, count) {
        return (count === 1) ? singular : plural;
    };

    /**
     * Rellena los parámetros usados en un patrón. Los campos a rellenar en el
     * patrón vienen indicados mediante sentencias "%(nombre)s". Por ejemplo,
     * al finalizar la ejecución del siguiente código:
     * <code>
     *     var date = {year: 2009, month: 3, day: 27};
     *
     *     var pattern1 = "%(year)s/%(month)s/%(day)s";
     *     var result1 = Utils.interpolate(pattern, date);
     *
     *     var pattern2 = "%(day)s/%(month)s/%(year)s";
     *     var result2 = Utils.interpolate(pattern, date);
     * </code>
     *
     * obtendríamos "2009/3/27" en result1 y "27/3/2009" en result2
     */
    Utils.interpolate = function interpolate(pattern, attributes) {
        return pattern.replace(/%\(\w+\)s/g,
            function (match) {
                return String(attributes[match.slice(2, -2)]);
            });
    };

    Utils.Template = function Template(template) {
        this.template = template;
    };

    Utils.Template.prototype.evaluate = function evaluate(context) {
        return Utils.interpolate(this.template, context);
    };

    /**
     * Event listener that stops any event propagation.
     *
     * @memberof StyledElements.Utils
     */
    Utils.stopPropagationListener = function stopPropagationListener(e) {
        e.stopPropagation();
    };

    /**
     * Event listener that prevents the default action for a event.
     *
     * @memberof StyledElements.Utils
     */
    Utils.preventDefaultListener = function preventDefaultListener(e) {
        e.preventDefault();
    };

    /**
     * This method provides a shortcut for handling common error control
     * patterns when calling callbacks.
     *
     * @memberof StyledElements.Utils
     * @since 0.5
     *
     * @param {*} [callback] This parameter should provide the callback to call,
     * if the givent type is not a function, callCallback will do nothing.
     * @params {...*} var_args Arguments to pass to the callback function
     *
     * @return {*} value returned by the callback function
     */
    Utils.callCallback = function callCallback(callback, var_args) {
        if (typeof callback === 'function') {
            try {
                return callback.apply(null, Array.prototype.slice.call(arguments, 1));
            } catch (error) {}
        }
    };

    Utils.getFullscreenElement = function getFullscreenElement() {
        /* istanbul ignore else */
        if ('fullscreenElement' in document) {
            return document.fullscreenElement;
        } else if ('msFullscreenElement' in document) {
            return document.msFullscreenElement;
        } else if ('mozFullScreenElement' in document) {
            return document.mozFullScreenElement;
        } else if ('webkitFullscreenElement' in document) {
            return document.webkitFullscreenElement;
        }
    };

    Utils.onFullscreenChange = function onFullscreenChange(element, callback) {
        if (element instanceof StyledElements.StyledElement) {
            element = element.wrapperElement;
        }

        element.ownerDocument.addEventListener('fullscreenchange', callback, true);
        element.ownerDocument.addEventListener('msfullscreenchange', callback, true);
        element.ownerDocument.addEventListener('mozfullscreenchange', callback, true);
        element.ownerDocument.addEventListener('webkitfullscreenchange', callback, true);
    };

    Utils.removeFullscreenChangeCallback = function removeFullscreenChangeCallback(element, callback) {
        if (element instanceof StyledElements.StyledElement) {
            element = element.wrapperElement;
        }

        element.ownerDocument.removeEventListener('fullscreenchange', callback, true);
        element.ownerDocument.removeEventListener('msfullscreenchange', callback, true);
        element.ownerDocument.removeEventListener('mozfullscreenchange', callback, true);
        element.ownerDocument.removeEventListener('webkitfullscreenchange', callback, true);
    };

    Utils.isFullscreenSupported = function isFullscreenSupported() {
        if ('fullscreenEnabled' in document) {
            return document.fullscreenEnabled;
        } else if ('mozFullScreenEnabled' in document) {
            return document.mozFullScreenEnabled;
        } else if ('webkitFullscreenEnabled' in document) {
            return document.webkitFullscreenEnabled;
        }
    };

    Utils.removeWord = function removeWord(text, word) {
        return text.replace(new RegExp("(^\\s*|\\s+)" + word + "(\\s+|\\s*$)", "g"), " ").trim();
    };

    Utils.appendWord = function appendWord(text, word) {
        return Utils.removeWord(text, word) + (" " + word);
    };

    Utils.prependWord = function prependWord(text, word) {
        return word + " " + Utils.removeWord(text, word);
    };

    /**
     * Escapes a minimal set of characters (`\`, `*`, `+`, `?`,  `|`, `{`, `[`,
     * `(`, `)`, `^`, `$`, `.`,  `#`, and white space) by replacing them with
     * their escape codes. This instructs the regular expression engine to
     * interpret these characters literally rather than as metacharacters.
     *
     * @memberof StyledElements.Utils
     * @since 0.5
     *
     * @param {String} text Text to be used as part of a regex
     * @returns {String} Text to use in a regex
     *
     * @example
     *
     * var user_input = "Case inSensitive search";
     * new RegExp(escapeRegExp(user_input), "i");
     *
     * var user_input = "RegExp with user input";
     * new RegExp(escapeRegExp(user_input) + "... (OK|FAIL|ERROR)")
     */
    Utils.escapeRegExp = function escapeRegExp(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

    // Temporal element used by escapeHTML
    var tmp_div = document.createElement('div');

    /**
     * Escapes the characters in a String using HTML entities.
     *
     * @memberof StyledElements.Utils
     * @since 0.5
     *
     * @param {String} text Text to be used as text in a HTLM document
     * @returns {String} HTML representation of the provided text
     *
     * @example
     *
     * var user_input = "<hello> world";
     * new Frament("User input: " + escapeHTML(user_input));
     */
    Utils.escapeHTML = function escapeHTML(text) {
        tmp_div.textContent = text;
        return tmp_div.innerHTML;
    };

    /**
     * Returns the position of a given element relative to another given element.
     *
     * @memberof StyledElements.Utils
     * @since 0.5
     *
     * @param {Element} element1 Element to position
     * @param {Element} element2 Base element
     * @returns {Object}
     *     an object with the relative coordinates in the `x` and `y` attributes
     */
    Utils.getRelativePosition = function getRelativePosition(element1, element2) {

        if (element1 === element2) {
            return {x: 0, y: 0};
        }

        var element1_rect = element1.getBoundingClientRect();
        var element2_rect = element2.getBoundingClientRect();

        return {x: element1_rect.left - element2_rect.left, y: element1_rect.top - element2_rect.top};
    };

    /**
     * @experimental
     */
    Utils.clone = function clone(object, deep) {
        var result, key;

        if (object == null || typeof object !== 'object') {
            return object;
        } else if (Array.isArray(object)) {
            result = [];
        } else {
            result = {};
        }

        if (deep) {
            for (key in object) {
                result[key] = Utils.clone(object[key], true);
            }
        } else {
            for (key in object) {
                result[key] = object[key];
            }
        }

        return result;
    };

    Utils.cloneObject = function cloneObject(source) {
        var target = {};

        if (source == null) {
            return target;
        }

        if (!Utils.isPlainObject(source)) {
            throw new TypeError("[error description]");
        }

        for (var name in source) {
            target[name] = cloneProp.call(Utils, source[name]);
        }

        return target;
    };

    var cloneProp = function cloneProp(sourceValue) {
        if (sourceValue == null) {
            return null;
        }

        if (Utils.isPlainObject(sourceValue)) {
            return this.cloneObject(sourceValue);
        }

        if (Array.isArray(sourceValue)) {
            return sourceValue.slice();
        }

        return sourceValue;
    };

    // =========================================================================
    // DOCUMENT - HELPERS
    // =========================================================================

    /**
     * Checks if *element* has the focus
     *
     * @memberof StyledElements.Utils
     * @since 0.6.2
     *
     * @param {Element} element element to test
     * @returns {Boolean} true if element is focused
     */
    Utils.hasFocus = function hasFocus(element) {
        return document.activeElement === element;
    };

    /**
     * [updateObject description]
     *
     * @param {Object.<String, *>} target [description]
     * @param {Object.<String, *>} source [description]
     * @returns {Object.<String, *>} [description]
     */
    Utils.updateObject = function updateObject(target, source) {
        target = Utils.cloneObject(target);
        source = Utils.cloneObject(source);

        for (var name in source) {
            target[name] = updateProp.call(Utils, target[name], source[name]);
        }

        return target;
    };

    Utils.isPlainObject = function isPlainObject(source) {

        if (typeof source !== 'object' || source === null) {
            return false;
        }

        if (source.constructor && !Object.hasOwnProperty.call(source.constructor.prototype, 'isPrototypeOf')) {
            return false;
        }

        return true;
    };

    var isSubClass = function isSubClass(superClass, childClass) {
        var c1, c2, found = false;

        if (typeof superClass !== 'function' || typeof childClass !== 'function') {
            return found;
        }

        c1 = superClass.prototype;
        c2 = childClass.prototype;

        while (!(found = (c1 === c2))) {
            c2 = Object.getPrototypeOf(c2);

            if (c2 === null || (c2 === Object.prototype && c1 !== c2)) {
                break;
            }
        }

        return found;
    };

    var equalsClass = function equalsClass(target, source) {
        return target.constructor === source.constructor;
    };

    var updateProp = function updateProp(targetValue, sourceValue) {
        if (sourceValue == null) {
            if (targetValue == null) {
                targetValue = null;
            }
        } else if (typeof sourceValue === 'function') {
            if (targetValue == null || isSubClass(targetValue, sourceValue)) {
                targetValue = sourceValue;
            }
        } else if (Utils.isPlainObject(sourceValue)) {
            if (targetValue == null || Utils.isPlainObject(targetValue)) {
                targetValue = this.updateObject(targetValue, sourceValue);
            }
        } else if (Array.isArray(sourceValue)) {
            if (targetValue == null) {
                targetValue = [];
            }
            if (Array.isArray(targetValue)) {
                targetValue = targetValue.concat(sourceValue);
            }
        } else {
            if (targetValue == null || equalsClass(targetValue, sourceValue)) {
                targetValue = sourceValue;
            }
        }

        return targetValue;
    };

    /**
     * Extends a built-in prototype using the Object.create method.
     *
     * @memberof StyledElements.Utils
     * @since 0.6
     *
     * @param {Function} child The child's class constructor
     * @param {Function} parent The parent's class constructor
     * @param {Object} [members] The child's members
     *
     * @example
     *
     * var Person = function Person(name) {
     *     this.name = name;
     * };
     *
     * Person.prototype.toString = function toString() {
     *     return "This is " + this.name;
     * };
     *
     * var Student = function Student(name) {
     *     Person.call(this, name);
     * };
     *
     * inherit(Student, Person);
     *
     * var Teacher = function Teacher(name, subject) {
     *     Person.call(this, name);
     *     this.subject = subject;
     * };
     *
     * inherit(Teacher, Person, {
     *     toString: function toString() {
     *         return Person.prototype.toString.call(this) + ", the " + this.subject + "teacher";
     *     }
     * });
     *
     * var peter = new Student("Peter");
     *
     * peter instanceOf Student
     * => true
     *
     * peter instanceOf Person
     * => true
     *
     * "Who are you? " + peter
     * => "Who are you? This is Peter"
     *
     * var john = new Teacher("John");
     *
     * john instanceOf Teacher
     * => true
     *
     * john instanceOf Person
     * => true
     *
     * "Who are you? " + john
     * => "Who are you? This is John, the science teacher"
     */
    Utils.inherit = function inherit(child, parent, members) {

        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;

        Utils.merge(child.prototype, members);
    };

    // =========================================================================
    // STRING - HELPERS
    // =========================================================================

    /**
     * [TODO: highlight description]
     *
     * @memberof StyledElements.Utils
     * @since 0.6.2
     *
     * @param {String} text - [TODO: description]
     * @param {String} substring - [TODO: description]
     * @returns {String} - [TODO: description]
     */
    Utils.highlight = function highlight(text, substring) {
        return text.replace(new RegExp(substring, 'i'), function (match) {
            return '<strong class="text-highlighted">' + match + '</strong>';
        });
    };

    Utils.capitalize = function capitalize(text) {
        return text.charAt(0).toUpperCase() + text.substring(1);
    };

    var SIZE_UNITS = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
    Object.freeze(SIZE_UNITS);

    Utils.formatSize = function formatSize(size) {
        if (size == null) {
            return Utils.gettext('N/A');
        }

        for (var i = 0; i < SIZE_UNITS.length; i++) {
            if (size < 1024) {
                break;
            }
            size = size / 1024;
        }

        size = Math.round(size * 100) / 100;
        return size + ' ' + SIZE_UNITS[i];
    };

    // =========================================================================
    // Event helpers
    // =========================================================================

    var keyCodeMap = {
        8: 'Backspace',
        9: 'Tab',
        13: 'Enter',
        27: 'Escape',
        32: ' ',
        37: 'ArrowLeft',
        38: 'ArrowUp',
        39: 'ArrowRight',
        40: 'ArrowDown',
        46: 'Delete',
        65: 'a',
        66: 'b',
        67: 'c',
        68: 'd',
        69: 'e',
        70: 'f',
        71: 'g',
        72: 'h',
        73: 'i',
        74: 'j',
        75: 'k',
        76: 'l',
        77: 'm',
        78: 'n',
        79: 'o',
        80: 'p',
        81: 'q',
        82: 'r',
        83: 's',
        84: 't',
        85: 'u',
        86: 'v',
        87: 'w',
        88: 'x',
        89: 'y',
        90: 'z'
    };

    var keyFixes = {
        'Left': 'ArrowLeft',
        'Right': 'ArrowRight',
        'Up': 'ArrowUp',
        'Down': 'ArrowDown',
        'Spacebar': ' '
    };

    /**
     * Extracts modifier keys information from keyboard events.
     *
     * @memberof StyledElements.Utils
     * @since 0.7.0
     *
     * @param {KeyboardEvent} event keyboard event
     * @returns {Object} modifier keys information
     */
    Utils.extractModifiers = function extractModifiers(event) {
        return {
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey
        };
    };

    var propagate_keys = ['Escape', 'Enter'];

    /**
     * Stops the propagation of keydown events based on a common rules.
     * Currently, this listener will stop the propagation of any keydown events
     * if the user is not pressing a modifier key (without taking into account
     * the shift key) or if the if the pressed key is the Backspace.
     *
     * @memberof StyledElements.Utils
     * @since 0.7.0
     *
     * @param {KeyboardEvent} event keyboard event
     */
    Utils.stopInputKeydownPropagationListener = function stopInputKeydownPropagationListener(event) {
        var modifiers, key;

        modifiers = Utils.extractModifiers(event);
        key = Utils.normalizeKey(event);

        if ((!modifiers.altKey && !modifiers.metaKey && !modifiers.ctrlKey && propagate_keys.indexOf(key) === -1) || key === 'Backspace') {
            event.stopPropagation();
        }
    };

    /**
     * Normalizes the key code info from keyboard events
     *
     * @memberof StyledElements.Utils
     * @since 0.6.2
     *
     * @param {KeyboardEvent} event keyboard event
     * @returns {String} normalized key identifier
     */
    Utils.normalizeKey = function normalizeKey(event) {
        var key;

        key = event.key;
        if (event.altKey === false && key) {
            if (key in keyFixes) {
                key = keyFixes[key];
            }
        } else {
            key = 'Unidentified';
            if (event.keyCode in keyCodeMap) {
                key = keyCodeMap[event.keyCode];
            }
        }
        return key;
    };

    // =========================================================================
    // Node helpers
    // =========================================================================

    Utils.isElement = function isElement(value) {
        return value != null && typeof value === 'object' && 'ownerDocument' in value && value instanceof value.ownerDocument.defaultView.HTMLElement;
    };

    /**
     * Inserts `newElement` either at the end of `parentElement` or after
     * the passed `refElement`.
     *
     * @memberof StyledElements.Utils
     * @since 0.7
     *
     * @param {(StyledElements.StyledElement|Node)} parentElement
     *     An element to be the parent of the `newElement`.
     * @param {(StyledElements.StyledElement|Node|String)} newElement
     *     An element to insert into the `parentElement`.
     * @param {(StyledElements.StyledElement|Node)} [refElement]
     *     Optional. An element after which `newElement` is inserted.
     *
     * @returns {Array.<(StyledElements.StyledElement|Node)>}
     *     The new elements that were inserted.
     */
    Utils.appendChild = function appendChild(parentElement, newElement, refElement) {
        var parentNode = getNode(parentElement);
        var refNode = getLastNode(refElement);

        if (refNode != null) {
            refNode = refNode.nextSibling;
        }

        if (typeof newElement === 'string') {
            newElement = document.createTextNode(newElement);
        }

        return getNodes(newElement).map(function (childElement) {
            parentNode.insertBefore(getNode(childElement), refNode);

            if (parentElement instanceof StyledElements.StyledElement && childElement instanceof StyledElements.StyledElement) {
                childElement.parentElement = parentElement;
            }

            return childElement;
        });
    };

    /**
     * Inserts `newElement` either at the beginning of `parentElement` or
     * before the passed `refElement`.
     *
     * @memberof StyledElements.Utils
     * @since 0.7
     *
     * @param {(StyledElements.StyledElement|Node)} parentElement
     *     An element to be the parent of the `newElement`.
     * @param {(StyledElements.StyledElement|Node|String)} newElement
     *     An element to insert into the `parentElement`.
     * @param {(StyledElements.StyledElement|Node)} [refElement]
     *     Optional. An element before which `newElement` is inserted.
     *
     * @returns {Array.<(StyledElements.StyledElement|Node)>}
     *     The new elements that were inserted.
     */
    Utils.prependChild = function prependChild(parentElement, newElement, refElement) {
        var parentNode = getNode(parentElement);
        var refNode = getFirstNode(refElement);

        if (typeof newElement === 'string') {
            newElement = document.createTextNode(newElement);
        }

        return getNodes(newElement).map(function (childElement) {
            parentNode.insertBefore(getNode(childElement), refNode == null ? parentNode.firstChild : refNode);

            if (parentElement instanceof StyledElements.StyledElement && childElement instanceof StyledElements.StyledElement) {
                childElement.parentElement = parentElement;
            }

            return childElement;
        });
    };

    /**
     * Removes `childElement` from `parentElement`.
     *
     * @memberof StyledElements.Utils
     * @since 0.7
     *
     * @param {(StyledElements.StyledElement|Node)} parentElement
     *     An element that is parent of `childElement`.
     * @param {(StyledElements.StyledElement|Node)} childElement
     *     An element to remove from the `parentElement`.
     */
    Utils.removeChild = function removeChild(parentElement, childElement) {
        getNode(parentElement).removeChild(getNode(childElement));

        if (parentElement instanceof StyledElements.StyledElement && childElement instanceof StyledElements.StyledElement) {
            childElement.parentElement = null;
        }
    };

    var getNode = function getNode(value) {
        return value instanceof StyledElements.StyledElement ? value.get() : value;
    };

    var getFirstNode = function getFirstNode(value) {
        if (value instanceof StyledElements.Fragment) {
            return value.elements[0];
        } else {
            return value instanceof StyledElements.StyledElement ? value.get() : value;
        }
    };

    var getLastNode = function getLastNode(value) {
        if (value instanceof StyledElements.Fragment) {
            return value.elements[value.elements.length - 1];
        } else {
            return value instanceof StyledElements.StyledElement ? value.get() : value;
        }
    };

    var getNodes = function getNodes(value) {
        return (value instanceof StyledElements.StyledElement && value.get() == null) ? value.children : [value];
    };

    // =========================================================================
    // OBJECT HELPERS
    // =========================================================================

    /**
     * Checks if `value` is an empty object. Objects are considered empty if they have no
     * own enumerable properties. Arrays or strings are considered empty if they have a
     * `length` of `0`.
     *
     * @memberof StyledElements.Utils
     * @since 0.5
     *
     * @param {*} value Reference to check.
     * @returns {Boolean} True if `value` is empty.
     *
     * @example
     *
     * isEmpty(null);
     * => true
     *
     * isEmpty(true);
     * => true
     *
     * isEmpty(1);
     * => true
     *
     * isEmpty("hello world");
     * => false
     *
     * isEmpty([1, 2, 3]);
     * => false
     *
     * isEmpty({'a': 1});
     * => false
     */
    Utils.isEmpty = function isEmpty(value) {
        return value == null || Object.keys(value).length === 0;
    };

    /**
     * Merges own enumerable properties of source objects `sources` into the destination
     * object `object`. Source objects are applied from left to right. Source objects
     * that resolve to `undefined` or `null` are skipped. Subsequent sources overwrite
     * property assignments of previous sources.
     *
     * @memberof StyledElements.Utils
     * @since 0.5
     *
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source object(s).
     * @returns {Object} The reference to `object`.
     *
     * @example
     *
     * var defaults = {
     *   depth: 0,
     *   state: "default",
     *   events: ["click", "focus"]
     * };
     *
     * var options = {
     *   state: "primary",
     *   events: ["mouseover"]
     * };
     *
     * merge({}, defaults, options);
     * => {depth: 0, state: "primary", events: ["mouseover"]}
     *
     * defaults;
     * => {depth: 0, state: "default", events: ["click", "focus"]}
     *
     * merge(defaults, options);
     * => {depth: 0, state: "primary", events: ["mouseover"]}
     *
     * defaults;
     * => {depth: 0, state: "primary", events: ["mouseover"]}
     */
    Utils.merge = function merge(object) {

        if (object == null || typeof object !== "object") {
            throw new TypeError("object argument must be an object");
        }

        Array.prototype.slice.call(arguments, 1).forEach(function (source) {
            if (source != null) {
                Object.keys(source).forEach(function (key) {
                    object[key] = source[key];
                });
            }
        });

        return object;
    };

    /**
     * Updates existing properties using the values obtained from a list of
     * `source` objects. New values are obtained from the source objects
     * looping them from left to right. `undefined` or `null` sources are
     * skipped. Subsequent sources overwrite property assignments of previous
     * sources.
     *
     * @memberof StyledElements.Utils
     * @since 0.8
     *
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source object(s).
     * @returns {Object} The reference to `object`.
     *
     * @example
     *
     * var defaults = {
     *   depth: 0,
     *   state: "default",
     *   events: ["click", "focus"]
     * };
     *
     * var options = {
     *   state: "primary",
     *   other: "ignored value"
     * };
     *
     * update({}, defaults, options);
     * => {}
     *
     * defaults;
     * => {depth: 0, state: "default", events: ["click", "focus"]}
     *
     * update(defaults, options);
     * => {depth: 0, state: "primary", events: ["click", "focus"]}
     *
     * defaults;
     * => {depth: 0, state: "primary", events: ["click", "focus"]}
     */
    Utils.update = function update(object) {

        if (object == null || typeof object !== "object") {
            throw new TypeError("object argument must be an object");
        }

        Array.prototype.slice.call(arguments, 1).forEach(function (source) {
            if (source != null) {
                Object.keys(source).forEach(function (key) {
                    if (key in object) {
                        object[key] = source[key];
                    }
                });
            }
        });

        return object;
    };

    /**
     * Creates an array of the `object` own enumerable property values.
     *
     * @memberof StyledElements.Utils
     * @since 0.5
     *
     * @param {Object} object The object to query.
     * @returns {Array} The array of property values.
     *
     * @example
     *
     * values({one: 1, two: 2, three: 3});
     * => [1, 2, 3]
     */
    Utils.values = function values(object) {
        var values = [];

        for (var key in object) {
            values.push(object[key]);
        }

        return values;
    };

    Utils.waitTransition = function waitTransition(element) {
        return new Promise(function (fulfill) {
            var listener = function listener(event) {
                element.removeEventListener('transitionend', listener);
                fulfill();
            };

            element.addEventListener('transitionend', listener);
        });
    };

    StyledElements.Utils = Utils;

})();
