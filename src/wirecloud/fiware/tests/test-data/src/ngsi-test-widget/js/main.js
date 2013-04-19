/*jshint globalstrict:true */
/*global MashupPlatform*/

(function () {

    "use strict";

    var ngsi_available = false;

    if (typeof NGSI !== 'undefined' && NGSI.Connection != null) {
        try {
            var connection = new NGSI.Connection();

            ngsi_available = true;
        } catch (err) {}
    }

    setTimeout(function () {
        if (ngsi_available) {
            document.body.textContent = 'Success';
        } else {
            document.body.textContent = 'Failure';
        }
    }, 0);

})();
