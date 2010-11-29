/**
 * @class
 * Esta clase proporciona algunos métodos útiles para el desarrollador de
 * gadgets de EzWeb.
 */
var EzWebExt = new Object();

/**
 * Guarda la URL donde se encuentra alojada la librería JavaScript.
 * @type String
 */
EzWebExt.URL = "/ezweb/js/EzWebAPI_ext";

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
 * Permite obtener la URL absoluta de un recurso proporcionado por la librería.
 *
 * @param {String} path Path relativo al recurso deseado
 * @return {String} URL del recurso
 */
EzWebExt.getResourceURL = function(path) {
    // TODO check if resourcesURL end with a tailing slash ("/")
    return this.URL + path;
}

if ('addEventListener' in document) {
    EzWebExt.addEventListener = function(element, eventName, callback, capture) {
        element.addEventListener(eventName, callback, capture);
    }

    EzWebExt.removeEventListener = function(element, eventName, callback, capture) {
        element.removeEventListener(eventName, callback, capture);
    }
} else {
    EzWebExt.addEventListener = function(element, eventName, callback, capture) {
        var currentTarget = element;
        var extraAdaptations = function() {};
        switch (eventName) {
            case 'mouseover':
                extraAdaptations = function(e) {
                    e.target = e.toElement;
                    e.relatedTarget = e.fromElement;
                }
                break;
            case 'mouseout':
                extraAdaptations = function(e) {
                    e.target = e.fromElement;
                    e.relatedTarget = e.toElement;
                }
                break;

            case 'change':
                if ((element.tagName.toLowerCase() == 'input') && (element.type.toLowerCase() == 'radio' || element.type.toLowerCase() == 'checkbox'))
                    eventName = 'click';
            default:
                extraAdaptations = function(e) {
                    e.target = e.srcElement;
                }
        }

        var wrapper = function() {
            var e = window.event;
            e.stopPropagation = function() {
                this.cancelBubble = true;
            }
            e.currentTarget = currentTarget;
            extraAdaptations(e);
            callback(e);
        }

        if (!capture) {
            wrapper.callback = callback;
            element.attachEvent('on' + eventName, wrapper);
        } else {
            if (element['on' + eventName]) {
                var tmp = wrapper;
                var prevWrapper = element['on' + eventName];
                wrapper = function() {
                    prevWrapper();
                    if (!window.event.cancelBubble)
                        tmp();
                }
                wrapper.prevWrapper = prevWrapper;
                prevWrapper.nextWrapper = wrapper;
            }

            element['on' + eventName] = wrapper;
        }
    }

    EzWebExt.removeEventListener = function(element, eventName, callback, capture) {
        if (!capture) {
            element.detachEvent('on' + eventName, callback);
        } else {
            var curWrapper = element['on' + eventName];

            if (curWrapper.callback == callback) {
                element['on' + eventName] = curWrapper.nextFunc;
            } else {
                var prevWrapper;

                if (!curWrapper.nextFunc)
                    element['on' + eventName] = null;

                while (curWrapper != null && curWrapper.callback != callback) {
                    prevWrapper = curWrapper;
                    curWrapper = curWrapper.nextWrapper;
                }

                if (curWrapper != null)
                    prevWrapper.nextFunc = curWrapper.nextFunc;
            }
        }
    }
}

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

/* ---------------------------------------------------------------- */

/* Load JavaScript */
EzWebExt.importJS(EzWebExt.getResourceURL("/ComputedStyle.js"));

/* Theme style */
try {
    /* TODO */
    var contextManager = window.parent.OpManagerFactory.getInstance().activeWorkSpace.getContextManager();
    var theme = contextManager._concepts['theme'];
    EzWebExt.prependStyle("/ezweb/themes/" + encodeURIComponent(theme.getValue()) + "/gadgets/gadget.css");
} catch (e) {}

/* Load default style */
EzWebExt.prependStyle(EzWebExt.getResourceURL("/EzWebGadgets.css"));


if (EzWebExt.Browser.isIE() && EzWebExt.Browser.getShortVersion() < 8) {
    EzWebExt.prependStyle(EzWebExt.getResourceURL("/EzWebGadgets-ie7.css"));
}

/* ---------------------------------------------------------------- */

/*
 * Experimental!!!!
 * Support for using Gadgets outside EzWeb.
 */

/*
EzWebExt.onEzWebPlatform = false;
PseudoRWGadgetVariable = function(name_) {
    this.name_ = name_;
    this.value_ = "";
}

PseudoRWGadgetVariable.prototype.set = function(value_) {
    this.value_ = value_;
}

PseudoRWGadgetVariable.prototype.get = function(value_) {
    return this.value_;
}

PseudoRGadgetVariable = function(name_, handler) {
    this.name_ = name_;
    this.handler = handler;
}

PseudoRGadgetVariable.prototype.get = function() {
    return "";
}

EzWebAPI = function() {}

EzWebAPI.prototype.getId = function() {
    return 1;
}

EzWebAPI.prototype.createRWGadgetVariable = function(name) {
    return new PseudoRWGadgetVariable(name);
}

EzWebAPI.prototype.createRWGadgetVariable = function(name, handler) {
    return new PseudoRGadgetVariable(name, handler);
}
*/

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

EzWebExt.hasClassName = function(element, className) {
    return element.className.match(RegExp("(^\\s*|\\s+)" + className + "(\\s+|\\s*$)", "g")) != null;
}

/**
 * @deprecated
 * Use EzWebExt.appendClassName/EzWebExt.prependClassName
 */
EzWebExt.addClassName = function(element, className) {
    element.className = EzWebExt.appendWord(element.className, className);
}

EzWebExt.appendClassName = function(element, className) {
    element.className = EzWebExt.appendWord(element.className, className);
}

EzWebExt.prependClassName = function(element, className) {
    element.className = EzWebExt.prependWord(element.className, className);
}

EzWebExt.removeClassName = function(element, className) {
    element.className = element.className.replace(RegExp("(^\\s*|\\s+)" + className + "(\\s+|\\s*$)", "g"), " ").replace(RegExp("^\\s+|\\s+$", "g"), "");
}

EzWebExt.toggleClassName = function(element, className) {
    if (EzWebExt.hasClassName(element, className))
        EzWebExt.removeClassName(element, className);
    else
        EzWebExt.addClassName(element, className);
}

/**
 * Changes the inner content of an Element treating it as pure text. If
 * the provided text contains HTML special characters they will be encoded.
 *
 * @param {Element} element
 * @param {String} text
 */
EzWebExt.setTextContent = function(element, text) {
    if ("textContent" in element) {
        element.textContent = text;
    }
    else if ("innerText" in element) {
        element.innerText = text;
    }
    else if ("nodeValue" in element) {
        element.nodeValue = text;
    }
}

/**
 * Return the inner content of an Element treating it as pure text. All
 * encoded characters will be decoded.
 *
 * @param {Element}
 *
 * @return {String}
 */
