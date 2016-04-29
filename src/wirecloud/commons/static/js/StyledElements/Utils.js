/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global ActiveXObject, alert, Attr, StyledElements*/

// TODO
if (window.StyledElements == null) {
    window.StyledElements = {};
}

(function () {

    "use strict";

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
        return (count == 1) ? singular : plural;
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
     */
    Utils.stopPropagationListener = function stopPropagationListener(e) {
        e.stopPropagation();
    };

    /**
     * Event listener that prevents the default action for a event.
     */
    Utils.preventDefaultListener = function preventDefaultListener(e) {
        e.preventDefault();
    };

    /**
     * This method provides a shortcut for handling common error control
     * patterns when calling callbacks.
     *
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

    Utils.onFullscreenChange = function onFullscreenChange(element, callback) {
        if (element instanceof StyledElements.StyledElement) {
            element = element.wrapperElement;
        }

        element.ownerDocument.addEventListener('fullscreenchange', callback, true);
        element.ownerDocument.addEventListener('msfullscreenchange', callback, true);
        element.ownerDocument.addEventListener('mozfullscreenchange', callback, true);
        element.ownerDocument.addEventListener('webkitfullscreenchange', callback, true);
    };

    Utils.removeFullscreenChangeCallback = function onFullscreenChange(element, callback) {
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

    /*
    Based on:
      Cross-Browser Split 1.0.1
      (c) Steven Levithan <stevenlevithan.com>; MIT License
      An ECMA-compliant, uniform cross-browser split method
    */

    var fix_nonparticipanting_capturing_groups = function fix_nonparticipanting_capturing_groups() {
        for (var i = 1; i < arguments.length - 2; i++) {
            if (arguments[i] === undefined) {
                this[i] = undefined;
            }
        }
    };

    Utils.split = function split(str, separator, limit) {
        // if `separator` is not a regex, use the native `split`
        if (!(separator instanceof RegExp)) {
            return str.split(separator, limit);
        }

        var output = [],
            lastLastIndex = 0,
            flags = (separator.ignoreCase ? "i" : "") +
                    (separator.multiline  ? "m" : "") +
                    (separator.sticky     ? "y" : ""),
            separator2, match, lastIndex, lastLength;

        separator = new RegExp(separator.source, flags + "g"); // make `global` and avoid `lastIndex` issues by working with a copy
        str = str + ""; // type conversion
        if (!Utils.split._compliantExecNpcg) {
            separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
        }

        /* behavior for `limit`: if it's...
        - `undefined`: no limit.
        - `NaN` or zero: return an empty array.
        - a positive number: use `Math.floor(limit)`.
        - a negative number: no limit.
        - other: type-convert, then use the above rules. */
        if (limit === undefined || +limit < 0) {
            limit = Infinity;
        } else {
            limit = Math.floor(+limit);
            if (!limit) {
                return [];
            }
        }

        while ((match = separator.exec(str))) {
            lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser

            if (lastIndex > lastLastIndex) {
                output.push(str.slice(lastLastIndex, match.index));

                // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
                if (!Utils.split._compliantExecNpcg && match.length > 1) {
                    match[0].replace(separator2, fix_nonparticipanting_capturing_groups.bind(match));
                }

                if (match.length > 1 && match.index < str.length) {
                    Array.prototype.push.apply(output, match.slice(1));
                }

                lastLength = match[0].length;
                lastLastIndex = lastIndex;

                if (output.length >= limit) {
                    break;
                }
            }

            if (separator.lastIndex === match.index) {
                separator.lastIndex++; // avoid an infinite loop
            }
        }

        if (lastLastIndex === str.length) {
            if (lastLength || !separator.test("")) {
                output.push("");
            }
        } else {
            output.push(str.slice(lastLastIndex));
        }

        return output.length > limit ? output.slice(0, limit) : output;
    };

    /* Utils.split's Static variables */
    Utils.split._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
    Utils.split._nativeSplit = String.prototype.split;


    /**
     * Comprueba si una palabra está incluida en un string dado.
     *
     * @param {String} text Texto en el que se va a realizar la comprobación.
     * @param {String} word Palabra que se va a comprobar si está en el texto.
     * @return {Boolean}
     */
    Utils.hasWord = function hasWord(text, word) {
        return text.match(new RegExp("(^\\s*|\\s+)" + word + "(\\s+|\\s*$)", "g")) != null;
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
     * Escapa los caracteres reservados en una expresión regular con el fin de que
     * un trozo de texto se interprete literalmente, casando en la expresión regular
     * exactamente con este y no con el patrón que representaría.
     *
     * @param {String} text Texto que se quiere escapar.
     *
     * @return {String} Texto sin caracteres reservados
     */
    Utils.escapeRegExp = function escapeRegExp(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

    var tmp_div = document.createElement('div');
    Utils.escapeHTML = function escapeHTML(text) {
        tmp_div.textContent = text;
        return tmp_div.innerHTML;
    };

    /**
     * Returns the position of a given element relative to another given element.
     *
     * @param {Element} element1 Element to position
     * @param {Element} element2 Base element
     */
    Utils.getRelativePosition = function getRelativePosition(element1, element2) {

        if (element1 === element2) {
            return {x: 0, y: 0};
        }

        var element1_rect = element1.getBoundingClientRect();
        var element2_rect = element2.getBoundingClientRect();

        return {x: element1_rect.left - element2_rect.left, y: element1_rect.top - element2_rect.top};
    };

    /*---------------------------------------------------------------------------*/
    /*                         Wirecloud XML utilities                           */
    /*---------------------------------------------------------------------------*/

    Utils.XML = {};

    /* Utils.XML.isElement */

    /**
     * Comprueba si un objeto es una instancia de DOMElement.
     */
    Utils.XML.isElement = function isElement(element) {
        return element && ('nodeType' in element) && (element.nodeType === 1);
    };

    /* Utils.XML.isAttribute */

    if (window.Attr) {

        /**
         * Comprueba si un objeto es una instancia de DOMAttribute.
         */
        Utils.XML.isAttribute = function isAttribute(element) {
            return element instanceof Attr;
        };

    } else {

        Utils.XML.isAttribute = function isAttribute(element) {
            return element && ('nodeType' in element) && (element.nodeType === 2);
        };

    }


    /* Utils.XML.createElementNS */

    if (document.createElementNS != null) {

        /**
         * Crea un nuevo Elemento asociado a un namespace
         */
        Utils.XML.createElementNS = function createElementNS(document, namespace, nodename) {
            if (namespace) {
                return document.createElementNS(namespace, nodename);
            } else {
                return document.createElement(nodename);
            }
        };

    } else {

        Utils.XML.createElementNS = function createElementNS(document, namespace, nodename) {
            return document.createNode(1, nodename, namespace ? namespace : "");
        };

    }

    /* Utils.XML.getAttributeNS */

    if (document.documentElement.getAttributeNS != null) {

        Utils.XML.getAttributeNS = function getAttributeNS(element, namespace, name) {
            return element.getAttributeNS(namespace, name);
        };

    } else {

        Utils.XML.getAttributeNS = function getAttributeNS(element, namespace, name) {
            for (var i = 0; i < element.attributes.length; i++) {
                var attr = element.attributes[i];
                if (attr.baseName == name && attr.namespaceURI == namespace) {
                    return attr.nodeValue;
                }
            }
            return "";
        };

    }

    /* Utils.XML.hasAttribute */

    if (document.documentElement.hasAttribute != null) {

        Utils.XML.hasAttribute = function hasAttribute(element, name) {
            return element.hasAttribute(name);
        };

    } else {

        Utils.XML.hasAttribute = function hasAttribute(element, name) {
            return element.getAttribute(name) !== null;
        };

    }

    /* Utils.XML.hasAttributeNS */

    if (document.documentElement.hasAttributeNS != null) {

        Utils.XML.hasAttributeNS = function hasAttribute(element, namespace, name) {
            return element.hasAttributeNS(namespace, name);
        };

    } else {

        Utils.XML.hasAttributeNS = function hasAttributeNS(element, namespace, name) {
            for (var i = 0; i < element.attributes.length; i++) {
                var attr = element.attributes[i];
                if (attr.baseName == name && attr.namespaceURI == namespace) {
                    return true;
                }
            }
            return false;
        };

    }

    /* Utils.XML.setAttributeNS */

    if (document.documentElement.setAttributeNS != null) {
        Utils.XML.setAttributeNS = function setAttributeNS(element, namespace, name, value) {
            element.setAttributeNS(namespace, name, value);
        };
    } else {
        Utils.XML.setAttributeNS = function setAttributeNS(element, namespace, name, value) {
            var attr;

            if (!('createNode' in element.ownerDocument)) {
                alert('setAttributeNS is not supported in this browser');
            }
            attr = element.ownerDocument.createNode(2, name, namespace);
            attr.nodeValue = value;
            element.setAttributeNode(attr);
        };
    }

    /* Utils.XML.createDocument */

    if (document.implementation && document.implementation.createDocument) {

        /**
         * creates a new DOMDocument
         */
        Utils.XML.createDocument = function createDocument(namespaceURL, rootTagName, doctype) {
            return document.implementation.createDocument(namespaceURL, rootTagName, null);
        };

    } else if (window.ActiveXObject) {

        Utils.XML.createDocument = function (namespaceURL, rootTagName, doctype) {
            var doc = new ActiveXObject("MSXML2.DOMDocument");
            // TODO take into account doctype
            doc.appendChild(Utils.XML.createElementNS(doc, namespaceURL, rootTagName));
            return doc;
        };

    } else {

        Utils.XML.createDocument = function (namespaceURL, rootTagName, doctype) {
            alert('createDocument is not supported in this browser');
        };
    }

    /* Utils.XML.parseFromString */

    if (window.DOMParser) {

        Utils.XML.parseFromString = function parseFromString(text, type, fromAjax) {
            var result, new_header, parser = new DOMParser();

            fromAjax = fromAjax !== undefined ? fromAjax : true;

            if (fromAjax) {
                // Remove encoding from the xml header as responseText is allways utf-8
                result = text.match(new RegExp('<\\?xml(?:[^/]|/[^>])*standalone="([^"]+)"(?:[^/]|/[^>])*\\?>'));
                if (result && (result[1] === 'yes' || result[1] === 'no')) {
                    new_header = '<?xml version="1.0" standalone="' + result[1] + '" ?>';
                } else {
                    new_header = '<?xml version="1.0" ?>';
                }
                text = text.replace(/<\?xml([^\/]|\/[^>])*\?>/g, new_header);
            }

            return parser.parseFromString(text, type);
        };

    } else if (window.ActiveXObject) {

        Utils.XML.parseFromString = function parseFromString(text, type, fromAjax) {
            var xml = new ActiveXObject("Microsoft.XMLDOM");
            xml.async = false;
            xml.loadXML(text);
            return xml;
        };

    } else {

        Utils.XML.parseFromString = function parseFromString(text, type, fromAjax) {
            var req = new XMLHttpRequest();
            req.open('GET', 'data:' + (type || "application/xml") +
                     ';charset=utf-8,' + encodeURIComponent(text), false);
            if (req.overrideMimeType) {
                req.overrideMimeType(type);
            }
            req.send(null);
            return req.responseXML;
        };

    }

    /* Utils.XML.serializeXML */

    if (window.XMLSerializer) {

        Utils.XML.serializeXML = function serializeXML(node) {
            return (new XMLSerializer()).serializeToString(node);
        };

    } else {

        Utils.XML.serializeXML = function serializeXML(node) {
            if (node.xml) {
                return node.xml;
            } else {
                throw "Error serializating xml";
            }
        };

    }

    /**
     * @experimental
     */
    Utils.clone = function clone(obj1) {
        var result;

        if (obj1 == null) {
            return obj1;
        } else if (Array.isArray(obj1)) {
            result = [];
        } else {
            result = {};
        }

        for (var key in obj1) {
            result[key] = obj1[key];
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

    // ==================================================================================
    // DOCUMENT - HELPERS
    // ==================================================================================

    /**
     * Checks if *element* has the focus
     *
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

    if (!Object.hasOwnProperty('create')) {
        Object.create = function create(parentPrototype) {
            var ParentClass;

            ParentClass = function ParentClass() {};
            ParentClass.prototype = parentPrototype;

            return new ParentClass();
        };
    }

    var addMembers = function addMembers(constructor, members) {

        for (var name in members) {
            constructor.prototype[name] = members[name];
        }
    };

    var addStatics = function addStatics(constructor, statics) {

        for (var name in statics) {
            constructor[name] = statics[name];
        }
    };

    var bindMixins = function bindMixins(constructor, mixins) {
        mixins.forEach(function (mixin) {
            addMembers(constructor, mixin.prototype);
        });

        constructor.prototype.mixinClass = function mixinClass(index) {
            mixins[index].apply(this, Array.prototype.slice.call(arguments, 1));
        };
    };

    Utils.inherit = function inherit(constructor, superConstructor, members) {
        var counter = 0;

        constructor.prototype = Object.create(superConstructor.prototype);
        constructor.prototype.constructor = constructor;

        addMembers(constructor, {

            superConstructor: superConstructor,

            superClass: function superClass() {
                var currentClass = superConstructor;

                for (var i = 0; i < counter; i++) {
                    currentClass = currentClass.prototype.superConstructor;
                }

                counter++;

                try {
                    currentClass.apply(this, Array.prototype.slice.call(arguments));
                } catch (e) {
                    counter = 0;
                    throw e;
                }

                counter--;
            },

            superMember: function superMember(superClass, name) {
                var memberArgs = Array.prototype.slice.call(arguments, 2);

                return superClass.prototype[name].apply(this, memberArgs);
            }

        });

        addMembers(constructor, members);
    };

    /**
     * [defineClass description]
     *
     * @param {Object.<String, *>} features [description]
     * @returns {Function} [description]
     */
    Utils.defineClass = function defineClass(features) {

        if ('inherit' in features) {
            Utils.inherit(features.constructor, features.inherit);
        }

        if ('mixins' in features) {
            bindMixins(features.constructor, features.mixins);
        }

        if ('statics' in features) {
            addStatics(features.constructor, features.statics);
        }

        if ('members' in features) {
            addMembers(features.constructor, features.members);
        }

        return features.constructor;
    };

    // ==================================================================================
    // STRING - HELPERS
    // ==================================================================================

    /**
     * [TODO: highlight description]
     *
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

    // ==================================================================================
    // Event helpers
    // ==================================================================================

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
     * @since 0.6.2
     *
     * @param {KeyboardEvent} event keyboard event
     * @returns {String} normalized key identifier
     */
    Utils.normalizeKey = function normalizeKey(event) {
        var key;

        key = event.key;
        if (key) {
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

    // ==================================================================================
    // Node helpers
    // ==================================================================================

    /**
     * Insert the `newElement` either to the end of `parentElement` or after
     * the `refElement` given.
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
        var refNode = getNode(refElement);

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
     * Insert the `newElement` either to the beginning of `parentElement` or
     * before the `refElement` given.
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
        var refNode = getNode(refElement);

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
     * Remove the `childElement` from the `parentElement`.
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

    var getNodes = function getNodes(value) {
        return (value instanceof StyledElements.StyledElement && value.get() == null) ? value.children : [value];
    };

    // ==================================================================================
    // OBJECT HELPERS
    // ==================================================================================

    /**
     * Checks if `value` is an empty object. Objects are considered empty if they have no
     * own enumerable properties. Arrays or strings are considered empty if they have a
     * `length` of `0`.
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

        if (object == null) {
            throw new TypeError("The argument `object` must be an `Object`.");
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
     * Creates an array of the `object` own enumerable property values.
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

    StyledElements.Utils = Utils;

})();
