/**
 * @class
 * Esta clase proporciona algunos métodos útiles para el desarrollador de
 * gadgets de Wirecloud.
 */
var EzWebExt = new Object();

/**
 * Rellena los parámetros usados en un patrón. Los campos a rellenar en el
 * patrón vienen indicados mediante sentencias "%(nombre)s". Por ejemplo,
 * al finalizar la ejecución del siguiente código:
 * <code>
 *     var date = {year: 2009, month: 3, day: 27};
 *
 *     var pattern1 = "%(year)s/%(month)s/%(day)s";
 *     var result1 = EzWebExt.interpolate(pattern, date);
 *
 *     var pattern2 = "%(day)s/%(month)s/%(year)s";
 *     var result2 = EzWebExt.interpolate(pattern, date);
 * </code>
 *
 * obtendríamos "2009/3/27" en result1 y "27/3/2009" en result2
 */
EzWebExt.interpolate = function(pattern, attributes) {
    return pattern.replace(/%\(\w+\)s/g,
                           function(match) {
                               return String(attributes[match.slice(2,-2)])
                           });
}

/**
 * Event listener that stops any event propagation.
 */
EzWebExt.stopPropagationListener = function (e) {
    e.stopPropagation();
};

/*
Based on:
  Cross-Browser Split 1.0.1
  (c) Steven Levithan <stevenlevithan.com>; MIT License
  An ECMA-compliant, uniform cross-browser split method
*/