EzWebExt.getTextContent = function(element) {
    if ("textContent" in element) {
        return element.textContent;
    }
    else if ("innerText" in element) {
        return element.innerText;
    }
    else if ("nodeValue" in element) {
        return element.nodeValue;
    }
    return "";
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
        // for IE ns is stored in tagUrn property

        // ugh!! ugly hack for IE which does not understand default namespace
        var defaultNS = domElem.ownerDocument.documentElement.getAttribute('xmlns');

        if (strNsURI == defaultNS) {
            strNsURI = "";
        }

        var arrElems = domElem.getElementsByTagName(lName);
        var allElems = new Array();
        for (var i = 0, len = arrElems.length; i < len; i++) {
            var elem = arrElems[i];
            if (elem.namespaceURI == strNsURI) {
                allElems.push(elem);
            }
        }
        return allElems;
    }
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

    var parentNode = element1.offsetParent;
    while (parentNode != element2) {
        var cssStyle = document.defaultView.getComputedStyle(parentNode, null);
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

/*---------------------------------------------------------------------------*/
/*                          EzWebExt XML utilities                           */
/*---------------------------------------------------------------------------*/


EzWebExt.XML = {}

/* EzWebExt.XML.isElement */

if (window.Element) {

    /**
     * Comprueba si un objeto es una instancia de DOMElement.
     */
    EzWebExt.XML.isElement = function (element) {
        return element instanceof Element;
    }

} else {

    EzWebExt.XML.isElement = function (element) {
        return element && ('nodeType' in element) && (element.nodeType === 1);
    }

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

/* EzWebExt.XML.getAttributeNS */

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
} else if (document.createNode) {
    EzWebExt.XML.setAttributeNS = function(element, namespace, name, value) {
        var document = element.ownerDocument;
        var attr = document.createNode(2, name, namespace);
        attr.nodeValue = value;
        element.setAttributeNode(attr);
    }
} else {
    EzWebExt.XML.setAttributeNS = function(element, namespace, name, value) {
        alert('setAttributeNS is not supported in this browser');
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
        doc.appendChild(EzWebExt.XML.createElementNS(doc, rootTagName, namespaceURL));
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
 * Permite forzar el valor que tendrá la variable <code>this</code> cuando se
 * llame a la función indicada.
 *
 * @param {Object} func Función a la que se le forzará el valor de la variable
 * <code>this</code>
 * @param {Object} _this valor que tendrá la variable <code>this</code>.
 * @return a new function that forces the value of <code>this</code> and calls
 * the given function.
 */
EzWebExt.bind = function (func, _this) {
    return function() {return func.apply(_this, arguments)}
}

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

/**
 *
 * @deprecated @experimental
 *
 * @param {Object} foregroundColor
 * @param {Object} backgroundColor
 * @param {Object} kind
 * @param {Object} transparent
 */
EzWebExt.genLoadingGIF = function(foregroundColor, backgroundColor, kind, transparent) {
    foregroundColor = foregroundColor.substr(0,2) + "/" + foregroundColor.substr(2,2) + "/" + foregroundColor.substr(4,2);
    backgroundColor = backgroundColor.substr(0,2) + "/" + backgroundColor.substr(2,2) + "/" + backgroundColor.substr(4,2);
    transparent = transparent ? "1" : "0";
    return "http://www.ajaxload.info/cache/" + foregroundColor + "/" + backgroundColor + "/" + kind + "-" + transparent + ".gif"
}

EzWebExt.CIRCLE_BALL = 1;
EzWebExt.INDICATOR = 2;
EzWebExt.KIT = 3;
EzWebExt.ARROWS = 4;
EzWebExt.INDICATOR_BIG = 5;
EzWebExt.SNAKE = 6;
EzWebExt.BOUNCING_BALL = 7;
EzWebExt.BAR = 8;
EzWebExt.BAR2 = 9;
EzWebExt.BAR3 = 10;
EzWebExt.CIRCLING_BALL = 11;
EzWebExt.HYPNOTIZE = 12;
EzWebExt.WHEEL = 13;
EzWebExt.EXPANDING_CIRCLE = 14;
EzWebExt.RADAR = 15;
EzWebExt.REFRESH = 16;
EzWebExt.FLOWER = 17;
EzWebExt.SQUARES = 18;
EzWebExt.CIRCLE_THICKBOX = 19;
EzWebExt.BIG_ROLLER = 20;
EzWebExt.WHEEL_THROBBER = 21;
EzWebExt.SMALL_WAIT = 22;
EzWebExt._3D_ROTATION = 23;
EzWebExt.INDICATOR_LITE = 24;
EzWebExt.SQUARES_CIRCLE = 25;
EzWebExt.BIG_SNAKE = 26;
EzWebExt.BIG_CIRCLE_BALL = 27;
EzWebExt.ROLLER = 28;
EzWebExt.DRIP_CIRCLE = 29;
EzWebExt.INDICATOR_BIG2 = 30;
EzWebExt.BIG_FLOWER = 31;
EzWebExt.CLOCK = 32;
EzWebExt.BAR_CIRCLE = 34;
EzWebExt.PIK = 34;
EzWebExt.PK = 35;
EzWebExt.BERT = 36;
EzWebExt.BERT2 = 37;

/*---------------------------------------------------------------------------*/
/*                                EzWebGadget                                */
/*---------------------------------------------------------------------------*/

/**
 * @class
 * Esta clase representa a un Gadget de EzWeb y facilita la implementación
 * de estos (no es necesario usar esta clase para crear un gadget).
 *
 * Dentro de esta clase se define el uso de ciertas variables de EzWeb así
 * como de ciertos métodos que actuarán de callbacks.
 *
 * En caso de que el gadget sea traducible, se usarán las variables indicadas
 * por los elementos languagePrefVarName y platformLanguageVarName.
 *
 * La configuración por defecto es la siguiente:
 *       useLockStatus: true,
 *       lockStatusVarName: "lockStatus",
 *       useHeightVar: true,
 *       heightVarName: "height",
 *       useWidthVar: false,
 *       widthVarName: "width",
 *       userVarName: "user",
 *       languagePrefVarName: "languagePref",
 *       platformLanguageVarName: "language",
 *       translatable: false,
 *       defaultLanguage: "en"
 *
 * @param {Array} settings
 */
var EzWebGadget = function(customSettings) {

    this.init = EzWebExt.bind(this.init, this);

    if (arguments.length == 0)
        return;

    this.browser = EzWebExt.Browser;
    var gadget = this;

    /* Parse settings */
    this.settings = {
        useLockStatus: true,
        lockStatusVarName: "lockStatus",
        useHeightVar: true,
        heightVarName: "height",
        useWidthVar: false,
        widthVarName: "width",
        userVarName: "user",
        languagePrefVarName: "languagePref",
        platformLanguageVarName: "language",
        translatable: false,
        defaultLanguage: "en"
    };
    for (var key in customSettings)
        this.settings[key] = customSettings[key];

    /* Common funcionality */
    this.lockVar   = EzWebAPI.createRGadgetVariable(this.settings["lockStatusVarName"],
                                                    function(value) {gadget.lockCallback(value)});
    this.heightVar = EzWebAPI.createRGadgetVariable(this.settings["heightVarName"],
                                                    function(value) {gadget.heightCallback(value)});

    if (this.settings.useWidthVar) {
        this.widthVar = EzWebAPI.createRGadgetVariable(this.settings["widthVarName"],
                                                       function(value) {gadget.widthCallback(value)});
    }
    this.userVar   = EzWebAPI.createRGadgetVariable(this.settings["userVarName"],
                                                    function() {/* Not used */});

    /* Enable translation support only if this gadget is translatable */
    this._babel = []
    this.currentLocale = 'en';
    this._currentLanguage = {
        'strings': [],
        'labels': [],
        'titles': []
    };
    this._babelLoaded = false;

    if ((this.resourcesURL == undefined) && (baseElement = document.getElementsByTagName("base"))){
        this.resourcesURL = baseElement[0].href;
    }

    if (this.settings.translatable) {
        var processLanguageChange = function(prefLang, platformLang) {
            if (this._babelLoaded === false)
                return; // Do nothing if the catalogue is not loaded yet

            /*
             * If you have not selected a language in the preferences of the gadget it
             * will be shown with the language of the platform.
             */
            var lang = prefLang;
            if (lang == "default")
                lang = platformLang;

            if (!gadget._babel[lang]) {
                lang = gadget.settings["defaultLanguage"];
            }

            if (gadget._currentLanguage != gadget._babel[lang])
                gadget.languageCallback(lang);
        }

        var loadCatalogue = function(catalogue) {
            gadget._babel = catalogue;
            gadget._babelLoaded = true;

            gadget.loadCatalogueCallback();
            if (gadget._loaded == true) {
                processLanguageChange(gadget.langPrefVar.get(), gadget.langContextVar.get());
            } else {
                gadget._translateOnInit = true;
            }
        }

        var loadCatalogueCallback = function(transport) {
            var response = JSON.parse(transport.responseText);
            loadCatalogue(response);

        }


        this.langContextVar = EzWebAPI.createRGadgetVariable(this.settings["platformLanguageVarName"],
                                                             function (newvalue) {
                                                                 processLanguageChange(gadget.langPrefVar.get(), newvalue);
                                                             });
        if (this.settings.languagePrefVarName != null) {
            this.langPrefVar = EzWebAPI.createRGadgetVariable(this.settings["languagePrefVarName"],
                                                              function (newvalue) {
                                                                  processLanguageChange(newvalue, gadget.langContextVar.get());
                                                              });
        } else {
            this.langPrefVar = function() {};
            this.langPrefVar.get = function() { return "default"; };
        }

        if (this.settings.translationCatalogue) {
            loadCatalogue(this.settings.translationCatalogue);
        } else {
            var url = this.getResourceURL("languages.json");
            this.sendGet(url, loadCatalogueCallback, "Error al recuperar el fichero de idiomas (URL: %(url)s).");
        }
    }

    var initFunc = function() {
        gadget._loaded = true;
        if (gadget._translateOnInit) {
            processLanguageChange(gadget.langPrefVar.get(), gadget.langContextVar.get());
        }
        gadget.init();
    }
    this._waitingForDOMContentLoaded(initFunc);

}

/**
 * Lanza el manejador después de que se complete la carga del DOM
 *
 * @param {function} handler
 */
EzWebGadget.prototype._waitingForDOMContentLoaded = function(handler) {
    if (this.browser.isSafari() || this.browser.isChrome()) {

        setTimeout(function() {
            if (document.readyState == "loaded" || document.readyState == "complete") {
                handler();
            } else {
                setTimeout(arguments.callee, 200);
            }
        }, 200);

    } else if (this.browser.isFirefox() ||  this.browser.isOpera()) {

        EzWebExt.addEventListener(document, "DOMContentLoaded", handler, true);

    } else if (this.browser.isIE()) {

        EzWebExt.addEventListener(document, "readystatechange", function() {
            if (document.readyState == "loaded" || document.readyState == "complete") {
                handler();
            }
        }, true);
        /*(function() {
            var doc = document.createElement('doc:rdy');
            try {
                doc.doScroll('left');
                doc = null;
                try {
                    handler();
                }
                catch(e) {}
            }
            catch(e) {
                setTimeout(arguments.callee, 200);
            }
        })();*/
    } else {
        window.onload = handler;
    }
}

EzWebGadget.prototype._registerIEEvent = function(element) {
    if (this.browser.isIE() || this.browser.isOpera())  {
        var registerIndex = (this.registerImports.push(false) - 1);

        var handler = EzWebExt.bind(function() {
            if ((element.readyState.toLowerCase() == "complete") || (element.readyState.toLowerCase() == "loaded")){
                this.registerImports[registerIndex] = true;
                for (var i=0; i<this.registerImports.length; i++) {
                    if (!this.registerImports[i])
                        return;
                }
                EzWebExt.removeEventListener(element, "readystatechange", handler, true);
                document.body.innerHTML = ""; // TODO necesario por la doble llamada inicial pero hay que solucionarlo
                this.init();
            }
        }, this);
        EzWebExt.addEventListener(element, "readystatechange", handler, true);
    }
}

/**
 * Indica que se quiere recalcular los tamaños de los elementos visuales de
 * este gadget. Este método es conveniente en caso de necesitar realizar
 * ciertos cálculos de tamaños en JavaScript (que normalmente sólo son
 * necesarios en caso de no poder usar reglas de CSS para conseguir el
 * resultado deseado). La implementación por defecto no hace nada, siendo
 * necesario sobreescribir este método con la implementación adecuada en caso
 * de necesitar hacer cálculos de tamaños mediante JavaScript.
 *
 * @see EzWebGadget/heightCallback
 */
EzWebGadget.prototype.repaint = function() {
}


/**
 * Este método es llamado cuando cambia el alto (en pixels) de la ventana
 * asociada a este gadget. La implementación por defecto llama al método
 * {repaint}. En caso de querer capturar este evento, se podrá sobreescribir
 * este método, pero habrá que tener en cuenta que entonces no se llamará al
 * método {repaint} salvo que se haga explícitamente. También se puede llamar
 * a la implementación por defecto usando la siguiente linea de código:
 *
 * <code>
 * EzWebGadget.prototype.heightCallback.call(this, newHeihght);
 * </code>
 *
 * @see EzWebGadget/repaint
 */
EzWebGadget.prototype.heightCallback = function(newHeight) {
    this.repaint();
}


/**
 * Este método es llamado cuando cambia el ancho (en pixels) de la ventana
 * asociada a este gadget. La implementación por defecto llama al método
 * {repaint}. En caso de querer capturar este evento, se podrá sobreescribir
 * este método, pero habrá que tener en cuenta que entonces no se llamará al
 * método {repaint} salvo que se haga explícitamente. También se puede llamar
 * a la implementación por defecto usando la siguiente linea de código:
 *
 * <code>
 * EzWebGadget.prototype.widthCallback.call(this, newWidth);
 * </code>
 *
 * @see EzWebGadget/repaint
 */
EzWebGadget.prototype.widthCallback = function(newWidth) {
    this.repaint();
}


/**
 * Este método es llamado cuando la plataforma bloquea o desbloquea este
 * gadget. La implementación por defecto de este gadget se encarga de modificar
 * el atributo class del elemento body acordemente al nuevo estado. En caso de
 * querer modificar este comportamiento, se podrá sobreescribir este método. En
 * caso de querer usar la implementación por defecto de este método cuando se
 * está sobreescribiendo el método, basta con usar la siguiente linea de
 * código:
 *
 * <code>
 * EzWebGadget.prototype.lockCallback.call(this, newLockStatus);
 * </code>
 *
 */
EzWebGadget.prototype.lockCallback = function(newLockStatus) {
    if (newLockStatus == true) {
        EzWebExt.appendClassName(document.body, "locked");
    } else {
        EzWebExt.removeClassName(document.body, "locked");
    }
}


/**
 * Este método es llamado justo después de traducir el gadget mediante el
 * método <code>translate</code>. La implementación de este método esta vacía
 * por defecto. En caso de querer capturar este evento, habrá que sobreescribir
 * este método.
 *
 * @see EzWebGadget/translate
 */
EzWebGadget.prototype.translateCallback = function() {
}


/**
 * Este método es llamado justo después de cargar exitosamente el catalogo
 * de traducciones. La implementación de este método esta vacía por defecto. En
 * caso de querer capturar este evento habrá que sobreescribir este método.
 */
EzWebGadget.prototype.loadCatalogueCallback = function() {
}


/**
 * Este método es llamado cuando el idioma del gadget es modificado. La
 * implementación por defecto modifica el idioma actual del gadget y fuerza la
 * traducción del gadget (ver método {translate}). En caso de ser necesario, se
 * puede sobreescribir este método, pero se recomienda que la nueva
 * implementación llame a la implementación por defecto. Para llamar a la
 * implementación por defecto, se puede usar la siguiente linea de código:
 *
 * <code>
 * EzWebGadget.prototype.languageCallback.call(this, newLang);
 * </code>
 *
 * @param {String} newLang
 */
EzWebGadget.prototype.languageCallback = function(newLang) {
    this.currentLocale = newLang;

    if (this._babel[newLang] != undefined) {
        this._currentLanguage = this._babel[newLang];
    } else {
        this._currentLanguage = {
            'strings': [],
            'labels': [],
            'titles': []
        };
    }
    if (this._currentLanguage.strings == undefined)
        this._currentLanguage.strings = []
    if (this._currentLanguage.labels == undefined)
        this._currentLanguage.labels = []
    if (this._currentLanguage.titles == undefined)
        this._currentLanguage.titles = []

    this.translate();
}


/**
 * Permite obtener la URL absoluta de un recurso dado de este gadget.
 *
 * @param {String} path Path relativo a la URL donde se encuentran los
 *                      recursos del gadget.
 * @return {String} URL del recurso
 */
EzWebGadget.prototype.getResourceURL = function(path) {
    // TODO check if resourcesURL end with a tailing slash ("/")
    return this.resourcesURL + path;
}


/**
 * Este método es llamado justo cuando se instancia el gadget. La
 * implementación por defecto no hace absolutamente nada. Normalmente
 * habrá que sobreescribir este método para crear las variables de EzWeb
 * pertinentes.
 */
EzWebGadget.prototype.preinit = function() {
}


/**
 * Este método es llamado cuando el código HTML del gadget ha sido cargado
 * completamente. La implementación por defecto no hace absolutamente nada.
 * Este método está pensado para ser sobreescribir en caso de querer ser
 * notificado de cuando se ha cargado el código HTML completamente.
 */
EzWebGadget.prototype.init = function() {
}


/**
 * Obtiene el nombre de usuario que esta haciendo uso de este gadget.
 * @return
 */
EzWebGadget.prototype.getUserName = function() {
    return this.userVar.get();
}


/**
 * Permite obtener la anchura en pixels de la ventana asignada para este
 * gadget.
 * @return {Number} Anchura del gadget
 */
EzWebGadget.prototype.getWidth = function() {
    return document.defaultView.innerWidth;
}


/**
 * Permite obtener la altura en pixels de la ventana asignada para este
 * gadget.
 * @return {Number} Altura del gadget
 */
EzWebGadget.prototype.getHeight = function() {
    return this.heightVar.get();
}


/**
 * Traduce un texto al idioma actual del gadget.
 *
 * @param {String} Texto a traducir
 * @return {String} La traducción en el idioma actual del texto indicado.
 */
EzWebGadget.prototype.gettext = function(text) {
    if (this._currentLanguage.strings[text] != undefined) {
        return this._currentLanguage.strings[text];
    } else {
        return text;
    }
}


/**
 * Obtiene la traducción del elemento indicado por un id.
 *
 * @param {String} Identificador del elemento del que se quiere obtener
 * la traducción.
 * @return {String} La traducción en el idioma actual para el elemento
 * indicado.
 */
EzWebGadget.prototype.getLabel = function(labelid) {
    if (this._currentLanguage.labels[labelid] != undefined) {
        return this._currentLanguage.labels[labelid];
    } else {
        return '%' + labelid + '%';
    }
}


/**
 * Obtiene la traducción del atributo title del elemento indicado por su id.
 *
 * @param {String} Identificador del elemento del que se quiere obtener
 * la traducción del atributo title.
 * @return {String} La traducción en el idioma actual para el atributo title
 * del elemento indicado.
 */
EzWebGadget.prototype.getTitle = function(id) {
    if (this._currentLanguage.titles[id] != undefined) {
        return this._currentLanguage.titles[id];
    } else {
        return '%' + id + '%';
    }
}


/**
 * Fuerza la traducción de todos los elementos HTML de este gadget.
 */
EzWebGadget.prototype.translate = function() {
    var id;
    for (id in this._currentLanguage.labels) {
        var element = document.getElementById(id);
        if (element)
            EzWebExt.setTextContent(element, this._currentLanguage.labels[id]);
    }

    for (id in this._currentLanguage.titles) {
        var element = document.getElementById(id);
        if (element)
            element.setAttribute('title', this._currentLanguage.titles[id]);
    }

    this.translateCallback();
}

/**
 * Devuelve la traducción para el elemento indicado.
 *
 * @param id identificador del mensaje a traducir
 */
EzWebGadget.prototype.getTranslatedLabel = function(id) {
    return this._currentLanguage[id];
}

/**
 * Realiza una petición GET a la URL indicada.
 *
 * @param {String} url URL del servidor al que se desea realizar la
 * petición GET.
 *
 * @param {Function} onSuccess Función que será llamada cuando
 * se reciba la respuesta del servidor, siempre que no se produzca
 * ningún error.
 *
 * @param {Function | String} onError Este parámetro es opcional, si se añade y
 * vale distinto de null, su valor podrá ser de tipo <code>String</code>, que
 * será el mensaje de error que se mostrará si se produce
 * algún error durante la petición al servidor. En lugar del
 * mensaje de error, este parámetro podrá apuntar a una
 * función que será llamada cuando se produzca algún
 * error durante la petición al servidor.
 */
EzWebGadget.prototype.sendGet = function(url, onSuccess, onError, onException) {
    onError = onError ? onError : "HTTP error %(errorCode)s in GET request (%(url)s)";
    if (typeof onError == "string") {
        var onErrorMsg = onError;
        onError = function(transport) {
           var msg = EzWebExt.interpolate(onErrorMsg, {errorCode: transport.status, url: url});
           this.alert("Error", msg, EzWebExt.ALERT_ERROR);
        }
    }

    onException = onException ? onException : "Exception processing GET response (%(url)s): %(errorDesc)s";
    if (typeof onException == "string") {
        var onExceptionMsg = onException;
        onException = function(transport, e) {
           var msg = EzWebExt.interpolate(onExceptionMsg, {url: url, errorDesc: e});
           this.alert("Error", msg, EzWebExt.ALERT_ERROR);
        }
    }

    var handleError = function(transport, e) {
        if (e)
            onException.call(this, transport, e);
        else
            onError.call(this, transport);
    }

    EzWebAPI.send_get(url, this, onSuccess, handleError);
}

/**
 * Realiza una petición POST a la URL indicada.
 *
 * @param {String} url URL del servidor al que se desea realizar la
 * petición POST.<br/><br/>
 *
 * @param {String} params Parámetros de la petición.<br/><br/>
 *
 * @param {Function} onSuccess Función que será llamada cuando
 * se reciba la respuesta del servidor, siempre que no se produzca
 * ningún error.<br/><br/>
 *
 * @param {Object} onError Este parámetro es opcional, si se
 * añade, su valor podrá ser de tipo <code>String</code>, que
 * será el mensaje de error que se mostrará si se produce
 * algún error durante la petición al servidor. En lugar del
 * mensaje de error, este parámetro podrá apuntar a una
 * función que será llamada cuando se produzca algún
 * error durante la petición al servidor.
 *
 */
EzWebGadget.prototype.sendPost = function(url, params, onSuccess, onError, onException) {
    onError = onError ? onError : "HTTP error %(errorCode)s in POST request (%(url)s)";
    if (typeof onError == "string") {
        var onErrorMsg = onError;
        onError = function(transport) {
           var msg = EzWebExt.interpolate(onErrorMsg, {errorCode: transport.status, url: url});
           this.alert("Error", msg, EzWebExt.ALERT_ERROR);
        }
    }

    onException = onException ? onException : "Exception processing POST response (%(url)s): %(errorDesc)s";
    if (typeof onException == "string") {
        var onExceptionMsg = onException;
        onException = function(transport, e) {
           var msg = EzWebExt.interpolate(onExceptionMsg, {url: url, errorDesc: e});
           this.alert("Error", msg, EzWebExt.ALERT_ERROR);
        }
    }

    var handleError = function(transport, e) {
        if (e)
            onException.call(this, transport, e);
        else
            onError.call(this, transport);
    }

    EzWebAPI.send_post(url, params, this, onSuccess, handleError);
}

/**
 * Realiza una petición PUT a la URL indicada.
 *
 * @param {String} url URL del servidor al que se desea realizar la
 * petición PUT.<br/><br/>
 *
 * @param {String} params Parámetros de la petición.<br/><br/>
 *
 * @param {Function} onSuccess Función que será llamada cuando
 * se reciba la respuesta del servidor, siempre que no se produzca
 * ningún error.<br/><br/>
 *
 * @param {Object} onError Este parámetro es opcional, si se
 * añade, su valor podrá ser de tipo <code>String</code>, que
 * será el mensaje de error que se mostrará si se produce
 * algún error durante la petición al servidor. En lugar del
 * mensaje de error, este parámetro podrá apuntar a una
 * función que será llamada cuando se produzca algún
 * error durante la petición al servidor.
 *
 */
EzWebGadget.prototype.sendPut = function(url, params, onSuccess, onError, onException) {
    onError = onError ? onError : "HTTP error %(errorCode)s in PUT request (%(url)s)";
    if (typeof onError == "string") {
        var onErrorMsg = onError;
        onError = function(transport) {
           var msg = EzWebExt.interpolate(onErrorMsg, {errorCode: transport.status, url: url});
           this.alert("Error", msg, EzWebExt.ALERT_ERROR);
        }
    }

    onException = onException ? onException : "Exception processing PUT response (%(url)s): %(errorDesc)s";
    if (typeof onException == "string") {
        var onExceptionMsg = onException;
        onException = function(transport, e) {
           var msg = EzWebExt.interpolate(onExceptionMsg, {url: url, errorDesc: e});
           this.alert("Error", msg, EzWebExt.ALERT_ERROR);
        }
    }

    var handleError = function(transport, e) {
        if (e)
            onException.call(this, transport, e);
        else
            onError.call(this, transport);
    }

    EzWebAPI.send_put(url, params, this, onSuccess, handleError);
}

/**
 * Realiza una petición DELETE a la URL indicada.
 *
 * @param {String} url	URL del servidor al que se desea realizar la
 * petición DELETE.<br/><br/>
 *
 * @param {Function} onSuccess Función que será llamada cuando
 * se reciba la respuesta del servidor, siempre que no se produzca
 * ningún error.<br/><br/>
 *
 * @param {Object} onError Este parámetro es opcional, si se
 * añade, su valor podrá ser de tipo <code>String</code>, que
 * será el mensaje de error que se mostrará si se produce
 * algún error durante la petición al servidor. En lugar del
 * mensaje de error, este parámetro podrá apuntar a una
 * función que será llamada cuando se produzca algún
 * error durante la petición al servidor.
 */
EzWebGadget.prototype.sendDelete = function(url, onSuccess, onError, onException) {
    onError = onError ? onError : "HTTP error %(errorCode)s in DELETE request (%(url)s)";
    if (typeof onError == "string") {
        var onErrorMsg = onError;
        onError = function(transport) {
           var msg = EzWebExt.interpolate(onErrorMsg, {errorCode: transport.status, url: url});
           this.alert("Error", msg, EzWebExt.ALERT_ERROR);
        }
    }

    onException = onException ? onException : "Exception processing DELETE response (%(url)s): %(errorDesc)s";
    if (typeof onException == "string") {
        var onExceptionMsg = onException;
        onException = function(transport, e) {
           var msg = EzWebExt.interpolate(onExceptionMsg, {url: url, errorDesc: e});
           this.alert("Error", msg, EzWebExt.ALERT_ERROR);
        }
    }

    var handleError = function(transport, e) {
        if (e)
            onException.call(this, transport, e);
        else
            onError.call(this, transport);
    }

    EzWebAPI.send_delete(url, this, onSuccess, handleError);
}



EzWebGadget.prototype.alert = function(title, content, type) {
    var alert = new StyledElements.StyledAlert(title, content, {type: type});
    alert.insertInto(document.body);
}


/**
 *
    Problemas con this.

    var obj = function() {
    }
    obj.prototype.func() {
      this.func2();
    }
    obj.prototype.func2() {
      ...
    }

    instancia = new obj();
    instancia.func();          // javascript asigna "instancia" como valor de this antes de llamar a la funcion
    instancia.func.call(null); // javascript asigna null como valor de this antes de llamar a la funcion
    func3 = function(func) {
      func()                   // javascript no sobreescribe el valor de this (por lo tanto this puede valer cualquier cosa)
    }

    func3(instancia.func)

    func = func.bind(null);    // devuelve una funcion que asigna null a this y luego llama a la funcion inicial
                               // por lo tanto da igual el valor que tenga this a la hora de llamar a la funcion, ya que la
                               // nueva funcion se encarga ella misma de sobreescribirlo y asegurarse de que valga lo que se quiere
*/

/*---------------------------------------------------------------------------*
 *                               StyledElements                              *
 *---------------------------------------------------------------------------*/

// Static class
var StyledElements = new Object();

/**
 * Esta clase se encarga de gestionar los eventos que van a manejar los
 * <code>StyledElement</code>s.
 */
StyledElements.Event = function() {
    this.handlers = [];
}

StyledElements.Event.prototype.addEventListener = function(handler) {
    this.handlers.push(handler);
}

StyledElements.Event.prototype.removeEventListener = function(handler) {
    var index = this.handlers.indexOf(handler);
    if (index != -1)
        this.handlers.splice(index, 1);
}

StyledElements.Event.prototype.dispatch = function() {
    for (var i = 0; i < this.handlers.length; i++)
        this.handlers[i].apply(null, arguments);
}


/**
 * @abstract
 */
StyledElements.ObjectWithEvents = function(events) {
    events = events ? events : [];

    this.events = {};
    for (var i = 0; i < events.length; i++) {
        this.events[events[i]] = new StyledElements.Event();
    }
}

/**
 * Añade un listener para un evento indicado.
 */
StyledElements.ObjectWithEvents.prototype.addEventListener = function(event, handler) {
    if (this.events[event] === undefined)
        throw new Error(EzWebExt.interpolate("Unhandled event \"%(event)s\"", {event: event}));

    this.events[event].addEventListener(handler);
}

/**
 * Elimina un listener para un evento indicado.
 */
StyledElements.ObjectWithEvents.prototype.removeEventListener = function(event, handler) {
    if (this.events[event] === undefined)
        throw new Error(EzWebExt.interpolate("Unhandled event \"%(event)s\"", {event: event}));

    this.events[event].removeEventListener(handler);
}


/**
 * @abstract
 */
StyledElements.StyledElement = function(events) {
    StyledElements.ObjectWithEvents.call(this, events);
    this.wrapperElement = null;
    this.enabled = true;
}
StyledElements.StyledElement.prototype = new StyledElements.ObjectWithEvents();

/**
 * Inserta el elemento con estilo dentro del elemento indicado.
 *
 * @param element Este será el elemento donde se insertará el elemento con
 * estilo.
 * @param refElement Este parámetro es opcional. En caso de ser usado, sirve
 * para indicar delante de que elemento se tiene que añadir este elemento con
 * estilo.
 */
StyledElements.StyledElement.prototype.insertInto = function (element, refElement) {
    if (element instanceof StyledElements.StyledElement) {
        element = element.wrapperElement;
    }

    if (refElement instanceof StyledElements.StyledElement) {
        refElement = refElement.wrapperElement;
    }

    if (refElement)
        element.insertBefore(this.wrapperElement, refElement);
    else
        element.appendChild(this.wrapperElement);
}

/**
 * @private
 */
StyledElements.StyledElement.prototype._getUsableHeight = function() {
    var parentElement = this.wrapperElement.parentNode;
    if (!parentElement)
        return null;

    var parentStyle = document.defaultView.getComputedStyle(parentElement, null);
    var containerStyle = document.defaultView.getComputedStyle(this.wrapperElement, null);

    var height = parentElement.offsetHeight -
                 parentStyle.getPropertyCSSValue('padding-top').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 parentStyle.getPropertyCSSValue('padding-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('padding-top').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('padding-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('border-top-width').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('border-bottom-width').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('margin-top').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                 containerStyle.getPropertyCSSValue('margin-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);

    return height;
}

/**
 * @private
 */
StyledElements.StyledElement.prototype._getUsableWidth = function() {
    var parentElement = this.wrapperElement.parentNode;
    if (!parentElement)
        return null;

    var parentStyle = document.defaultView.getComputedStyle(parentElement, null);
    var containerStyle = document.defaultView.getComputedStyle(this.wrapperElement, null);

    var width = parentElement.offsetWidth -
                parentStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                parentStyle.getPropertyCSSValue('padding-right').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                containerStyle.getPropertyCSSValue('padding-left').getFloatValue(CSSPrimitiveValue.CSS_PX) -
                containerStyle.getPropertyCSSValue('padding-right').getFloatValue(CSSPrimitiveValue.CSS_PX);

    return width;
}

/**
 * Esta función sirve para repintar el componente.
 *
 * @param {Boolean} temporal Indica si se quiere repintar el componente de
 * forma temporal o de forma permanente. Por ejemplo, cuando mientras se está
 * moviendo el tirador de un HPaned se llama a esta función con el parámetro
 * temporal a <code>true</code>, permitiendo que los componentes intenten hacer
 * un repintado más rápido (mejorando la experiencia del usuario); y cuando el
 * usuario suelta el botón del ratón se ejecuta una última vez esta función con
 * el parámetro temporal a <code>false</code>, indicando que el usuario ha
 * terminado de mover el tirador y que se puede llevar a cabo un repintado más
 * inteligente. Valor por defecto: <code>false</code>.
 */
StyledElements.StyledElement.prototype.repaint = function (temporal) {
}

/**
 *
 */
StyledElements.StyledElement.prototype.hasClassName = function(className) {
    return EzWebExt.hasClassName(this.wrapperElement, className);
}

/**
 *
 */
StyledElements.StyledElement.prototype.addClassName = function(className) {
    EzWebExt.addClassName(this.wrapperElement, className);
}

/**
 *
 */
StyledElements.StyledElement.prototype.removeClassName = function(className) {
    EzWebExt.removeClassName(this.wrapperElement, className);
}

/**
 * Rehabilita el componente quitándole la clase css .disabled
 */
StyledElements.StyledElement.prototype.enable = function() {
    this.enabled = true;
    this.removeClassName('disabled');
}

/**
 * Deshabilita el componente añadiendo la clase css .disabled
 */
StyledElements.StyledElement.prototype.disable = function() {
    this.enabled = false;
    this.addClassName('disabled');
}

/**
 * @abstract
 *
 * Esta clase contiene la lógica base de todos los elementos StyledElements que
 * corresponden con un elemento de entrada de datos valido tanto para usarlos
 * junto con formularios como sin ellos.
 */
StyledElements.StyledInputElement = function(defaultValue, events) {
    this.inputElement = null;
    this.defaultValue = defaultValue;

    StyledElements.StyledElement.call(this, events);
}
StyledElements.StyledInputElement.prototype = new StyledElements.StyledElement();

StyledElements.StyledInputElement.prototype.getValue = function () {
    return this.inputElement.value;
}

StyledElements.StyledInputElement.prototype.setValue = function (newValue) {
    this.inputElement.value = newValue;
}

StyledElements.StyledInputElement.prototype.reset = function () {
    this.setValue(this.defaultValue);
}

StyledElements.StyledInputElement.prototype.enable = function() {
    StyledElements.StyledElement.prototype.enable.call(this);
    this.inputElement.disabled = false;
}

StyledElements.StyledInputElement.prototype.disable = function() {
    StyledElements.StyledElement.prototype.disable.call(this);
    this.inputElement.disabled = true;
}

/**
 * Este componente permite crear un contenedor en el que añadir otros
 * componentes.
 *
 * @param options
 * @param events
 */
StyledElements.Container = function(options, events) {
    var defaultOptions = {
        'extending': false,
        'class': '',
        'useFullHeight': false
    };
    options = EzWebExt.merge(defaultOptions, options);

    // Necesario para permitir herencia
    if (options.extending)
        return;

    StyledElements.StyledElement.call(this, events);

    this.useFullHeight = options.useFullHeight;
    this.wrapperElement = document.createElement("div");
    this.childs = new Array();

    if (options['id'])
        this.wrapperElement.setAttribute("id", options['id']);

    this.wrapperElement.className = EzWebExt.prependWord(options['class'], "container");
}
StyledElements.Container.prototype = new StyledElements.StyledElement();

StyledElements.Container.prototype.appendChild = function(element) {
    if (element instanceof StyledElements.StyledElement) {
        element.insertInto(this);
        this.childs.push(element);
    } else {
        this.wrapperElement.appendChild(element);
    }
}

StyledElements.Container.prototype.removeChild = function(element) {
    var index;
    if (element instanceof StyledElements.StyledElement) {
        index = this.childs.indexOf(element);
        this.childs.splice(index, 1);
        this.wrapperElement.removeChild(element.wrapperElement);
    } else {
        this.wrapperElement.removeChild(element);
    }
}

StyledElements.Container.prototype.repaint = function(temporal) {
    temporal = temporal !== undefined ? temporal : false;

    if (this.useFullHeight) {
        var height = this._getUsableHeight();
        if (height == null)
            return; // nothing to do

        this.wrapperElement.style.height = (height + "px");
    }

    for (var i = 0; i < this.childs.length; i++)
        this.childs[i].repaint(temporal);

    if (this.disabledLayer != null) {
        this.disabledLayer.style.height = this.wrapperElement.scrollHeight + 'px';
    }
}

/**
 * Elimina el contenido de este contenedor.
 */
StyledElements.Container.prototype.clear = function() {
    this.childs = new Array();
    this.wrapperElement.innerHTML = "";
    if (this.disabledLayer != null)
        this.wrapperElement.appendChild(this.disabledLayer);
}

/**
 * Devuelve <code>true</code> si este Componente está deshabilitado.
 */
StyledElements.Container.prototype.isDisabled = function() {
    return this.disabledLayer != null;
}

/**
 * Deshabilita/habilita este contenedor. Cuando un contenedor
 */
StyledElements.Container.prototype.setDisabled = function(disabled) {
    if (this.isDisabled() == disabled) {
      // Nothing to do
      return;
    }

    if (disabled) {
        this.disabledLayer = document.createElement('div');
        EzWebExt.addClassName(this.disabledLayer, 'disable-layer');
        this.wrapperElement.appendChild(this.disabledLayer);
        this.disabledLayer.style.height = this.wrapperElement.scrollHeight + 'px';
    } else {
        EzWebExt.removeFromParent(this.disabledLayer);
        this.disabledLayer = null;
    }
    this.enabled = !disabled;
}

StyledElements.Container.prototype.enable = function() {
    this.setDisabled(false);
}

StyledElements.Container.prototype.disable = function() {
    this.setDisabled(true);
}

/**
 * Permite distribuir contenidos según un border layout.
 */
StyledElements.BorderLayout = function(options) {
    StyledElements.StyledElement.call(this, []);

    options = EzWebExt.merge({
        'class': ''
    }, options);

    this.wrapperElement = document.createElement('div');
    this.wrapperElement.className = EzWebExt.appendWord(options['class'], "border_layout");

    this.north = new StyledElements.Container({'class': 'north_container'});
    this.west = new StyledElements.Container({'class': 'west_container'});
    this.center = new StyledElements.Container({'class': 'center_container'});
    this.east = new StyledElements.Container({'class': 'east_container'});
    this.south = new StyledElements.Container({'class': 'south_container'});

    this.north.insertInto(this.wrapperElement);
    this.west.insertInto(this.wrapperElement);
    this.center.insertInto(this.wrapperElement);
    this.east.insertInto(this.wrapperElement);
    this.south.insertInto(this.wrapperElement);
}
StyledElements.BorderLayout.prototype = new StyledElements.StyledElement();


StyledElements.BorderLayout.prototype.repaint = function(temporal) {
    var usableArea = {
        'width' : this.wrapperElement.offsetWidth,
        'height': this.wrapperElement.offsetHeight
    };

    var h1 = this.north.wrapperElement.offsetHeight;
    var h2 = usableArea.height - this.south.wrapperElement.offsetHeight;
    var centerHeight = h2 - h1;
    if (centerHeight < 0) {
        centerHeight = 0;
    }

    var v1 = this.west.wrapperElement.offsetWidth;
    var v2 = usableArea.width - this.east.wrapperElement.offsetWidth;
    var centerWidth = v2 - v1;
    if (centerWidth < 0) {
        centerWidth = 0;
    }

    this.west.wrapperElement.style.top = h1 + 'px';
    this.west.wrapperElement.style.height = centerHeight + 'px';
    this.center.wrapperElement.style.top = h1 + 'px';
    this.center.wrapperElement.style.height = centerHeight + 'px';
    this.center.wrapperElement.style.width = centerWidth + 'px';
    this.center.wrapperElement.style.left = v1 + 'px';
    this.east.wrapperElement.style.top = h1 + 'px';
    this.east.wrapperElement.style.height = centerHeight + 'px';
    this.east.wrapperElement.style.left = v2 + 'px';

    this.south.wrapperElement.style.top = h2 + 'px';

    this.north.repaint(temporal);
    this.west.repaint(temporal);
    this.center.repaint(temporal);
    this.east.repaint(temporal);
    this.south.repaint(temporal);
}


StyledElements.BorderLayout.prototype.getNorthContainer = function() {
    return this.north;
}


StyledElements.BorderLayout.prototype.getWestContainer = function() {
    return this.west;
}


StyledElements.BorderLayout.prototype.getCenterContainer = function() {
    return this.center;
}


StyledElements.BorderLayout.prototype.getEastContainer = function() {
    return this.east;
}


StyledElements.BorderLayout.prototype.getSouthContainer = function() {
    return this.south;
}


/**
 *
 */
StyledElements.StyledSelect = function(options) {
    options = EzWebExt.merge({
        'class': '',
        'initialEntries': [],
        'initialValue': null
    },
    options);

    StyledElements.StyledInputElement.call(this, options['initialValue'], ['change']);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = EzWebExt.prependWord(options['class'], "styled_select");

    var div =  document.createElement("div");
    div.className = "arrow";
    this.inputElement = document.createElement("select");

    if (options['name'])
        this.inputElement.setAttribute("name", options['name']);

    if (options['id'])
        this.wrapperElement.setAttribute("id", options['id']);

    this.textDiv = document.createElement("div");
    this.textDiv.className = "text";

    this.optionsByValue = {};
    this.addEntries(options['initialEntries']);

    EzWebExt.addEventListener(this.inputElement, "change",
                                EzWebExt.bind(function(event) {
                                    if (this.enabled) {
                                        var optionList = event.target;
                                        EzWebExt.setTextContent(this.textDiv, optionList[optionList.selectedIndex].text);
                                        this.events['change'].dispatch(this);
                                    }
                                }, this),
                                true);

    this.wrapperElement.appendChild(this.textDiv);
    this.wrapperElement.appendChild(div);
    this.wrapperElement.appendChild(this.inputElement);

    // initialize the textDiv with the initial selection
    var selectedIndex = this.inputElement.options.selectedIndex;
    if (selectedIndex !== -1)
        EzWebExt.setTextContent(this.textDiv, this.inputElement.options[selectedIndex].text);
}
StyledElements.StyledSelect.prototype = new StyledElements.StyledInputElement();

StyledElements.StyledSelect.prototype.getLabel = function () {
    return EzWebExt.getTextContent(this.textDiv);
}

StyledElements.StyledSelect.prototype.setValue = function (newValue) {
    if (newValue == null) {
        if (this.defaultValue != null) {
            newValue = this.defaultValue;
        } else {
            newValue = this.inputElement.options[1].value;
        }
    }

    // TODO exception if the newValue is not listened in the option list?
    StyledElements.StyledInputElement.prototype.setValue.call(this, newValue);
    EzWebExt.setTextContent(this.textDiv, this.optionsByValue[newValue]);
}

/**
 * @param {null|Array} newEntries Entries to add. This method does nothing if 
 * newEntries is null.
 */
StyledElements.StyledSelect.prototype.addEntries = function (newEntries) {
    var oldSelectedIndex = this.inputElement.options.selectedIndex;

    if (newEntries == null || newEntries.length == 0)
        return;

    for (var i = 0; i < newEntries.length; i++) {
        var option = document.createElement("option");
        if (newEntries[i] instanceof Array) {
            optionValue = newEntries[i][0];
            optionLabel = newEntries[i][1];
        } else {
            optionValue = newEntries[i].value;
            optionLabel = newEntries[i].label;
        }
        optionLabel = optionLabel ? optionLabel : optionValue;

        option.setAttribute("value", optionValue);
        option.appendChild(document.createTextNode(optionLabel));

        if (this.defaultValue == optionValue) {
            option.setAttribute("selected", "selected");
        }

        this.inputElement.appendChild(option);
        this.optionsByValue[optionValue] = optionLabel;
    }

    // initialize the textDiv with the initial selection
    var selectedIndex = this.inputElement.options.selectedIndex;
    if (oldSelectedIndex !== selectedIndex)
        EzWebExt.setTextContent(this.textDiv, this.inputElement.options[selectedIndex].text);
}

StyledElements.StyledSelect.prototype.clear = function () {
    // Clear textDiv
    EzWebExt.setTextContent(this.textDiv, "");

    // Clear select element options
    EzWebExt.setTextContent(this.inputElement, "");

    this.optionsByValue = {};
}

/**
 * Este
 */
StyledElements.StyledList = function(options) {
    options = EzWebExt.merge({
        'class':            '',
        'multivalued':      false,
        'initialEntries':   [],
        'initialSelection': []
    }, options);

    StyledElements.StyledElement.call(this, ['change']);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = EzWebExt.prependWord(options['class'], "styled_list");

    this.content = document.createElement("div");
    this.wrapperElement.appendChild(this.content);

    this.entries = [];
    this.entriesByValue = {};
    this.currentSelection = [];

    this.addEntries(options.initialEntries);
    this.select(options.initialSelection);

    /* Process options */
    if (options.full)
        EzWebExt.appendClassName(this.wrapperElement, "full");

    this.multivalued = options.multivalued;

    if (options.allowEmpty === undefined)
        this.allowEmpty = this.multivalued;
    else
        this.allowEmpty = options.allowEmpty;
}
StyledElements.StyledList.prototype = new StyledElements.StyledElement();

/**
 * Añade las entradas indicadas en la lista.
 */
StyledElements.StyledList.prototype.addEntries = function(entries) {
    var entryValue, entryText;

    if (entries == null || entries.length == 0)
        return;

    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry instanceof Array) {
            entryValue = entry[0];
            entryText = entry[1];
        } else {
            entryValue = entries[i].value;
            entryText = entries[i].label;
        }
        entryText = entryText ? entryText : entryValue;

        var row = document.createElement("div");
        row.className = "row";

        var context = {listComponent: this, value: entryValue};
        EzWebExt.addEventListener(row, "click",
                             EzWebExt.bind(function() {
                                 if (this.listComponent.enabled)
                                    this.listComponent.toggleElementSelection(this.value);
                             }, context),
                             true);
        entry.element = row;

        row.appendChild(document.createTextNode(entryText));
        this.content.appendChild(row);

        this.entriesByValue[entryValue] = entry;
    }
    this.entries = this.entries.concat(entries);
}

StyledElements.StyledList.prototype.removeEntryByValue = function(value) {
    var i, entry, index;

    entry = this.entriesByValue[value];
    delete this.entriesByValue[value];
    this.entries.slice(this.entries.indexOf(entry), 1);
    EzWebExt.removeFromParent(entry.element);

    if (index !== -1) {
        this.currentSelection.splice(index, 1);
        this.events['change'].dispatch(this, this.currentSelection, [], [value]);
    }
}

/**
 * Devuelve una copia de la selección actual.
 */
StyledElements.StyledList.prototype.getSelection = function() {
    return EzWebExt.clone(this.currentSelection);
}

/**
 * @private
 */
StyledElements.StyledList.prototype._cleanSelection = function() {
    for (var i = 0; i < this.currentSelection.length; i++) {
        var value = this.currentSelection[i];
        EzWebExt.removeClassName(this.entriesByValue[value].element, "selected");
    }
    this.currentSelection = [];
}

/**
 * Borra la seleccion actual.
 */
StyledElements.StyledList.prototype.cleanSelection = function() {
    if (this.currentSelection.length === 0)
        return;  // Nothing to do

    var oldSelection = this.currentSelection;

    this._cleanSelection();

    this.events['change'].dispatch(this, [], [], oldSelection);
}

/**
 * Cambia la selección actual a la indicada.
 *
 * @param {Array} selection lista de valores a seleccionar.
 */
StyledElements.StyledList.prototype.select = function(selection) {
    this._cleanSelection();

    this.addSelection(selection);
}

/**
 * Añade un conjunto de valores a la selección actual.
 */
StyledElements.StyledList.prototype.addSelection = function(selection) {
    var i, entry, addedValues = [], removedValues = [];

    if (selection.length === 0)
        return;  // Nothing to do

    if (!this.multivalued) {
        if (selection[0] === this.currentSelection[0])
            return; // Nothing to do

        removedValues = this.currentSelection;

        this._cleanSelection();

        if (selection.length > 1)
            selection = selection.splice(0, 1);
    }

    for (i = 0; i < selection.length; i++) {
        entry = selection[i];
        if (this.currentSelection.indexOf(entry) === -1) {
            EzWebExt.appendClassName(this.entriesByValue[entry].element, "selected");
            this.currentSelection.push(entry);
            addedValues.push(entry);
        }
    }

    this.events['change'].dispatch(this, this.currentSelection, addedValues, removedValues);
}

/**
 * Elimina un conjunto de valores de la selección actual.
 */
StyledElements.StyledList.prototype.removeSelection = function(selection) {
    var i, entry, index, removedValues = [];

    if (selection.length === 0)
        return;  // Nothing to do

    for (i = 0; i < selection.length; i++) {
        entry = selection[i];
        EzWebExt.removeClassName(this.entriesByValue[entry].element, "selected");
        index = this.currentSelection.indexOf(entry);
        if (index !== -1) {
            this.currentSelection.splice(index, 1);
            EzWebExt.removeClassName(this.entriesByValue[entry].element, "selected");
            removedValues.push(entry);
        }
    }

    if (removedValues.length > 0) {
        this.events['change'].dispatch(this, this.currentSelection, [], removedValues);
    }
}

/**
 * Añade o borra una entrada de la selección dependiendo de si el elemento está
 * ya selecionado o no. En caso de que la entrada estuviese selecionado, el
 * elemento se eliminiaria de la selección y viceversa.
 */
StyledElements.StyledList.prototype.toggleElementSelection = function(element) {
    if (!EzWebExt.hasClassName(this.entriesByValue[element].element, "selected")) {
        this.addSelection([element]);
    } else if (this.allowEmpty) {
        this.removeSelection([element]);
    }
}

/**
 * Añade un campo de texto.
 */
StyledElements.StyledTextField = function(options) {
    var defaultOptions = {
        'initialValue': '',
        'class': ''
    };
    options = EzWebExt.merge(defaultOptions, options);

    StyledElements.StyledInputElement.call(this, options.initialValue, ['change']);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = "styled_text_field";

    this.inputElement = document.createElement("input");
    this.inputElement.setAttribute("type", "text");

    if (options['name'])
        this.inputElement.setAttribute("name", options['name']);

    if (options['id'] != undefined)
        this.wrapperElement.setAttribute("id", options['id']);

    this.inputElement.setAttribute("value", options['initialValue']);

    var div = document.createElement("div");
    div.appendChild(this.inputElement);
    this.wrapperElement.appendChild(div);
}
StyledElements.StyledTextField.prototype = new StyledElements.StyledInputElement();

/**
 * Añade un campo de texto.
 */
StyledElements.StyledTextArea = function(options) {
    var defaultOptions = {
        'initialValue': '',
        'class': ''
    };
    options = EzWebExt.merge(defaultOptions, options);

    StyledElements.StyledInputElement.call(this, options.initialValue, ['change']);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = "styled_text_area";

    this.inputElement = document.createElement("textarea");

    if (options['name'])
        this.inputElement.setAttribute("name", options['name']);

    if (options['id'] != undefined)
        this.wrapperElement.setAttribute("id", options['id']);

    this.setValue(options['initialValue']);

    var div = document.createElement("div");
    div.appendChild(this.inputElement);
    this.wrapperElement.appendChild(div);
}
StyledElements.StyledTextArea.prototype = new StyledElements.StyledInputElement();

/**
 *
 */
StyledElements.StyledPasswordField = function(options) {
    var defaultOptions = {
        'initialValue': '',
        'class': ''
    };
    options = EzWebExt.merge(defaultOptions, options);

    StyledElements.StyledInputElement.call(this, options.initialValue, ['change']);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = EzWebExt.prependWord(options['class'], 'styled_password_field');

    this.inputElement = document.createElement("input");
    this.inputElement.setAttribute("type", "password");

    if (options['name'] !== undefined)
        this.inputElement.setAttribute("name", options['name']);

    if (options['id'] != undefined)
        this.wrapperElement.setAttribute("id", options['id']);

    this.inputElement.setAttribute("value", options['initialValue']);

    var div = document.createElement("div");
    div.appendChild(this.inputElement);
    this.wrapperElement.appendChild(div);
}
StyledElements.StyledPasswordField.prototype = new StyledElements.StyledInputElement();

/**
 * @param options Una tabla hash con opciones. Los posibles valores son los
 * siguientes:
 *   - name: nombre que tendrá el elemento input (sólo es necesario cuando se
 *     está creando un formulario).
 *   - class: lista de clases separada por espacios que se asignará al div
 *     principal de este Numeric Field. Independientemente del valor de esta
 *     opción, siempre se le asignará la clase "styled_numeric_field" al div
 *     principal.
 *   - minValue: valor mínimo que permitirá este Numeric Field.
 *   - maxValue: valor máximo que permitirá este Numeric Field.
 *
 */
StyledElements.StyledNumericField = function(options) {
    var defaultOptions = {
        'initialValue': 0,
        'class': '',
        'minValue': null,
        'maxValue': null,
        'inc': 1
    };
    options = EzWebExt.merge(defaultOptions, options);

    StyledElements.StyledInputElement.call(this, options.initialValue, ['change']);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = "styled_numeric_field";
    this.inputElement = document.createElement("input");
    this.inputElement.setAttribute("type", "text");

    if (options['name'] != undefined)
        this.inputElement.setAttribute("name", options['name']);

    if (options['id'] != undefined)
        this.wrapperElement.setAttribute("id", options['id']);

    if (options.minValue != null) {
        options.minValue = Number(options.minValue);
    }

    if (options.maxValue != null) {
        options.maxValue = Number(options.maxValue);
    }
    options.inc = Number(options.inc);

    this.inputElement.setAttribute("value", options['initialValue']);

    this.inputElement.className = EzWebExt.prependWord(options['class'], "numeric_field");

    var topButton = document.createElement("div");
    topButton.className = "numeric_top_button";
    var bottomButton = document.createElement("div");
    bottomButton.className = "numeric_bottom_button";

    var inc = function(element, inc) {
        var value = Number(element.value);
        if (!isNaN(value)) {
            value = Math.round((value + inc) * 100) / 100;

            // Check for max & min values
            if ((inc > 0) && options['maxValue'] != null && value > options['maxValue'])
                value = options['maxValue'];
            else if ((inc < 0) && options['minValue'] != null && value < options['minValue'])
                value = options['minValue'];

            element.value = value;
        }
    };

    EzWebExt.addEventListener(topButton, "click",
        EzWebExt.bind(function(event) {
            if (this.enabled)
                inc(this.inputElement, options.inc);
        }, this),
        true);

    EzWebExt.addEventListener(bottomButton, "click",
        EzWebExt.bind(function(event) {
            if (this.enabled)
                inc(this.inputElement, -options.inc);
        }, this),
        true);

    var div = document.createElement("div");
    div.appendChild(this.inputElement);
    this.wrapperElement.appendChild(div);
    this.wrapperElement.appendChild(topButton);
    this.wrapperElement.appendChild(bottomButton);
}
StyledElements.StyledNumericField.prototype = new StyledElements.StyledInputElement();

/**
 * Este componente permite agrupar varios CheckBoxes o RadioButtons, con el
 * objetivo de tratarlos como un único campo de entrada, permitiendo obtener y
 * establecer su valor, escuchar eventos de modificación, etc... etc...
 */
StyledElements.ButtonsGroup = function(name_) {
    StyledElements.StyledInputElement.call(this, "", ['change']);

    this.name_ = name_;
    this.buttons = [];
}
StyledElements.ButtonsGroup.prototype = new StyledElements.StyledInputElement();

/**
 * Devuelve el nombre que tiene asignado este ButtonsGroup.
 */
StyledElements.ButtonsGroup.prototype.getName = function() {
    return this.name_;
}

/**
 * @private
 */
StyledElements.ButtonsGroup.prototype.insertButton = function(button) {
    this.buttons[this.buttons.length] = button;
    button.addEventListener('change',
                            EzWebExt.bind(function () {
                                var changeHandlers = this.events['change'].dispatch(this);
                            }, this));
}

StyledElements.ButtonsGroup.prototype.getValue = function() {
    if (this.buttons[0] instanceof StyledElements.StyledCheckBox) {
        var result = [];

        for (var i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].inputElement.checked)
                result[result.length] = this.buttons[i].inputElement.value;
        }

        return result;
    } else {
        for (var i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].inputElement.checked)
                return [this.buttons[i].inputElement.value];
        }
        return [];
    }
}

