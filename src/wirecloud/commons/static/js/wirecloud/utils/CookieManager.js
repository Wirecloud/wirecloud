/*global Wirecloud*/

(function () {

    "use strict";

    var CookieManager = {};

    /**
     * Creates or updates a cookie.
     *
     * @param {String} name cookie name
     * @param {String | Object} value value for this cookie
     * @param {Number} days number of days this cookie will be valid
     */
    CookieManager.createCookie = function createCookie(name, value, days) {
        var date, expires = "";

        if (days) {
            date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        }

        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }

        document.cookie = name + "=" + value + expires + "; path=/";
    };

    /**
     * Reads a cookie
     *
     * @param {String} name name of the cookie to read
     * @param {Boolean} json thread cookie data as json
     *
     * @return
     */
    CookieManager.readCookie = function readCookie(name, json) {
        var nameEQ, ca, i, c, value;

        nameEQ = name + "=";
        ca = document.cookie.split(';');

        for (i = 0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                value = c.substring(nameEQ.length, c.length);
                if (json) {
                    try {
                        return value.evalJSON();
                    } catch (e) {
                        return null;
                    }
                } else {
                    return value;
                }
            }
        }
        return null;
    };

    /**
     * Erases a cookie.
     *
     * @param {String} name
     */
    CookieManager.eraseCookie = function eraseCookie(name) {
        this.createCookie(name, "", -1);
    };

    /**
     * Renew a cookie if it already exists.
     */
    CookieManager.renewCookie = function renewCookie(name, days) {
        var cookieValue = this.readCookie(name);
        if (cookieValue != null) {
            this.createCookie(name, cookieValue, days);
        }
    };

    if (!('utils' in Wirecloud)) {
        Wirecloud.utils = {};
    }
    Wirecloud.utils.CookieManager = CookieManager;
})();
