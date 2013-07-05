/**
 * @class
 * Esta clase proporciona algunos métodos útiles para el desarrollador de
 * gadgets de Wirecloud.
 */
var EzWebExt = new Object();

/*---------------------------------------------------------------------------*/
/*                                EzWebExt.Browser                           */
/*---------------------------------------------------------------------------*/

EzWebExt.Browser = function() {

    this.browserName  = navigator.appName;
    this.fullVersion  = ''+parseFloat(navigator.appVersion);
    this.shortVersion = parseInt(navigator.appVersion,10);

    this.browserList = {};
    this.browserList[this.IE]      = {name: "Microsoft Internet Explorer", isThis: false};
    this.browserList[this.OPERA]   = {name: "Opera",                       isThis: false};
    this.browserList[this.CHROME]  = {name: "Chrome",                      isThis: false};
    this.browserList[this.SAFARI]  = {name: "Safari",                      isThis: false};
    this.browserList[this.FIREFOX] = {name: "Firefox",                     isThis: false};

    var ok = false;
    var pattern, match;

    for (var key in this.browserList) {
        pattern = ".*" + key + "[/|\\s]+((\\w+)(\\.\\w+)*).*";
        if ((match = navigator.userAgent.match(pattern)) != null) {
            this.browserName =  this.browserList[key].name;
            this.fullVersion =  match[1];
            this.shortVersion = match[2];
            this.browserList[key].isThis = true;
            ok = true;
            break;
        }
    }

    if (!ok && ((match = navigator.userAgent.match(pattern)) != null)) {
        pattern = ".*\\s+(\\w+)[/|\\s]+((\\w+)(\\.\\w+)*)";
        this.fullVersion  = match[2];
        this.shortVersion = match[3];
        if (this.browserList[match[1]]) {
            this.browserName  = this.browserList[match[1]].name;
            this.browserList[match[1]].isThis = true;
        }
        else {
            this.browserName = match[1];
        }
        ok = true;
    }
}

EzWebExt.Browser.prototype.IE      = "MSIE";
EzWebExt.Browser.prototype.OPERA   = "Opera";
EzWebExt.Browser.prototype.CHROME  = "Chrome";
EzWebExt.Browser.prototype.SAFARI  = "Safari";
EzWebExt.Browser.prototype.FIREFOX = "Firefox";

EzWebExt.Browser.prototype.getName = function() {
    return this.browserName;
}

EzWebExt.Browser.prototype.getVersion = function() {
    return this.fullVersion;
}

EzWebExt.Browser.prototype.getShortVersion = function() {
    return this.shortVersion;
}

EzWebExt.Browser.prototype.isIE = function() {
    return this.browserList[this.IE].isThis;
}

EzWebExt.Browser.prototype.isOpera = function() {
    return this.browserList[this.OPERA].isThis;
}

EzWebExt.Browser.prototype.isChrome = function() {
    return this.browserList[this.CHROME].isThis;
}

EzWebExt.Browser.prototype.isSafari = function() {
    return this.browserList[this.SAFARI].isThis;
}

EzWebExt.Browser.prototype.isFirefox = function() {
    return this.browserList[this.FIREFOX].isThis;
}

EzWebExt.Browser = new EzWebExt.Browser();

/**
 * Importa la librería Javascript indicada por la URL pasada. Se ejecuta
 * de forma síncrona, con lo aseguramos que la librería importada estará disponible
 * inmediatamente después a la ejecución del import.
 *
 * @param {String} url
 */
EzWebExt.importJS = function(url) {
    var request, options;
    options = {
        method: "get",
        asynchronous: false,
        evalJS: false,
        evalJSON: false
    };
    request = EzWebAPI.send(url, null, options);

    // Create the Script Object
    var script = document.createElement('script');
    script.setAttribute("type", 'text/javascript');
    if (EzWebExt.Browser.isIE()) {
        script.text = request.transport.responseText;
    } else {
        script.appendChild(document.createTextNode(request.transport.responseText));
    }

    // Insert the created object to the html head element
    var head = document.getElementsByTagName('head').item(0);
    head.appendChild(script);
}

/**
 * Añade una nueva hoja de estilos al principio de la lista.
 * @param {Object} url
 */
EzWebExt.prependStyle = function(url) {
    // Create the Script Object
    var style = document.createElement('link');
    style.setAttribute("rel", "stylesheet");
    style.setAttribute("type", "text/css");
    style.setAttribute("href", url);

    // Insert the created object to the html head element
    var head = document.getElementsByTagName('head').item(0);
    head.insertBefore(style, head.firstChild);

    return style;
}

/**
 * Añade una nueva hoja de estilos al final de la lista.
 * @param {Object} url
 */
EzWebExt.appendStyle = function(url) {
    // Create the Script Object
    var style = document.createElement('link');
    style.setAttribute("rel", "stylesheet");
    style.setAttribute("type", "text/css");
    style.setAttribute("href", url);

    // Insert the created object to the html head element
    var head = document.getElementsByTagName('head').item(0);
    head.appendChild(style);

    return style;
}

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