StyledElements.ButtonsGroup.prototype.setValue = function(newValue) {
    if (newValue == null) {
        newValue = [];
    } else if (typeof newValue === 'string') {
        newValue = [newValue];
    }

    for (var i = 0; i < this.buttons.length; i++) {
        if (newValue.indexOf(this.buttons[i].inputElement.value) !== -1) {
            this.buttons[i].setValue(true);
        } else {
            this.buttons[i].setValue(false);
        }
    }
}

StyledElements.ButtonsGroup.prototype.reset = function() {
    for (var i = 0; i < this.buttons.length; i++) {
        this.buttons[i].reset();
    }
}

/**
 * Devuelve una lista de los elementos StyledCheckBox o StyledRadioButton
 * seleccionados. En caso de que la selección este vacía, este método devolverá
 * una lista vacía y en caso de que este ButtonGroup este formado por
 * StyledRadioButtons, la selección será como mucho de un elemento.
 */
StyledElements.ButtonsGroup.prototype.getSelectedButtons = function() {
    if (this.buttons[0] instanceof StyledElements.StyledCheckBox) {
        var result = [];

        for (var i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].inputElement.checked)
                result[result.length] = this.buttons[i];
        }

        return result;
    } else {
        for (var i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].inputElement.checked)
                return [this.buttons[i]];
        }
        return [];
    }
}

