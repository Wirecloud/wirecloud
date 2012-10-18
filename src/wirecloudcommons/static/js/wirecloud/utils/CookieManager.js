var CookieManager = new Object();

/**
 * Creates or updates a cookie.
 *
 * @param {String} name cookie name
 * @param {String | Object} value value for this cookie
 * @param {Number} days number of days this cookie will be valid
 */
CookieManager.createCookie = function(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    } else {
        var expires = "";
    }

    if (typeof value === 'object') {
        value = Object.toJSON(value);
    }

    document.cookie = name+"="+value+expires+"; path=/";
}

/**
 * Reads a cookie
 *
 * @param {String} name name of the cookie to read
 * @param {Boolean} json thread cookie data as json
 *
 * @return
 */
CookieManager.readCookie = function(name, json) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) {
			var value = c.substring(nameEQ.length,c.length);
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
}

/**
 * Erases a cookie.
 *
 * @param {String} name
 */
CookieManager.eraseCookie = function(name) {
	createCookie(name, "", -1);
}

/**
 * Renew a cookie if it already exists.
 */
CookieManager.renewCookie = function(name, days) {
	var cookieValue = this.readCookie(name);
	if (cookieValue !== null) {
		this.createCookie(name, cookieValue, days);
	}
}