EzWebExt.split = function (str, separator, limit) {
    // if `separator` is not a regex, use the native `split`
    if (!separator instanceof RegExp) {
        return str.split(separator, limit);
    }

    var output = [],
        lastLastIndex = 0,
        flags = (separator.ignoreCase ? "i" : "") +
                (separator.multiline  ? "m" : "") +
                (separator.sticky     ? "y" : ""),
        separator = new RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
        separator2, match, lastIndex, lastLength;

    str = str + ""; // type conversion
    if (!EzWebExt.split._compliantExecNpcg) {
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

    while (match = separator.exec(str)) {
        lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser

        if (lastIndex > lastLastIndex) {
            output.push(str.slice(lastLastIndex, match.index));

            // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
            if (!EzWebExt.split._compliantExecNpcg && match.length > 1) {
                match[0].replace(separator2, function () {
                    for (var i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined) {
                            match[i] = undefined;
                        }
                    }
                });
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

/* EzWebExt.split's Static variables */
EzWebExt.split._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
EzWebExt.split._nativeSplit = String.prototype.split;


/**
 * Comprueba si una palabra está incluida en un string dado.
 *
 * @param {String} text Texto en el que se va a realizar la comprobación.
 * @param {String} word Palabra que se va a comprobar si está en el texto.
 * @return {Boolean}
 */
EzWebExt.hasWord = function(text, word) {
    return text.match(RegExp("(^\\s*|\\s+)" + word + "(\\s+|\\s*$)", "g")) != null;
}

EzWebExt.removeWord = function(text, word) {
    return text.replace(RegExp("(^\\s*|\\s+)" + word + "(\\s+|\\s*$)", "g"), " ").trim();
}

EzWebExt.appendWord = function(text, word) {
    return EzWebExt.removeWord(text, word) + (" " + word);
}

EzWebExt.prependWord = function(text, word) {
    return word + " " + EzWebExt.removeWord(text, word);
}

/**
 * Escapa los caracteres reservados en una expresión regular con el fin de que
 * un trozo de texto se interprete literalmente, casando en la expresión regular
 * exactamente con este y no con el patrón que representaría.
 *
 * @param {String} text Texto que se quiere escapar.
 *
 * @return {String} Texto sin caracteres reservados
 */
EzWebExt.escapeRegExp = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Devuelve la posición relativa de un elemento respecto de otro elemento.
 *
 * @param {Element} element1 Debe ser un nodo descenciente de element2.
 * @param {Element} element2 Elemento base.
 */
EzWebExt.getRelativePosition = function(element1, element2) {
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
}

/**
 * Devuelve la lista de acciones que se pueden realizar al propagar un evento dado.
 */
EzWebExt.getEventActions = function(eventVar) {
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
/*                          EzWebExt XML utilities                           */
/*---------------------------------------------------------------------------*/


EzWebExt.XML = {}

/* EzWebExt.XML.isElement */

/**
 * Comprueba si un objeto es una instancia de DOMElement.
 */
EzWebExt.XML.isElement = function (element) {
    return element && ('nodeType' in element) && (element.nodeType === 1);
}

/* EzWebExt.XML.isAttribute */

if (window.Attr) {

    /**
     * Comprueba si un objeto es una instancia de DOMAttribute.
     */
    EzWebExt.XML.isAttribute = function (element) {
        return element instanceof Attr;
    }

} else {

    EzWebExt.XML.isAttribute = function (element) {
        return element && ('nodeType' in element) && (element.nodeType === 2);
    }

}


/* EzWebExt.XML.createElementNS */

if (document.createElementNS != undefined) {

    /**
     * Crea un nuevo Elemento asociado a un namespace
     */
    EzWebExt.XML.createElementNS = function(document, namespace, nodename) {
        if (namespace) {
            return document.createElementNS(namespace, nodename);
        } else {
            return document.createElement(nodename);
        }
    }

} else {

    EzWebExt.XML.createElementNS = function(document, namespace, nodename) {
        return document.createNode(1, nodename, namespace ? namespace : "");
    }

}

/* EzWebExt.XML.getAttributeNS */

if (document.documentElement.getAttributeNS != undefined) {

    EzWebExt.XML.getAttributeNS = function(element, namespace, name) {
        return element.getAttributeNS(namespace, name);
    }

} else {

    EzWebExt.XML.getAttributeNS = function(element, namespace, name) {
        for (var i = 0; i < element.attributes.length; i++) {
            var attr = element.attributes[i];
            if (attr.baseName == name && attr.namespaceURI == namespace) {
                return attr.nodeValue;
            }
        }
        return "";
    }

}

/* EzWebExt.XML.hasAttribute */

if (document.documentElement.hasAttribute != undefined) {

    EzWebExt.XML.hasAttribute = function(element, name) {
        return element.hasAttribute(name);
    }

} else {

    EzWebExt.XML.hasAttribute = function(element, name) {
        return element.getAttribute(name) !== null;
    }

}

/* EzWebExt.XML.hasAttributeNS */

if (document.documentElement.hasAttributeNS != undefined) {

    EzWebExt.XML.hasAttributeNS = function(element, namespace, name) {
        return element.hasAttributeNS(namespace, name);
    }

} else {

    EzWebExt.XML.hasAttributeNS = function(element, namespace, name) {
        for (var i = 0; i < element.attributes.length; i++) {
            var attr = element.attributes[i];
            if (attr.baseName == name && attr.namespaceURI == namespace) {
                return true;
            }
        }
        return false;
    }

}

/* EzWebExt.XML.setAttributeNS */

if (document.documentElement.setAttributeNS != undefined) {
    EzWebExt.XML.setAttributeNS = function(element, namespace, name, value) {
        element.setAttributeNS(namespace, name, value);
    }
} else {
    EzWebExt.XML.setAttributeNS = function(element, namespace, name, value) {
        var attr;

        if (!'createNode' in element.ownerDocument) {
            alert('setAttributeNS is not supported in this browser');
        }
        attr = element.ownerDocument.createNode(2, name, namespace);
        attr.nodeValue = value;
        element.setAttributeNode(attr);
    }
}

/* EzWebExt.XML.createDocument */

if (document.implementation && document.implementation.createDocument) {

    /**
     * creates a new DOMDocument
     */
    EzWebExt.XML.createDocument = function (namespaceURL, rootTagName, doctype) {
        return document.implementation.createDocument(namespaceURL, rootTagName, null);
    }

} else if (window.ActiveXObject) {

    EzWebExt.XML.createDocument = function (namespaceURL, rootTagName, doctype) {
        var doc = new ActiveXObject("MSXML2.DOMDocument");
        // TODO take into account doctype
        doc.appendChild(EzWebExt.XML.createElementNS(doc, namespaceURL, rootTagName));
        return doc;
    }

} else {

    EzWebExt.XML.createDocument = function (namespaceURL, rootTagName, doctype) {
        alert('createDocument is not supported in this browser');
    }
}

/* EzWebExt.XML.parseFromString */

if (window.DOMParser) {

    EzWebExt.XML.parseFromString = function (text, type, fromAjax) {
        var result, new_header, parser = new DOMParser();

        fromAjax = fromAjax !== undefined ? fromAjax : true;

        if (fromAjax) {
            // Remove encoding from the xml header as responseText is allways utf-8
            result = text.match(new RegExp('<\?xml(?:[^\/]|\/[^>])*standalone="([^"]+)"(?:[^\/]|\/[^>])*\?>'));
            if (result && (result[1] === 'yes' || result[1] === 'no')) {
                new_header = '<?xml version="1.0" standalone="' + result[1] + '" ?>';
            } else {
                new_header = '<?xml version="1.0" ?>';
            }
            text = text.replace(/<\?xml([^\/]|\/[^>])*\?>/g, new_header);
        }

        return parser.parseFromString(text, type);
    }

} else if (window.ActiveXObject) {

    EzWebExt.XML.parseFromString = function (text, type, fromAjax) {
        var xml = new ActiveXObject("Microsoft.XMLDOM")
        xml.async = false;
        xml.loadXML(text);
        return xml;
    }

} else {

    EzWebExt.XML.parseFromString = function (text, type, fromAjax) {
        var req = new XMLHttpRequest();
        req.open('GET', 'data:' + (type || "application/xml") +
                 ';charset=utf-8,' + encodeURIComponent(text), false);
        if (req.overrideMimeType) {
            req.overrideMimeType(type);
        }
        req.send(null);
        return req.responseXML;
    }

}

/* EzWebExt.XML.serializeXML */

if (window.XMLSerializer) {

    EzWebExt.XML.serializeXML = function(node) {
        return (new XMLSerializer()).serializeToString(node);
    }

} else {

    EzWebExt.XML.serializeXML = function(node) {
        if (node.xml) {
            return node.xml;
        } else {
            throw "Error serializating xml";
        }
    }

}
/**
 * Constante para que el diálogo que muestre el método <code>alert</code>
 * sea una alerta informativa.
 * @type Number
 */
EzWebExt.ALERT_INFO = 0;

/**
 * Constante para que el diálogo que muestre el método <code>alert</code>
 * sea una  alerta de advertencia.
 * @type Number
 */
EzWebExt.ALERT_WARNING = 1;

/**
 * Constante para que el diálogo que muestre el método <code>alert</code>
 * sea una  alerta de error.
 * @type Number
 */
EzWebExt.ALERT_ERROR = 2;


/**
 * @deprecated @experimental
 */
EzWebExt.clone = function (obj1) {
    var tmp = new Array();
    for (var key in obj1)
        tmp[key] = obj1[key]

    return tmp;
}

/**
 * Elimina un nodo DOM de su elemento padre. Esta funcion no comprueba que el
 * nodo DOM tenga un padre, por lo que en caso de no ser así el código lanzaría
 * una excepción.
 */
EzWebExt.removeFromParent = function (domNode) {
    domNode.parentNode.removeChild(domNode);
}

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
EzWebExt.merge = function (obj1, obj2) {
    if (obj2 != null) {

        /* TODO esto no "funciona" ("funciona", pero mete las funciones de prototype
         * como atributos en caso de estar mezclando Arrays, etc..) cuando se usa
         * prototype.
         */
        for (var key in obj2)
            obj1[key] = obj2[key];
    }

    return obj1;
}