/**
 *
 */
StyledElements.StyledCheckBox = function(nameGroup_, value, options) {
    var defaultOptions = {
        'initiallyChecked': false,
        'class': ''
    };
    options = EzWebExt.merge(defaultOptions, options);

    StyledElements.StyledInputElement.call(this, options.initiallyChecked, ['change']);

    this.wrapperElement = document.createElement("input");

    this.wrapperElement.setAttribute("type", "checkbox");
    this.wrapperElement.setAttribute("value", value);
    this.inputElement = this.wrapperElement;

    if (options['name'] != undefined)
        this.inputElement.setAttribute("name", options['name']);

    if (options['id'] != undefined)
        this.wrapperElement.setAttribute("id", options['id']);

    if (options['initiallyChecked'] == true)
        this.inputElement.setAttribute("checked", true);

    if (nameGroup_ instanceof StyledElements.ButtonsGroup) {
        this.wrapperElement.setAttribute("name", nameGroup_.getName());
        nameGroup_.insertButton(this);
    } else if (nameGroup_) {
        this.wrapperElement.setAttribute("name", nameGroup_);
    }

    /* Internal events */
    EzWebExt.addEventListener(this.inputElement, 'change',
                                EzWebExt.bind(function () {
                                    if (this.enabled)
                                        this.events['change'].dispatch(this);
                                }, this),
                                true);
}

