(function (view) {

    "use strict";

    if (!('SVGElement' in view)) {
        return;
    }

    var svg_element = document.createElementNS("http://www.w3.org/2000/svg", "svg:path");
    if ('classList' in svg_element) {
        return;
    }

    var DOMEx = function (type, message) {
        this.name = type;
        this.code = DOMException[type];
        this.message = message;
    };
    DOMEx.prototype = Error.prototype;

    var checkTokenAndGetIndex = function checkTokenAndGetIndex(classList, token) {
        if (token === "") {
            throw new DOMEx("SYNTAX_ERR", "An invalid or illegal string was specified");
        }
        if (/\s/.test(token)) {
            throw new DOMEx("INVALID_CHARACTER_ERR", "String contains an invalid character");
        }
        return classList.indexOf(token);
    };

    var ClassList = function ClassList(elem) {
        var trimmedClasses = (elem.getAttribute("class") || "").trim(),
            classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
            i = 0;

        for (; i < classes.length; i++) {
            this.push(classes[i]);
        }

        this._updateClassName = function () {
            elem.setAttribute("class", this.toString());
        };
    };
    ClassList.prototype = [];

    ClassList.prototype.item = function item(i) {
        return this[i] || null;
    };

    ClassList.prototype.contains = function contains(token) {
        token += "";
        return checkTokenAndGetIndex(this, token) !== -1;
    };

    ClassList.prototype.add = function add() {
        var tokens = arguments,
            i = 0,
            l = tokens.length,
            token,
            updated = false;

        do {
            token = tokens[i] + "";
            if (checkTokenAndGetIndex(this, token) === -1) {
                this.push(token);
                updated = true;
            }
        } while (++i < l);

        if (updated) {
            this._updateClassName();
        }
    };

    ClassList.prototype.remove = function remove() {
        var tokens = arguments,
            i = 0,
            l = tokens.length,
            token,
            updated = false;

        do {
            token = tokens[i] + "";
            var index = checkTokenAndGetIndex(this, token);
            if (index !== -1) {
                this.splice(index, 1);
                updated = true;
            }
        } while (++i < l);

        if (updated) {
            this._updateClassName();
        }
    };

    ClassList.prototype.toggle = function toggle(token, force) {
        token += "";

        var result = this.contains(token),
            method = result ?
                force !== true && "remove"
            :
                force !== false && "add";

        if (method) {
            this[method](token);
        }

        return !result;
    };

    ClassList.prototype.toString = function toString() {
        return this.join(" ");
    };

    var classListGetter = function () {
        return new ClassList(this);
    };

    Object.defineProperty(view.SVGElement.prototype, "classList", {get: classListGetter});

})(window);
