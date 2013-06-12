/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*----------------------------------------------------------------------------------*
 *                         Computed Style                                           *
 *----------------------------------------------------------------------------------*/

(function (window) {

    "use strict";

    var _internalGetCurrentStyle, cssProperties = [];

    var useInternalComputedStyle = typeof window.getComputedStyle === "undefined";
    if (!useInternalComputedStyle) {
        // Detect partial native implementations
        try {
            var computedStyle, width;

            computedStyle = document.defaultView.getComputedStyle(document.documentElement, null);
            width = computedStyle.getPropertyCSSValue('width');
            width = width.getFloatValue(width.CSS_PX);
        } catch (e) {
            useInternalComputedStyle = true;
            cssProperties = computedStyle;

            var _nativeGetComputedStyle = document.defaultView.getComputedStyle;
            _internalGetCurrentStyle = function _internalGetCurrentStyle(element, property, ieProperty) {
                var computedStyle = _nativeGetComputedStyle.call(document.defaultView, element, null);
                return computedStyle.getPropertyValue(property);
            };
        }
    } else {
        _internalGetCurrentStyle = function _internalGetCurrentStyle(element, property, ieProperty) {
            var value = element.currentStyle[ieProperty];

            if (value === 'auto') {
                value = element.runtimeStyle[ieProperty];
            }

            return value;
        };
    }

    if (useInternalComputedStyle) {

        /**
          * Partial implementation of CSSPrimitiveValue.
          */
        var CSSPrimitiveValue = function CSSPrimitiveValue(element, property, ieProperty) {
            if (arguments.length === 0) {
                return;
            }

            this._element = element;
            this._property = property;
            this._ieProperty = ieProperty;

            this.cssText = _internalGetCurrentStyle(this._element,
                                                    this._property,
                                                    this._ieProperty);
        };
        CSSPrimitiveValue.CSS_PX = 1;
        var _ValueRegExp = new RegExp('(\\d+|\\d+.\\d+)(\\w+)');

        CSSPrimitiveValue.prototype.getFloatValue = function getFloatValue(unit) {
            var result;

            if (unit === CSSPrimitiveValue.CSS_PX) {
                if (this.cssText === "") {
                    return 0;
                }

                var parentNode = this._element.parentNode;
                var testElement = this._element.ownerDocument.createElement('div');
                testElement.style.visibility = "hidden";
                testElement.style.padding = "0";
                testElement.style.margin = "0";
                testElement.style.border = "0";

                var matching = /border-(top|right|bottom|left)-width/.exec(this._property);
                var side = matching !== null ? matching[1] : null;

                // Test if the css value has a basic value (px, em, ex)
                matching = _ValueRegExp.exec(this.cssText);
                if (matching != null) {
                    var value = matching[1];
                    var units = matching[2];
                    if (units == "px") {
                        // Value is already in pixels
                        return parseInt(value, 10);
                    } else {
                        testElement.style.height = this.cssText;
                    }
                } else if ((matching == null) && (side != null)) {
                    var property = 'border-' + side + '-style';
                    var ieProperty = ComputedCSSStyleDeclaration.prototype._getIEProperty(property);
                    var borderStyle = _internalGetCurrentStyle(this._element, property, ieProperty);
                    if (borderStyle === "none") {
                        return 0;
                    }

                    // border width accepts special values: medium, normal, ...
                    var extraElement = this._element.ownerDocument.createElement('div');
                    testElement.style.fontSize = "0";
                    testElement.style.lineHeight = "0";
                    extraElement.style.padding = "0";
                    extraElement.style.margin = "0";
                    extraElement.style.border = "0";
                    extraElement.style.width = "1px";
                    extraElement.style.borderTopWidth = this.cssText;
                    extraElement.style.borderTopStyle = borderStyle;
                    testElement.appendChild(extraElement);
                } else {
                    throw new Error();
                }

                parentNode.appendChild(testElement);

                if (testElement.offsetHeight != null) {
                    result = testElement.offsetHeight;
                } else {
                    throw new Error();
                }

                parentNode.removeChild(testElement);

                return result;
            } else {
                throw new Error();
            }
        };

        var _rgbaColorParser = new RegExp('rgba\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)');
        var _rgbColorParser = new RegExp('rgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)');
        var _hexColorParser = new RegExp('#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})', 'i');
        var hex2value = function hex2value(hex) {
            hex = hex.toUpperCase();
            return ("0123456789ABCDEF".indexOf(hex.substr(0, 1)) * 16) +
                    "0123456789ABCDEF".indexOf(hex.substr(1, 1));
        };

        /**
          *
          */
        CSSPrimitiveValue.prototype.getRGBColorValue = function getRGBColorValue() {
            switch (this._property) {
            case 'background-color':
            case 'color':
                var red, green, blue, alpha = '1';
                var matching = _rgbColorParser.exec(this.cssText);
                if (matching !== null) {
                    red = matching[1];
                    green = matching[2];
                    blue = matching[3];
                } else {
                    matching = _rgbaColorParser.exec(this.cssText);
                    if (matching !== null) {
                        red = matching[1];
                        green = matching[2];
                        blue = matching[3];
                        alpha = matching[4];
                    } else {
                        matching = _hexColorParser.exec(this.cssText);
                        if (matching === null) {
                            var parentNode = this._element.parentNode;
                            var testElement = this._element.ownerDocument.createElement('table');
                            testElement.setAttribute('bgcolor', this.cssText);
                            testElement.style.visibility = "hidden";
                            parentNode.appendChild(testElement);
                            var bgColor = testElement.bgColor;
                            matching = _hexColorParser.exec(bgColor);
                            if (matching === null) {
                                throw new Error('Error on getRGBColorValue');
                            }

                            parentNode.removeChild(testElement);
                        }

                        // Build the result
                        red = hex2value(matching[1]);
                        green = hex2value(matching[2]);
                        blue = hex2value(matching[3]);
                    }
                }

                return {
                    red: new CSSColorComponentValue(red),
                    green: new CSSColorComponentValue(green),
                    blue: new CSSColorComponentValue(blue),
                    alpha: new CSSColorComponentValue(alpha)
                };
            default:
                throw new Error();
            }
        };

        /**
          *
          */
        var CSSColorComponentValue = function CSSColorComponentValue(value) {
            this.cssText = "" + value;
        };
        CSSColorComponentValue.prototype = new CSSPrimitiveValue();

        CSSColorComponentValue.prototype.getFloatValue = function getFloatValue(unit) {
            return parseInt(this.cssText, 10);
        };

        /**
          * Partial implementation of ComputedCSSStyleDeclaration
          */
        var ComputedCSSStyleDeclaration = function ComputedCSSStyleDeclaration(element) {
            this._element = element;
        };

        if (Object.defineProperty) {
            var _defProp = function (object, property) {
                Object.defineProperty(object, property, {
                    get: function () { return this.getPropertyValue(property); },
                    enumerable: true,
                    configurable: false
                });
            };

            var i;
            for (i = 0; i < cssProperties.length; i += 1) {
                _defProp(ComputedCSSStyleDeclaration.prototype, cssProperties[i]);
            }
        }

        ComputedCSSStyleDeclaration.prototype._getIEProperty = function _getIEProperty(property) {
            if (property === 'float') {
                return "styleFloat";
            } else {
                return property.replace(/-\w/g, function (a) {return a.substr(1, 1).toUpperCase(); });
            }
        };

        ComputedCSSStyleDeclaration.prototype.getPropertyCSSValue = function getPropertyCSSValue(property) {
            return new CSSPrimitiveValue(this._element, property, this._getIEProperty(property));
        };

        ComputedCSSStyleDeclaration.prototype.getPropertyValue = function getPropertyValue(property) {
            return _internalGetCurrentStyle(this._element,
                                            property,
                                            this._getIEProperty(property));
        };

        /**
          * WARNING This is not a full implementation of the getComputedStyle, some
          * things will not work.
          *
          * @param element
          * @param context not used by this implementation
          */
        window.CSSPrimitiveValue = CSSPrimitiveValue;
        window.CSSColorComponentValue = CSSColorComponentValue;
        window.getComputedStyle = function getComputedStyle(element, context) {
            if (element == null) {
                throw new Error('Operation is not supported');
            }
            return new ComputedCSSStyleDeclaration(element);
        };

        if (window.document.defaultView === undefined) {
            window.document.defaultView = window;
        }
    }

})(window);