StyledElements.StyledCheckBox.prototype = new StyledElements.StyledInputElement();

StyledElements.StyledCheckBox.prototype.insertInto = function (element, refElement) {
    var checked = this.inputElement.checked; // Necesario para IE
    StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);
    this.inputElement.checked = checked; // Necesario para IE
}

StyledElements.StyledCheckBox.prototype.reset = function() {
    this.inputElement.checked = this.defaultValue;
}

StyledElements.StyledCheckBox.prototype.getValue = function() {
    return this.inputElement.checked;
}

StyledElements.StyledCheckBox.prototype.setValue = function(newValue) {
    this.inputElement.checked = newValue;
}

/**
 *
 */
StyledElements.StyledRadioButton = function(nameGroup_, value, options) {
    var defaultOptions = {
        'initiallyChecked': false,
        'class': ''
    };
    options = EzWebExt.merge(defaultOptions, options);

    StyledElements.StyledInputElement.call(this, options.initiallyChecked, ['change']);

    this.wrapperElement = document.createElement("input");

    this.wrapperElement.setAttribute("type", "radio");
    this.wrapperElement.setAttribute("value", value);
    this.inputElement = this.wrapperElement;

    if (options['name'] != undefined)
        this.inputElement.setAttribute("name", options['name']);

    if (options['id'] != undefined)
        this.wrapperElement.setAttribute("id", options['id']);

    if (options['initiallyChecked'] == true)
        this.inputElement.setAttribute("checked", true);

    if (nameGroup_ instanceof StyledElements.ButtonsGroup) {
        this.wrapperElement.setAttribute("name", nameGroup_.getName());
        nameGroup_.insertButton(this);
    } else if (nameGroup_) {
        this.wrapperElement.setAttribute("name", nameGroup_);
    }

    /* Internal events */
    EzWebExt.addEventListener(this.inputElement, 'change',
                                EzWebExt.bind(function () {
                                    if (this.enabled)
                                        this.events['change'].dispatch(this);
                                }, this),
                                true);
}
StyledElements.StyledRadioButton.prototype = new StyledElements.StyledInputElement();

StyledElements.StyledRadioButton.prototype.insertInto = function (element, refElement) {
    var checked = this.inputElement.checked; // Necesario para IE
    StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);
    this.inputElement.checked = checked; // Necesario para IE
}

StyledElements.StyledRadioButton.prototype.reset = function() {
    this.inputElement.checked = this.defaultValue;
}

StyledElements.StyledRadioButton.prototype.setValue = function(newValue) {
    this.inputElement.checked = newValue;
}

/**
 * El componente Styled HPaned crea dos paneles separados por un separador y
 * que permite redimensionar los dos paneles a la vez con el objetivo de que
 * siguan ocupando el mismo espacio en conjunto.
 *
 * @param options Opciones admitidas:
 *                -{Number} handlerPosition Indica la posición en la que estará
 *                 el separador inicialmente. Esta posición deberá ir indicada
 *                 en porcentajes. Valor por defecto: 50.
 *                -{Number} leftMinWidth Indica el tamaño mínimo que tendrá el
 *                 panel izquierdo del componente. Este tamaño mínimo tiene que
 *                 ir en pixels.
 *                -{Number} rightMinWidth Indica el tamaño mínimo que tendrá el
 *                 panel derecho del componente. Este tamaño mínimo tiene que
 *                 ir en pixels.
 */
StyledElements.StyledHPaned = function(options) {
    StyledElements.StyledElement.call(this, []);

    var defaultOptions = {
        'class': '',
        'full': true,
        'handlerPosition': 50,
        'leftContainerOptions': {'class': ''},
        'leftMinWidth': 0,
        'rightMinWidth': 0,
        'rightContainerOptions': {'class': ''}
    };
    options = EzWebExt.merge(defaultOptions, options);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = EzWebExt.prependWord(options['class'], "hpaned");

    /* Force leftpanel class */
    options.leftContainerOptions['class'] = EzWebExt.prependWord(options.leftContainerOptions['class'], 'leftpanel');
    options.leftContainerOptions['useFullHeight'] = true;
    this.leftPanel = new StyledElements.Container(options.leftContainerOptions);

    this.handler = document.createElement("div");
    this.handler.className = "handler";

    /* Force rightpanel class */
    options.rightContainerOptions['class'] = EzWebExt.prependWord(options.rightContainerOptions['class'], 'rightpanel');
    options.leftContainerOptions['useFullHeight'] = true;
    this.rightPanel = new StyledElements.Container(options.rightContainerOptions);

    this.leftPanel.insertInto(this.wrapperElement);
    this.wrapperElement.appendChild(this.handler);
    this.rightPanel.insertInto(this.wrapperElement);

    this.handlerPosition = options['handlerPosition'];
    this.leftMinWidth = options['leftMinWidth'];
    this.rightMinWidth = options['rightMinWidth'];

    /* Process other options */
    if (options['name'] !== undefined)
        this.inputElement.setAttribute("name", options['name']);

    if (options['id'] != undefined)
        this.wrapperElement.setAttribute("id", options['id']);

    if (options['full'])
        EzWebExt.appendClassName(this.wrapperElement, 'full');

    /*
     * Code for handling internal hpaned events
     */
    var hpaned = this;
    var xStart, handlerPosition, hpanedWidth;

    function endresize(e) {
        document.oncontextmenu = null; //reenable context menu
        document.onmousedown = null; //reenable text selection

        EzWebExt.removeEventListener(document, "mouseup", endresize, true);
        EzWebExt.removeEventListener(document, "mousemove", resize, true);

        hpaned.repaint(false);

        EzWebExt.addEventListener(hpaned.handler, "mousedown", startresize, true);
    }

    function resize(e) {
        var screenX = parseInt(e.screenX);
        xDelta = xStart - screenX;
        xStart = screenX;
        handlerPosition = hpanedWidth * (handlerPosition / 100);
        handlerPosition -= xDelta;
        handlerPosition = (handlerPosition / hpanedWidth) * 100;
        if (handlerPosition > 100)
            hpaned.handlerPosition = 100;
        else if (handlerPosition < 0)
            hpaned.handlerPosition = 0;
        else
            hpaned.handlerPosition = handlerPosition;

        hpaned.repaint(true);
    }

    function startresize(e) {
        document.oncontextmenu = function() { return false; }; //disable context menu
        document.onmousedown = function() { return false; }; //disable text selection
        EzWebExt.removeEventListener(hpaned.handler, "mousedown", startresize, true);

        xStart = parseInt(e.screenX);
        hpanedWidth = hpaned.wrapperElement.parentNode.offsetWidth - 5;
        handlerPosition = hpaned.handlerPosition;

        EzWebExt.addEventListener(document, "mousemove", resize, true);
        EzWebExt.addEventListener(document, "mouseup", endresize, true);
    }

    EzWebExt.addEventListener(hpaned.handler, "mousedown", startresize, true);
}
StyledElements.StyledHPaned.prototype = new StyledElements.StyledElement();

StyledElements.StyledHPaned.prototype.insertInto = function (element, refElement) {
    StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);

    this.repaint();
    EzWebExt.addEventListener(window, "resize",
                            EzWebExt.bind(this.repaint, this),
                            true);
}

StyledElements.StyledHPaned.prototype.getLeftPanel = function () {
    return this.leftPanel;
}

StyledElements.StyledHPaned.prototype.getRightPanel = function () {
    return this.rightPanel;
}

StyledElements.StyledHPaned.prototype.repaint = function(temporal) {
    temporal = temporal !== undefined ? temporal: false;

    var height = this._getUsableHeight();
    if (height == null)
        return; // nothing to do

    // Height
    this.wrapperElement.style.height = (height + "px");

    // Width
    this.wrapperElement.style.width = "";

    var minWidth = this.leftMinWidth + this.rightMinWidth + this.handler.offsetWidth;
    var width = this._getUsableWidth() - this.handler.offsetWidth;
    if (width < minWidth) {
        width = minWidth;
        this.wrapperElement.style.width = width + "px";
    }

    var handlerMiddle = Math.floor(width * (this.handlerPosition / 100));

    var newLeftPanelWidth = handlerMiddle;
    if (newLeftPanelWidth <  this.leftMinWidth) {
        handlerMiddle += this.leftMinWidth - newLeftPanelWidth;
        newLeftPanelWidth = this.leftMinWidth;
    }

    var newRightPanelWidth = width - handlerMiddle;
    if (newRightPanelWidth <  this.rightMinWidth) {
        handlerMiddle -= this.rightMinWidth - newRightPanelWidth;
        newRightPanelWidth = this.rightMinWidth;
        newLeftPanelWidth = handlerMiddle;
    }

    /* Real width update */
    this.leftPanel.wrapperElement.style.width = newLeftPanelWidth + "px";
    this.rightPanel.wrapperElement.style.width = newRightPanelWidth + "px";
    this.handler.style.left = handlerMiddle + "px";

    /* Propagate resize event */
    this.leftPanel.repaint(temporal);
    this.rightPanel.repaint(temporal);
}

/**
 * Este compontente representa a un tab de un notebook.
 */
StyledElements.Tab = function(id, notebook, options) {
    if (!(notebook instanceof StyledElements.StyledNotebook))
        throw new Error("Invalid notebook argument");

    var defaultOptions = {
        'closeable': true,
        'containerOptions': {},
        'name': ''
    };
    options = EzWebExt.merge(defaultOptions, options);
    options['useFullHeight'] = true;

    this.tabId = id;
    this.notebook = notebook;

    this.tabElement = document.createElement("div");
    this.tabElement.className = "tab";
    this.name = document.createTextNode(options.name);
    this.tabElement.appendChild(this.name);

    /* call to the parent constructor */
    StyledElements.Container.call(this, options['containerOptions'], ['close']);

    EzWebExt.prependClassName(this.wrapperElement, "tab hidden"); // TODO

    EzWebExt.addEventListener(this.tabElement, "click",
                                EzWebExt.bind(function () {
                                    this.notebook.goToTab(this.tabId);
                                }, this),
                                false);


    /* Process options */
    if (options.closeable) {
        var closeButton = new StyledElements.StyledButton({text: "X", class: "close_button"});
        closeButton.insertInto(this.tabElement);

        closeButton.addEventListener("click",
                                     EzWebExt.bind(this.close, this),
                                     false);
    }

    if (options.title !== undefined)
        this.setTitle(options.title);
}
StyledElements.Tab.prototype = new StyledElements.Container({extending: true});

/**
 * Elimina este Tab del notebook al que está asociado.
 */
StyledElements.Tab.prototype.close = function() {
    this.notebook.removeTab(this.tabId);
}

/**
 * Establece el texto que se mostrará dentro de la pestaña que se mostrará en
 * <code>notebook</code> y que representará al contenido de este
 * <code>Tab</code>.
 */
StyledElements.Tab.prototype.rename = function(newName) {
    EzWebExt.setTextContent(this.name, newName);
}

/**
 * Establece el texto que se mostrará, mediante un dialogo popup, cuando el
 * puntero del ratón este encima de la pestaña simulando al atributo "title" de
 * los elementos HTML.
 */
StyledElements.Tab.prototype.setTitle = function(newTitle) {
    this.tabElement.setAttribute("title", newTitle);
}

/**
 * Establece el icono de este Tab. En caso de no pasar un icono del notebook al
 * que está asociado.
 */
StyledElements.Tab.prototype.setIcon = function(iconURL) {
    if (iconURL == null) {
        if (this.tabIcon != null) {
            EzWebExt.removeFromParent(this.tabIcon);
            this.tabIcon = null;
        }
        return;
    }

    if (this.tabIcon == null) {
        this.tabIcon = document.createElement('img');
        this.tabElement.insertBefore(this.tabIcon, this.tabElement.firstChild);
    }
    this.tabIcon.src = iconURL;
}

StyledElements.Tab.prototype.setVisible = function (newStatus) {
    if (newStatus) {
        EzWebExt.appendClassName(this.tabElement, "selected");
        EzWebExt.removeClassName(this.wrapperElement, "hidden");
        this.repaint(false);
    } else {
        EzWebExt.removeClassName(this.tabElement, "selected");
        EzWebExt.appendClassName(this.wrapperElement, "hidden");
    }
}

StyledElements.Tab.prototype.getId = function() {
    return this.tabId;
}

/**
 * TODO change this.
 */
StyledElements.Tab.prototype.getTabElement = function() {
    return this.tabElement;
}

