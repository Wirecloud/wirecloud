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

/*global ActiveXObject, alert, Attr, CSSPrimitiveValue, StyledElements*/

// TODO
if (window.StyledElements == null) {
    window.StyledElements = {};
}

(function () {

    "use strict";

    var Utils = {};

    /**
     * Overwrite this method for supporting translations
     */
    Utils.gettext = function gettext(text) {
        return text;
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

    Utils.callCallback = function callCallback(callback) {
        if (typeof callback === 'function') {
            try {
                callback.apply(null, Array.prototype.slice.call(arguments, 1));
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
        if (!separator instanceof RegExp) {
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

    if (!String.prototype.startsWith) {
        Utils.startsWith = function startsWith(text, searchString, position) {
            position = position || 0;
            return text.indexOf(searchString, position) === position;
        };
    } else {
        Utils.startsWith = function startsWith(text, searchString, position) {
            return text.startsWith(searchString, position);
        };
    }

    if (!String.prototype.endsWith) {
        Utils.endsWith = function endsWith(text, searchString, position) {
            position = position || text.length;
            position = position - searchString.length;
            var lastIndex = text.lastIndexOf(searchString);
            return lastIndex !== -1 && lastIndex === position;
        };
    } else {
        Utils.endsWith = function endsWith(text, searchString, position) {
            return text.endsWith(searchString, position);
        };
    }

    /**
     * Devuelve la posición relativa de un elemento respecto de otro elemento.
     *
     * @param {Element} element1 Debe ser un nodo descenciente de element2.
     * @param {Element} element2 Elemento base.
     */
    Utils.getRelativePosition = function getRelativePosition(element1, element2) {
        var coordinates = {x: element1.offsetLeft, y: element1.offsetTop};
        var contextDocument = element1.ownerDocument;

        if (element1 === element2) {
            return {x: 0, y: 0};
        }

        var parentNode = element1.offsetParent;
        while (parentNode != element2) {
            var cssStyle = contextDocument.defaultView.getComputedStyle(parentNode, null);
            var p = cssStyle.getPropertyValue('position');
            if (p != 'static') {
                coordinates.y += parentNode.offsetTop + cssStyle.getPropertyCSSValue('border-top-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
                coordinates.x += parentNode.offsetLeft + cssStyle.getPropertyCSSValue('border-left-width').getFloatValue(CSSPrimitiveValue.CSS_PX);
                coordinates.y -= parentNode.scrollTop;
                coordinates.x -= parentNode.scrollLeft;
            }
            parentNode = parentNode.offsetParent;
        }
        return coordinates;
    };

    /**
     * Devuelve la lista de acciones que se pueden realizar al propagar un evento dado.
     */
    Utils.getEventActions = function getEventActions(eventVar) {
        var i, actions, contactSlots, nslotsByLabel, slotInfo, actionLabel;

        contactSlots = eventVar.getFinalSlots();
        nslotsByLabel = {};
        actions = [];

        for (i = 0; i < contactSlots.length; i += 1) {
            slotInfo = contactSlots[i];

            if (nslotsByLabel[slotInfo.action_label] == null) {
                nslotsByLabel[slotInfo.action_label] = 1;
            } else {
                nslotsByLabel[slotInfo.action_label] += 1;
            }
        }

        for (i = 0; i < contactSlots.length; i += 1) {
            slotInfo = contactSlots[i];

            actionLabel = slotInfo.action_label;
            if (nslotsByLabel[actionLabel] > 1) {
                actionLabel += ' (' + slotInfo.iGadgetName + ')';
            }
            actions.push({value: slotInfo, label: actionLabel});
        }

        return actions;
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

    if (document.evaluate) {
        Utils.XML.getChildElementByTagNameNS = function getChildElementByTagNameNS(element, ns, tagName) {
            var xpathResult = element.ownerDocument.evaluate('s:' + tagName, element, function (namespace) { return namespace === 's' ? ns : null; }, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return xpathResult.singleNodeValue;
        };
    } else {
        Utils.XML.getChildElementByTagNameNS = function getChildElementByTagNameNS(element, ns, tagName) {
            var i, currentChild;

            for (i = 0; i < element.childNodes.length; i++) {
                currentChild = element.childNodes[i];
                if (currentChild.namespaceURI === ns && currentChild.localName === tagName) {
                    return currentChild;
                }
            }
            return null;
        };
    }

    Utils.values = function values(object) {
        var result = [];

        for (var key in object) {
            result.push(object[key]);
        }

        return result;
    };

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

    Utils.isEmptyObject = function isEmptyObject(obj) {
        var name;

        for (name in obj) {
            return false;
        }
        return true;
    };

    /**
     * Elimina un nodo DOM de su elemento padre. Esta funcion no comprueba que el
     * nodo DOM tenga un padre, por lo que en caso de no ser así el código lanzaría
     * una excepción.
     */
    Utils.removeFromParent = function removeFromParent(domNode) {
        if (domNode.parentNode != null) {
            domNode.parentNode.removeChild(domNode);
        }
    };

    /**
     * Permite obtener un objeto a partir de la mezcla de los atributos de dos
     * objetos. Para ello, se pasarán los dos objetos que se usarán de fuente,
     * siendo el primero de los objetos sobreescrito con el resultado. En caso de
     * que exista un mismo atributo en los dos objetos, el valor final será el del
     * segundo objeto, perdiendose el valor del primer objeto.
     *
     * @param {Object} obj1 objeto base.
     * @param {Object} obj2 objeto modificador. En caso de que este argumento sea
     * null, esta función no hará nada.
     *
     * @return obj1 modificado
     */
    Utils.merge = function merge(obj1, obj2) {
        if (obj2 != null) {

            for (var key in obj2) {
                obj1[key] = obj2[key];
            }
        }

        return obj1;
    };

    StyledElements.Utils = Utils;

})();