/**
 * Elimina el exceso de caracteres de espaciado (espacios, tabuladores, saltos
 * de linea, etc...)
 *
 * @param {String} text string inicial
 * @return {String} el string pasado en el argumento text, pero eliminando el
 * exceso de carácteres de espaciado.
 */
EzWebExt.stripWhiteSpaces = function(text) {
    //text = text.replace(RegExp("\\s+", "g"), " "); Remove internal spaces
    return text.replace(RegExp("^\\s+|\\s+$", "g"), "");
}

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
    return EzWebExt.stripWhiteSpaces(text.replace(RegExp("(^\\s*|\\s+)" + word + "(\\s+|\\s*$)", "g"), " "));
}

EzWebExt.appendWord = function(text, word) {
    return EzWebExt.removeWord(text, word) + (" " + word);
}

EzWebExt.prependWord = function(text, word) {
    return word + " " + EzWebExt.removeWord(text, word);
}

/* getElementsByClassName function */
if ("getElementsByClassName" in document) {
    EzWebExt.getElementsByClassName = function(rootElement, className) {
        return rootElement.getElementsByClassName(className);
    }
} else if ("XPathResult" in window) {
    EzWebExt.getElementsByClassName = function(rootElement, className) {
        var classes = className.split(/\s+/);

        var q = ".//*[contains(concat(' ', @class, ' '), ' " + classes[0] + " ')";
        for (var i = 1; i < classes.length; i++)
            q += " and contains(concat(' ', @class, ' '), ' " + classes[i] + " ')";
        q += "]";

        var result = [];
        var dom = rootElement.ownerDocument;
        var query = dom.evaluate(q, rootElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var i = 0, length = query.snapshotLength; i < length; i++)
            result.push(query.snapshotItem(i));
        return result;
    }
} else {
    EzWebExt.getElementsByClassName = function(rootElement, className) {
        var result = [];
        var nodes = rootElement.getElementsByTagName('*');

        for (var i = 0, child; child = nodes[i]; i++) {
            if (EzWebExt.hasClassName(child, className))
                result.push(child);
        }

        return result;
    }
}

/**
 * Returns a list of elements with the given tag name belonging to the given namespace.
 */
EzWebExt.getElementsByTagNameNS = function(domElem, strNsURI, lName) {}

if (document.getElementsByTagNameNS) {
    EzWebExt.getElementsByTagNameNS = function(domElem, strNsURI, lName) {
        return domElem.getElementsByTagNameNS(strNsURI, lName);
    }
} else {
    EzWebExt.getElementsByTagNameNS = function(domElem, strNsURI, lName) {
        var defaultNS, arrElems, allElems, i, elem, oldLanguage, doc;

        // ugh!! ugly hack for IE which does not understand default namespace
        if (domElem.documentElement) {
            defaultNS = domElem.documentElement.getAttribute('xmlns');
        } else {
            defaultNS = domElem.ownerDocument.documentElement.getAttribute('xmlns');
        }

        if ('selectNodes' in domElem) {
            if (domElem.ownerDocument != null) {
                doc = domElem.ownerDocument;
            } else {
                doc = domElem;
            }
            oldLanguage = doc.getProperty("SelectionLanguage");
            doc.setProperty("SelectionLanguage", 'XPath');

            arrElems = domElem.selectNodes("//*[local-name()='" + lName + "']")

            doc.setProperty("SelectionLanguage", oldLanguage);
        } else {
            arrElems = domElem.getElementsByTagName(lName);
        }

        allElems = new Array();
        for (i = 0, len = arrElems.length; i < len; i += 1) {
            elem = arrElems[i];
            if (EzWebExt.getElementsByTagNameNS.checkNamespace(elem, strNsURI, defaultNS)) {
                allElems.push(elem);
            }
        }
        return allElems;
    };

    EzWebExt.getElementsByTagNameNS.checkNamespace = function (element, namespace, defaultNS) {
        // IE uses namespaceURI and tagUrn depending on the DomDocument instance
        if (typeof namespace === 'undefined' || namespace === null) {
            namespace = '';
        }

        if ('tagUrn' in element) {
            if (namespace === defaultNS) {
                return element.tagUrn === '';
            } else {
                return element.tagUrn === namespace;
            }
        } else {
            return element.namespaceURI === namespace;
        }
    };
}

/**
 * @deprecated
 *
 * Sustituye los caracteres XML reservados, por las entidades predefinidas
 * que los representan.
 *
 * @param {String} string Texto del que se desean sustituir los caracteres
 * reservados.
 *
 * @return {String} Texto sin caracteres reservados.
 */
EzWebExt.escapeXML = function(string) {
    return string.replace(RegExp("&", "g"), "&amp;").replace(RegExp("<", "g"), "&lt;").replace(RegExp(">", "g"), "&gt;").replace(RegExp("'", "g"), "&apos;").replace(RegExp('"', "g"), "&quot;");
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

if (document.documentElement.hasAttribute != undefined && !EzWebExt.Browser.isIE()) {

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