/**
 * El componente Styled Notebook crea dos paneles separados por un separador y
 * que permite redimensionar los dos paneles a la vez con el objetivo de que
 * siguan ocupando el mismo espacio en conjunto.
 *
 * @param options opciones soportadas:
 *                - focusOnSetVisible: hace que se ponga el foco en las
 *                  pestañas al hacerlas visibles (<code>true</code> por
 *                  defecto).
 *
 * Eventos que soporta este componente:
 *      - change: evento lanzado cuando se cambia la pestaña.
 *      - tabDeletion: evento lanzado cuando se elimina algún tab del notebook.
 *      - tabInsertion: evento lanzado cuando se crea e inserta un nuevo tab en
 *        el notebook.
 */
StyledElements.StyledNotebook = function(options) {
    var tabWrapper;

    StyledElements.StyledElement.call(this, ['change', 'tabDeletion', 'tabInsertion']);

    var defaultOptions = {
        'class': '',
        'focusOnSetVisible': true,
        'full': true
    };
    options = EzWebExt.merge(defaultOptions, options);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = EzWebExt.prependWord(options['class'], "notebook");

    var div = document.createElement("div");
    this.wrapperElement.appendChild(div);

    tabWrapper = document.createElement("div");
    tabWrapper.className = "tab_wrapper";
    div.appendChild(tabWrapper);

    this.tabArea = document.createElement("div");
    this.tabArea.className = "tab_area";
    tabWrapper.appendChild(this.tabArea);

    this.moveLeftButton = document.createElement("div");
    this.moveLeftButton.className = "move_left";
    this.moveLeftButton.appendChild(document.createTextNode("<"));
    tabWrapper.appendChild(this.moveLeftButton);

    this.moveRightButton = document.createElement("div");
    this.moveRightButton.className = "move_right";
    this.moveRightButton.appendChild(document.createTextNode(">"));
    tabWrapper.appendChild(this.moveRightButton);

    this.contentArea = document.createElement("div");
    this.contentArea.className = "wrapper";
    div.appendChild(this.contentArea);

    this.tabs = new Array();
    this.tabsById = new Array();
    this.visibleTab = null;

    /* Process options */
    if (options['id'] != undefined)
        this.wrapperElement.setAttribute("id", options['id']);

    if (options['full'])
        EzWebExt.appendClassName(this.wrapperElement, 'full');

    this.focusOnSetVisible = options.focusOnSetVisible;

    /* Transitions code */
    var context = {control: this,
                   initialScrollLeft: null,
                   finalScrollLeft: null,
                   steps: null,
                   step: null,
                   inc: null};

    var stepFunc = function(step, context) {
        var scrollLeft = context.initialScrollLeft + Math.floor((step + 1) * context.inc);

        if ((context.inc < 0) && (scrollLeft > context.finalScrollLeft) ||
            (context.inc > 0) && (scrollLeft < context.finalScrollLeft)) {
            context.control.tabArea.scrollLeft = Math.round(scrollLeft);
            return true;  // we need to do more iterations
        } else {
            // Finish current transition
            context.control.tabArea.scrollLeft = context.finalScrollLeft;
            context.control._enableDisableButtons();

            return false;
        }
    };

    var initFunc = function(context, command) {
        var firstVisibleTab, currentTab, maxScrollLeft, baseTime, stepTimes;

        context.initialScrollLeft = context.control.tabArea.scrollLeft;
        switch (command.type) {
        case 'shiftLeft':

            if (context.control._isTabVisible(0)) {
                return false;
            }

            firstVisibleTab = context.control.getFirstVisibleTab();
            currentTab = context.control.tabs[firstVisibleTab - 1].getTabElement();
            context.finalScrollLeft = currentTab.offsetLeft;
            break;

        case 'shiftRight':
            if (context.control._isTabVisible(context.control.tabs.length - 1)) {
                return false;
            }

            firstVisibleTab = context.control.getFirstVisibleTab();
            currentTab = context.control.tabs[firstVisibleTab + 1].getTabElement();
            context.finalScrollLeft = currentTab.offsetLeft;
            break;
        case 'focus':
            currentTab = context.control.tabsById[command.tabId].getTabElement();

            if (context.control._isTabVisible(context.control.getTabIndex(command.tabId))) {
                return false;
            }
            context.finalScrollLeft = currentTab.offsetLeft;
            break;
        }

        maxScrollLeft = this.scrollWidth - this.clientWidth;
        if (context.finalScrollLeft > maxScrollLeft) {
            context.finalScrollLeft = maxScrollLeft;
        }

        baseTime = (new Date()).getTime() + 100;
        stepTimes = [];
        context.steps = 6;
        for (var i = 0; i <= context.steps; i++) {
           stepTimes[i] = baseTime + (i * 100);
        }

        context.inc = Math.floor((context.finalScrollLeft - context.initialScrollLeft) / context.steps);
        return stepTimes; // we have things to do
    }

    this.transitionsQueue = new CommandQueue(context, initFunc, stepFunc);

    /* Code for handling internal events */
    EzWebExt.addEventListener(this.moveLeftButton, "click",
                                         EzWebExt.bind(this.shiftLeftTabs, this),
                                         true);

    EzWebExt.addEventListener(this.moveRightButton, "click",
                                         EzWebExt.bind(this.shiftRightTabs, this),
                                         true);

}
StyledElements.StyledNotebook.prototype = new StyledElements.StyledElement();

/**
 * @private
 */
StyledElements.StyledNotebook.prototype._isTabVisible = function(tabIndex) {
    var tabElement = this.tabs[tabIndex].getTabElement();

    var tabAreaStart = this.tabArea.scrollLeft;
    var tabAreaEnd = tabAreaStart + this.tabArea.clientWidth;

    var tabOffsetRight = tabElement.offsetLeft + tabElement.offsetWidth;

    return tabElement.offsetLeft >= tabAreaStart && tabOffsetRight <= tabAreaEnd;
}

/**
 * @private
 */
StyledElements.StyledNotebook.prototype._enableDisableButtons = function() {
    if (this.tabs.length == 0) {
        EzWebExt.removeClassName(this.moveLeftButton, "enabled");
        EzWebExt.removeClassName(this.moveRightButton, "enabled");
        return;
    }

    if (this._isTabVisible(0)) {
        EzWebExt.removeClassName(this.moveLeftButton, "enabled");
    } else {
        EzWebExt.appendClassName(this.moveLeftButton, "enabled");
    }

    if (this._isTabVisible(this.tabs.length - 1)) {
        EzWebExt.removeClassName(this.moveRightButton, "enabled");
    } else {
        EzWebExt.appendClassName(this.moveRightButton, "enabled");
    }
}

/**
 * @private
 */
StyledElements.StyledNotebook.prototype.getFirstVisibleTab = function() {
    var i;
    for (i = 0; i < this.tabs.length; i += 1) {
        if (this._isTabVisible(i)) {
            return i;
        }
    }
    return null;
}

/**
 * Desplaza las pestañas a la izquierda.
 */
StyledElements.StyledNotebook.prototype.shiftLeftTabs = function() {
    this.transitionsQueue.addCommand({type: 'shiftLeft'});
}

/**
 * Desplaza las pestañas a la derecha.
 */
StyledElements.StyledNotebook.prototype.shiftRightTabs = function() {
    this.transitionsQueue.addCommand({type: 'shiftRight'});
}

StyledElements.StyledNotebook.prototype.insertInto = function (element, refElement) {
    StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);

    this.repaint();
}

/**
 * Crea un Tab y lo asocia con este notebook.
 *
 * @param options opciones de la pestaña:
 *                - containerOptions: indica las opciones particulares del
 *                  contenedor que se creará para el contenido del Tab. Para
 *                  ver las opciones disponibles ver el constructor de
 *                  <code>Container</code>. Valor por defecto: {}.
 *                - closeable: indica si se le permitirá al usuario cerrar
 *                  la pestaña mediante el botón cerrar (botón que sólo aparece
 *                  si la pestaña es "closeable"). Valor por defecto: true.
 *                - name: indica el texto inicial que se mostrará dentro de la
 *                  pestaña. Valor por defecto: "".
 *                - title: indica el "title" inicial que tendrá el Tab (ver el
 *                  método Tab.setTitle).
 */
StyledElements.StyledNotebook.prototype.createTab = function(options) {
    var defaultOptions = {
        'initiallyVisible': false,
        'name': ''
    };
    options = EzWebExt.merge(defaultOptions, options);

    // Reserve an id for the new tab
    var tabId = this.tabsById.push(null);

    // Create the tab
    var tab = new StyledElements.Tab(tabId, this, options);

    // Insert it into our hashes
    this.tabs[this.tabs.length] = tab;
    this.tabsById[tabId] = tab;

    var tabElement = tab.getTabElement();
    this.tabArea.appendChild(tabElement);
    tab.insertInto(this.contentArea);

    if (!this.visibleTab) {
        this.visibleTab = tab;
        tab.setVisible(true);
    }

    // Enable/Disable tab moving buttons
    this._enableDisableButtons();

    /* Process options */
    if (options.initiallyVisible)
        this.goToTab(tabId);

    // Event dispatch
    this.events['tabInsertion'].dispatch(this);

    /* Return the container associated with the newly created tab */
    return tab;
}

/**
 * Devuelve la instancia de la pestaña indicada mediante su identificador.
 *
 * @param id identificador de la pestaña que se quiere recuperar.
 * @returns {Tab}
 */
StyledElements.StyledNotebook.prototype.getTab = function(id) {
    return this.tabsById[id];
}

/**
 * Devuelve la pesataña que está actualmente en la posición indicada.
 *
 * @param index indice de la pestaña de la que se quiere conocer el
 * identificador de pestaña.
 * @returns {Tab}
 */
StyledElements.StyledNotebook.prototype.getTabByIndex = function(index) {
    return this.tabs[index];
}

/**
 * Devuelve la posición actual de la pestaña indicada mediante su identificador.
 * Esta operación es lenta, por lo que no conviene abusar de ella.
 *
 * @param id identificador de la pestaña de la que se quiere conocer su posición
 * actual.
 */
StyledElements.StyledNotebook.prototype.getTabIndex = function(id) {
    for (var i = 0; i < this.tabs.length; i++) {
         if (this.tabs[i].getId() == id)
             return i;
    }
    return null;
}

/**
 * Elimina del notebook la pestaña indicada mediante su identificador.
 * @param id identificador de la pestaña que se quiere eliminar.
 */
StyledElements.StyledNotebook.prototype.removeTab = function(id) {
    var index, tabToExtract, nextTab;

    if (!this.tabsById[id])
        return;

    delete this.tabsById[id];
    index = this.getTabIndex(id);
    tabToExtract = this.tabs.splice(index, 1)[0];

    this.tabArea.removeChild(tabToExtract.getTabElement());
    this.contentArea.removeChild(tabToExtract.wrapperElement); // TODO create a method for removeFrom

    // Enable/Disable tab scrolling buttons
    this._enableDisableButtons();

    if ((this.visibleTab === tabToExtract) && (this.tabs.length > 0)) {
        nextTab = this.tabs[index];
        if (!nextTab) {
            nextTab = this.tabs[index - 1];
        }
        this.goToTab(nextTab.getId());
    }

    // Send specific tab close event
    tabToExtract.events['close'].dispatch(tabToExtract, this);

    // Event dispatch
    this.events['tabDeletion'].dispatch(this, tabToExtract);
}

/**
 * Marca la pestaña indicada mediante su identificador como visible, haciendo
 * que el contenido de esta sea visible. En caso de que el notebook fuera
 * creado con la opción "focusOnSetVisible" activada, además se le pasará el
 * foco a la pestaña asociada.
 *
 * @param id identificador de la pestaña que se quiere eliminar.
 */
StyledElements.StyledNotebook.prototype.goToTab = function(id) {
    var newTab = this.tabsById[id];
    var oldTab = this.visibleTab;
    if (newTab == null) {
        throw new Error();
    }

    if (this.visibleTab && newTab == this.visibleTab)
        return;

    this.events['change'].dispatch(this, oldTab, newTab);

    if (this.visibleTab)
        this.visibleTab.setVisible(false);

    this.visibleTab = newTab;
    this.visibleTab.setVisible(true);

    if (this.focusOnSetVisible)
        this.focus(id);
}

/**
 * Devuelve el número de pestañas disponibles actualmente en este notebook.
 */
StyledElements.StyledNotebook.prototype.getNumberOfTabs = function() {
    return this.tabs.length;
}

/**
 * Establece el foco en la pestaña indicada, esto es, fuerza a que sea visible
 * la pestaña en el area de pestañas del notebook.
 */
StyledElements.StyledNotebook.prototype.focus = function(tabId) {
    this.transitionsQueue.addCommand({type: 'focus', tabId: tabId});
}

StyledElements.StyledNotebook.prototype.repaint = function(temporal) {
    var i;
    temporal = temporal !== undefined ? temporal: false;

    var height = this._getUsableHeight();
    if (height == null)
        return; // nothing to do

    this.wrapperElement.style.height = (height + "px");

    // Enable/Disable tab scrolling buttons
    this._enableDisableButtons();

    // Resize content
    if (temporal) {
        if (this.visibleTab)
            this.visibleTab.repaint(true);
    } else {
        for (i = 0; i < this.tabs.length; i++) {
            this.tabs[i].repaint(false);
        }
    }
}

/**
 * Devuelve <code>true</code> si este Componente está deshabilitado.
 */
StyledElements.StyledNotebook.prototype.isDisabled = function() {
    return this.disabledLayer != null;
}

/**
 * Deshabilita/habilita este notebook. Cuando un notebook está deshabilitado
 * los usuarios no pueden realizar ninguna operación de ningún componente
 * incluido dentro de este.
 */
StyledElements.StyledNotebook.prototype.setDisabled = function(disabled) {
    if (this.isDisabled() == disabled) {
      // Nothing to do
      return;
    }

    if (disabled) {
        this.disabledLayer = document.createElement('div');
        EzWebExt.addClassName(this.disabledLayer, 'disable-layer');
        this.wrapperElement.appendChild(this.disabledLayer);
    } else {
        EzWebExt.removeFromParent(this.disabledLayer);
        this.disabledLayer = null;
    }
    this.enabled = !disabled;
}

StyledElements.StyledNotebook.prototype.enable = function() {
    this.setDisabled(false);
}

StyledElements.StyledNotebook.prototype.disable = function() {
    this.setDisabled(true);
}


/**
 * Muestra un diálogo de alerta con un mensaje, título e icono.
 *
 * TODO rellenar la documentación
 *
 * @param title
 * @param content
 * @param options Opciones disponibles:
 *         -minWidth:
 *         -maxWidth:
 *         -minWidth:
 *         -maxWidth:
 *         -type: Indica el tipo de mesaje que se quiere mostrar. Los valores
 *          disponibles son: EzWebExt.ALERT_INFO, EzWebExt.ALERT_WARNING,
 *          EzWebExt.ALERT_ERROR. Valor por defecto: EzWebExt.ALERT_INFO.
 */
StyledElements.StyledAlert = function(title, content, options) {
    var defaultOptions = {
        'minWidth': 200,
        'maxWidth': 400,
        'minHeight': 100,
        'maxHeight': 200,
        'type': EzWebExt.ALERT_INFO
    };
    this.options = EzWebExt.merge(defaultOptions, options);

    var image = document.createElement("img");
    image.src = EzWebExt.getResourceURL("/images/degradado.png");
    document.body.appendChild(image);
    document.body.removeChild(image);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = "styled_alert";

		this.backgroundDiv = document.createElement("div");
		this.backgroundDiv.className = "background";

    this.messageDiv = document.createElement("div");
    this.messageDiv.className = "message";

    this.wrapperElement.appendChild(this.backgroundDiv);
    this.wrapperElement.appendChild(this.messageDiv);

    this.header = document.createElement("div");
    this.header.className = "header";

    var table = document.createElement("table");
		var tbody = document.createElement("tbody");
		table.appendChild(tbody);
		table.setAttribute("width", "100%");
		this.header.appendChild(table);

		var tr = tbody.insertRow(-1);
		var td = tr.insertCell(-1);
		td.className = "title";

    var types = ["info", "warning", "error"];
    image = document.createElement("img");
    image.src = EzWebExt.getResourceURL("/images/dialog/dialog-" + types[this.options['type']] + '.png');
    td.appendChild(image);

    if (title)
      td.appendChild(document.createTextNode(title));

		var button = tr.insertCell(-1);
		button.className = "close_button";

    this.messageDiv.appendChild(this.header);

    this.content = document.createElement("div");
    this.content.className = "content";
    if (content && (typeof(content) == typeof("")))
        this.content.innerHTML = content;
    if (content && (typeof(content) != typeof("")))
        this.content.appendChild(content);
    this.messageDiv.appendChild(this.content);


    EzWebExt.prependClassName(this.wrapperElement, types[this.options['type']]);

    /* Events code */
    EzWebExt.addEventListener(button, "click",
                            EzWebExt.bind(this.close, this),
                            true);
}

StyledElements.StyledAlert.prototype = new StyledElements.StyledElement();

StyledElements.StyledAlert.prototype.close = function() {
    EzWebExt.removeFromParent(this.wrapperElement);
    this.wrapperElement = null;
}

StyledElements.StyledAlert.prototype.insertInto = function(element, refElement){
    StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);
    this.repaint();
}

StyledElements.StyledAlert.prototype.repaint = function(temporal) {
    //temporal = temporal !== undefined ? temporal: false;

    if(this.wrapperElement){
      // Adjust messageDiv height and messageDiv width
      var width = (this.wrapperElement.offsetWidth * 80 / 100);
      var height = (this.wrapperElement.offsetHeight * 80 / 100);
      var positionHeight = (this.wrapperElement.offsetHeight * 10 / 100);
      var positionWidth = (this.wrapperElement.offsetWidth * 10 / 100);
/*
      width = (width > this.options['max_width']) ? this.options['max_width']:
                  ((width < this.options['min_width']) ? this.options['min_width'] : width);
      height = (height > this.options['max_height']) ? this.options['max_height']:
                  ((height < this.options['min_height']) ? this.options['min_height'] : height);
*/
      this.messageDiv.style.top = positionHeight + 'px';;
      this.messageDiv.style.left = positionWidth + 'px';;
      this.messageDiv.style.right = positionWidth + 'px';;
      this.messageDiv.style.bottom = positionHeight + 'px';;
      this.messageDiv.style.width = width + 'px';
      this.messageDiv.style.height = height + 'px';

      // Adjust Content Height
      var messageDivStyle = document.defaultView.getComputedStyle(this.messageDiv, null);
      var headerStyle = document.defaultView.getComputedStyle(this.header, null);
      var contentStyle = document.defaultView.getComputedStyle(this.content, null);

      height = height - this.header.offsetHeight -
		    messageDivStyle.getPropertyCSSValue('border-top-width').getFloatValue(CSSPrimitiveValue.CSS_PX) -
		    messageDivStyle.getPropertyCSSValue('border-bottom-width').getFloatValue(CSSPrimitiveValue.CSS_PX) -
		    headerStyle.getPropertyCSSValue('margin-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX) -
		    headerStyle.getPropertyCSSValue('margin-top').getFloatValue(CSSPrimitiveValue.CSS_PX) -
		    contentStyle.getPropertyCSSValue('margin-bottom').getFloatValue(CSSPrimitiveValue.CSS_PX);
      if (height < 0)
          height = 0;
      this.content.style.height =  (height + 'px');

      // Addjust Content Width
      width =  width -
		    messageDivStyle.getPropertyCSSValue('border-left-width').getFloatValue(CSSPrimitiveValue.CSS_PX) -
		    messageDivStyle.getPropertyCSSValue('border-right-width').getFloatValue(CSSPrimitiveValue.CSS_PX) -
		    contentStyle.getPropertyCSSValue('margin-right').getFloatValue(CSSPrimitiveValue.CSS_PX) -
		    contentStyle.getPropertyCSSValue('margin-left').getFloatValue(CSSPrimitiveValue.CSS_PX);
      if (width < 0)
          width = 0;
      this.content.style.width = (width + 'px');
    }
}
/**
 * @experimental
 *
 * Permite ejecutar secuencialmente distintos comandos. Dado que javascript no
 * tiene un interfaz para manejo de hilos, esto realmente sólo es necesario en
 * los casos en los que la concurrencia provenga a través de alguno de los
 * mecanismos de señales soportados por javascript (de momento, estos son los
 * eventos, los temporizadores y las peticiones asíncronas mediante el objeto
 * XMLHttpRequest).
 */
var CommandQueue = function (context, initFunc, stepFunc) {
    var running = false;
    var elements = new Array();
    var step = 0;
    var stepTimes = null;

    function doStep() {
        if (stepFunc(step, context)) {
            var timeDiff = stepTimes[step] - (new Date()).getTime();
            if (timeDiff < 0)
                timeDiff = 0

            step++;
            setTimeout(doStep, timeDiff);
        } else {
            doInit()
        }
    }

    function doInit() {
        var command;
        do {
            command = elements.shift();
        } while (command != undefined && !(stepTimes = initFunc(context, command)));

        if (command != undefined) {
            step = 0;
            var timeDiff = stepTimes[step] - (new Date()).getTime();
            if (timeDiff < 0)
                timeDiff = 0
            setTimeout(doStep, timeDiff);
        } else {
            running = false;
        }
    }

    /**
     * Añade un comando a la cola de procesamiento. El comando será procesado
     * despues de que se procesen todos los comandos añadidos anteriormente.
     *
     * @param command comando a añadir a la cola de procesamiento. El tipo de
     * este párametro tiene que ser compatible con las funciones initFunc y
     * stepFunc pasadas en el constructor.
     */
    this.addCommand = function(command) {
        if (command == undefined)
            return;

        elements.push(command);

        if (!running) {
            running = true;
            doInit();
        }
    }
}

/**
 * Este compontente representa al contenedor para una alternativa usable por el
 * componente StyledAlternatives.
 */
StyledElements.Alternative = function(id, initialName, options) {
    var defaultOptions = {
        useFullHeight: true
    };
    options = EzWebExt.merge(defaultOptions, options);

    this.altId = id;

    /* call to the parent constructor */
    StyledElements.Container.call(this, options, []);

    EzWebExt.appendClassName(this.wrapperElement, "hidden"); // TODO
}
StyledElements.Alternative.prototype = new StyledElements.Container({extending: true});

StyledElements.Alternative.prototype.setVisible = function (newStatus) {
    if (newStatus)
        EzWebExt.removeClassName(this.wrapperElement, "hidden");
    else
        EzWebExt.appendClassName(this.wrapperElement, "hidden");
}

StyledElements.Alternative.prototype.getId = function() {
    return this.altId;
}

/**
 * El componente Styled Alternatives permite guardar una colección de
 * contenedores, de los cuales sólo uno estará visible en el area asociada al
 * componente Alternatives.
 */
StyledElements.StyledAlternatives = function(options) {
    var defaultOptions = {
        'class': '',
        'full': true,
        'defaultEffect': 'None'
    };

    options = EzWebExt.merge(defaultOptions, options);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = EzWebExt.prependWord(options['class'], "alternatives");

    this.contentArea = document.createElement("div");
    this.contentArea.className = "wrapper";
    this.wrapperElement.appendChild(this.contentArea);

    this.visibleAlt = null;
    this.alternatives = new Array();

    /* Process options */
    if (options['id'])
        this.wrapperElement.setAttribute("id", options['id']);

    if (options['full'])
        EzWebExt.appendClassName(this.wrapperElement, "full");

    this.defaultEffect = options['defaultEffect'];

    /* Transitions code */
    var context = {alternativesObject: this,
                   inAlternative: null,
                   outAlternative: null,
                   width: null,
                   steps: null,
                   step: null,
                   inc: null};

    var stepFunc = function(step, context) {
        var offset = Math.floor(step * context.inc);

        if (context.inc < 0) {
           var newLeftPosOut = offset;
           var newLeftPosIn = context.width + offset;
        } else {
           var newLeftPosOut = offset;
           var newLeftPosIn = -context.width + offset;
        }

        if ((context.inc < 0) && (newLeftPosIn > 0) ||
            (context.inc > 0) && (newLeftPosOut < context.width)) {
          context.outAlternative.wrapperElement.style.left = newLeftPosOut + "px";
          context.inAlternative.wrapperElement.style.left = newLeftPosIn + "px";
          return true;  // we need to do more iterations
        } else {
          // Finish current transition
          context.outAlternative.setVisible(false);
          context.outAlternative.wrapperElement.style.left = null;
          context.outAlternative.wrapperElement.style.width = null;
          context.inAlternative.wrapperElement.style.left = null;
          context.inAlternative.wrapperElement.style.width = null;

          context.alternativesObject.visibleAlt = context.inAlternative;
          return false; // we have finished here
        }
    };

    var initFunc = function(context, command) {
        context.outAlternative = context.alternativesObject.visibleAlt;
        context.inAlternative = command;
        if (context.inAlternative != null)
                context.inAlternative = context.alternativesObject.alternatives[context.inAlternative];

        if (context.inAlternative == null || context.inAlternative == context.outAlternative)
            return false; // we are not going to process this command

        var baseTime = (new Date()).getTime() + 150;

        context.width = context.alternativesObject.wrapperElement.offsetWidth;
        context.inAlternative.wrapperElement.style.width = context.width + "px";
        context.outAlternative.wrapperElement.style.width = context.width + "px";
        context.inAlternative.setVisible(true);

        var stepTimes = [];
        // TODO
        switch (context.alternativesObject.defaultEffect) {
        case StyledElements.StyledAlternatives.HORIZONTAL_SLICE:
            context.steps = 6;
            for (var i = 0; i <= context.steps; i++)
               stepTimes[i] = baseTime + (i * 150);

            context.inc = Math.floor(context.width / context.steps);
            if (context.inAlternative.getId() > context.outAlternative.getId()) {
                context.inAlternative.wrapperElement.style.left = context.width + "px";
                context.inc = -context.inc;
            } else {
                context.inAlternative.wrapperElement.style.left = -context.width + "px";
            }
        // TODO
        default:
        case StyledElements.StyledAlternatives.NONE:
            context.steps = 1;
            stepTimes[0] = baseTime;

            context.inc = Math.floor(context.width / context.steps);
            if (context.inAlternative.getId() > context.outAlternative.getId()) {
                context.inAlternative.wrapperElement.style.left = context.width + "px";
                context.inc = -context.inc;
            } else {
                context.inAlternative.wrapperElement.style.left = -context.width + "px";
            }
        }

        return stepTimes; // we have things to do
    }

    this.transitionsQueue = new CommandQueue(context, initFunc, stepFunc);

}
StyledElements.StyledAlternatives.prototype = new StyledElements.StyledElement();
StyledElements.StyledAlternatives.HORIZONTAL_SLICE = "HorizontalSlice";
StyledElements.StyledAlternatives.NONE = "HorizontalSlice";

StyledElements.StyledAlternatives.prototype.repaint = function(temporal) {
    temporal = temporal !== undefined ? temporal: false;

    var height = this._getUsableHeight();
    if (height == null)
        return; // nothing to do

    this.wrapperElement.style.height = (height + "px");

    // Resize content
    for (var i = 0; i < this.alternatives.length; i++)
        this.alternatives[i].repaint(temporal);
}

StyledElements.StyledAlternatives.prototype.createAlternative = function(options) {
    var defaultOptions = {
        'containerOptions': {}
    };
    options = EzWebExt.merge(defaultOptions, options);

    var altId = this.alternatives.length;
    var alt = new StyledElements.Alternative(altId, options['containerOptions']);

    alt.insertInto(this.contentArea);

    this.alternatives[altId] = alt;

    if (!this.visibleAlt) {
        this.visibleAlt = alt;
        alt.setVisible(true);
    }

    /* Return the alternative container */
    return alt;
}

/**
 * Changes current visible alternative.
 *
 * @param {Number|StyledElements.Alternative} Alternative to show. Must belong
 * to this instance of StyledAlternatives.
 */
StyledElements.StyledAlternatives.prototype.showAlternative = function(alternative) {
    var id;

    if (alternative instanceof StyledElements.Alternative) {
        id = alternative.getId();
        if (this.alternatives[id] !== alternative) {
            throw new Error('Invalid alternative');
        }
    } else {
        id = alternative;
        if (this.alternatives[id] != null) {
            throw new Error('Invalid alternative');
        }
    }
    this.transitionsQueue.addCommand(id);
}


/**
 *
 * Eventos que soporta este componente:
 *      - click: evento lanzado cuando se pulsa el botón.
 */
StyledElements.StyledButton = function(options) {
    var defaultOptions = {
        'text': null,
        'title': '',
        'class': '',
        'iconHeight': 24,
        'iconWidth': 24,
        'icon': null
    };
    options = EzWebExt.merge(defaultOptions, options);

    // Necesario para permitir herencia
    if (options.extending)
        return;

    StyledElements.StyledElement.call(this, ['click']);

    this.wrapperElement = document.createElement("div");
    this.wrapperElement.className = EzWebExt.appendWord(options['class'], "styled_button");

    var button = document.createElement("div");
    if (options.title)
        button.setAttribute('title', options.title);

    if (options.icon != null) {
        this.icon = document.createElement("img");
        this.icon.className = "icon";
        this.icon.style.width = options['iconWidth'] + 'px';
        this.icon.style.height = options['iconHeight'] + 'px';
        this.icon.src = options.icon;
        button.appendChild(this.icon);
    }

    this.wrapperElement.appendChild(button);

    if (options.text !== null) {
        this.label = document.createElement('span');
        this.label.appendChild(document.createTextNode(options.text));
        button.appendChild(this.label);
    }

    /* Event handlers */
    EzWebExt.addEventListener(button, 'click', EzWebExt.bind(this._clickCallback, this), true);
}
StyledElements.StyledButton.prototype = new StyledElements.StyledElement();

StyledElements.StyledButton.prototype._clickCallback = function(e) {
    e.stopPropagation();
    if (this.enabled)
        this.events['click'].dispatch(this);
}

/**
 * Eventos que soporta este componente:
 *      - paginationChanged: evento lanzado cuando se cambia los datos que
 *        maneja el objeto <code>Pagination</code>.
 */
function Pagination(initialPageSize) {
    var initialPageSize = initialPageSize ? initialPageSize : 25;

    StyledElements.ObjectWithEvents.call(this, ['paginationChanged']);

    this.elements = [];
    this.pageSize = initialPageSize;
    this.totalPages = 1;
}
Pagination.prototype = new StyledElements.ObjectWithEvents();

Pagination.prototype.init = function(elements, pageSize) {
    this.elements = elements;
    this.pageSize = pageSize;

    this._calculatePages();
    this.events['paginationChanged'].dispatch(this.pageSize);
}

Pagination.prototype.changeElements = function(elements) {
    this.elements = elements;

    this._calculatePages();
    this.events['paginationChanged'].dispatch(this.pageSize);
}

Pagination.prototype.changePageSize = function(pageSize) {
    this.pageSize = pageSize;
    this._calculatePages();
    this.events['paginationChanged'].dispatch(this.pageSize);
}

Pagination.prototype._calculatePages = function() {
    this.totalPages = Math.ceil(this.elements.length / this.pageSize);
    if (this.totalPages <= 0)
        this.totalPages = 1;
}

Pagination.prototype.getTotalPages = function() {
    return this.totalPages;
}

Pagination.prototype.getPage = function(idx) {
    if (idx < 0 || idx >= this.totalPages)
        return [];

    var start = this.pageSize * idx;
    var end = start + this.pageSize;
    return this.elements.slice(start, end);
}

Pagination.prototype.getInterface = function(options) {
    return new PaginationInterface(this, options);
}

/**
 * Eventos que soporta este componente:
 *      - pageChange: evento lanzado cuando se cambia la página a mostrar.
 */
var PaginationInterface = function(pagination, options) {
    var defaultOptions = {
        'layout': '%(firstBtn)s%(prevBtn)s Page: %(currentPage)s/%(totalPages)s %(nextBtn)s%(lastBtn)s',
        'autoHide': false
    };
    options = EzWebExt.merge(defaultOptions, options);
    this.autoHide = options.autoHide;

    StyledElements.StyledElement.call(this, ['pageChange']);

    this.pagination = pagination;

    this.wrapperContainer = new StyledElements.Container();
    this.wrapperContainer.addClassName('pagination');
    this.wrapperElement = this.wrapperContainer.wrapperElement;

    this.firstBtn = new StyledElements.StyledButton();
    this.firstBtn.addClassName('go-first-button');
    this.firstBtn.addEventListener('click', EzWebExt.bind(this.goToFirst, this));

    this.prevBtn = new StyledElements.StyledButton();
    this.prevBtn.addClassName('go-prev-button');
    this.prevBtn.addEventListener('click', EzWebExt.bind(this.goToPrevious, this));

    this.nextBtn = new StyledElements.StyledButton();
    this.nextBtn.addClassName('go-next-button');
    this.nextBtn.addEventListener('click', EzWebExt.bind(this.goToNext, this));

    this.lastBtn = new StyledElements.StyledButton();
    this.lastBtn.addClassName('go-last-button');
    this.lastBtn.addEventListener('click', EzWebExt.bind(this.goToLast, this));

    this.currentPageLabel = document.createElement('span');
    EzWebExt.addClassName(this.currentPageLabel, 'current-page');

    this.totalPagesLabel = document.createElement('span');
    EzWebExt.addClassName(this.totalPagesLabel, 'total-pages');

    this._updateLayout(options.layout);

    this.currentPage = 0;
    this.totalPages = this.pagination.getTotalPages();

    EzWebExt.setTextContent(this.currentPageLabel, this.currentPage + 1);
    EzWebExt.setTextContent(this.totalPagesLabel, this.totalPages);

    this._updateButtons();

    this.pagination.addEventListener('paginationChanged', EzWebExt.bind(this.PaginationChanged, this));
}
PaginationInterface.prototype = new StyledElements.StyledElement();


PaginationInterface.prototype._updateLayout = function(pattern) {

    var elements = {
        'firstBtn': this.firstBtn,
        'prevBtn': this.prevBtn,
        'nextBtn': this.nextBtn,
        'lastBtn': this.lastBtn,
        'currentPage': this.currentPageLabel,
        'totalPages': this.totalPagesLabel
    }
    var wrapper = this.wrapperContainer;
    while (pattern) {
        var result = pattern.match(/^%\((\w+)\)s/,1);
        if (result) {
            if (elements[result[1]] != undefined) {
                wrapper.appendChild(elements[result[1]]);
            } else {
                wrapper.appendChild(document.createTextNode(result[0]));
            }
            pattern = pattern.substr(result[0].length);
        }
        var text = EzWebExt.split(pattern, /%\(\w+\)s/, 1);
        if (text && text.length > 0 && text[0] != '') {
            wrapper.appendChild(document.createTextNode(text[0]));
            pattern = pattern.substr(text[0].length);
        }
    }
}


PaginationInterface.prototype.changeLayout = function(newLayout) {
    this._updateLayout(newLayout);
}

PaginationInterface.prototype._updateButtons = function() {
    if (this.currentPage == 0) {
        this.prevBtn.disable();
        this.firstBtn.disable();
    } else {
        this.prevBtn.enable();
        this.firstBtn.enable();
    }

    if (this.currentPage == this.totalPages - 1) {
        this.nextBtn.disable();
        this.lastBtn.disable();
    } else {
        this.nextBtn.enable();
        this.lastBtn.enable();
    }
}

PaginationInterface.prototype._pageChange = function() {
    EzWebExt.setTextContent(this.currentPageLabel, this.currentPage + 1);
    this._updateButtons();
    this.events['pageChange'].dispatch(this.currentPage);
}

PaginationInterface.prototype.PaginationChanged = function() {
    this.currentPage = 0;
    this.totalPages = this.pagination.getTotalPages();

    EzWebExt.setTextContent(this.totalPagesLabel, this.totalPages);

    if (this.autoHide && this.totalPages === 1) {
        this.wrapperElement.style.display = 'none';
    } else {
        this.wrapperElement.style.display = '';
    }

    this._pageChange();
}

PaginationInterface.prototype.getCurrentPage = function() {
    return this.currentPage;
}

PaginationInterface.prototype.goToFirst = function() {
    if (this.currentPage == 0)
        return;

    this.currentPage = 0;
    this._pageChange();
}

PaginationInterface.prototype.goToPrevious = function() {
    if (this.currentPage == 0)
        return;

    this.currentPage--;
    this._pageChange();
}

PaginationInterface.prototype.goToNext = function() {
    if (this.currentPage == this.totalPages - 1)
        return;

    this.currentPage++;
    this._pageChange();
}

PaginationInterface.prototype.goToLast = function() {
    if (this.currentPage == this.totalPages - 1)
        return;

    this.currentPage = this.totalPages - 1;
    this._pageChange();
}

/**
 *
 */
StyledElements.MenuItem = function(text, handler) {
    StyledElements.StyledElement.call(this, ['click', 'mouseover', 'mouseout']);

    this.wrapperElement = document.createElement("div");
    EzWebExt.addClassName(this.wrapperElement, "menu_item");

    var span = document.createElement("span");
    span.appendChild(document.createTextNode(text));
    this.wrapperElement.appendChild(span);

    this.run = handler;

    // Internal events
    this._mouseoverEventHandler = EzWebExt.bind(function(event) {
        if (this.enabled) {
            EzWebExt.addClassName(this.wrapperElement, "hovered");
            this.events['mouseover'].dispatch(this);
        }
    }, this);
    EzWebExt.addEventListener(this.wrapperElement, "mouseover", this._mouseoverEventHandler, false);
    this._mouseoutEventHandler = EzWebExt.bind(function(event) {
        if (this.enabled) {
            EzWebExt.removeClassName(this.wrapperElement, "hovered");
            this.events['mouseout'].dispatch(this);
        }
    }, this)
    EzWebExt.addEventListener(this.wrapperElement, "mouseout", this._mouseoutEventHandler, false);

    this._clickHandler = EzWebExt.bind(function(event) {
        event.stopPropagation();
        if (this.enabled) {
            this.events['click'].dispatch(this);
        }
    }, this);
    EzWebExt.addEventListener(this.wrapperElement, "click", this._clickHandler, false);
}
StyledElements.MenuItem.prototype = new StyledElements.StyledElement();

StyledElements.MenuItem.prototype.destroy = function() {
    if (this.wrapperElement.parentNode) {
        EzWebExt.removeFromParent(this.wrapperElement);
    }
    EzWebExt.removeEventListener(this.wrapperElement, "mouseover", this._mouseoverEventHandler, false);
    EzWebExt.removeEventListener(this.wrapperElement, "mouseout", this._mouseoutEventHandler, false);
    this._mouseoverEventHandler = null;
    this._mouseoutEventHandler = null;
}


/**
 *
 */
StyledElements.DynamicMenuItems = function() {
}

StyledElements.DynamicMenuItems.prototype.build = function() {
    return [];
}


/**
 *
 */
StyledElements.SendMenuItems = function(variable, getData) {
    this.variable = variable;
    this.getData = getData;
}
StyledElements.SendMenuItems.prototype = new StyledElements.DynamicMenuItems();

StyledElements.SendMenuItems.prototype.build = function() {
    var i, contactSlots, nslotsByLabel, slotInfo, actionLabel, items, item;

    items = [];
    contactSlots = this.variable.getFinalSlots();
    nslotsByLabel = {};

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
        if (nslotsByLabel[actionLabel] > 1)
            actionLabel += ' (' + slotInfo.iGadgetName + ')';

        item = new StyledElements.MenuItem(actionLabel, EzWebExt.bind(function(context) {
            this.control.variable.set(this.control.getData(context), {targetSlots: this.slots});
        }, {control: this, slots: [slotInfo]}));

        items.push(item);
    }

    return items;
}


/**
 * @abstract
 */
StyledElements.PopupMenuBase = function(options) {
    if (options && options.extending)
        return;

    StyledElements.ObjectWithEvents.call(this, ['itemOver']);

    this.wrapperElement = document.createElement('div');
    this.wrapperElement.className = 'popup_menu hidden';
    this._items = [];
    this._dynamicItems = [];
    this._submenus = [];
    this._menuItemCallback = EzWebExt.bind(this._menuItemCallback, this);
    this._menuItemEnterCallback = EzWebExt.bind(this._menuItemEnterCallback, this);
}
StyledElements.PopupMenuBase.prototype = new StyledElements.ObjectWithEvents();

StyledElements.PopupMenuBase.prototype._append = function(child, where) {
    if (child instanceof StyledElements.MenuItem) {
        child.addEventListener('click', this._menuItemCallback);
        child.addEventListener('mouseover', this._menuItemEnterCallback);
    } else if (child instanceof StyledElements.SubMenuItem) {
        child.addEventListener('click', this._menuItemCallback);
        child.addEventListener('mouseover', this._menuItemEnterCallback);
        child._setParentPopupMenu(this);
    }
    where.push(child);
}

StyledElements.PopupMenuBase.prototype.append = function(child) {
    this._append(child, this._items);
}

StyledElements.PopupMenuBase.prototype.appendSeparator = function() {
    var separator = document.createElement('hr');
    this.wrapperElement.appendChild(separator);
    this._items.push(separator);
}

StyledElements.PopupMenuBase.prototype.show = function(refPosition) {
    var i, j, item, generatedItems, generatedItem;

    if (this.wrapperElement.parentNode != null) {
        return; // This Popup Menu is already visible => nothing to do
    }

    for (i = 0; i < this._items.length; i += 1) {
        item = this._items[i];
        if (item instanceof StyledElements.DynamicMenuItems) {
            generatedItems = item.build();
            for (j = 0; j < generatedItems.length; j += 1) {
                generatedItem = generatedItems[j];

                this._append(generatedItem, this._dynamicItems);

                if (generatedItem instanceof StyledElements.MenuItem) {
                    generatedItem.insertInto(this.wrapperElement);
                } else if (generatedItem instanceof StyledElements.SubMenuItem) {
                    generatedItem._getMenuItem().insertInto(this.wrapperElement);
                } 
            }
        } else if (item instanceof StyledElements.MenuItem) {
            item.insertInto(this.wrapperElement);
        } else if (item instanceof StyledElements.SubMenuItem) {
            item._getMenuItem().insertInto(this.wrapperElement);
            this._submenus.push(item);
        } else {
            this.wrapperElement.appendChild(item);
        }
    }

    EzWebExt.removeClassName(this.wrapperElement, 'hidden');
    document.body.appendChild(this.wrapperElement);

    // TODO Hay que ajustar refPosition.y y refPosition.x para que el menú no
    // pueda salirse del área visible del gadget

    this.wrapperElement.style.top = refPosition.y + "px";
    this.wrapperElement.style.left = refPosition.x + "px";
    this.wrapperElement.style.display = 'block';
}

StyledElements.PopupMenuBase.prototype.hide = function() {
    var i;

    if (this.wrapperElement.parentNode == null) {
        return; // This Popup Menu is already hidden => nothing to do
    }

    EzWebExt.addClassName(this.wrapperElement, 'hidden');

    for (i = 0; i < this._submenus.length; i += 1) {
        this._submenus[i].hide();
    }

    for (i = 0; i < this._dynamicItems.length; i += 1) {
        item = this._dynamicItems[i];
        if (item instanceof StyledElements.SubMenuItem) {
            item.hide();
        }
        item.destroy();
    }
    this._dynamicItems = [];
    this._submenus = [];
    this.wrapperElement.innerHTML = '';
    if (this.wrapperElement.parentNode) {
        EzWebExt.removeFromParent(this.wrapperElement);
    }
}

StyledElements.PopupMenuBase.prototype._menuItemEnterCallback = function(menuItem) {
    this.events['itemOver'].dispatch(this, menuItem);
}

StyledElements.PopupMenuBase.prototype.destroy = function() {
    var i;
    for (i = 0; i < this._items.length; i += 1) {
        if (item instanceof StyledElements.MenuItem) {
            item.destroy();
        }
    }
    this._items = null;
    this._menuItemCallback = null;
}

/**
 *
 */
StyledElements.PopupMenu = function() {
    StyledElements.PopupMenuBase.call(this);

    this._disableCallback = EzWebExt.bind(function(event) {
        event.stopPropagation();
        event.preventDefault();
        this.hide();
    }, this);

    this._disableLayer = document.createElement('div');
    this._disableLayer.className = 'disable-layer';
    EzWebExt.addEventListener(this._disableLayer, "click", this._disableCallback, false);
    EzWebExt.addEventListener(this._disableLayer, "contextmenu", this._disableCallback, false);
}
StyledElements.PopupMenu.prototype = new StyledElements.PopupMenuBase({extending: true});

StyledElements.PopupMenu.prototype.show = function(refPosition) {
    document.body.appendChild(this._disableLayer);

    StyledElements.PopupMenuBase.prototype.show.call(this, refPosition);
}

StyledElements.PopupMenu.prototype.hide = function() {
    StyledElements.PopupMenuBase.prototype.hide.call(this);

    document.body.removeChild(this._disableLayer);
}

StyledElements.PopupMenu.prototype.setContext = function(context) {
    this._context = context;
}

StyledElements.PopupMenu.prototype._menuItemCallback = function(menuItem) {
    this.hide();
    menuItem.run(this._context);
}

StyledElements.PopupMenu.prototype.destroy = function() {
    StyledElements.PopupMenuBase.prototype.destroy.call(this);

    EzWebExt.removeEventListener(this._disableLayer, "click", this._disableCallback, false);
    EzWebExt.removeEventListener(this._disableLayer, "contextmenu", this._disableCallback, false);
    this._disableCallback = null;
}

/**
 *
 */
StyledElements.SubMenuItem = function(text, handler) {
    StyledElements.PopupMenuBase.call(this);

    this.menuItem = new StyledElements.MenuItem(text, handler);
}
StyledElements.SubMenuItem.prototype = new StyledElements.PopupMenuBase({extending: true});

StyledElements.SubMenuItem.prototype._getContext = function() {
    if (this.parentMenu instanceof StyledElements.SubMenuItem) {
        return this.parentMenu._getContext();
    } else {
        return this.parentMenu._context;
    }
}

StyledElements.SubMenuItem.prototype._menuItemCallback = function(menuItem) {
    var currentMenu = this;
    while (currentMenu.parentMenu) {
        currentMenu = currentMenu.parentMenu;
    }
    currentMenu.hide();
    menuItem.run(currentMenu._context);
}

StyledElements.SubMenuItem.prototype._setParentPopupMenu = function(popupMenu) {
    this.parentMenu = popupMenu;

    this.parentMenu.addEventListener('itemOver', EzWebExt.bind(function(popupMenu, item) {
        var position;

        if (item === this.menuItem) {
            position = EzWebExt.getRelativePosition(this.menuItem.wrapperElement, document.body);
            position.x += this.menuItem.wrapperElement.offsetWidth;
            this.show(position);
        } else {
            this.hide();
        }
    }, this));
}

StyledElements.SubMenuItem.prototype._getMenuItem = function() {
    return this.menuItem;
}

StyledElements.SubMenuItem.prototype.addEventListener = function(eventId, handler) {
    switch (eventId) {
    case 'mouseover':
    case 'click':
        return this.menuItem.addEventListener(eventId, handler);
    default:
        return StyledElements.PopupMenuBase.prototype.addEventListener.call(this, eventId, handler);
    }
}

StyledElements.SubMenuItem.prototype.destroy = function() {
    if (this.menuItem) {
        this.menuItem.destroy();
    }
    this.menuItem = null;

    StyledElements.PopupMenuBase.prototype.destroy.call(this);
}

